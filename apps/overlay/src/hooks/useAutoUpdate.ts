import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateStatus = "idle" | "downloading" | "error";

/**
 * Checks for an update once per app launch and, if one is found, downloads
 * and installs it silently, then relaunches. No user interaction required -
 * matches the hotkey-driven, no-dialogs design of the rest of the app.
 */
export function useAutoUpdate() {
  const [status, setStatus] = useState<UpdateStatus>("idle");

  useEffect(() => {
    (async () => {
      try {
        const update = await check();
        if (!update) return;
        setStatus("downloading");
        await update.downloadAndInstall();
        await relaunch();
      } catch (err) {
        console.error("Auto-update failed:", err);
        setStatus("error");
      }
    })();
  }, []);

  return status;
}
