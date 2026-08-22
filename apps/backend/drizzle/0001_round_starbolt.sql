CREATE TABLE `instance_level_requirements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`min_level` integer NOT NULL,
	`max_level` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `instance_level_requirements_name_unique` ON `instance_level_requirements` (`name`);