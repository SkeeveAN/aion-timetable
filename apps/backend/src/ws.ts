import type { WebSocket } from "@fastify/websocket";
import type { WsMessage } from "@aion-timetable/shared";

const clientsByTeam = new Map<number, Set<WebSocket>>();

export function registerClient(teamId: number, socket: WebSocket) {
  const set = clientsByTeam.get(teamId) ?? new Set<WebSocket>();
  set.add(socket);
  clientsByTeam.set(teamId, set);

  socket.on("close", () => {
    set.delete(socket);
    if (set.size === 0) clientsByTeam.delete(teamId);
  });
}

export function broadcast(teamId: number, message: WsMessage) {
  const payload = JSON.stringify(message);
  for (const socket of clientsByTeam.get(teamId) ?? []) {
    try {
      socket.send(payload);
    } catch {
      // dead connection, will be cleaned up by its own close handler
    }
  }
}

/** For events that aren't team-specific, e.g. the shared game schedule refreshing. */
export function broadcastAll(message: WsMessage) {
  const payload = JSON.stringify(message);
  for (const set of clientsByTeam.values()) {
    for (const socket of set) {
      try {
        socket.send(payload);
      } catch {
        // dead connection, will be cleaned up by its own close handler
      }
    }
  }
}
