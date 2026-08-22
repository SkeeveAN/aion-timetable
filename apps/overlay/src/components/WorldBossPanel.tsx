import { useState } from "react";
import type { WorldBossesResponse } from "@aion-timetable/shared";
import { formatLocalTime } from "../lib/time";

interface Props {
  data: WorldBossesResponse;
  onReportKill: (locationId: number) => Promise<void>;
}

export function WorldBossPanel({ data, onReportKill }: Props) {
  const [selectedBossTypeId, setSelectedBossTypeId] = useState(
    data.bossTypes[0]?.id ?? null
  );
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null
  );
  const [confirming, setConfirming] = useState(false);

  const locations = data.locations.filter(
    (l) => l.location.bossTypeId === selectedBossTypeId
  );

  async function confirmKill() {
    if (selectedLocationId === null) return;
    setConfirming(true);
    try {
      await onReportKill(selectedLocationId);
      setSelectedLocationId(null);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="world-boss-panel">
      <div className="boss-type-tabs">
        {data.bossTypes.map((boss) => (
          <button
            key={boss.id}
            className={boss.id === selectedBossTypeId ? "tab active" : "tab"}
            onClick={() => {
              setSelectedBossTypeId(boss.id);
              setSelectedLocationId(null);
            }}
          >
            {boss.displayName}
          </button>
        ))}
      </div>

      <ul className="location-list">
        {locations.map((state) => (
          <li key={state.location.id}>
            <button
              className={
                state.location.id === selectedLocationId
                  ? "location-btn active"
                  : "location-btn"
              }
              onClick={() => setSelectedLocationId(state.location.id)}
            >
              <span>{state.location.label}</span>
              {state.respawnEarliest && state.respawnLatest && (
                <span className="respawn-window">
                  erwartet {formatLocalTime(new Date(state.respawnEarliest))}–
                  {formatLocalTime(new Date(state.respawnLatest))}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {selectedLocationId !== null && (
        <button className="kill-confirm" disabled={confirming} onClick={confirmKill}>
          {confirming ? "..." : "Kill / Getötet"}
        </button>
      )}
    </div>
  );
}
