CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_token` text NOT NULL,
	`user_id` text NOT NULL,
	`expires` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_session_token_unique` ON `sessions` (`session_token`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_token_unique` ON `verification_tokens` (`token`);--> statement-breakpoint
DROP INDEX "api_keys_key_unique";--> statement-breakpoint
DROP INDEX "customers_email_unique";--> statement-breakpoint
DROP INDEX "customers_aadhaar_number_unique";--> statement-breakpoint
DROP INDEX "customers_pan_number_unique";--> statement-breakpoint
DROP INDEX "loan_applications_application_number_unique";--> statement-breakpoint
DROP INDEX "loans_loan_number_unique";--> statement-breakpoint
DROP INDEX "loans_application_id_unique";--> statement-breakpoint
DROP INDEX "sessions_session_token_unique";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
DROP INDEX "verification_tokens_token_unique";--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "name" TO "name" text;--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_unique` ON `api_keys` (`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_email_unique` ON `customers` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_aadhaar_number_unique` ON `customers` (`aadhaar_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_pan_number_unique` ON `customers` (`pan_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `loan_applications_application_number_unique` ON `loan_applications` (`application_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `loans_loan_number_unique` ON `loans` (`loan_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `loans_application_id_unique` ON `loans` (`application_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified` text;--> statement-breakpoint
ALTER TABLE `users` ADD `password` text;--> statement-breakpoint
ALTER TABLE `users` ADD `image` text;