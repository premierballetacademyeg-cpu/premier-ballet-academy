import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  getMemberReport: vi.fn(),
  listMemberBranches: vi.fn(),
}));

vi.mock("./db", () => ({
  createNotification: vi.fn(async () => true),
  getDb: dbMocks.getDb,
  getClassOptions: vi.fn(),
  getDashboardSummary: vi.fn(),
  getMemberReport: dbMocks.getMemberReport,
  getMemberProfile: vi.fn(),
  getOpenDuplicateReviews: vi.fn(),
  getSyncEvents: vi.fn(),
  listMembers: vi.fn(),
  listMemberBranches: dbMocks.listMemberBranches,
  listOffers: vi.fn(),
}));

import { appRouter } from "./routers";

function adminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-test",
      name: "Admin Test",
      email: "admin@example.com",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function receptionContext(): TrpcContext {
  return {
    user: {
      id: -2,
      openId: "staff:2",
      name: "Reception Test",
      email: null,
      loginMethod: "staff_pin",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      staffAccountId: 2,
      staffRole: "reception",
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("registration and POS router safeguards", () => {
  it("rejects a public registration when mandatory medical status or policy consent is missing", async () => {
    const caller = appRouter.createCaller(adminContext());
    const baseInput = {
      childName: "Policy Test Student",
      birthDate: "2020-01-01",
      guardianName: "Policy Test Guardian",
      guardianEmail: "policy-test@example.com",
      guardianPhone: "01012345678",
      emergencyPhone: "01087654321",
      regularSchool: "Premier Test School",
      branch: "Maadi",
      medicalDetails: null,
      membershipTier: "member" as const,
      parentIdScreenshotDataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
    };

    await expect(
      caller.parentRegistration.submit({
        ...baseInput,
        medicalCondition: "" as any,
        policyAccepted: true,
      } as any)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.parentRegistration.submit({
        ...baseInput,
        medicalCondition: "no",
        policyAccepted: false,
      } as any)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.parentRegistration.submit({
        ...baseInput,
        branch: "Other" as any,
        medicalCondition: "no",
        policyAccepted: true,
      } as any)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("reports a duplicate guardian phone without exposing member information", async () => {
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({ limit: async () => [{ familyId: 44 }] }),
        }),
      }),
    };
    dbMocks.getDb.mockResolvedValueOnce(db);
    const caller = appRouter.createCaller(adminContext());
    await expect(
      caller.parentRegistration.checkGuardianPhone({
        guardianPhone: "01000000000",
      })
    ).resolves.toEqual({ inUse: true });
  });

  it("rejects an existing-parent Loyalty Member upgrade without benefits acknowledgement", async () => {
    let selectCalls = 0;
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () =>
              selectCalls++ === 0
                ? [{ id: 71, memberId: 4, status: "pending" }]
                : [{ id: 4, membershipTier: "member" }],
          }),
        }),
      }),
    };
    dbMocks.getDb.mockResolvedValueOnce(db);

    const caller = appRouter.createCaller(adminContext());
    await expect(
      caller.parentUpdate.submit({
        token: "a".repeat(20),
        childName: "Upgrade Test Student",
        birthDate: "2020-01-01",
        guardianName: "Upgrade Test Guardian",
        guardianEmail: "upgrade-test@example.com",
        guardianPhone: "01012345678",
        emergencyPhone: "01087654321",
        regularSchool: "Premier Test School",
        branch: "Maadi",
        medicalCondition: "no",
        medicalDetails: null,
        membershipTier: "loyalty_member",
        loyaltyBenefitsAccepted: false,
        policyAccepted: true,
        parentIdScreenshotDataUrl: `data:image/png;base64,${"A".repeat(64)}`,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("returns a conflict from registration.create when a duplicate candidate exists without confirmation", async () => {
    const db = {
      select: () => ({
        from: () => ({
          innerJoin: () => ({
            where: () => ({ limit: async () => [{ id: 92 }] }),
          }),
        }),
      }),
    };
    dbMocks.getDb.mockResolvedValueOnce(db);

    const caller = appRouter.createCaller(adminContext());
    await expect(
      caller.registration.create({
        fullName: "Existing Student",
        birthDateRaw: "01/01/2020",
        guardianName: "Guardian",
        guardianPhone: "01000000000",
        guardianEmail: "guardian@example.com",
        branch: "Maadi",
        membershipStatus: "not_enrolled",
        classGroupIds: [1],
        confirmedNotDuplicate: false,
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("returns the original transaction from pos.commit when the idempotency key already exists", async () => {
    const existingTransaction = {
      id: 54,
      transactionCode: "PBA-TXN-EXISTING",
      memberId: 7,
      offerId: null,
      type: "top_up" as const,
      amountCents: 12000,
      balanceAfterCents: 27000,
      idempotencyKey: "idempotency-test-key",
      source: "pos" as const,
      note: "Wallet top-up",
      createdAt: new Date(),
    };
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({ limit: async () => [existingTransaction] }),
        }),
      }),
    };
    dbMocks.getDb.mockResolvedValueOnce(db);

    const caller = appRouter.createCaller(adminContext());
    await expect(
      caller.pos.commit({
        memberId: 7,
        type: "top_up",
        amountCents: 12000,
        idempotencyKey: "idempotency-test-key",
        source: "pos",
      })
    ).resolves.toEqual({ transaction: existingTransaction, replayed: true });
  });

  it("issues a secure Pending update link for an existing parent record", async () => {
    const inserted: Array<Record<string, unknown>> = [];
    let selectCount = 0;
    const tx = {
      select: () => {
        const call = selectCount++;
        return {
          from: () => ({
            where: () => ({
              limit: async () => (call === 0 ? [{ id: 44 }] : []),
            }),
          }),
        };
      },
      insert: () => ({
        values: async (values: Record<string, unknown>) => {
          inserted.push(values);
        },
      }),
    };
    const db = {
      transaction: async (work: (inner: typeof tx) => Promise<void>) =>
        work(tx),
    };
    dbMocks.getDb.mockResolvedValueOnce(db);

    const caller = appRouter.createCaller(adminContext());
    const result = await caller.parentUpdate.issueLinks({ memberIds: [44] });

    expect(result.issued).toHaveLength(1);
    expect(result.issued[0]).toMatchObject({ memberId: 44 });
    expect(result.issued[0]?.token).toHaveLength(48);
    expect(inserted[0]).toMatchObject({ memberId: 44, status: "pending" });
  });

  it("rejects staff removal from a reception PIN session", async () => {
    const caller = appRouter.createCaller(receptionContext());
    await expect(caller.staff.remove({ staffId: 9 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("removes a reception account and its sessions for a System Admin", async () => {
    let selectCalls = 0;
    const deleted: string[] = [];
    const tx = {
      delete: (table: { [key: string]: unknown }) => ({
        where: async () => {
          deleted.push(String(table));
        },
      }),
    };
    const db = {
      select: () => ({
        from: () => {
          const call = selectCalls++;
          return {
            where: () =>
              call === 0
                ? {
                    limit: async () => [
                      { id: 9, role: "reception", active: true },
                    ],
                  }
                : [{ count: 1 }],
          };
        },
      }),
      transaction: async (work: (inner: typeof tx) => Promise<void>) =>
        work(tx),
    };
    dbMocks.getDb.mockResolvedValueOnce(db);
    const caller = appRouter.createCaller(adminContext());
    await expect(caller.staff.remove({ staffId: 9 })).resolves.toEqual({
      success: true,
    });
    expect(deleted).toHaveLength(2);
  });

  it("protects the last active System Admin from removal", async () => {
    let selectCalls = 0;
    const db = {
      select: () => ({
        from: () => {
          const call = selectCalls++;
          return {
            where: () =>
              call === 0
                ? {
                    limit: async () => [
                      { id: 1, role: "system_admin", active: true },
                    ],
                  }
                : [{ count: 1 }],
          };
        },
      }),
    };
    dbMocks.getDb.mockResolvedValueOnce(db);
    const caller = appRouter.createCaller(adminContext());
    await expect(caller.staff.remove({ staffId: 1 })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("passes date, membership, and branch filters into the protected member report", async () => {
    dbMocks.getMemberReport.mockResolvedValueOnce({
      totalMembers: 1,
      loyaltyMembers: 1,
      memberMembers: 0,
      branchSummary: [{ branch: "Maadi", count: 1 }],
      records: [],
    });
    const caller = appRouter.createCaller(adminContext());
    await expect(
      caller.reports.memberReport({
        registrationFrom: "2026-09-01",
        registrationTo: "2026-09-30",
        membershipTier: "loyalty_member",
        branch: "Maadi",
      })
    ).resolves.toMatchObject({ totalMembers: 1, loyaltyMembers: 1 });
    expect(dbMocks.getMemberReport).toHaveBeenCalledWith(
      expect.objectContaining({
        membershipTier: "loyalty_member",
        branch: "Maadi",
      })
    );
  });

  it("rejects Loyalty Card issuance for a regular Member record", async () => {
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [{ id: 7, membershipTier: "member" }],
          }),
        }),
      }),
    };
    dbMocks.getDb.mockResolvedValueOnce(db);

    const caller = appRouter.createCaller(adminContext());
    await expect(caller.loyalty.issue({ memberId: 7 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects a regular Member at the POS when an offer requires Loyalty Member benefits", async () => {
    let transactionSelects = 0;
    const tx = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () =>
              transactionSelects++ === 0
                ? [
                    {
                      id: 8,
                      membershipTier: "member",
                      membershipStatus: "eligible",
                      cardStatus: "active",
                      walletBalanceCents: 5000,
                      fullName: "Regular Member",
                    },
                  ]
                : [
                    {
                      id: 3,
                      active: true,
                      requiresEligibleMembership: true,
                      listPriceCents: 1200,
                      ruleType: "member_price",
                      memberPriceCents: 800,
                    },
                  ],
          }),
        }),
      }),
    };
    const db = {
      select: () => ({
        from: () => ({ where: () => ({ limit: async () => [] }) }),
      }),
      transaction: async (work: (inner: typeof tx) => Promise<unknown>) =>
        work(tx),
    };
    dbMocks.getDb.mockResolvedValueOnce(db);

    const caller = appRouter.createCaller(adminContext());
    await expect(
      caller.pos.commit({
        memberId: 8,
        type: "purchase",
        offerId: 3,
        idempotencyKey: "regular-member-offer-denied",
        source: "pos",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("applies the protected offer path for an eligible Loyalty Member with an active card", async () => {
    let transactionSelects = 0;
    const tx = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () =>
              transactionSelects++ === 0
                ? [
                    {
                      id: 9,
                      membershipTier: "loyalty_member",
                      membershipStatus: "eligible",
                      cardStatus: "active",
                      walletBalanceCents: 5000,
                      fullName: "Loyal Member",
                    },
                  ]
                : [
                    {
                      id: 4,
                      active: true,
                      requiresEligibleMembership: true,
                      listPriceCents: 1200,
                      ruleType: "member_price",
                      memberPriceCents: 800,
                      name: "Workshop",
                    },
                  ],
          }),
        }),
      }),
      update: () => ({ set: () => ({ where: async () => true }) }),
      insert: () => ({ values: async () => [{ insertId: 91 }] }),
    };
    const db = {
      select: () => ({
        from: () => ({ where: () => ({ limit: async () => [] }) }),
      }),
      transaction: async (work: (inner: typeof tx) => Promise<unknown>) =>
        work(tx),
    };
    dbMocks.getDb.mockResolvedValueOnce(db);

    const caller = appRouter.createCaller(adminContext());
    await expect(
      caller.pos.commit({
        memberId: 9,
        type: "purchase",
        offerId: 4,
        idempotencyKey: "loyal-member-offer-success",
        source: "pos",
      })
    ).resolves.toMatchObject({
      replayed: false,
      transaction: { amountCents: -800, balanceAfterCents: 4200 },
    });
  });

  it("creates a pending Instapay payment request with the official payment link", async () => {
    const tx = { insert: () => ({ values: async () => [{ insertId: 55 }] }) };
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [{ id: 11, memberCode: "PBA-MBR-TEST" }],
          }),
        }),
      }),
      transaction: async (work: (inner: typeof tx) => Promise<unknown>) =>
        work(tx),
    };
    dbMocks.getDb.mockResolvedValueOnce(db);

    const caller = appRouter.createCaller(adminContext());
    await expect(
      caller.payment.create({
        memberId: 11,
        paymentType: "membership",
        amountCents: 250000,
        note: "Loyalty Member annual fee",
      })
    ).resolves.toMatchObject({
      paymentId: 55,
      instapayUrl: "https://ipn.eg/S/anja87/instapay/0ia8Zv",
    });
  });

  it("activates registration payments and records tuition approvals without activating other payment types", async () => {
    const review = async (
      paymentType: "registration" | "tuition" | "other"
    ) => {
      let selectCalls = 0;
      const updates: Array<Record<string, unknown>> = [];
      const tx = {
        update: () => ({
          set: (values: Record<string, unknown>) => ({
            where: async () => {
              updates.push(values);
            },
          }),
        }),
        insert: () => ({ values: async () => [{ insertId: 1 }] }),
      };
      const db = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () =>
                selectCalls++ === 0
                  ? [
                      {
                        id: 77,
                        memberId: 12,
                        paymentType,
                        status: "pending_receipt",
                      },
                    ]
                  : [
                      {
                        id: 12,
                        memberCode: "PBA-MBR-12",
                        membershipTier: "member",
                      },
                    ],
            }),
          }),
        }),
        transaction: async (work: (inner: typeof tx) => Promise<unknown>) =>
          work(tx),
      };
      dbMocks.getDb.mockResolvedValueOnce(db);
      const caller = appRouter.createCaller(adminContext());
      await expect(
        caller.payment.review({ paymentId: 77, status: "approved" })
      ).resolves.toEqual({ success: true });
      return updates;
    };

    const registrationUpdates = await review("registration");
    expect(registrationUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ membershipStatus: "eligible" }),
      ])
    );

    const tuitionUpdates = await review("tuition");
    expect(tuitionUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          legacyLastPayment: expect.stringContaining(
            "Instapay tuition request #77 approved"
          ),
        }),
      ])
    );

    const otherUpdates = await review("other");
    expect(otherUpdates).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ membershipStatus: "eligible" }),
      ])
    );
    expect(otherUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          legacyLastPayment: expect.stringContaining(
            "Instapay other request #77 approved"
          ),
        }),
      ])
    );
  });

  it("approves a Loyalty Member membership payment and activates a new Loyalty Card", async () => {
    let dbSelectCalls = 0;
    const updates: Array<Record<string, unknown>> = [];
    const inserts: Array<Record<string, unknown>> = [];
    const tx = {
      update: () => ({
        set: (values: Record<string, unknown>) => ({
          where: async () => {
            updates.push(values);
          },
        }),
      }),
      select: () => ({
        from: () => ({ where: () => ({ limit: async () => [] }) }),
      }),
      insert: () => ({
        values: async (values: Record<string, unknown>) => {
          inserts.push(values);
          return [{ insertId: 1 }];
        },
      }),
    };
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () =>
              dbSelectCalls++ === 0
                ? [
                    {
                      id: 88,
                      memberId: 13,
                      paymentType: "membership",
                      status: "pending_receipt",
                    },
                  ]
                : [
                    {
                      id: 13,
                      memberCode: "PBA-MBR-13",
                      membershipTier: "loyalty_member",
                    },
                  ],
          }),
        }),
      }),
      transaction: async (work: (inner: typeof tx) => Promise<unknown>) =>
        work(tx),
    };
    dbMocks.getDb.mockResolvedValueOnce(db);
    const caller = appRouter.createCaller(adminContext());
    await expect(
      caller.payment.review({ paymentId: 88, status: "approved" })
    ).resolves.toEqual({ success: true });
    expect(updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ membershipStatus: "eligible" }),
        expect.objectContaining({ cardStatus: "active" }),
      ])
    );
    expect(inserts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          memberId: 13,
          cardId: expect.stringMatching(/^PBA-CARD-/),
        }),
      ])
    );
  });
});
