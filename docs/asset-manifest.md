# Asset Manifest — S3 / CloudFront keys

Portraits, board textures and voice clips are hosted by the user on S3/CloudFront
and fetched at runtime. The app references each asset by a **stable key**; the
base URLs are configured via environment variables.

## Environment variables (Vite)
```ini
# Portraits + board textures (e.g. https://<assets-cdn>/timurlenk)
VITE_ASSET_BASE_URL=
# Komutan voice MP3s (e.g. https://<voice-cdn>)
VITE_VOICE_CDN_URL=
```
Resolved URL = `<base>/<key>`. When unset, the app shows initials/placeholders
and uses the Web Speech voice fallback — nothing breaks.

## Key conventions
- Mythological bot portraits: `bots/<slug>.webp`
- Historical bot portraits:   `commanders/<slug>.webp`
- Board textures (11×10):      `textures/<themeId>.webp`
- Voice clips:                 `<lineId>.mp3` (under VITE_VOICE_CDN_URL)
- `slug` = lowercase, Turkish letters folded to ASCII, non-alphanumerics → `_`.

> Source PNG → bot mapping (which Stitch folder is which bot) is in
> `PROJE_YAPISI.md` §5/§8. Upload each portrait under the key below.

## Historical bots (commanders/)
| Bot | S3 key |
|---|---|
| Metehan | `commanders/metehan.webp` |
| Attila the Hun | `commanders/attila_the_hun.webp` |
| Mustafa Kemal Atatürk | `commanders/mustafa_kemal_ataturk.webp` |
| Fatih Sultan Mehmet II | `commanders/fatih_sultan_mehmet_ii.webp` |
| Timur | `commanders/timur.webp` |
| Alparslan | `commanders/alparslan.webp` |
| Yavuz Sultan Selim I | `commanders/yavuz_sultan_selim_i.webp` |
| Kanuni Sultan Süleyman | `commanders/kanuni_sultan_suleyman.webp` |
| Murad IV | `commanders/murad_iv.webp` |
| Osman I Gazi | `commanders/osman_i_gazi.webp` |

## Mythological bots (bots/)
| Bot | S3 key |
|---|---|
| Kök Tengri | `bots/kok_tengri.webp` |
| Yaratıcı Ulu | `bots/yaratici_ulu.webp` |
| Toprak Ana | `bots/toprak_ana.webp` |
| Çayır Esirleri | `bots/cayir_esirleri.webp` |
| Gök Evliyası | `bots/gok_evliyasi.webp` |
| Dünya Tezgahı | `bots/dunya_tezgahi.webp` |
| Kara Erlik | `bots/kara_erlik.webp` |
| Ateş Şeytan | `bots/ates_seytan.webp` |
| Yeraltı Saldırgan | `bots/yeralti_saldirgan.webp` |
| Karanlık Tılsım | `bots/karanlik_tilsim.webp` |
| Gıcırtılı Zindancı | `bots/gicirtili_zindanci.webp` |
| Acı Çekim Tanrısı | `bots/aci_cekim_tanrisi.webp` |
| Dev Canavar | `bots/dev_canavar.webp` |
| Bozkurt Hükümdar | `bots/bozkurt_hukumdar.webp` |
| Göktürk Ruhu | `bots/gokturk_ruhu.webp` |
| Steppe Şampiyonu | `bots/steppe_sampiyonu.webp` |
| Kurt Klanı Başı | `bots/kurt_klani_basi.webp` |
| Göktürk Hafızası | `bots/gokturk_hafizasi.webp` |
| Hızlı Doğan | `bots/hizli_dogan.webp` |
| Atlı Savaş Ustası | `bots/atli_savas_ustasi.webp` |
| Fırıldak Derviş | `bots/firildak_dervis.webp` |
| Semasal Tengri | `bots/semasal_tengri.webp` |
| Sayılar Tanrısı | `bots/sayilar_tanrisi.webp` |
| Kalkülüs Cini | `bots/kalkulus_cini.webp` |
| Dede Korkut Başı | `bots/dede_korkut_basi.webp` |
| Destanlar Ozanı | `bots/destanlar_ozani.webp` |
| Hikaye Derleyeni | `bots/hikaye_derleyeni.webp` |
| Ataların Sesi | `bots/atalarin_sesi.webp` |
| Sözün Sahibi | `bots/sozun_sahibi.webp` |
| Kitap Bekçisi | `bots/kitap_bekcisi.webp` |
| Meddah Dönüşü | `bots/meddah_donusu.webp` |
| Tarih Bilgini | `bots/tarih_bilgini.webp` |
| Umay Annesi | `bots/umay_annesi.webp` |
| Doğum Sahibesi | `bots/dogum_sahibesi.webp` |
| Bereket Bekçisi | `bots/bereket_bekcisi.webp` |
| Koruyucu Peri | `bots/koruyucu_peri.webp` |
| Kız Kardeş Tanrıçası | `bots/kiz_kardes_tanricasi.webp` |
| Ev Bekçisi | `bots/ev_bekcisi.webp` |
| Bebek Yıldızı | `bots/bebek_yildizi.webp` |
| Şefkat İlahesi | `bots/sefkat_ilahesi.webp` |

## Board textures (textures/)
| Theme | S3 key |
|---|---|
| phoenix | `textures/phoenix.webp` |
| wolfteal | `textures/wolfteal.webp` |
| wolfgold | `textures/wolfgold.webp` |
| wolfwood | `textures/wolfwood.webp` |
| wolfred | `textures/wolfred.webp` |

## Voice clips
73 files named `<lineId>.mp3` (e.g. `game_start_001.mp3`) — ids listed in `src/data/komutanScripts.js`. Upload under `VITE_VOICE_CDN_URL`.
