import { useCallback, useEffect, useState } from "react";
import type { WorldBossesResponse } from "@aion-timetable/shared";
import type { ApiClient } from "../api/client";

export function useWorldBosses(api: ApiClient, enabled: boolean) {
  const [data, setData] = useState<WorldBossesResponse | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    const res = await api.get<WorldBossesResponse>("/world-bosses");
    setData(res);
  }, [api, enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function reportKill(locationId: number) {
    await api.post(`/world-bosses/${locationId}/kill`, {});
    await reload();
  }

  return { data, reload, reportKill };
}
