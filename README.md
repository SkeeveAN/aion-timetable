🇬🇧 **English** · 🇩🇪 [Deutsch](README.de.md) · 🇪🇸 [Español](README.es.md) · 🇮🇹 [Italiano](README.it.md) · 🇫🇷 [Français](README.fr.md) · 🇹🇷 [Türkçe](README.tr.md) · 🇷🇺 [Русский](README.ru.md) · 🇵🇱 [Polski](README.pl.md) · 🇨🇳 [中文](README.zh.md)

# AION Timetable Overlay

A transparent Windows overlay for the private AION 4.6 server **OriginAion**, staying on top while you play: schedule for PvP Instances / Arenas / Siege / Rifts (server and local time zone, level filtering, 8 languages), plus team-internal kill/respawn tracking for 23 world bosses/keymasters (Dabra, Zumita, plus 21 more across Heiron, Tiamaranta, Inggison, Gelkmaros, Reshanta, Sarpan, Eltnen) including shared comments.

## Architecture

Monorepo (pnpm workspaces):

```
apps/
  overlay/    Tauri v2 (Rust) + React/TypeScript – the Windows overlay app
  backend/    Fastify + Drizzle/SQLite + Playwright – API, WebSocket, scraper
packages/
  shared/     Shared TypeScript types between backend and overlay
```

- **Schedule data source:** A Playwright scraper periodically reads the weekly view of `originaion.com/schedule` (including the current server time zone) and stores it in the backend. The tabs on that page are purely client-side, so a real headless browser is needed rather than a plain HTTP fetch.
- **Team model:** No classic login. One person creates a team (name, description, password) and gets an invite code; other members join with that code and a display name. Kills and comments are isolated per team (`teamId`); the team owner can rename members afterwards.
- **Standalone vs. team mode:** Without joining a team, the app only shows the public schedule (`GET /schedule`, no login required). Joining a team adds live comments and the world boss board via WebSocket.
- **Level filtering:** Dredgion/arena instances have level requirements. Confirmed for originaion.com: Engulfed Ophidan Bridge, Iron Wall Warfront, Kamar Battlefield and Arena of Glory (4-man free-for-all, top bracket only) are endgame-only at 61–65; Terath Dredgion, Arena of Chaos (10-man free-for-all), Arena of Discipline (1v1) and Arena of Harmony (3v3) instead queue into one of four 5-level brackets (46–50/51–55/56–60/61–65) — Terath Dredgion runs under a different in-game name per bracket — and are therefore accessible across the full 46–65 range. The app completely hides instances that don't match the level set in its settings.

## Prerequisites

