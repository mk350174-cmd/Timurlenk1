# ♛ Timurlenk Satranç Online — MVP

Production-ready, online multiplayer **Timurlenk (Tamerlane) chess** played on an
**11×10 board**, built with React 18 + Vite + Supabase.

> Tek satır özet: Gerçek zamanlı çok oyunculu, Glicko-2 puanlamalı, çevrimdışı
> destekli, 8 seviyeli Talim Alanı içeren bir Timurlenk satranç oyunu.

---

## ✨ Özellikler (MVP)

- **Talim Alanı** — 8 seviye (Er → Timurlenk), her birinde 10 bulmaca, GP ödülleri.
- **Online Oyun** — hızlı eşleştirme, arkadaş daveti (bağlantı/kod), bota karşı oyun.
- **Hibrit Gerçek Zamanlı Senkron** — Supabase Realtime (WebSocket) + 500 ms HTTP
  polling yedeği + opsiyonel Socket.io.
- **Glicko-2 Puanlama** — süre kontrolü başına ayrı puan (bullet/blitz/rapid/classical).
- **Çevrimdışı Mod** — oyunlar LocalStorage'a kaydedilir, çevrimiçi olunca otomatik
  senkron + otomatik hile tespiti (manuel inceleme kuyruğu).
- **Profil & Sıralama** — istatistikler, başarımlar, oyun geçmişi, küresel liderlik tablosu.
- **Kimlik Doğrulama** — Supabase Auth (e-posta + şifre). Supabase yoksa **yerel mod**.
- **Zaman Kontrolleri** — Bullet 1+0, Blitz 3+2, Rapid 10+10, Classical 30+30.
- **Duyarlı (responsive)** Canvas tahta, 60 FPS hedefli olay tabanlı çizim.

### İki çalışma modu
| | CLOUD modu | LOCAL modu (varsayılan) |
|---|---|---|
| Tetikleyici | `.env.local`'de Supabase anahtarları var | anahtar yok |
| Kimlik | Supabase Auth (JWT) | LocalStorage hesapları |
| Online oyun | Evet (eşleştirme + realtime) | Bota karşı / çevrimdışı |
| Liderlik | Supabase `ratings` tablosu | yerel profiller |

App, Supabase yapılandırılmadan da **tamamen oynanabilir** (Talim Alanı, bota karşı
oyun, çevrimdışı kayıt, profil) — backend eklenince online özellikler açılır.

---

## 🚀 Başlangıç

```bash
npm install
npm run dev      # http://localhost:5173
```

Üretim derlemesi ve testler:

```bash
npm run build    # dist/ üretir
npm run preview  # dist/'i yerelde sunar
npm test         # çekirdek mantık birim testleri (node:test)
npm run lint     # ESLint
```

### Supabase'i etkinleştirme (opsiyonel)
1. `.env.example` → `.env.local` kopyalayın, `VITE_SUPABASE_URL` ve
   `VITE_SUPABASE_ANON_KEY` değerlerini girin.
2. `supabase/migrations/0001_init.sql` dosyasını Supabase SQL editöründe çalıştırın
   (tablolar, indeksler, RLS, tetikleyici, turnuva seed).
3. `npm run dev` — artık kayıt/giriş, online oyun ve liderlik bulutta çalışır.

Ayrıntılar için **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**.

---

## 🧱 Teknoloji

