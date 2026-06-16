/**
 * @file OnlineGame — the play page. Shows the lobby when idle, runs the board +
 * clocks while playing, drives the built-in bot for vs-bot games, and (in cloud
 * mode) handles matchmaking + hybrid realtime move sync. Records offline games
 * and applies the rating change at game end.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { useAuthStore } from '../store/authStore.js';
import { useSettingsStore } from '../store/settingsStore.js';
import { useUiStore } from '../store/uiStore.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';

import GameBoard from '../components/GameBoard.jsx';
import GameTimer from '../components/GameTimer.jsx';
import MoveInput from '../components/MoveInput.jsx';
import OnlineGameLobby from '../components/OnlineGameLobby.jsx';
import KomutanWidget from '../components/KomutanWidget.jsx';

import { gameService } from '../services/gameService.js';
import { realtimeService } from '../services/realtimeService.js';
import { socketService } from '../services/socketService.js';
import { storageService } from '../services/storageService.js';
import { engineService } from '../services/engineService.js';
import { sfxService } from '../services/sfxService.js';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';
import { COLOR, RESULT, PIECE_VISUAL, MATCHMAKING_TIMEOUT_MS } from '../utils/constants.js';
import { pickCommanderNear } from '../data/commanders.js';
import { komutan } from '../store/komutanStore.js';
import { toast } from '../store/toastStore.js';

const BOT_OPPONENT = { username: 'Komutan', rating: 1200, rd: 80 };

export default function OnlineGame() {
  const game = useGameStore();
  const user = useAuthStore((s) => s.user);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const openAuth = useUiStore((s) => s.openAuth);
  const whiteBottomPref = useSettingsStore((s) => s.whiteBottom);
  const showCoordinates = useSettingsStore((s) => s.showCoordinates);
  const isOnline = useOnlineStatus();

  const [phase, setPhase] = useState('lobby'); // 'lobby' | 'searching' | 'playing'
  const [searchElapsed, setSearchElapsed] = useState(0);
  const [opponent, setOpponent] = useState(BOT_OPPONENT);
  const [endInfo, setEndInfo] = useState(null); // { ratingDelta, newRating, outcome }
  const [serverGame, setServerGame] = useState(null);
  const [botThinking, setBotThinking] = useState(false);

  const unsubRef = useRef(null);
  const endHandledRef = useRef(false);
  const prevMovesLen = useRef(0);

  const playerColor = game.playerColor;
  const botColor = playerColor === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE;
  const whiteBottom = phase === 'playing' ? playerColor === COLOR.WHITE : whiteBottomPref;

  // Initialise the engine (loads Apex Timur WASM if present, else JS fallback).
  useEffect(() => {
    engineService.init();
  }, []);

  // ── Start a game from the lobby ───────────────────────────────────────────
  const startBot = useCallback((cfg) => {
    const commander = cfg.commander ?? pickCommanderNear(cfg.elo ?? 1400);
    setOpponent({ username: commander.name, rating: commander.rating, rd: commander.rd });
    setServerGame(null);
    setEndInfo(null);
    endHandledRef.current = false;
    prevMovesLen.current = 0;
    useGameStore.getState().newGame({
      mode: 'bot',
      timeControl: cfg.timeControl,
      playerColor: COLOR.WHITE,
      botDifficulty: cfg.difficulty ?? commander.difficulty,
      botCommander: commander,
    });
    setPhase('playing');
    komutan.say('gameStart');
    setTimeout(() => komutan.say('opponentIntro', { name: commander.name }), 1600);
  }, []);

  /** Transition into an active online game and wire realtime sync. */
  const beginOnlineGame = useCallback(
    async (row, color, timeControl) => {
      setServerGame(row);
      // Best-effort opponent rating lookup for accurate Glicko updates.
      const oppId = color === COLOR.WHITE ? row.player2_id : row.player1_id;
      const oppRating = await fetchOpponentRating(oppId, timeControl);
      setOpponent(oppRating);

      useGameStore.getState().newGame({ mode: 'online', timeControl, playerColor: color, gameId: row.id });
      if (Array.isArray(row.moves_json) && row.moves_json.length > 0) {
        useGameStore.getState().syncFromRemote(row.moves_json);
      }
      setPhase('playing');

      // Subscribe to opponent moves (Supabase realtime + polling fallback).
      unsubRef.current?.();
      unsubRef.current = realtimeService.subscribeToGame(row.id, (updated) => {
        const remote = updated.moves_json ?? [];
        if (remote.length !== useGameStore.getState().moves.length) {
          useGameStore.getState().syncFromRemote(remote);
        }
        if (updated.result && useGameStore.getState().status !== 'ended') {
          useGameStore.getState().finish(resultToWinner(updated.result));
        }
      });
      // Optional Socket.io fallback (no-op unless VITE_SOCKET_URL is set).
      socketService.connect(row.id, () => {});
    },
    [],
  );

  const startOnline = useCallback(
    async (cfg) => {
      if (!user) {
        toast.warn('Çevrimiçi oynamak için giriş yapın.');
        openAuth('login');
        return;
      }
      setPhase('searching');
      setSearchElapsed(0);
      setEndInfo(null);
      endHandledRef.current = false;
      try {
        const created = await gameService.createGame(cfg.timeControl, 'online', user.id);
        setServerGame(created);
        // If we joined an existing open game we are player2 (black).
        const joinedExisting = created.player2_id === user.id && created.player1_id !== user.id;
        if (joinedExisting) {
          beginOnlineGame(created, COLOR.BLACK, cfg.timeControl);
        }
        // Otherwise we wait — the searching effect polls/subscribes for player2.
      } catch (err) {
        toast.error('Eşleştirme başarısız, bota karşı başlatılıyor.');
        startBot(cfg);
      }
    },
    [user, openAuth, startBot, beginOnlineGame],
  );

  const handleStart = (cfg) => (cfg.mode === 'online' ? startOnline(cfg) : startBot(cfg));

  // ── Searching: poll for an opponent, offer bot after the timeout ──────────
  useEffect(() => {
    if (phase !== 'searching' || !serverGame) return undefined;
    const started = Date.now();
    const tick = setInterval(() => setSearchElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    const poll = setInterval(async () => {
      const fresh = await gameService.getGame(serverGame.id);
      if (fresh?.player2_id && fresh.player2_id !== user.id) {
        clearInterval(poll);
        beginOnlineGame(fresh, COLOR.WHITE, game.timeControl);
      }
    }, 2000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [phase, serverGame, user, game.timeControl, beginOnlineGame]);

  // ── Clock: tick once per second while playing ─────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || game.status !== 'active') return undefined;
    const id = setInterval(() => useGameStore.getState().tick(), 1000);
    return () => clearInterval(id);
  }, [phase, game.status]);

  // ── Bot reply (async via engineService: WASM motor or JS fallback) ────────
  useEffect(() => {
    if (phase !== 'playing' || game.mode !== 'bot' || game.status !== 'active') return undefined;
    if (game.turn !== botColor) return undefined;
    let cancelled = false;
    setBotThinking(true);
    engineService
      .getBotMove(useGameStore.getState().position, { difficulty: game.botDifficulty, color: botColor })
      .then((mv) => {
        if (cancelled) return;
        setBotThinking(false);
        if (mv) useGameStore.getState().makeMove(mv.from, mv.to);
        else useGameStore.getState().finish(playerColor);
      });
    return () => {
      cancelled = true;
      setBotThinking(false);
    };
  }, [phase, game.mode, game.status, game.turn, botColor, game.botDifficulty, game.moves.length, playerColor]);

  // ── Sound + Komutan reactions on each new move ────────────────────────────
  useEffect(() => {
    const moves = game.moves;
    if (moves.length > prevMovesLen.current && moves.length > 0) {
      const last = moves[moves.length - 1];
      sfxService.play(last.captured ? 'capture' : 'move');
      if (game.mode === 'bot' && game.status === 'active' && moves.length % 6 === 0) {
        komutan.say(Math.random() > 0.5 ? 'goodMove' : 'warn');
      }
    }
    prevMovesLen.current = moves.length;
  }, [game.moves, game.mode, game.status]);

  // ── Push local moves to the server (online) ───────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || game.mode !== 'online' || !game.gameId) return;
    const last = game.moves.at(-1);
    if (last && last.color === playerColor) {
      const serialized = game.moves.map((m) => ({ from: m.from, to: m.to, promotion: m.promotion }));
      gameService.pushMoves(game.gameId, serialized);
    }
  }, [game.moves, phase, game.mode, game.gameId, playerColor]);

  // ── Handle game end: rating + history + overlay ───────────────────────────
  useEffect(() => {
    if (game.status !== 'ended' || endHandledRef.current) return;
    endHandledRef.current = true;
    void finalizeGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status]);

  const finalizeGame = async () => {
    const winner = game.winner;
    const outcome = winner == null ? 'draw' : winner === playerColor ? 'win' : 'loss';

    // Komutan reacts + sound.
    if (outcome === 'win') {
      komutan.say('victory');
      sfxService.play('win');
    } else if (outcome === 'loss') {
      komutan.say('defeat');
      sfxService.play('lose');
    }

    // Record locally so it appears in history / can be synced (offline-first).
    const snap = useGameStore.getState().snapshot();
    storageService.saveGame({
      user_id: user?.id ?? 'guest',
      time_control: game.timeControl,
      result: game.result,
      moves: snap.moves,
      mode: game.mode,
      is_offline: !isOnline || game.mode !== 'online',
      startTime: new Date(Date.now() - (game.moves.length * 5000)).toISOString(),
      endTime: new Date().toISOString(),
    });

    // Update rating (guests are not rated).
    if (user) {
      try {
        const isPlayer1 = playerColor === COLOR.WHITE;
        const res = await gameService.endGame({
          game: serverGame ?? { ...game, mode: game.mode, is_offline: game.mode !== 'online' },
          result: game.result ?? RESULT.DRAW,
          userId: user.id,
          isPlayer1,
          opponentRating: { rating: opponent.rating, rd: opponent.rd ?? 100 },
        });
        setEndInfo({ ...res, outcome });
        await refreshProfile();
      } catch {
        setEndInfo({ ratingDelta: 0, newRating: null, outcome });
      }
    } else {
      setEndInfo({ ratingDelta: 0, newRating: null, outcome });
    }
  };

  // Cleanup subscriptions on unmount.
  useEffect(
    () => () => {
      unsubRef.current?.();
      socketService.disconnect();
    },
    [],
  );

  const leaveGame = () => {
    unsubRef.current?.();
    socketService.disconnect();
    useGameStore.getState().reset();
    setPhase('lobby');
    setEndInfo(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-3xl font-bold text-white">Oyna</h1>
          <p className="mt-1 text-timur-300">Hızlı eşleş, arkadaşını davet et veya bota karşı oyna.</p>
        </header>
        <OnlineGameLobby onStart={handleStart} canOnline={isSupabaseConfigured && isOnline} />
      </div>
    );
  }

  if (phase === 'searching') {
    const timedOut = searchElapsed * 1000 >= MATCHMAKING_TIMEOUT_MS;
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <div className="mb-4 text-5xl">{timedOut ? '🤖' : '🔍'}</div>
        {!timedOut ? (
          <>
            <h2 className="font-display text-xl font-bold text-white">Rakip aranıyor…</h2>
            <p className="mt-2 text-timur-300">{searchElapsed} saniye</p>
            <div className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-timur-700">
              <div className="h-full w-1/3 animate-pulse bg-gold-500" />
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-xl font-bold text-white">
              Düşman bulamadık — Komutan karşına çıkacak!
            </h2>
            <p className="mt-2 text-timur-300">Bota karşı oynayarak devam edebilirsin.</p>
          </>
        )}
        <div className="mt-6 flex justify-center gap-2">
          {timedOut && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => startBot({ timeControl: game.timeControl })}
            >
              Bota Karşı Oyna
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={leaveGame}>
            İptal
          </button>
        </div>
      </div>
    );
  }

  // phase === 'playing'
  const opponentTime = playerColor === COLOR.WHITE ? game.blackTime : game.whiteTime;
  const playerTime = playerColor === COLOR.WHITE ? game.whiteTime : game.blackTime;
  const opponentActive = game.turn !== playerColor;
  const playerActive = game.turn === playerColor;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-3">
        <PlayerBar
          name={opponent.username}
          rating={opponent.rating}
          captured={game.captured[playerColor]}
          time={opponentTime}
          active={opponentActive}
          thinking={botThinking}
        />
        <GameBoard
          position={game.position}
          selected={game.selected}
          legalTargets={game.legalTargets}
          lastMove={game.lastMove}
          onSquareClick={(sq) => useGameStore.getState().select(sq)}
          whiteBottom={whiteBottom}
          showCoordinates={showCoordinates}
          interactive={game.status === 'active' && playerActive}
        />
        <PlayerBar
          name={user?.username ?? 'Misafir'}
          rating={user?.ratings?.[game.timeControl]?.rating ?? '—'}
          captured={game.captured[botColor]}
          time={playerTime}
          active={playerActive}
          you
        />
      </div>

      <div className="flex flex-col gap-4">
        <KomutanWidget />
        <MoveInput moves={game.moves} />
        <div className="card p-3">
          <div className="flex gap-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => useGameStore.getState().resign()}>
              Pes Et
            </button>
            <button type="button" className="btn-ghost flex-1" onClick={leaveGame}>
              Çık
            </button>
          </div>
        </div>
      </div>

      {endInfo && (
        <EndOverlay
          endInfo={endInfo}
          onRematch={() =>
            startBot({
              timeControl: game.timeControl,
              commander: game.botCommander,
              difficulty: game.botDifficulty,
            })
          }
          onExit={leaveGame}
          canRematch={game.mode === 'bot'}
        />
      )}
    </div>
  );
}

