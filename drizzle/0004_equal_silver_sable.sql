CREATE TABLE `adminEmailAuthorizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`normalizedEmail` varchar(320) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adminEmailAuthorizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_email_authorizations_email_unique` UNIQUE(`normalizedEmail`)
);
