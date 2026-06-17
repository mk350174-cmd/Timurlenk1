/**
 * @file Komutan voice scripts — the 73 finalized Turkish lines (16 scenarios)
 * from VOICE_SCRIPTS_73_LINES, each with a stable `id` matching the S3 MP3 file
 * name (`<id>.mp3`). When the voice CDN is configured the store plays the MP3;
 * otherwise it falls back to the Web Speech API with the same `text`.
 *
 * `opponentIntro` is text-only flavour (templated with the opponent name) and
 * has no MP3 — it is spoken via Web Speech / shown in the widget only.
 */

/** @typedef {{ id: string, category: string, text: string }} VoiceLine */

/** @type {VoiceLine[]} — the 73 canonical lines. */
export const SCRIPTS = [
  // GAME START
  { id: 'game_start_001', category: 'game_start', text: 'Hazır ol! Şimdi kahramanlık göstereceksin.' },
  { id: 'game_start_002', category: 'game_start', text: 'Savaş meydanına hoş geldin!' },
  { id: 'game_start_003', category: 'game_start', text: 'Ordun senin komuta edilmesini bekliyor.' },
  { id: 'game_start_004', category: 'game_start', text: 'Başlasın bu denkleşme. Zafer için!' },
  { id: 'game_start_005', category: 'game_start', text: 'Harita hazırlandı. Stratejini göster!' },
  // MID-GAME BALANCED
  { id: 'midgame_balanced_001', category: 'midgame_balanced', text: 'Güzel hamle, devam et!' },
  { id: 'midgame_balanced_002', category: 'midgame_balanced', text: 'İyi oynuyorsun, böyle devam!' },
  { id: 'midgame_balanced_003', category: 'midgame_balanced', text: 'Hamlelerin mantıklı, analiz et!' },
  { id: 'midgame_balanced_004', category: 'midgame_balanced', text: 'Strateji iyiymiş, pekiştir!' },
  { id: 'midgame_balanced_005', category: 'midgame_balanced', text: 'Dikkat et, düşman da düşünüyor!' },
  // MID-GAME ADVANTAGE
  { id: 'midgame_advantage_001', category: 'midgame_advantage', text: 'Zafer yakın! Tüm gücle saldır!' },
  { id: 'midgame_advantage_002', category: 'midgame_advantage', text: 'Durum senin tarafında! Hatayı kullan!' },
  { id: 'midgame_advantage_003', category: 'midgame_advantage', text: 'Pozisyon mükemmel! Şimdi saldır!' },
  { id: 'midgame_advantage_004', category: 'midgame_advantage', text: 'Rakip eziliyor! Pas verme!' },
  { id: 'midgame_advantage_005', category: 'midgame_advantage', text: 'Harika bir yer! Buradan kazan!' },
  // MID-GAME DISADVANTAGE
  { id: 'midgame_disadvantage_001', category: 'midgame_disadvantage', text: 'Çelik gibi dayanacaksın! Bir fırsat bul.' },
  { id: 'midgame_disadvantage_002', category: 'midgame_disadvantage', text: 'Kayıp göründüyor ama devam et...' },
  { id: 'midgame_disadvantage_003', category: 'midgame_disadvantage', text: 'Zor pozisyon. Sabrın gücü!' },
  { id: 'midgame_disadvantage_004', category: 'midgame_disadvantage', text: 'Hata yaptık ama savaş devam!' },
  { id: 'midgame_disadvantage_005', category: 'midgame_disadvantage', text: 'Tek hamle ile değişebilir. Dikkat et!' },
  // PUZZLE START
  { id: 'puzzle_start_001', category: 'puzzle_start', text: 'Bu bulmacayı çöz! Hamleyi bul.' },
  { id: 'puzzle_start_002', category: 'puzzle_start', text: 'Çöz bunu ve ordunu ilerlet!' },
  { id: 'puzzle_start_003', category: 'puzzle_start', text: 'Talim zamanı! Dikkat et!' },
  { id: 'puzzle_start_004', category: 'puzzle_start', text: 'Zorlu bir durum. Analiz et!' },
  { id: 'puzzle_start_005', category: 'puzzle_start', text: 'Stratejini göster!' },
  // PUZZLE HINT
  { id: 'puzzle_hint_001', category: 'puzzle_hint', text: 'En güçlü taşını düşün. Atak yap.' },
  { id: 'puzzle_hint_002', category: 'puzzle_hint', text: 'Pozisyonu yeniden analiz et.' },
  { id: 'puzzle_hint_003', category: 'puzzle_hint', text: 'Saldırı yolu var mı?' },
  { id: 'puzzle_hint_004', category: 'puzzle_hint', text: 'Düşünmeye devam!' },
  { id: 'puzzle_hint_005', category: 'puzzle_hint', text: 'Cevap yakında gelecek...' },
  // PUZZLE STUCK
  { id: 'puzzle_stuck_001', category: 'puzzle_stuck', text: 'Zamanı biraz daha düşün...' },
  { id: 'puzzle_stuck_002', category: 'puzzle_stuck', text: 'Sabırlı ol. Cevap gelecek.' },
  { id: 'puzzle_stuck_003', category: 'puzzle_stuck', text: 'Sakinliğini koru. Göreceksin!' },
  { id: 'puzzle_stuck_004', category: 'puzzle_stuck', text: 'Gözlerini aç. Değerlendirme yap!' },
  { id: 'puzzle_stuck_005', category: 'puzzle_stuck', text: 'Hamleleri say. Bulacaksın!' },
  // VICTORY
  { id: 'victory_001', category: 'victory', text: "Zafer! Timurlenk'in ruhundan kuvvet aldın!" },
  { id: 'victory_002', category: 'victory', text: 'Bravo! Muasır medeniyetler senin tarafında!' },
  { id: 'victory_003', category: 'victory', text: 'Şah mat! Ordunu övüyorum!' },
  { id: 'victory_004', category: 'victory', text: 'Kazandın! Tarih seni hatırlayacak!' },
  { id: 'victory_005', category: 'victory', text: 'Harika oyun! Sen bu tahta için doğdun!' },
  // DEFEAT
  { id: 'defeat_001', category: 'defeat', text: 'Bu sefer talihsiz olduk. Bir sonraki savaşa hazırlan.' },
  { id: 'defeat_002', category: 'defeat', text: 'Şah mat... Ama asker olmaya devam et.' },
  { id: 'defeat_003', category: 'defeat', text: 'Dönemini yap. Gelecek savaş senin olacak.' },
  { id: 'defeat_004', category: 'defeat', text: 'Utanma. En büyük komutanlar da kaybetti.' },
  { id: 'defeat_005', category: 'defeat', text: 'Ders al ve geri dön!' },
  // CHECK
  { id: 'check_001', category: 'check', text: 'Şah! Hızlı hareket et!' },
  { id: 'check_002', category: 'check', text: 'Dikkat! Kral tehlikede!' },
  { id: 'check_003', category: 'check', text: 'Savun! Hemen!' },
  { id: 'check_004', category: 'check', text: 'Şah durumuyla! Çabuk!' },
  { id: 'check_005', category: 'check', text: 'Kral korunmalı!' },
  // CHECKMATE PREVENTION (save)
  { id: 'save_001', category: 'save', text: 'Son hamle! Yapabilirim!' },
  { id: 'save_002', category: 'save', text: 'Felaketi önledim!' },
  { id: 'save_003', category: 'save', text: 'Beraber kaldık!' },
  { id: 'save_004', category: 'save', text: 'Bir hamlelik fark!' },
  { id: 'save_005', category: 'save', text: 'Kurtulduk! Devam et!' },
  // BLUNDER
  { id: 'blunder_001', category: 'blunder', text: 'Ay! Büyük hata!' },
  { id: 'blunder_002', category: 'blunder', text: 'Aman! Neyi düşündün?' },
  { id: 'blunder_003', category: 'blunder', text: 'Aman tanrım! Geri al!' },
  { id: 'blunder_004', category: 'blunder', text: 'Bu hamleyi haklı göster!' },
  { id: 'blunder_005', category: 'blunder', text: 'Taş kayıyor! Dikkat!' },
  // TOURNAMENT ANNOUNCE
  { id: 'tournament_announce_001', category: 'tournament_announce', text: "Ordu Meydanı açılıyor! Tüm komutanlar arena'ya çağırılır!" },
  { id: 'tournament_announce_002', category: 'tournament_announce', text: 'Serasker Mücadelesi başlıyor! Sıralamanı yükselt!' },
  { id: 'tournament_announce_003', category: 'tournament_announce', text: 'Turnuva zamanı! En iyi kazan!' },
  // TOURNAMENT QUALIFY
  { id: 'tournament_qualify_001', category: 'tournament_qualify', text: "Harika! Son 8'e yükseldin! Devam et!" },
  { id: 'tournament_qualify_002', category: 'tournament_qualify', text: 'Çeyrek finalde! Daha güçlen!' },
  { id: 'tournament_qualify_003', category: 'tournament_qualify', text: 'Elite katıldın! Başarı devam!' },
  // TOURNAMENT SEMI
  { id: 'tournament_semi_001', category: 'tournament_semi', text: 'Yarı final! Zirveye doğru!' },
  { id: 'tournament_semi_002', category: 'tournament_semi', text: 'Finale çok yakın! Kalan 2 adım!' },
  { id: 'tournament_semi_003', category: 'tournament_semi', text: 'Zirve görünüyor! Devam et!' },
  // TOURNAMENT FINAL
  { id: 'tournament_final_001', category: 'tournament_final', text: 'Final! Tüm gözler sana! Zafer kazan!' },
  { id: 'tournament_final_002', category: 'tournament_final', text: 'En yüksek adım! Tüm kudretini kullan!' },
  { id: 'tournament_final_003', category: 'tournament_final', text: 'Şampiyonluk sana! Al onu!' },
  { id: 'tournament_final_004', category: 'tournament_final', text: 'Taht senin olacak! Zafer getir!' },
];

