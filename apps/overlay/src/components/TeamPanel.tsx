import { useEffect, useState } from "react";
import type { LanguageCode, MemberInfo, TeamInfo } from "@aion-timetable/shared";
import type { ApiClient } from "../api/client";
import { t } from "../lib/uiStrings";

interface Props {
  api: ApiClient;
  team: TeamInfo;
  member: MemberInfo;
  language: LanguageCode;
  onLeave: () => void;
}

export function TeamPanel({ api, team, member, language, onLeave }: Props) {
  const strings = t(language);
  const canManage = member.isOwner || member.isAdmin;
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    if (!canManage) return;
    void api.get<MemberInfo[]>("/team-members").then(setMembers);
  }, [api, canManage]);

  async function toggleAdmin(target: MemberInfo) {
    await api.patch(`/team-members/${target.id}/admin`, { isAdmin: !target.isAdmin });
    setMembers((prev) =>
      prev.map((x) => (x.id === target.id ? { ...x, isAdmin: !x.isAdmin } : x))
    );
  }

  return (
    <div className="team-panel">
      <div className="team-header">
        <strong>{team.name}</strong>
        <span className="team-description">{team.description}</span>
      </div>
      <div className="invite-code">
        {strings.teamInviteCodeLabel} <code>{team.inviteCode}</code>
      </div>

      {canManage && members.length > 0 && (
        <ul className="member-list">
          {members.map((m) => (
            <li key={m.id}>
              {editingId === m.id ? (
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
              ) : (
                <>
                  <span
                    onClick={() => {
                      setEditingId(m.id);
                      setDraftName(m.displayName);
                    }}
                  >
                    {m.displayName} {m.isOwner && strings.teamOwnerTag}
                    {!m.isOwner && m.isAdmin && strings.teamAdminTag}
                  </span>
                  {!m.isOwner && (
                    <button className="admin-toggle-btn" onClick={() => void toggleAdmin(m)}>
                      {m.isAdmin ? strings.teamRemoveAdminButton : strings.teamMakeAdminButton}
                    </button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <button className="logout-btn" onClick={onLeave}>
        {strings.teamLeaveButton}
      </button>
    </div>
  );
}
