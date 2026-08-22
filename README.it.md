🇬🇧 [English](README.md) · 🇩🇪 [Deutsch](README.de.md) · 🇪🇸 [Español](README.es.md) · 🇮🇹 **Italiano** · 🇫🇷 [Français](README.fr.md) · 🇹🇷 [Türkçe](README.tr.md) · 🇷🇺 [Русский](README.ru.md) · 🇵🇱 [Polski](README.pl.md) · 🇨🇳 [中文](README.zh.md)

# AION Timetable Overlay

Un overlay trasparente per Windows per il server privato AION 4.6 **OriginAion**, che resta visibile mentre giochi: programma di PvP Instances / Arenas / Siege / Rifts (fuso orario del server e locale, filtro per livello, 8 lingue), oltre al tracciamento morte/respawn a livello di team per 23 boss mondiali/keymaster (Dabra, Zumita, più altri 21 a Heiron, Tiamaranta, Inggison, Gelkmaros, Reshanta, Sarpan, Eltnen) con commenti condivisi.

## Architettura

Monorepo (pnpm workspaces):

```
apps/
  overlay/    Tauri v2 (Rust) + React/TypeScript – l'app overlay per Windows
  backend/    Fastify + Drizzle/SQLite + Playwright – API, WebSocket, scraper
packages/
  shared/     Tipi TypeScript condivisi tra backend e overlay
```

- **Fonte dati del programma:** Uno scraper Playwright legge periodicamente la vista settimanale di `originaion.com/schedule` (incluso il fuso orario attuale del server) e la salva nel backend. Le tab di quella pagina sono puramente lato client, quindi serve un vero browser headless invece di una semplice richiesta HTTP.
- **Modello di team:** Nessun login classico. Una persona crea un team (nome, descrizione, password) e ottiene un codice di invito; gli altri membri si uniscono con quel codice e un nome visualizzato. Le uccisioni e i commenti sono isolati per team (`teamId`); il proprietario del team può rinominare i membri in seguito.
- **Modalità standalone vs. team:** Senza unirsi a un team, l'app mostra solo il programma pubblico (`GET /schedule`, nessun login richiesto). Unendosi a un team si aggiungono commenti live e la bacheca dei boss mondiali via WebSocket.
- **Filtro per livello:** Le istanze dredgion/arena hanno requisiti di livello. Confermato per originaion.com: Engulfed Ophidan Bridge, Iron Wall Warfront, Kamar Battlefield e Arena of Glory (free-for-all a 4, solo la fascia più alta) sono esclusivamente di endgame con 61–65; Terath Dredgion, Arena of Chaos (free-for-all a 10), Arena of Discipline (1v1) e Arena of Harmony (3v3) invece si mettono in coda in una di quattro fasce di 5 livelli (46–50/51–55/56–60/61–65) — Terath Dredgion viene eseguito con un nome diverso per ciascuna fascia — e sono quindi accessibili nell'intero intervallo 46–65. L'app nasconde completamente le istanze che non corrispondono al livello impostato.

## Prerequisiti

- **Node.js** ≥ 20 e **pnpm** (`corepack enable && corepack prepare pnpm --activate`)
- **In aggiunta per la build dell'overlay (solo Windows, la piattaforma di destinazione):**
  - Rust (`rustup`, toolchain predefinita `stable-x86_64-pc-windows-msvc`)
  - Microsoft Visual Studio Build Tools con il workload *Desktop development with C++* (fornisce il linker MSVC di cui Rust ha bisogno su Windows)
  - WebView2 Runtime (già preinstallato su Windows 10/11 attuali)
- **Per l'esecuzione del backend:** un compilatore C (`build-essential` su Debian/Ubuntu) per compilare `better-sqlite3`, oltre alle dipendenze di sistema di Chromium richieste da Playwright (`pnpm exec playwright install-deps chromium`)

