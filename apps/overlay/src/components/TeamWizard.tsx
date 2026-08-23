import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type {
  CreateTeamRequest,
  JoinTeamRequest,
  LanguageCode,
  OwnerLoginRequest,
} from "@aion-timetable/shared";
import { t } from "../lib/uiStrings";

interface Props {
  language: LanguageCode;
  onCreate: (request: CreateTeamRequest) => Promise<void>;
  onJoin: (request: JoinTeamRequest) => Promise<void>;
  onOwnerLogin: (request: OwnerLoginRequest) => Promise<void>;
}

export function TeamWizard({ language, onCreate, onJoin, onOwnerLogin }: Props) {
  const strings = t(language);
  const [mode, setMode] = useState<"create" | "join" | "login">("create");
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
      } else if (mode === "join") {
        await onJoin({ inviteCode, displayName, password });
      } else {
        await onOwnerLogin({ inviteCode, password });
      }
    } catch {
      setError(
        mode === "create"
          ? strings.teamCreateError
          : mode === "join"
            ? strings.teamJoinError
            : strings.teamLoginError
      );
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
        <button
          className={mode === "login" ? "tab active" : "tab"}
          onClick={() => setMode("login")}
        >
          {strings.teamLoginTab}
        </button>
      </div>

      <form className="wizard-form" onSubmit={handleSubmit}>
        {mode === "create" && (
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
            <input
              placeholder={strings.teamDisplayNamePlaceholder}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </>
        )}

        {mode === "join" && (
          <>
            <input
              placeholder={strings.teamInviteCodePlaceholder}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              required
            />
            <input
              placeholder={strings.teamDisplayNamePlaceholder}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder={strings.teamMemberPasswordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </>
        )}

        {mode === "login" && (
          <>
            <input
              placeholder={strings.teamInviteCodePlaceholder}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              required
            />
            <input
              type="password"
              placeholder={strings.teamPasswordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </>
        )}

        <button type="submit" disabled={loading}>
          {loading
            ? "..."
            : mode === "create"
              ? strings.teamCreateButton
              : mode === "join"
                ? strings.teamJoinButton
                : strings.teamOwnerLoginButton}
        </button>
        {error && <span className="login-error">{error}</span>}
      </form>
    </div>
  );
}
