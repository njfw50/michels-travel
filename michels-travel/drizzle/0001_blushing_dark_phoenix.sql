CREATE TABLE `chatConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`messages` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `flightSearches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`origin` varchar(10) NOT NULL,
	`destination` varchar(10) NOT NULL,
	`departureDate` varchar(20) NOT NULL,
	`returnDate` varchar(20),
	`adults` int NOT NULL,
	`children` int,
	`infants` int,
	`travelClass` varchar(50),
	`resultsCount` int,
	`lowestPrice` varchar(50),
	`searchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `flightSearches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`type` enum('booking','quote','contact') NOT NULL,
	`status` enum('new','contacted','converted','closed') NOT NULL DEFAULT 'new',
	`origin` varchar(10),
	`originName` varchar(255),
	`destination` varchar(10),
	`destinationName` varchar(255),
	`departureDate` varchar(20),
	`returnDate` varchar(20),
	`adults` int,
	`children` int,
	`infants` int,
	`travelClass` varchar(50),
	`flightDetails` json,
	`estimatedPrice` varchar(50),
	`message` text,
	`preferredLanguage` varchar(10) DEFAULT 'en',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
