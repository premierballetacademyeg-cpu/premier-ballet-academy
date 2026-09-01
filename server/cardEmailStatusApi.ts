import { getDb } from "./db.js";
import { cardEmailDeliveries } from "../drizzle/schema.js";
import { desc } from "drizzle-orm";

export async function handleCardEmailStatusesRequest() {
  const db = await getDb();
  if (!db) {
    return new Response(
      JSON.stringify({ error: "Database unavailable" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const statuses = await db
      .select({
        memberId: cardEmailDeliveries.memberId,
        status: cardEmailDeliveries.status,
        sentAt: cardEmailDeliveries.sentAt,
        recipientEmail: cardEmailDeliveries.recipientEmail,
        attemptCount: cardEmailDeliveries.attemptCount,
        lastError: cardEmailDeliveries.lastError,
      })
      .from(cardEmailDeliveries)
      .orderBy(desc(cardEmailDeliveries.updatedAt));

    return new Response(
      JSON.stringify(statuses),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching card email statuses:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch card email statuses" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
