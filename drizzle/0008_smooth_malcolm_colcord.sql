CREATE TABLE `paymentRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`paymentType` enum('registration','membership','tuition','other') NOT NULL,
	`amountCents` int NOT NULL,
	`status` enum('pending_receipt','under_review','approved','rejected') NOT NULL DEFAULT 'pending_receipt',
	`instapayUrl` varchar(512) NOT NULL,
	`note` varchar(255),
	`reviewedByStaffId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `payment_requests_member_created_idx` ON `paymentRequests` (`memberId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `payment_requests_status_created_idx` ON `paymentRequests` (`status`,`createdAt`);