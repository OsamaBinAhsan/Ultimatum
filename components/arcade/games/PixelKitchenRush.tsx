'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Volume2,
  VolumeX,
  Flame,
  Utensils,
  Clock,
  Award,
  DollarSign,
  Tv,
  ShieldAlert,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { platformStore } from '@/lib/data/store';
import { RewardedAdModal } from '@/components/monetization/RewardedAdModal';
import { AuthModal } from '@/components/auth/AuthModal';
import confetti from 'canvas-confetti';

interface PixelKitchenProps {
  gameId: string;
  gameTitle: string;
  onScoreSubmitted?: (score: number) => void;
}

// ---------------------------------------------------------------------------
// Synthesizer Audio Engine (Retro 8-Bit Beeper)
// ---------------------------------------------------------------------------
class KitchenSynthAudio {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playPick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }

  playChop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {}
  }

  playSizzle() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {}
  }

  playBell() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      [1760, 2200].forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.08);
        osc.stop(this.ctx.currentTime + i * 0.08 + 0.25);
      });
    } catch {}
  }

  playBurn() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {}
  }
}

// ---------------------------------------------------------------------------
// Types & Game Recipes
// ---------------------------------------------------------------------------
interface RecipeDef {
  name: string;
  ingredients: string[];
  points: number;
  tips: number;
  time: number;
}

const RECIPES: RecipeDef[] = [
  { name: 'Classic Burger', ingredients: ['bun', 'cooked_patty', 'lettuce'], points: 200, tips: 60, time: 45 },
  { name: 'Cheeseburger Deluxe', ingredients: ['bun', 'cooked_patty', 'cheese', 'tomato'], points: 280, tips: 85, time: 50 },
  { name: 'Vegan Salad Bowl', ingredients: ['chopped_lettuce', 'chopped_tomato', 'cheese'], points: 190, tips: 50, time: 40 },
  { name: 'Mega Bacon Stack', ingredients: ['bun', 'cooked_patty', 'cheese', 'chopped_tomato', 'lettuce'], points: 350, tips: 120, time: 55 },
];

interface RemotePlayer {
  id: string;
  n: string;
  x: number;
  y: number;
  c: string;
  h: string | null;
  s: number;
  host?: boolean;
}

interface ActiveOrder {
  id: number;
  n: string;
  ing: string[];
  tr: number;
  mt: number;
  pts: number;
  tip: number;
}

interface KitchenState {
  c: string;
  sa: boolean;
  se: boolean;
  t: number;
  p: RemotePlayer[];
  st: { id: number; st: string; tm: number; it: string | null }[];
  cb: { id: number; st: string; pr: number; it: string | null }[];
  ap: { id: number; it: string[] }[];
  o: ActiveOrder[];
  stat: {
    ordersServed: number;
    ordersBurned: number;
    ordersFailed: number;
    totalTips: number;
  };
}

