import { useEffect, useState } from "react";
import type { MemberInfo, TeamInfo } from "@aion-timetable/shared";
import type { ApiClient } from "../api/client";

interface Props {
  api: ApiClient;
  team: TeamInfo;
  member: MemberInfo;
  onLeave: () => void;
}

export function TeamPanel({ api, team, member, onLeave }: Props) {
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    if (!member.isOwner) return;
    void api.get<MemberInfo[]>("/team-members").then(setMembers);
  }, [api, member.isOwner]);

  return (
    <div className="team-panel">
      <div className="team-header">
        <strong>{team.name}</strong>
        <span className="team-description">{team.description}</span>
      </div>
      <div className="invite-code">
        Einladungscode: <code>{team.inviteCode}</code>
      </div>

      {member.isOwner && members.length > 0 && (
        <ul className="member-list">
          {members.map((m) => (
            <li key={m.id}>
              {editingId === m.id ? (
                <>
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key !== "Enter") return;
                      await api.patch(`/team-members/${m.id}`, { displayName: draftName });
                      setMembers((prev) =>
                        prev.map((x) => (x.id === m.id ? { ...x, displayName: draftName } : x))
                      );
                      setEditingId(null);
                    }}
                  />
                </>
              ) : (
                <span
                  onClick={() => {
                    setEditingId(m.id);
                    setDraftName(m.displayName);
                  }}
                >
                  {m.displayName} {m.isOwner && "(Owner)"}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <button className="logout-btn" onClick={onLeave}>
        Team verlassen
      </button>
    </div>
  );
}