- **Frontend:** React 18.3 + Vite 5 + Tailwind CSS 3.4
- **State:** Zustand
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Realtime:** Hibrit (Supabase WebSocket + HTTP polling + opsiyonel Socket.io)
- **HTTP:** Axios (servis katmanı için hazır)
- **Form:** React Hook Form
- **Routing:** React Router v6
- **Tahta:** Canvas 2D (3D, v1.1'de Three.js)

## 📁 Proje Yapısı

```
src/
├── components/   GameBoard, AuthModal, Navigation, OnlineGameLobby, PuzzleLevel, …
├── pages/        Home, TalimAlani, OnlineGame, Profile, Leaderboard, NotFound
├── services/     supabaseClient, authService, gameService, realtimeService,
│                 socketService, storageService, syncService
├── store/        authStore, gameStore, ratingStore, settingsStore, toastStore, uiStore
├── hooks/        useAuth, useOnlineStatus
├── utils/        board, moves, elo (Glicko-2), constants, logger
├── data/         puzzles (8×10), tournaments
└── types/        JSDoc typedefs (game, user, api)
supabase/migrations/0001_init.sql   şema + RLS + indeks + seed
tests/core.test.js                  board / moves / elo birim testleri
```

## 🔌 API Yüzeyi (Supabase servis katmanı)

Spec'teki REST yolları, Supabase istemcisi üzerinden şu servislere eşlenir:

| Spec endpoint | Uygulama |
|---|---|
| `POST /auth/register\|login\|logout` | `authService` (Supabase Auth) |
| `POST /games/matchmake` | `gameService.createGame` (açık oyun bul/oluştur) |
| `POST /games/:id/move` | `gameService.pushMoves` + realtime |
| `GET /users/:id/games` | `gameService.getGameHistory` |
| `GET /ratings/leaderboard` | `Leaderboard` sayfası sorgusu |
| `POST /games/sync` | `syncService.syncAllOfflineGames` + hile tespiti |

## ♟️ Timurlenk Kuralları (MVP notu)

- Tahta **11×10** (110 kare). Başlangıç dizilimi (simetrik):
  `Kale At Fil Deve Vezir Şah Vezir Deve Fil At Kale` + piyade sırası.
- Taşlar: Şah, Vezir, Kale, Fil, At, **Deve (3,1 sıçrayıcı — Timur dokunuşu)**, Piyade.
- Hareket üretimi **sözde-yasal (pseudo-legal)**; oyun **şah'ın alınmasıyla** biter.
  Şah/mat/rok/geçerken-alma gibi tam kurallar ile gerçek motor (Apex Timur → WASM)
  **v1.1**'de gelir. Bu, spec'teki `motor_integration` notuyla uyumludur.

---

## 🗺️ Yol Haritası

### v1.1 — bu sürümde eklenenler ✅
- **Motor entegrasyon katmanı** (`engineService`) — Apex Timur WASM hazır seam +
  JS yedek motoru. WASM binaries `public/engine/`'e bırakılınca otomatik devreye
  girer (bkz. `public/engine/README.md`).
- **Zorluk seviyeli yapay zekâ** (negamax + alpha-beta, 5 seviye) — eski açgözlü
  bot yerine.
- **50 komutan botu** (8 ELO kademesi, 1000–2400) — lobiden seçilebilir.
- **Komutan sesi** (Web Speech API, Modern Türkçe scriptler) + temel ses efektleri
  (Web Audio). ElevenLabs'e takılabilir.
- **Marka kimliği** — Altın #D4AF37 / Kahve #3E2723, Playfair Display + Inter +
  JetBrains Mono, 12px köşeler.
- **3D tahta** (Three.js) — prosedürel tahta + taşlar, kayan hamle/yakalama
  animasyonları, nabız atan vurgular, yörünge kamerası (döndür/yakınlaştır),
  yumuşak gölgeler. 2D/3D geçişi tahta üzerinde; 3B ayrı tembel (lazy) parçada
  yüklenir, ilk açılışı yavaşlatmaz. Mobilde varsayılan 2D (adaptif).
- **Turnuva sistemi** — Arena (Swiss), Ladder ve Eleme formatları; 50 komutan
  botu sahayı doldurur, canlı sıralama, eşleşmeni gerçek tahtada oyna (diğer
  maçlar simüle edilir), maç yayını/izleme (bot-vs-bot otomatik oynanır) ve
  bitişte kupa/rütbe rozetleri (profil kupa dolabı).
- **Komutan sistemi (50 bot, 2 kategori)** — 40 mitolojik persona (6 fraksiyon,
  "Mythic Tamer" karakter seçimi) + 10 tarihî figür ("Imperial Legacy" galeri +
  profil). `/commanders` üzerinden gözat, "Bu komutanla oyna" ile başlat.
  Portreler S3'ten (`VITE_ASSET_BASE_URL`), gelene kadar baş harf yer tutucu.
- **Tahta temaları (5)** — Phoenix / Wolf Teal / Wolf Gold / Wolf Wood / Wolf
  Red; ayarlardan seçilir, S3 doku (`textures/`) ile tahtaya uygulanır.
- **Komutan sesi (73 replik)** — `VITE_VOICE_CDN_URL` verilince ElevenLabs MP3
  (S3) çalınır, yoksa Web Speech yedeği + metin.
- **Motor kaynağı** — `engine/apex_timur_v2-1.cpp` repoda; `public/engine/README`
  Emscripten/`extern "C"` derleme adımlarını içerir (derleme kullanıcıda).

Veri sözleşmesi `docs/data-contract.md`, S3 anahtar haritası `docs/asset-manifest.md`.

### v1.1 — sıradaki (yalnızca kullanıcı varlıkları bekleniyor)
- **Apex Timur WASM** derlemesi, **S3 görselleri/dokuları** (portre+tahta) ve
  **ElevenLabs MP3'leri** — hepsi mevcut seam'lere takılır.

### v1.2+
- Oyun analizi paneli, özelleştirilebilir taş/tahta (premium), mobil uygulama.

## 📄 Lisans
MIT.
