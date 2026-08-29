'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Sparkles, Trophy, Zap, Sword } from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { RewardedAdModal } from '@/components/monetization/RewardedAdModal';
import { AuthModal } from '@/components/auth/AuthModal';
import confetti from 'canvas-confetti';

interface DungeonLootProps {
  gameId: string;
  gameTitle: string;
  onScoreSubmitted?: (score: number) => void;
}

class ChiptuneKnightAudio {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playJump() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  playSlash() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }

  playCoin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(987.77, this.ctx.currentTime);
      osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }

  playCrash() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {}
  }
}

interface DungeonObstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'spike' | 'blade' | 'skeleton' | 'bat';
  hp: number;
}

interface DungeonItem {
  x: number;
  y: number;
  type: 'coin' | 'gem' | 'magnet' | 'shield';
  collected: boolean;
}

export function DungeonLootDashEngine({ gameId, gameTitle, onScoreSubmitted }: DungeonLootProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('playing');
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [lives, setLives] = useState(3);
  const [hasShield, setHasShield] = useState(false);
  const [hasMagnet, setHasMagnet] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showRewardedAd, setShowRewardedAd] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasUsedRevive, setHasUsedRevive] = useState(false);
  const [isScoreSubmitted, setIsScoreSubmitted] = useState(false);

  // ---------------------------------------------------------------------------
  // Equipped 4-Slot Loadout (Paladin Gold Armor, Golden Sparkles, Apex Boots)
  // ---------------------------------------------------------------------------
  const _dldLoadout = platformStore.getLoadout(platformStore.getCurrentUser()?.id || 'user-001', 'dungeon-loot-dash');
  const _characterSprite = _dldLoadout?.visualSkin?.characterSprite || 'standard';
  const _coinCollectVFX = _dldLoadout?.actionJuice?.coinCollectVFX || null;
  const _jumpApexBoost = (_dldLoadout?.gameGear?.jumpApexBoost || 1.0);
  const _coinDropMultiplier = (_dldLoadout?.gameGear?.coinDropMultiplier || 1.0);

  const soundRef = useRef<ChiptuneKnightAudio>(new ChiptuneKnightAudio());
  const animFrameRef = useRef<number | null>(null);

  // Player Knight
  const knightRef = useRef({
    x: 120,
    y: 400,
    vy: 0,
    w: 36,
    h: 48,
    isGrounded: false,
    jumpCount: 0,
    isSliding: false,
    isSlashing: false,
    slashTimer: 0,
    legCycle: 0,
  });

  const obstaclesRef = useRef<DungeonObstacle[]>([]);
  const itemsRef = useRef<DungeonItem[]>([]);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[]>([]);
  const floatTextsRef = useRef<{ id: number; x: number; y: number; text: string; color: string; life: number; vy: number }[]>([]);
  const speedRef = useRef<number>(7.0);

  const addFloatText = (text: string, x: number, y: number, color = '#fbbf24') => {
    floatTextsRef.current.push({
      id: Date.now() + Math.random(),
      x,
      y,
      text,
      color,
      life: 40,
      vy: -1.6,
    });
  };

  const createSparks = (x: number, y: number, color: string, count = 15) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 6 + 1.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 25,
        color,
        size: Math.random() * 3 + 1,
      });
    }
  };

  const spawnDungeonHazard = useCallback(() => {
    const types: ('spike' | 'blade' | 'skeleton' | 'bat')[] = ['spike', 'blade', 'skeleton', 'bat'];
    const type = types[Math.floor(Math.random() * types.length)];
    const x = 860;

    if (type === 'spike') {
      obstaclesRef.current.push({ x, y: 440, w: 36, h: 40, type: 'spike', hp: 999 });
    } else if (type === 'blade') {
      obstaclesRef.current.push({ x, y: 375, w: 45, h: 40, type: 'blade', hp: 999 });
    } else if (type === 'skeleton') {
      obstaclesRef.current.push({ x, y: 430, w: 32, h: 50, type: 'skeleton', hp: 1 });
    } else {
      obstaclesRef.current.push({ x, y: 340, w: 30, h: 25, type: 'bat', hp: 1 });
    }

    // Spawn Coins & Powerups above
    if (Math.random() < 0.6) {
      for (let i = 0; i < 4; i++) {
        itemsRef.current.push({ x: x + 60 + i * 35, y: 340, type: 'coin', collected: false });
      }
    } else if (Math.random() < 0.25) {
      itemsRef.current.push({ x: x + 90, y: 330, type: Math.random() < 0.5 ? 'gem' : 'magnet', collected: false });
    }
  }, []);

  const jump = useCallback(() => {
    const k = knightRef.current;
    if (k.jumpCount < 2) {
      k.vy = -13;
      k.isGrounded = false;
      k.jumpCount += 1;
      k.isSliding = false;
      soundRef.current.playJump();
    }
  }, []);

  const slash = useCallback(() => {
    const k = knightRef.current;
    k.isSlashing = true;
    k.slashTimer = 12;
    soundRef.current.playSlash();

    // Check hit on monsters ahead
    obstaclesRef.current.forEach((obs) => {
      if ((obs.type === 'skeleton' || obs.type === 'bat') && obs.hp > 0) {
        if (Math.hypot(k.x + 30 - obs.x, k.y - obs.y) < 75) {
          obs.hp = 0;
          createSparks(obs.x, obs.y, '#f43f5e', 25);
          soundRef.current.playSlash();
          setScore((s) => s + 400);
          addFloatText('+400 MONSTER SLAIN!', obs.x, obs.y - 20, '#f43f5e');
        }
      }
    });
  }, []);

  const slide = useCallback((sliding: boolean) => {
    const k = knightRef.current;
    if (k.isGrounded) {
      k.isSliding = sliding;
      k.h = sliding ? 24 : 48;
    }
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const knight = knightRef.current;

    // 1. Gothic Dungeon Parallax Scene
    ctx.fillStyle = '#0a0614';
    ctx.fillRect(0, 0, width, height);

    // Dungeon Pillars
    ctx.fillStyle = '#181026';
    for (let x = 0; x < width; x += 120) {
      ctx.fillRect(x, 60, 40, 420);
    }

    // Floor
    ctx.fillStyle = '#2d1b4e';
    ctx.fillRect(0, 480, width, 120);
    ctx.fillStyle = '#4c2882';
    ctx.fillRect(0, 480, width, 16);

    // Physics
    const gravity = 0.7;
    knight.vy += gravity;
    knight.y += knight.vy;

    const groundY = 480 - knight.h;
    if (knight.y >= groundY) {
      knight.y = groundY;
      knight.vy = 0;
      knight.isGrounded = true;
      knight.jumpCount = 0;
    }

    knight.legCycle += 0.25;
    if (knight.slashTimer > 0) knight.slashTimer -= 1;
    else knight.isSlashing = false;

    // 2. Draw Knight Sprite
    ctx.save();
    ctx.translate(knight.x, knight.y);

    // Red Cape
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-10, 10);
    ctx.lineTo(-24 + Math.sin(knight.legCycle) * 6, 32);
    ctx.lineTo(-4, 30);
    ctx.closePath();
    ctx.fill();

    // Steel Armor Body
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-12, 0, 24, knight.h);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(-12, 0, 24, knight.h);

    // Golden Knight Helmet Visor
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(0, 6, 12, 6);

    // Sword & Slash Arc
    if (knight.isSlashing) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#38bdf8';
      ctx.beginPath();
      ctx.arc(16, 16, 36, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Move & Render Obstacles
    const speed = speedRef.current;
    speedRef.current += 0.0006;

    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      const obs = obstaclesRef.current[i];
      obs.x -= speed;

      if (obs.hp > 0) {
        ctx.save();
        if (obs.type === 'spike') {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(obs.x, 480);
          ctx.lineTo(obs.x + obs.w / 2, obs.y);
          ctx.lineTo(obs.x + obs.w, 480);
          ctx.closePath();
          ctx.fill();
        } else if (obs.type === 'blade') {
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.strokeStyle = '#991b1b';
          ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        } else if (obs.type === 'skeleton') {
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(obs.x + 4, obs.y + 8, 6, 6);
        } else if (obs.type === 'bat') {
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(obs.x + 15, obs.y + 12, 14, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Collision Check with Knight
        if (
          knight.x < obs.x + obs.w &&
          knight.x + knight.w > obs.x &&
          knight.y < obs.y + obs.h &&
          knight.y + knight.h > obs.y
        ) {
          if (hasShield) {
            setHasShield(false);
            createSparks(knight.x, knight.y, '#38bdf8', 30);
            addFloatText('SHIELD BROKEN!', knight.x, knight.y - 20, '#38bdf8');
            obstaclesRef.current.splice(i, 1);
          } else {
            soundRef.current.playCrash();
            createSparks(knight.x, knight.y, '#ef4444', 35);
            setLives((l) => {
              const nxt = l - 1;
              if (nxt <= 0) setGameState('gameover');
              return nxt;
            });
            obstaclesRef.current.splice(i, 1);
          }
        }
      }

      if (obs.x < -70) obstaclesRef.current.splice(i, 1);
    }

    // 4. Move & Collect Items
    for (let i = itemsRef.current.length - 1; i >= 0; i--) {
      const it = itemsRef.current[i];
      it.x -= speed;

      // Magnet effect
      if (hasMagnet && !it.collected) {
        const dx = knight.x - it.x;
        const dy = knight.y - it.y;
        it.x += dx * 0.12;
        it.y += dy * 0.12;
      }

      if (!it.collected) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.type === 'gem' ? 14 : 9, 0, Math.PI * 2);
        ctx.fillStyle = it.type === 'gem' ? '#38bdf8' : it.type === 'magnet' ? '#ec4899' : '#fbbf24';
        ctx.shadowBlur = 12;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();
        ctx.restore();

        if (Math.hypot(knight.x + 16 - it.x, knight.y + 20 - it.y) < 32) {
          it.collected = true;
          soundRef.current.playCoin();

          if (it.type === 'gem') {
            setScore((s) => s + Math.floor(500 * _coinDropMultiplier));
            addFloatText('+500 DIAMOND GEM', it.x, it.y - 15, '#38bdf8');
          } else if (it.type === 'magnet') {
            setHasMagnet(true);
            addFloatText('GOLD MAGNET ACTIVATED', it.x, it.y - 15, '#ec4899');
          } else {
            setScore((s) => s + Math.floor(60 * _coinDropMultiplier));
            addFloatText('+60 Gold', it.x, it.y - 10, '#fbbf24');
          }
        }
      }

      if (it.x < -40) itemsRef.current.splice(i, 1);
    }

    // Spawning logic
    if (obstaclesRef.current.length === 0 || obstaclesRef.current[obstaclesRef.current.length - 1].x < 560) {
      if (Math.random() < 0.06) spawnDungeonHazard();
    }

    setDistance((d) => d + 1);

    // Floating texts
    for (let i = floatTextsRef.current.length - 1; i >= 0; i--) {
      const ft = floatTextsRef.current[i];
      ft.y += ft.vy;
      ft.life -= 1;

      ctx.save();
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = ft.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();

      if (ft.life <= 0) floatTextsRef.current.splice(i, 1);
    }

    if (gameState === 'playing') {
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, hasShield, hasMagnet, spawnDungeonHazard]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const gameKeys = ['Space', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyX', 'KeyC', 'KeyZ'];
      if (gameKeys.includes(e.code) || gameKeys.includes(e.key)) {
        e.preventDefault();
      }

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        jump();
      }
      if (e.code === 'KeyX' || e.code === 'KeyC' || e.code === 'KeyZ') {
        slash();
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        slide(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        slide(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [jump, slash, slide]);

  useEffect(() => {
    if (gameState === 'playing') {
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, gameLoop]);

  const startGame = () => {
    setScore(0);
    setDistance(0);
    setLives(3);
    setHasShield(true);
    setHasMagnet(false);
    speedRef.current = 7.0;
    knightRef.current.y = 400;
    knightRef.current.vy = 0;
    knightRef.current.isSliding = false;
    knightRef.current.h = 48;
    obstaclesRef.current = [];
    itemsRef.current = [];
    floatTextsRef.current = [];
    setIsScoreSubmitted(false);
    setHasUsedRevive(false);
    setGameState('playing');
  };

  // Auto-start on mount
  useEffect(() => {
    startGame();
  }, []);

  // Automated Score Submission on Game Over
  useEffect(() => {
    if (gameState === 'gameover') {
      try {
        localStorage.setItem(`ultimatum_highscore_${gameId}`, score.toString());
      } catch {}
      platformStore.submitScore(gameId, score);
      setIsScoreSubmitted(true);
      if (onScoreSubmitted) onScoreSubmitted(score);
    }
  }, [gameState, score, gameId, onScoreSubmitted]);

  const handleRewardedRevive = () => {
    knightRef.current.y = 360;
    knightRef.current.vy = -10;
    obstaclesRef.current = [];
    setLives(1);
    setHasShield(true);
    setScore((s) => s + 500);
    setHasUsedRevive(true);
    setGameState('playing');
  };

  const handleSubmitScore = () => {
    if (isScoreSubmitted) return;
    if (!platformStore.isLoggedIn()) {
      platformStore.setPendingScore(gameId, score);
      setShowAuthModal(true);
      return;
    }
    platformStore.submitScore(gameId, score);
    setIsScoreSubmitted(true);
    confetti({ particleCount: 100, spread: 80 });
    if (onScoreSubmitted) onScoreSubmitted(score);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-purple-500/40 bg-zinc-950 p-4 shadow-2xl space-y-3">
      {/* Top HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-zinc-900/90 p-3 border border-zinc-800">
        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400">Gold & Gems</span>
          <div className="text-xl font-black font-mono text-amber-400">{score.toLocaleString()}</div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400">Distance Travelled</span>
          <div className="text-lg font-black font-mono text-purple-300">{Math.floor(distance / 10)}m</div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400">Aegis Shield</span>
          <div className="text-xs font-bold font-mono mt-1 text-zinc-300">
            {hasShield ? <span className="text-emerald-400">ACTIVE 🛡️</span> : <span className="text-zinc-500">BROKEN</span>}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <span
                key={i}
                className={`h-4 w-4 rounded transition-all ${
                  i < lives ? 'bg-purple-500 shadow-sm shadow-purple-500/50' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              soundRef.current.enabled = !soundEnabled;
            }}
            className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative aspect-[4/3] w-full max-h-[580px] overflow-hidden rounded-xl border border-zinc-800 bg-black select-none" style={{ touchAction: 'none' }}>
        <canvas ref={canvasRef} width={800} height={600} className="h-full w-full object-contain touch-none" style={{ touchAction: 'none' }} />

        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-sm">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-mono font-semibold text-purple-400 border border-purple-500/30">
              <Zap className="w-3.5 h-3.5" />
              <span>8-BIT RETRO DUNGEON PLATFORM RUNNER & COMBAT</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">{gameTitle}</h3>
            <p className="mt-2 max-w-md text-xs text-zinc-400 leading-relaxed">
              Press <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-white">SPACE / UP</kbd> to Jump (Double Jump supported!), <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-white">DOWN</kbd> to Slide, and <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-white">X / CLICK</kbd> to Sword Slash charging skeletons and bats!
            </p>
            <button
              onClick={startGame}
              className="mt-6 flex items-center gap-2 rounded-xl bg-purple-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-purple-600/30 hover:bg-purple-500 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Enter Dungeon</span>
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center backdrop-blur-md space-y-4">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-rose-500">TRAPPED IN DUNGEON</div>
            <h3 className="text-4xl font-black text-white">QUEST COMPLETED</h3>
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 w-full max-w-sm">
              <div className="text-xs text-zinc-400 font-mono">FINAL LOOT SCORE</div>
              <div className="text-3xl font-black font-mono text-amber-400">{score.toLocaleString()}</div>
              <div className="text-xs text-emerald-400 font-bold mt-1">+{Math.floor(score / 100)} XP Earned</div>
            </div>

            <div className="flex flex-col gap-2.5 w-full max-w-sm">
              <button
                onClick={handleSubmitScore}
                disabled={isScoreSubmitted}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold ${
                  isScoreSubmitted
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/50'
                    : 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-lg'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>{isScoreSubmitted ? 'Score Submitted!' : 'Submit to Leaderboard'}</span>
              </button>

              {!hasUsedRevive && (
                <button
                  onClick={() => setShowRewardedAd(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 text-xs font-bold text-white shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Watch Short Ad to Revive (+1 Shield & Life)</span>
                </button>
              )}

              <button
                onClick={startGame}
                className="flex items-center justify-center gap-2 rounded-xl bg-zinc-800 py-3 text-xs font-semibold text-white hover:bg-zinc-700"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action bar for mobile & desktop controls (>=48px touch targets) */}
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-zinc-900/60 p-2 border border-zinc-800 select-none">
        <button
          type="button"
          onPointerDown={jump}
          className="min-h-[48px] flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 px-3 py-2 text-xs font-bold text-white active:scale-95 transition-all shadow-md cursor-pointer select-none"
        >
          <span>⬆ JUMP</span>
        </button>
        <button
          type="button"
          onPointerDown={() => slide(true)}
          onPointerUp={() => slide(false)}
          onPointerCancel={() => slide(false)}
          className="min-h-[48px] flex items-center justify-center gap-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 active:scale-95 transition-all shadow-md cursor-pointer select-none"
        >
          <span>⬇ SLIDE</span>
        </button>
        <button
          type="button"
          onPointerDown={slash}
          className="min-h-[48px] flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-3 py-2 text-xs font-bold text-white active:scale-95 transition-all shadow-md cursor-pointer select-none"
        >
          <Sword className="w-4 h-4" />
          <span>[X] SLASH</span>
        </button>
      </div>

      <RewardedAdModal
        isOpen={showRewardedAd}
        onClose={() => setShowRewardedAd(false)}
        onRewardEarned={handleRewardedRevive}
        rewardDescription="Revive knight with Aegis shield and 500 bonus gold!"
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Save Your Knight Leaderboard Score"
        onSuccess={() => {
          setIsScoreSubmitted(true);
          confetti({ particleCount: 80, spread: 60 });
          if (onScoreSubmitted) onScoreSubmitted(score);
        }}
      />
    </div>
  );
}
