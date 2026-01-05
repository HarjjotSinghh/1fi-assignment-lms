CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`user_agent` text,
	`device_name` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`last_used_at` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
