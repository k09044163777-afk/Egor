CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`car` text NOT NULL,
	`service` text NOT NULL,
	`preferred_date` text NOT NULL,
	`description` text NOT NULL,
	`photos` text NOT NULL,
	`consent_version` text NOT NULL,
	`fingerprint` text NOT NULL,
	`email_status` text NOT NULL,
	`telegram_status` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `leads_created` ON `leads` (`created_at`);--> statement-breakpoint
CREATE INDEX `leads_fingerprint` ON `leads` (`fingerprint`,`created_at`);