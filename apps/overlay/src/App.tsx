import { useEffect, useState } from "react";
import type { Comment, ScheduleCategory } from "@aion-timetable/shared";
import { useSchedule } from "./hooks/useSchedule";
import { useAuth } from "./hooks/useAuth";
import { useSettings } from "./hooks/useSettings";
import { useInteractiveMode } from "./hooks/useInteractiveMode";
import { useAutoUpdate } from "./hooks/useAutoUpdate";
import { useWorldBosses } from "./hooks/useWorldBosses";
import { useLiveUpdates } from "./hooks/useLiveUpdates";
import { UpcomingList } from "./components/UpcomingList";
import { ScheduleList } from "./components/ScheduleList";
import { SettingsPanel } from "./components/SettingsPanel";
import { TeamWizard } from "./components/TeamWizard";
import { TeamPanel } from "./components/TeamPanel";
import { WorldBossPanel } from "./components/WorldBossPanel";
import { CommentThread } from "./components/CommentThread";
import { t } from "./lib/uiStrings";
import "./App.css";

export default function App() {
  const auth = useAuth();
  const { settings, update: updateSettings, loaded: settingsLoaded } = useSettings();
  const { data: schedule, reload: reloadSchedule } = useSchedule(settings.language);
  const { interactive, setInteractive, settingsOpen, setSettingsOpen, startDrag } =
    useInteractiveMode();
  const updateStatus = useAutoUpdate();

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

  const strings = t(settings.language);

  return (
    <div
      className="overlay-root"
      style={{ fontSize: settings.fontSize, color: settings.textColor }}
    >
      {updateStatus === "downloading" && (
        <div className="update-banner">{strings.updateBanner}</div>
      )}

      {interactive && (
        <div className="drag-handle" onMouseDown={() => void startDrag()}>
          {strings.dragHandle}
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
            {strings.pagerNow}
          </button>
          <button disabled={page === 1} onClick={() => setPage(1)}>
            {strings.pagerFull}
          </button>
        </div>
      )}

      {interactive && !auth.isTeamMode && (
        <TeamWizard
          language={settings.language}
          onCreate={auth.createTeam}
          onJoin={auth.joinTeam}
          onOwnerLogin={auth.ownerLogin}
        />
      )}

      {interactive && auth.isTeamMode && auth.team && auth.member && (
        <>
          <TeamPanel
            api={auth.api}
            team={auth.team}
            member={auth.member}
            language={settings.language}
            onLeave={() => void auth.leaveTeam()}
          />

          {worldBosses.data && (
            <WorldBossPanel
              data={worldBosses.data}
              language={settings.language}
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
              language={settings.language}
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
