export type OfferRule = {
  listPriceCents: number;
  ruleType: "member_price" | "percentage_off" | "fixed_amount_off";
  memberPriceCents?: number | null;
  discountValue?: number | null;
  requiresEligibleMembership: boolean;
};

export function memberCanUseOffer(
  membershipTier: "member" | "loyalty_member",
  membershipStatus: "eligible" | "not_enrolled" | "inactive",
  cardStatus: "not_issued" | "active" | "suspended" | "expired",
  offer: Pick<OfferRule, "requiresEligibleMembership">
) {
  return (
    !offer.requiresEligibleMembership ||
    (membershipTier === "loyalty_member" &&
      membershipStatus === "eligible" &&
      cardStatus === "active")
  );
}

export function calculateOfferPriceCents(offer: OfferRule, eligible: boolean) {
  if (!eligible) return offer.listPriceCents;

  if (offer.ruleType === "member_price") {
    return Math.max(0, offer.memberPriceCents ?? offer.listPriceCents);
  }

  if (offer.ruleType === "percentage_off") {
    const percentage = Math.min(100, Math.max(0, offer.discountValue ?? 0));
    return Math.round(offer.listPriceCents * (1 - percentage / 100));
  }

  return Math.max(0, offer.listPriceCents - (offer.discountValue ?? 0));
}

export function calculateBalanceAfter(
  currentBalanceCents: number,
  transactionDeltaCents: number
) {
  const next = currentBalanceCents + transactionDeltaCents;
  if (next < 0) throw new Error("Insufficient wallet balance");
  return next;
}

export function formatEgyptianPounds(cents: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
