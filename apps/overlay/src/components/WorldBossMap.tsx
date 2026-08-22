import type { WorldBossLocationState } from "@aion-timetable/shared";

interface Props {
  mapImage: string;
  locations: WorldBossLocationState[];
  selectedLocationId: number | null;
  onSelect: (locationId: number) => void;
}

export function WorldBossMap({ mapImage, locations, selectedLocationId, onSelect }: Props) {
  const pinned = locations.filter(
    (l) => l.location.mapX !== null && l.location.mapY !== null
  );

  return (
    <div className="boss-map" style={{ backgroundImage: `url(${mapImage})` }}>
      {pinned.map((state) => (
        <button
          key={state.location.id}
          className={
            state.location.id === selectedLocationId ? "boss-map-pin active" : "boss-map-pin"
          }
          style={{ left: `${state.location.mapX}%`, top: `${state.location.mapY}%` }}
          title={state.location.localizedLabel}
          onClick={() => onSelect(state.location.id)}
        >
          <span className="boss-map-pin-dot" />
        </button>
      ))}
    </div>
  );
}
