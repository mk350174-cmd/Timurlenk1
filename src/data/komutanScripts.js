/**
 * @file Komutan voice scripts — Modern Turkish, "strict military commander +
 * wise mentor" tone (per the v1.1 QUICK DECISION AID recommendation).
 *
 * These are the written scripts the spec asks Claude to provide for the 8+
 * scenarios. They are spoken via the Web Speech API now and can be re-rendered
 * with ElevenLabs later without changing call sites. `{name}` is interpolated
 * with the opponent commander's name where relevant.
 */

export const KOMUTAN_SCRIPTS = {
  gameStart: [
    'Hazır ol! Şimdi kahramanlık göstereceksin.',
    'Ordun emrini bekliyor. Akıllıca yönet, komutanım.',
    'Savaş başlıyor. Soğukkanlı ol, zafer cesurların olur.',
  ],
  opponentIntro: [
    '{name} karşına çıktı. Onu hafife alma.',
    'Rakibin {name}. Tahtanın her köşesini izle.',
  ],
  goodMove: [
    'Güzel hamle, devam et!',
    'İşte bu! Hat üstünlüğünü koru.',
    'Doğru karar. Baskıyı sürdür.',
  ],
  warn: [
    'Dikkat et, düşman tuzak kuruyor.',
    'Aceleci olma — bir sonraki hamleni iyi düşün.',
    'Kanadın açık kaldı, savunmanı topla.',
  ],
  advantage: [
    'Zafer yakın! Tüm gücünle saldır.',
    'Üstünsün — şimdi gevşeme, hamleyi bitir.',
  ],
  disadvantage: [
    'Çelik gibi dayanacaksın! Bir fırsat bul.',
    'Geri çekilmek de bir taktiktir. Sabret, komutanım.',
  ],
  victory: [
    "Zafer! Timurlenk'in ardından yürüdün!",
    'Düşman dağıldı. Bu zafer senindir, komutanım!',
  ],
  defeat: [
    'Bu sefer talihsiz olduk. Bir sonraki savaşa hazırlan.',
    'Yenilgi, en iyi öğretmendir. Dersini al ve geri dön.',
  ],
  puzzleStart: [
    'Bu bulmacayı çöz ve ordunu ilerlet!',
    'Strateji vakti. Şah’ı tek hamlede düşür.',
  ],
  puzzleHint: [
    'Hamleyi tekrar düşün. En güçlü taşını kullan.',
    'Düşman şahına giden yolu ara — taşların hizada mı?',
  ],
  puzzleSolved: [
    'Mükemmel! Zekânla kazandın.',
    'İşte komutanlık budur. Sıradaki bulmacaya!',
  ],
  tournamentAnnounce: [
    'Ordu Meydanı açılıyor! Tüm komutanlar arenaya davet edilir.',
    'Turnuva başlıyor — şanını ilan etme vakti, komutanım!',
  ],
};

/**
 * Get a random line for a scenario with simple `{var}` interpolation.
 * @param {string} scenario
 * @param {Record<string,string>} [vars]
 * @returns {string}
 */
export function komutanLine(scenario, vars = {}) {
  const pool = KOMUTAN_SCRIPTS[scenario] ?? [];
  if (pool.length === 0) return '';
  let line = pool[Math.floor(Math.random() * pool.length)];
  for (const [k, v] of Object.entries(vars)) line = line.replaceAll(`{${k}}`, v);
  return line;
}

export default KOMUTAN_SCRIPTS;
