/**
 * @file Board theme metadata (from the Stitch board-theme package). The 5
 * theme *images* are hosted on S3 (`textures/<id>.webp`) rather than bundling
 * the 2.8 MB base64 file; the small metadata (titles, accent colours, tags)
 * lives here. When no S3 texture is available the board falls back to its
 * default checker rendering, tinted with the theme accent colour.
 */

import { assetUrl } from '../utils/assets.js';

export const DEFAULT_BOARD_THEME = 'wolfGold';

/** @type {{id,title,subtitle,description,accentColor,tagColor,tags:string[],texture:string}[]} */
export const BOARD_THEMES = [
  {
    id: 'phoenix',
    title: 'Phoenix',
    subtitle: 'Kırmızı / Siyah',
    description: 'Alev tonlarında güçlü ve sinematik görünüm.',
    accentColor: '#e65d4b',
    tagColor: '#ff7361',
    tags: ['premium', 'yüksek kontrast', 'turnuva'],
    texture: 'textures/phoenix.webp',
  },
  {
    id: 'wolfTeal',
    title: 'Wolf Teal',
    subtitle: 'Turkuaz / Siyah',
    description: 'Soğuk turkuaz tonlarıyla net ve modern deneyim.',
    accentColor: '#30d5c8',
    tagColor: '#00e5d3',
    tags: ['modern', 'neon', 'odak'],
    texture: 'textures/wolfteal.webp',
  },
  {
    id: 'wolfGold',
    title: 'Wolf Gold',
    subtitle: 'Altın / Siyah',
    description: 'Altın vurgulu zengin ve prestijli tema.',
    accentColor: '#d4af37',
    tagColor: '#ffd700',
    tags: ['kraliyet', 'lüks', 'premium'],
    texture: 'textures/wolfgold.webp',
  },
  {
    id: 'wolfWood',
    title: 'Wolf Wood',
    subtitle: 'Ahşap / Siyah',
    description: 'Ahşap hissi veren sıcak ve klasik atmosfer.',
    accentColor: '#a6794e',
    tagColor: '#c89968',
    tags: ['klasik', 'organik', 'sıcak'],
    texture: 'textures/wolfwood.webp',
  },
  {
    id: 'wolfRed',
    title: 'Wolf Red',
    subtitle: 'Koyu Kırmızı / Siyah',
    description: 'Koyu kırmızı ile agresif ve rekabetçi sahne.',
    accentColor: '#8f2132',
    tagColor: '#c41e3a',
    tags: ['rekabet', 'dramatik', 'karanlık'],
    texture: 'textures/wolfred.webp',
  },
];

/** Lookup a theme by id (defaults to Wolf Gold). */
export function boardThemeById(id) {
  return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES.find((t) => t.id === DEFAULT_BOARD_THEME);
}

/** Full S3 texture URL for a theme, or null if no asset base is configured. */
export function boardTextureUrl(id) {
  return assetUrl(boardThemeById(id).texture);
}

export default BOARD_THEMES;
