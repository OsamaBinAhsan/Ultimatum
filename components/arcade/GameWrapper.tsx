'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import confetti from 'canvas-confetti';
import {
  Copy,
  CheckCircle,
  Loader2,
  Trophy,
  Coins,
  Zap,
  ShoppingBag,
  Users,
  Wifi,
  Play,
  RotateCcw,
  Radio,
  AlertTriangle,
  Star,
  Flame,
} from 'lucide-react';
import Link from 'next/link';
import { platformStore } from '@/lib/data/store';
import type {
  UltimatumGameConfig,
  GamePhase,
  GameRoomPlayer,
  BanterTelemetryEvent,
  GameScoreSubmissionResult,
} from '@/lib/types/arcade';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateShortCode(): string {
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // unambiguous charset
  return Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}

// Web Audio countdown beep synthesizer — no external deps
function playCountdownBeep(ctx: AudioContext, freq: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(0.35, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playGoFanfare(ctx: AudioContext) {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
    gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.18);
  });
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function BanterFeed({ events }: { events: BanterTelemetryEvent[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  if (events.length === 0) return null;

  return (
    <div className="pointer-events-none absolute bottom-0 left-0 z-30 w-full px-3 pb-3">
      <div
        ref={scrollRef}
        className="flex max-h-28 flex-col-reverse gap-1 overflow-hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {[...events].reverse().slice(0, 6).map((ev) => (
          <div
            key={ev.id}
            className={`w-fit max-w-xs rounded-lg px-3 py-1 text-[11px] font-mono font-bold leading-tight shadow-lg backdrop-blur-sm ${
              ev.highlight
                ? 'border border-amber-400/70 bg-zinc-950/90 text-amber-300'
                : 'border border-zinc-700/60 bg-zinc-950/80 text-zinc-300'
            }`}
          >
            <span className="text-slate-500 mr-1">[{ev.category}]</span>
            <span className="text-cyan-400">{ev.actorName}</span>
            {ev.targetName && (
              <span className="text-slate-400"> → <span className="text-rose-400">{ev.targetName}</span></span>
            )}
            <span className="ml-1">{ev.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GameWrapperProps {
  config: UltimatumGameConfig;
  /**
   * Render prop receiving a callback the game must call when it ends.
   * The game passes its raw score; GameWrapper handles the payout.
   */
  children: (props: {
    onGameOver: (score: number, metadata?: Record<string, any>) => void;
    onBanterEvent: (event: Omit<BanterTelemetryEvent, 'id' | 'timestamp'>) => void;
    phase: GamePhase;
    roomCode: string | null;
    players: GameRoomPlayer[];
  }) => ReactNode;
}

// ---------------------------------------------------------------------------
// GameWrapper — The Universal HOC
// ---------------------------------------------------------------------------

export function GameWrapper({ config, children }: GameWrapperProps) {
  const [phase, setPhase] = useState<GamePhase>('LOBBY');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [joinInput, setJoinInput] = useState('');
  const [players, setPlayers] = useState<GameRoomPlayer[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownLabel, setCountdownLabel] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [banterEvents, setBanterEvents] = useState<BanterTelemetryEvent[]>([]);
  const [payoutResult, setPayoutResult] = useState<GameScoreSubmissionResult | null>(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const user = platformStore.getCurrentUser();

  // Lazy init AudioContext on user gesture
  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const Ctor =
        window.AudioContext ||
        (window as any).webkitAudioContext;
      if (Ctor) audioCtxRef.current = new Ctor();
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // -------------------------------------------------------------------------
  // Phase: LOBBY — Short-Code Generation
  // -------------------------------------------------------------------------

  const handleHostRoom = useCallback(() => {
    const code = generateShortCode();
    const hostPlayer: GameRoomPlayer = {
      id: user?.id || 'host-local',
      username: user?.username || 'Host',
      isHost: true,
      isReady: true,
    };
    setRoomCode(code);
    setPlayers([hostPlayer]);
    setPhase('WAITING');
    getAudioCtx(); // prime audio on click
  }, [user, getAudioCtx]);

  const handleJoinRoom = useCallback(() => {
    const code = joinInput.toUpperCase().trim().slice(0, 4);
    if (code.length !== 4) return;
    const joiningPlayer: GameRoomPlayer = {
      id: user?.id || 'player-local',
      username: user?.username || 'Player',
      isHost: false,
      isReady: true,
    };
    setRoomCode(code);
    setPlayers([joiningPlayer]);
    setPhase('WAITING');
    getAudioCtx();
  }, [joinInput, user, getAudioCtx]);

  const handleSoloPlay = useCallback(() => {
    getAudioCtx();
    startCountdown();
  }, [getAudioCtx]);

  const copyCode = useCallback(() => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [roomCode]);

  // -------------------------------------------------------------------------
  // Phase: COUNTDOWN — 3...2...1...BEGIN
  // -------------------------------------------------------------------------

  const startCountdown = useCallback(() => {
    setPhase('COUNTDOWN');
    setCountdown(3);
  }, []);

  useEffect(() => {
    if (phase !== 'COUNTDOWN' || countdown === null) return;

    if (countdown === 0) {
      const ctx = getAudioCtx();
      if (ctx) playGoFanfare(ctx);
      setCountdownLabel('BEGIN!');
      const t = setTimeout(() => {
        setCountdownLabel('');
        setPhase('PLAYING');
      }, 900);
      return () => clearTimeout(t);
    }

    const ctx = getAudioCtx();
    if (ctx) playCountdownBeep(ctx, countdown === 1 ? 880 : 660, 0.18);
    setCountdownLabel(String(countdown));
    const t = setTimeout(() => setCountdown((n) => (n !== null ? n - 1 : null)), 950);
    return () => clearTimeout(t);
  }, [phase, countdown, getAudioCtx]);

  // -------------------------------------------------------------------------
  // Prevent Spacebar & Arrow Key Window Scrolling during PLAYING phase
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'PLAYING') return;

    const handlePreventScroll = (e: KeyboardEvent) => {
      const scrollKeys = [
        'Space',
        ' ',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'PageUp',
        'PageDown',
      ];
      if (scrollKeys.includes(e.key) || scrollKeys.includes(e.code)) {
        const activeEl = document.activeElement;
        const isInput =
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            (activeEl as HTMLElement).isContentEditable);
        if (!isInput) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handlePreventScroll, { passive: false });
    return () => {
      window.removeEventListener('keydown', handlePreventScroll);
    };
  }, [phase]);

  // -------------------------------------------------------------------------
  // Phase: PLAYING — Banter & Game-Over Hooks
  // -------------------------------------------------------------------------

  const onBanterEvent = useCallback(
    (event: Omit<BanterTelemetryEvent, 'id' | 'timestamp'>) => {
      const full: BanterTelemetryEvent = {
        ...event,
        id: `banter-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      };
      setBanterEvents((prev) => [...prev.slice(-29), full]);
    },
    []
  );

  const onGameOver = useCallback(
    async (score: number, metadata?: Record<string, any>) => {
      setFinalScore(score);
      setIsSubmittingScore(true);
      setPhase('RESULTS');

      try {
        const result = await config.onScoreSubmit(score, {
          userId: user?.id,
          username: user?.username,
          ...metadata,
        });
        setPayoutResult(result);
        // Optimistic balance sync
        platformStore.awardPoints(user?.id || 'user-001', result.coinsEarned);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('balance-updated', { detail: { coinsEarned: result.coinsEarned } })
          );
        }
        if (result.rank <= 3) {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        }
      } catch {
        setPayoutResult({ rank: 1, coinsEarned: Math.max(1, Math.floor(score / 100)) });
      } finally {
        setIsSubmittingScore(false);
      }
    },
    [config, user]
  );

  const handlePlayAgain = useCallback(() => {
    setPhase('LOBBY');
    setRoomCode(null);
    setJoinInput('');
    setPlayers([]);
    setCountdown(null);
    setCountdownLabel('');
    setBanterEvents([]);
    setPayoutResult(null);
    setFinalScore(0);
  }, []);

  // -------------------------------------------------------------------------
  // RENDER: Phase LOBBY
  // -------------------------------------------------------------------------

  if (phase === 'LOBBY') {
    return (
      <div className="flex min-h-[520px] items-center justify-center bg-zinc-950 px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Game Title Banner */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-mono font-bold text-cyan-300">
              <Zap className="h-3 w-3" />
              <span>{config.category?.toUpperCase() ?? 'ARCADE'}</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">{config.title}</h2>
            {config.description && (
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">{config.description}</p>
            )}
          </div>

          {/* Mode Selector */}
          <div className="space-y-3">
            {/* Solo Quick Play */}
            <button
              onClick={handleSoloPlay}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-cyan-600/20 hover:scale-105 transition-all"
            >
              <Play className="h-4 w-4" />
              <span>Quick Play — Solo</span>
            </button>

            {/* Multiplayer section only if game supports it */}
            {config.hasMultiplayer && config.shortCodeMatchmaking && (
              <>
                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className="text-[10px] font-mono font-bold text-zinc-500">MULTIPLAYER</span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>

                {/* Host Room */}
                <button
                  onClick={handleHostRoom}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-purple-500/40 bg-purple-950/40 px-6 py-3.5 text-sm font-bold text-purple-200 hover:bg-purple-900/60 hover:text-white transition-all"
                >
                  <Radio className="h-4 w-4" />
                  <span>Host a Room</span>
                </button>

                {/* Join Room */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value.toUpperCase().slice(0, 4))}
                    onKeyDown={(e) => e.key === 'Enter' && joinInput.length === 4 && handleJoinRoom()}
                    placeholder="XXXX"
                    maxLength={4}
                    className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3.5 text-center text-sm font-mono font-black tracking-[0.35em] text-white placeholder-zinc-600 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 uppercase"
                  />
                  <button
                    onClick={handleJoinRoom}
                    disabled={joinInput.length !== 4}
                    className="rounded-2xl bg-zinc-800 px-4 py-3.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 transition-all"
                  >
                    <Users className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-center text-[10px] font-mono text-zinc-600">
                  Enter 4-letter room code to join a friend
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: Phase WAITING (Host room open)
  // -------------------------------------------------------------------------

  if (phase === 'WAITING') {
    return (
      <div className="flex min-h-[520px] items-center justify-center bg-zinc-950 px-4 py-12">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold text-zinc-500 uppercase">Room Code</div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl font-black font-mono tracking-[0.2em] text-white">
                {roomCode}
              </span>
              <button onClick={copyCode} className="text-zinc-400 hover:text-white transition-colors">
                {copied ? (
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-zinc-500">Share this code with up to {config.maxPlayers ?? 2} players</p>
          </div>

          {/* Players Roster */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
            {players.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
                  <span className="text-xs font-semibold text-white">{p.username}</span>
                  {p.isHost && (
                    <span className="rounded-full bg-purple-900/60 px-2 py-0.5 text-[10px] font-mono font-bold text-purple-300">HOST</span>
                  )}
                </div>
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              </div>
            ))}
            {Array.from({ length: Math.max(0, (config.minPlayers ?? 2) - players.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="text-xs text-zinc-600 italic">Waiting for player…</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-500">
            <Wifi className="h-3.5 w-3.5 animate-pulse" />
            <span>Waiting for players to connect…</span>
          </div>

          {/* Host can start early */}
          <button
            onClick={startCountdown}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-xl hover:scale-105 transition-all"
          >
            <Play className="h-4 w-4" />
            <span>Start Game Now</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: Phase COUNTDOWN
  // -------------------------------------------------------------------------

  if (phase === 'COUNTDOWN') {
    const isGo = countdownLabel === 'BEGIN!';
    return (
      <div className="flex min-h-[520px] items-center justify-center bg-zinc-950">
        <div
          key={countdownLabel}
          className="text-center animate-in zoom-in-50 duration-200"
          style={{ animation: 'countdown-pulse 0.2s ease-out' }}
        >
          <div
            className={`text-[120px] font-black font-mono leading-none tracking-tighter transition-colors ${
              isGo ? 'text-emerald-400 drop-shadow-[0_0_40px_rgba(52,211,153,0.8)]' : 'text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]'
            }`}
          >
            {countdownLabel}
          </div>
          {!isGo && (
            <div className="mt-4 text-[11px] font-mono font-bold text-zinc-600 uppercase tracking-widest">
              Get ready…
            </div>
          )}
        </div>
        <style>{`
          @keyframes countdown-pulse {
            0% { transform: scale(1.35); opacity: 0.5; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: Phase PLAYING — Game Viewport with Banter Overlay
  // -------------------------------------------------------------------------

  if (phase === 'PLAYING') {
    return (
      <div className="relative w-full">
        {/* Game Viewport — children render here */}
        {children({ onGameOver, onBanterEvent, phase, roomCode, players })}

        {/* Live Banter Telemetry Feed — overlaid, pointer-events-none */}
        <BanterFeed events={banterEvents} />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: Phase RESULTS — Unified Tournament Payout Screen
  // -------------------------------------------------------------------------

  const rankOrdinal = payoutResult
    ? payoutResult.rank === 1 ? '1ST' : payoutResult.rank === 2 ? '2ND' : payoutResult.rank === 3 ? '3RD' : `${payoutResult.rank}TH`
    : null;

  const medalColor =
    payoutResult?.rank === 1
      ? 'text-amber-400'
      : payoutResult?.rank === 2
      ? 'text-slate-300'
      : payoutResult?.rank === 3
      ? 'text-orange-400'
      : 'text-zinc-400';

  return (
    <div className="flex min-h-[520px] items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Game Over Header */}
        <div className="text-center space-y-1">
          <div className="text-[11px] font-mono font-bold text-zinc-500 uppercase">Round Complete</div>
          <h2 className="text-3xl font-black text-white">{config.title}</h2>
        </div>

        {/* Score Card */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 text-center space-y-4">
          {isSubmittingScore ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <span className="text-xs font-mono text-zinc-400">Calculating rank & payout…</span>
            </div>
          ) : payoutResult ? (
            <>
              {/* Rank Badge */}
              <div className={`text-6xl font-black font-mono ${medalColor}`}>
                {rankOrdinal}
              </div>
              <div className="flex items-center justify-center gap-4 text-center">
                <div>
                  <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Score</div>
                  <div className="text-2xl font-black font-mono text-white">{finalScore.toLocaleString()}</div>
                </div>
                <div className="h-8 w-px bg-zinc-700" />
                <div>
                  <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Coins Earned</div>
                  <div className="flex items-center gap-1 text-2xl font-black font-mono text-amber-400">
                    <Coins className="h-5 w-5" />
                    <span>+{payoutResult.coinsEarned}</span>
                  </div>
                </div>
              </div>

              {payoutResult.newHighScore && (
                <div className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2 text-xs font-bold text-amber-300">
                  <Star className="h-3.5 w-3.5" />
                  <span>New Personal Best!</span>
                </div>
              )}
            </>
          ) : (
            <div className="py-4 text-xs text-zinc-500">Score submission unavailable</div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-2">
          <button
            onClick={handlePlayAgain}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl hover:scale-105 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Play Again</span>
          </button>

          <Link
            href="/games/shop"
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-purple-500/40 bg-purple-950/40 px-6 py-3.5 text-sm font-bold text-purple-200 hover:bg-purple-900/60 hover:text-white transition-all"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Spend Coins in Cosmetics Shop</span>
          </Link>

          <Link
            href="/games"
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Back to The Arcade Vault</span>
          </Link>
        </div>

        {/* Banter Log — post-match review */}
        {banterEvents.length > 0 && (
          <details className="group rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-xs font-mono font-bold text-zinc-400 hover:text-white transition-colors">
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              <span>Match Telemetry Log ({banterEvents.length} events)</span>
            </summary>
            <div className="max-h-40 overflow-y-auto px-4 pb-4 space-y-1.5">
              {banterEvents.map((ev) => (
                <div
                  key={ev.id}
                  className={`text-[10px] font-mono ${ev.highlight ? 'text-amber-300' : 'text-zinc-400'}`}
                >
                  <span className="text-slate-600">[{ev.category}]</span>{' '}
                  <span className="text-cyan-400">{ev.actorName}</span>
                  {ev.targetName && <span className="text-rose-400"> → {ev.targetName}</span>}
                  <span className="ml-1">{ev.message}</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
