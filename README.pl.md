🇬🇧 [English](README.md) · 🇩🇪 [Deutsch](README.de.md) · 🇪🇸 [Español](README.es.md) · 🇮🇹 [Italiano](README.it.md) · 🇫🇷 [Français](README.fr.md) · 🇹🇷 [Türkçe](README.tr.md) · 🇷🇺 [Русский](README.ru.md) · 🇵🇱 **Polski** · 🇨🇳 [中文](README.zh.md)

# AION Timetable Overlay

Przezroczysty overlay dla Windows dla prywatnego serwera AION 4.6 **OriginAion**, który pozostaje widoczny podczas gry: harmonogram PvP Instances / Arenas / Siege / Rifts (czas serwera i lokalny, filtrowanie po poziomie, 8 języków), a także śledzenie zabić/odrodzeń na poziomie zespołu dla 23 bossów światowych/keymasterów (Dabra, Zumita oraz 21 kolejnych w Heiron, Tiamaranta, Inggison, Gelkmaros, Reshanta, Sarpan, Eltnen) wraz ze współdzielonymi komentarzami.

## Architektura

Monorepo (pnpm workspaces):

```
apps/
  overlay/    Tauri v2 (Rust) + React/TypeScript – aplikacja overlay dla Windows
  backend/    Fastify + Drizzle/SQLite + Playwright – API, WebSocket, scraper
packages/
  shared/     Wspólne typy TypeScript między backendem i overlayem
```

- **Źródło danych harmonogramu:** Scraper oparty na Playwright okresowo odczytuje widok tygodniowy strony `originaion.com/schedule` (wraz z aktualną strefą czasową serwera) i zapisuje go w backendzie. Zakładki na tej stronie działają wyłącznie po stronie klienta, więc potrzebna jest prawdziwa przeglądarka headless, a nie prosty request HTTP.
- **Model zespołu:** Brak klasycznego logowania. Jedna osoba tworzy zespół (nazwa, opis, hasło) i otrzymuje kod zaproszenia; kolejni członkowie dołączają za pomocą tego kodu i wyświetlanej nazwy. Zabicia i komentarze są odizolowane per zespół (`teamId`); właściciel zespołu może później zmieniać nazwy członków.
- **Tryb samodzielny vs. zespołowy:** Bez przyłączenia do zespołu aplikacja pokazuje tylko publiczny harmonogram (`GET /schedule`, logowanie nie jest wymagane). Przyłączenie do zespołu dodaje komentarze na żywo i tablicę bossów światowych przez WebSocket.
- **Filtrowanie po poziomie:** Instancje dredgion/arena mają wymagania poziomowe. Potwierdzone dla originaion.com: Engulfed Ophidan Bridge, Iron Wall Warfront, Kamar Battlefield i Arena of Glory (4-osobowy free-for-all, tylko najwyższy bracket) są dostępne wyłącznie w endgame'ie na poziomie 61–65; Terath Dredgion, Arena of Chaos (10-osobowy free-for-all), Arena of Discipline (1v1) i Arena of Harmony (3v3) natomiast trafiają do jednego z czterech 5-poziomowych bracketów (46–50/51–55/56–60/61–65) – Terath Dredgion działa pod inną nazwą w zależności od bracketu – i są dzięki temu dostępne w całym zakresie 46–65. Aplikacja całkowicie skrywa instancje, które nie odpowiadają poziomowi ustawionemu w opcjach.

## Wymagania

- **Node.js** ≥ 20 i **pnpm** (`corepack enable && corepack prepare pnpm --activate`)
- **Dodatkowo do budowy overlaya (tylko Windows, docelowa platforma):**
  - Rust (`rustup`, domyślny toolchain `stable-x86_64-pc-windows-msvc`)
  - Microsoft Visual Studio Build Tools z komponentem *Desktop development with C++* (dostarcza linker MSVC, którego Rust potrzebuje na Windows)
  - WebView2 Runtime (już preinstalowany na aktualnych wersjach Windows 10/11)
- **Do działania backendu:** kompilator C (`build-essential` na Debianie/Ubuntu) do zbudowania `better-sqlite3`, a także wymagane przez Playwright zależności systemowe Chromium (`pnpm exec playwright install-deps chromium`)

