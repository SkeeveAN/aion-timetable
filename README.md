# AION Timetable Overlay

Ein transparentes Windows-Overlay für den privaten AION-4.6-Server **OriginAion**, das während des Spielens eingeblendet bleibt: Zeitplan für PvP Instances / Arenas / Siege / Rifts (Server- und lokale Zeitzone, Level-Filterung), plus team-internes Tracking der Weltboss-Spawns (Dabra, Zumitas) in Tiamaranta's Eye inklusive gemeinsamer Kommentare.

## Architektur

Monorepo (pnpm workspaces):

```
apps/
  overlay/    Tauri v2 (Rust) + React/TypeScript – die Windows-Overlay-App
  backend/    Fastify + Drizzle/SQLite + Playwright – API, WebSocket, Scraper
packages/
  shared/     Gemeinsame TypeScript-Typen zwischen Backend und Overlay
```

- **Datenquelle Zeitplan:** Ein Playwright-Scraper liest periodisch die Wochenansicht von `originaion.com/schedule` (inkl. der aktuellen Server-Zeitzone) aus und speichert sie im Backend. Die Tabs auf der Zielseite sind rein clientseitig, daher ein echter Headless-Browser statt einfachem HTTP-Fetch.
- **Team-Modell:** Kein klassisches Login. Eine Person erstellt ein Team (Name, Beschreibung, Passwort) und erhält einen Einladungscode; weitere Mitglieder treten mit diesem Code und einem Anzeigenamen bei. Kills und Kommentare sind pro Team isoliert (`teamId`), der Team-Owner kann Anzeigenamen von Mitgliedern nachträglich ändern.
- **Standalone- vs. Team-Modus:** Ohne Team-Beitritt zeigt die App nur den öffentlichen Zeitplan (`GET /schedule`, kein Login nötig). Mit Team-Beitritt kommen Live-Kommentare und die Weltboss-Karte via WebSocket dazu.
- **Level-Filterung:** Dredgion/Arena-Instanzen haben Level-Anforderungen. Bestätigt für originaion.com: Terath Dredgion 56–65; Engulfed Ophidan Bridge, Iron Wall Warfront, Kamar Battlefield und Arena of Glory (4er alle-gegen-alle, nur oberstes Bracket) 61–65; Arena of Chaos (10er alle-gegen-alle), Arena of Discipline (1v1) und Arena of Harmony (3v3) queuen dagegen in eines von vier 5er-Level-Brackets (46–50/51–55/56–60/61–65) und sind daher im gesamten Bereich 46–65 zugänglich. Die App blendet Instanzen komplett aus, die nicht zum in den Einstellungen hinterlegten eigenen Level passen.

## Voraussetzungen

- **Node.js** ≥ 20 und **pnpm** (`corepack enable && corepack prepare pnpm --activate`)
- **Für den Overlay-Build zusätzlich (nur Windows, da Zielplattform):**
  - Rust (`rustup`, Standard-Toolchain `stable-x86_64-pc-windows-msvc`)
  - Microsoft Visual Studio Build Tools mit dem Workload *Desktop development with C++* (liefert den MSVC-Linker, den Rust unter Windows braucht)
  - WebView2 Runtime (auf aktuellem Windows 10/11 bereits vorinstalliert)
- **Für den Backend-Betrieb:** ein C-Compiler (`build-essential` unter Debian/Ubuntu) zum Bauen von `better-sqlite3`, sowie die von Playwright benötigten Chromium-Systemabhängigkeiten (`pnpm exec playwright install-deps chromium`)

> Hinweis: Die Overlay-App muss als natives Windows-Programm laufen (Transparenz, globale Hotkeys über einem Vollbild-Spiel funktionieren nicht aus WSL/Linux heraus). Backend-Entwicklung kann problemlos unter WSL/Linux erfolgen; für `pnpm tauri dev`/`build` wird eine native Windows-Umgebung mit Node + Rust benötigt.

## Setup

```bash
pnpm install
```

### Backend

```bash
cd apps/backend
cp .env.example .env        # JWT_SECRET auf einen langen Zufallswert setzen
pnpm exec drizzle-kit generate
pnpm run db:migrate
pnpm run db:seed             # seedet Weltboss-Typen/Orte + Level-Anforderungen
pnpm run dev                 # startet API (Port 3000) + Scraper-Cron
```

Wichtige Endpunkte:
- `GET /schedule` – öffentlich, liefert den Wochenplan + Server-Zeitzonen-Offset
- `POST /teams`, `POST /teams/join` – Team erstellen/beitreten
- `GET /world-bosses`, `POST /world-bosses/:locationId/kill` – auth-pflichtig
- `GET /comments`, `POST /comments` – auth-pflichtig
- `WS /ws?token=...` – Live-Updates für Kills/Kommentare/Zeitplan-Refresh

