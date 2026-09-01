import { describe, expect, it } from "vitest";
import {
  getGoogleSheetsConfig,
  googleSheetsPayloadForEvent,
  postGoogleSheetsPayload,
  syncGoogleSheetsEvents,
} from "./googleSheets";

describe("Google Sheets Apps Script mirror configuration", () => {
  it("requires both a web app URL and a shared secret before reporting configured", () => {
    expect(
      getGoogleSheetsConfig({
        GOOGLE_SHEETS_WEB_APP_URL:
          "https://script.google.com/macros/s/example/exec",
      })
    ).toMatchObject({ configured: false, enabled: false });
    expect(
      getGoogleSheetsConfig({
        GOOGLE_SHEETS_WEB_APP_URL:
          "https://script.google.com/macros/s/example/exec",
        GOOGLE_SHEETS_SYNC_SECRET: "secret",
        GOOGLE_SHEETS_SYNC_ENABLED: "true",
      })
    ).toMatchObject({ configured: true, enabled: true });
  });

  it("formats an append-only event payload without database credentials", () => {
    expect(
      googleSheetsPayloadForEvent({
        id: 7,
        entityType: "transaction",
        entityId: 42,
        eventType: "transaction.created",
        payload: { amountCents: -12000 },
        createdAt: new Date("2026-08-24T00:00:00Z"),
      })
    ).toMatchObject({
      eventId: 7,
      entityType: "transaction",
      entityId: 42,
      eventType: "transaction.created",
    });
  });

  it("formats confirmed parent updates for the Apps Script parent-update mapper", () => {
    expect(
      googleSheetsPayloadForEvent({
        id: 8,
        entityType: "member",
        entityId: 42,
        eventType: "parent_update.confirmed",
        payload: { memberId: "PBA-MBR-42", policyAccepted: true },
        createdAt: new Date("2026-08-24T00:00:00Z"),
      })
    ).toMatchObject({
      type: "parent_update",
      parentUpdate: {
        memberId: "PBA-MBR-42",
        policyAccepted: true,
        isNewRegistration: true,
      },
    });
  });

  it("formats new parent registrations for the structured member mapper", () => {
    expect(
      googleSheetsPayloadForEvent({
        id: 9,
        entityType: "member",
        entityId: 43,
        eventType: "parent_registration.confirmed",
        payload: { memberId: "PBA-MBR-43", policyAccepted: true },
        createdAt: new Date("2026-08-24T00:00:00Z"),
      })
    ).toMatchObject({
      type: "parent_update",
      parentUpdate: {
        memberId: "PBA-MBR-43",
        policyAccepted: true,
        isNewRegistration: true,
      },
    });
  });

  it("marks a pending event as synced after the Apps Script endpoint confirms delivery", async () => {
    const event = {
      id: 19,
      entityType: "transaction" as const,
      entityId: 3,
      eventType: "transaction.created",
      payload: { amountCents: -5000 },
      state: "pending" as const,
      attempts: 0,
      lastError: null,
      createdAt: new Date("2026-08-24T00:00:00Z"),
      syncedAt: null,
    };
    const updates: Array<Record<string, unknown>> = [];
    const db = {
      select: () => ({
        from: () => ({ orderBy: () => ({ limit: async () => [event] }) }),
      }),
      update: () => ({
        set: (values: Record<string, unknown>) => ({
          where: async () => {
            updates.push(values);
          },
        }),
      }),
    };
    const result = await syncGoogleSheetsEvents(
      db,
      {
        configured: true,
        enabled: true,
        webAppUrl: "https://example.invalid/exec",
        sharedSecret: "test-secret",
      },
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    expect(result).toMatchObject({ processed: 1, synced: 1, failed: 0 });
    expect(updates[0]).toMatchObject({ state: "synced", lastError: null });
  });

  it("retries a transient Apps Script 404 before accepting the delivery confirmation", async () => {
    let attempts = 0;
    const response = await postGoogleSheetsPayload(
      {
        configured: true,
        enabled: true,
        webAppUrl: "https://example.invalid/exec",
        sharedSecret: "test-secret",
      },
      { type: "member_snapshot", members: [] },
      async () => {
        attempts += 1;
        return attempts === 1
          ? new Response(
              JSON.stringify({ ok: false, error: "Temporarily unavailable" }),
              { status: 404 }
            )
          : new Response(JSON.stringify({ ok: true }), { status: 200 });
      },
      0
    );
    expect(response).toMatchObject({ ok: true });
    expect(attempts).toBe(2);
  });
});
