# Data Contract — Commanders, Personas, Board Themes

Single source of truth for the bot roster and related catalogs. Resolves the
audit's findings (one ELO per commander, versionable JSON-like data, no
gallery↔profile mismatch).

## Commander (bot) — `src/data/commanders.js`
50 bots in two categories; merged from `mythologicalBots.js` (40) +
`historicalBots.js` (10). Backward-compatible base fields are required by the
tournament/game engine.

```ts
type Commander = {
  id: string;            // 'myth_01' | 'hist_01'
  slug: string;          // url + portrait key
  name: string;
  rating: number;        // single canonical ELO (gallery value for historical)
  rd: number;            // rating deviation
  difficulty: 'easy'|'medium'|'hard'|'expert'|'master'; // = ratingToDifficulty(rating)
  category: 'mythological' | 'historical';
  personaGroup: 'ULGEN'|'ERLIK'|'BOZKURT'|'TENGRI'|'DEDE_KORKUT'|'UMAY';
  psyche: number | { value: number; label: string }; // myth: number; hist: object
  portrait: string;      // S3 key (see asset-manifest.md)
  // historical only:
  title?: string;        // gallery title (e.g. "The Conqueror")
  epithet?: string;      // profile epithet
  era?: { label: string; century: string; range: string; dynasty: string };
  stats?: { winRate?: number; campaigns?: number } | null;
  sections?: { title: string; body?: string; items?: { title: string; body?: string; meta?: string }[] }[];
  featured?: boolean;    // 2×2 gallery highlight (Atatürk)
};
```

**ELO rule:** historical bots use ONE `rating` (the gallery/legendary value,
2600–2980) shown identically on gallery + profile. The old "profile ELO" scale
is dropped → no discrepancy. Mythological bots span 1100–2300.

**PSYCHE legend:** scale −100…+100. Negative = inward / defensive / burdened;
positive = aggressive / sacrificial. `label` is a short descriptor.

## Persona groups — `src/utils/constants.js` (`PERSONA_GROUPS`)
Six families shared by both categories; each is also a playstyle archetype and
carries a signifier colour used by the Mythic Tamer UI:
`ULGEN` (positional), `ERLIK` (aggressive), `BOZKURT` (tempo), `TENGRI` (pure
calculation), `DEDE_KORKUT` (book/openings), `UMAY` (defensive).

## Board theme — `src/data/boardThemes.js` (`BOARD_THEMES`)
```ts
type BoardTheme = {
  id: string;            // 'phoenix'|'wolfTeal'|'wolfGold'|'wolfWood'|'wolfRed'
  title: string; subtitle: string; description: string;
  accentColor: string; tagColor: string; tags: string[];
  texture: string;       // S3 key 'textures/<id>.webp'
};
```
Default `wolfGold`. Texture loads from S3; falls back to the default checker
board tinted with `accentColor`.

## Voice line — `src/data/komutanScripts.js` (`SCRIPTS`)
`{ id, category, text }` — 73 lines / 16 categories. `id` = MP3 file name
(`<id>.mp3`). `pickLine(scenario, vars)` → `{ id, text }`.
