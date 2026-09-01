import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  adminEmailAuthorizations,
  classGroups,
  duplicateReviews,
  enrollments,
  externalSyncEvents,
  families,
  cards,
  cardEmailDeliveries,
  members,
  notificationPreferences,
  notifications,
  offers,
  parentUpdateRequests,
  paymentRequests,
  policyAcceptances,
  staffAccounts,
  staffAuditLogs,
  type InsertUser,
  users,
} from "../drizzle/schema.js";
import { ENV } from "./_core/env.js";

let _db: ReturnType<typeof drizzle> | null = null;

export function resolveUserRole(input: {
  requestedRole?: "user" | "admin";
  isOwner: boolean;
  isAuthorizedAdminEmail: boolean;
}): "user" | "admin" {
  return input.isOwner || input.isAuthorizedAdminEmail || input.requestedRole === "admin" ? "admin" : "user";
}

export async function getDb() {
  if (!_db && (process.env.DATABASE_URL || process.env.POSTGRES_URL)) {
    try {
      const pool = new Pool({ connectionString: (process.env.DATABASE_URL || process.env.POSTGRES_URL) });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}




export async function getDashboardSummary() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [memberCount] = await db.select({ count: sql<number>`count(*)` }).from(members);
  const [familyCount] = await db.select({ count: sql<number>`count(*)` }).from(families);
  const [eligibleCount] = await db.select({ count: sql<number>`count(*)` }).from(members).where(eq(members.membershipStatus, "eligible"));
  const [duplicateCount] = await db.select({ count: sql<number>`count(*)` }).from(duplicateReviews).where(eq(duplicateReviews.status, "open"));
  const [queueCount] = await db.select({ count: sql<number>`count(*)` }).from(externalSyncEvents).where(eq(externalSyncEvents.state, "pending"));
  const [wallet] = await db.select({ total: sql<number>`coalesce(0, 0)` }).from(members);
  const recent = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amountCents: transactions.amountCents,
      createdAt: transactions.createdAt,
      memberName: members.fullName,
      memberCode: members.memberCode,
    })
    .from(transactions)
    .innerJoin(members, eq(transactions.memberId, members.id))
    .orderBy(desc(transactions.createdAt))
    .limit(6);
  return {
    members: Number(memberCount?.count ?? 0),
    families: Number(familyCount?.count ?? 0),
    eligibleMembers: Number(eligibleCount?.count ?? 0),
    duplicateReviews: Number(duplicateCount?.count ?? 0),
    syncQueue: Number(queueCount?.count ?? 0),
    walletTotalCents: Number(wallet?.total ?? 0),
    recent,
  };
}

export async function getClassOptions() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(classGroups).orderBy(classGroups.levelName);
}

export async function listMembers(search?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const query = search?.trim();
  const where = query
    ? or(
        like(members.fullName, `%${query}%`),
        like(members.memberCode, `%${query}%`),
        like(families.guardianPhone, `%${query}%`),
        like(families.guardianEmail, `%${query}%`),
        like(cards.cardId, `%${query}%`),
        like(cards.qrPayload, `%${query}%`),
      )
    : undefined;
  return db
    .select({
      id: members.id,
      memberCode: members.memberCode,
      fullName: members.fullName,
      birthDate: members.birthDate,
      birthDateRaw: members.birthDateRaw,
      membershipStatus: members.membershipStatus,
      cardStatus: members.cardStatus,

      familyCode: families.familyCode,
      guardianName: families.guardianName,
      guardianPhone: families.guardianPhone,
      guardianEmail: families.guardianEmail,
      cardId: cards.cardId,
      qrPayload: cards.qrPayload,
      cardRecordStatus: cards.status,
    })
    .from(members)
    .innerJoin(families, eq(members.familyId, families.id))
    .leftJoin(cards, eq(members.id, cards.memberId))
    .where(where)
    .orderBy(members.fullName)
    .limit(100);
}

export type MemberReportFilters = {
  registrationFrom?: Date;
  registrationTo?: Date;
  membershipTier?: "member" | "loyalty_member";
  branch?: string;
};

function buildMemberReportWhere(filters: MemberReportFilters) {
  const conditions = [];
  if (filters.registrationFrom) conditions.push(gte(members.createdAt, filters.registrationFrom));
  if (filters.registrationTo) conditions.push(lte(members.createdAt, filters.registrationTo));
  if (filters.membershipTier) conditions.push(eq(members.membershipTier, filters.membershipTier));
  if (filters.branch) conditions.push(eq(members.branch, filters.branch));
  return conditions.length ? and(...conditions) : undefined;
}

export async function getMemberReport(filters: MemberReportFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const records = await db
    .select({
      memberId: members.id,
      memberCode: members.memberCode,
      studentName: members.fullName,
      parentName: families.guardianName,
      parentEmail: families.guardianEmail,
      parentPhone: families.guardianPhone,
      branch: members.branch,
      membershipTier: members.membershipTier,
      registrationDate: members.createdAt,
    })
    .from(members)
    .innerJoin(families, eq(members.familyId, families.id))
    .where(buildMemberReportWhere(filters))
    .orderBy(desc(members.createdAt), members.fullName)
    .limit(1000);
  const totalMembers = records.length;
  const loyaltyMembers = records.filter(record => record.membershipTier === "loyalty_member").length;
  const branches = Array.from(new Set(records.map(record => record.branch))).sort();
  return {
    records,
    totalMembers,
    loyaltyMembers,
    memberMembers: totalMembers - loyaltyMembers,
    branchSummary: branches.map(branch => ({ branch, count: records.filter(record => record.branch === branch).length })),
  };
}

export async function listMemberBranches() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.selectDistinct({ branch: members.branch }).from(members).orderBy(members.branch);
  return result.map(row => row.branch).filter(Boolean);
}

