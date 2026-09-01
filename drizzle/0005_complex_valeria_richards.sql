CREATE TABLE `staffAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`displayName` varchar(128) NOT NULL,
	`normalizedName` varchar(128) NOT NULL,
	`pinHash` varchar(255) NOT NULL,
	`role` enum('system_admin','reception') NOT NULL DEFAULT 'reception',
	`active` boolean NOT NULL DEFAULT true,
	`lastSignedIn` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staffAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_accounts_name_unique` UNIQUE(`normalizedName`)
);
--> statement-breakpoint
CREATE TABLE `staffSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffAccountId` int NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staffSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_sessions_token_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE INDEX `staff_sessions_account_expiry_idx` ON `staffSessions` (`staffAccountId`,`expiresAt`);