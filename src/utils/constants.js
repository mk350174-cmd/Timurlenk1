/**
 * @file Game-wide constants for Timurlenk Satranç.
 * Keeping every "magic" value here satisfies the DRY requirement and makes the
 * eventual Apex Timur (WASM) engine swap a single-file change.
 */

/**
 * Board dimensions for Timurlenk (Tamerlane) chess.
 * NOTE: This is an 11×10 board (110 squares), NOT the classic 8×8.
 * @type {{ files: number, ranks: number, squares: number }}
 */
export const BOARD_SIZE = Object.freeze({ files: 11, ranks: 10, squares: 110 });

/** Piece color codes. @enum {string} */
export const COLOR = Object.freeze({ WHITE: 'w', BLACK: 'b' });

/**
 * Piece type codes (Turkish names — Timurlenk theme).
 * - sah    = King
 * - vezir  = Vizier (queen-like slider)
 * - kale   = Rook
 * - fil    = Bishop
 * - at     = Knight
 * - deve   = Camel (Tamerlane special: (3,1) leaper)
 * - piyade = Pawn
 * @enum {string}
 */
export const PIECE = Object.freeze({
  SAH: 'sah',
  VEZIR: 'vezir',
  KALE: 'kale',
  FIL: 'fil',
  AT: 'at',
  DEVE: 'deve',
  PIYADE: 'piyade',
});

/**
 * Display glyphs / labels per piece type. Standard pieces use solid Unicode
 * chess glyphs (rendered with an explicit per-side color on the canvas); the
 * camel has no reliable glyph so it is drawn as a labelled disc using `label`.
 * @type {Record<string, { glyph?: string, label?: string, tr: string }>}
 */
export const PIECE_VISUAL = Object.freeze({
  [PIECE.SAH]: { glyph: '♚', tr: 'Şah' }, // ♚
  [PIECE.VEZIR]: { glyph: '♛', tr: 'Vezir' }, // ♛
  [PIECE.KALE]: { glyph: '♜', tr: 'Kale' }, // ♜
  [PIECE.FIL]: { glyph: '♝', tr: 'Fil' }, // ♝
  [PIECE.AT]: { glyph: '♞', tr: 'At' }, // ♞
  [PIECE.PIYADE]: { glyph: '♟', tr: 'Piyade' }, // ♟
  [PIECE.DEVE]: { label: 'D', tr: 'Deve' }, // camel — no standard glyph
});

/**
 * Legacy symbol map kept for compatibility with the spec sample
 * (`PIECE_SYMBOLS['W_SAH']`). Uses the outline glyphs for white.
 * @type {Record<string, string>}
 */
export const PIECE_SYMBOLS = Object.freeze({
  W_SAH: '♔', B_SAH: '♚',
  W_VEZIR: '♕', B_VEZIR: '♛',
  W_KALE: '♖', B_KALE: '♜',
  W_FIL: '♗', B_FIL: '♝',
  W_AT: '♘', B_AT: '♞',
  W_PIYADE: '♙', B_PIYADE: '♟',
  W_DEVE: 'D', B_DEVE: 'D',
});

/**
 * Time controls. `initial` is seconds on the clock, `increment` is seconds
 * added per move (Fischer increment).
 * @type {Record<string, { name: string, initial: number, increment: number, icon: string }>}
 */
export const TIME_CONTROLS = Object.freeze({
  bullet: { name: 'Bullet', initial: 60, increment: 0, icon: '🚀' },
  blitz: { name: 'Blitz', initial: 180, increment: 2, icon: '⚡' },
  rapid: { name: 'Rapid', initial: 600, increment: 10, icon: '⏱️' },
  classical: { name: 'Classical', initial: 1800, increment: 30, icon: '🏛️' },
});

/** Ordered list of time-control keys. @type {string[]} */
export const TIME_CONTROL_KEYS = Object.freeze(['bullet', 'blitz', 'rapid', 'classical']);

/** Game result codes stored in the DB. @enum {string} */
export const RESULT = Object.freeze({
  PLAYER1_WIN: 'player1_win',
  PLAYER2_WIN: 'player2_win',
  DRAW: 'draw',
  ABANDONED: 'abandoned',
});

/** Default Glicko-2 starting values. */
export const RATING_DEFAULTS = Object.freeze({
  rating: 1000,
  rd: 350,
  volatility: 0.06,
});

/** LocalStorage keys used by the offline subsystem. */
export const STORAGE_KEYS = Object.freeze({
  OFFLINE_GAMES: 'timurlenk.offline_games',
  LICENSE_KEYS: 'timurlenk.license_keys',
  USER_PREFERENCES: 'timurlenk.user_preferences',
  GAME_SETTINGS: 'timurlenk.game_settings',
  LOCAL_AUTH: 'timurlenk.local_auth',
  LOCAL_PROFILE: 'timurlenk.local_profile',
  TALIM_PROGRESS: 'timurlenk.talim_progress',
  TROPHIES: 'timurlenk.trophies',
});

/** Routes used across the app (single source of truth for navigation). */
export const ROUTES = Object.freeze({
  HOME: '/',
  TALIM: '/talim',
  PLAY: '/play',
  GAME: '/play/:gameId',
  PROFILE: '/profile',
  LEADERBOARD: '/leaderboard',
});

/** How long matchmaking searches before offering a bot opponent (ms). */
export const MATCHMAKING_TIMEOUT_MS = 120_000; // 2 minutes (spec)

/**
 * The six bot persona families (Turkic mythology) shared by both bot
 * categories. Each carries a Turkish playstyle descriptor (from the Stitch
 * character-selection design) and a signifier colour used by the Mythic Tamer
 * faction tabs/cards.
 * @type {Record<string, { key:string, name:string, playstyle:string, color:string }>}
 */
export const PERSONA_GROUPS = Object.freeze({
  ULGEN: { key: 'ULGEN', name: 'Ülgen', playstyle: 'Yaratıcı & Pozisyonel', color: '#7bd0ff' },
  ERLIK: { key: 'ERLIK', name: 'Erlik', playstyle: 'Agresif · Taktik · Feda', color: '#ff5a4d' },
  BOZKURT: { key: 'BOZKURT', name: 'Bozkurt', playstyle: 'Dinamik · Reaktif · Tempo', color: '#cdd5e6' },
  TENGRI: { key: 'TENGRI', name: 'Tengri', playstyle: 'Saf Hesap · Maksimum Derinlik', color: '#a78bfa' },
  DEDE_KORKUT: { key: 'DEDE_KORKUT', name: 'Dede Korkut', playstyle: 'Tecrübe · Açılış Bilgisi', color: '#ffb95f' },
  UMAY: { key: 'UMAY', name: 'Umay', playstyle: 'Savunmacı · Şah Güvenliği', color: '#6ee7b7' },
});

/** Ordered persona-group keys (Mythic Tamer faction-tab order). */
export const PERSONA_ORDER = Object.freeze([
  'ULGEN', 'ERLIK', 'BOZKURT', 'TENGRI', 'DEDE_KORKUT', 'UMAY',
]);

/** HTTP polling interval for the realtime fallback (ms). */
export const POLL_INTERVAL_MS = 500;

/** Password policy (spec: min 8, 1 uppercase, 1 number, 1 special char). */
export const PASSWORD_POLICY = Object.freeze({
  minLength: 8,
  regex: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
  hint: 'En az 8 karakter, 1 büyük harf, 1 rakam ve 1 özel karakter.',
});