> Nota: l'app overlay deve essere eseguita come programma nativo Windows (trasparenza e scorciatoie globali su un gioco a schermo intero non funzionano da WSL/Linux). Lo sviluppo del backend funziona bene su WSL/Linux; `pnpm tauri dev`/`build` richiede un ambiente Windows nativo con Node + Rust.

## Setup

```bash
pnpm install
```

### Backend

```bash
cd apps/backend
cp .env.example .env        # imposta JWT_SECRET su un valore casuale lungo
pnpm exec drizzle-kit generate
pnpm run db:migrate
pnpm run db:seed             # inizializza tipi/posizioni dei boss mondiali + requisiti di livello
pnpm run dev                 # avvia l'API (porta 3000) + il cron dello scraper
```

Endpoint principali:
- `GET /schedule` – pubblico, restituisce il programma settimanale + l'offset del fuso orario del server
- `POST /teams`, `POST /teams/join` – creare/unirsi a un team
- `GET /world-bosses`, `POST /world-bosses/:locationId/kill` – richiede autenticazione
- `GET /comments`, `POST /comments` – richiede autenticazione
- `WS /ws?token=...` – aggiornamenti live per uccisioni/commenti/aggiornamento del programma

### App overlay (Windows)

```bash
cd apps/overlay
pnpm install
pnpm tauri dev      # sviluppo con hot reload
pnpm tauri build    # build di produzione (installer NSIS, vedi tauri.conf.json)
```

L'URL del backend è attualmente fisso in `apps/overlay/src/config.ts` su `https://timetable.skeeve.tv`.

## Scorciatoie globali

Funzionano a livello di sistema (anche quando il gioco ha il focus), a condizione che AION sia eseguito in **modalità finestra o senza bordi** – nessun overlay può essere renderizzato sopra lo schermo intero esclusivo (una limitazione di DWM che riguarda tutti gli strumenti overlay).

| Scorciatoia | Funzione |
|---|---|
| `Ctrl+Shift+O` | Attiva/disattiva la modalità interattiva/sposta (la finestra diventa cliccabile/spostabile, la procedura guidata del team e la bacheca dei boss mondiali diventano utilizzabili) |
| `Ctrl+F10` | Attiva/disattiva il pannello impostazioni (dimensione carattere, colore testo, livello personale) |

Entrambe le modalità disattivano temporaneamente il click-through; al di fuori di esse la finestra è completamente trasparente ai clic e non interferisce mai con l'input normale di gioco/desktop.

Poiché la finestra intenzionalmente non ha barra del titolo/pulsante di chiusura, è presente anche un'**icona nella tray** ("AION Timetable Overlay") con un menu al clic destro per "Impostazioni" e "Esci".

## Altri comportamenti

- **Primo avvio:** Al primissimo avvio, l'app si apre automaticamente in modalità interattiva + impostazioni, così i nuovi utenti possono posizionarla e configurarla immediatamente senza già conoscere le scorciatoie.
- **Reset:** Tutte le impostazioni (livello, colore, appartenenza al team, stato del primo avvio) risiedono come file JSON nella directory dati dell'app Tauri (`settings.json`, `auth.json`). Eliminare questi file resetta completamente l'app.
- **Chiusura automatica:** L'app monitora il processo del client AION (`aion.bin`). Una volta che il client è stato visto in esecuzione e poi si chiude, anche l'app overlay si chiude automaticamente.
- **Aggiornamento automatico:** Ad ogni avvio, l'app controlla in background l'ultima GitHub Release, scarica e installa un aggiornamento se disponibile, poi si riavvia - nessuna finestra di dialogo, nessun clic necessario.

## Deployment del server (riferimento)

