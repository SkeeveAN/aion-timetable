import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";

/**
 * Mirrors the two global hotkeys registered on the Rust side (see src-tauri/src/lib.rs):
 * one toggles interactive/move mode (click-through off), the other toggles the settings panel.
 * Both temporarily disable click-through while open, matching the "editable per hotkey,
 * not via a text field" requirement.
 */
export function useInteractiveMode() {
  const [interactive, setInteractive] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const unlistenInteractive = listen("toggle-interactive", () => {
      setInteractive((prev) => !prev);
    });
    const unlistenSettings = listen("toggle-settings", () => {
      setSettingsOpen((prev) => !prev);
    });

    return () => {
      unlistenInteractive.then((fn) => fn());
      unlistenSettings.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    const shouldAllowClicks = interactive || settingsOpen;
    void invoke("set_click_through", { ignore: !shouldAllowClicks });
  }, [interactive, settingsOpen]);

  async function startDrag() {
    await getCurrentWindow().startDragging();
  }

  return { interactive, setInteractive, settingsOpen, setSettingsOpen, startDrag };
}
