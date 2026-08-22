CREATE TABLE `entity_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`canonical_name` text NOT NULL,
	`language` text NOT NULL,
	`translated_name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entity_translations_unique` ON `entity_translations` (`canonical_name`,`language`);