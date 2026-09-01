import { describe, expect, it } from "vitest";
import {
  calculateBalanceAfter,
  calculateOfferPriceCents,
  memberCanUseOffer,
} from "./loyalty";

describe("loyalty pricing rules", () => {
  it("returns the configured member price for eligible members", () => {
    expect(
      calculateOfferPriceCents(
        {
          listPriceCents: 20000,
          ruleType: "member_price",
          memberPriceCents: 15000,
          requiresEligibleMembership: true,
        },
        true
      )
    ).toBe(15000);
  });

  it("does not grant loyalty pricing to a regular Member or an inactive Loyalty card", () => {
    const offer = { requiresEligibleMembership: true };
    expect(memberCanUseOffer("member", "eligible", "active", offer)).toBe(
      false
    );
    expect(
      memberCanUseOffer("loyalty_member", "eligible", "not_issued", offer)
    ).toBe(false);
    expect(
      memberCanUseOffer("loyalty_member", "not_enrolled", "active", offer)
    ).toBe(false);
    expect(
      memberCanUseOffer("loyalty_member", "eligible", "active", offer)
    ).toBe(true);
    expect(
      calculateOfferPriceCents(
        {
          listPriceCents: 20000,
          ruleType: "percentage_off",
          discountValue: 20,
          requiresEligibleMembership: true,
        },
        false
      )
    ).toBe(20000);
  });

  it("never produces a negative fixed-discount price", () => {
    expect(
      calculateOfferPriceCents(
        {
          listPriceCents: 1000,
          ruleType: "fixed_amount_off",
          discountValue: 1500,
          requiresEligibleMembership: false,
        },
        true
      )
    ).toBe(0);
  });

  it("rejects a wallet deduction that would create a negative balance", () => {
    expect(() => calculateBalanceAfter(5000, -5001)).toThrow(
      "Insufficient wallet balance"
    );
    expect(calculateBalanceAfter(5000, -5000)).toBe(0);
  });
});
