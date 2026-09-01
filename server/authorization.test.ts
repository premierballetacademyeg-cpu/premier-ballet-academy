import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("administrator access", () => {
  it("denies a standard authenticated user access to central member data", async () => {
    const ctx: TrpcContext = {
      user: {
        id: 44,
        openId: "non-admin",
        name: "Standard user",
        email: "user@example.com",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    await expect(caller.dashboard.summary()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
