import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db/client.js";
import { entityTranslations } from "./db/schema.js";

export const DEFAULT_LANGUAGE = "en";

/**
 * Resolves display names for a set of canonical (English) entity names in one
 * language. Falls back to the canonical name itself when no translation row
 * exists yet - safe to call even before any language data has been seeded.
 */
export function resolveDisplayNames(
  canonicalNames: string[],
  language: string
): Map<string, string> {
  const result = new Map(canonicalNames.map((name) => [name, name]));
  if (language === DEFAULT_LANGUAGE || canonicalNames.length === 0) {
    return result;
  }

  const rows = db
    .select()
    .from(entityTranslations)
    .where(
      and(
        eq(entityTranslations.language, language),
        inArray(entityTranslations.canonicalName, canonicalNames)
      )
    )
    .all();

  for (const row of rows) {
    result.set(row.canonicalName, row.translatedName);
  }

  return result;
}

export function languageFromQuery(query: unknown): string {
  if (typeof query === "object" && query !== null && "lang" in query) {
    const value = (query as Record<string, unknown>).lang;
    if (typeof value === "string" && value.length > 0) return value;
  }
  return DEFAULT_LANGUAGE;
}
