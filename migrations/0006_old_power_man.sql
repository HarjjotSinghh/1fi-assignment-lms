CREATE TABLE `active_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`session_token` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`location` text,
	`last_activity_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `application_borrowers` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`role` text NOT NULL,
	`share_percent` real DEFAULT 100,
	`income_considered` real,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `loan_applications`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `branding_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`logo_url` text,
	`logo_dark_url` text,
	`favicon_url` text,
	`primary_color` text DEFAULT '#4F46E5',
	`secondary_color` text,
	`accent_color` text,
	`company_name` text DEFAULT '1Fi LMS',
	`support_email` text,
	`support_phone` text,
	`website_url` text,
	`footer_text` text,
	`copyright_text` text,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_by_id` text,
	FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `communication_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`channel` text NOT NULL,
	`subject` text,
	`body` text NOT NULL,
	`variables` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `custom_field_definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`entity` text NOT NULL,
	`field_name` text NOT NULL,
	`field_label` text NOT NULL,
	`field_type` text NOT NULL,
	`options` text,
	`placeholder` text,
	`help_text` text,
	`is_required` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`display_order` integer DEFAULT 0,
	`validation_regex` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `custom_field_values` (
	`id` text PRIMARY KEY NOT NULL,
	`field_id` text NOT NULL,
	`entity_id` text NOT NULL,
	`value` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`field_id`) REFERENCES `custom_field_definitions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customer_consents` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text,
	`consent_type` text NOT NULL,
	`granted` integer NOT NULL,
	`granted_at` text DEFAULT (CURRENT_TIMESTAMP),
	`revoked_at` text,
	`ip_address` text,
	`version` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`parent_id` text,
	`manager_id` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`manager_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `departments_code_unique` ON `departments` (`code`);--> statement-breakpoint
CREATE TABLE `foreclosure_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`loan_id` text,
	`request_date` text NOT NULL,
	`outstanding_principal` real NOT NULL,
	`outstanding_interest` real NOT NULL,
	`penalty_amount` real DEFAULT 0,
	`waiver_amount` real DEFAULT 0,
	`total_payable` real NOT NULL,
	`status` text DEFAULT 'PENDING',
	`approved_by_id` text,
	`approved_at` text,
	`paid_at` text,
	`noc_generated_at` text,
	`noc_document_id` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`created_by_id` text,
	FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `interest_rate_benchmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`current_rate` real NOT NULL,
	`previous_rate` real,
	`effective_from` text NOT NULL,
	`source` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_by_id` text,
	FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `interest_rate_history` (
	`id` text PRIMARY KEY NOT NULL,
	`benchmark_id` text,
	`rate` real NOT NULL,
	`effective_from` text NOT NULL,
	`effective_to` text,
	`source` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`created_by_id` text,
	FOREIGN KEY (`benchmark_id`) REFERENCES `interest_rate_benchmarks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `login_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`success` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`location` text,
	`failure_reason` text,
	`mfa_used` integer DEFAULT false,
	`session_id` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `nav_history` (
	`id` text PRIMARY KEY NOT NULL,
	`scheme_code` text NOT NULL,
	`scheme_name` text NOT NULL,
	`amc_name` text,
	`nav` real NOT NULL,
	`previous_nav` real,
	`change_percent` real,
	`valuation_date` text NOT NULL,
	`source` text DEFAULT 'MANUAL',
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`collateral_id` text,
	FOREIGN KEY (`collateral_id`) REFERENCES `collaterals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reminder_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`trigger_days` integer NOT NULL,
	`channel` text NOT NULL,
	`template_id` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `communication_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `webhook_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`delivery_id` text NOT NULL,
	`event_type` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`attempts` integer DEFAULT 0,
	`max_attempts` integer DEFAULT 3,
	`response_code` integer,
	`response_body` text,
	`error_message` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`last_attempt_at` text,
	`completed_at` text,
	`next_retry_at` text,
	`webhook_id` text NOT NULL,
	FOREIGN KEY (`webhook_id`) REFERENCES `webhooks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `webhook_deliveries_delivery_id_unique` ON `webhook_deliveries` (`delivery_id`);--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`secret` text NOT NULL,
	`events` text NOT NULL,
	`is_active` integer DEFAULT true,
	`max_retries` integer DEFAULT 3,
	`retry_delay_ms` integer DEFAULT 5000,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`last_triggered_at` text,
	`partner_id` text,
	`created_by_id` text,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workflow_definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`stages` text NOT NULL,
	`is_active` integer DEFAULT true,
	`product_id` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`created_by_id` text,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workflow_history` (
	`id` text PRIMARY KEY NOT NULL,
	`instance_id` text,
	`stage` integer NOT NULL,
	`stage_name` text NOT NULL,
	`action` text NOT NULL,
	`comment` text,
	`action_by_id` text,
	`action_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`instance_id`) REFERENCES `workflow_instances`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`action_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workflow_instances` (
	`id` text PRIMARY KEY NOT NULL,
	`definition_id` text,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`current_stage` integer DEFAULT 0,
	`status` text DEFAULT 'IN_PROGRESS' NOT NULL,
	`current_assignee_id` text,
	`completed_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`definition_id`) REFERENCES `workflow_definitions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`current_assignee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `collaterals` ADD `asset_type` text DEFAULT 'MUTUAL_FUND' NOT NULL;--> statement-breakpoint
ALTER TABLE `collaterals` ADD `issuer` text;--> statement-breakpoint
ALTER TABLE `collaterals` ADD `maturity_date` text;--> statement-breakpoint
ALTER TABLE `collaterals` ADD `interest_rate` real;--> statement-breakpoint
ALTER TABLE `collaterals` ADD `policy_number` text;--> statement-breakpoint
ALTER TABLE `collaterals` ADD `surrender_value` real;--> statement-breakpoint
ALTER TABLE `collaterals` ADD `demat_account` text;--> statement-breakpoint
ALTER TABLE `collaterals` ADD `isin` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `retention_years` integer DEFAULT 7;--> statement-breakpoint
ALTER TABLE `documents` ADD `archived_at` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `archive_location` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `loan_id` text REFERENCES loans(id);--> statement-breakpoint
ALTER TABLE `loan_products` ADD `rate_type` text DEFAULT 'FIXED';--> statement-breakpoint
ALTER TABLE `loan_products` ADD `benchmark_id` text;--> statement-breakpoint
ALTER TABLE `loan_products` ADD `spread_percent` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `payments` ADD `is_reconciled` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `payments` ADD `reconciled_at` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `reconciled_by_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `payments` ADD `reconciliation_notes` text;--> statement-breakpoint
ALTER TABLE `users` ADD `mfa_enabled` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `mfa_secret` text;--> statement-breakpoint
ALTER TABLE `users` ADD `mfa_backup_codes` text;--> statement-breakpoint
ALTER TABLE `users` ADD `department_id` text;