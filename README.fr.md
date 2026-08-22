🇬🇧 [English](README.md) · 🇩🇪 [Deutsch](README.de.md) · 🇪🇸 [Español](README.es.md) · 🇮🇹 [Italiano](README.it.md) · 🇫🇷 **Français** · 🇹🇷 [Türkçe](README.tr.md) · 🇷🇺 [Русский](README.ru.md) · 🇵🇱 [Polski](README.pl.md)

# AION Timetable Overlay

Une superposition (overlay) transparente pour Windows destinée au serveur privé AION 4.6 **OriginAion**, qui reste affichée pendant que vous jouez : planning des PvP Instances / Arenas / Siege / Rifts (fuseau horaire du serveur et local, filtrage par niveau, 7 langues), ainsi qu'un suivi mort/réapparition au niveau de l'équipe pour 23 boss du monde/keymasters (Dabra, Zumita, plus 21 autres à Heiron, Tiamaranta, Inggison, Gelkmaros, Reshanta, Sarpan, Eltnen) avec commentaires partagés.

## Architecture

Monorepo (pnpm workspaces) :

```
apps/
  overlay/    Tauri v2 (Rust) + React/TypeScript – l'application overlay pour Windows
  backend/    Fastify + Drizzle/SQLite + Playwright – API, WebSocket, scraper
packages/
  shared/     Types TypeScript partagés entre le backend et l'overlay
```

- **Source des données du planning :** Un scraper Playwright lit périodiquement la vue hebdomadaire de `originaion.com/schedule` (y compris le fuseau horaire actuel du serveur) et l'enregistre dans le backend. Les onglets de cette page sont purement côté client, un vrai navigateur headless est donc nécessaire plutôt qu'une simple requête HTTP.
- **Modèle d'équipe :** Pas de connexion classique. Une personne crée une équipe (nom, description, mot de passe) et reçoit un code d'invitation ; les autres membres rejoignent avec ce code et un nom d'affichage. Les kills et commentaires sont isolés par équipe (`teamId`) ; le propriétaire de l'équipe peut renommer les membres par la suite.
- **Mode autonome vs. mode équipe :** Sans rejoindre d'équipe, l'application n'affiche que le planning public (`GET /schedule`, aucune connexion requise). Rejoindre une équipe ajoute les commentaires en direct et le tableau des boss du monde via WebSocket.
- **Filtrage par niveau :** Les instances de dredgion/arène ont des exigences de niveau. Confirmé pour originaion.com : Engulfed Ophidan Bridge, Iron Wall Warfront, Kamar Battlefield et Arena of Glory (mêlée à 4, palier le plus élevé uniquement) sont réservés à l'endgame (61–65) ; Terath Dredgion, Arena of Chaos (mêlée à 10), Arena of Discipline (1v1) et Arena of Harmony (3v3) se placent en revanche dans l'un des quatre paliers de 5 niveaux (46–50/51–55/56–60/61–65) — Terath Dredgion fonctionne sous un nom différent selon le palier — et sont donc accessibles sur toute la plage 46–65. L'application masque entièrement les instances qui ne correspondent pas au niveau renseigné dans les paramètres.

## Prérequis

- **Node.js** ≥ 20 et **pnpm** (`corepack enable && corepack prepare pnpm --activate`)
- **En plus pour la build de l'overlay (Windows uniquement, la plateforme cible) :**
  - Rust (`rustup`, toolchain par défaut `stable-x86_64-pc-windows-msvc`)
  - Microsoft Visual Studio Build Tools avec le workload *Desktop development with C++* (fournit l'éditeur de liens MSVC dont Rust a besoin sous Windows)
  - WebView2 Runtime (déjà préinstallé sur les versions actuelles de Windows 10/11)
- **Pour faire fonctionner le backend :** un compilateur C (`build-essential` sous Debian/Ubuntu) pour compiler `better-sqlite3`, ainsi que les dépendances système Chromium requises par Playwright (`pnpm exec playwright install-deps chromium`)

> Remarque : l'application overlay doit fonctionner comme un programme Windows natif (la transparence et les raccourcis globaux au-dessus d'un jeu en plein écran ne fonctionnent pas depuis WSL/Linux). Le développement du backend fonctionne bien sous WSL/Linux ; `pnpm tauri dev`/`build` nécessite un environnement Windows natif avec Node + Rust.

