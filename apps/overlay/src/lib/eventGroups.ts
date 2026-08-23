/**
 * Some schedule entries are really the same raid/arena contested by several
 * fortresses (or several arena variants) at once - the site scrapes each
 * fortress/variant as its own row, but they should render as one line.
 * Grouping is by fixed family membership, not just "same timestamp": Roah
 * and Asteria always occur at the exact same time as Sulfur/Siel's Eastern/
 * Siel's Western, but are a conceptually distinct raid and must stay on
 * their own line (per user clarification) rather than merging into one
 * five-name line.
 */
export interface EventFamily {
  /** canonical (English) event names belonging to this family, in the order they should be joined */
  members: string[];
  /** fixed label to show instead of joining member display names, e.g. "Katalam" */
  label?: string;
}

export const EVENT_FAMILIES: EventFamily[] = [
  { members: ["Sillus", "Silona", "Pradeth"], label: "Katalam" },
  { members: ["Miren", "Krotan", "Kysis"] },
  { members: ["Sulfur", "Siel's Eastern", "Siel's Western"] },
  { members: ["Roah", "Asteria"] },
  {
    members: [
      "Temple of Scales",
      "Vorgaltem Citadel",
      "Altar of Avarice",
      "Crimson Temple",
    ],
    label: "Inggison/Gelkmaros",
  },
  { members: ["Arena of Discipline", "Arena of Harmony", "Arena of Chaos"] },
];

function familyFor(name: string): EventFamily | undefined {
  return EVENT_FAMILIES.find((f) => f.members.includes(name));
}

/** Longest word-aligned prefix shared by all names, e.g. "Arena der " for
 * ["Arena der Disziplin", "Arena der Kooperation"] - "" if there's no shared
 * whole-word prefix (never cuts a word in half). */
function commonWordPrefix(names: string[]): string {
  if (names.length < 2) return "";
  let prefix = names[0];
  for (const name of names.slice(1)) {
    let i = 0;
    while (i < prefix.length && i < name.length && prefix[i] === name[i]) i++;
    prefix = prefix.slice(0, i);
    if (!prefix) return "";
  }
  const lastSpace = prefix.lastIndexOf(" ");
  return lastSpace === -1 ? "" : prefix.slice(0, lastSpace + 1);
}

/** Joins names, factoring out a shared prefix once instead of repeating it:
 * "Arena der Disziplin / Arena der Kooperation" -> "Arena der Disziplin / Kooperation". */
function joinFactoringPrefix(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  const prefix = commonWordPrefix(names);
  if (!prefix) return names.join(" / ");
  return prefix + names.map((n) => n.slice(prefix.length)).join(" / ");
}

interface NamedEvent {
  name: string;
  displayName: string;
}

export interface GroupedItem<T> {
  items: T[];
  displayName: string;
}

/**
 * Merges items belonging to the same family and occurring at the exact same
 * instant (same key, typically `occurrence.start.getTime()`) into one entry.
 * Items with no family pass through unmerged (one-item group).
 */
export function groupByFamily<T>(
  items: T[],
  getEvent: (item: T) => NamedEvent,
  getOccurrenceKey: (item: T) => number
): GroupedItem<T>[] {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const event = getEvent(item);
    const family = familyFor(event.name);
    const key = family
      ? `${family.members.join("|")}::${getOccurrenceKey(item)}`
      : `single:${event.name}::${getOccurrenceKey(item)}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }

  return Array.from(groups.values()).map((bucket) => {
    const firstEvent = getEvent(bucket[0]);
    const family = familyFor(firstEvent.name);
    if (family?.label) {
      return { items: bucket, displayName: family.label };
    }
    if (family) {
      const byName = new Map(bucket.map((i) => [getEvent(i).name, getEvent(i).displayName]));
      const names = family.members
        .map((m) => byName.get(m))
        .filter((n): n is string => Boolean(n));
      return { items: bucket, displayName: joinFactoringPrefix(names) };
    }
    return { items: bucket, displayName: firstEvent.displayName };
  });
}
