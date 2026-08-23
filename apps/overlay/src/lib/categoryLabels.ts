import type { LanguageCode, ScheduleCategory } from "@aion-timetable/shared";

type CategoryLabels = { en: Record<ScheduleCategory, string> } & Partial<
  Record<LanguageCode, Record<ScheduleCategory, string>>
>;

// "Raid" is used as-is across every language (not translated) - it's the
// term the community actually uses for this category, regardless of UI
// language.
const LABELS: CategoryLabels = {
  en: {
    pvp_instances: "PvP Instances",
    arenas: "Arenas",
    siege: "Raid",
    rifts: "Rifts",
    duel: "Duel",
  },
  de: {
    pvp_instances: "PvP-Instanzen",
    arenas: "Arenen",
    siege: "Raid",
    rifts: "Risse",
    duel: "Duell",
  },
};

const SHORT_LABELS: CategoryLabels = {
  en: { pvp_instances: "PvP", arenas: "Arena", siege: "Raid", rifts: "Rift", duel: "Duel" },
  de: { pvp_instances: "PvP", arenas: "Arena", siege: "Raid", rifts: "Riss", duel: "Duell" },
};

export function categoryLabel(language: LanguageCode, category: ScheduleCategory): string {
  return LABELS[language]?.[category] ?? LABELS.en[category];
}

export function categoryShortLabel(language: LanguageCode, category: ScheduleCategory): string {
  return SHORT_LABELS[language]?.[category] ?? SHORT_LABELS.en[category];
}