## Installation

```bash
pnpm install
```

### Backend

```bash
cd apps/backend
cp .env.example .env        # définir JWT_SECRET sur une longue valeur aléatoire
pnpm exec drizzle-kit generate
pnpm run db:migrate
pnpm run db:seed             # initialise les types/emplacements de boss du monde + exigences de niveau
pnpm run dev                 # démarre l'API (port 3000) + le cron du scraper
```

Points d'accès principaux :
- `GET /schedule` – public, renvoie le planning hebdomadaire + le décalage de fuseau horaire du serveur
- `POST /teams`, `POST /teams/join` – créer/rejoindre une équipe
- `GET /world-bosses`, `POST /world-bosses/:locationId/kill` – authentification requise
- `GET /comments`, `POST /comments` – authentification requise
- `WS /ws?token=...` – mises à jour en direct pour les kills/commentaires/rafraîchissement du planning

### Application overlay (Windows)

```bash
cd apps/overlay
pnpm install
pnpm tauri dev      # développement avec rechargement à chaud
pnpm tauri build    # build de production (installeur NSIS, voir tauri.conf.json)
```

L'URL du backend est actuellement fixée en dur dans `apps/overlay/src/config.ts` sur `https://timetable.skeeve.tv`.

## Raccourcis globaux

Fonctionnent à l'échelle du système (même lorsque le jeu a le focus), tant qu'AION fonctionne en **mode fenêtré ou sans bordure** – aucun overlay ne peut s'afficher au-dessus du plein écran exclusif (une limitation de DWM qui affecte tous les outils d'overlay).

| Raccourci | Fonction |
|---|---|
| `Ctrl+Shift+O` | Basculer le mode interactif/déplacement (la fenêtre devient cliquable/déplaçable, l'assistant d'équipe et le tableau des boss du monde deviennent utilisables) |
| `Ctrl+F10` | Basculer le panneau de paramètres (taille de police, couleur du texte, niveau personnel) |

Les deux modes désactivent temporairement le clic-traversant ; en dehors de ceux-ci, la fenêtre est entièrement transparente aux clics et n'interfère jamais avec la saisie normale du jeu/bureau.

Comme la fenêtre n'a intentionnellement ni barre de titre ni bouton de fermeture, il existe également une **icône dans la barre d'état système** ("AION Timetable Overlay") avec un menu au clic droit pour « Paramètres » et « Quitter ».

## Autres comportements

