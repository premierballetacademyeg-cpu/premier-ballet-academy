CREATE TABLE `classGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classCode` varchar(64) NOT NULL,
	`levelName` varchar(191) NOT NULL,
	`instructorName` varchar(191),
	`scheduleText` varchar(255),
	`sourceFile` varchar(191),
	`sourceSheet` varchar(191),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classGroups_id` PRIMARY KEY(`id`),
	CONSTRAINT `class_groups_code_unique` UNIQUE(`classCode`)
);
--> statement-breakpoint
CREATE TABLE `duplicateReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`candidateMemberId` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`confidence` int NOT NULL,
	`status` enum('open','confirmed_duplicate','not_duplicate','merged') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `duplicateReviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `duplicate_review_pair_unique` UNIQUE(`memberId`,`candidateMemberId`)
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`classGroupId` int NOT NULL,
	`enrollmentStatus` enum('active','historic','review') NOT NULL DEFAULT 'active',
	`sourceRow` int,
	`paymentSnapshot` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`),
	CONSTRAINT `enrollment_member_class_unique` UNIQUE(`memberId`,`classGroupId`)
);
--> statement-breakpoint
CREATE TABLE `externalSyncEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('member','family','card','offer','transaction') NOT NULL,
	`entityId` int NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`payload` json NOT NULL,
	`state` enum('pending','synced','failed','disabled') NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`syncedAt` timestamp,
	CONSTRAINT `externalSyncEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `families` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyCode` varchar(32) NOT NULL,
	`guardianName` varchar(191),
	`guardianPhone` varchar(32),
	`guardianEmail` varchar(320),
	`normalizedPhone` varchar(32),
	`normalizedEmail` varchar(320),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `families_id` PRIMARY KEY(`id`),
	CONSTRAINT `families_code_unique` UNIQUE(`familyCode`)
);
--> statement-breakpoint
CREATE TABLE `loyaltyCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`cardId` varchar(64) NOT NULL,
	`qrPayload` varchar(255) NOT NULL,
	`status` enum('active','suspended','expired') NOT NULL DEFAULT 'active',
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loyaltyCards_id` PRIMARY KEY(`id`),
	CONSTRAINT `loyalty_cards_member_unique` UNIQUE(`memberId`),
	CONSTRAINT `loyalty_cards_card_unique` UNIQUE(`cardId`),
	CONSTRAINT `loyalty_cards_qr_unique` UNIQUE(`qrPayload`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`memberCode` varchar(32) NOT NULL,
	`fullName` varchar(191) NOT NULL,
	`normalizedName` varchar(191) NOT NULL,
	`birthDate` varchar(32),
	`birthDateRaw` varchar(64),
	`membershipStatus` enum('eligible','not_enrolled','inactive') NOT NULL DEFAULT 'not_enrolled',
	`cardStatus` enum('not_issued','active','suspended','expired') NOT NULL DEFAULT 'not_issued',
	`walletBalanceCents` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`legacyLastPayment` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `members_id` PRIMARY KEY(`id`),
	CONSTRAINT `members_code_unique` UNIQUE(`memberCode`)
);
--> statement-breakpoint
CREATE TABLE `offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(191) NOT NULL,
	`description` text,
	`category` enum('class','workshop','merchandise','service') NOT NULL DEFAULT 'service',
	`ruleType` enum('member_price','percentage_off','fixed_amount_off') NOT NULL,
	`listPriceCents` int NOT NULL,
	`memberPriceCents` int,
	`discountValue` int,
	`requiresEligibleMembership` boolean NOT NULL DEFAULT true,
	`active` boolean NOT NULL DEFAULT true,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionCode` varchar(64) NOT NULL,
	`memberId` int NOT NULL,
	`offerId` int,
	`type` enum('top_up','purchase','adjustment') NOT NULL,
	`amountCents` int NOT NULL,
	`balanceAfterCents` int NOT NULL,
	`idempotencyKey` varchar(128) NOT NULL,
	`source` enum('pos','admin','offline_sync','import') NOT NULL DEFAULT 'pos',
	`note` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactions_code_unique` UNIQUE(`transactionCode`),
	CONSTRAINT `transactions_idempotency_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE INDEX `duplicate_review_status_idx` ON `duplicateReviews` (`status`);--> statement-breakpoint
CREATE INDEX `enrollments_member_idx` ON `enrollments` (`memberId`);--> statement-breakpoint
CREATE INDEX `enrollments_class_idx` ON `enrollments` (`classGroupId`);--> statement-breakpoint
CREATE INDEX `external_sync_state_idx` ON `externalSyncEvents` (`state`,`createdAt`);--> statement-breakpoint
CREATE INDEX `families_phone_idx` ON `families` (`normalizedPhone`);--> statement-breakpoint
CREATE INDEX `families_email_idx` ON `families` (`normalizedEmail`);--> statement-breakpoint
CREATE INDEX `members_name_idx` ON `members` (`normalizedName`);--> statement-breakpoint
CREATE INDEX `members_family_idx` ON `members` (`familyId`);--> statement-breakpoint
CREATE INDEX `members_membership_idx` ON `members` (`membershipStatus`);--> statement-breakpoint
CREATE INDEX `offers_active_idx` ON `offers` (`active`);--> statement-breakpoint
CREATE INDEX `transactions_member_created_idx` ON `transactions` (`memberId`,`createdAt`);