/**
 * @file The 10 historical commander bots, from the Google Stitch "Imperial
 * Legacy" visual guide (gallery + 7 profiles + portraits). They are full bots
 * (playable opponents) with rich profile content for the gallery/profile pages.
 *
 * The single canonical `rating` uses the gallery ELO (2600–2980) — shown
 * identically on the gallery and profile — resolving the audit's gallery↔profile
 * ELO discrepancy. Profiles n2–n8 are sourced verbatim; Metehan/Attila/Timur
 * (no Stitch profile) are authored here so there are no dead-ends.
 */

import { ratingToDifficulty } from '../utils/rating.js';
import { slugify } from '../utils/assets.js';

/** Raw historical figures (gallery order). */
const FIGURES = [
  {
    name: 'Metehan',
    title: 'Supreme Khan',
    epithet: 'Father of the Steppe Armies',
    rating: 2980,
    personaGroup: 'BOZKURT',
    psyche: { value: 30, label: "Disciplined Will" },
    era: { label: 'MÖ 3. yüzyıl', century: 'MÖ 3. yy', range: 'MÖ 234–174', dynasty: 'Hun' },
    featured: false,
    sections: [
      {
        title: 'Foundational Vision',
        body: 'Mete Han (Modu Chanyu) forged the scattered steppe clans into the first great Hun confederation. He reorganised the army on a strict decimal system and pioneered coordinated cavalry doctrine that would echo across a thousand years of Turkic warfare.',
      },
      {
        title: 'Military Reforms',
        items: [
          { title: 'Decimal Army System', body: 'Units of tens, hundreds and thousands enabling precise command and rapid mobilisation.' },
          { title: 'The Whistling Arrow', body: 'A signalling and discipline doctrine that bound the army to a single will on the battlefield.' },
        ],
      },
    ],
  },
  {
    name: 'Attila the Hun',
    title: 'Scourge of God',
    epithet: 'Terror of Two Empires',
    rating: 2950,
    personaGroup: 'ERLIK',
    psyche: { value: 60, label: 'Relentless Fury' },
    era: { label: '5. yüzyıl', century: '5. yy', range: '434–453', dynasty: 'Hun' },
    featured: false,
    sections: [
      {
        title: 'Historical Record',
        body: 'Attila led the Hunnic Empire to its zenith, striking deep into both the Eastern and Western Roman worlds. His name became a byword for fear — an aggressive, sacrificial commander who traded everything for the decisive blow.',
      },
      {
        title: 'Campaigns',
        items: [
          { title: 'Balkan Invasions', body: 'Repeated devastating raids that forced Constantinople into tribute.', meta: '441–447' },
          { title: 'Catalaunian Plains', body: 'The great clash against Aetius — among the bloodiest battles of antiquity.', meta: '451' },
        ],
      },
    ],
  },
  {
    name: 'Mustafa Kemal Atatürk',
    title: 'Founder of the Republic',
    epithet: 'Commander of the Turkish Republic',
    rating: 2900,
    personaGroup: 'DEDE_KORKUT',
    psyche: { value: -5, label: 'Critical Strain' },
    era: { label: '20. yüzyıl', century: '20. yy', range: '1881–1938', dynasty: 'Türkiye Cumhuriyeti' },
    featured: true,
    sections: [
      {
        title: 'Historical Mandate',
        body: 'Embodies the ancestral wisdom and narrative authority of the legendary Oghuz bard, guiding the nation through profound transformation. The immense burden of severing historical ties to forge a modern republic creates deep existential dissonance.',
      },
      {
        title: 'Doctrine',
        items: [
          { title: 'Leadership Doctrine', body: 'Modernization' },
          { title: 'Cultural Anchor', body: 'Turkic Roots' },
          { title: 'Strategic Focus', body: 'Secular Independence' },
          { title: 'Military Origin', body: 'Gallipoli Campaign' },
        ],
      },
    ],
  },
  {
    name: 'Fatih Sultan Mehmet II',
    title: 'The Conqueror',
    epithet: 'The Conqueror of Worlds',
    rating: 2880,
    personaGroup: 'BOZKURT',
    psyche: { value: 45, label: 'Visionary Drive' },
    era: { label: '15. yüzyıl', century: '15. yy', range: '1432–1481', dynasty: 'Osmanlı' },
    featured: false,
    sections: [
      {
        title: 'Historical Record',
        body: 'A visionary statesman and military genius, Mehmed II ascended with an unwavering ambition: to capture the uncapturable city. His synthesis of Eastern tactical fluidity with cutting-edge siege technology reshaped the medieval world order.',
      },
      {
        title: 'Strategic Doctrine',
        items: [
          { title: 'Urban Fracture', body: 'Super-heavy artillery to systematically degrade fortifications while maintaining psychological pressure.' },
          { title: 'Overland Portaging', body: 'Unorthodox logistics — transporting fleets across land to bypass naval blockades.' },
          { title: 'Administrative Assimilation', body: 'Rapid integration of conquered bureaucracies to minimise post-conquest friction.' },
        ],
      },
    ],
  },
  {
    name: 'Timur',
    title: 'Amir of Transoxiana',
    epithet: 'The Last Great Nomad Conqueror',
    rating: 2850,
    personaGroup: 'TENGRI',
    psyche: { value: 50, label: 'Cold Calculation' },
    era: { label: '14. yüzyıl', century: '14. yy', range: '1336–1405', dynasty: 'Timurlular' },
    featured: false,
    sections: [
      {
        title: 'Historical Record',
        body: 'The empire’s namesake. Timur (Tamerlane) built a vast realm from Samarkand, blending meticulous strategic calculation with overwhelming force. A patron of art and science as much as a master of the battlefield.',
      },
      {
        title: 'Conquests',
        items: [
          { title: 'Sack of Delhi', body: 'A devastating campaign into the Indian subcontinent.', meta: '1398' },
          { title: 'Battle of Ankara', body: 'Defeated and captured Ottoman Sultan Bayezid I.', meta: '1402' },
        ],
      },
    ],
  },
  {
    name: 'Alparslan',
    title: 'Seljuk Sultan',
    epithet: 'The Great Seljuk Strategist',
    rating: 2820,
    personaGroup: 'BOZKURT',
    psyche: { value: 35, label: 'Psyche Edge' },
    era: { label: '11. yüzyıl', century: '11. yy', range: '1029–1072', dynasty: 'Selçuklu' },
    featured: false,
    stats: { winRate: 0.68, campaigns: 142 },
    sections: [
      {
        title: 'Persona: Bozkurt (Grey Wolf)',
        body: 'A bold, calculated risk-taker. Known for the decisive victory at Manzikert, Alparslan exemplifies rapid manoeuvrability and feigned retreats, leveraging psychological warfare before delivering the crushing blow.',
      },
      {
        title: 'Tactical Prowess',
        items: [
          { title: 'Crescent Envelopment', body: 'Flanks collapse inward while the centre yields, trapping the enemy in a crossfire of mounted archery.' },
          { title: 'Feigned Retreat', body: 'Draws heavy cavalry out of formation before a sudden counter-attack.' },
          { title: 'Logistical Mastery', body: 'Foraging efficiency reduces attrition, allowing deep strikes into hostile territory.' },
        ],
      },
    ],
  },
  {
    name: 'Yavuz Sultan Selim I',
    title: 'The Resolute',
    epithet: 'The Grim',
    rating: 2800,
    personaGroup: 'ERLIK',
    psyche: { value: 55, label: 'Expansionist' },
    era: { label: '16. yüzyıl', century: '16. yy', range: '1470–1520', dynasty: 'Osmanlı' },
    featured: false,
    sections: [
      {
        title: 'Historical Record',
        body: 'A merciless but calculated expansionist, Selim I doubled the size of the Ottoman Empire during his brief eight-year reign, bringing the heartlands of Islam under Ottoman dominion.',
      },
      {
        title: 'Imperial Expansion',
        items: [
          { title: 'Battle of Chaldiran', body: 'Decisive victory against the Safavids, securing Eastern Anatolia and northern Iraq.', meta: '1514' },
          { title: 'Conquest of Egypt', body: 'Defeat of the Mamluk Sultanate — Egypt, the Levant and the Hejaz brought under control.', meta: '1516–1517' },
        ],
      },
    ],
  },
  {
    name: 'Kanuni Sultan Süleyman',
    title: 'The Magnificent',
    epithet: 'The Lawgiver',
    rating: 2750,
    personaGroup: 'ULGEN',
    psyche: { value: -5, label: 'Wise Lawgiver' },
    era: { label: '16. yüzyıl', century: '16. yy', range: '1494–1566', dynasty: 'Osmanlı' },
    featured: false,
    sections: [
      {
        title: 'Historical Record',
        body: "Ruling at the absolute zenith of Ottoman power, Süleyman I orchestrated campaigns across Europe and Asia while reforming the empire's legal code — earning the epithet 'Kanuni' (The Lawgiver).",
      },
      {
        title: 'Legislative Legacy',
        items: [
          { title: 'The Kanunname', body: 'A sweeping compilation of secular laws standardising administrative and criminal codes, complementing Sharia law.' },
          { title: 'Architectural Patronage', body: 'Under chief architect Mimar Sinan, the classical Ottoman architectural paradigm was established.' },
        ],
      },
    ],
  },
  {
    name: 'Murad IV',
    title: 'The Restorer',
    epithet: 'The Destroyer — Restorer of the State',
    rating: 2700,
    personaGroup: 'ERLIK',
    psyche: { value: 40, label: 'Iron Will' },
    era: { label: '17. yüzyıl', century: '17. yy', range: '1612–1640', dynasty: 'Osmanlı' },
    featured: false,
    sections: [
      {
        title: 'Restoration Authority',
        body: 'Ascending the throne at age 11, Murad IV seized absolute power to end decades of corruption and Janissary revolts through brutal but necessary purges and the rapid execution of corrupt officials.',
      },
      {
        title: 'Key Campaigns',
        items: [
          { title: 'Reconquest of Baghdad', body: 'Ended the Ottoman–Safavid War, personally leading the army and fighting in the trenches.', meta: '1638' },
          { title: 'Yerevan Campaign', body: 'Captured Yerevan, forcing the Safavids to the negotiating table.', meta: '1635' },
        ],
      },
    ],
  },
  {
    name: 'Osman I Gazi',
    title: 'The Founder',
    epithet: 'Founder of the Ottoman Dynasty',
    rating: 2600,
    personaGroup: 'ULGEN',
    psyche: { value: -15, label: 'Patient Vision' },
    era: { label: '13. yüzyıl sonu', century: '13. yy', range: '1258–1326', dynasty: 'Osmanlı' },
    featured: false,
    sections: [
      {
        title: 'Foundational Vision',
        body: 'A visionary leader whose dreams foretold the rise of an empire bridging continents. Osman I transformed a small border principality into the seed of the Ottoman state through strategic patience and a profound sense of manifest destiny (gaza).',
      },
      {
        title: 'Strategic Milestones',
        items: [
          { title: 'Unification of the Beyliks', body: 'Anatolian principalities drawn together under a singular purpose.' },
          { title: 'Frontier Administration', body: 'Establishment of the pragmatic frontier governance (Uç Beyliği).' },
        ],
      },
    ],
  },
];

/** @type {import('../data/commanders.js').Commander[]} */
export const HISTORICAL_BOTS = FIGURES.map((f, i) => {
  const slug = slugify(f.name);
  return {
    id: `hist_${String(i + 1).padStart(2, '0')}`,
    slug,
    name: f.name,
    title: f.title,
    epithet: f.epithet,
    rating: f.rating,
    rd: 55,
    difficulty: ratingToDifficulty(f.rating),
    category: 'historical',
    personaGroup: f.personaGroup,
    psyche: f.psyche,
    era: f.era,
    stats: f.stats ?? null,
    sections: f.sections,
    featured: !!f.featured,
    portrait: `commanders/${slug}.webp`,
  };
});

/** Lookup a historical bot by slug (for the profile route). */
export function historicalBySlug(slug) {
  return HISTORICAL_BOTS.find((c) => c.slug === slug) ?? null;
}

export default HISTORICAL_BOTS;
