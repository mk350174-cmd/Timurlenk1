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
- **v1.1** — Apex Timur (C++ → WASM) motor entegrasyonu, 3D tahta (Three.js),
  tam turnuva (Arena + Ladder), bot hamleleri.
- **v1.2** — ses/animasyon (Komutan), özelleştirilebilir taş/tahta (premium).
- **v2.0** — Vercel + AWS S3/CloudFront, mobil uygulama.

## 📄 Lisans
MIT.
