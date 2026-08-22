import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { CreateTeamRequest, JoinTeamRequest } from "@aion-timetable/shared";

interface Props {
  onCreate: (request: CreateTeamRequest) => Promise<void>;
  onJoin: (request: JoinTeamRequest) => Promise<void>;
}

export function TeamWizard({ onCreate, onJoin }: Props) {
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
      setError(mode === "create" ? "Team konnte nicht erstellt werden." : "Beitritt fehlgeschlagen.");
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
          Team starten
        </button>
        <button
          className={mode === "join" ? "tab active" : "tab"}
          onClick={() => setMode("join")}
        >
          Team beitreten
        </button>
      </div>

      <form className="wizard-form" onSubmit={handleSubmit}>
        {mode === "create" ? (
          <>
            <input
              placeholder="Team-Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              placeholder="Beschreibung"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </>
        ) : (
          <input
            placeholder="Einladungscode"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            required
          />
        )}

        <input
          placeholder="Dein Anzeigename"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "..." : mode === "create" ? "Team erstellen" : "Beitreten"}
        </button>
        {error && <span className="login-error">{error}</span>}
      </form>
    </div>
  );
}
