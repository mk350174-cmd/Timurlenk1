/**
 * @file The 40 mythological bot commanders (Turkic mythology personas), from the
 * Google Stitch "continuous progress tracker" package. Each belongs to one of
 * the six persona groups, which double as playstyle archetypes. Portraits are
 * served from S3 via `assetUrl(portrait)`.
 *
 * Source roster: stitch `timurlenk_bot_gorselpromptlari.txt`.
 */

import { ratingToDifficulty } from '../utils/rating.js';
import { slugify } from '../utils/assets.js';

/** [name, ELO, psyche, theme, personaGroup] — 40 bots across 6 groups. */
const ROSTER = [
  // GROUP 1 — ÜLGEN (Yaratıcı & Pozisyonel)
  ['Kök Tengri', 1900, -10, 'Gök Tanrısı', 'ULGEN'],
  ['Yaratıcı Ulu', 1600, 0, 'Kozmos Sanatçısı', 'ULGEN'],
  ['Toprak Ana', 1200, -30, 'Verimli Toprak', 'ULGEN'],
  ['Çayır Esirleri', 1100, 20, 'Doğa Ruhu', 'ULGEN'],
  ['Gök Evliyası', 1400, -20, 'Aziz Bilge', 'ULGEN'],
  ['Dünya Tezgahı', 1300, 10, 'Evren Dokuyucusu', 'ULGEN'],
  // GROUP 2 — ERLİK (Agresif, Taktik, Feda)
  ['Kara Erlik', 2200, 70, 'Cehennem Hakimi', 'ERLIK'],
  ['Ateş Şeytan', 2050, 65, 'Yangın Cini', 'ERLIK'],
  ['Yeraltı Saldırgan', 1850, 50, 'Karanlık Güç', 'ERLIK'],
  ['Karanlık Tılsım', 1550, 40, 'Büyü Yapıcısı', 'ERLIK'],
  ['Gıcırtılı Zindancı', 1350, 30, 'Zindan Sahibi', 'ERLIK'],
  ['Acı Çekim Tanrısı', 1150, 20, 'İşkence Ustası', 'ERLIK'],
  ['Dev Canavar', 1950, 55, 'Mitolojik Canavar', 'ERLIK'],
  // GROUP 3 — BOZKURT (Dinamik, Reaktif, Tempo)
  ['Bozkurt Hükümdar', 2100, 50, 'Kurt Klanı Başı', 'BOZKURT'],
  ['Göktürk Ruhu', 1750, 30, 'Ataların Ruhu', 'BOZKURT'],
  ['Steppe Şampiyonu', 1450, 10, 'Şaman Gücü', 'BOZKURT'],
  ['Kurt Klanı Başı', 1250, -10, 'Vahşi Kurt', 'BOZKURT'],
  ['Göktürk Hafızası', 1400, 20, 'Tarih Sahibi', 'BOZKURT'],
  ['Hızlı Doğan', 1600, 40, 'Cirit Atıcısı', 'BOZKURT'],
  ['Atlı Savaş Ustası', 1700, 35, 'At Şövalyesi', 'BOZKURT'],
  ['Fırıldak Derviş', 1350, 25, 'Dervişin Oğlu', 'BOZKURT'],
  // GROUP 4 — TENGRİ (Saf Hesap, Robot, Max Derinlik)
  ['Semasal Tengri', 2300, 0, 'Gök Algoritması', 'TENGRI'],
  ['Sayılar Tanrısı', 1650, 0, 'Matematik Ruhu', 'TENGRI'],
  ['Kalkülüs Cini', 1200, 0, 'Bilim Cini', 'TENGRI'],
  // GROUP 5 — DEDE KORKUT (Tecrübe, Açılış, Kitap Bilgisi)
  ['Dede Korkut Başı', 2050, -10, 'Destanın Ozanı', 'DEDE_KORKUT'],
  ['Destanlar Ozanı', 1650, 5, 'Hikaye Anlatıcısı', 'DEDE_KORKUT'],
  ['Hikaye Derleyeni', 1300, -5, 'Tarih Kayıtçısı', 'DEDE_KORKUT'],
  ['Ataların Sesi', 1550, 0, 'Ata Yolu', 'DEDE_KORKUT'],
  ['Sözün Sahibi', 1400, 10, 'Konuşma Ustası', 'DEDE_KORKUT'],
  ['Kitap Bekçisi', 1150, -15, 'Bilgelik Sahibi', 'DEDE_KORKUT'],
  ['Meddah Dönüşü', 1480, 8, 'Halk Ozanı Ustası', 'DEDE_KORKUT'],
  ['Tarih Bilgini', 1320, -12, 'Arkeolog', 'DEDE_KORKUT'],
  // GROUP 6 — UMAY (Savunmacı, Şah Güvenliği, Şefkat)
  ['Umay Annesi', 1950, -40, 'Doğum Tanrıçası', 'UMAY'],
  ['Doğum Sahibesi', 1550, -25, 'Anne Sevgisi', 'UMAY'],
  ['Bereket Bekçisi', 1100, -10, 'Bolluk Ruhu', 'UMAY'],
  ['Koruyucu Peri', 1750, -30, 'Melek Peri', 'UMAY'],
  ['Kız Kardeş Tanrıçası', 1450, -20, 'Aile Bağı', 'UMAY'],
  ['Ev Bekçisi', 1350, -35, 'Ocak Ruhu', 'UMAY'],
  ['Bebek Yıldızı', 1200, -15, 'Yeni Başlangıç', 'UMAY'],
  ['Şefkat İlahesi', 1500, -22, 'Merhamet Kaynağı', 'UMAY'],
];

/**
 * @typedef {import('../data/commanders.js').Commander} Commander
 */

/** @type {Commander[]} */
export const MYTHOLOGICAL_BOTS = ROSTER.map(([name, rating, psyche, theme, personaGroup], i) => {
  const slug = slugify(name);
  return {
    id: `myth_${String(i + 1).padStart(2, '0')}`,
    slug,
    name,
    rating,
    rd: 70,
    difficulty: ratingToDifficulty(rating),
    category: 'mythological',
    personaGroup,
    psyche,
    theme,
    portrait: `bots/${slug}.webp`,
  };
});

export default MYTHOLOGICAL_BOTS;
