CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`stripeCheckoutSessionId` varchar(255),
	`status` enum('pending','paid','confirmed','cancelled','refunded') NOT NULL DEFAULT 'pending',
	`origin` varchar(10) NOT NULL,
	`originName` varchar(255),
	`destination` varchar(10) NOT NULL,
	`destinationName` varchar(255),
	`departureDate` varchar(20) NOT NULL,
	`returnDate` varchar(20),
	`adults` int NOT NULL,
	`children` int DEFAULT 0,
	`infants` int DEFAULT 0,
	`travelClass` varchar(50),
	`flightOffer` json,
	`totalAmount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`passengerDetails` json,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`paidAt` timestamp,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);