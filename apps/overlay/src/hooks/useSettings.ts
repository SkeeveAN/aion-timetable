import { useEffect, useState } from "react";
import { LazyStore } from "@tauri-apps/plugin-store";

export interface OverlaySettings {
  fontSize: number;
  textColor: string;
  /** null = not set, don't filter by level */
  myLevel: number | null;
  /** false until the first-run setup flow has shown itself once */
  onboarded: boolean;
}

const DEFAULT_SETTINGS: OverlaySettings = {
  fontSize: 14,
  textColor: "#ffffff",
  myLevel: null,
  onboarded: false,
};

const store = new LazyStore("settings.json");

export function useSettings() {
  const [settings, setSettings] = useState<OverlaySettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await store.get<OverlaySettings>("overlay");
      if (stored) setSettings({ ...DEFAULT_SETTINGS, ...stored });
      setLoaded(true);
    })();
  }, []);

  async function update(patch: Partial<OverlaySettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    await store.set("overlay", next);
    await store.save();
  }

  return { settings, update, loaded };
}
