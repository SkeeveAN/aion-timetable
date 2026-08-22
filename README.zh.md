🇬🇧 [English](README.md) · 🇩🇪 [Deutsch](README.de.md) · 🇪🇸 [Español](README.es.md) · 🇮🇹 [Italiano](README.it.md) · 🇫🇷 [Français](README.fr.md) · 🇹🇷 [Türkçe](README.tr.md) · 🇷🇺 [Русский](README.ru.md) · 🇵🇱 [Polski](README.pl.md) · 🇨🇳 **中文**

# AION Timetable Overlay

一个用于私人 AION 4.6 服务器 **OriginAion** 的透明 Windows 悬浮窗，游玩时始终置顶显示：PvP Instances / Arenas / Siege / Rifts 日程表(服务器时间与本地时间、按等级过滤、8 种语言),以及针对 23 个世界 Boss/钥匙守护者(Dabra、Zumita,以及 Heiron、Tiamaranta、Inggison、Gelkmaros、Reshanta、Sarpan、Eltnen 等地的另外 21 个)的团队内击杀/重生追踪,并支持共享评论。

## 架构

Monorepo(pnpm workspaces):

```
apps/
  overlay/    Tauri v2 (Rust) + React/TypeScript – Windows 悬浮窗应用
  backend/    Fastify + Drizzle/SQLite + Playwright – API、WebSocket、爬虫
packages/
  shared/     backend 与 overlay 之间共享的 TypeScript 类型
```

- **日程数据来源:** 一个 Playwright 爬虫定期读取 `originaion.com/schedule` 的每周视图(包括当前服务器时区)并存入 backend。该页面的标签页完全是客户端渲染,因此需要真正的无头浏览器,而不是简单的 HTTP 请求。
- **团队模型:** 没有传统登录。一人创建团队(名称、描述、密码)并获得邀请码;其他成员使用该邀请码和一个显示名称加入。击杀记录和评论按团队隔离(`teamId`);团队所有者之后可以重命名成员。
- **独立模式 vs. 团队模式:** 不加入团队时,应用只显示公开日程(`GET /schedule`,无需登录)。加入团队后,通过 WebSocket 增加实时评论和世界 Boss 面板。
- **等级过滤:** Dredgion/竞技场副本有等级要求。已针对 originaion.com 确认: Engulfed Ophidan Bridge、Iron Wall Warfront、Kamar Battlefield 以及 Arena of Glory(4 人自由混战,仅限最高等级段)仅限 61–65 级的终局内容;而 Terath Dredgion、Arena of Chaos(10 人自由混战)、Arena of Discipline(1v1)和 Arena of Harmony(3v3)则会匹配进入四个 5 级等级段(46–50/51–55/56–60/61–65)之一 —— Terath Dredgion 在不同等级段下使用不同的游戏内名称 —— 因此在整个 46–65 范围内均可进入。应用会完全隐藏与设置中等级不匹配的副本。

## 前置条件

- **Node.js** ≥ 20 及 **pnpm**(`corepack enable && corepack prepare pnpm --activate`)
- **构建 overlay 额外需要(仅限 Windows,因为这是目标平台):**
  - Rust(`rustup`,默认工具链 `stable-x86_64-pc-windows-msvc`)
  - 带有 *Desktop development with C++* 工作负载的 Microsoft Visual Studio Build Tools(提供 Rust 在 Windows 上所需的 MSVC 链接器)
  - WebView2 Runtime(当前 Windows 10/11 已预装)
- **运行 backend 需要:** 一个 C 编译器(Debian/Ubuntu 上为 `build-essential`)以构建 `better-sqlite3`,以及 Playwright 所需的 Chromium 系统依赖(`pnpm exec playwright install-deps chromium`)

> 注意: overlay 应用必须作为原生 Windows 程序运行(透明度和全局快捷键在全屏游戏之上,在 WSL/Linux 下无法工作)。backend 开发在 WSL/Linux 下运行良好;`pnpm tauri dev`/`build` 需要带有 Node + Rust 的原生 Windows 环境。

## 安装

```bash
pnpm install
```

### Backend

```bash
cd apps/backend
cp .env.example .env        # 将 JWT_SECRET 设置为一个较长的随机值
pnpm exec drizzle-kit generate
pnpm run db:migrate
pnpm run db:seed             # 初始化世界 Boss 类型/位置 + 等级要求
pnpm run dev                 # 启动 API(端口 3000)+ 爬虫定时任务
```

主要接口:
- `GET /schedule` – 公开接口,返回每周日程 + 服务器时区偏移
- `POST /teams`, `POST /teams/join` – 创建/加入团队
- `GET /world-bosses`, `POST /world-bosses/:locationId/kill` – 需要鉴权
- `GET /comments`, `POST /comments` – 需要鉴权
- `WS /ws?token=...` – 击杀/评论/日程刷新的实时更新

### Overlay 应用(Windows)

```bash
cd apps/overlay
pnpm install
pnpm tauri dev      # 带热重载的开发模式
pnpm tauri build    # 生产环境构建(NSIS 安装程序,见 tauri.conf.json)
```

Backend URL 目前硬编码在 `apps/overlay/src/config.ts` 中,为 `https://timetable.skeeve.tv`。

## 全局快捷键

在系统范围内生效(即使游戏处于焦点状态),只要 AION 运行在**窗口模式或无边框模式**下 —— 任何 overlay 都无法渲染在独占全屏之上(这是影响所有 overlay 工具的 DWM 限制)。