/**
 * Backward-compatible scenario names (used by existing call sites) → canonical
 * voice categories.
 */
const SCENARIO_ALIAS = {
  gameStart: 'game_start',
  goodMove: 'midgame_balanced',
  warn: 'midgame_balanced',
  advantage: 'midgame_advantage',
  disadvantage: 'midgame_disadvantage',
  puzzleStart: 'puzzle_start',
  puzzleHint: 'puzzle_hint',
  puzzleStuck: 'puzzle_stuck',
  puzzleSolved: 'victory',
  victory: 'victory',
  defeat: 'defeat',
  check: 'check',
  save: 'save',
  blunder: 'blunder',
  tournamentAnnounce: 'tournament_announce',
  tournamentQualify: 'tournament_qualify',
  tournamentSemi: 'tournament_semi',
  tournamentFinal: 'tournament_final',
};

/** Text-only flavour lines that have no MP3 (templated with vars). */
const TEXT_ONLY = {
  opponentIntro: ['{name} karşına çıktı. Onu hafife alma.', 'Rakibin {name}. Tahtanın her köşesini izle.'],
};

const interpolate = (text, vars = {}) => {
  let out = text;
  for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, v);
  return out;
};

/**
 * Pick a line for a scenario.
 * @param {string} scenario alias or canonical category
 * @param {Record<string,string>} [vars]
 * @returns {{ id: string|null, text: string }}
 */
export function pickLine(scenario, vars = {}) {
  if (TEXT_ONLY[scenario]) {
    const pool = TEXT_ONLY[scenario];
    return { id: null, text: interpolate(pool[Math.floor(Math.random() * pool.length)], vars) };
  }
  const category = SCENARIO_ALIAS[scenario] ?? scenario;
  const pool = SCRIPTS.filter((s) => s.category === category);
  if (pool.length === 0) return { id: null, text: '' };
  const line = pool[Math.floor(Math.random() * pool.length)];
  return { id: line.id, text: interpolate(line.text, vars) };
}

/**
 * Back-compat helper returning just the text.
 * @param {string} scenario
 * @param {Record<string,string>} [vars]
 * @returns {string}
 */
export function komutanLine(scenario, vars) {
  return pickLine(scenario, vars).text;
}

export default SCRIPTS;