Attualmente in produzione su `timetable.skeeve.tv`: Node.js + servizio systemd (senza Docker), SQLite locale al server, nginx come reverse proxy TLS (incluso l'upgrade WebSocket per `/ws`), certificato via certbot. Lo scraper viene eseguito ogni ora come parte del processo backend (`node-cron`).

La directory del server (`/opt/timetable`) è un normale checkout git di questo repository. Gli aggiornamenti passano attraverso due script in [`deploy/`](deploy/):
- [`deploy/timetable_install`](deploy/timetable_install) – script bootstrap stabile, recupera il branch `main` attuale e poi esegue `install-backend.sh` come processo nuovo (deliberatamente separato affinché uno script in esecuzione non sovrascriva se stesso a metà esecuzione tramite `git reset --hard`).
- [`deploy/install-backend.sh`](deploy/install-backend.sh) – installa le dipendenze del backend, applica le migrazioni del database in sospeso, aggiorna l'unità systemd ([`deploy/aion-timetable-backend.service`](deploy/aion-timetable-backend.service)) e riavvia il servizio.

Configurazione una tantum (come root sul server) – deliberatamente **copiato, non collegato simbolicamente**, affinché lo script bootstrap resti stabile anche mentre si aggiorna da solo tramite git:

```bash
cp /opt/timetable/deploy/timetable_install /usr/local/bin/timetable_install
chmod +x /usr/local/bin/timetable_install
```

Dopodiché, ogni aggiornamento è semplicemente:

```bash
timetable_install
```

Se `deploy/timetable_install` stesso dovesse mai cambiare, ripetere una volta il passaggio `cp` sopra.

## Release

Il push di un tag come `v0.1.0` (o l'esecuzione manuale del workflow dalla tab Actions) attiva [`.github/workflows/release.yml`](.github/workflows/release.yml), che compila l'installer Windows e pubblica una Release GitHub con:
- `AION-Timetable-Overlay_x.y.z_x64-setup.exe` – installer NSIS
- `latest.json` – manifest firmato contro cui l'updater integrato dell'app effettua il controllo

Richiede di impostare una tantum i secret del repository `TAURI_SIGNING_PRIVATE_KEY` e `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (Settings → Secrets and variables → Actions).

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Qualità dei dati sui boss mondiali

I 23 boss mondiali/keymaster hanno diversi livelli di confidenza (vedi i commenti in `apps/backend/src/db/seed.ts`):
- **Dabra/Zumita:** finestra di respawn fornita direttamente dall'utente (massima confidenza per questa app).
- **16 boss mondiali** (Heiron/Tiamaranta/Inggison/Gelkmaros/Reshanta/Sarpan/Eltnen): tempi di respawn dall'emulatore open source `beyond-aion/aion-server` (estratti dai dati di gioco, confidenza medio-alta, non una fonte ufficiale).
- **Medeus the Vile, Moltenus, Governor/Berserker/Commander Sunayaka:** non seguono un vero ciclo uccisione→respawn (finestra programmata notturna o settimanale) – approssimati nel tracker delle uccisioni come una finestra approssimativa di ~1 giorno/~1 settimana, confidenza inferiore.

Esclusi deliberatamente: Isbariya the Resolute, Hyperion e Queen Modor (tutte le 4 varianti) sono boss di istanza con blocco settimanale, non spawn nel mondo aperto. "Kordac" e "Dragon Lord's Champion" sono stati cercati estensivamente e non esistono sotto alcuna grafia in AION – deliberatamente non aggiunti invece di inventare dati.

## Punti aperti

- I requisiti di livello per i dredgion sono ancora presi da un altro server 4.6 (i valori delle arene sono già confermati direttamente per originaion.com) e dovrebbero essere infine verificati contro il server reale una volta che sarà di nuovo online.
- Tutti i boss mondiali hanno ora marker di mappa reali e cliccabili (Heiron, Inggison, Gelkmaros, Reshanta, Sarpan, Tiamaranta, Tiamaranta's Eye, Eltnen); sia le coordinate che le immagini della mappa provengono da aioncodex.com; solo Commander Sunayaka non ha dati di mappa disponibili e usa ancora solo la selezione da lista.
- I 21 nuovi boss mondiali non sono ancora tradotti in tutte le 8 lingue (usano il nome inglese come fallback).
