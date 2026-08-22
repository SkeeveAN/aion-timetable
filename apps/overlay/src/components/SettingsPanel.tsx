import { SUPPORTED_LANGUAGES } from "@aion-timetable/shared";
import type { OverlaySettings } from "../hooks/useSettings";

interface Props {
  settings: OverlaySettings;
  onChange: (patch: Partial<OverlaySettings>) => void;
  onClose: () => void;
}

const COLORS = ["#ffffff", "#ffd54f", "#4fc3f7", "#81c784", "#e57373"];

export function SettingsPanel({ settings, onChange, onClose }: Props) {
  return (
    <div className="settings-panel">
      <div className="settings-header">
        <span>Darstellung</span>
        <button onClick={onClose}>Schließen</button>
      </div>

      <label>
        Sprache
        <select
          value={settings.language}
          onChange={(e) => onChange({ language: e.target.value as OverlaySettings["language"] })}
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Mein Level
        <input
          type="number"
          min={1}
          max={65}
          placeholder="z. B. 65"
          value={settings.myLevel ?? ""}
          onChange={(e) =>
            onChange({ myLevel: e.target.value === "" ? null : Number(e.target.value) })
          }
        />
      </label>

      <label>
        Schriftgröße: {settings.fontSize}px
        <input
          type="range"
          min={10}
          max={28}
          value={settings.fontSize}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
        />
      </label>

      <div className="color-row">
        {COLORS.map((color) => (
          <button
            key={color}
            className={color === settings.textColor ? "swatch active" : "swatch"}
            style={{ backgroundColor: color }}
            onClick={() => onChange({ textColor: color })}
          />
        ))}
      </div>
    </div>
  );
}
