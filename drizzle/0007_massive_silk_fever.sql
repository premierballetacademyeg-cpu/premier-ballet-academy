CREATE TABLE `staffAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffAccountId` int NOT NULL,
	`action` varchar(96) NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` int,
	`details` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staffAuditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `staff_audit_staff_created_idx` ON `staffAuditLogs` (`staffAccountId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `staff_audit_entity_created_idx` ON `staffAuditLogs` (`entityType`,`entityId`,`createdAt`);