- **Premier lancement :** Au tout premier lancement, l'application s'ouvre automatiquement en mode interactif + paramètres afin que les nouveaux utilisateurs puissent immédiatement la positionner et la configurer sans encore connaître les raccourcis.
- **Réinitialisation :** Tous les paramètres (niveau, couleur, appartenance à l'équipe, statut du premier lancement) sont stockés sous forme de fichiers JSON dans le répertoire de données de l'application Tauri (`settings.json`, `auth.json`). Supprimer ces fichiers réinitialise complètement l'application.
- **Fermeture automatique :** L'application surveille le processus du client AION (`aion.bin`). Une fois que le client a été vu en cours d'exécution puis se ferme, l'application overlay se ferme aussi automatiquement.

## Déploiement serveur (référence)

Actuellement en production sur `timetable.skeeve.tv` : Node.js + service systemd (pas de Docker), SQLite local au serveur, nginx comme proxy inverse TLS (y compris la mise à niveau WebSocket pour `/ws`), certificat via certbot. Le scraper s'exécute toutes les heures dans le cadre du processus backend (`node-cron`).

Le répertoire du serveur (`/opt/timetable`) est un checkout git normal de ce dépôt. Les mises à jour passent par deux scripts dans [`deploy/`](deploy/) :
- [`deploy/timetable_install`](deploy/timetable_install) – script bootstrap stable, récupère la branche `main` actuelle puis exécute `install-backend.sh` en tant que nouveau processus (délibérément séparé pour qu'un script en cours d'exécution ne s'écrase pas lui-même en pleine exécution via `git reset --hard`).
- [`deploy/install-backend.sh`](deploy/install-backend.sh) – installe les dépendances du backend, applique les migrations de base de données en attente, met à jour l'unité systemd ([`deploy/aion-timetable-backend.service`](deploy/aion-timetable-backend.service)) et redémarre le service.

Configuration unique (en tant que root sur le serveur) – délibérément **copié, pas lié symboliquement**, afin que le script bootstrap reste stable même pendant qu'il se met à jour lui-même via git :

```bash
cp /opt/timetable/deploy/timetable_install /usr/local/bin/timetable_install
chmod +x /usr/local/bin/timetable_install
```

Ensuite, chaque mise à jour se résume à :

```bash
timetable_install
```

Si `deploy/timetable_install` change un jour, répétez une fois l'étape `cp` ci-dessus.

## Releases

Pousser un tag comme `v0.1.0` (ou lancer le workflow manuellement depuis l'onglet Actions) déclenche [`.github/workflows/release.yml`](.github/workflows/release.yml), qui compile l'installeur Windows et publie une Release GitHub avec :
- `AION-Timetable-Overlay_x.y.z_x64-setup.exe` – installeur NSIS
- `AION-Timetable-Overlay_x.y.z_x64-setup.nsis.zip` – ZIP portable, aucune installation nécessaire
- `latest.json` – manifeste signé contre lequel le module de mise à jour intégré de l'application vérifie

Nécessite de configurer une seule fois les secrets de dépôt `TAURI_SIGNING_PRIVATE_KEY` et `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (Settings → Secrets and variables → Actions).

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Qualité des données des boss du monde

Les 23 boss du monde/keymasters ont différents niveaux de confiance (voir les commentaires dans `apps/backend/src/db/seed.ts`) :
- **Dabra/Zumita :** fenêtre de réapparition fournie directement par l'utilisateur (confiance la plus élevée pour cette application).
- **16 boss du monde** (Heiron/Tiamaranta/Inggison/Gelkmaros/Reshanta/Sarpan/Eltnen) : temps de réapparition provenant de l'émulateur open source `beyond-aion/aion-server` (extraits des données du jeu, confiance moyenne à élevée, pas une source officielle).
- **Medeus the Vile, Moltenus, Governor/Berserker/Commander Sunayaka :** ne suivent pas un vrai cycle mort→réapparition (fenêtre programmée nocturne ou hebdomadaire) – approximés dans le suivi des kills comme une fenêtre approximative d'environ 1 jour/1 semaine, confiance moindre.

Exclus délibérément : Isbariya the Resolute, Hyperion et Queen Modor (les 4 variantes) sont des boss d'instance avec un verrouillage hebdomadaire, pas des apparitions en monde ouvert. « Kordac » et « Dragon Lord's Champion » ont été recherchés de manière approfondie et n'existent sous aucune orthographe dans AION – délibérément non ajoutés plutôt que d'inventer des données.

## Points en suspens

- Les exigences de niveau pour les dredgions sont encore reprises d'un autre serveur 4.6 (les valeurs des arènes sont déjà directement confirmées pour originaion.com) et devraient être finalement vérifiées par rapport au serveur réel une fois qu'il sera de nouveau en ligne.
- Les coordonnées de clic pour les emplacements des boss du monde sur la carte de Tiamaranta's Eye (et les autres zones) ne sont pas encore fixées (la sélection par liste fonctionne déjà, les marqueurs de carte cliquables suivront).
- Les 21 nouveaux boss du monde ne sont pas encore traduits dans les 7 langues (repli sur le nom anglais).
