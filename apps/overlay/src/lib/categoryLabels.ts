import type { LanguageCode, ScheduleCategory } from "@aion-timetable/shared";

type CategoryLabels = { en: Record<ScheduleCategory, string> } & Partial<
  Record<LanguageCode, Record<ScheduleCategory, string>>
>;

const LABELS: CategoryLabels = {
  en: {
    pvp_instances: "PvP Instances",
    arenas: "Arenas",
    siege: "Siege",
    rifts: "Rifts",
  },
  de: {
    pvp_instances: "PvP-Instanzen",
    arenas: "Arenen",
    siege: "Belagerung",
    rifts: "Risse",
  },
};

const SHORT_LABELS: CategoryLabels = {
  en: { pvp_instances: "PvP", arenas: "Arena", siege: "Siege", rifts: "Rift" },
  de: { pvp_instances: "PvP", arenas: "Arena", siege: "Belag.", rifts: "Riss" },
};

export function categoryLabel(language: LanguageCode, category: ScheduleCategory): string {
  return LABELS[language]?.[category] ?? LABELS.en[category];
}

export function categoryShortLabel(language: LanguageCode, category: ScheduleCategory): string {
  return SHORT_LABELS[language]?.[category] ?? SHORT_LABELS.en[category];
}
