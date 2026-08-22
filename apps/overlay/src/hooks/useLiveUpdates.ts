import { useEffect } from "react";
import { connectWs } from "../api/ws";
import type { WsMessage } from "@aion-timetable/shared";

export function useLiveUpdates(
  accessToken: string | null,
  onMessage: (message: WsMessage) => void
) {
  useEffect(() => {
    if (!accessToken) return;

    const socket = connectWs(accessToken, onMessage);
    return () => socket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);
}
