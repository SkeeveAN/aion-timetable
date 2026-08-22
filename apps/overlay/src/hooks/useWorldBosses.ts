import { useCallback, useEffect, useState } from "react";
import type { LanguageCode, WorldBossesResponse } from "@aion-timetable/shared";
import type { ApiClient } from "../api/client";

export function useWorldBosses(
  api: ApiClient,
  enabled: boolean,
  language: LanguageCode
) {
  const [data, setData] = useState<WorldBossesResponse | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    const res = await api.get<WorldBossesResponse>(
      `/world-bosses?lang=${encodeURIComponent(language)}`
    );
    setData(res);
  }, [api, enabled, language]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function reportKill(locationId: number) {
    await api.post(`/world-bosses/${locationId}/kill`, {});
    await reload();
  }

  return { data, reload, reportKill };
}
