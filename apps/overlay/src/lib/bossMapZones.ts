import tiamarantaEye from "../assets/maps/tiamaranta-eye.jpg";

/**
 * Maps a world boss's canonical key to the zone map image to render pins on.
 * Bosses not listed here have no pinned coordinates yet - the location list
 * (WorldBossPanel) still works for them regardless.
 */
export const BOSS_MAP_ZONES: Record<string, string> = {
  dabra: tiamarantaEye,
  zumita: tiamarantaEye,
};
