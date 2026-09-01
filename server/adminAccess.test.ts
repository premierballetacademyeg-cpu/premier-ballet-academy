import { describe, expect, it } from "vitest";
import { resolveUserRole } from "./db";

describe("administrator email authorization", () => {
  it("promotes an email authorized by the allowlist on sign-in", () => {
    expect(
      resolveUserRole({
        requestedRole: "user",
        isOwner: false,
        isAuthorizedAdminEmail: true,
      })
    ).toBe("admin");
  });

  it("keeps a non-owner email outside the allowlist as a regular user", () => {
    expect(
      resolveUserRole({
        isOwner: false,
        isAuthorizedAdminEmail: false,
      })
    ).toBe("user");
  });
});
