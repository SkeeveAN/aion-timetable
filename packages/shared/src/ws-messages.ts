import type { KillRecord } from "./world-bosses.js";
import type { Comment } from "./comments.js";

export type WsMessage =
  | { type: "kill.created"; payload: KillRecord }
  | { type: "comment.created"; payload: Comment }
  | { type: "schedule.updated"; payload: { scrapedAt: string } };
