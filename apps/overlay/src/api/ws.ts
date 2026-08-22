import type { WsMessage } from "@aion-timetable/shared";
import { WS_URL } from "../config";

export function connectWs(
  accessToken: string,
  onMessage: (message: WsMessage) => void
) {
  const socket = new WebSocket(`${WS_URL}?token=${encodeURIComponent(accessToken)}`);

  socket.addEventListener("message", (event) => {
    try {
      const message = JSON.parse(event.data) as WsMessage;
      onMessage(message);
    } catch {
      // ignore malformed frames
    }
  });

  return socket;
}
