import { describe, expect, it } from "vitest";
import { duplicateReviewRequired, idempotentReplay } from "./guards";

describe("registration and POS guards", () => {
  it("requires deliberate confirmation before saving when a duplicate candidate exists", () => {
    expect(duplicateReviewRequired(1, false)).toBe(true);
    expect(duplicateReviewRequired(1, true)).toBe(false);
    expect(duplicateReviewRequired(0, false)).toBe(false);
  });

  it("returns the original POS transaction for a repeated idempotency key", () => {
    const original = { id: 12, transactionCode: "PBA-TXN-ORIGINAL" };
    expect(idempotentReplay(original)).toEqual({
      transaction: original,
      replayed: true,
    });
    expect(idempotentReplay(undefined)).toBeUndefined();
  });
});
