CREATE TABLE "cardEmailDeliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"memberId" integer NOT NULL,
	"recipientEmail" varchar(320) NOT NULL,
	"status" varchar(255) DEFAULT 'pending' NOT NULL,
	"attemptCount" integer DEFAULT 0 NOT NULL,
	"lastAttemptAt" timestamp,
	"lastError" text,
	"sentAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "card_email_member_unique" ON "cardEmailDeliveries" ("memberId");--> statement-breakpoint
CREATE INDEX "card_email_status_idx" ON "cardEmailDeliveries" ("status");--> statement-breakpoint
CREATE INDEX "card_email_member_status_idx" ON "cardEmailDeliveries" ("memberId","status");
