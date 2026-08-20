'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  Sparkles,
  Trophy,
  Utensils,
  Clock,
  CheckCircle,
  Trash2,
  Users,
  Award,
  DollarSign,
  Tv,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  ShoppingBag,
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
// Types & Game Interfaces
// ---------------------------------------------------------------------------
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

export function PixelKitchenRushEngine({ gameId, gameTitle, onScoreSubmitted }: PixelKitchenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const soundRef = useRef<KitchenSynthAudio>(new KitchenSynthAudio());
  const animFrameRef = useRef<number | null>(null);

  // Networking & Matchmaking State
  const [networkMode, setNetworkMode] = useState<'lobby' | 'multiplayer' | 'solo'>('lobby');
  const [roomCode, setRoomCode] = useState<string>('');
  const [joinInputCode, setJoinInputCode] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('Chef Rookie');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
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
  const [myScore, setMyScore] = useState<number>(0);

  // Daily Review Modal State
  const [showDailyReview, setShowDailyReview] = useState<boolean>(false);
  const [starRating, setStarRating] = useState<number>(5.0);
  const [customerReview, setCustomerReview] = useState<string>('');
  const [tipsDoubled, setTipsDoubled] = useState<boolean>(false);
  const [inspectorBribed, setInspectorBribed] = useState<boolean>(false);

  // Monetization & Modals
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showRewardedAd, setShowRewardedAd] = useState<boolean>(false);
  const [adRewardAction, setAdRewardAction] = useState<'double_tips' | 'bribe_inspector'>('double_tips');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Client Prediction & Movement
  const localPosRef = useRef<{ x: number; y: number; vx: number; vy: number }>({ x: 350, y: 320, vx: 0, vy: 0 });
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const joystickDirRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastStateRef = useRef<KitchenState | null>(null);

  // ---------------------------------------------------------------------------
  // Procedural Customer Reviews Generator
  // ---------------------------------------------------------------------------
  const generateCustomerReview = (stars: number, served: number, burned: number) => {
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

    socket.on('room_created', ({ roomCode: code, state }) => {
      setRoomCode(code);
      setIsHost(true);
      setNetworkMode('multiplayer');
      lastStateRef.current = state;
    });

    socket.on('room_joined', ({ roomCode: code, state }) => {
      setRoomCode(code);
      setIsHost(false);
      setNetworkMode('multiplayer');
      lastStateRef.current = state;
    });

    socket.on('join_error', ({ message }) => {
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

      // Check for Shift End Trigger
      if (state.se && !shiftEnded) {
        setShiftEnded(true);
        triggerDailyReview(state.stat.ordersServed, state.stat.ordersBurned, state.stat.ordersFailed, state.stat.totalTips);
      }
    });

    socket.on('order_served_success', ({ recipeName, tips }) => {
      soundRef.current.playBell();
      confetti({ particleCount: 35, spread: 45 });
    });

    socketRef.current = socket;
    return socket;
  };

  // Host Online Room
  const handleHostGame = () => {
    setLobbyError('');
    const socket = initSocket();
    socket.emit('create_room', { playerName });
  };

  // Join Online Room
  const handleJoinGame = () => {
    if (!joinInputCode || joinInputCode.length < 4) {
      setLobbyError('Please enter a valid 4-character room code.');
      return;
    }
    setLobbyError('');
    const socket = initSocket();
    socket.emit('join_room', { roomCode: joinInputCode.toUpperCase(), playerName });
  };

  // Start Shift
  const handleStartShift = () => {
    if (networkMode === 'multiplayer' && socketRef.current) {
      socketRef.current.emit('start_shift');
    } else {
      // Solo Mode Fallback
      setShiftActive(true);
      setShiftEnded(false);
      setShiftTimer(180);
      setOrdersServed(0);
      setOrdersBurned(0);
      setOrdersFailed(0);
      setTotalTipsEarned(0);
    }
  };

  // ---------------------------------------------------------------------------
  // Daily Review & Payout Loop
  // ---------------------------------------------------------------------------
  const triggerDailyReview = async (served: number, burned: number, failed: number, tips: number) => {
    setShowDailyReview(true);
    setTipsDoubled(false);
    setInspectorBribed(false);

    // Calculate Star Rating
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

    // Process Shift Payout via Backend Transaction Route
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

  // Monetization Rewarded Ad Callbacks
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

      // Record double tip payout in MySQL
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
  // Action Handlers (Chop, Cook, Plate, Serve, Toss)
  // ---------------------------------------------------------------------------
  const emitAction = (action: string, payload: any = {}) => {
    if (socketRef.current) {
      socketRef.current.emit('kitchen_action', { action, payload });
    }
  };

  const handleActionButton = (type: 'interact' | 'cook' | 'toss') => {
    const p = localPosRef.current;
    if (type === 'toss') {
      emitAction('toss_trash');
      return;
    }

    // Near Ingredient Dispenser?
    if (p.y > 480) {
      if (p.x < 240) emitAction('pick_ingredient', { ingredient: 'bun' });
      else if (p.x < 360) emitAction('pick_ingredient', { ingredient: 'raw_patty' });
      else if (p.x < 480) emitAction('pick_ingredient', { ingredient: 'raw_lettuce' });
      else if (p.x < 600) emitAction('pick_ingredient', { ingredient: 'raw_tomato' });
      else emitAction('pick_ingredient', { ingredient: 'cheese' });
      return;
    }

    // Near Stoves? (y < 240, x ~ 220-420)
    if (p.y < 240 && p.x < 440) {
      const stoveIdx = p.x < 280 ? 0 : p.x < 360 ? 1 : 2;
      emitAction('interact_stove', { stoveId: stoveIdx });
      soundRef.current.playSizzle();
      return;
    }

    // Near Cutting Boards? (y < 240, x ~ 480-640)
    if (p.y < 240 && p.x >= 480) {
      const boardIdx = p.x < 560 ? 0 : 1;
      emitAction('interact_chopping', { boardId: boardIdx });
      soundRef.current.playChop();
      return;
    }

    // Near Assembly Plates? (y ~ 400-480, x ~ 300-480)
    if (p.y >= 380 && p.y <= 480 && p.x >= 280 && p.x <= 500) {
      const plateIdx = p.x < 380 ? 0 : 1;
      emitAction('interact_plate', { plateId: plateIdx });
      return;
    }

    // Near Service Delivery Window? (x < 150)
    if (p.x < 180) {
      emitAction('serve_order');
      return;
    }
  };

  // ---------------------------------------------------------------------------
  // Input Listeners (WASD + Arrows)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key.toLowerCase() === 'e') {
        handleActionButton('interact');
      } else if (e.key.toLowerCase() === 'q') {
        handleActionButton('toss');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Canvas Game Render Loop (Retro MS Paint Aesthetic)
  // ---------------------------------------------------------------------------
  const renderKitchen = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 600;

    // 1. Client Movement Prediction & Velocity Update
    const keys = keysPressedRef.current;
    let dx = 0;
    let dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (joystickDirRef.current.x !== 0 || joystickDirRef.current.y !== 0) {
      dx = joystickDirRef.current.x;
      dy = joystickDirRef.current.y;
    }

    const speed = 4.2;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      localPosRef.current.x = Math.max(90, Math.min(710, localPosRef.current.x + (dx / len) * speed));
      localPosRef.current.y = Math.max(140, Math.min(510, localPosRef.current.y + (dy / len) * speed));

      if (socketRef.current) {
        socketRef.current.emit('player_move', {
          x: localPosRef.current.x,
          y: localPosRef.current.y,
          vx: dx,
          vy: dy,
        });
      }
    }

    // 2. Retro MS-Paint Tiled Kitchen Floor
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Checkerboard Tile Grid
    ctx.fillStyle = '#e2e8f0';
    for (let x = 0; x < width; x += 40) {
      for (let y = 0; y < height; y += 40) {
        if ((x / 40 + y / 40) % 2 === 0) {
          ctx.fillRect(x, y, 40, 40);
        }
      }
    }

    // Thick MS-Paint Retro Border Walls
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    // 3. Top Kitchen Counter: Stoves & Cutting Boards
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(180, 100, 460, 80);
    ctx.strokeRect(180, 100, 460, 80);

    const state = lastStateRef.current;

    // Render Stoves (3 Units)
    const stoves = state ? state.st : [{ id: 0, st: 'empty', tm: 0, it: null }, { id: 1, st: 'empty', tm: 0, it: null }, { id: 2, st: 'empty', tm: 0, it: null }];
    stoves.forEach((stove, idx) => {
      const sx = 200 + idx * 75;
      const sy = 110;

      ctx.fillStyle = stove.st === 'burnt' ? '#1e293b' : stove.st === 'ready' ? '#f59e0b' : stove.st === 'cooking' ? '#ef4444' : '#64748b';
      ctx.fillRect(sx, sy, 60, 60);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.strokeRect(sx, sy, 60, 60);

      // Stove Grate Rings
      ctx.beginPath();
      ctx.arc(sx + 30, sy + 30, 20, 0, Math.PI * 2);
      ctx.strokeStyle = stove.st === 'cooking' ? '#ffffff' : '#334155';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(stove.st === 'cooking' ? '🔥 SIZZLE' : stove.st === 'ready' ? '✨ READY' : stove.st === 'burnt' ? '⚠ BURNT' : 'STOVE', sx + 30, sy + 34);
    });

    // Render Cutting Boards (2 Units)
    const boards = state ? state.cb : [{ id: 0, st: 'empty', pr: 0, it: null }, { id: 1, st: 'empty', pr: 0, it: null }];
    boards.forEach((board, idx) => {
      const bx = 470 + idx * 80;
      const by = 110;

      ctx.fillStyle = '#b45309';
      ctx.fillRect(bx, by, 65, 60);
      ctx.strokeRect(bx, by, 65, 60);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(board.st === 'chopping' ? `🔪 (${board.pr}/5)` : board.st === 'chopped' ? '🥗 DONE' : 'CHOP', bx + 32, by + 34);
    });

    // 4. Assembly Tables & Plating Counters
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(280, 380, 240, 70);
    ctx.strokeRect(280, 380, 240, 70);

    const plates = state ? state.ap : [{ id: 0, it: [] }, { id: 1, it: [] }];
    plates.forEach((p, idx) => {
      const px = 320 + idx * 100;
      const py = 415;

      ctx.beginPath();
      ctx.arc(px, py, 24, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.it.length > 0 ? `PLATE (${p.it.length})` : 'EMPTY', px, py + 3);
    });

    // 5. Left Service Counter & Delivery Hatch
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(10, 180, 100, 240);
    ctx.strokeRect(10, 180, 100, 240);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DELIVERY', 60, 280);
    ctx.fillText('HATCH', 60, 300);

    // 6. Right Trash Bin
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(690, 280, 80, 80);
    ctx.strokeRect(690, 280, 80, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🗑️ TRASH', 730, 325);

    // 7. Bottom Ingredient Dispensers (5 Crates)
    const ingredients = [
      { name: 'BUN', color: '#f59e0b', x: 120 },
      { name: 'PATTY', color: '#dc2626', x: 240 },
      { name: 'LETTUCE', color: '#16a34a', x: 360 },
      { name: 'TOMATO', color: '#ef4444', x: 480 },
      { name: 'CHEESE', color: '#eab308', x: 600 },
    ];

    ingredients.forEach((ing) => {
      ctx.fillStyle = ing.color;
      ctx.fillRect(ing.x, 520, 100, 60);
      ctx.strokeRect(ing.x, 520, 100, 60);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ing.name, ing.x + 50, 555);
    });

    // 8. Render Other Connected Remote Chefs
    if (state && state.p) {
      state.p.forEach((player) => {
        if (player.id !== myPlayerId) {
          ctx.beginPath();
          ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
          ctx.fillStyle = player.c;
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // Chef Hat
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(player.x - 12, player.y - 32, 24, 16);
          ctx.strokeRect(player.x - 12, player.y - 32, 24, 16);

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(player.n, player.x, player.y - 38);

          if (player.h) {
            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 9px monospace';
            ctx.fillText(`[${player.h.replace('raw_', '')}]`, player.x, player.y + 32);
          }
        }
      });
    }

    // 9. Render Local Player Chef
    const myPos = localPosRef.current;
    ctx.beginPath();
    ctx.arc(myPos.x, myPos.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#f43f5e';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Head Chef Hat
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(myPos.x - 14, myPos.y - 36, 28, 18);
    ctx.strokeRect(myPos.x - 14, myPos.y - 36, 28, 18);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${playerName} (YOU)`, myPos.x, myPos.y - 42);

    animFrameRef.current = requestAnimationFrame(renderKitchen);
  }, [playerName, myPlayerId]);

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
                    setNetworkMode('solo');
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
              {/* Asset Description Placeholder for Canva AI Generation */}
              {/* CANVA_AI_ASSET: Retro MS Paint comic certificate with gold stamped stars and greasy chef thumbprints */}
              <div className="bg-yellow-300 border-2 border-black p-1.5 rounded text-[10px] font-black uppercase tracking-wider">
                📋 DAILY RESTAURANT INSPECTION REPORT
              </div>

              <h3 className="text-3xl font-black text-black">SHIFT FINISHED!</h3>

              {/* Star Rating Display */}
              <div className="flex items-center justify-center gap-1.5 text-2xl text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.floor(starRating) ? 'text-amber-500' : 'text-zinc-400'}>
                    ★
                  </span>
                ))}
                <span className="text-sm font-black text-black ml-1.5">({starRating.toFixed(1)} / 5.0)</span>
              </div>

              {/* Humorous Customer Review Box */}
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

              {/* Thematic Rewarded Ad Buttons */}
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
            🍳 Interact / Cook
          </button>
          <button
            onClick={() => handleActionButton('toss')}
            className="bg-zinc-700 hover:bg-zinc-800 active:scale-95 text-white font-black py-3 px-4 rounded-xl border-2 border-black shadow text-xs uppercase"
          >
            🗑️ Toss
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
