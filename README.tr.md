🇬🇧 [English](README.md) · 🇩🇪 [Deutsch](README.de.md) · 🇪🇸 [Español](README.es.md) · 🇮🇹 [Italiano](README.it.md) · 🇫🇷 [Français](README.fr.md) · 🇹🇷 **Türkçe** · 🇷🇺 [Русский](README.ru.md) · 🇵🇱 [Polski](README.pl.md)

# AION Timetable Overlay

Özel AION 4.6 sunucusu **OriginAion** için, oyun oynarken üstte kalan şeffaf bir Windows overlay'i: PvP Instances / Arenas / Siege / Rifts programı (sunucu ve yerel saat dilimi, seviye filtreleme, 7 dil), ayrıca Heiron, Tiamaranta, Inggison, Gelkmaros, Reshanta, Sarpan, Eltnen bölgelerindeki 23 dünya boss'u/keymaster (Dabra, Zumita ve 21 diğeri) için takım içi öldürme/yeniden doğma takibi ve ortak yorumlar.

## Mimari

Monorepo (pnpm workspaces):

```
apps/
  overlay/    Tauri v2 (Rust) + React/TypeScript – Windows overlay uygulaması
  backend/    Fastify + Drizzle/SQLite + Playwright – API, WebSocket, scraper
packages/
  shared/     Backend ve overlay arasında paylaşılan TypeScript tipleri
```

- **Program veri kaynağı:** Bir Playwright scraper'ı periyodik olarak `originaion.com/schedule` sayfasının haftalık görünümünü (mevcut sunucu saat dilimi dahil) okuyup backend'de saklar. Bu sayfadaki sekmeler tamamen istemci taraflı olduğu için basit bir HTTP isteği yerine gerçek bir headless tarayıcı gerekir.
- **Takım modeli:** Klasik giriş yok. Bir kişi bir takım oluşturur (isim, açıklama, şifre) ve bir davet kodu alır; diğer üyeler bu kod ve bir görünen adla katılır. Öldürmeler ve yorumlar takıma göre ayrılmıştır (`teamId`); takım sahibi daha sonra üyelerin adını değiştirebilir.
- **Bağımsız mod vs. takım modu:** Bir takıma katılmadan uygulama yalnızca herkese açık programı gösterir (`GET /schedule`, giriş gerekmez). Bir takıma katılmak canlı yorumları ve dünya boss panosunu WebSocket üzerinden ekler.
- **Seviye filtreleme:** Dredgion/arena bölümlerinin seviye gereksinimleri vardır. originaion.com için doğrulanmıştır: Engulfed Ophidan Bridge, Iron Wall Warfront, Kamar Battlefield ve Arena of Glory (4 kişilik herkese karşı herkes, sadece en yüksek dilim) sadece endgame'de 61–65 ile kullanılabilir; Terath Dredgion, Arena of Chaos (10 kişilik herkese karşı herkes), Arena of Discipline (1v1) ve Arena of Harmony (3v3) ise dört 5-seviyelik dilimden birine (46–50/51–55/56–60/61–65) sıraya girer — Terath Dredgion her dilimde farklı bir isim altında çalışır — ve bu nedenle 46–65 aralığının tamamında erişilebilirdir. Uygulama, ayarlarda belirlenen seviyeye uymayan bölümleri tamamen gizler.

## Ön koşullar

