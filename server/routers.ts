import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "./_core/trpc.js";
import { getDb } from "./db.js";
import { members, families, cards } from "../drizzle/schema.js";
import { eq, desc, ilike, or } from "drizzle-orm";
import { generateAndSendVirtualCard } from "./email.js";

export const appRouter = router({
  listParents: publicProcedure
    .input(z.object({ query: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      let query = db.select({
        id: members.id,
        childName: members.fullName,
        phone: families.guardianPhone,
        policy: members.policyStatus,
        token: members.memberCode,
        membershipTier: members.membershipTier,
      }).from(members).innerJoin(families, eq(members.familyId, families.id));

      if (input.query) {
        query = query.where(or(
          ilike(members.fullName, `%${input.query}%`),
          ilike(families.guardianPhone, `%${input.query}%`)
        ));
      }

      return await query.limit(100);
    }),

  getParent: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [member] = await db.select({
        id: members.id,
        childName: members.fullName,
        birthDate: members.birthDate,
        guardianName: families.guardianName,
        guardianEmail: families.guardianEmail,
        phone: families.guardianPhone,
        medicalCond: members.medicalCondition,
        previousExperience: members.previousExperience,
        isLoyaltyMember: members.membershipTier,
        policyConfirmed: members.policyStatus,
      })
      .from(members)
      .innerJoin(families, eq(members.familyId, families.id))
      .where(eq(members.memberCode, input.token))
      .limit(1);

      if (!member) throw new TRPCError({ code: "NOT_FOUND" });
      return member;
    }),

  submitForm: publicProcedure
    .input(z.object({
      token: z.string(),
      childName: z.string(),
      birthDate: z.string(),
      guardianName: z.string(),
      guardianEmail: z.string(),
      phone: z.string(),
      medicalCond: z.string().optional(),
      previousExperience: z.string().optional(),
      isLoyaltyMember: z.boolean(),
      policyConfirmed: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      const [member] = await db.select().from(members).where(eq(members.memberCode, input.token)).limit(1);
      if (!member) throw new TRPCError({ code: "NOT_FOUND" });

      await db.update(families).set({
        guardianName: input.guardianName,
        guardianEmail: input.guardianEmail,
        guardianPhone: input.phone,
      }).where(eq(families.id, member.familyId));

      await db.update(members).set({
        fullName: input.childName,
        birthDate: input.birthDate,
        medicalCondition: input.medicalCond,
        previousExperience: input.previousExperience,
        membershipTier: input.isLoyaltyMember ? 'loyalty_member' : 'member',
        policyStatus: input.policyConfirmed ? 'accepted' : 'not_accepted',
      }).where(eq(members.id, member.id));

      const emailSent = await generateAndSendVirtualCard(
        input.childName,
        member.memberCode,
        input.isLoyaltyMember ? 'loyalty_member' : 'member',
        input.guardianEmail
      );

      if (!emailSent) {
        console.error(`[submitForm] Registration saved for ${input.childName}, but virtual card email failed to send.`);
      }

      return { success: true, emailSent };
    }),
});

export type AppRouter = typeof appRouter;
