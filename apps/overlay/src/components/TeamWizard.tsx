import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { CreateTeamRequest, JoinTeamRequest, LanguageCode } from "@aion-timetable/shared";
import { t } from "../lib/uiStrings";

interface Props {
  language: LanguageCode;
  onCreate: (request: CreateTeamRequest) => Promise<void>;
  onJoin: (request: JoinTeamRequest) => Promise<void>;
}

export function TeamWizard({ language, onCreate, onJoin }: Props) {
  const strings = t(language);
  const [mode, setMode] = useState<"create" | "join">("create");
  const [displayName, setDisplayName] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    invoke<string>("get_os_username").then((username) => {
      if (username) setDisplayName(username);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "create") {
        await onCreate({ name, description, password, displayName });
      } else {
        await onJoin({ inviteCode, displayName });
      }
    } catch {
      setError(mode === "create" ? strings.teamCreateError : strings.teamJoinError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="team-wizard">
      <div className="category-tabs">
        <button
          className={mode === "create" ? "tab active" : "tab"}
          onClick={() => setMode("create")}
        >
          {strings.teamStartTab}
        </button>
        <button
          className={mode === "join" ? "tab active" : "tab"}
          onClick={() => setMode("join")}
        >
          {strings.teamJoinTab}
        </button>
      </div>

      <form className="wizard-form" onSubmit={handleSubmit}>
        {mode === "create" ? (
          <>
            <input
              placeholder={strings.teamNamePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              placeholder={strings.teamDescriptionPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              type="password"
              placeholder={strings.teamPasswordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </>
        ) : (
          <input
            placeholder={strings.teamInviteCodePlaceholder}
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            required
          />
        )}

        <input
          placeholder={strings.teamDisplayNamePlaceholder}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "..." : mode === "create" ? strings.teamCreateButton : strings.teamJoinButton}
        </button>
        {error && <span className="login-error">{error}</span>}
      </form>
    </div>
  );
}
