CREATE TABLE `flightPriceCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`origin` varchar(10) NOT NULL,
	`destination` varchar(10) NOT NULL,
	`departureDate` varchar(20) NOT NULL,
	`returnDate` varchar(20),
	`cabinClass` varchar(50) DEFAULT 'ECONOMY',
	`lowestPrice` int NOT NULL,
	`averagePrice` int,
	`highestPrice` int,
	`currency` varchar(3) DEFAULT 'USD',
	`cheapestAirline` varchar(10),
	`availableAirlines` json,
	`resultsCount` int,
	`cachedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`hitCount` int DEFAULT 0,
	CONSTRAINT `flightPriceCache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `frequentFlyerPrograms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`airlineCode` varchar(10) NOT NULL,
	`airlineName` varchar(100) NOT NULL,
	`memberNumber` varchar(100) NOT NULL,
	`tierStatus` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `frequentFlyerPrograms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `popularDestinations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`airportCode` varchar(10) NOT NULL,
	`cityName` varchar(255) NOT NULL,
	`countryName` varchar(255) NOT NULL,
	`countryCode` varchar(10),
	`searchCount` int DEFAULT 0,
	`bookingCount` int DEFAULT 0,
	`popularityScore` int DEFAULT 0,
	`bestSeason` varchar(50),
	`peakMonths` json,
	`imageUrl` varchar(500),
	`description` text,
	`descriptionPt` text,
	`descriptionEs` text,
	`avgPriceUsd` int,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `popularDestinations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `priceAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`origin` varchar(10) NOT NULL,
	`originName` varchar(255),
	`destination` varchar(10) NOT NULL,
	`destinationName` varchar(255),
	`departureDateStart` varchar(20),
	`departureDateEnd` varchar(20),
	`returnDateStart` varchar(20),
	`returnDateEnd` varchar(20),
	`isFlexibleDates` boolean DEFAULT true,
	`adults` int DEFAULT 1,
	`children` int DEFAULT 0,
	`infants` int DEFAULT 0,
	`cabinClass` varchar(50) DEFAULT 'ECONOMY',
	`targetPrice` int,
	`currentLowestPrice` int,
	`currency` varchar(3) DEFAULT 'USD',
	`isActive` boolean DEFAULT true,
	`lastChecked` timestamp,
	`lastNotified` timestamp,
	`notificationCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`expiresAt` timestamp,
	CONSTRAINT `priceAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedRoutes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`origin` varchar(10) NOT NULL,
	`originName` varchar(255),
	`destination` varchar(10) NOT NULL,
	`destinationName` varchar(255),
	`preferredCabinClass` varchar(50),
	`typicalTravelers` int DEFAULT 1,
	`searchCount` int DEFAULT 0,
	`lastSearched` timestamp,
	`nickname` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedRoutes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `travelerProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`middleName` varchar(100),
	`dateOfBirth` varchar(20) NOT NULL,
	`gender` enum('male','female','other'),
	`nationality` varchar(100),
	`email` varchar(320),
	`phone` varchar(50),
	`documentType` enum('passport','id_card','drivers_license') DEFAULT 'passport',
	`documentNumber` varchar(100),
	`documentCountry` varchar(100),
	`documentExpiry` varchar(20),
	`seatPreference` enum('window','aisle','middle','no_preference') DEFAULT 'no_preference',
	`mealPreference` enum('regular','vegetarian','vegan','halal','kosher','gluten_free','no_preference') DEFAULT 'no_preference',
	`specialAssistance` text,
	`relationship` enum('self','spouse','child','parent','sibling','friend','colleague','other') DEFAULT 'self',
	`isPrimary` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `travelerProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('price_alert','booking_confirmation','booking_reminder','price_drop','promotion','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`relatedBookingId` int,
	`relatedAlertId` int,
	`relatedRouteOrigin` varchar(10),
	`relatedRouteDestination` varchar(10),
	`previousPrice` int,
	`newPrice` int,
	`currency` varchar(3),
	`isRead` boolean DEFAULT false,
	`isEmailSent` boolean DEFAULT false,
	`actionUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `userNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`preferredAirlines` json,
	`avoidedAirlines` json,
	`preferredCabinClass` enum('ECONOMY','PREMIUM_ECONOMY','BUSINESS','FIRST') DEFAULT 'ECONOMY',
	`maxStops` int DEFAULT 2,
	`preferredDepartureTime` enum('early_morning','morning','afternoon','evening','night','any') DEFAULT 'any',
	`homeAirports` json,
	`preferredAlliances` json,
	`budgetRange` enum('budget','moderate','premium','luxury') DEFAULT 'moderate',
	`priceDropThreshold` int DEFAULT 10,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `userPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `userSearchHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(64),
	`origin` varchar(10) NOT NULL,
	`originName` varchar(255),
	`destination` varchar(10) NOT NULL,
	`destinationName` varchar(255),
	`departureDate` varchar(20) NOT NULL,
	`returnDate` varchar(20),
	`adults` int DEFAULT 1,
	`children` int DEFAULT 0,
	`infants` int DEFAULT 0,
	`cabinClass` varchar(50),
	`resultsCount` int,
	`lowestPrice` int,
	`averagePrice` int,
	`currency` varchar(3),
	`filtersApplied` json,
	`viewedFlights` int DEFAULT 0,
	`selectedFlightIndex` int,
	`convertedToBooking` boolean DEFAULT false,
	`searchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userSearchHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bookings` MODIFY COLUMN `status` enum('pending','paid','confirmed','cancelled','refunded','completed') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `bookings` ADD `bookingReference` varchar(20);--> statement-breakpoint
ALTER TABLE `bookings` ADD `pointsEarned` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `bookings` ADD `specialRequests` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `completedAt` timestamp;--> statement-breakpoint
ALTER TABLE `chatConversations` ADD `userId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `squareCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `preferredLanguage` varchar(10) DEFAULT 'en';--> statement-breakpoint
ALTER TABLE `users` ADD `preferredCurrency` varchar(3) DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE `users` ADD `loyaltyPoints` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `loyaltyTier` enum('bronze','silver','gold','platinum') DEFAULT 'bronze';--> statement-breakpoint
ALTER TABLE `users` ADD `emailNotifications` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` ADD `priceAlertNotifications` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` ADD `marketingEmails` boolean DEFAULT false;