export async function listStaffAuditLogs() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db
    .select({
      id: staffAuditLogs.id,
      action: staffAuditLogs.action,
      entityType: staffAuditLogs.entityType,
      entityId: staffAuditLogs.entityId,
      details: staffAuditLogs.details,
      createdAt: staffAuditLogs.createdAt,
      staffName: staffAccounts.displayName,
      staffRole: staffAccounts.role,
    })
    .from(staffAuditLogs)
    .innerJoin(staffAccounts, eq(staffAuditLogs.staffAccountId, staffAccounts.id))
    .orderBy(desc(staffAuditLogs.createdAt))
    .limit(100);
}

export async function getMemberProfile(memberId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const profile = await db
    .select({
      id: members.id,
      memberCode: members.memberCode,
      fullName: members.fullName,
      birthDate: members.birthDate,
      birthDateRaw: members.birthDateRaw,
      membershipStatus: members.membershipStatus,
      cardStatus: members.cardStatus,

      legacyLastPayment: members.legacyLastPayment,
      familyId: families.id,
      familyCode: families.familyCode,
      guardianName: families.guardianName,
      guardianPhone: families.guardianPhone,
      guardianEmail: families.guardianEmail,
      notes: families.notes,
      cardId: cards.cardId,
      qrPayload: cards.qrPayload,
      cardRecordStatus: cards.status,
    })
    .from(members)
    .innerJoin(families, eq(members.familyId, families.id))
    .leftJoin(cards, eq(members.id, cards.memberId))
    .where(eq(members.id, memberId))
    .limit(1);
  if (!profile[0]) return undefined;
  const memberEnrollments = await db
    .select({
      id: enrollments.id,
      enrollmentStatus: enrollments.enrollmentStatus,
      levelName: classGroups.levelName,
      instructorName: classGroups.instructorName,
      scheduleText: classGroups.scheduleText,
    })
    .from(enrollments)
    .innerJoin(classGroups, eq(enrollments.classGroupId, classGroups.id))
    .where(eq(enrollments.memberId, memberId));
  const history: any[] = [];

  const latestUpdate = await db
    .select()
    .from(parentUpdateRequests)
    .where(eq(parentUpdateRequests.memberId, memberId))
    .orderBy(desc(parentUpdateRequests.issuedAt))
    .limit(1);
  const policy = latestUpdate[0]
    ? await db.select().from(policyAcceptances).where(eq(policyAcceptances.parentUpdateRequestId, latestUpdate[0].id)).limit(1)
    : [];
  return { ...profile[0], enrollments: memberEnrollments, transactions: history, parentUpdate: latestUpdate[0] ?? null, policyAcceptance: policy[0] ?? null };
}

export async function getOpenDuplicateReviews() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db
    .select({
      id: duplicateReviews.id,
      reason: duplicateReviews.reason,
      confidence: duplicateReviews.confidence,
      memberName: members.fullName,
      memberCode: members.memberCode,
      candidateMemberId: duplicateReviews.candidateMemberId,
    })
    .from(duplicateReviews)
    .innerJoin(members, eq(duplicateReviews.memberId, members.id))
    .where(eq(duplicateReviews.status, "open"))
    .orderBy(desc(duplicateReviews.confidence));
}

export async function getCardEmailDeliveryStatus(memberId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      status: cardEmailDeliveries.status,
      recipientEmail: cardEmailDeliveries.recipientEmail,
      sentAt: cardEmailDeliveries.sentAt,
      lastAttemptAt: cardEmailDeliveries.lastAttemptAt,
      attemptCount: cardEmailDeliveries.attemptCount,
      lastError: cardEmailDeliveries.lastError,
    })
    .from(cardEmailDeliveries)
    .where(eq(cardEmailDeliveries.memberId, memberId))
    .limit(1);
  return result[0] ?? null;
}

export async function listOffers(activeOnly = false) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(offers).where(activeOnly ? eq(offers.active, true) : undefined).orderBy(desc(offers.updatedAt));
}

export async function getSyncEvents() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(externalSyncEvents).orderBy(desc(externalSyncEvents.createdAt)).limit(25);
}

export type NotificationCategory = "member_registered" | "duplicate_review" | "pos_transaction" | "sync_success" | "sync_failure";

export const notificationCategoryDefaults: Array<{ category: NotificationCategory; label: string }> = [
  { category: "member_registered", label: "تسجيل عضو أو عائلة" },
  { category: "duplicate_review", label: "مراجعة سجل متشابه" },
  { category: "pos_transaction", label: "عمليات نقطة البيع والمحفظة" },
  { category: "sync_success", label: "نجاح مزامنة Google Sheets" },
  { category: "sync_failure", label: "تعثر مزامنة Google Sheets" },
];

export async function createNotification(
  db: any,
  input: { category: NotificationCategory; title: string; body: string; actionPath?: string | null },
) {
  const preference = await db.select().from(notificationPreferences).where(eq(notificationPreferences.category, input.category)).limit(1);
  if (preference[0]?.enabled === false) return false;
  await db.insert(notifications).values({ ...input, actionPath: input.actionPath ?? null });
  return true;
}

export async function listNotifications() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(100);
}

export async function listNotificationPreferences() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const stored = await db.select().from(notificationPreferences);
  return notificationCategoryDefaults.map(item => ({ ...item, enabled: stored.find(row => row.category === item.category)?.enabled ?? true }));
}

export async function getUnreadNotificationCount() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(eq(notifications.isRead, false));
  return Number(result[0]?.count ?? 0);
}


export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }

  await db.insert(users).values(values).onConflictDoUpdate({
    target: users.openId,
    set: updateSet
  });
}
