CREATE TABLE `parentUpdateRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`status` enum('pending','confirmed','expired','revoked') NOT NULL DEFAULT 'pending',
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`lastSentAt` timestamp,
	`submittedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parentUpdateRequests_id` PRIMARY KEY(`id`),
	CONSTRAINT `parent_update_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `policyAcceptances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`parentUpdateRequestId` int NOT NULL,
	`policyVersion` varchar(64) NOT NULL,
	`acceptedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `policyAcceptances_id` PRIMARY KEY(`id`),
	CONSTRAINT `policy_acceptance_request_unique` UNIQUE(`parentUpdateRequestId`)
);
--> statement-breakpoint
ALTER TABLE `members` ADD `emergencyPhone` varchar(32);--> statement-breakpoint
ALTER TABLE `members` ADD `regularSchool` varchar(191);--> statement-breakpoint
ALTER TABLE `members` ADD `medicalCondition` enum('yes','no') DEFAULT 'no' NOT NULL;--> statement-breakpoint
ALTER TABLE `members` ADD `medicalDetails` text;--> statement-breakpoint
ALTER TABLE `members` ADD `parentIdScreenshotUrl` varchar(512);--> statement-breakpoint
ALTER TABLE `members` ADD `membershipTier` enum('member','loyalty_member') DEFAULT 'member' NOT NULL;--> statement-breakpoint
CREATE INDEX `parent_update_member_status_idx` ON `parentUpdateRequests` (`memberId`,`status`);--> statement-breakpoint
CREATE INDEX `policy_acceptance_member_idx` ON `policyAcceptances` (`memberId`,`acceptedAt`);