export interface WorldBossType {
  id: number;
  key: string;
  displayName: string;
  respawnMinSeconds: number;
  respawnMaxSeconds: number;
}

export interface WorldBossLocation {
  id: number;
  bossTypeId: number;
  label: string;
  /** percentage-of-image coordinates, 0-100; null until pinned on the map */
  mapX: number | null;
  mapY: number | null;
}

export interface KillRecord {
  id: number;
  bossLocationId: number;
  killedAt: string;
  reportedByMemberId: number;
  reportedByDisplayName: string;
  createdAt: string;
}

export interface WorldBossLocationState {
  location: WorldBossLocation;
  lastKill: KillRecord | null;
  /** earliest expected respawn timestamp (ISO), derived from lastKill + boss type min/max */
  respawnEarliest: string | null;
  respawnLatest: string | null;
}

export interface WorldBossesResponse {
  bossTypes: WorldBossType[];
  locations: WorldBossLocationState[];
}
