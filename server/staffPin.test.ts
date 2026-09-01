import { describe, expect, it } from "vitest";
import {
  canRemoveStaffAccount,
  hashSessionToken,
  hashStaffPin,
  normalizeStaffName,
  verifyStaffPin,
} from "./staffPin";

describe("staff PIN safeguards", () => {
  it("normalizes staff names consistently", () => {
    expect(normalizeStaffName("  Hamdi   El  Shimi ")).toBe("hamdi el shimi");
  });

  it("verifies only the matching four-digit PIN against a salted hash", async () => {
    const hash = await hashStaffPin("1811");
    expect(hash).not.toContain("1811");
    await expect(verifyStaffPin("1811", hash)).resolves.toBe(true);
    await expect(verifyStaffPin("1234", hash)).resolves.toBe(false);
  });

  it("hashes session tokens deterministically without storing raw values", () => {
    expect(hashSessionToken("example-session-token")).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionToken("example-session-token")).toBe(
      hashSessionToken("example-session-token")
    );
  });

  it("does not permit removal of the last active System Admin", () => {
    expect(
      canRemoveStaffAccount({
        targetRole: "system_admin",
        activeSystemAdminCount: 1,
      })
    ).toBe(false);
    expect(
      canRemoveStaffAccount({
        targetRole: "system_admin",
        activeSystemAdminCount: 2,
      })
    ).toBe(true);
    expect(
      canRemoveStaffAccount({
        targetRole: "reception",
        activeSystemAdminCount: 1,
      })
    ).toBe(true);
  });
});
