CREATE TABLE `auto_approval_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`priority` integer DEFAULT 0,
	`conditions` text NOT NULL,
	`auto_approve` integer DEFAULT false,
	`auto_reject` integer DEFAULT false,
	`assign_to_role` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`product_id` text,
	`created_by_id` text,
	FOREIGN KEY (`product_id`) REFERENCES `loan_products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `communication_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`channel` text NOT NULL,
	`direction` text DEFAULT 'OUTBOUND' NOT NULL,
	`subject` text,
	`content` text NOT NULL,
	`template_id` text,
	`status` text DEFAULT 'SENT' NOT NULL,
	`metadata` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`delivered_at` text,
	`read_at` text,
	`customer_id` text,
	`loan_id` text,
	`user_id` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `credit_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_number` text NOT NULL,
	`account_type` text NOT NULL,
	`card_last_four` text,
	`card_network` text,
	`card_variant` text,
	`credit_limit` real NOT NULL,
	`current_balance` real DEFAULT 0,
	`available_credit` real NOT NULL,
	`minimum_due` real DEFAULT 0,
	`billing_cycle_day` integer DEFAULT 1,
	`due_date` text,
	`statement_date` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`interest_rate` real DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`credit_line_id` text NOT NULL,
	FOREIGN KEY (`credit_line_id`) REFERENCES `credit_lines`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credit_accounts_account_number_unique` ON `credit_accounts` (`account_number`);--> statement-breakpoint
CREATE TABLE `credit_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`line_number` text NOT NULL,
	`sanctioned_limit` real NOT NULL,
	`utilized_amount` real DEFAULT 0,
	`available_limit` real NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`risk_category` text DEFAULT 'STANDARD',
	`sanction_date` text NOT NULL,
	`expiry_date` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`customer_id` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credit_lines_line_number_unique` ON `credit_lines` (`line_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `credit_lines_customer_id_unique` ON `credit_lines` (`customer_id`);--> statement-breakpoint
CREATE TABLE `credit_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`merchant_name` text,
	`merchant_category` text,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'INR',
	`status` text DEFAULT 'COMPLETED' NOT NULL,
	`location` text,
	`is_international` integer DEFAULT false,
	`transaction_date` text NOT NULL,
	`posting_date` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`credit_account_id` text NOT NULL,
	FOREIGN KEY (`credit_account_id`) REFERENCES `credit_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credit_transactions_transaction_id_unique` ON `credit_transactions` (`transaction_id`);--> statement-breakpoint
CREATE TABLE `legal_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`case_number` text NOT NULL,
	`case_type` text NOT NULL,
	`court_name` text,
	`status` text DEFAULT 'FILED' NOT NULL,
	`filing_date` text NOT NULL,
	`next_hearing_date` text,
	`judgement_date` text,
	`claim_amount` real NOT NULL,
	`recovered_amount` real DEFAULT 0,
	`notes` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`loan_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`assigned_to_id` text,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `legal_cases_case_number_unique` ON `legal_cases` (`case_number`);--> statement-breakpoint
CREATE TABLE `margin_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`call_number` text NOT NULL,
	`trigger_ltv` real NOT NULL,
	`current_ltv` real NOT NULL,
	`shortfall_amount` real NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`top_up_amount` real,
	`top_up_date` text,
	`liquidation_amount` real,
	`liquidation_date` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`notified_at` text,
	`due_date` text NOT NULL,
	`resolved_at` text,
	`loan_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`collateral_id` text,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`collateral_id`) REFERENCES `collaterals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `margin_calls_call_number_unique` ON `margin_calls` (`call_number`);--> statement-breakpoint
CREATE TABLE `partner_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`file_name` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`total_records` integer DEFAULT 0,
	`success_count` integer DEFAULT 0,
	`failed_count` integer DEFAULT 0,
	`errors` text,
	`uploaded_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`processed_at` text,
	`partner_id` text NOT NULL,
	`uploaded_by_id` text,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`type` text DEFAULT 'FINTECH' NOT NULL,
	`contact_name` text,
	`contact_email` text,
	`contact_phone` text,
	`api_key_id` text,
	`webhook_url` text,
	`revenue_share_percent` real DEFAULT 0,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`api_key_id`) REFERENCES `api_keys`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `partners_code_unique` ON `partners` (`code`);--> statement-breakpoint
CREATE TABLE `provisioning_stages` (
	`id` text PRIMARY KEY NOT NULL,
	`stage` integer NOT NULL,
	`exposure_amount` real NOT NULL,
	`provision_percent` real NOT NULL,
	`provision_amount` real NOT NULL,
	`dpd` integer NOT NULL,
	`snapshot_date` text NOT NULL,
	`loan_id` text NOT NULL,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `recovery_agents` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`agency_name` text,
	`phone` text NOT NULL,
	`email` text,
	`total_assigned` integer DEFAULT 0,
	`total_recovered` real DEFAULT 0,
	`success_rate` real DEFAULT 0,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recovery_agents_code_unique` ON `recovery_agents` (`code`);--> statement-breakpoint
CREATE TABLE `recovery_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'ASSIGNED' NOT NULL,
	`assigned_amount` real NOT NULL,
	`recovered_amount` real DEFAULT 0,
	`notes` text,
	`assigned_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`last_contact_at` text,
	`closed_at` text,
	`agent_id` text NOT NULL,
	`loan_id` text NOT NULL,
	`legal_case_id` text,
	FOREIGN KEY (`agent_id`) REFERENCES `recovery_agents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`legal_case_id`) REFERENCES `legal_cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `report_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`format` text DEFAULT 'PDF' NOT NULL,
	`config` text NOT NULL,
	`is_scheduled` integer DEFAULT false,
	`schedule_frequency` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`last_run_at` text,
	`created_by_id` text,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`type` text DEFAULT 'STRING' NOT NULL,
	`description` text,
	`category` text DEFAULT 'GENERAL' NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_by_id` text,
	FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `system_settings_key_unique` ON `system_settings` (`key`);--> statement-breakpoint
CREATE TABLE `watchlist` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_value` text NOT NULL,
	`list_type` text NOT NULL,
	`reason` text NOT NULL,
	`source` text,
	`is_active` integer DEFAULT true,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`expires_at` text,
	`removed_at` text,
	`added_by_id` text,
	`customer_id` text,
	FOREIGN KEY (`added_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
