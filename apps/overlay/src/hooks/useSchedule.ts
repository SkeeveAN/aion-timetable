import { useCallback, useEffect, useState } from "react";
import type { LanguageCode, ScheduleResponse } from "@aion-timetable/shared";
import { API_BASE_URL } from "../config";

export function useSchedule(language: LanguageCode) {
  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/schedule?lang=${encodeURIComponent(language)}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setData((await response.json()) as ScheduleResponse);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [language]);

  useEffect(() => {
    void reload();
    const interval = setInterval(() => void reload(), 5 * 60_000);
    return () => clearInterval(interval);
  }, [reload]);

  return { data, error, reload };
}
