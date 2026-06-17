/**
 * @file Tournament definitions (v1.1 TOURNAMENT_SYSTEM). The structure + live
 * features (Swiss pairing, live leaderboard, spectate, broadcast) are scheduled
 * for the dedicated Tournament phase; these entries drive the lobby listing and
 * seed the `tournaments` table.
 */

export const TOURNAMENTS = [
  {
    id: 'ordu_meydani',
    name: 'Ordu Meydanı',
    type: 'arena',
    schedule: 'Her gün 00:00 UTC',
    maxPlayers: 100,
    timeControl: 'blitz', // Blitz 3+0
    description: 'Tüm komutanların şan için savaştığı büyük arena.',
    botPadding: true,
  },
  {
    id: 'serasker_mucadelesi',
    name: 'Serasker Mücadelesi',
    type: 'ladder',
    schedule: 'Sürekli açık ladder',
    maxPlayers: 200,
    timeControl: 'rapid', // Rapid 10+0
    description: 'Basamakları tırman — rütbe ve unvan kazan.',
  },
  {
    id: 'timur_mirasi',
    name: "Timur'un Mirası",
    type: 'arena',
    schedule: 'Her Pazar 18:00 UTC',
    maxPlayers: 64,
    timeControl: 'classical', // Classical 20+10
    description: 'Yalnızca en yüksek puanlı oyunculara özel elit turnuva.',
  },
  {
    id: 'beyazit_kaharnam',
    name: "Beyazıt'ın Kaharnamı",
    type: 'knockout',
    schedule: 'Her ayın 1’i',
    maxPlayers: 32,
    timeControl: 'blitz', // Blitz 5+3
    description: 'Tek eleme — bir yenilgi ve elenirsin.',
  },
];

/** Turkish label for a tournament format. */
export const TYPE_LABEL = {
  arena: 'Arena',
  ladder: 'Ladder',
  knockout: 'Eleme',
};

export default TOURNAMENTS;
