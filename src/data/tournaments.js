/**
 * @file Static tournament definitions (spec TOURNAMENT_SYSTEM). MVP ships the
 * structure + schedule; full Arena/Ladder play arrives in v1.1. These also
 * seed the `tournaments` table (see supabase/migrations).
 */

export const TOURNAMENTS = [
  {
    id: 'tournament_1',
    name: 'Ordu Meydanı',
    type: 'arena',
    schedule: 'Her 8 saatte — 00:00 / 08:00 / 16:00',
    maxPlayers: 100,
    botPadding: true,
  },
  {
    id: 'tournament_2',
    name: 'Serasker Mücadelesi',
    type: 'ladder',
    schedule: 'Her 8 saatte — 01:00 / 09:00 / 17:00',
    maxPlayers: 100,
  },
  {
    id: 'tournament_3',
    name: "Timur'un Mirası",
    type: 'arena',
    schedule: 'Her 8 saatte — 02:00 / 10:00 / 18:00',
    maxPlayers: 100,
  },
  {
    id: 'tournament_4',
    name: "Beyazıt'ın Kaharnamı",
    type: 'ladder',
    schedule: 'Her 8 saatte — 03:00 / 11:00 / 19:00',
    maxPlayers: 100,
  },
];

export default TOURNAMENTS;
