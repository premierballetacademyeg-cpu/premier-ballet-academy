import { describe, expect, it } from "vitest";

describe("Google Sheets Apps Script live handshake", () => {
  it("does not reject the configured shared secret before any event is mirrored", async () => {
    const url = process.env.GOOGLE_SHEETS_WEB_APP_URL;
    const secret = process.env.GOOGLE_SHEETS_SYNC_SECRET;
    expect(url).toBeTruthy();
    expect(secret).toBeTruthy();

    const response = await fetch(url!, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret, event: {} }),
    });
    const payload = (await response.json()) as { ok?: boolean; error?: string };
    expect(response.ok).toBe(true);
    expect(payload.error).not.toBe("Unauthorized");
  }, 20_000);
});