/** Player info strip (name, rating, clock, captured material). */
function PlayerBar({ name, rating, captured, time, active, you, thinking }) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-4 py-2 ${
        active ? 'border-gold-400/60 bg-timur-800/70' : 'border-timur-600/40 bg-timur-900/50'
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-white">{name}</span>
          {you && <span className="rounded bg-timur-700 px-1.5 text-[10px] text-timur-200">SEN</span>}
          <span className="text-sm text-gold-300">{rating}</span>
          {thinking && (
            <span className="animate-pulse text-xs text-timur-300">düşünüyor…</span>
          )}
        </div>
        <div className="h-4 text-sm leading-4 text-timur-300">
          {captured.map((t, i) => (
            <span key={`${t}-${i}`}>{PIECE_VISUAL[t]?.glyph ?? PIECE_VISUAL[t]?.label ?? ''}</span>
          ))}
        </div>
      </div>
      <GameTimer seconds={time} active={active} />
    </div>
  );
}

/** End-of-game modal with the rating change. */
function EndOverlay({ endInfo, onRematch, onExit, canRematch }) {
  const title =
    endInfo.outcome === 'win' ? '🏆 Kazandınız!' : endInfo.outcome === 'loss' ? '😔 Kaybettiniz' : '🤝 Berabere';
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="card w-full max-w-sm animate-pop p-6 text-center">
        <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
        {endInfo.newRating != null ? (
          <p className="mt-2 text-timur-200">
            Yeni puanınız: <span className="font-bold text-gold-300">{endInfo.newRating}</span>{' '}
            <span className={endInfo.ratingDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
              ({endInfo.ratingDelta >= 0 ? '+' : ''}
              {endInfo.ratingDelta})
            </span>
          </p>
        ) : (
          <p className="mt-2 text-timur-300">Misafir oyunları puanlanmaz.</p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          {canRematch && (
            <button type="button" className="btn-primary" onClick={onRematch}>
              Yeniden
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={onExit}>
            Lobiye Dön
          </button>
        </div>
      </div>
    </div>
  );
}

/** Map a DB result string to a winner color (or null for draw). */
function resultToWinner(result) {
  if (result === RESULT.PLAYER1_WIN) return COLOR.WHITE;
  if (result === RESULT.PLAYER2_WIN) return COLOR.BLACK;
  return null;
}

/** Fetch an opponent's rating for accurate Glicko updates (best-effort). */
async function fetchOpponentRating(userId, timeControl) {
  const fallback = { username: 'Rakip', rating: 1000, rd: 200 };
  if (!isSupabaseConfigured || !userId || !supabase) return fallback;
  try {
    const { data: u } = await supabase.from('users').select('username').eq('id', userId).single();
    const { data: r } = await supabase
      .from('ratings')
      .select('rating, rd')
      .eq('user_id', userId)
      .eq('time_control', timeControl)
      .single();
    return {
      username: u?.username ?? 'Rakip',
      rating: r?.rating ?? 1000,
      rd: r?.rd ?? 200,
    };
  } catch {
    return fallback;
  }
}
