import { useEffect, useState } from "react";
import type { Comment, ScheduleCategory } from "@aion-timetable/shared";
import { useSchedule } from "./hooks/useSchedule";
import { useAuth } from "./hooks/useAuth";
import { useSettings } from "./hooks/useSettings";
import { useInteractiveMode } from "./hooks/useInteractiveMode";
import { useWorldBosses } from "./hooks/useWorldBosses";
import { useLiveUpdates } from "./hooks/useLiveUpdates";
import { UpcomingList } from "./components/UpcomingList";
import { ScheduleList } from "./components/ScheduleList";
import { SettingsPanel } from "./components/SettingsPanel";
import { TeamWizard } from "./components/TeamWizard";
import { TeamPanel } from "./components/TeamPanel";
import { WorldBossPanel } from "./components/WorldBossPanel";
import { CommentThread } from "./components/CommentThread";
import "./App.css";

export default function App() {
  const auth = useAuth();
  const { settings, update: updateSettings, loaded: settingsLoaded } = useSettings();
  const { data: schedule, reload: reloadSchedule } = useSchedule(settings.language);
  const { interactive, setInteractive, settingsOpen, setSettingsOpen, startDrag } =
    useInteractiveMode();

  useEffect(() => {
    if (!settingsLoaded || settings.onboarded) return;
    // First ever launch: open in interactive + settings mode so a new user
    // can immediately move the window and configure it, without needing to
    // already know the hotkeys. Deleting the store files resets this too.
    setInteractive(true);
    setSettingsOpen(true);
    void updateSettings({ onboarded: true });
  }, [settingsLoaded, settings.onboarded]);
  const worldBosses = useWorldBosses(auth.api, auth.isTeamMode, settings.language);
  const [activeCategory, setActiveCategory] =
    useState<ScheduleCategory>("pvp_instances");
  const [page, setPage] = useState<0 | 1>(0);
  const [liveComments, setLiveComments] = useState<Comment[]>([]);
  const [lastKillLocationId, setLastKillLocationId] = useState<number | null>(
    null
  );

  useLiveUpdates(auth.accessToken, (message) => {
    if (message.type === "schedule.updated") void reloadSchedule();
    if (message.type === "kill.created") void worldBosses.reload();
    if (message.type === "comment.created") {
      setLiveComments((prev) => [message.payload, ...prev]);
    }
  });

  const lastKillRecord = worldBosses.data?.locations.find(
    (l) => l.location.id === lastKillLocationId
  )?.lastKill;

  return (
    <div
      className="overlay-root"
      style={{ fontSize: settings.fontSize, color: settings.textColor }}
    >
      {interactive && (
        <div className="drag-handle" onMouseDown={() => void startDrag()}>
          ⠿ Verschieben (Strg+Umschalt+O zum Verlassen)
        </div>
      )}

      {schedule && page === 0 && (
        <UpcomingList
          schedule={schedule}
          myLevel={settings.myLevel}
          language={settings.language}
        />
      )}

      {schedule && page === 1 && (
        <ScheduleList
          schedule={schedule}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          myLevel={settings.myLevel}
          language={settings.language}
        />
      )}

      {interactive && schedule && (
        <div className="pager">
          <button disabled={page === 0} onClick={() => setPage(0)}>
            ‹ Jetzt/Bald
          </button>
          <button disabled={page === 1} onClick={() => setPage(1)}>
            Ganzer Plan ›
          </button>
        </div>
      )}

      {interactive && !auth.isTeamMode && (
        <TeamWizard onCreate={auth.createTeam} onJoin={auth.joinTeam} />
      )}

      {interactive && auth.isTeamMode && auth.team && auth.member && (
        <>
          <TeamPanel
            api={auth.api}
            team={auth.team}
            member={auth.member}
            onLeave={() => void auth.leaveTeam()}
          />

          {worldBosses.data && (
            <WorldBossPanel
              data={worldBosses.data}
              onReportKill={async (locationId) => {
                await worldBosses.reportKill(locationId);
                setLastKillLocationId(locationId);
              }}
            />
          )}

          {lastKillRecord && (
            <CommentThread
              api={auth.api}
              killRecordId={lastKillRecord.id}
              liveComments={liveComments}
            />
          )}
        </>
      )}

      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onChange={updateSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