> Uwaga: aplikacja overlay musi działać jako natywny program Windows (przezroczystość i globalne skróty klawiszowe nad grą w pełnym ekranie nie działają z WSL/Linuxa). Rozwój backendu działa bez problemu pod WSL/Linuxem; `pnpm tauri dev`/`build` wymaga natywnego środowiska Windows z Node + Rust.

## Instalacja

```bash
pnpm install
```

### Backend

```bash
cd apps/backend
cp .env.example .env        # ustaw JWT_SECRET na długą, losową wartość
pnpm exec drizzle-kit generate
pnpm run db:migrate
pnpm run db:seed             # inicjalizuje typy/lokalizacje bossów światowych + wymagania poziomowe
pnpm run dev                 # uruchamia API (port 3000) + cron scrapera
```

Najważniejsze endpointy:
- `GET /schedule` – publiczny, zwraca tygodniowy harmonogram + przesunięcie strefy czasowej serwera
- `POST /teams`, `POST /teams/join` – utwórz/przyłącz się do zespołu
- `GET /world-bosses`, `POST /world-bosses/:locationId/kill` – wymaga autoryzacji
- `GET /comments`, `POST /comments` – wymaga autoryzacji
- `WS /ws?token=...` – aktualizacje na żywo dla zabić/komentarzy/odświeżenia harmonogramu

### Aplikacja overlay (Windows)

```bash
cd apps/overlay
pnpm install
pnpm tauri dev      # rozwój z hot reload
pnpm tauri build    # build produkcyjny (instalator NSIS, zob. tauri.conf.json)
```

Adres URL backendu jest obecnie zaszyty na stałe w `apps/overlay/src/config.ts` jako `https://timetable.skeeve.tv`.

## Globalne skróty klawiszowe

Działają w całym systemie (nawet gdy gra ma fokus), o ile AION działa w **trybie okienkowym lub bez ramki** – żaden overlay nie może się wyświetlić nad wyłącznym pełnym ekranem (ograniczenie DWM, dotyczące wszystkich narzędzi typu overlay).

| Skrót | Funkcja |
|---|---|
| `Ctrl+Shift+O` | Przełącza tryb interaktywny/przesuwania (okno staje się klikalne/przesuwalne, kreator zespołu i tablica bossów światowych stają się dostępne) |
| `Ctrl+F10` | Przełącza panel ustawień (rozmiar czcionki, kolor tekstu, własny poziom) |

Oba tryby tymczasowo wyłączają przezroczystość na kliknięcia; poza nimi okno jest całkowicie przezroczyste na kliknięcia i nigdy nie zakłóca normalnego wprowadzania danych w grze/na pulpicie.

Ponieważ okno celowo nie ma paska tytułu/przycisku zamykania, dostępna jest również **ikona w zasobniku systemowym** ("AION Timetable Overlay") z menu prawego przycisku myszy dla „Ustawienia" i „Zamknij".

## Inne zachowania

- **Pierwsze uruchomienie:** Podczas pierwszego uruchomienia aplikacja automatycznie otwiera się w trybie interaktywnym + ustawień, aby nowi użytkownicy mogli natychmiast ją ustawić i skonfigurować, nie znając jeszcze skrótów klawiszowych.
- **Reset:** Wszystkie ustawienia (poziom, kolor, przynależność do zespołu, status pierwszego uruchomienia) znajdują się jako pliki JSON w katalogu danych aplikacji Tauri (`settings.json`, `auth.json`). Usunięcie tych plików całkowicie resetuje aplikację.
- **Automatyczne zamykanie:** Aplikacja monitoruje proces klienta AION (`aion.bin`). Gdy klient zostanie zaobserwowany jako działający, a następnie zostanie zamknięty, aplikacja overlay również automatycznie się zamyka.

## Wdrożenie serwera (informacja)

Obecnie działa produkcyjnie na `timetable.skeeve.tv`: Node.js + usługa systemd (bez Dockera), SQLite lokalnie na serwerze, nginx jako reverse proxy TLS (włącznie z upgrade WebSocket dla `/ws`), certyfikat przez certbot. Scraper działa co godzinę jako część procesu backendu (`node-cron`).

