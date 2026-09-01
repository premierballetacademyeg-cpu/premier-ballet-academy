CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('member_registered','duplicate_review','pos_transaction','sync_success','sync_failure') NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_category_unique` UNIQUE(`category`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('member_registered','duplicate_review','pos_transaction','sync_success','sync_failure') NOT NULL,
	`title` varchar(191) NOT NULL,
	`body` text NOT NULL,
	`actionPath` varchar(255),
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `notifications_read_created_idx` ON `notifications` (`isRead`,`createdAt`);