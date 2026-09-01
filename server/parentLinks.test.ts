import { describe, expect, it } from "vitest";
import {
  compactParentUpdatePath,
  compactRegistrationPath,
  guardianFirstName,
  parentUpdateTokenFromLocation,
} from "../client/src/lib/parentLinks";

describe("parent link helpers", () => {
  it("uses safe guardian first names instead of title or surname particles", () => {
    expect(guardianFirstName("Mrs. Salma El Shimi")).toBe("Salma");
    expect(guardianFirstName("EL Nour")).toBe("Nour");
    expect(guardianFirstName("EL")).toBe("Parent");
  });

  it("uses compact links while preserving secure-token values and old query links", () => {
    expect(compactRegistrationPath).toBe("/join");
    expect(compactParentUpdatePath("private_token-123")).toBe(
      "/p/private_token-123"
    );
    expect(
      parentUpdateTokenFromLocation("?token=legacy", "/update-profile")
    ).toBe("legacy");
    expect(parentUpdateTokenFromLocation("", "/p/private_token-123")).toBe(
      "private_token-123"
    );
  });
});
