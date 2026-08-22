import { SUPPORTED_LANGUAGES } from "@aion-timetable/shared";
import type { OverlaySettings } from "../hooks/useSettings";
import { t } from "../lib/uiStrings";

interface Props {
  settings: OverlaySettings;
  onChange: (patch: Partial<OverlaySettings>) => void;
  onClose: () => void;
}

const COLORS = ["#ffffff", "#ffd54f", "#4fc3f7", "#81c784", "#e57373"];
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 28;

export function SettingsPanel({ settings, onChange, onClose }: Props) {
  const strings = t(settings.language);

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <span>{strings.settingsTitle}</span>
        <button onClick={onClose}>{strings.settingsClose}</button>
      </div>

      <label>
        {strings.settingsLanguage}
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
        {strings.settingsMyLevel}
        <input
          type="number"
          min={1}
          max={65}
          placeholder={strings.settingsMyLevelPlaceholder}
          value={settings.myLevel ?? ""}
          onChange={(e) =>
            onChange({ myLevel: e.target.value === "" ? null : Number(e.target.value) })
          }
        />
      </label>

      <label>
        {strings.settingsFontSize} (px)
        <input
          type="number"
          min={MIN_FONT_SIZE}
          max={MAX_FONT_SIZE}
          value={settings.fontSize}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (Number.isNaN(value)) return;
            onChange({
              fontSize: Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, value)),
            });
          }}
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
