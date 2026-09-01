import { describe, expect, it, vi } from "vitest";
import { createNotification } from "./db";

function preferenceDb(preference: { enabled: boolean } | undefined) {
  const insert = vi.fn(() => ({ values: vi.fn(async () => undefined) }));
  return {
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => (preference ? [preference] : []) }),
      }),
    }),
    insert,
  };
}

describe("in-app notification preferences", () => {
  it("does not store an automatic notification when its category is turned off", async () => {
    const db = preferenceDb({ enabled: false });
    const created = await createNotification(db, {
      category: "pos_transaction",
      title: "عملية",
      body: "تمت عملية",
    });
    expect(created).toBe(false);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("stores a notification when no preference exists or the category is enabled", async () => {
    const db = preferenceDb(undefined);
    const created = await createNotification(db, {
      category: "member_registered",
      title: "عضو جديد",
      body: "تم التسجيل",
      actionPath: "/members",
    });
    expect(created).toBe(true);
    expect(db.insert).toHaveBeenCalledOnce();
  });
});
