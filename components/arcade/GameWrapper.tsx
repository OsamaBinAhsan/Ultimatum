'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Component,
  ErrorInfo,
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
  Palette,
  Sparkles,
  Shield,
  Volume2,
  Eye,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { platformStore } from '@/lib/data/store';
import { InGameLoadoutModal } from '@/components/arcade/InGameLoadoutModal';
import type { GameLoadout } from '@/lib/types';
import type {
  UltimatumGameConfig,
  GamePhase,
  GameRoomPlayer,
  BanterTelemetryEvent,
  GameScoreSubmissionResult,
} from '@/lib/types/arcade';

// ---------------------------------------------------------------------------
// Error Boundary for Game Viewport
// ---------------------------------------------------------------------------

interface GameErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
  gameTitle?: string;
}

interface GameErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class GameErrorBoundary extends Component<GameErrorBoundaryProps, GameErrorBoundaryState> {
  constructor(props: GameErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): GameErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GameErrorBoundary] Caught runtime exception in game engine:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[420px] w-full flex-col items-center justify-center rounded-2xl border border-rose-500/40 bg-zinc-950 p-6 text-center shadow-2xl backdrop-blur-md">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-rose-400">
            ENGINE RECOVERY MODE
          </div>
          <h3 className="mt-1 text-2xl font-black text-white">
            {this.props.gameTitle ? `${this.props.gameTitle} Encountered an Issue` : 'Game Simulation Halted'}
          </h3>
          <p className="mt-2 max-w-md text-xs text-zinc-400 font-mono">
            {this.state.error?.message || 'A transient rendering or network synchronization error occurred.'}
          </p>
          <button
            onClick={this.handleReset}
            className="mt-6 flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-3 text-xs font-bold text-white shadow-lg hover:from-rose-500 hover:to-pink-500 transition-all hover:scale-105 active:scale-95 cursor-pointer select-none"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Restart Game Engine</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateShortCode(): string {
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // unambiguous charset
  return Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}

// Web Audio countdown synthesizer
function playCountdownBeep(ctx: AudioContext, freq: number, duration: number) {
  try {
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
  } catch {}
}

