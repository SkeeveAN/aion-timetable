import { useEffect, useState } from "react";
import type { Comment } from "@aion-timetable/shared";
import type { ApiClient } from "../api/client";

interface Props {
  api: ApiClient;
  killRecordId: number;
  liveComments: Comment[];
}

export function CommentThread({ api, killRecordId, liveComments }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    void api
      .get<Comment[]>(`/comments?killRecordId=${killRecordId}`)
      .then(setComments);
  }, [api, killRecordId]);

  useEffect(() => {
    const relevant = liveComments.filter((c) => c.killRecordId === killRecordId);
    if (relevant.length === 0) return;
    setComments((prev) => [...relevant.filter((c) => !prev.some((p) => p.id === c.id)), ...prev]);
  }, [liveComments, killRecordId]);

  async function submit() {
    if (!draft.trim()) return;
    await api.post("/comments", { killRecordId, body: draft.trim() });
    setDraft("");
  }

  return (
    <div className="comment-thread">
      <ul>
        {comments.map((c) => (
          <li key={c.id}>
            <strong>{c.authorDisplayName}:</strong> {c.body}
          </li>
        ))}
      </ul>
      <div className="comment-input">
        <input
          value={draft}
          placeholder="Kommentar..."
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button onClick={submit}>Senden</button>
      </div>
    </div>
  );
}