Katalog serwera (`/opt/timetable`) jest normalnym checkoutem git tego repozytorium. Aktualizacje przechodzą przez dwa skrypty w [`deploy/`](deploy/):
- [`deploy/timetable_install`](deploy/timetable_install) – stabilny skrypt bootstrap, pobiera aktualną gałąź `main`, a następnie uruchamia `install-backend.sh` jako nowy proces (celowo oddzielony, aby działający skrypt nie nadpisał sam siebie w trakcie wykonywania przez `git reset --hard`).
- [`deploy/install-backend.sh`](deploy/install-backend.sh) – instaluje zależności backendu, stosuje oczekujące migracje bazy danych, aktualizuje jednostkę systemd ([`deploy/aion-timetable-backend.service`](deploy/aion-timetable-backend.service)) i ponownie uruchamia usługę.

Jednorazowa konfiguracja (jako root na serwerze) – celowo **skopiowana, a nie zrobiona jako dowiązanie symboliczne**, aby skrypt bootstrap pozostał stabilny nawet podczas samoaktualizacji przez git:

```bash
cp /opt/timetable/deploy/timetable_install /usr/local/bin/timetable_install
chmod +x /usr/local/bin/timetable_install
```

Po tym każda aktualizacja to po prostu:

```bash
timetable_install
```

Jeśli `deploy/timetable_install` sam się kiedyś zmieni, powtórz raz krok `cp` powyżej.

## Wydania (Releases)

Wypchnięcie tagu takiego jak `v0.1.0` (lub ręczne uruchomienie workflow z zakładki Actions) uruchamia [`.github/workflows/release.yml`](.github/workflows/release.yml), który buduje instalator Windows i publikuje GitHub Release z:
- `AION-Timetable-Overlay_x.y.z_x64-setup.exe` – instalator NSIS
- `AION-Timetable-Overlay_x.y.z_x64-setup.nsis.zip` – przenośny ZIP, instalacja niepotrzebna
- `latest.json` – podpisany manifest, względem którego wbudowany updater aplikacji sprawdza dostępność aktualizacji

Wymaga jednorazowego ustawienia sekretów repozytorium `TAURI_SIGNING_PRIVATE_KEY` i `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (Settings → Secrets and variables → Actions).

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Jakość danych o bossach światowych

23 bossów światowych/keymasterów ma różne poziomy wiarygodności (zob. komentarze w `apps/backend/src/db/seed.ts`):
- **Dabra/Zumita:** okno odrodzenia podane bezpośrednio przez użytkownika (najwyższa wiarygodność dla tej aplikacji).
- **16 bossów światowych** (Heiron/Tiamaranta/Inggison/Gelkmaros/Reshanta/Sarpan/Eltnen): czasy odrodzenia z open-source'owego emulatora `beyond-aion/aion-server` (wyodrębnione z danych gry, wiarygodność średnio-wysoka, nie jest to źródło oficjalne).
- **Medeus the Vile, Moltenus, Governor/Berserker/Commander Sunayaka:** nie podlegają prawdziwemu cyklowi zabicie→odrodzenie (nocne lub tygodniowe zaplanowane okno) – w trackerze zabić przybliżone jako okno rzędu ~1 dnia/~1 tygodnia, niższa wiarygodność.

Celowo wykluczone: Isbariya the Resolute, Hyperion i Queen Modor (wszystkie 4 warianty) są bossami instancji z tygodniową blokadą, a nie spawnami w otwartym świecie. „Kordac" i „Dragon Lord's Champion" zostały szeroko poszukane i nie istnieją pod żadnym zapisem w AION – celowo nie dodane, zamiast wymyślać dane.

## Otwarte punkty

- Wymagania poziomowe dla dredgionów wciąż pochodzą z innego serwera 4.6 (wartości aren są już bezpośrednio potwierdzone dla originaion.com) i powinny zostać ostatecznie zweryfikowane na rzeczywistym serwerze, gdy ten znów będzie online.
- Tiamaranta's Eye (Dabra/Zumita) ma już prawdziwą mapę z klikalnymi znacznikami (współrzędne i sam obraz mapy pochodzą z aioncodex.com); bossowie światowi w innych zonach wciąż używają tylko wyboru z listy.
- 21 nowych bossów światowych nie jest jeszcze przetłumaczonych na wszystkie 8 języków (używana jest angielska nazwa jako rezerwowa).
