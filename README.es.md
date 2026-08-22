🇬🇧 [English](README.md) · 🇩🇪 [Deutsch](README.de.md) · 🇪🇸 **Español** · 🇮🇹 [Italiano](README.it.md) · 🇫🇷 [Français](README.fr.md) · 🇹🇷 [Türkçe](README.tr.md) · 🇷🇺 [Русский](README.ru.md) · 🇵🇱 [Polski](README.pl.md) · 🇨🇳 [中文](README.zh.md)

# AION Timetable Overlay

Una superposición (overlay) transparente para Windows para el servidor privado de AION 4.6 **OriginAion**, que permanece visible mientras juegas: horario de PvP Instances / Arenas / Siege / Rifts (zona horaria del servidor y local, filtrado por nivel, 8 idiomas), además de seguimiento de muerte/reaparición a nivel de equipo para 23 jefes de mundo/keymasters (Dabra, Zumita, más otros 21 en Heiron, Tiamaranta, Inggison, Gelkmaros, Reshanta, Sarpan, Eltnen) con comentarios compartidos.

## Arquitectura

Monorepo (pnpm workspaces):

```
apps/
  overlay/    Tauri v2 (Rust) + React/TypeScript – la app de overlay para Windows
  backend/    Fastify + Drizzle/SQLite + Playwright – API, WebSocket, scraper
packages/
  shared/     Tipos de TypeScript compartidos entre backend y overlay
```

- **Fuente de datos del horario:** Un scraper con Playwright lee periódicamente la vista semanal de `originaion.com/schedule` (incluyendo la zona horaria actual del servidor) y la guarda en el backend. Las pestañas de esa página son puramente del lado del cliente, por lo que se necesita un navegador headless real en lugar de una simple petición HTTP.
- **Modelo de equipo:** Sin inicio de sesión clásico. Una persona crea un equipo (nombre, descripción, contraseña) y recibe un código de invitación; el resto se une con ese código y un nombre para mostrar. Las muertes y comentarios están aislados por equipo (`teamId`); el propietario del equipo puede renombrar miembros después.
- **Modo independiente vs. modo equipo:** Sin unirse a un equipo, la app solo muestra el horario público (`GET /schedule`, sin necesidad de iniciar sesión). Al unirse a un equipo se añaden comentarios en vivo y el tablero de jefes de mundo vía WebSocket.
- **Filtrado por nivel:** Las instancias de dredgion/arena tienen requisitos de nivel. Confirmado para originaion.com: Engulfed Ophidan Bridge, Iron Wall Warfront, Kamar Battlefield y Arena of Glory (todos contra todos de 4, solo el bracket más alto) son exclusivamente de nivel máximo con 61–65; Terath Dredgion, Arena of Chaos (todos contra todos de 10), Arena of Discipline (1v1) y Arena of Harmony (3v3) en cambio se emparejan en uno de cuatro brackets de 5 niveles (46–50/51–55/56–60/61–65) —Terath Dredgion se ejecuta bajo un nombre distinto en cada bracket— y por tanto son accesibles en todo el rango 46–65. La app oculta por completo las instancias que no coincidan con el nivel configurado.

## Requisitos previos

- **Node.js** ≥ 20 y **pnpm** (`corepack enable && corepack prepare pnpm --activate`)
- **Adicionalmente para compilar el overlay (solo Windows, la plataforma de destino):**
  - Rust (`rustup`, toolchain por defecto `stable-x86_64-pc-windows-msvc`)
  - Microsoft Visual Studio Build Tools con el workload *Desktop development with C++* (proporciona el enlazador MSVC que Rust necesita en Windows)
  - WebView2 Runtime (ya preinstalado en Windows 10/11 actuales)
- **Para ejecutar el backend:** un compilador de C (`build-essential` en Debian/Ubuntu) para compilar `better-sqlite3`, además de las dependencias de sistema de Chromium que necesita Playwright (`pnpm exec playwright install-deps chromium`)

> Nota: la app de overlay debe ejecutarse como un programa nativo de Windows (la transparencia y los atajos globales sobre un juego en pantalla completa no funcionan desde WSL/Linux). El desarrollo del backend funciona bien en WSL/Linux; `pnpm tauri dev`/`build` necesita un entorno nativo de Windows con Node + Rust.

## Configuración

```bash
pnpm install
```

### Backend

```bash
cd apps/backend
cp .env.example .env        # establece JWT_SECRET a un valor aleatorio largo
pnpm exec drizzle-kit generate
pnpm run db:migrate
pnpm run db:seed             # inicializa tipos/ubicaciones de jefes de mundo + requisitos de nivel
pnpm run dev                 # inicia la API (puerto 3000) + el cron del scraper
```

Endpoints principales:
- `GET /schedule` – público, devuelve el horario semanal + el offset de zona horaria del servidor
- `POST /teams`, `POST /teams/join` – crear/unirse a un equipo
- `GET /world-bosses`, `POST /world-bosses/:locationId/kill` – requiere autenticación
- `GET /comments`, `POST /comments` – requiere autenticación
- `WS /ws?token=...` – actualizaciones en vivo de muertes/comentarios/actualización del horario

### App de overlay (Windows)

```bash
cd apps/overlay
pnpm install
pnpm tauri dev      # desarrollo con recarga en caliente
pnpm tauri build    # build de producción (instalador NSIS, ver tauri.conf.json)
```

La URL del backend está actualmente fija en `apps/overlay/src/config.ts` como `https://timetable.skeeve.tv`.

## Atajos globales

Funcionan en todo el sistema (incluso cuando el juego tiene el foco), siempre que AION se ejecute en **modo ventana o sin bordes** – ningún overlay puede renderizarse sobre pantalla completa exclusiva (una limitación de DWM que afecta a todas las herramientas de overlay).

