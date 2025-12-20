CREATE TABLE `approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`requested_amount` real,
	`notes` text,
	`review_comment` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`expires_at` text,
	`reviewed_at` text,
	`requested_by_id` text,
	`reviewed_by_id` text,
	FOREIGN KEY (`requested_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`description` text NOT NULL,
	`metadata` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `kyc_verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`verification_id` text NOT NULL,
	`reference_id` integer,
	`documents_requested` text NOT NULL,
	`documents_consented` text,
	`redirect_url` text,
	`digilocker_url` text,
	`user_flow` text DEFAULT 'signup',
	`status` text DEFAULT 'PENDING' NOT NULL,
	`user_name` text,
	`user_dob` text,
	`user_gender` text,
	`user_mobile` text,
	`consent_expires_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`expires_at` text,
	`completed_at` text,
	`customer_id` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `kyc_verifications_verification_id_unique` ON `kyc_verifications` (`verification_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`is_read` integer DEFAULT false,
	`link` text,
	`entity_type` text,
	`entity_id` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`read_at` text,
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