### Overlay-App (Windows)

```bash
cd apps/overlay
pnpm install
pnpm tauri dev      # Entwicklung mit Hot-Reload
pnpm tauri build    # Produktions-Build (NSIS-Installer, siehe tauri.conf.json)
```

Die Backend-URL ist aktuell fest in `apps/overlay/src/config.ts` auf `https://timetable.skeeve.tv` gesetzt.

## Globale Hotkeys

Funktionieren systemweit (auch wenn das Spiel fokussiert ist), solange AION im **Fenster- oder Borderless-Modus** läuft – bei exklusivem Vollbild rendert grundsätzlich kein Overlay darüber (DWM-Limitierung, betrifft alle Overlay-Tools).

| Hotkey | Funktion |
|---|---|
| `Strg+Umschalt+O` | Interaktions-/Verschieben-Modus umschalten (Fenster wird klickbar/verschiebbar, Team-Wizard und Weltboss-Karte werden bedienbar) |
| `Strg+F10` | Settings-Panel umschalten (Schriftgröße, Textfarbe, eigenes Level) |

Beide Modi deaktivieren temporär den Klick-durch-Modus; außerhalb dieser Modi ist das Fenster vollständig klickdurchlässig und stört nie normale Spiel-/Desktop-Eingaben.

Da das Fenster bewusst ohne Titelleiste/Schließen-Button läuft, gibt es zusätzlich ein **Tray-Icon** ("AION Timetable Overlay") mit Rechtsklick-Menü für „Einstellungen" und „Beenden".

## Sonstiges Verhalten

- **Erststart:** Beim allerersten Start öffnet sich die App automatisch im Interaktions- und Settings-Modus, damit neue Nutzer sie sofort platzieren und konfigurieren können, ohne die Hotkeys schon zu kennen.
- **Reset:** Alle Einstellungen (Level, Farbe, Team-Zugehörigkeit, Erststart-Status) liegen als JSON-Dateien im Tauri-App-Datenverzeichnis (`settings.json`, `auth.json`). Löschen dieser Dateien setzt die App vollständig zurück.
- **Auto-Beenden:** Die App überwacht den AION-Client-Prozess (`aion.bin`). Sobald der Client einmal lief und danach beendet wird, schließt sich die Overlay-App automatisch mit.

## Server-Deployment (Referenz)

Aktuell produktiv unter `timetable.skeeve.tv` betrieben: Node.js + systemd-Service (kein Docker), SQLite lokal auf dem Server, nginx als TLS-Reverse-Proxy (inkl. WebSocket-Upgrade für `/ws`), Zertifikat via certbot. Der Scraper läuft stündlich als Teil des Backend-Prozesses (`node-cron`).

Das Server-Verzeichnis (`/opt/timetable`) ist ein normaler Git-Checkout dieses Repos. Updates laufen über zwei Skripte in [`deploy/`](deploy/):
- [`deploy/timetable_install`](deploy/timetable_install) – stabiles Bootstrap-Skript, holt den aktuellen `main`-Branch und startet danach `install-backend.sh` als frischen Prozess (bewusst getrennt, damit sich ein laufendes Skript nicht mitten in der Ausführung selbst per `git reset --hard` überschreibt).
- [`deploy/install-backend.sh`](deploy/install-backend.sh) – installiert die Backend-Abhängigkeiten, wendet ausstehende DB-Migrationen an, aktualisiert die systemd-Unit ([`deploy/aion-timetable-backend.service`](deploy/aion-timetable-backend.service)) und startet den Service neu.

Einmalig einrichten (als root auf dem Server) – bewusst **kopieren, nicht verlinken**, damit das Bootstrap-Skript stabil bleibt, auch während es sich selbst per Git aktualisiert:

```bash
cp /opt/timetable/deploy/timetable_install /usr/local/bin/timetable_install
chmod +x /usr/local/bin/timetable_install
```

Danach reicht für jedes Update:

```bash
timetable_install
```

Falls sich `deploy/timetable_install` selbst mal ändert, einmalig den `cp`-Schritt oben wiederholen.

## Offene Punkte

- Level-Anforderungen für Dredgions sind noch von einem anderen 4.6-Server übernommen (Arena-Werte sind für originaion.com bereits direkt bestätigt) und sollten final gegen den echten Server verifiziert werden, sobald er wieder online ist.
- Klick-Koordinaten für die Weltboss-Orte auf der Tiamaranta's-Eye-Karte sind noch nicht gepinnt (Listenauswahl funktioniert bereits, klickbare Kartenmarker folgen).
- CI/CD-Workflow für automatische GitHub-Releases (Installer + ZIP + Auto-Updater) ist noch nicht eingerichtet.
