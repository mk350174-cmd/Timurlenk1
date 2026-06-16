/**
 * @file 50 bot "commanders" across 8 ELO tiers (1000–2400), per spec
 * TOURNAMENT_SYSTEM.bot_elo_distribution & BOT_GAMEPLAY_SYSTEM.
 *
 * Names are historical Ottoman/Timurid figures used as bot personas — these
 * are PLACEHOLDERS; the final curated 50 (with bios) will be user-provided.
 * Each commander maps its ELO to a JS-engine difficulty label; when the Apex
 * Timur motor is present it will instead play at the commander's true ELO.
 */

/** Map an ELO tier to a JS fallback difficulty label. */
export function ratingToDifficulty(rating) {
  if (rating <= 1100) return 'easy';
  if (rating <= 1500) return 'medium';
  if (rating <= 1900) return 'hard';
  if (rating <= 2200) return 'expert';
  return 'master';
}

/** Raw roster grouped by ELO tier (5–7 per tier → 50 total). */
const ROSTER = [
  // 1000 — Acemi
  ['Mihaloğlu Ali Bey', 1000], ['Malkoçoğlu Bali Bey', 1000], ['İshak Paşa', 1000],
  ['Hersekzade Ahmed', 1000], ['Hadım Şehabeddin', 1000], ['Karaca Paşa', 1000],
  // 1200
  ['Gazi Evrenos Bey', 1200], ['Turahan Bey', 1200], ['Zağanos Paşa', 1200],
  ['Hadım Süleyman', 1200], ['Davud Paşa', 1200], ['Gedik Ahmed Paşa', 1200],
  // 1400
  ['Çandarlı Halil', 1400], ['Mahmud Paşa', 1400], ['Koca Sinan Paşa', 1400],
  ['Tiryaki Hasan Paşa', 1400], ['Lala Kara Mustafa', 1400], ['Özdemiroğlu Osman', 1400],
  // 1600 — Orta
  ['Pargalı İbrahim', 1600], ['Damat Ali Paşa', 1600], ['Cezayirli Gazi Hasan', 1600],
  ['Köprülü Fazıl Ahmed', 1600], ['Kara Mustafa Paşa', 1600], ['Piri Reis', 1600],
  // 1800
  ['Turgut Reis', 1800], ['Köprülü Mehmed Paşa', 1800], ['Sokollu Mehmed Paşa', 1800],
  ['Barbaros Hayreddin', 1800], ['Pir Muhammed', 1800], ['Khalil Sultan', 1800],
  // 2000
  ['Miran Şah', 2000], ['Ebu Said', 2000], ['Hüseyin Baykara', 2000],
  ['Şah Ruh', 2000], ['Uluğ Bey', 2000], ['Murad I (Hüdavendigâr)', 2000],
  // 2200 — Uzman
  ['Orhan Gazi', 2200], ['Mehmed I Çelebi', 2200], ['Murad II', 2200],
  ['Osman Gazi', 2200], ['Bayezid I (Yıldırım)', 2200], ['Selim II', 2200], ['Murad IV', 2200],
  // 2400 — Usta
  ['Fatih Sultan Mehmed', 2400], ['Yavuz Sultan Selim', 2400], ['Kanuni Süleyman', 2400],
  ['Şehzade Korkut', 2400], ['Cem Sultan', 2400], ['Timur Bey', 2400], ['Emir Timurlenk', 2400],
];

/**
 * @typedef {Object} Commander
 * @property {string} id
 * @property {string} name
 * @property {number} rating ELO
 * @property {string} difficulty JS-engine difficulty label
 * @property {number} rd rating deviation (stable → low)
 */

/** @type {Commander[]} */
export const COMMANDERS = ROSTER.map(([name, rating], i) => ({
  id: `cmd_${i + 1}`,
  name,
  rating,
  rd: 60,
  difficulty: ratingToDifficulty(rating),
}));

/** Distinct ELO tiers present in the roster (ascending). */
export const RATING_TIERS = [...new Set(COMMANDERS.map((c) => c.rating))].sort((a, b) => a - b);

/** Pick a commander near a target rating (for fair matchmaking). */
export function pickCommanderNear(rating) {
  const sorted = [...COMMANDERS].sort(
    (a, b) => Math.abs(a.rating - rating) - Math.abs(b.rating - rating),
  );
  const pool = sorted.slice(0, 5);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Lookup by id. */
export function commanderById(id) {
  return COMMANDERS.find((c) => c.id === id) ?? null;
}

export default COMMANDERS;
