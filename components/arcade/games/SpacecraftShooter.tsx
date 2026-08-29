'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { platformStore } from '@/lib/data/store';
import { useResponsiveCanvas } from '@/hooks/useResponsiveCanvas';

interface SpacecraftShooterProps {
  gameId: string;
  gameTitle: string;
  onGameOver: (score: number, metadata?: Record<string, any>) => void;
  onBanterEvent: (event: any) => void;
  onScoreSubmitted?: (score: number) => void;
}

// ---------------------------------------------------------------------------
// Zero-GC Object Pool (STRICT PRESERVATION — no push/splice/new in loop)
// ---------------------------------------------------------------------------
class FastPool<T extends { active: boolean }> {
  public pool: T[];
  public size: number;
  private resetItem: (item: T) => void;

  constructor(size: number, createItem: () => T, resetItem: (item: T) => void) {
    this.size = size;
    this.resetItem = resetItem;
    this.pool = Array.from({ length: size }, () => createItem());
  }

  get(): T | null {
    for (let i = 0; i < this.size; i++) {
      if (!this.pool[i].active) {
        this.pool[i].active = true;
        return this.pool[i];
      }
    }
    return null;
  }

  release(item: T) {
    item.active = false;
    this.resetItem(item);
  }

  resetAll() {
    for (let i = 0; i < this.size; i++) {
      this.pool[i].active = false;
      this.resetItem(this.pool[i]);
    }
  }

