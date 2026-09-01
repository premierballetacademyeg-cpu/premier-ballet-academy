import { eq, sql } from "drizzle-orm";
import { externalSyncEvents } from "../drizzle/schema";
import { getDb } from "./db";

export type GoogleSheetsConfig = {
  configured: boolean;
  enabled: boolean;
  webAppUrl?: string;
  sharedSecret?: string;
};

type SyncEvent = {
  id: number;
  entityType: string;
  entityId: number;
  eventType: string;
  payload: unknown;
  state: string;
  createdAt: Date;
};

export function getGoogleSheetsConfig(env = process.env): GoogleSheetsConfig {
  const webAppUrl = env.GOOGLE_SHEETS_WEB_APP_URL;
  const sharedSecret = env.GOOGLE_SHEETS_SYNC_SECRET;
  return {
    configured: Boolean(webAppUrl && sharedSecret),
    enabled: env.GOOGLE_SHEETS_SYNC_ENABLED === "true",
    webAppUrl,
    sharedSecret,
  };
}

export function googleSheetsPayloadForEvent(event: {
  id: number;
  entityType: string;
  entityId: number;
  eventType: string;
  payload: unknown;
  createdAt: Date;
}) {
  if (
    event.eventType === "parent_update.confirmed" ||
    event.eventType === "parent_registration.confirmed"
  ) {
    return {
      type: "parent_update",
      // The central application validates each secure parent token before emitting
      // this event. The Sheet is a one-way mirror, so it must update a known row or
      // create a missing mirror row without attempting to validate an app-only token.
      parentUpdate: {
        ...(event.payload as Record<string, unknown>),
        isNewRegistration: true,
      },
    };
  }
  return {
    eventId: event.id,
    entityType: event.entityType,
    entityId: event.entityId,
    eventType: event.eventType,
    occurredAt: event.createdAt.toISOString(),
    payload: event.payload,
  };
}

export async function postGoogleSheetsPayload(
  config: GoogleSheetsConfig,
  payload: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
  retryDelayMs = 500
) {
  if (
    !config.configured ||
    !config.enabled ||
    !config.webAppUrl ||
    !config.sharedSecret
  ) {
    throw new Error("Google Sheets sync is not configured or enabled");
  }
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetchImpl(config.webAppUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret: config.sharedSecret, ...payload }),
        signal: AbortSignal.timeout(15_000),
      });
      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        [key: string]: unknown;
      } | null;
      if (response.ok && result?.ok) return result;
      const error = new Error(
        result?.error || `Google Apps Script returned ${response.status}`
      ) as Error & { retryable?: boolean };
      error.retryable = response.status === 404 || response.status >= 500;
      throw error;
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("Google Sheets delivery failed");
      const retryable =
        (lastError as Error & { retryable?: boolean }).retryable ||
        lastError.name === "AbortError" ||
        lastError.name === "TimeoutError";
      if (!retryable || attempt === 2) break;
      await new Promise(resolve =>
        setTimeout(resolve, retryDelayMs * (attempt + 1))
      );
    }
  }
  throw lastError ?? new Error("Google Sheets delivery failed");
}

export async function syncGoogleSheetsEvents(
  db: any,
  config: GoogleSheetsConfig,
  fetchImpl: typeof fetch = fetch,
  batchSize = 25
) {
  if (
    !config.configured ||
    !config.enabled ||
    !config.webAppUrl ||
    !config.sharedSecret
  ) {
    return {
      configured: config.configured,
      enabled: config.enabled,
      processed: 0,
      synced: 0,
      failed: 0,
    };
  }
  const candidates = (
    (await db
      .select()
      .from(externalSyncEvents)
      .orderBy(externalSyncEvents.createdAt)
      .limit(batchSize * 3)) as SyncEvent[]
  )
    .filter(event => event.state !== "synced")
    .slice(0, batchSize);
  let synced = 0;
  let failed = 0;
  for (const event of candidates) {
    try {
      const eventPayload = googleSheetsPayloadForEvent(event);
      await postGoogleSheetsPayload(
        config,
        eventPayload.type === "parent_update"
          ? eventPayload
          : { event: eventPayload },
        fetchImpl
      );
      await db
        .update(externalSyncEvents)
        .set({
          state: "synced",
          syncedAt: new Date(),
          lastError: null,
          attempts: sql`${externalSyncEvents.attempts} + 1`,
        })
        .where(eq(externalSyncEvents.id, event.id));
      synced += 1;
    } catch (error) {
      await db
        .update(externalSyncEvents)
        .set({
          state: "failed",
          lastError:
            error instanceof Error
              ? error.message
              : "Unknown Google Sheets error",
          attempts: sql`${externalSyncEvents.attempts} + 1`,
        })
        .where(eq(externalSyncEvents.id, event.id));
      failed += 1;
    }
  }
  return {
    configured: true,
    enabled: true,
    processed: candidates.length,
    synced,
    failed,
  };
}

export async function runGoogleSheetsSync(batchSize = 25) {
  const config = getGoogleSheetsConfig();
  if (!config.configured || !config.enabled) {
    return {
      configured: config.configured,
      enabled: config.enabled,
      processed: 0,
      synced: 0,
      failed: 0,
    };
  }
  const db = await getDb();
  if (!db) throw new Error("Google Sheets sync is unavailable");
  return syncGoogleSheetsEvents(db, config, fetch, batchSize);
}
