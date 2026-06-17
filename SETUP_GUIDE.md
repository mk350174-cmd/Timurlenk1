# 🛠️ Setup Guide — Timurlenk Satranç Online

Bu rehber, MVP'yi yerelde çalıştırmaktan üretime (Vercel + Supabase) almaya kadar
adımları kapsar.

---

## 1) Yerel Geliştirme

### Gereksinimler
- Node.js **18+** (önerilen 20/22)
- npm 9+

### Kurulum
```bash
npm install
npm run dev          # http://localhost:5173
```

Hiçbir yapılandırma olmadan uygulama **LOCAL modda** açılır:
- Hesaplar tarayıcıda saklanır (LocalStorage)
- Bota karşı oyun, Talim Alanı, çevrimdışı kayıt çalışır
- Online eşleştirme/liderlik kapalıdır (Supabase gerektirir)

### Yararlı komutlar
```bash
npm run build        # dist/ üretim derlemesi
npm run preview      # dist/'i 5173'te sun
npm test             # birim testler (board / moves / elo)
npm run lint         # ESLint
```

---

## 2) Supabase Backend (CLOUD modu)

### 2.1 Proje oluştur
1. https://supabase.com → **New project**
2. **Project URL** ve **anon public key** değerlerini Settings → API'den alın.

### 2.2 Şemayı yükle
`supabase/migrations/0001_init.sql` içeriğini Supabase **SQL Editor**'da çalıştırın.
Bu dosya şunları kurar:
- 8 tablo: `users, ratings, games, tournaments, tournament_players, purchases,
  friendships, offline_games`
- Performans indeksleri
- **Row-Level Security** politikaları (profiller herkese açık-okur, yazma yalnızca
  sahibe; oyunlar izleyicilere açık, katılım/oynama katılımcılara)
- `auth.users` üzerine **tetikleyici**: kayıt olunca profil + 4 puan satırı otomatik
- 4 turnuvanın **seed** kaydı

> CLI alternatifi: `supabase link --project-ref <ref> && supabase db push`

### 2.3 Ortam değişkenleri
`.env.example` → `.env.local`:
```ini
VITE_SUPABASE_URL=https://<proje>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
# VITE_SOCKET_URL=  # opsiyonel Socket.io yedeği
```

### 2.4 Auth ayarı
- Authentication → Providers → **Email** etkin.
- MVP için e-posta onayını kapatabilirsiniz (Auth → Settings → "Confirm email").
- Şifre politikası (uygulama tarafında zorlanır): min 8, 1 büyük harf, 1 rakam,
  1 özel karakter.

### 2.5 Realtime
Migration sonunda `games` tablosu `supabase_realtime` publication'ına eklenir;
hamleler WebSocket ile yayınlanır. Bağlantı başarısız olursa uygulama otomatik
**500 ms HTTP polling**'e düşer.

---

## 3) Üretim Dağıtımı (Vercel)

1. Repoyu GitHub'a bağlayın, Vercel'de **Import Project**.
2. Framework preset: **Vite**. Build: `npm run build`, Output: `dist`.
3. Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. SPA yönlendirmesi için `vercel.json` ekleyin (React Router için tüm yolları
   `index.html`'e yönlendir):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

5. Deploy. Üretim için Supabase'i ücretli plana geçirmeniz ölçeklenmeyi sağlar.

---

## 4) Güvenlik Kontrol Listesi

- ✅ SQL enjeksiyonu: Supabase parametreli sorgular kullanır.
- ✅ Yetkilendirme: RLS politikaları kullanıcıları kendi satırlarına kısıtlar.
- ✅ XSS: React varsayılan kaçışı; `dangerouslySetInnerHTML` kullanılmaz.
- ✅ Sırlar: yalnızca `anon` key istemcide; servis-rol anahtarı **asla** istemcide olmaz.
- ✅ `.env.local` `.gitignore`'da; `.env.example` paylaşılır.
- ⚠️ Puan güncellemeleri MVP'de istemci tarafında (her oyuncu kendi satırını yazar).
  Üretimde bunu güvenilir bir **Postgres fonksiyonu / Edge Function**'a taşıyın.

---

## 5) Sorun Giderme

| Belirti | Çözüm |
|---|---|
| `Port 5173 in use` | `npm run dev -- --port 3000` |
| Giriş çalışmıyor, "yerel mod" yazıyor | `.env.local` boş — Supabase anahtarlarını ekleyin |
| Online eşleştirme beklemede kalıyor | İkinci bir tarayıcı/sekmede aynı süre kontrolüyle eşleşin; 2 dk sonra bota düşer |
| Liderlik boş | Henüz puanlı oyun yok; bir oyun bitirin |
| Realtime gelmiyor | Polling devreye girer (500 ms); `games` publication'da mı kontrol edin |

---

## 6) v1.1+ Notları
- **Motor:** `src/utils/moves.js` aynı imzalarla Apex Timur (WASM) ile değiştirilecek.
- **3D tahta:** `GameBoard.jsx` Canvas; Three.js katmanı 2D/3D anahtarıyla eklenir.
- **Turnuva:** yapı ve seed hazır; Arena/Ladder eşleştirme mantığı eklenecek.
- **Bot hamleleri:** şimdilik açgözlü sezgisel (`pickBotMove`); motor ile gerçek AI.