| Atajo | Función |
|---|---|
| `Ctrl+Shift+O` | Alternar modo interactivo/mover (la ventana se vuelve clicable/movible, el asistente de equipo y el tablero de jefes de mundo se vuelven usables) |
| `Ctrl+F10` | Alternar el panel de ajustes (tamaño de fuente, color de texto, nivel propio) |

Ambos modos desactivan temporalmente el "click-through"; fuera de ellos la ventana es completamente transparente a los clics y nunca interfiere con la entrada normal del juego/escritorio.

Como la ventana intencionalmente no tiene barra de título ni botón de cerrar, también hay un **icono en la bandeja** ("AION Timetable Overlay") con un menú de clic derecho para "Ajustes" y "Salir".

## Otro comportamiento

- **Primer inicio:** En el primer inicio, la app se abre automáticamente en modo interactivo + ajustes para que los nuevos usuarios puedan posicionarla y configurarla de inmediato sin conocer aún los atajos.
- **Restablecer:** Todos los ajustes (nivel, color, membresía de equipo, estado de primer inicio) viven como archivos JSON en el directorio de datos de la app de Tauri (`settings.json`, `auth.json`). Borrar estos archivos restablece la app por completo.
- **Cierre automático:** La app vigila el proceso del cliente de AION (`aion.bin`). Una vez que el cliente ha estado en ejecución y luego se cierra, la app de overlay también se cierra automáticamente.

## Despliegue del servidor (referencia)

Actualmente en producción en `timetable.skeeve.tv`: Node.js + servicio systemd (sin Docker), SQLite local al servidor, nginx como proxy inverso TLS (incluyendo upgrade de WebSocket para `/ws`), certificado vía certbot. El scraper se ejecuta cada hora como parte del proceso del backend (`node-cron`).

El directorio del servidor (`/opt/timetable`) es un checkout normal de git de este repositorio. Las actualizaciones pasan por dos scripts en [`deploy/`](deploy/):
- [`deploy/timetable_install`](deploy/timetable_install) – script bootstrap estable, obtiene la rama `main` actual y luego ejecuta `install-backend.sh` como un proceso nuevo (deliberadamente separado para que un script en ejecución no se sobrescriba a sí mismo a mitad de ejecución vía `git reset --hard`).
- [`deploy/install-backend.sh`](deploy/install-backend.sh) – instala las dependencias del backend, aplica las migraciones de base de datos pendientes, actualiza la unidad de systemd ([`deploy/aion-timetable-backend.service`](deploy/aion-timetable-backend.service)) y reinicia el servicio.

Configuración única (como root en el servidor) – deliberadamente **copiado, no enlazado simbólicamente**, para que el script bootstrap permanezca estable incluso mientras se actualiza a sí mismo vía git:

```bash
cp /opt/timetable/deploy/timetable_install /usr/local/bin/timetable_install
chmod +x /usr/local/bin/timetable_install
```

Después de eso, cada actualización es simplemente:

```bash
timetable_install
```

Si `deploy/timetable_install` cambia alguna vez, repite el paso `cp` anterior una vez.

## Releases

Al hacer push de una etiqueta como `v0.1.0` (o ejecutar el workflow manualmente desde la pestaña Actions) se activa [`.github/workflows/release.yml`](.github/workflows/release.yml), que compila el instalador de Windows y publica una GitHub Release con:
- `AION-Timetable-Overlay_x.y.z_x64-setup.exe` – instalador NSIS
- `latest.json` – manifiesto firmado contra el que verifica el actualizador integrado de la app

Requiere configurar una sola vez los secretos del repositorio `TAURI_SIGNING_PRIVATE_KEY` y `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (Settings → Secrets and variables → Actions).

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Calidad de los datos de jefes de mundo

Los 23 jefes de mundo/keymasters tienen distintos niveles de confianza (ver comentarios en `apps/backend/src/db/seed.ts`):
- **Dabra/Zumita:** ventana de reaparición proporcionada directamente por el usuario (máxima confianza para esta app).
- **16 jefes de mundo** (Heiron/Tiamaranta/Inggison/Gelkmaros/Reshanta/Sarpan/Eltnen): tiempos de reaparición del emulador de código abierto `beyond-aion/aion-server` (extraídos de los datos del juego, confianza media-alta, no es una fuente oficial).
- **Medeus the Vile, Moltenus, Governor/Berserker/Commander Sunayaka:** no siguen un ciclo real de muerte→reaparición (ventana programada nocturna o semanal) – aproximados en el rastreador de muertes como una ventana aproximada de ~1 día/~1 semana, confianza menor.

Excluidos deliberadamente: Isbariya the Resolute, Hyperion y Queen Modor (las 4 variantes) son jefes de instancia con bloqueo semanal, no apariciones en mundo abierto. "Kordac" y "Dragon Lord's Champion" se buscaron extensamente y no existen bajo ninguna grafía en AION – deliberadamente no añadidos en lugar de inventar datos.

## Pendientes

- Los requisitos de nivel para los dredgions todavía se toman de otro servidor 4.6 (los valores de las arenas ya están confirmados directamente para originaion.com) y deberían verificarse finalmente contra el servidor real una vez que vuelva a estar en línea.
- Todos los jefes de mundo ya tienen marcadores de mapa reales y clicables (Heiron, Inggison, Gelkmaros, Reshanta, Sarpan, Tiamaranta, Tiamaranta's Eye, Eltnen); tanto las coordenadas como las imágenes del mapa provienen de aioncodex.com; solo Commander Sunayaka no tiene datos de mapa disponibles y sigue usando solo selección por lista.
- Los 21 nuevos jefes de mundo todavía no están traducidos a los 8 idiomas (usan el nombre en inglés como respaldo).
