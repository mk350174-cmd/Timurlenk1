/**
 * @file GameBoard — Canvas-rendered 11×10 Timurlenk board.
 *
 * Rendering strategy for 60 FPS:
 *   - One <canvas>, redrawn only when inputs change (no per-frame loop).
 *   - Device-pixel-ratio scaling for crisp pieces on retina/mobile.
 *   - A ResizeObserver keeps it fluidly responsive without React re-layout.
 *
 * Interaction is click-to-select then click-to-move; the parent owns game
 * state and passes `selected` / `legalTargets` / `lastMove` for highlighting.
 *
 * @param {object} props
 * @param {import('../utils/board.js').Position} props.position
 * @param {number|null} props.selected selected square (or null)
 * @param {number[]} props.legalTargets highlighted destination squares
 * @param {{from:number,to:number}|null} props.lastMove
 * @param {(sq:number)=>void} props.onSquareClick
 * @param {boolean} [props.whiteBottom=true] board orientation
 * @param {boolean} [props.showCoordinates=true]
 * @param {boolean} [props.interactive=true]
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { BOARD_SIZE, COLOR, PIECE_VISUAL } from '../utils/constants.js';
import { coordsToSquare, FILE_LABELS } from '../utils/board.js';
import { boardThemeById, boardTextureUrl } from '../data/boardThemes.js';

const { files: FILES, ranks: RANKS } = BOARD_SIZE;
const MAX_WIDTH = 640;

const SQUARE_LIGHT = '#e8d6b3';
const SQUARE_DARK = '#a9714b';
const SELECT_TINT = 'rgba(144, 205, 244, 0.55)';
const LASTMOVE_TINT = 'rgba(154, 230, 180, 0.5)';
const DOT_COLOR = 'rgba(23, 38, 43, 0.35)';
const RING_COLOR = 'rgba(220, 38, 38, 0.65)';

export default function GameBoard({
  position,
  selected = null,
  legalTargets = [],
  lastMove = null,
  onSquareClick,
  whiteBottom = true,
  showCoordinates = true,
  interactive = true,
  boardTheme = 'wolfGold',
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const texRef = useRef(null);
  const [width, setWidth] = useState(MAX_WIDTH);
  const [texReady, setTexReady] = useState(false);
  const accent = boardThemeById(boardTheme).accentColor;

  const square = width / FILES;
  const height = square * RANKS;

  // Responsive sizing.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      const w = Math.min(entries[0].contentRect.width, MAX_WIDTH);
      setWidth(Math.max(220, w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Load the theme texture from S3 (if configured); falls back to checker.
  useEffect(() => {
    setTexReady(false);
    texRef.current = null;
    const url = boardTextureUrl(boardTheme);
    if (!url) return undefined;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      texRef.current = img;
      setTexReady(true);
    };
    img.onerror = () => {
      texRef.current = null;
      setTexReady(false);
    };
    img.src = url;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [boardTheme]);

  /** Screen (file,rank) for a board (file,rank) given orientation. */
  const place = useCallback(
    (file, rank) => {
      const col = whiteBottom ? file : FILES - 1 - file;
      const row = whiteBottom ? RANKS - 1 - rank : rank;
      return { x: col * square, y: row * square };
    },
    [square, whiteBottom],
  );

  // Draw whenever inputs change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // 1) Squares — themed texture (S3) if loaded, else the default checker.
    if (texRef.current) {
      ctx.drawImage(texRef.current, 0, 0, width, height);
    } else {
      for (let rank = 0; rank < RANKS; rank += 1) {
        for (let file = 0; file < FILES; file += 1) {
          const { x, y } = place(file, rank);
          ctx.fillStyle = (file + rank) % 2 === 0 ? SQUARE_DARK : SQUARE_LIGHT;
          ctx.fillRect(x, y, square, square);
        }
      }
    }

    // 2) Last-move + selection tints
    const tint = (sq, color) => {
      if (sq == null || sq < 0) return;
      const file = sq % FILES;
      const rank = Math.floor(sq / FILES);
      const { x, y } = place(file, rank);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, square, square);
    };
    if (lastMove) {
      tint(lastMove.from, LASTMOVE_TINT);
      tint(lastMove.to, LASTMOVE_TINT);
    }
    tint(selected, SELECT_TINT);

    // 3) Coordinates
    if (showCoordinates) {
      ctx.fillStyle = 'rgba(23,38,43,0.55)';
      ctx.font = `${Math.max(9, square * 0.2)}px sans-serif`;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      for (let file = 0; file < FILES; file += 1) {
        const { x, y } = place(file, whiteBottom ? 0 : RANKS - 1);
        ctx.fillText(FILE_LABELS[file], x + 2, y + square - square * 0.22);
      }
      ctx.textBaseline = 'top';
      for (let rank = 0; rank < RANKS; rank += 1) {
        const { x, y } = place(whiteBottom ? 0 : FILES - 1, rank);
        ctx.fillText(String(rank + 1), x + 2, y + 2);
      }
    }

    // 4) Pieces
    for (let sq = 0; sq < position.length; sq += 1) {
      const p = position[sq];
      if (!p) continue;
      const file = sq % FILES;
      const rank = Math.floor(sq / FILES);
      const { x, y } = place(file, rank);
      drawPiece(ctx, p, x, y, square);
    }

    // 5) Legal-move indicators (drawn on top)
    for (const target of legalTargets) {
      const file = target % FILES;
      const rank = Math.floor(target / FILES);
      const { x, y } = place(file, rank);
      const cx = x + square / 2;
      const cy = y + square / 2;
      if (position[target]) {
        // capture → ring
        ctx.strokeStyle = RING_COLOR;
        ctx.lineWidth = Math.max(2, square * 0.06);
        ctx.beginPath();
        ctx.arc(cx, cy, square * 0.42, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // quiet move → dot
        ctx.fillStyle = DOT_COLOR;
        ctx.beginPath();
        ctx.arc(cx, cy, square * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [position, selected, legalTargets, lastMove, width, height, square, place, showCoordinates, whiteBottom, texReady]);

  /** Translate a click to a board square index. */
  const handleClick = (e) => {
    if (!interactive || !onSquareClick) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const col = Math.floor(px / square);
    const row = Math.floor(py / square);
    if (col < 0 || col >= FILES || row < 0 || row >= RANKS) return;
    const file = whiteBottom ? col : FILES - 1 - col;
    const rank = whiteBottom ? RANKS - 1 - row : row;
    onSquareClick(coordsToSquare(file, rank));
  };

  return (
    <div ref={wrapRef} className="w-full select-none">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="rounded-xl border-4 shadow-2xl"
        style={{
          touchAction: 'manipulation',
          cursor: interactive ? 'pointer' : 'default',
          borderColor: accent,
        }}
        role="img"
        aria-label="Timurlenk satranç tahtası"
      />
    </div>
  );
}

/**
 * Draw a single piece. Standard pieces use solid Unicode glyphs coloured per
 * side; the camel (no reliable glyph) is drawn as a labelled disc.
 */
function drawPiece(ctx, p, x, y, square) {
  const cx = x + square / 2;
  const cy = y + square / 2;
  const isWhite = p.c === COLOR.WHITE;
  const fill = isWhite ? '#f7efdc' : '#16201f';
  const stroke = isWhite ? '#1b1b1b' : '#d9c79c';
  const visual = PIECE_VISUAL[p.t];

  if (visual?.glyph) {
    ctx.font = `${square * 0.74}px "Segoe UI Symbol", "Noto Sans Symbols 2", "DejaVu Sans", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(1.5, square * 0.04);
    ctx.strokeStyle = stroke;
    ctx.fillStyle = fill;
    // Slight vertical nudge so glyphs sit centred across fonts.
    ctx.strokeText(visual.glyph, cx, cy + square * 0.02);
    ctx.fillText(visual.glyph, cx, cy + square * 0.02);
  } else {
    // Labelled disc (camel).
    ctx.beginPath();
    ctx.arc(cx, cy, square * 0.34, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, square * 0.05);
    ctx.strokeStyle = stroke;
    ctx.stroke();
    ctx.fillStyle = stroke;
    ctx.font = `bold ${square * 0.4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(visual?.label ?? '?', cx, cy + square * 0.02);
  }
}
