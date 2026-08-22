import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LazyStore } from "@tauri-apps/plugin-store";
import type {
  CreateTeamRequest,
  JoinTeamRequest,
  TeamAuthResponse,
  TeamInfo,
  MemberInfo,
} from "@aion-timetable/shared";
import { createApiClient } from "../api/client";

const store = new LazyStore("auth.json");

type StoredAuth = TeamAuthResponse;

export function useAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [ready, setReady] = useState(false);

  const accessTokenRef = useRef<string | null>(null);
  accessTokenRef.current = accessToken;

  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => accessTokenRef.current,
        onUnauthorized: () => {
          setAccessToken(null);
          setTeam(null);
          setMember(null);
        },
      }),
    []
  );

  useEffect(() => {
    (async () => {
      const stored = await store.get<StoredAuth>("session");
      if (stored) {
        setAccessToken(stored.accessToken);
        setTeam(stored.team);
        setMember(stored.member);
      }
      setReady(true);
    })();
  }, []);

  const persist = useCallback(async (auth: StoredAuth) => {
    setAccessToken(auth.accessToken);
    setTeam(auth.team);
    setMember(auth.member);
    await store.set("session", auth);
    await store.save();
  }, []);

  const createTeam = useCallback(
    async (request: CreateTeamRequest) => {
      const res = await api.post<TeamAuthResponse>("/teams", request, {
        auth: false,
      });
      await persist(res);
    },
    [api, persist]
  );

  const joinTeam = useCallback(
    async (request: JoinTeamRequest) => {
      const res = await api.post<TeamAuthResponse>("/teams/join", request, {
        auth: false,
      });
      await persist(res);
    },
    [api, persist]
  );

  const leaveTeam = useCallback(async () => {
    setAccessToken(null);
    setTeam(null);
    setMember(null);
    await store.delete("session");
    await store.save();
  }, []);

  return {
    ready,
    accessToken,
    team,
    member,
    isTeamMode: accessToken !== null,
    api,
    createTeam,
    joinTeam,
    leaveTeam,
  };
}