- **Node.js** ≥ 20 ve **pnpm** (`corepack enable && corepack prepare pnpm --activate`)
- **Overlay derlemesi için ayrıca (hedef platform olduğu için sadece Windows):**
  - Rust (`rustup`, varsayılan toolchain `stable-x86_64-pc-windows-msvc`)
  - *Desktop development with C++* iş yüküne sahip Microsoft Visual Studio Build Tools (Rust'ın Windows'ta gerektirdiği MSVC bağlayıcısını sağlar)
  - WebView2 Runtime (güncel Windows 10/11'de zaten önceden yüklü)
- **Backend'i çalıştırmak için:** `better-sqlite3`'ü derlemek için bir C derleyicisi (Debian/Ubuntu'da `build-essential`), ayrıca Playwright'ın gerektirdiği Chromium sistem bağımlılıkları (`pnpm exec playwright install-deps chromium`)

> Not: overlay uygulaması yerel bir Windows programı olarak çalışmalıdır (şeffaflık ve tam ekran bir oyun üzerindeki genel kısayollar WSL/Linux üzerinden çalışmaz). Backend geliştirmesi WSL/Linux altında sorunsuz çalışır; `pnpm tauri dev`/`build` için Node + Rust içeren yerel bir Windows ortamı gerekir.

## Kurulum

```bash
pnpm install
```

### Backend

```bash
cd apps/backend
cp .env.example .env        # JWT_SECRET'i uzun, rastgele bir değere ayarlayın
pnpm exec drizzle-kit generate
pnpm run db:migrate
pnpm run db:seed             # dünya boss türleri/konumları + seviye gereksinimlerini oluşturur
pnpm run dev                 # API'yi (port 3000) + scraper cron'unu başlatır
```

Önemli endpoint'ler:
- `GET /schedule` – herkese açık, haftalık programı + sunucu saat dilimi farkını döndürür
- `POST /teams`, `POST /teams/join` – takım oluştur/katıl
- `GET /world-bosses`, `POST /world-bosses/:locationId/kill` – kimlik doğrulama gerekli
- `GET /comments`, `POST /comments` – kimlik doğrulama gerekli
- `WS /ws?token=...` – öldürmeler/yorumlar/program yenilemesi için canlı güncellemeler

### Overlay uygulaması (Windows)

```bash
cd apps/overlay
pnpm install
pnpm tauri dev      # sıcak yeniden yüklemeli geliştirme
pnpm tauri build    # üretim derlemesi (NSIS yükleyici, bkz. tauri.conf.json)
```

Backend URL'si şu anda `apps/overlay/src/config.ts` içinde `https://timetable.skeeve.tv` olarak sabitlenmiştir.

## Genel kısayollar

AION **pencereli veya kenarlıksız modda** çalıştığı sürece sistem genelinde çalışır (oyun odaktayken bile) – hiçbir overlay özel tam ekranın üzerinde görüntülenemez (tüm overlay araçlarını etkileyen bir DWM sınırlaması).

| Kısayol | İşlev |
|---|---|
| `Ctrl+Shift+O` | Etkileşimli/taşıma modunu aç/kapat (pencere tıklanabilir/taşınabilir olur, takım sihirbazı ve dünya boss panosu kullanılabilir hale gelir) |
| `Ctrl+F10` | Ayarlar panelini aç/kapat (yazı boyutu, metin rengi, kendi seviyesi) |

Her iki mod da geçici olarak tıklama geçirgenliğini devre dışı bırakır; bunların dışında pencere tamamen tıklama geçirgendir ve normal oyun/masaüstü girdisine asla müdahale etmez.

Pencerede kasıtlı olarak başlık çubuğu/kapatma düğmesi olmadığından, "Ayarlar" ve "Çıkış" için sağ tık menüsüne sahip bir **tepsi simgesi** ("AION Timetable Overlay") de vardır.

## Diğer davranışlar

- **İlk başlatma:** İlk başlatmada uygulama otomatik olarak etkileşimli + ayarlar modunda açılır, böylece yeni kullanıcılar kısayolları henüz bilmeden onu hemen konumlandırıp yapılandırabilir.
- **Sıfırlama:** Tüm ayarlar (seviye, renk, takım üyeliği, ilk başlatma durumu) Tauri uygulama veri dizininde (`settings.json`, `auth.json`) JSON dosyaları olarak bulunur. Bu dosyaları silmek uygulamayı tamamen sıfırlar.
- **Otomatik kapanma:** Uygulama AION istemci sürecini (`aion.bin`) izler. İstemci bir kez çalıştığı görüldükten sonra kapatılırsa, overlay uygulaması da otomatik olarak kapanır.

## Sunucu dağıtımı (referans)

Şu anda `timetable.skeeve.tv` üzerinde üretimde çalışıyor: Node.js + systemd servisi (Docker yok), sunucuya yerel SQLite, TLS ters proxy olarak nginx (`/ws` için WebSocket yükseltmesi dahil), certbot üzerinden sertifika. Scraper, backend sürecinin bir parçası olarak (`node-cron`) saatlik çalışır.

Sunucu dizini (`/opt/timetable`) bu deponun normal bir git checkout'udur. Güncellemeler [`deploy/`](deploy/) içindeki iki betik üzerinden yapılır:
- [`deploy/timetable_install`](deploy/timetable_install) – kararlı önyükleme betiği, mevcut `main` dalını çeker ve ardından `install-backend.sh`'ı yeni bir işlem olarak başlatır (çalışan bir betiğin `git reset --hard` ile yürütme ortasında kendi üzerine yazmaması için kasıtlı olarak ayrılmıştır).
- [`deploy/install-backend.sh`](deploy/install-backend.sh) – backend bağımlılıklarını kurar, bekleyen veritabanı geçişlerini uygular, systemd birimini ([`deploy/aion-timetable-backend.service`](deploy/aion-timetable-backend.service)) günceller ve servisi yeniden başlatır.

Tek seferlik kurulum (sunucuda root olarak) – önyükleme betiğinin git üzerinden kendini güncellerken bile kararlı kalması için kasıtlı olarak **sembolik bağ yerine kopyalanır**:

```bash
cp /opt/timetable/deploy/timetable_install /usr/local/bin/timetable_install
chmod +x /usr/local/bin/timetable_install
```

Bundan sonra her güncelleme için tek gereken:

```bash
timetable_install
```

`deploy/timetable_install` bir gün değişirse, yukarıdaki `cp` adımını bir kez daha tekrarlayın.

## Yayınlar (Releases)

`v0.1.0` gibi bir etiketi push etmek (veya iş akışını Actions sekmesinden manuel olarak çalıştırmak) [`.github/workflows/release.yml`](.github/workflows/release.yml)'i tetikler; bu da Windows yükleyicisini derler ve şunları içeren bir GitHub Release yayınlar:
- `AION-Timetable-Overlay_x.y.z_x64-setup.exe` – NSIS yükleyici
- `AION-Timetable-Overlay_x.y.z_x64-setup.nsis.zip` – kurulum gerektirmeyen taşınabilir ZIP
- `latest.json` – uygulamanın yerleşik güncelleyicisinin karşılaştırdığı imzalı manifest

Bir defaya mahsus `TAURI_SIGNING_PRIVATE_KEY` ve `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` depo sırlarının (Settings → Secrets and variables → Actions) ayarlanmasını gerektirir.

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Dünya boss verisi kalitesi

23 dünya boss'u/keymaster'ın farklı güven seviyeleri vardır (bkz. `apps/backend/src/db/seed.ts` içindeki yorumlar):
- **Dabra/Zumita:** yeniden doğma penceresi doğrudan kullanıcı tarafından verilmiştir (bu uygulama için en yüksek güven).
- **16 dünya boss'u** (Heiron/Tiamaranta/Inggison/Gelkmaros/Reshanta/Sarpan/Eltnen): açık kaynak emülatör `beyond-aion/aion-server`'dan alınan yeniden doğma süreleri (oyun verisinden çıkarılmış, orta-yüksek güven, resmi bir kaynak değil).
- **Medeus the Vile, Moltenus, Governor/Berserker/Commander Sunayaka:** gerçek bir öldürme→yeniden doğma döngüsü izlemezler (gece veya haftalık zamanlanmış pencere) – öldürme takipçisinde kabaca ~1 gün/~1 hafta penceresi olarak yaklaşık olarak modellenmiştir, daha düşük güven.

Kasıtlı olarak hariç tutuldu: Isbariya the Resolute, Hyperion ve Queen Modor (4 varyantın tümü) haftalık kilitlemeye sahip bölüm boss'larıdır, açık dünya spawn'ları değildir. "Kordac" ve "Dragon Lord's Champion" kapsamlı şekilde arandı ve AION'da hiçbir yazımda mevcut değil – veri icat etmek yerine kasıtlı olarak eklenmedi.

## Açık noktalar

- Dredgion'lar için seviye gereksinimleri hâlâ başka bir 4.6 sunucusundan alınmıştır (arena değerleri originaion.com için zaten doğrudan onaylanmıştır) ve sunucu tekrar çevrimiçi olduğunda gerçek sunucuya karşı nihai olarak doğrulanmalıdır.
- Tiamaranta's Eye haritasındaki (ve diğer bölgelerdeki) dünya boss konumları için tıklama koordinatları henüz sabitlenmemiştir (liste tabanlı seçim zaten çalışıyor, tıklanabilir harita işaretçileri daha sonra gelecek).
- 21 yeni dünya boss'u henüz 7 dilin tümüne çevrilmemiştir (İngilizce isme geri döner).
