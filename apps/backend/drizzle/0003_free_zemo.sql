ALTER TABLE `team_members` ADD `is_admin` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` ADD `password_hash` text;