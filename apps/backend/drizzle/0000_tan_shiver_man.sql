CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`schedule_event_id` integer,
	`kill_record_id` integer,
	`author_member_id` integer NOT NULL,
	`body` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`schedule_event_id`) REFERENCES `schedule_events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`kill_record_id`) REFERENCES `kill_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `kill_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`boss_location_id` integer NOT NULL,
	`killed_at` text NOT NULL,
	`reported_by_member_id` integer NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`boss_location_id`) REFERENCES `world_boss_locations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reported_by_member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schedule_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`image_url` text,
	`weekday` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`scraped_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schedule_events_unique_slot` ON `schedule_events` (`category`,`name`,`weekday`,`start_time`);--> statement-breakpoint
CREATE TABLE `server_time_meta` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`offset_label` text NOT NULL,
	`offset_minutes` integer NOT NULL,
	`scraped_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`display_name` text NOT NULL,
	`is_owner` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`password_hash` text NOT NULL,
	`invite_code` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_name_unique` ON `teams` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `teams_invite_code_unique` ON `teams` (`invite_code`);--> statement-breakpoint
CREATE TABLE `world_boss_locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`boss_type_id` integer NOT NULL,
	`label` text NOT NULL,
	`map_x` real,
	`map_y` real,
	FOREIGN KEY (`boss_type_id`) REFERENCES `world_boss_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `world_boss_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`display_name` text NOT NULL,
	`respawn_min_seconds` integer NOT NULL,
	`respawn_max_seconds` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `world_boss_types_key_unique` ON `world_boss_types` (`key`);