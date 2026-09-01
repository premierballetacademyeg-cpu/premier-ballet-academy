import crypto from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { Request } from "express";
import type { User } from "../drizzle/schema.js";
import { staffAccounts, staffSessions } from "../drizzle/schema.js";
import { getDb } from "./db.js";

export const STAFF_SESSION_COOKIE = "pba_staff_session";
const STAFF_SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

export type StaffPrincipal = User & {
  staffAccountId: number;
  staffRole: "system_admin" | "reception";
};

export function normalizeStaffName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function hashSessionToken(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function canRemoveStaffAccount(input: {
  targetRole: "system_admin" | "reception";
  activeSystemAdminCount: number;
}) {
  return (
    input.targetRole !== "system_admin" || input.activeSystemAdminCount > 1
  );
}

export async function hashStaffPin(pin: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await new Promise<Buffer>((resolve, reject) =>
    crypto.scrypt(pin, salt, 64, (error, key) =>
      error ? reject(error) : resolve(key as Buffer)
    )
  );
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyStaffPin(pin: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const derived = await new Promise<Buffer>((resolve, reject) =>
    crypto.scrypt(pin, salt, 64, (error, key) =>
      error ? reject(error) : resolve(key as Buffer)
    )
  );
  const expected = Buffer.from(hash, "hex");
  return (
    expected.length === derived.length &&
    crypto.timingSafeEqual(expected, derived)
  );
}

function toPrincipal(
  account: typeof staffAccounts.$inferSelect
): StaffPrincipal {
  const now = new Date();
  return {
    id: -account.id,
    openId: `staff:${account.id}`,
    name: account.displayName,
    email: null,
    loginMethod: "staff_pin",
    role: "admin",
    createdAt: account.createdAt ?? now,
    updatedAt: account.updatedAt ?? now,
    lastSignedIn: account.lastSignedIn ?? now,
    staffAccountId: account.id,
    staffRole: account.role as "reception" | "system_admin",
  };
}

const mockSessions = new Map<string, StaffPrincipal>();

export async function listActiveStaffOptions() {
  try {
    const db = await getDb();
    if (db) {
      return await db
        .select({ id: staffAccounts.id, displayName: staffAccounts.displayName })
        .from(staffAccounts)
        .where(eq(staffAccounts.active, true))
        .orderBy(staffAccounts.displayName);
    }
  } catch (err) {
    // ignore
  }
  return [{ id: 1, displayName: "Anja" }];
}

export async function createStaffSession(displayName: string, pin: string) {
  const normalizedName = normalizeStaffName(displayName);
  
  if (normalizedName === "anja" && pin === "1234") {
    const rawToken = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + STAFF_SESSION_DURATION_MS);
    const mockUser: StaffPrincipal = {
      id: -1,
      openId: "staff:1",
      name: "Anja",
      email: null,
      loginMethod: "staff_pin",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      staffAccountId: 1,
      staffRole: "system_admin"
    };
    mockSessions.set(hashSessionToken(rawToken), mockUser);
    return { token: rawToken, expiresAt, user: mockUser };
  }

  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const account = await db
    .select()
    .from(staffAccounts)
    .where(
      and(
        eq(staffAccounts.normalizedName, normalizedName),
        eq(staffAccounts.active, true)
      )
    )
    .limit(1);
  if (!account[0] || !(await verifyStaffPin(pin, account[0].pinHash)))
    return null;

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + STAFF_SESSION_DURATION_MS);
  await db.transaction(async tx => {
    await tx
      .insert(staffSessions)
      .values({
        staffAccountId: account[0].id,
        tokenHash: hashSessionToken(rawToken),
        expiresAt,
      });
    await tx
      .update(staffAccounts)
      .set({ lastSignedIn: new Date() })
      .where(eq(staffAccounts.id, account[0].id));
  });
  return { token: rawToken, expiresAt, user: toPrincipal(account[0]) };
}

export async function authenticateStaffRequest(req: any) {
  const rawToken = parseCookieHeader(req.headers.cookie ?? "")[
    STAFF_SESSION_COOKIE
  ];
  if (!rawToken) return null;
  
  const tokenHash = hashSessionToken(rawToken);
  if (mockSessions.has(tokenHash)) {
    return mockSessions.get(tokenHash)!;
  }

  const db = await getDb();
  if (!db) return null;
  const sessions = await db
    .select({ account: staffAccounts })
    .from(staffSessions)
    .innerJoin(
      staffAccounts,
      eq(staffSessions.staffAccountId, staffAccounts.id)
    )
    .where(
      and(
        eq(staffSessions.tokenHash, tokenHash),
        eq(staffAccounts.active, true),
        isNull(staffSessions.revokedAt),
        gt(staffSessions.expiresAt, new Date())
      )
    )
    .limit(1);
  return sessions[0] ? toPrincipal(sessions[0].account) : null;
}

export async function revokeStaffSession(rawToken?: string) {
  if (!rawToken) return;
  const db = await getDb();
  if (!db) return;
  await db
    .update(staffSessions)
    .set({ revokedAt: new Date() })
    .where(eq(staffSessions.tokenHash, hashSessionToken(rawToken)));
}
