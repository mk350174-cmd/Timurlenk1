/**
 * @file Game-related JSDoc typedefs. (The MVP is plain JS + JSDoc; these mirror
 * the `*.ts` files named in the spec without requiring a TypeScript toolchain.)
 */

/**
 * @typedef {Object} Piece
 * @property {('w'|'b')} c color
 * @property {string} t piece type (see PIECE in constants.js)
 */

/**
 * @typedef {(Piece|null)[]} Position 110-cell flat board array
 */

/**
 * @typedef {Object} Move
 * @property {number} from source square (0–109)
 * @property {number} to destination square (0–109)
 * @property {Piece} piece moved piece
 * @property {Piece|null} captured captured piece, if any
 * @property {string} [promotion] promotion target type
 * @property {('w'|'b')} color side that moved
 */

/**
 * @typedef {Object} GameRecord
 * @property {string} id
 * @property {string} time_control
 * @property {string|null} player1_id
 * @property {string|null} player2_id
 * @property {string} [status]
 * @property {string|null} [result]
 * @property {Move[]|object[]} [moves_json]
 * @property {boolean} [is_offline]
 */

export {};