export function PixelKitchenRushEngine({ gameId, gameTitle: _gameTitle, onScoreSubmitted }: PixelKitchenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<any | null>(null);
  const soundRef = useRef<KitchenSynthAudio>(new KitchenSynthAudio());
  const animFrameRef = useRef<number | null>(null);

  // Networking & Matchmaking State
  const [networkMode, setNetworkMode] = useState<'lobby' | 'multiplayer' | 'solo'>('lobby');
  const [roomCode, setRoomCode] = useState<string>('');
  const [joinInputCode, setJoinInputCode] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('Chef Rookie');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [myPlayerId, setMyPlayerId] = useState<string>('local_chef');
  const [lobbyError, setLobbyError] = useState<string>('');

  // Shift & Economy State
  const [shiftActive, setShiftActive] = useState<boolean>(false);
  const [shiftEnded, setShiftEnded] = useState<boolean>(false);
  const [shiftTimer, setShiftTimer] = useState<number>(180);
  const [walletBalance, setWalletBalance] = useState<number>(250);
  const [ordersServed, setOrdersServed] = useState<number>(0);
  const [ordersBurned, setOrdersBurned] = useState<number>(0);
  const [ordersFailed, setOrdersFailed] = useState<number>(0);
  const [totalTipsEarned, setTotalTipsEarned] = useState<number>(0);

  // Daily Review Modal State
  const [showDailyReview, setShowDailyReview] = useState<boolean>(false);
  const [starRating, setStarRating] = useState<number>(5.0);
  const [customerReview, setCustomerReview] = useState<string>('');
  const [tipsDoubled, setTipsDoubled] = useState<boolean>(false);
  const [inspectorBribed, setInspectorBribed] = useState<boolean>(false);

  // Modals & Sound
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // Equipped 4-Slot Loadout (Chef Skin, Nitro Trails & Turbo Stoves)
  // ---------------------------------------------------------------------------
  const _pkrLoadout = platformStore.getLoadout(platformStore.getCurrentUser()?.id || 'user-001', 'pixel-kitchen-rush');
  const _chefSprite = _pkrLoadout?.visualSkin?.chefSprite || 'standard';
  const _dashParticleColor = _pkrLoadout?.actionJuice?.dashParticleColor || null;
  const _cookSpeedMultiplier = (_pkrLoadout?.gameGear?.cook_speed_multiplier || 1.0);
  const _extinguishSpeedMultiplier = (_pkrLoadout?.gameGear?.extinguish_speed_multiplier || 1.0);

  const [showRewardedAd, setShowRewardedAd] = useState<boolean>(false);
  const [adRewardAction, setAdRewardAction] = useState<'double_tips' | 'bribe_inspector'>('double_tips');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Client Prediction & Local Simulation State
  const localPosRef = useRef<{ x: number; y: number }>({ x: 380, y: 320 });
  const localHoldingRef = useRef<string | null>(null);
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const lastStateRef = useRef<KitchenState>({
    c: 'SOLO',
    sa: false,
    se: false,
    t: 180,
    p: [],
    st: [
      { id: 0, st: 'empty', tm: 0, it: null },
      { id: 1, st: 'empty', tm: 0, it: null },
      { id: 2, st: 'empty', tm: 0, it: null },
    ],
    cb: [
      { id: 0, st: 'empty', pr: 0, it: null },
      { id: 1, st: 'empty', pr: 0, it: null },
    ],
    ap: [
      { id: 0, it: [] },
      { id: 1, it: [] },
    ],
    o: [],
    stat: { ordersServed: 0, ordersBurned: 0, ordersFailed: 0, totalTips: 0 },
  });

  const orderCounterRef = useRef<number>(1);
  const activePromptRef = useRef<string>('');

  // ---------------------------------------------------------------------------
  // Procedural Customer Reviews Generator
  // ---------------------------------------------------------------------------
  const generateCustomerReview = (stars: number, _served?: number, _burned?: number) => {
    if (stars >= 4.5) {
      const reviews = [
        '“Gordon Ramsay wept tears of pure joy. The patty was grilled to divine perfection!” ⭐⭐⭐⭐⭐',
        '“Best burger in Pixel City! The chefs operated like a Michelin-starred pit crew.” ⭐⭐⭐⭐⭐',
        '“Crispy lettuce, melted cheese, lightning-fast delivery. 10/10 dining experience!” ⭐⭐⭐⭐⭐',
      ];
      return reviews[Math.floor(Math.random() * reviews.length)];
    }
    if (stars >= 3.5) {
      const reviews = [
        '“Tasty burgers, but the kitchen was pure cartoon mayhem. Entertaining lunch!” ⭐⭐⭐⭐',
        '“Food was hot and fresh. Lost one star because the chef threw a tomato at my head.” ⭐⭐⭐⭐',
        '“Solid meal! Great teamwork on the stoves, will visit again during lunch rush.” ⭐⭐⭐⭐',
      ];
      return reviews[Math.floor(Math.random() * reviews.length)];
    }
    if (stars >= 2.5) {
      const reviews = [
        '“The burger was decent, but my table was dangerously close to the flaming stove.” ⭐⭐⭐',
        '“Found an un-chopped tomato rolling across the floor. Passionate kitchen though.” ⭐⭐⭐',
        '“A bit chaotic. The fire alarm went off twice, but the cheese was well melted.” ⭐⭐⭐',
      ];
      return reviews[Math.floor(Math.random() * reviews.length)];
    }
    const badReviews = [
      '“Health Inspector Nightmare! Kitchen was engulfed in smoke and burnt patties.” ⭐',
      '“I waited 20 minutes and received a single slice of cheese on a plate. F-tier.” ⭐',
      '“The chef looked panicked and was running in circles with raw meat. Avoid!” ⭐',
    ];
    return badReviews[Math.floor(Math.random() * badReviews.length)];
  };

  // Helper to Spawn an Order in Local / Solo mode
  const spawnLocalOrder = useCallback(() => {
    const s = lastStateRef.current;
    if (s.o.length >= 4) return;
    const r = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    s.o.push({
      id: orderCounterRef.current++,
      n: r.name,
      ing: [...r.ingredients],
      tr: r.time,
      mt: r.time,
      pts: r.points,
      tip: r.tips,
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Socket.io Connection & Matchmaking
  // ---------------------------------------------------------------------------
  const initSocket = () => {
    if (socketRef.current) return socketRef.current;
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      setMyPlayerId(socket.id || '');
    });

    socket.on('room_created', ({ roomCode: code, state }: { roomCode: string; state: KitchenState }) => {
      setRoomCode(code);
      setIsHost(true);
      setNetworkMode('multiplayer');
      lastStateRef.current = state;
    });

    socket.on('room_joined', ({ roomCode: code, state }: { roomCode: string; state: KitchenState }) => {
      setRoomCode(code);
      setIsHost(false);
      setNetworkMode('multiplayer');
      lastStateRef.current = state;
    });

    socket.on('join_error', ({ message }: { message: string }) => {
      setLobbyError(message || 'Failed to join room.');
    });

    socket.on('game_tick', (state: KitchenState) => {
      lastStateRef.current = state;
      setShiftActive(state.sa);
      setShiftTimer(state.t);
      setOrdersServed(state.stat.ordersServed);
      setOrdersBurned(state.stat.ordersBurned);
      setOrdersFailed(state.stat.ordersFailed);
      setTotalTipsEarned(state.stat.totalTips);

      // Synchronize local holding item if server has it
      const me = state.p.find((p) => p.id === (socketRef.current?.id || myPlayerId));
      if (me) {
        localHoldingRef.current = me.h;
      }

      // Check for Shift End Trigger
      if (state.se && !shiftEnded) {
        setShiftEnded(true);
        triggerDailyReview(state.stat.ordersServed, state.stat.ordersBurned, state.stat.ordersFailed, state.stat.totalTips);
      }
    });

    socket.on('order_served_success', () => {
      soundRef.current.playBell();
      confetti({ particleCount: 45, spread: 55 });
    });

    socketRef.current = socket;
    return socket;
  };

  const handleHostGame = () => {
    setLobbyError('');
    const socket = initSocket();
    socket.emit('create_room', { playerName });
  };

  const handleJoinGame = () => {
    if (!joinInputCode || joinInputCode.length < 4) {
      setLobbyError('Please enter a valid 4-character room code.');
      return;
    }
    setLobbyError('');
    const socket = initSocket();
    socket.emit('join_room', { roomCode: joinInputCode.toUpperCase(), playerName });
  };

  const handleStartShift = () => {
    if (networkMode === 'multiplayer' && socketRef.current) {
      socketRef.current.emit('start_shift');
    } else {
      // Full Local Solo Mode Shift Start
      setNetworkMode('solo');
      setShiftActive(true);
      setShiftEnded(false);
      setShiftTimer(180);
      setOrdersServed(0);
      setOrdersBurned(0);
      setOrdersFailed(0);
      setTotalTipsEarned(0);
      localHoldingRef.current = null;

      const s = lastStateRef.current;
      s.sa = true;
      s.se = false;
      s.t = 180;
      s.st.forEach((st) => {
        st.st = 'empty';
        st.tm = 0;
        st.it = null;
      });
      s.cb.forEach((cb) => {
        cb.st = 'empty';
        cb.pr = 0;
        cb.it = null;
      });
      s.ap.forEach((ap) => {
        ap.it = [];
      });
      s.o = [];
      s.stat = { ordersServed: 0, ordersBurned: 0, ordersFailed: 0, totalTips: 0 };

      spawnLocalOrder();
      spawnLocalOrder();
    }
  };

  // Auto-start shift on mount
  useEffect(() => {
    handleStartShift();
  }, []);

  // ---------------------------------------------------------------------------
  // Daily Review & Payout Loop
  // ---------------------------------------------------------------------------
  const triggerDailyReview = async (served: number, burned: number, failed: number, tips: number) => {
    setShowDailyReview(true);
    setTipsDoubled(false);
    setInspectorBribed(false);

    const totalOrders = served + failed + burned * 0.5;
    let rating = 5.0;
    if (totalOrders > 0) {
      const penalty = (burned * 1.2 + failed * 0.8) / Math.max(1, served);
      rating = Math.max(1.0, Math.min(5.0, Number((5.0 - penalty * 1.5).toFixed(1))));
    } else {
      rating = 2.0;
    }
    setStarRating(rating);

    const reviewText = generateCustomerReview(rating, served, burned);
    setCustomerReview(reviewText);

    // Automated Score Submission
    const finalScore = tips + served * 50;
    try {
      localStorage.setItem(`ultimatum_highscore_${gameId}`, finalScore.toString());
    } catch {}
    platformStore.submitScore(gameId, finalScore);
    if (onScoreSubmitted) {
      onScoreSubmitted(finalScore);
    }

    try {
      const res = await fetch('/api/kitchen/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: roomCode || 'SOLO',
          playerId: playerName,
          ordersServed: served,
          ordersBurned: burned,
          ordersFailed: failed,
          starRating: rating,
          tipsEarned: tips,
          customerReview: reviewText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.newBalance);
      }
    } catch {}
  };

  const handleWatchRewardedAdForDoubleTips = () => {
    setAdRewardAction('double_tips');
    setShowRewardedAd(true);
  };

  const handleBribeInspectorAd = () => {
    setAdRewardAction('bribe_inspector');
    setShowRewardedAd(true);
  };

  const handleAdRewardEarned = async () => {
    setShowRewardedAd(false);
    if (adRewardAction === 'double_tips' && !tipsDoubled) {
      setTipsDoubled(true);
      setTotalTipsEarned((t) => t * 2);
      confetti({ particleCount: 100, spread: 80 });

      try {
        const res = await fetch('/api/kitchen/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: roomCode || 'SOLO',
            playerId: playerName,
            ordersServed,
            ordersBurned,
            ordersFailed,
            starRating,
            tipsEarned: totalTipsEarned,
            isDoubled: true,
            customerReview,
          }),
        });
        const data = await res.json();
        if (data.success) setWalletBalance(data.newBalance);
      } catch {}
    } else if (adRewardAction === 'bribe_inspector' && !inspectorBribed) {
      setInspectorBribed(true);
      setStarRating(5.0);
      setCustomerReview('“The Health Inspector smiled, stamped a 5-STAR GRADE A, and enjoyed a free lunch.” ⭐⭐⭐⭐⭐');
      confetti({ particleCount: 80, spread: 60 });
    }
  };

  // ---------------------------------------------------------------------------
  // Action Engine (Chop, Cook, Plate, Serve, Toss) - Works Solo + Multiplayer
  // ---------------------------------------------------------------------------
  const executeKitchenAction = (action: string, payload: any = {}) => {
    // 1. Forward to Socket Server if Multiplayer
    if (networkMode === 'multiplayer' && socketRef.current) {
      socketRef.current.emit('kitchen_action', { action, payload });
    }

    // 2. Local State Execution (Immediate Client Response & Solo Engine)
    const state = lastStateRef.current;
    if (!state.sa || state.se) return;

    if (action === 'pick_ingredient') {
      if (!localHoldingRef.current) {
        localHoldingRef.current = payload.ingredient;
        soundRef.current.playPick();
      }
    }

    if (action === 'interact_stove') {
      const stove = state.st.find((s) => s.id === payload.stoveId);
      if (stove) {
        if (stove.st === 'empty' && localHoldingRef.current === 'raw_patty') {
          stove.st = 'cooking';
          stove.tm = 0;
          stove.it = 'cooking_patty';
          localHoldingRef.current = null;
          soundRef.current.playSizzle();
        } else if ((stove.st === 'ready' || stove.st === 'burnt') && !localHoldingRef.current) {
          localHoldingRef.current = stove.it;
          stove.st = 'empty';
          stove.tm = 0;
          stove.it = null;
          soundRef.current.playPick();
        }
      }
    }

    if (action === 'interact_chopping') {
      const board = state.cb.find((b) => b.id === payload.boardId);
      if (board) {
        if (board.st === 'empty' && (localHoldingRef.current === 'raw_lettuce' || localHoldingRef.current === 'raw_tomato')) {
          board.it = localHoldingRef.current;
          board.st = 'chopping';
          board.pr = 0;
          localHoldingRef.current = null;
          soundRef.current.playPick();
        } else if (board.st === 'chopping') {
          board.pr += 1;
          soundRef.current.playChop();
          if (board.pr >= 5) {
            board.st = 'chopped';
            board.it = board.it === 'raw_lettuce' ? 'chopped_lettuce' : 'chopped_tomato';
          }
        } else if (board.st === 'chopped' && !localHoldingRef.current) {
          localHoldingRef.current = board.it;
          board.st = 'empty';
          board.pr = 0;
          board.it = null;
          soundRef.current.playPick();
        }
      }
    }

    if (action === 'interact_plate') {
      const plate = state.ap.find((p) => p.id === payload.plateId);
      if (plate) {
        if (localHoldingRef.current && localHoldingRef.current !== 'burnt_patty' && !localHoldingRef.current.startsWith('raw_')) {
          plate.it.push(localHoldingRef.current);
          localHoldingRef.current = null;
          soundRef.current.playPick();
        } else if (!localHoldingRef.current && plate.it.length > 0) {
          localHoldingRef.current = `plated:${plate.it.join('+')}`;
          plate.it = [];
          soundRef.current.playPick();
        }
      }
    }

    if (action === 'serve_order') {
      if (localHoldingRef.current && localHoldingRef.current.startsWith('plated:')) {
        const platedIngs = localHoldingRef.current.replace('plated:', '').split('+');

        let matchedIdx = -1;
        for (let i = 0; i < state.o.length; i++) {
          const ord = state.o[i];
          const hasAll = ord.ing.every((ing) => platedIngs.includes(ing));
          const sameCount = ord.ing.length === platedIngs.length;
          if (hasAll && sameCount) {
            matchedIdx = i;
            break;
          }
        }

        if (matchedIdx !== -1) {
          const matched = state.o[matchedIdx];
          state.stat.ordersServed += 1;
          state.stat.totalTips += matched.tip;
          setOrdersServed((s) => s + 1);
          setTotalTipsEarned((t) => t + matched.tip);
          state.o.splice(matchedIdx, 1);
          localHoldingRef.current = null;

          soundRef.current.playBell();
          confetti({ particleCount: 50, spread: 60 });
          spawnLocalOrder();
        }
      }
    }

    if (action === 'toss_trash') {
      if (localHoldingRef.current) {
        localHoldingRef.current = null;
        soundRef.current.playBurn();
      }
    }
  };

  const handleActionButton = (type: 'interact' | 'cook' | 'toss') => {
    const p = localPosRef.current;
    if (type === 'toss') {
      executeKitchenAction('toss_trash');
      return;
    }

    // Near Ingredient Dispensers (Bottom Crates)
    if (p.y > 440) {
      if (p.x >= 100 && p.x < 220) executeKitchenAction('pick_ingredient', { ingredient: 'bun' });
      else if (p.x >= 220 && p.x < 340) executeKitchenAction('pick_ingredient', { ingredient: 'raw_patty' });
      else if (p.x >= 340 && p.x < 460) executeKitchenAction('pick_ingredient', { ingredient: 'raw_lettuce' });
      else if (p.x >= 460 && p.x < 580) executeKitchenAction('pick_ingredient', { ingredient: 'raw_tomato' });
      else if (p.x >= 580 && p.x < 700) executeKitchenAction('pick_ingredient', { ingredient: 'cheese' });
      return;
    }

    // Near Top Stoves (x: 180-440, y < 260)
    if (p.y < 260 && p.x >= 180 && p.x < 440) {
      const stoveIdx = p.x < 260 ? 0 : p.x < 350 ? 1 : 2;
      executeKitchenAction('interact_stove', { stoveId: stoveIdx });
      return;
    }

    // Near Top Cutting Boards (x: 450-640, y < 260)
    if (p.y < 260 && p.x >= 450 && p.x < 640) {
      const boardIdx = p.x < 550 ? 0 : 1;
      executeKitchenAction('interact_chopping', { boardId: boardIdx });
      return;
    }

    // Near Middle Assembly Plating Tables (x: 270-520, y: 350-460)
    if (p.y >= 350 && p.y <= 460 && p.x >= 270 && p.x <= 520) {
      const plateIdx = p.x < 390 ? 0 : 1;
      executeKitchenAction('interact_plate', { plateId: plateIdx });
      return;
    }

    // Near Left Delivery Hatch (x < 200)
    if (p.x < 200) {
      executeKitchenAction('serve_order');
      return;
    }

    // Near Right Trash Bin (x > 640)
    if (p.x > 640) {
      executeKitchenAction('toss_trash');
      return;
    }
  };

  // ---------------------------------------------------------------------------
  // Input Listeners (WASD + Space + E + Q)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const gameKeys = [' ', 'space', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'e', 'q'];
      if (gameKeys.includes(k) || gameKeys.includes(e.code.toLowerCase())) {
        e.preventDefault();
      }
      keysPressedRef.current[k] = true;
      if (e.key === ' ' || k === 'e') {
        handleActionButton('interact');
      } else if (k === 'q') {
        handleActionButton('toss');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Solo Mode Tick Simulation Loop (Runs at 20 Ticks/sec when offline)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (networkMode !== 'solo' || !shiftActive || shiftEnded) return;

    const interval = setInterval(() => {
      const s = lastStateRef.current;
      const dt = 0.05;

      // 1. Shift Timer
      s.t -= dt;
      setShiftTimer(Math.ceil(s.t));
      if (s.t <= 0) {
        s.t = 0;
        s.sa = false;
        s.se = true;
        setShiftActive(false);
        setShiftEnded(true);
        triggerDailyReview(s.stat.ordersServed, s.stat.ordersBurned, s.stat.ordersFailed, s.stat.totalTips);
        return;
      }

      // 2. Stove Sim
      s.st.forEach((stove) => {
        if (stove.st === 'cooking') {
          stove.tm += dt;
          if (stove.tm >= 8) {
            stove.st = 'ready';
            stove.it = 'cooked_patty';
          }
        } else if (stove.st === 'ready') {
          stove.tm += dt;
          if (stove.tm >= 14) {
            stove.st = 'burnt';
            stove.it = 'burnt_patty';
            s.stat.ordersBurned += 1;
            setOrdersBurned((b) => b + 1);
            soundRef.current.playBurn();
          }
        }
      });

      // 3. Orders Sim
      for (let i = s.o.length - 1; i >= 0; i--) {
        const o = s.o[i];
        o.tr -= dt;
        if (o.tr <= 0) {
          s.stat.ordersFailed += 1;
          setOrdersFailed((f) => f + 1);
          s.o.splice(i, 1);
        }
      }

      if (s.o.length < 3 && Math.random() < 0.03) {
        spawnLocalOrder();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [networkMode, shiftActive, shiftEnded, spawnLocalOrder]);

  // ---------------------------------------------------------------------------
  // Canvas Game Render Loop (Retro MS Paint Aesthetic + Order Ticket Rack)
  // ---------------------------------------------------------------------------
  const renderKitchen = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 600;

    // 1. Client Movement Prediction
    const keys = keysPressedRef.current;
    let dx = 0;
    let dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    const speed = 4.5;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      localPosRef.current.x = Math.max(90, Math.min(710, localPosRef.current.x + (dx / len) * speed));
      localPosRef.current.y = Math.max(160, Math.min(500, localPosRef.current.y + (dy / len) * speed));

      if (networkMode === 'multiplayer' && socketRef.current) {
        socketRef.current.emit('player_move', {
          x: localPosRef.current.x,
          y: localPosRef.current.y,
          vx: dx,
          vy: dy,
        });
      }
    }

    // 2. Kitchen Floor (Checkerboard Tiles)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#e2e8f0';
    for (let x = 0; x < width; x += 40) {
      for (let y = 0; y < height; y += 40) {
        if ((x / 40 + y / 40) % 2 === 0) {
          ctx.fillRect(x, y, 40, 40);
        }
      }
    }

    // Outer Thick MS-Paint Border
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    const state = lastStateRef.current;

    // 3. TOP ORDER TICKET RACK (Real-Time Customer Orders)
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(10, 10, width - 20, 85);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, width - 20, 85);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('📋 ACTIVE CUSTOMER TICKETS:', 22, 28);

    if (state.o.length === 0) {
      ctx.fillStyle = '#a1a1aa';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('⏳ WAITING FOR ORDERS TO COME IN...', 220, 55);
    } else {
      state.o.forEach((order, idx) => {
        const ox = 200 + idx * 145;
        const oy = 16;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ox, oy, 138, 72);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(ox, oy, 138, 72);

        // Recipe Title
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(order.n.slice(0, 16), ox + 6, oy + 14);

        // Ingredients
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 8px monospace';
        const formattedIngs = order.ing.map((i) => i.replace('cooked_', '').replace('chopped_', '')).join('+');
        ctx.fillText(formattedIngs.slice(0, 22), ox + 6, oy + 28);

        // Time Progress Bar
        const pct = Math.max(0, order.tr / order.mt);
        ctx.fillStyle = pct < 0.3 ? '#ef4444' : pct < 0.6 ? '#f59e0b' : '#10b981';
        ctx.fillRect(ox + 6, oy + 36, 126 * pct, 6);
        ctx.strokeRect(ox + 6, oy + 36, 126, 6);

        // Value & Tips
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`+${order.pts}p • ${order.tip}🪙`, ox + 6, oy + 58);
      });
    }

    // 4. Stoves Counter (Top Middle)
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(180, 110, 260, 80);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(180, 110, 260, 80);

    state.st.forEach((stove, idx) => {
      const sx = 200 + idx * 80;
      const sy = 120;

      ctx.fillStyle = stove.st === 'burnt' ? '#1e293b' : stove.st === 'ready' ? '#f59e0b' : stove.st === 'cooking' ? '#ef4444' : '#64748b';
      ctx.fillRect(sx, sy, 60, 60);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.strokeRect(sx, sy, 60, 60);

      ctx.beginPath();
      ctx.arc(sx + 30, sy + 30, 20, 0, Math.PI * 2);
      ctx.strokeStyle = stove.st === 'cooking' ? '#ffffff' : '#334155';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(stove.st === 'cooking' ? '🔥 GRILL' : stove.st === 'ready' ? '✨ DONE' : stove.st === 'burnt' ? '⚠ BURNT' : 'STOVE', sx + 30, sy + 34);
    });

    // 5. Cutting Boards Counter (Top Right)
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(460, 110, 200, 80);
    ctx.strokeRect(460, 110, 200, 80);

    state.cb.forEach((board, idx) => {
      const bx = 480 + idx * 90;
      const by = 120;

      ctx.fillStyle = '#b45309';
      ctx.fillRect(bx, by, 70, 60);
      ctx.strokeRect(bx, by, 70, 60);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(board.st === 'chopping' ? `🔪 (${board.pr}/5)` : board.st === 'chopped' ? '🥗 CHOP' : 'BOARD', bx + 35, by + 34);
    });

    // 6. Middle Plating & Assembly Tables
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(280, 360, 240, 80);
    ctx.strokeRect(280, 360, 240, 80);

    state.ap.forEach((p, idx) => {
      const px = 330 + idx * 120;
      const py = 400;

      ctx.beginPath();
      ctx.arc(px, py, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.it.length > 0 ? `PLATE (${p.it.length})` : 'PLATE', px, py + 3);
    });

    // 7. Left Delivery Hatch
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(10, 210, 100, 220);
    ctx.strokeRect(10, 210, 100, 220);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DELIVERY', 60, 310);
    ctx.fillText('HATCH 🔔', 60, 330);

    // 8. Right Trash Can
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(690, 280, 80, 80);
    ctx.strokeRect(690, 280, 80, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🗑️ TRASH', 730, 325);

    // 9. Bottom Ingredient Dispensers (5 Crates)
    const ingredients = [
      { name: 'BUNS', color: '#f59e0b', x: 100 },
      { name: 'PATTY', color: '#dc2626', x: 220 },
      { name: 'LETTUCE', color: '#16a34a', x: 340 },
      { name: 'TOMATO', color: '#ef4444', x: 460 },
      { name: 'CHEESE', color: '#eab308', x: 580 },
    ];

    ingredients.forEach((ing) => {
      ctx.fillStyle = ing.color;
      ctx.fillRect(ing.x, 510, 110, 70);
      ctx.strokeRect(ing.x, 510, 110, 70);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ing.name, ing.x + 55, 550);
    });

    // 10. Render Other Remote Connected Chefs
    if (networkMode === 'multiplayer' && state.p) {
      state.p.forEach((player) => {
        if (player.id !== (socketRef.current?.id || myPlayerId)) {
          ctx.beginPath();
          ctx.arc(player.x, player.y, 22, 0, Math.PI * 2);
          ctx.fillStyle = player.c;
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 3.5;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(player.x - 12, player.y - 32, 24, 16);
          ctx.strokeRect(player.x - 12, player.y - 32, 24, 16);

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(player.n, player.x, player.y - 38);

          if (player.h) {
            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(`[${player.h.replace('raw_', '')}]`, player.x, player.y + 36);
          }
        }
      });
    }

    // 11. Render Local Chef
    const myPos = localPosRef.current;
    ctx.beginPath();
    ctx.arc(myPos.x, myPos.y, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#f43f5e';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(myPos.x - 14, myPos.y - 38, 28, 18);
    ctx.strokeRect(myPos.x - 14, myPos.y - 38, 28, 18);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${playerName} (YOU)`, myPos.x, myPos.y - 44);

    // Render Local Held Item
    const holding = localHoldingRef.current;
    if (holding) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`HOLDING: [${holding.replace('raw_', '').replace('plated:', 'PLATE: ')}]`, myPos.x, myPos.y + 38);
    }

    // 12. Interactive Prompt Overlay
    const p = localPosRef.current;
    let prompt = '';
    if (p.y > 440) {
      if (p.x >= 100 && p.x < 220) prompt = 'PRESS [SPACE] / [E]: PICK BUN';
      else if (p.x >= 220 && p.x < 340) prompt = 'PRESS [SPACE] / [E]: PICK RAW PATTY';
      else if (p.x >= 340 && p.x < 460) prompt = 'PRESS [SPACE] / [E]: PICK LETTUCE';
      else if (p.x >= 460 && p.x < 580) prompt = 'PRESS [SPACE] / [E]: PICK TOMATO';
      else if (p.x >= 580 && p.x < 700) prompt = 'PRESS [SPACE] / [E]: PICK CHEESE';
    } else if (p.y < 260 && p.x >= 180 && p.x < 440) {
      prompt = holding === 'raw_patty' ? 'PRESS [SPACE]: PLACE PATTY ON STOVE' : 'PRESS [SPACE]: INTERACT WITH STOVE';
    } else if (p.y < 260 && p.x >= 450 && p.x < 640) {
      prompt = 'PRESS [SPACE] REPEATEDLY: CHOP VEGGIE';
    } else if (p.y >= 350 && p.y <= 460 && p.x >= 270 && p.x <= 520) {
      prompt = holding ? 'PRESS [SPACE]: ADD INGREDIENT TO PLATE' : 'PRESS [SPACE]: PICK UP ASSEMBLED DISH';
    } else if (p.x < 200) {
      prompt = holding && holding.startsWith('plated:') ? 'PRESS [SPACE]: DELIVER ORDER TO HATCH! 🔔' : 'STAND HERE WITH PLATED DISH TO DELIVER';
    } else if (p.x > 640) {
      prompt = 'PRESS [Q] / [SPACE]: TOSS IN TRASH 🗑️';
    }

    activePromptRef.current = prompt;
    if (prompt) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(width / 2 - 160, height - 34, 320, 26);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(width / 2 - 160, height - 34, 320, 26);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(prompt, width / 2, height - 17);
    }

    animFrameRef.current = requestAnimationFrame(renderKitchen);
  }, [playerName, myPlayerId, networkMode]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(renderKitchen);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [renderKitchen]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border-4 border-black bg-amber-50 p-4 shadow-2xl space-y-3 font-mono select-none"
    >
      {/* ---------------------------------------------------- */}
      {/* MS Paint Retro Title & Matchmaking Header            */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-4 border-black pb-3 bg-yellow-300 p-3 rounded-xl border-black shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-black text-white px-2.5 py-1 text-sm font-black uppercase rounded tracking-wider">
            🍳 PIXEL KITCHEN RUSH
          </div>
          {roomCode && (
            <div className="bg-white border-2 border-black px-2.5 py-1 text-xs font-bold rounded">
              ROOM: <span className="text-rose-600 font-black">{roomCode}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white border-2 border-black px-2.5 py-1 text-xs font-bold rounded">
            <DollarSign className="w-3.5 h-3.5 text-amber-500" />
            <span>{walletBalance.toLocaleString()} COINS</span>
          </div>

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              soundRef.current.enabled = !soundEnabled;
            }}
            className="rounded border-2 border-black bg-white p-1.5 hover:bg-zinc-100"
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-black" /> : <VolumeX className="w-4 h-4 text-rose-500" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="rounded border-2 border-black bg-white p-1.5 hover:bg-zinc-100"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* HUD Bar: Shift Countdown, Orders, Tips               */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border-4 border-black shadow">
        <div className="border-2 border-black p-2 rounded bg-rose-50">
          <div className="text-[10px] text-zinc-600 font-bold uppercase flex items-center gap-1">
            <Clock className="w-3 h-3 text-rose-600" />
            <span>Shift Timer (3 Min)</span>
          </div>
          <div className={`text-xl font-black ${shiftTimer <= 30 ? 'text-rose-600 animate-pulse' : 'text-black'}`}>
            {Math.floor(shiftTimer / 60)}:{String(Math.floor(shiftTimer % 60)).padStart(2, '0')}
          </div>
        </div>

        <div className="border-2 border-black p-2 rounded bg-emerald-50">
          <div className="text-[10px] text-zinc-600 font-bold uppercase flex items-center gap-1">
            <Utensils className="w-3 h-3 text-emerald-600" />
            <span>Orders Served</span>
          </div>
          <div className="text-xl font-black text-emerald-600">{ordersServed}</div>
        </div>

        <div className="border-2 border-black p-2 rounded bg-amber-50">
          <div className="text-[10px] text-zinc-600 font-bold uppercase flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-600" />
            <span>Burned / Trash</span>
          </div>
          <div className="text-xl font-black text-amber-600">{ordersBurned}</div>
        </div>

        <div className="border-2 border-black p-2 rounded bg-cyan-50">
          <div className="text-[10px] text-zinc-600 font-bold uppercase flex items-center gap-1">
            <Award className="w-3 h-3 text-cyan-600" />
            <span>Tips Earned</span>
          </div>
          <div className="text-xl font-black text-cyan-700">+{totalTipsEarned} 🪙</div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* HTML5 Canvas Kitchen Arena                           */}
      {/* ---------------------------------------------------- */}
      <div className="relative aspect-[4/3] w-full min-h-[420px] max-h-[580px] overflow-hidden rounded-xl border-4 border-black bg-white shadow-inner">
        <canvas ref={canvasRef} width={800} height={600} className="h-full w-full object-contain touch-none" />

        {/* Room Lobby / Matchmaking Modal Overlay */}
        {networkMode === 'lobby' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center backdrop-blur-sm space-y-4">
            <div className="bg-yellow-300 border-4 border-black p-6 rounded-2xl max-w-md w-full shadow-2xl text-black space-y-3">
              <h3 className="text-2xl font-black uppercase">🍳 LOBBY MATCHMAKING</h3>
              <p className="text-xs font-semibold text-zinc-700">
                Host a multiplayer kitchen room with a 4-character code, join friends, or start a solo shift!
              </p>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-600 block text-left mb-1">Chef Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full border-2 border-black px-3 py-2 text-xs font-bold rounded bg-white text-black"
                  placeholder="Enter Chef Nickname"
                />
              </div>

              {lobbyError && <div className="text-xs font-bold text-rose-600 bg-rose-100 p-2 rounded border border-rose-400">{lobbyError}</div>}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleHostGame}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-black py-2.5 px-3 rounded-xl border-2 border-black shadow text-xs uppercase"
                >
                  👑 Host Game
                </button>

                <div className="flex gap-1">
                  <input
                    type="text"
                    maxLength={4}
                    value={joinInputCode}
                    onChange={(e) => setJoinInputCode(e.target.value.toUpperCase())}
                    placeholder="CODE"
                    className="w-20 border-2 border-black px-2 py-1 text-center font-black uppercase text-xs rounded bg-white"
                  />
                  <button
                    onClick={handleJoinGame}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-black py-2.5 px-2 rounded-xl border-2 border-black shadow text-xs uppercase"
                  >
                    Join
                  </button>
                </div>
              </div>

              <div className="border-t-2 border-zinc-400 pt-2">
                <button
                  onClick={() => {
                    handleStartShift();
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-2.5 px-3 rounded-xl border-2 border-black shadow text-xs uppercase"
                >
                  ⚡ Play Solo Practice Shift
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Start Shift Host Prompt Overlay */}
        {networkMode === 'multiplayer' && !shiftActive && !shiftEnded && isHost && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-6 text-center backdrop-blur-sm space-y-4">
            <div className="bg-yellow-300 border-4 border-black p-6 rounded-2xl max-w-sm w-full text-black space-y-3">
              <div className="text-xs font-bold uppercase">ROOM CODE: <span className="text-rose-600 font-black text-lg">{roomCode}</span></div>
              <h4 className="text-xl font-black">WAITING FOR CHEFS</h4>
              <p className="text-xs text-zinc-700">Share your 4-character code with your team to cook together!</p>
              <button
                onClick={handleStartShift}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-3 px-4 rounded-xl border-2 border-black shadow text-sm uppercase flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start 3-Min Shift</span>
              </button>
            </div>
          </div>
        )}

        {/* Daily Review Modal (No Game Over - Shift End Evaluation) */}
        {showDailyReview && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-md space-y-4">
            <div className="bg-amber-100 border-4 border-black p-6 rounded-2xl max-w-md w-full shadow-2xl text-black space-y-3">
              <div className="bg-yellow-300 border-2 border-black p-1.5 rounded text-[10px] font-black uppercase tracking-wider">
                📋 DAILY RESTAURANT INSPECTION REPORT
              </div>

              <h3 className="text-3xl font-black text-black">SHIFT FINISHED!</h3>

              <div className="flex items-center justify-center gap-1.5 text-2xl text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.floor(starRating) ? 'text-amber-500' : 'text-zinc-400'}>
                    ★
                  </span>
                ))}
                <span className="text-sm font-black text-black ml-1.5">({starRating.toFixed(1)} / 5.0)</span>
              </div>

              <div className="bg-white border-2 border-black p-3 rounded-lg text-xs italic text-zinc-800 font-serif">
                {customerReview}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <div className="bg-emerald-100 border border-black p-2 rounded">
                  Served: <span className="font-black text-emerald-700">{ordersServed} Orders</span>
                </div>
                <div className="bg-amber-100 border border-black p-2 rounded">
                  Tips: <span className="font-black text-amber-700">+{totalTipsEarned} 🪙</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t-2 border-black">
                <button
                  onClick={handleWatchRewardedAdForDoubleTips}
                  disabled={tipsDoubled}
                  className={`w-full py-2.5 px-3 rounded-xl border-2 border-black font-black text-xs uppercase flex items-center justify-center gap-2 shadow ${
                    tipsDoubled
                      ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                      : 'bg-yellow-400 hover:bg-yellow-500 text-black animate-bounce'
                  }`}
                >
                  <Tv className="w-4 h-4" />
                  <span>{tipsDoubled ? 'Tips Doubled! (2X Earned)' : 'Double Today\'s Tips (Watch Ad)'}</span>
                </button>

                {starRating < 5.0 && !inspectorBribed && (
                  <button
                    onClick={handleBribeInspectorAd}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white font-black py-2.5 px-3 rounded-xl border-2 border-black shadow text-xs uppercase flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Bribe Health Inspector (5-Star Ad)</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowDailyReview(false);
                    if (networkMode === 'multiplayer' && socketRef.current) {
                      socketRef.current.emit('restart_shift');
                    } else {
                      handleStartShift();
                    }
                  }}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-2.5 px-3 rounded-xl border-2 border-black shadow text-xs uppercase"
                >
                  ▶ Start Next Shift
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* On-Screen Mobile Action Buttons & Retro Controls     */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-yellow-100 p-3 rounded-xl border-4 border-black">
        <div className="text-xs font-bold text-zinc-700">
          <span className="hidden sm:inline">Controls: </span>
          <span className="bg-white px-2 py-0.5 border border-black rounded">WASD / Arrow Keys</span> to Move •{' '}
          <span className="bg-white px-2 py-0.5 border border-black rounded">E / Space</span> to Pick/Cook/Chop •{' '}
          <span className="bg-white px-2 py-0.5 border border-black rounded">Q</span> to Trash
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => handleActionButton('interact')}
            className="flex-1 sm:flex-initial bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black py-3 px-5 rounded-xl border-2 border-black shadow text-xs uppercase"
          >
            🍳 Interact / Cook (E)
          </button>
          <button
            onClick={() => handleActionButton('toss')}
            className="bg-zinc-700 hover:bg-zinc-800 active:scale-95 text-white font-black py-3 px-4 rounded-xl border-2 border-black shadow text-xs uppercase"
          >
            🗑️ Toss (Q)
          </button>
        </div>
      </div>

      {/* Rewarded Ad Modal */}
      <RewardedAdModal
        isOpen={showRewardedAd}
        onClose={() => setShowRewardedAd(false)}
        onRewardEarned={handleAdRewardEarned}
        rewardDescription={
          adRewardAction === 'double_tips'
            ? 'Watch short sponsor ad to double today’s shift tips!'
            : 'Watch short ad to bribe the inspector and receive an instant 5-star grade!'
        }
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Save Your Pixel Kitchen Restaurant"
        onSuccess={() => {}}
      />
    </div>
  );
}
