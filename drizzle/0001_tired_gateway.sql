CREATE TABLE `appSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `appSettings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`borrowingId` int NOT NULL,
	`approverRole` enum('lab_supervisor','coordinator','sm_operasi') NOT NULL,
	`approverId` int,
	`status` enum('pending','approved','rejected') DEFAULT 'pending',
	`signatureData` text,
	`signedAt` datetime,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `borrowingDetails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`borrowingId` int NOT NULL,
	`toolId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`returnedQuantity` int NOT NULL DEFAULT 0,
	`condition` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `borrowingDetails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calibrationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`toolId` int NOT NULL,
	`calibrationDate` datetime NOT NULL,
	`nextCalibrationDate` datetime NOT NULL,
	`calibrationProvider` varchar(100),
	`certificateNo` varchar(100),
	`certificateUrl` varchar(255),
	`result` enum('passed','failed','conditional') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calibrationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stockItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`unit` varchar(20),
	`quantity` int NOT NULL DEFAULT 0,
	`minThreshold` int NOT NULL DEFAULT 5,
	`maxThreshold` int NOT NULL DEFAULT 100,
	`unitPrice` decimal(10,2),
	`supplier` varchar(100),
	`location` varchar(100),
	`status` enum('available','low_stock','out_of_stock') DEFAULT 'available',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stockItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `stockItems_itemId_unique` UNIQUE(`itemId`)
);
--> statement-breakpoint
CREATE TABLE `stockUsages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usageId` varchar(50) NOT NULL,
	`itemId` int NOT NULL,
	`usedBy` int NOT NULL,
	`quantity` int NOT NULL,
	`usageDate` datetime NOT NULL,
	`purpose` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockUsages_id` PRIMARY KEY(`id`),
	CONSTRAINT `stockUsages_usageId_unique` UNIQUE(`usageId`)
);
--> statement-breakpoint
CREATE TABLE `toolBorrowings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`borrowingId` varchar(50) NOT NULL,
	`borrowerId` int NOT NULL,
	`borrowDate` datetime NOT NULL,
	`expectedReturnDate` datetime NOT NULL,
	`actualReturnDate` datetime,
	`purpose` text,
	`status` enum('pending_approval','approved','borrowed','returned','overdue','rejected') DEFAULT 'pending_approval',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `toolBorrowings_id` PRIMARY KEY(`id`),
	CONSTRAINT `toolBorrowings_borrowingId_unique` UNIQUE(`borrowingId`)
);
--> statement-breakpoint
CREATE TABLE `toolUsageHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`toolId` int NOT NULL,
	`borrowingId` int NOT NULL,
	`usageCount` int NOT NULL DEFAULT 1,
	`lastUsedDate` datetime NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `toolUsageHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`toolId` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`serialNo` varchar(100),
	`brand` varchar(100),
	`model` varchar(100),
	`specification` text,
	`lastCalibrationDate` datetime,
	`nextCalibrationDate` datetime,
	`calibrationCertificateUrl` varchar(255),
	`usageProcedureUrl` varchar(255),
	`status` enum('available','in_use','needs_calibration','damaged','maintenance') DEFAULT 'available',
	`location` varchar(100),
	`assignedTo` int,
	`barcodeData` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tools_id` PRIMARY KEY(`id`),
	CONSTRAINT `tools_toolId_unique` UNIQUE(`toolId`),
	CONSTRAINT `tools_serialNo_unique` UNIQUE(`serialNo`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','lab_supervisor','coordinator','sm_operasi') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_borrowingId_toolBorrowings_id_fk` FOREIGN KEY (`borrowingId`) REFERENCES `toolBorrowings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_approverId_users_id_fk` FOREIGN KEY (`approverId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `borrowingDetails` ADD CONSTRAINT `borrowingDetails_borrowingId_toolBorrowings_id_fk` FOREIGN KEY (`borrowingId`) REFERENCES `toolBorrowings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `borrowingDetails` ADD CONSTRAINT `borrowingDetails_toolId_tools_id_fk` FOREIGN KEY (`toolId`) REFERENCES `tools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calibrationHistory` ADD CONSTRAINT `calibrationHistory_toolId_tools_id_fk` FOREIGN KEY (`toolId`) REFERENCES `tools`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stockUsages` ADD CONSTRAINT `stockUsages_itemId_stockItems_id_fk` FOREIGN KEY (`itemId`) REFERENCES `stockItems`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stockUsages` ADD CONSTRAINT `stockUsages_usedBy_users_id_fk` FOREIGN KEY (`usedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `toolBorrowings` ADD CONSTRAINT `toolBorrowings_borrowerId_users_id_fk` FOREIGN KEY (`borrowerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `toolUsageHistory` ADD CONSTRAINT `toolUsageHistory_toolId_tools_id_fk` FOREIGN KEY (`toolId`) REFERENCES `tools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `toolUsageHistory` ADD CONSTRAINT `toolUsageHistory_borrowingId_toolBorrowings_id_fk` FOREIGN KEY (`borrowingId`) REFERENCES `toolBorrowings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tools` ADD CONSTRAINT `tools_assignedTo_users_id_fk` FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;