function playGoFanfare(ctx: AudioContext) {
  try {
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
  } catch {}
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
              <span className="text-slate-400">
                {' '}→ <span className="text-rose-400">{ev.targetName}</span>
              </span>
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

export interface GameWrapperProps {
  config: UltimatumGameConfig;
  /**
   * Render prop receiving callbacks and active game state.
   */
  children: (props: {
    onGameOver: (score: number, metadata?: Record<string, any>) => void;
    onBanterEvent: (event: Omit<BanterTelemetryEvent, 'id' | 'timestamp'>) => void;
    phase: GamePhase;
    roomCode: string | null;
    players: GameRoomPlayer[];
    activeLoadout: GameLoadout;
  }) => ReactNode;
}

// ---------------------------------------------------------------------------
// GameWrapper — Universal HOC with HiDPI Canvas & Game State Machine
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
  const [isLoadoutModalOpen, setIsLoadoutModalOpen] = useState(false);
  const [activeLoadout, setActiveLoadout] = useState<GameLoadout>({ gameGear: {} });
  const [highScore, setHighScore] = useState<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const user = platformStore.getCurrentUser();
  const userId = user?.id || 'user-001';

  // Fetch loadout and personal best on mount / update
  const refreshLoadout = useCallback(() => {
    const currentLoadout = platformStore.getLoadout(userId, config.gameSlug);
    setActiveLoadout(currentLoadout || { gameGear: {} });

    // Get personal high score from leaderboard
    const game = platformStore.getGameBySlug(config.gameSlug);
    if (game) {
      const lb = platformStore.getLeaderboard(game.id);
      const userEntry = lb.find((e) => e.player_name?.toLowerCase() === (user?.username?.toLowerCase() || ''));
      if (userEntry) {
        setHighScore(userEntry.score);
      } else if (lb.length > 0) {
        setHighScore(lb[0].score);
      }
    }
  }, [config.gameSlug, user?.username, userId]);

  useEffect(() => {
    refreshLoadout();
    const handleUpdate = () => refreshLoadout();
    window.addEventListener('loadout-updated', handleUpdate);
    window.addEventListener('inventory-updated', handleUpdate);
    return () => {
      window.removeEventListener('loadout-updated', handleUpdate);
      window.removeEventListener('inventory-updated', handleUpdate);
    };
  }, [refreshLoadout]);

  // Lazy init AudioContext on user gesture
  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (Ctor) audioCtxRef.current = new Ctor();
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // -------------------------------------------------------------------------
  // Global Browser Window Scroll Lock during PLAYING phase
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
  // Phase: LOBBY Actions
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
    getAudioCtx();
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

  const startCountdown = useCallback(() => {
    setPhase('COUNTDOWN');
    setCountdown(3);
  }, []);

  const handleSoloPlay = useCallback(() => {
    getAudioCtx();
    startCountdown();
  }, [getAudioCtx, startCountdown]);

  const copyCode = useCallback(() => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [roomCode]);

  // -------------------------------------------------------------------------
  // Phase: COUNTDOWN — 3...2...1...BEGIN -> Seamless Transition to PLAYING
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (phase !== 'COUNTDOWN' || countdown === null) return;

    if (countdown === 0) {
      const ctx = getAudioCtx();
      if (ctx) playGoFanfare(ctx);
      setCountdownLabel('BEGIN!');
      const t = setTimeout(() => {
        setCountdownLabel('');
        setPhase('PLAYING');
      }, 700);
      return () => clearTimeout(t);
    }

    const ctx = getAudioCtx();
    if (ctx) playCountdownBeep(ctx, countdown === 1 ? 880 : 660, 0.18);
    setCountdownLabel(String(countdown));
    const t = setTimeout(() => setCountdown((n) => (n !== null ? n - 1 : null)), 800);
    return () => clearTimeout(t);
  }, [phase, countdown, getAudioCtx]);

  // -------------------------------------------------------------------------
  // Phase: PLAYING — Banter & Automated Non-blocking Score Submission
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
    const hasVisualSkin = !!activeLoadout.visualSkin;
    const hasActionJuice = !!activeLoadout.actionJuice;
    const hasGameGear = activeLoadout.gameGear && Object.keys(activeLoadout.gameGear).length > 0;
    const hasAudioTheme = !!activeLoadout.audioTheme;

    return (
      <div className="relative w-full overflow-hidden rounded-3xl border border-cyan-500/20 bg-[#060a14] shadow-[0_0_80px_rgba(6,182,212,0.15)] select-none touch-none">
        <style>{`
          @keyframes lobbyGrid { 0% { transform: translateY(0); } 100% { transform: translateY(40px); } }
          @keyframes lobbyPulse { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        `}</style>

        {/* Ambient Dark Nebula Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#02050f] via-[#050e1e] to-[#020409]" />
        
        {/* Animated Cyber Grid */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(6,182,212,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            animation: 'lobbyGrid 8s linear infinite',
          }}
        />

        {/* Glowing Nebula Orbs */}
        <div
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"
          style={{ animation: 'lobbyPulse 6s ease-in-out infinite' }}
        />
        <div
          className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"
          style={{ animation: 'lobbyPulse 7s ease-in-out infinite', animationDelay: '1s' }}
        />

        <div className="relative z-10 p-4 sm:p-8 flex flex-col gap-5 sm:gap-6 max-w-2xl mx-auto">
          {/* Header Banner */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3.5 py-1 text-xs font-mono font-bold text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Zap className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span>OFFICIAL ULTIMATUM TOURNAMENT ARENA</span>
            </div>

            <h1
              className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase drop-shadow-[0_0_25px_rgba(6,182,212,0.6)]"
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #a5f3fc 60%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {config.title}
            </h1>

            {config.description && (
              <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed max-w-lg mx-auto">
                {config.description}
              </p>
            )}

            {highScore > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-[11px] font-mono font-bold text-amber-300">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Arena Best: {highScore.toLocaleString()} PTS</span>
              </div>
            )}
          </div>

          {/* 4-Slot Loadout Bar */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-3.5 backdrop-blur-md space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Equipped 4-Slot Loadout
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsLoadoutModalOpen(true)}
                className="min-h-[44px] flex items-center gap-1.5 rounded-lg border border-purple-500/50 bg-purple-500/20 px-3 py-1.5 text-xs font-mono font-bold text-purple-300 hover:bg-purple-500 hover:text-white transition-all shadow-sm cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Customize & Shop</span>
              </button>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
              <div
                onClick={() => setIsLoadoutModalOpen(true)}
                className={`min-h-[44px] cursor-pointer rounded-xl p-2.5 border transition-all ${
                  hasVisualSkin ? 'border-pink-500/40 bg-pink-950/30 text-pink-300' : 'border-zinc-800 bg-zinc-950/60 text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-pink-400">
                  <Eye className="w-3 h-3" />
                  <span>Skin</span>
                </div>
                <div className="text-xs font-bold text-white mt-0.5 truncate">
                  {hasVisualSkin ? 'Active' : 'Standard'}
                </div>
              </div>

              <div
                onClick={() => setIsLoadoutModalOpen(true)}
                className={`min-h-[44px] cursor-pointer rounded-xl p-2.5 border transition-all ${
                  hasActionJuice ? 'border-amber-500/40 bg-amber-950/30 text-amber-300' : 'border-zinc-800 bg-zinc-950/60 text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-amber-400">
                  <Sparkles className="w-3 h-3" />
                  <span>Juice</span>
                </div>
                <div className="text-xs font-bold text-white mt-0.5 truncate">
                  {hasActionJuice ? 'Active VFX' : 'Standard'}
                </div>
              </div>

              <div
                onClick={() => setIsLoadoutModalOpen(true)}
                className={`min-h-[44px] cursor-pointer rounded-xl p-2.5 border transition-all ${
                  hasGameGear ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300' : 'border-zinc-800 bg-zinc-950/60 text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-cyan-400">
                  <Shield className="w-3 h-3" />
                  <span>Gear</span>
                </div>
                <div className="text-xs font-bold text-white mt-0.5 truncate">
                  {hasGameGear ? 'Boosters Active' : 'Standard'}
                </div>
              </div>

              <div
                onClick={() => setIsLoadoutModalOpen(true)}
                className={`min-h-[44px] cursor-pointer rounded-xl p-2.5 border transition-all ${
                  hasAudioTheme ? 'border-purple-500/40 bg-purple-950/30 text-purple-300' : 'border-zinc-800 bg-zinc-950/60 text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-purple-400">
                  <Volume2 className="w-3 h-3" />
                  <span>Audio</span>
                </div>
                <div className="text-xs font-bold text-white mt-0.5 truncate">
                  {hasAudioTheme ? 'Synth Active' : 'Arcade 8-Bit'}
                </div>
              </div>
            </div>
          </div>

          {/* Launch Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSoloPlay}
              className="w-full min-h-[52px] group flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 px-6 py-4 text-sm sm:text-base font-black text-white shadow-[0_0_35px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer select-none"
            >
              <Play className="h-5 w-5 fill-current text-white group-hover:scale-110 transition-transform" />
              <span className="tracking-wider">ENTER TOURNAMENT MATCH</span>
              <ChevronRight className="h-5 w-5 text-cyan-200 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Multiplayer Section */}
            {config.hasMultiplayer && config.shortCodeMatchmaking && (
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Multiplayer Room Hub</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">1v1 / Co-Op Lobby</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={handleHostRoom}
                    className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-950/40 px-4 py-3 text-xs font-bold text-indigo-200 hover:bg-indigo-900/60 hover:text-white transition-all shadow-sm cursor-pointer"
                  >
                    <Radio className="h-4 w-4" />
                    <span>Host Private Room</span>
                  </button>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={joinInput}
                      onChange={(e) => setJoinInput(e.target.value.toUpperCase().slice(0, 4))}
                      onKeyDown={(e) => e.key === 'Enter' && joinInput.length === 4 && handleJoinRoom()}
                      placeholder="CODE"
                      maxLength={4}
                      className="min-h-[44px] flex-1 rounded-xl border border-zinc-700 bg-zinc-900/90 px-3 py-2.5 text-center text-xs font-mono font-black tracking-widest text-white placeholder-zinc-600 outline-none focus:border-cyan-500 uppercase"
                    />
                    <button
                      onClick={handleJoinRoom}
                      disabled={joinInput.length !== 4}
                      className="min-h-[44px] rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-40 transition-all shadow cursor-pointer"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <InGameLoadoutModal
          isOpen={isLoadoutModalOpen}
          onClose={() => {
            setIsLoadoutModalOpen(false);
            refreshLoadout();
          }}
          gameSlug={config.gameSlug}
          gameTitle={config.title}
          userId={userId}
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: Phase WAITING
  // -------------------------------------------------------------------------

  if (phase === 'WAITING') {
    return (
      <div className="flex min-h-[520px] items-center justify-center bg-zinc-950 px-4 py-12 select-none touch-none">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold text-zinc-500 uppercase">Room Code</div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl font-black font-mono tracking-[0.2em] text-white">
                {roomCode}
              </span>
              <button
                onClick={copyCode}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? (
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-zinc-500">Share this code with up to {config.maxPlayers ?? 2} players</p>
          </div>

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

          <button
            onClick={startCountdown}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-xl hover:scale-105 transition-all cursor-pointer"
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
      <div className="flex min-h-[520px] items-center justify-center bg-zinc-950 select-none touch-none">
        <div
          key={countdownLabel}
          className="text-center animate-in zoom-in-50 duration-200"
          style={{ animation: 'countdown-pulse 0.2s ease-out' }}
        >
          <div
            className={`text-[100px] sm:text-[140px] font-black font-mono leading-none tracking-tighter transition-colors ${
              isGo ? 'text-emerald-400 drop-shadow-[0_0_40px_rgba(52,211,153,0.8)]' : 'text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]'
            }`}
          >
            {countdownLabel}
          </div>
          {!isGo && (
            <div className="mt-4 text-xs sm:text-sm font-mono font-bold text-zinc-600 uppercase tracking-widest">
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
  // RENDER: Phase PLAYING
  // -------------------------------------------------------------------------

  if (phase === 'PLAYING') {
    return (
      <GameErrorBoundary gameTitle={config.title} onReset={handlePlayAgain}>
        <div className="relative w-full overflow-hidden rounded-2xl bg-zinc-950 shadow-2xl select-none" style={{ touchAction: 'none' }}>
          {children({ onGameOver, onBanterEvent, phase, roomCode, players, activeLoadout })}
          <BanterFeed events={banterEvents} />
        </div>
      </GameErrorBoundary>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: Phase RESULTS
  // -------------------------------------------------------------------------

  const rankOrdinal = payoutResult
    ? payoutResult.rank === 1
      ? '1ST'
      : payoutResult.rank === 2
      ? '2ND'
      : payoutResult.rank === 3
      ? '3RD'
      : `${payoutResult.rank}TH`
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
    <div className="flex min-h-[400px] sm:min-h-[520px] items-center justify-center bg-zinc-950 px-3 sm:px-4 py-8 sm:py-12 select-none">
      <div className="w-full max-w-sm space-y-5 sm:space-y-6">
        <div className="text-center space-y-1">
          <div className="text-[10px] sm:text-[11px] font-mono font-bold text-zinc-500 uppercase">Round Complete</div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">{config.title}</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-6 text-center space-y-4 shadow-xl">
          {isSubmittingScore ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <span className="text-xs font-mono text-zinc-400">Recording score & calculating rewards…</span>
            </div>
          ) : payoutResult ? (
            <>
              <div className={`text-5xl sm:text-6xl font-black font-mono ${medalColor}`}>
                {rankOrdinal}
              </div>
              <div className="flex items-center justify-center gap-3 sm:gap-4 text-center">
                <div>
                  <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Score</div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-white">{finalScore.toLocaleString()}</div>
                </div>
                <div className="h-8 w-px bg-zinc-700" />
                <div>
                  <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Coins Earned</div>
                  <div className="flex items-center gap-1 text-xl sm:text-2xl font-black font-mono text-amber-400">
                    <Coins className="h-4 sm:h-5 w-4 sm:w-5" />
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
            <div className="py-4 text-xs text-zinc-500 font-mono">Score submission recorded</div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-2">
          <button
            onClick={handlePlayAgain}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-5 sm:px-6 py-3 sm:py-3.5 text-sm font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Play Again</span>
          </button>

          <Link
            href="/games/shop"
            className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-2xl border border-purple-500/40 bg-purple-950/40 px-5 sm:px-6 py-3 text-xs sm:text-sm font-bold text-purple-200 hover:bg-purple-900/60 hover:text-white transition-all"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Spend Coins in Cosmetics Shop</span>
          </Link>

          <Link
            href="/games"
            className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 sm:px-6 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Back to The Arcade Vault</span>
          </Link>
        </div>

        {/* Telemetry Log */}
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