- **Node.js** ≥ 20 and **pnpm** (`corepack enable && corepack prepare pnpm --activate`)
- **Additionally for the overlay build (Windows only, as that's the target platform):**
  - Rust (`rustup`, default toolchain `stable-x86_64-pc-windows-msvc`)
  - Microsoft Visual Studio Build Tools with the *Desktop development with C++* workload (provides the MSVC linker Rust needs on Windows)
  - WebView2 Runtime (already preinstalled on current Windows 10/11)
- **For running the backend:** a C compiler (`build-essential` on Debian/Ubuntu) to build `better-sqlite3`, plus Playwright's Chromium system dependencies (`pnpm exec playwright install-deps chromium`)

> Note: the overlay app must run as a native Windows program (transparency and global hotkeys over a fullscreen game don't work from WSL/Linux). Backend development works fine under WSL/Linux; `pnpm tauri dev`/`build` needs a native Windows environment with Node + Rust.

## Setup

```bash
pnpm install
```

### Backend

```bash
cd apps/backend
cp .env.example .env        # set JWT_SECRET to a long random value
pnpm exec drizzle-kit generate
pnpm run db:migrate
pnpm run db:seed             # seeds world boss types/locations + level requirements
pnpm run dev                 # starts the API (port 3000) + scraper cron
```

Key endpoints:
- `GET /schedule` – public, returns the weekly schedule + server time zone offset
- `POST /teams`, `POST /teams/join` – create/join a team
- `GET /world-bosses`, `POST /world-bosses/:locationId/kill` – auth required
- `GET /comments`, `POST /comments` – auth required
- `WS /ws?token=...` – live updates for kills/comments/schedule refresh

### Overlay app (Windows)

```bash
cd apps/overlay
pnpm install
pnpm tauri dev      # development with hot reload
pnpm tauri build    # production build (NSIS installer, see tauri.conf.json)
```

The backend URL is currently hardcoded to `https://timetable.skeeve.tv` in `apps/overlay/src/config.ts`.

## Global hotkeys

Work system-wide (even while the game is focused), as long as AION runs in **windowed or borderless mode** – no overlay can render on top of exclusive fullscreen (a DWM limitation affecting all overlay tools).

| Hotkey | Function |
|---|---|
| `Ctrl+Shift+O` | Toggle interactive/move mode (window becomes clickable/movable, team wizard and world boss board become usable) |
| `Ctrl+F10` | Toggle the settings panel (font size, text color, own level) |

Both modes temporarily disable click-through; outside of them the window is fully click-through and never interferes with normal game/desktop input.

Since the window intentionally has no title bar/close button, there's also a **tray icon** ("AION Timetable Overlay") with a right-click menu for "Settings" and "Quit".

## Other behavior

- **First launch:** On the very first launch, the app automatically opens in interactive + settings mode so new users can immediately position and configure it without already knowing the hotkeys.
- **Reset:** All settings (level, color, team membership, first-launch status) live as JSON files in the Tauri app data directory (`settings.json`, `auth.json`). Deleting these files fully resets the app.
- **Auto-quit:** The app watches the AION client process (`aion.bin`). Once the client has been seen running and then closes, the overlay app quits automatically too.

## Server deployment (reference)

Currently running in production at `timetable.skeeve.tv`: Node.js + systemd service (no Docker), SQLite local to the server, nginx as a TLS reverse proxy (including WebSocket upgrade for `/ws`), certificate via certbot. The scraper runs hourly as part of the backend process (`node-cron`).

The server directory (`/opt/timetable`) is a normal git checkout of this repo. Updates go through two scripts in [`deploy/`](deploy/):
- [`deploy/timetable_install`](deploy/timetable_install) – stable bootstrap script, pulls the current `main` branch and then execs into `install-backend.sh` as a fresh process (deliberately separate so a running script doesn't overwrite itself mid-execution via `git reset --hard`).
- [`deploy/install-backend.sh`](deploy/install-backend.sh) – installs backend dependencies, applies pending DB migrations, updates the systemd unit ([`deploy/aion-timetable-backend.service`](deploy/aion-timetable-backend.service)) and restarts the service.

One-time setup (as root on the server) – deliberately **copied, not symlinked**, so the bootstrap script stays stable even while it updates itself via git:

```bash
cp /opt/timetable/deploy/timetable_install /usr/local/bin/timetable_install
chmod +x /usr/local/bin/timetable_install
```

After that, every update is just:

```bash
timetable_install
```

If `deploy/timetable_install` itself ever changes, repeat the `cp` step above once.

## Releases

Pushing a tag like `v0.1.0` (or running the workflow manually from the Actions tab) triggers [`.github/workflows/release.yml`](.github/workflows/release.yml), which builds the Windows installer and publishes a GitHub Release with:
- `AION-Timetable-Overlay_x.y.z_x64-setup.exe` – NSIS installer
- `AION-Timetable-Overlay_x.y.z_x64-setup.nsis.zip` – portable ZIP, no installation needed
- `latest.json` – signed manifest the app's built-in updater checks against

Requires the `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` repository secrets (Settings → Secrets and variables → Actions) to be set once.

```bash
git tag v0.1.0
git push origin v0.1.0
```

## World boss data quality

The 23 world bosses/keymasters have different confidence levels (see comments in `apps/backend/src/db/seed.ts`):
- **Dabra/Zumita:** respawn window given directly by the user (highest confidence for this app).
- **16 world bosses** (Heiron/Tiamaranta/Inggison/Gelkmaros/Reshanta/Sarpan/Eltnen): respawn times from the open-source emulator `beyond-aion/aion-server` (datamined, medium-high confidence, not an official source).
- **Medeus the Vile, Moltenus, Governor/Berserker/Commander Sunayaka:** don't follow a real kill→respawn cycle (nightly or weekly scheduled window) – approximated in the kill tracker as a rough ~1-day/~1-week window, lower confidence.

Deliberately excluded: Isbariya the Resolute, Hyperion, and Queen Modor (all 4 variants) are instanced bosses with a weekly lockout, not open-world spawns. "Kordac" and "Dragon Lord's Champion" were searched extensively and do not exist under any spelling in AION – deliberately not added rather than inventing data.

## Open items

- Level requirements for dredgions are still taken from a different 4.6 server (arena values are already directly confirmed for originaion.com) and should be finally verified against the real server once it's back online.
- Tiamaranta's Eye (Dabra/Zumita) now has a real map with clickable pins (coordinates and the map image itself both sourced from aioncodex.com's own zone map); the other zones' world bosses still use list-only location selection.
- The 21 new world bosses aren't translated into all 8 languages yet (fall back to the English name).
