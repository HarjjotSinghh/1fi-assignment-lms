CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true,
	`last_used_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_unique` ON `api_keys` (`key`);--> statement-breakpoint
CREATE TABLE `application_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`comment` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`application_id` text NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `loan_applications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `collaterals` (
	`id` text PRIMARY KEY NOT NULL,
	`fund_name` text NOT NULL,
	`amc_name` text NOT NULL,
	`folio_number` text NOT NULL,
	`scheme_code` text,
	`scheme_name` text NOT NULL,
	`scheme_type` text NOT NULL,
	`units` real NOT NULL,
	`purchase_nav` real NOT NULL,
	`current_nav` real NOT NULL,
	`purchase_value` real NOT NULL,
	`current_value` real NOT NULL,
	`pledge_status` text DEFAULT 'PENDING' NOT NULL,
	`pledged_at` text,
	`released_at` text,
	`lien_marked_at` text,
	`lien_reference_number` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`last_valuation_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`customer_id` text NOT NULL,
	`application_id` text,
	`loan_id` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`application_id`) REFERENCES `loan_applications`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`date_of_birth` text NOT NULL,
	`aadhaar_number` text,
	`aadhaar_verified` integer DEFAULT false,
	`aadhaar_verified_at` text,
	`pan_number` text,
	`pan_verified` integer DEFAULT false,
	`pan_verified_at` text,
	`kyc_status` text DEFAULT 'PENDING' NOT NULL,
	`kyc_rejection_reason` text,
	`address_line_1` text,
	`address_line_2` text,
	`city` text,
	`state` text,
	`pincode` text,
	`employment_type` text,
	`monthly_income` real,
	`company_name` text,
	`bank_account_number` text,
	`bank_ifsc_code` text,
	`bank_name` text,
	`risk_score` integer,
	`credit_score` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`created_by_id` text,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_email_unique` ON `customers` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_aadhaar_number_unique` ON `customers` (`aadhaar_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_pan_number_unique` ON `customers` (`pan_number`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`url` text NOT NULL,
	`verified` integer DEFAULT false,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`customer_id` text,
	`application_id` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`application_id`) REFERENCES `loan_applications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `emi_schedule` (
	`id` text PRIMARY KEY NOT NULL,
	`installment_no` integer NOT NULL,
	`due_date` text NOT NULL,
	`emi_amount` real NOT NULL,
	`principal_amount` real NOT NULL,
	`interest_amount` real NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`paid_amount` real DEFAULT 0,
	`paid_at` text,
	`loan_id` text NOT NULL,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `loan_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`application_number` text NOT NULL,
	`requested_amount` real NOT NULL,
	`approved_amount` real,
	`tenure` integer NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`status_reason` text,
	`submitted_at` text,
	`reviewed_at` text,
	`approved_at` text,
	`rejected_at` text,
	`disbursed_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`source` text DEFAULT 'MANUAL' NOT NULL,
	`external_reference` text,
	`customer_id` text NOT NULL,
	`product_id` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `loan_products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `loan_applications_application_number_unique` ON `loan_applications` (`application_number`);--> statement-breakpoint
CREATE TABLE `loan_products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`min_amount` real NOT NULL,
	`max_amount` real NOT NULL,
	`min_tenure_months` integer NOT NULL,
	`max_tenure_months` integer NOT NULL,
	`interest_rate_percent` real NOT NULL,
	`processing_fee_percent` real DEFAULT 1,
	`max_ltv_percent` real DEFAULT 50,
	`margin_call_threshold` real DEFAULT 60,
	`liquidation_threshold` real DEFAULT 70,
	`min_credit_score` integer,
	`min_monthly_income` real,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `loans` (
	`id` text PRIMARY KEY NOT NULL,
	`loan_number` text NOT NULL,
	`principal_amount` real NOT NULL,
	`interest_rate` real NOT NULL,
	`tenure` integer NOT NULL,
	`emi_amount` real NOT NULL,
	`outstanding_principal` real NOT NULL,
	`outstanding_interest` real NOT NULL,
	`total_outstanding` real NOT NULL,
	`disbursed_amount` real NOT NULL,
	`disbursed_at` text NOT NULL,
	`maturity_date` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`current_ltv` real DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`customer_id` text NOT NULL,
	`product_id` text NOT NULL,
	`application_id` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `loan_products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`application_id`) REFERENCES `loan_applications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `loans_loan_number_unique` ON `loans` (`loan_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `loans_application_id_unique` ON `loans` (`application_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` real NOT NULL,
	`payment_date` text NOT NULL,
	`payment_mode` text NOT NULL,
	`transaction_ref` text,
	`status` text DEFAULT 'SUCCESS' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`loan_id` text NOT NULL,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'USER' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);