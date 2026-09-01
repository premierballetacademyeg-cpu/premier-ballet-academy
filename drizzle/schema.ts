import { boolean, index, json, pgTable, text, timestamp, uniqueIndex, varchar, serial, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 255 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const adminEmailAuthorizations = pgTable(
  "adminEmailAuthorizations",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    normalizedEmail: varchar("normalizedEmail", { length: 320 }).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("admin_email_authorizations_email_unique").on(
      table.normalizedEmail
    ),
  ]
);

export const staffAccounts = pgTable(
  "staffAccounts",
  {
    id: serial("id").primaryKey(),
    displayName: varchar("displayName", { length: 128 }).notNull(),
    normalizedName: varchar("normalizedName", { length: 128 }).notNull(),
    pinHash: varchar("pinHash", { length: 255 }).notNull(),
    role: varchar("role", { length: 255 })
      .default("reception")
      .notNull(),
    active: boolean("active").default(true).notNull(),
    lastSignedIn: timestamp("lastSignedIn"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("staff_accounts_name_unique").on(table.normalizedName)]
);

export const staffSessions = pgTable(
  "staffSessions",
  {
    id: serial("id").primaryKey(),
    staffAccountId: integer("staffAccountId").notNull(),
    tokenHash: varchar("tokenHash", { length: 128 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    revokedAt: timestamp("revokedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("staff_sessions_token_unique").on(table.tokenHash),
    index("staff_sessions_account_expiry_idx").on(
      table.staffAccountId,
      table.expiresAt
    ),
  ]
);

export const staffAuditLogs = pgTable(
  "staffAuditLogs",
  {
    id: serial("id").primaryKey(),
    staffAccountId: integer("staffAccountId").notNull(),
    action: varchar("action", { length: 96 }).notNull(),
    entityType: varchar("entityType", { length: 64 }).notNull(),
    entityId: integer("entityId"),
    details: json("details").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("staff_audit_staff_created_idx").on(
      table.staffAccountId,
      table.createdAt
    ),
    index("staff_audit_entity_created_idx").on(
      table.entityType,
      table.entityId,
      table.createdAt
    ),
  ]
);

export const families = pgTable(
  "families",
  {
    id: serial("id").primaryKey(),
    familyCode: varchar("familyCode", { length: 32 }).notNull(),
    guardianName: varchar("guardianName", { length: 191 }),
    guardianPhone: varchar("guardianPhone", { length: 32 }),
    guardianEmail: varchar("guardianEmail", { length: 320 }),
    normalizedPhone: varchar("normalizedPhone", { length: 32 }),
    normalizedEmail: varchar("normalizedEmail", { length: 320 }),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("families_code_unique").on(table.familyCode),
    index("families_phone_idx").on(table.normalizedPhone),
    index("families_email_idx").on(table.normalizedEmail),
  ]
);

export const members = pgTable(
  "members",
  {
    id: serial("id").primaryKey(),
    familyId: integer("familyId").notNull(),
    memberCode: varchar("memberCode", { length: 32 }).notNull(),
    fullName: varchar("fullName", { length: 191 }).notNull(),
    normalizedName: varchar("normalizedName", { length: 191 }).notNull(),
    birthDate: varchar("birthDate", { length: 32 }),
    birthDateRaw: varchar("birthDateRaw", { length: 64 }),
    emergencyPhone: varchar("emergencyPhone", { length: 32 }),
    regularSchool: varchar("regularSchool", { length: 191 }),
    branch: varchar("branch", { length: 128 }).default("Unassigned").notNull(),
    medicalCondition: varchar("medicalCondition", { length: 255 })
      .default("no")
      .notNull(),
    medicalDetails: text("medicalDetails"),
    membershipTier: varchar("membershipTier", { length: 255 })
      .default("member")
      .notNull(),
    membershipStatus: varchar("membershipStatus", { length: 255 })
      .default("not_enrolled")
      .notNull(),
    paymentStatus: varchar("paymentStatus", { length: 255 })
      .default("inactive")
      .notNull(),
    policyStatus: varchar("policyStatus", { length: 255 })
      .default("not_accepted")
      .notNull(),
    renewalStatus: varchar("renewalStatus", { length: 255 })
      .default("expired")
      .notNull(),
    cardStatus: varchar("cardStatus", { length: 255 })
      .default("not_issued")
      .notNull(),
    active: boolean("active").default(true).notNull(),
    legacyLastPayment: varchar("legacyLastPayment", { length: 128 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("members_code_unique").on(table.memberCode),
    index("members_name_idx").on(table.normalizedName),
    index("members_family_idx").on(table.familyId),
    index("members_membership_idx").on(table.membershipStatus),
    index("members_branch_created_idx").on(table.branch, table.createdAt),
  ]
);

export const classGroups = pgTable(
  "classGroups",
  {
    id: serial("id").primaryKey(),
    classCode: varchar("classCode", { length: 64 }).notNull(),
    levelName: varchar("levelName", { length: 191 }).notNull(),
    instructorName: varchar("instructorName", { length: 191 }),
    scheduleText: varchar("scheduleText", { length: 255 }),
    sourceFile: varchar("sourceFile", { length: 191 }),
    sourceSheet: varchar("sourceSheet", { length: 191 }),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("class_groups_code_unique").on(table.classCode)]
);

export const enrollments = pgTable(
  "enrollments",
  {
    id: serial("id").primaryKey(),
    memberId: integer("memberId").notNull(),
    classGroupId: integer("classGroupId").notNull(),
    enrollmentStatus: varchar("enrollmentStatus", { length: 255 })
      .default("active")
      .notNull(),
    sourceRow: integer("sourceRow"),
    paymentSnapshot: json("paymentSnapshot"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("enrollment_member_class_unique").on(
      table.memberId,
      table.classGroupId
    ),
    index("enrollments_member_idx").on(table.memberId),
    index("enrollments_class_idx").on(table.classGroupId),
  ]
);

export const cards = pgTable(
  "cards",
  {
    id: serial("id").primaryKey(),
    memberId: integer("memberId").notNull(),
    cardId: varchar("cardId", { length: 64 }).notNull(),
    qrPayload: varchar("qrPayload", { length: 255 }).notNull(),
    status: varchar("status", { length: 255 })
      .default("not_issued")
      .notNull(),
    issuedAt: timestamp("issuedAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt"),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("cards_member_unique").on(table.memberId),
    uniqueIndex("cards_card_unique").on(table.cardId),
    uniqueIndex("cards_qr_unique").on(table.qrPayload),
  ]
);

export const cardEmailDeliveries = pgTable(
  "cardEmailDeliveries",
  {
    id: serial("id").primaryKey(),
    memberId: integer("memberId").notNull(),
    recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
    status: varchar("status", { length: 255 })
      .default("pending")
      .notNull(), // pending, sent, failed, bounced
    attemptCount: integer("attemptCount").default(0).notNull(),
    lastAttemptAt: timestamp("lastAttemptAt"),
    lastError: text("lastError"),
    sentAt: timestamp("sentAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("card_email_member_unique").on(table.memberId),
    index("card_email_status_idx").on(table.status),
    index("card_email_member_status_idx").on(table.memberId, table.status),
  ]
);

export const offers = pgTable(
  "offers",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 191 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 255 })
      .default("service")
      .notNull(),
    ruleType: varchar("ruleType", { length: 255 }).notNull(),
    listPriceCents: integer("listPriceCents").notNull(),
    memberPriceCents: integer("memberPriceCents"),
    discountValue: integer("discountValue"),
    requiresEligibleMembership: boolean("requiresEligibleMembership")
      .default(true)
      .notNull(),
    active: boolean("active").default(true).notNull(),
    startsAt: timestamp("startsAt"),
    endsAt: timestamp("endsAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [index("offers_active_idx").on(table.active)]
);

export const paymentRequests = pgTable(
  "paymentRequests",
  {
    id: serial("id").primaryKey(),
    memberId: integer("memberId").notNull(),
    paymentType: varchar("paymentType", { length: 255 }).notNull(),
    amountCents: integer("amountCents").notNull(),
    status: varchar("status", { length: 255 })
      .default("pending_receipt")
      .notNull(),
    instapayUrl: varchar("instapayUrl", { length: 512 }).notNull(),
    note: varchar("note", { length: 255 }),
    reviewedByStaffId: integer("reviewedByStaffId"),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    index("payment_requests_member_created_idx").on(
      table.memberId,
      table.createdAt
    ),
    index("payment_requests_status_created_idx").on(
      table.status,
      table.createdAt
    ),
  ]
);

export const duplicateReviews = pgTable(
  "duplicateReviews",
  {
    id: serial("id").primaryKey(),
    memberId: integer("memberId").notNull(),
    candidateMemberId: integer("candidateMemberId").notNull(),
    reason: varchar("reason", { length: 255 }).notNull(),
    confidence: integer("confidence").notNull(),
    status: varchar("status", { length: 255 })
      .default("open")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
  },
  table => [
    uniqueIndex("duplicate_review_pair_unique").on(
      table.memberId,
      table.candidateMemberId
    ),
    index("duplicate_review_status_idx").on(table.status),
  ]
);

export const externalSyncEvents = pgTable(
  "externalSyncEvents",
  {
    id: serial("id").primaryKey(),
    entityType: varchar("entityType", { length: 255 }).notNull(),
    entityId: integer("entityId").notNull(),
    eventType: varchar("eventType", { length: 64 }).notNull(),
    payload: json("payload").notNull(),
    state: varchar("state", { length: 255 })
      .default("pending")
      .notNull(),
    attempts: integer("attempts").default(0).notNull(),
    lastError: text("lastError"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    syncedAt: timestamp("syncedAt"),
  },
  table => [index("external_sync_state_idx").on(table.state, table.createdAt)]
);

export const parentUpdateRequests = pgTable(
  "parentUpdateRequests",
  {
    id: serial("id").primaryKey(),
    memberId: integer("memberId").notNull(),
    token: varchar("token", { length: 128 }).notNull(),
    status: varchar("status", { length: 255 })
      .default("pending")
      .notNull(),
    issuedAt: timestamp("issuedAt").defaultNow().notNull(),
    lastSentAt: timestamp("lastSentAt"),
    submittedAt: timestamp("submittedAt"),
    loyaltyBenefitsAcceptedAt: timestamp("loyaltyBenefitsAcceptedAt"),
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("parent_update_token_unique").on(table.token),
    index("parent_update_member_status_idx").on(table.memberId, table.status),
  ]
);

export const policyAcceptances = pgTable(
  "policyAcceptances",
  {
    id: serial("id").primaryKey(),
    memberId: integer("memberId").notNull(),
    parentUpdateRequestId: integer("parentUpdateRequestId").notNull(),
    policyVersion: varchar("policyVersion", { length: 64 }).notNull(),
    acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("policy_acceptance_request_unique").on(
      table.parentUpdateRequestId
    ),
    index("policy_acceptance_member_idx").on(table.memberId, table.acceptedAt),
  ]
);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    category: varchar("category", { length: 255 }).notNull(),
    title: varchar("title", { length: 191 }).notNull(),
    body: text("body").notNull(),
    actionPath: varchar("actionPath", { length: 255 }),
    isRead: boolean("isRead").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("notifications_read_created_idx").on(table.isRead, table.createdAt),
  ]
);

export const notificationPreferences = pgTable(
  "notificationPreferences",
  {
    id: serial("id").primaryKey(),
    category: varchar("category", { length: 255 }).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("notification_preferences_category_unique").on(table.category),
  ]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