  forEachActive(callback: (item: T, index: number) => void) {
    for (let i = 0; i < this.size; i++) {
      if (this.pool[i].active) callback(this.pool[i], i);
    }
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Missile { active: boolean; x: number; y: number; vx: number; vy: number; angle: number; }
interface Enemy { active: boolean; x: number; y: number; speed: number; size: number; hp: number; color: string; }
interface Star { x: number; y: number; speed: number; size: number; }
interface PowerUp { active: boolean; x: number; y: number; type: 'Shield' | 'Rapid Fire' | 'Triple Shot' | 'Nuke'; }

const POWER_UP_TYPES = ['Shield', 'Rapid Fire', 'Triple Shot', 'Nuke'] as const;
type PowerUpType = typeof POWER_UP_TYPES[number];

const VIRTUAL_WIDTH = 480;
const VIRTUAL_HEIGHT = 640;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SpacecraftShooter({ gameId, gameTitle, onGameOver, onBanterEvent }: SpacecraftShooterProps) {
  const {
    canvasRef,
    containerRef,
    dpr,
    setupCanvasContext,
    isTouchDevice,
  } = useResponsiveCanvas(VIRTUAL_WIDTH, VIRTUAL_HEIGHT, { fit: 'contain' });

  const rafRef = useRef<number>(0);

  // Hot-loop mutable refs
  const shipRef = useRef({ x: 240, y: 540, angle: 0, speed: 4, shield: false, rapidFire: false, tripleShot: false, lives: 3 });
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const enemiesRef = useRef<Enemy[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const starsRef = useRef<Star[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const lastFireRef = useRef(0);
  const enemyTimerRef = useRef(0);
  const powerUpTimerRef = useRef(0);
  const shieldTimerRef = useRef(0);
  const rapidFireTimerRef = useRef(0);
  const tripleShotTimerRef = useRef(0);
  const lastTimeRef = useRef(0);

  // FastPool for nose-directional missiles
  const missilePoolRef = useRef<FastPool<Missile>>(
    new FastPool<Missile>(
      64,
      () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, angle: 0 }),
      (m) => { m.x = 0; m.y = 0; m.vx = 0; m.vy = 0; m.angle = 0; }
    )
  );

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'dead'>('playing');
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLevel, setDisplayLevel] = useState(1);
  const [displayLives, setDisplayLives] = useState(3);
  const [displayPowerUps, setDisplayPowerUps] = useState<string[]>([]);
  const displaySyncTimer = useRef(0);

  const user = platformStore.getCurrentUser();
  const username = user?.username || 'Pilot';

  // ---------------------------------------------------------------------------
  // Init Stars
  // ---------------------------------------------------------------------------
  const initStars = useCallback(() => {
    starsRef.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * VIRTUAL_WIDTH,
      y: Math.random() * VIRTUAL_HEIGHT,
      speed: 0.5 + Math.random() * 1.5,
      size: 0.5 + Math.random() * 1.5,
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Fire Missiles — Nose-Directional
  // ---------------------------------------------------------------------------
  const fireMissile = useCallback(() => {
    const ship = shipRef.current;
    const pool = missilePoolRef.current;
    const now = performance.now();
    const cooldown = ship.rapidFire ? 100 : 250;
    if (now - lastFireRef.current < cooldown) return;
    lastFireRef.current = now;

    const noseAngle = ship.angle - Math.PI / 2;
    const speed = 10;

    const m = pool.get();
    if (m) {
      m.x = ship.x + Math.cos(noseAngle) * 16;
      m.y = ship.y + Math.sin(noseAngle) * 16;
      m.vx = Math.cos(noseAngle) * speed;
      m.vy = Math.sin(noseAngle) * speed;
      m.angle = ship.angle;
    }

    if (ship.tripleShot) {
      const angles = [noseAngle - 0.25, noseAngle + 0.25];
      angles.forEach((a) => {
        const extra = pool.get();
        if (extra) {
          extra.x = ship.x;
          extra.y = ship.y;
          extra.vx = Math.cos(a) * speed;
          extra.vy = Math.sin(a) * speed;
          extra.angle = a + Math.PI / 2;
        }
      });
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Power-Up Spawning
  // ---------------------------------------------------------------------------
  const spawnPowerUp = useCallback(() => {
    const type = POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
    powerUpsRef.current.push({
      active: true,
      x: 30 + Math.random() * (VIRTUAL_WIDTH - 60),
      y: -20,
      type,
    });
    onBanterEvent?.({
      category: 'POWER_UP_SPAWN',
      actorName: 'Supply Drop',
      message: `${type} crate deployed into sector!`,
      highlight: true,
    });
  }, [onBanterEvent]);

  // ---------------------------------------------------------------------------
  // Collect Power-Up
  // ---------------------------------------------------------------------------
  const collectPowerUp = useCallback((pu: PowerUp) => {
    pu.active = false;
    const ship = shipRef.current;
    const now = performance.now();

    if (pu.type === 'Shield') {
      ship.shield = true;
      shieldTimerRef.current = now + 8000;
    } else if (pu.type === 'Rapid Fire') {
      ship.rapidFire = true;
      rapidFireTimerRef.current = now + 10000;
    } else if (pu.type === 'Triple Shot') {
      ship.tripleShot = true;
      tripleShotTimerRef.current = now + 10000;
    } else if (pu.type === 'Nuke') {
      let kills = 0;
      enemiesRef.current.forEach((e) => {
        if (e.active) { e.active = false; kills++; }
      });
      scoreRef.current += kills * 50;
      onBanterEvent?.({
        category: 'KILL_STREAK',
        actorName: username,
        message: `detonated NUKE clearing ${kills} hostile drones!`,
        highlight: true,
      });
    }
  }, [onBanterEvent, username]);

  // ---------------------------------------------------------------------------
  // Check Dynamic Level Progression
  // ---------------------------------------------------------------------------
  const checkLevelUp = useCallback((newScore: number) => {
    const nextLevel = Math.floor(newScore / 500) + 1;
    if (nextLevel > levelRef.current) {
      const prev = levelRef.current;
      levelRef.current = nextLevel;
      onBanterEvent?.({
        category: 'GAME_EVENT',
        actorName: username,
        message: `advanced to LEVEL ${nextLevel}! Enemy speed +15%`,
        highlight: true,
      });
      if (nextLevel === 10 && prev < 10) {
        onBanterEvent?.({
          category: 'GAME_EVENT',
          actorName: 'Core AI',
          message: `OVERDRIVE UNLOCKED: Viewport dynamically expanded for Level 10+ deep space combat!`,
          highlight: true,
        });
      }
    }
  }, [onBanterEvent, username]);

  // ---------------------------------------------------------------------------
  // Game Loop
  // ---------------------------------------------------------------------------
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = Math.min(timestamp - lastTimeRef.current, 100);
    lastTimeRef.current = timestamp;

    const ship = shipRef.current;
    const keys = keysRef.current;
    const level = levelRef.current;

    // Reset transform & scale to DPR
    setupCanvasContext(ctx);

    // Clear frame
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Power-up expiration checks
    if (ship.shield && timestamp > shieldTimerRef.current) ship.shield = false;
    if (ship.rapidFire && timestamp > rapidFireTimerRef.current) ship.rapidFire = false;
    if (ship.tripleShot && timestamp > tripleShotTimerRef.current) ship.tripleShot = false;

    // Controls
    if (keys.has('ArrowLeft') || keys.has('KeyA')) {
      ship.x -= ship.speed * (dt / 16);
      ship.angle = Math.max(-0.4, ship.angle - 0.05);
    } else if (keys.has('ArrowRight') || keys.has('KeyD')) {
      ship.x += ship.speed * (dt / 16);
      ship.angle = Math.min(0.4, ship.angle + 0.05);
    } else {
      ship.angle *= 0.85;
    }

    if (keys.has('ArrowUp') || keys.has('KeyW')) {
      ship.y -= ship.speed * (dt / 16);
    }
    if (keys.has('ArrowDown') || keys.has('KeyS')) {
      ship.y += ship.speed * (dt / 16);
    }
    if (keys.has('Space') || keys.has(' ')) {
      fireMissile();
    }

    // Clamp ship position
    ship.x = Math.max(20, Math.min(VIRTUAL_WIDTH - 20, ship.x));
    ship.y = Math.max(40, Math.min(VIRTUAL_HEIGHT - 30, ship.y));

    // Stars Parallax
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    starsRef.current.forEach((star) => {
      star.y += star.speed * (dt / 16);
      if (star.y > VIRTUAL_HEIGHT) { star.y = 0; star.x = Math.random() * VIRTUAL_WIDTH; }
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Enemy Spawning
    enemyTimerRef.current += dt;
    const spawnInterval = Math.max(400, 1200 - level * 80);
    if (enemyTimerRef.current > spawnInterval) {
      enemyTimerRef.current = 0;
      const speed = 1.5 + level * 0.2 + Math.random() * 1.5;
      const colors = ['#f43f5e', '#a855f7', '#eab308', '#06b6d4'];
      enemiesRef.current.push({
        active: true,
        x: 30 + Math.random() * (VIRTUAL_WIDTH - 60),
        y: -30,
        speed,
        size: 14 + Math.random() * 8,
        hp: level >= 5 ? 2 : 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Power-Up Timer (every 15s)
    powerUpTimerRef.current += dt;
    if (powerUpTimerRef.current > 15000) {
      powerUpTimerRef.current = 0;
      spawnPowerUp();
    }

    // Update & Draw Missiles
    ctx.fillStyle = ship.rapidFire ? '#f59e0b' : '#38bdf8';
    missilePoolRef.current.forEachActive((m) => {
      m.x += m.vx * (dt / 16);
      m.y += m.vy * (dt / 16);
      if (m.y < -20 || m.x < -20 || m.x > VIRTUAL_WIDTH + 20 || m.y > VIRTUAL_HEIGHT + 20) {
        missilePoolRef.current.release(m);
        return;
      }
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle);
      ctx.fillRect(-2, -6, 4, 12);
      ctx.restore();
    });

    // Draw Ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    if (ship.shield) {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Thruster trail
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(-5, 14);
    ctx.lineTo(0, 20 + Math.random() * 6);
    ctx.lineTo(5, 14);
    ctx.fill();

    // Body
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(14, 14);
    ctx.lineTo(0, 8);
    ctx.lineTo(-14, 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(6, 6);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Update & Collide Enemies
    enemiesRef.current.forEach((enemy) => {
      if (!enemy.active) return;
      enemy.y += enemy.speed * (dt / 16);

      if (enemy.y > VIRTUAL_HEIGHT + 30) {
        enemy.active = false;
        return;
      }

      // Missile vs Enemy
      missilePoolRef.current.forEachActive((m) => {
        if (!enemy.active) return;
        const dx = m.x - enemy.x;
        const dy = m.y - enemy.y;
        if (Math.sqrt(dx * dx + dy * dy) < enemy.size + 4) {
          missilePoolRef.current.release(m);
          enemy.hp--;
          if (enemy.hp <= 0) {
            enemy.active = false;
            scoreRef.current += 100;
            checkLevelUp(scoreRef.current);
          }
        }
      });

      // Ship vs Enemy collision
      if (enemy.active) {
        const dx = ship.x - enemy.x;
        const dy = ship.y - enemy.y;
        if (Math.sqrt(dx * dx + dy * dy) < enemy.size + 14) {
          enemy.active = false;
          if (ship.shield) {
            ship.shield = false;
          } else {
            ship.lives--;
            if (ship.lives <= 0) {
              setGameState('dead');
              onGameOver(scoreRef.current, { level: levelRef.current });
              return;
            }
          }
        }
      }

      // Draw enemy
      if (enemy.active) {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const angle = (a / 6) * Math.PI * 2;
          const r = a % 2 === 0 ? enemy.size : enemy.size * 0.6;
          a === 0
            ? ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle))
            : ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    });

    // Purge inactive enemies
    if (enemiesRef.current.length > 150) {
      enemiesRef.current = enemiesRef.current.filter((e) => e.active);
    }

    // Power-Ups
    powerUpsRef.current.forEach((pu) => {
      if (!pu.active) return;
      pu.y += 1.5 * (dt / 16);
      if (pu.y > VIRTUAL_HEIGHT + 30) { pu.active = false; return; }

      const dx = ship.x - pu.x;
      const dy = ship.y - pu.y;
      if (Math.sqrt(dx * dx + dy * dy) < 24) { collectPowerUp(pu); return; }

      ctx.save();
      ctx.translate(pu.x, pu.y);
      const colors: Record<PowerUpType, string> = {
        'Shield': '#06b6d4', 'Rapid Fire': '#f59e0b', 'Triple Shot': '#10b981', 'Nuke': '#ef4444',
      };
      ctx.fillStyle = colors[pu.type];
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pu.type[0], 0, 0);
      ctx.restore();
    });

    if (powerUpsRef.current.length > 40) {
      powerUpsRef.current = powerUpsRef.current.filter((p) => p.active);
    }

    // HUD
    ctx.fillStyle = 'rgba(9,9,11,0.6)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, 36);
    ctx.font = 'bold 13px monospace';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#22d3ee';
    ctx.textAlign = 'left';
    ctx.fillText(`${scoreRef.current} PTS`, 10, 18);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`LVL ${level}`, VIRTUAL_WIDTH / 2, 18);

    ctx.fillStyle = '#f87171';
    ctx.textAlign = 'right';
    ctx.fillText(`${'❤ '.repeat(Math.max(0, ship.lives)).trim()}`, VIRTUAL_WIDTH - 10, 18);

    // Active power-up indicators
    const activePUs: string[] = [];
    if (ship.shield) activePUs.push('🛡 Shield');
    if (ship.rapidFire) activePUs.push('⚡ Rapid Fire');
    if (ship.tripleShot) activePUs.push('✦ Triple Shot');
    if (activePUs.length > 0) {
      ctx.fillStyle = 'rgba(9,9,11,0.75)';
      ctx.fillRect(0, VIRTUAL_HEIGHT - 26, VIRTUAL_WIDTH, 26);
      ctx.fillStyle = '#a78bfa';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(activePUs.join('  '), VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT - 13);
    }

    // Display sync
    displaySyncTimer.current += dt;
    if (displaySyncTimer.current > 800) {
      displaySyncTimer.current = 0;
      setDisplayScore(scoreRef.current);
      setDisplayLevel(level);
      setDisplayLives(ship.lives);
      setDisplayPowerUps(activePUs);
    }

    if (gameState === 'playing') {
      rafRef.current = requestAnimationFrame(gameLoop);
    }
  }, [fireMissile, spawnPowerUp, collectPowerUp, checkLevelUp, onGameOver, onBanterEvent, gameState, setupCanvasContext, username]);

  // -------------------------------------------------------------------------
  // Start / Reset Game
  // -------------------------------------------------------------------------
  const startGame = useCallback(() => {
    shipRef.current = { x: VIRTUAL_WIDTH / 2, y: VIRTUAL_HEIGHT - 80, angle: 0, speed: 4, shield: false, rapidFire: false, tripleShot: false, lives: 3 };
    scoreRef.current = 0;
    levelRef.current = 1;
    enemiesRef.current = [];
    powerUpsRef.current = [];
    missilePoolRef.current.resetAll();
    powerUpTimerRef.current = 0;
    enemyTimerRef.current = 0;
    lastTimeRef.current = performance.now();
    initStars();
    setDisplayScore(0);
    setDisplayLevel(1);
    setDisplayLives(3);
    setGameState('playing');
  }, [initStars]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  // RAF lifecycle
  useEffect(() => {
    if (gameState === 'playing') {
      rafRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [gameState, gameLoop]);

  // Key listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const gameKeys = ['Space', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
      if (gameKeys.includes(e.code) || gameKeys.includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current.add(e.key);
      keysRef.current.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
      keysRef.current.delete(e.code);
    };
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Mobile virtual button controls
  const handleMoveLeftStart = () => { keysRef.current.add('ArrowLeft'); };
  const handleMoveLeftEnd = () => { keysRef.current.delete('ArrowLeft'); };
  const handleMoveRightStart = () => { keysRef.current.add('ArrowRight'); };
  const handleMoveRightEnd = () => { keysRef.current.delete('ArrowRight'); };
  const handleFireStart = () => { fireMissile(); keysRef.current.add('Space'); };
  const handleFireEnd = () => { keysRef.current.delete('Space'); };

  return (
    <div className="flex flex-col items-center gap-3 bg-zinc-950 px-2 py-3 select-none touch-none">
      <div ref={containerRef} className="relative w-full max-w-[480px] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="rounded-xl border border-zinc-800 shadow-2xl shadow-indigo-900/20"
        />
      </div>

      {/* Mobile Touch Control Bar (>=44px touch targets) */}
      {isTouchDevice && (
        <div className="flex items-center justify-between gap-3 w-full max-w-[480px] px-2 pt-1">
          <div className="flex gap-2">
            <button
              type="button"
              onPointerDown={handleMoveLeftStart}
              onPointerUp={handleMoveLeftEnd}
              onPointerCancel={handleMoveLeftEnd}
              className="min-h-[48px] min-w-[56px] rounded-xl border border-zinc-700 bg-zinc-900/90 text-sm font-black text-cyan-400 active:bg-cyan-950 active:scale-95 shadow-md flex items-center justify-center cursor-pointer select-none"
            >
              ◀ LEFT
            </button>
            <button
              type="button"
              onPointerDown={handleMoveRightStart}
              onPointerUp={handleMoveRightEnd}
              onPointerCancel={handleMoveRightEnd}
              className="min-h-[48px] min-w-[56px] rounded-xl border border-zinc-700 bg-zinc-900/90 text-sm font-black text-cyan-400 active:bg-cyan-950 active:scale-95 shadow-md flex items-center justify-center cursor-pointer select-none"
            >
              RIGHT ▶
            </button>
          </div>

          <button
            type="button"
            onPointerDown={handleFireStart}
            onPointerUp={handleFireEnd}
            onPointerCancel={handleFireEnd}
            className="min-h-[48px] flex-1 max-w-[180px] rounded-xl border border-rose-500/50 bg-gradient-to-r from-rose-600 to-pink-600 text-sm font-black text-white active:scale-95 shadow-lg shadow-rose-900/40 flex items-center justify-center cursor-pointer select-none"
          >
            🔥 FIRE LASERS
          </button>
        </div>
      )}

      {/* Controls Hint */}
      <p className="text-[10px] font-mono text-zinc-500">
        WASD / Arrows = Steer · Space = Fire · Auto-scales to device viewport
      </p>
    </div>
  );
}