| 快捷键 | 功能 |
|---|---|
| `Ctrl+Shift+O` | 切换交互/移动模式(窗口变为可点击/可移动,团队向导和世界 Boss 面板变为可用) |
| `Ctrl+F10` | 切换设置面板(字体大小、文字颜色、自身等级) |

两种模式都会临时禁用点击穿透;在这两种模式之外,窗口完全可点击穿透,绝不会干扰正常的游戏/桌面操作。

由于窗口刻意没有标题栏/关闭按钮,还提供了一个**系统托盘图标**("AION Timetable Overlay"),右键菜单可打开「设置」和「退出」。

## 其他行为

- **首次启动:** 首次启动时,应用会自动以交互 + 设置模式打开,以便新用户在还不了解快捷键的情况下,能立即定位和配置它。
- **重置:** 所有设置(等级、颜色、团队归属、首次启动状态)都以 JSON 文件形式保存在 Tauri 应用数据目录中(`settings.json`、`auth.json`)。删除这些文件即可完全重置应用。
- **自动退出:** 应用会监视 AION 客户端进程(`aion.bin`)。一旦客户端被检测到运行过之后又关闭,overlay 应用也会自动退出。
- **自动更新:** 每次启动时,应用都会在后台检查最新的 GitHub Release,如有可用更新会自动下载并安装,然后重启 —— 无需任何对话框或点击。

## 服务器部署(参考)

目前生产环境运行在 `timetable.skeeve.tv`: Node.js + systemd 服务(不使用 Docker),SQLite 本地存储于服务器,nginx 作为 TLS 反向代理(包括 `/ws` 的 WebSocket 升级),证书通过 certbot 获取。爬虫作为 backend 进程的一部分每小时运行一次(`node-cron`)。

服务器目录(`/opt/timetable`)是该仓库的一个普通 git 检出。更新通过 [`deploy/`](deploy/) 中的两个脚本进行:
- [`deploy/timetable_install`](deploy/timetable_install) – 稳定的 bootstrap 脚本,拉取当前 `main` 分支,然后以全新进程执行 `install-backend.sh`(刻意分离,以避免正在运行的脚本在执行过程中通过 `git reset --hard` 覆盖自身)。
- [`deploy/install-backend.sh`](deploy/install-backend.sh) – 安装 backend 依赖、应用待处理的数据库迁移、更新 systemd 单元([`deploy/aion-timetable-backend.service`](deploy/aion-timetable-backend.service))并重启服务。

一次性设置(在服务器上以 root 身份)—— 刻意**复制而非软链接**,以便 bootstrap 脚本在通过 git 自我更新时仍保持稳定:

```bash
cp /opt/timetable/deploy/timetable_install /usr/local/bin/timetable_install
chmod +x /usr/local/bin/timetable_install
```

之后,每次更新只需:

```bash
timetable_install
```

如果 `deploy/timetable_install` 本身发生变化,请再次重复上面的 `cp` 步骤。

## 发布(Releases)

推送形如 `v0.1.0` 的标签(或从 Actions 标签页手动运行工作流)会触发 [`.github/workflows/release.yml`](.github/workflows/release.yml),该工作流会构建 Windows 安装程序并发布一个 GitHub Release,内含:
- `AION-Timetable-Overlay_x.y.z_x64-setup.exe` – NSIS 安装程序
- `latest.json` – 应用内置更新程序用于检查更新的签名清单

需要预先一次性设置仓库密钥 `TAURI_SIGNING_PRIVATE_KEY` 和 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`(Settings → Secrets and variables → Actions)。

```bash
git tag v0.1.0
git push origin v0.1.0
```

## 世界 Boss 数据质量

23 个世界 Boss/钥匙守护者具有不同的可信度等级(参见 `apps/backend/src/db/seed.ts` 中的注释):
- **Dabra/Zumita:** 重生窗口由用户直接提供(本应用中可信度最高)。
- **16 个世界 Boss**(Heiron/Tiamaranta/Inggison/Gelkmaros/Reshanta/Sarpan/Eltnen): 重生时间来自开源模拟器 `beyond-aion/aion-server`(从游戏数据中提取,可信度中高,并非官方来源)。
- **Medeus the Vile、Moltenus、Governor/Berserker/Commander Sunayaka:** 不遵循真正的击杀→重生周期(夜间或每周固定的时间窗口)—— 在击杀追踪器中粗略地近似为约 1 天/约 1 周的窗口,可信度较低。

刻意排除的内容: Isbariya the Resolute、Hyperion 以及 Queen Modor(全部 4 个变体)都是每周锁定的副本 Boss,而非开放世界刷新。经过广泛搜索,"Kordac" 和 "Dragon Lord's Champion" 在 AION 中并不以任何拼写方式存在 —— 因此刻意未添加,而不是编造数据。

## 待解决事项

- Dredgion 的等级要求仍然沿用自另一个 4.6 服务器(竞技场的数值已针对 originaion.com 直接确认),待该服务器重新上线后应最终对照真实服务器进行核实。
- 目前所有世界 Boss 均已拥有真实的可点击地图标记(Heiron、Inggison、Gelkmaros、Reshanta、Sarpan、Tiamaranta、Tiamaranta's Eye、Eltnen);坐标与地图图片均来自 aioncodex.com;仅 Commander Sunayaka 在 aioncodex 上没有可用的地图数据,目前仍只支持列表式选择。
- 21 个新增世界 Boss 尚未翻译成全部 8 种语言(会回退显示英文名称)。
