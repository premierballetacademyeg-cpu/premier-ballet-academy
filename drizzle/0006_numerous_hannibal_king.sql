ALTER TABLE `members` ADD `branch` varchar(128) DEFAULT 'Unassigned' NOT NULL;--> statement-breakpoint
CREATE INDEX `members_branch_created_idx` ON `members` (`branch`,`createdAt`);