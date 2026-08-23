/**
 * Classic AION rift zone pairs: a rift in one zone always leads to its
 * opposing-faction counterpart. Keyed and valued by canonical (English)
 * zone name, matching ScheduleEvent.name.
 */
export const RIFT_DESTINATION: Record<string, string> = {
  Eltnen: "Morheim",
  Morheim: "Eltnen",
  Heiron: "Beluslan",
  Beluslan: "Heiron",
  Inggison: "Gelkmaros",
  Gelkmaros: "Inggison",
};

interface NamedEvent {
  name: string;
  displayName: string;
}

/**
 * "Eltnen" alone doesn't say where the rift leads - render it as
 * "from Eltnen to Morheim" (per riftFromToTemplate) instead. The
 * destination's own localized name is looked up from its own schedule
 * entry (it's always scraped as a rift event in its own right) rather than
 * duplicating a translation table client-side.
 */
export function riftLabel(
  event: NamedEvent,
  allEvents: NamedEvent[],
  template: string
): string {
  const destinationName = RIFT_DESTINATION[event.name];
  if (!destinationName) return event.displayName;

  const destinationEvent = allEvents.find((e) => e.name === destinationName);
  const to = destinationEvent?.displayName ?? destinationName;

  return template.replace("{from}", event.displayName).replace("{to}", to);
}
