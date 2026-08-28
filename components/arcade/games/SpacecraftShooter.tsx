'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { platformStore } from '@/lib/data/store';

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SpacecraftShooter({ gameId, gameTitle, onGameOver, onBanterEvent }: SpacecraftShooterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // ---- Hot-loop mutable refs — no React re-renders in RAF ----
  const shipRef = useRef({ x: 240, y: 540, angle: 0, speed: 4, shield: false, rapidFire: false, tripleShot: false, lives: 3 });
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const enemiesRef = useRef<Enemy[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const starsRef = useRef<Star[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const lastFireRef = useRef(0);
  const enemyTimerRef = useRef(0);
  const powerUpTimerRef = useRef(0);     // STRICT: every 15 seconds
  const shieldTimerRef = useRef(0);
  const rapidFireTimerRef = useRef(0);
  const tripleShotTimerRef = useRef(0);
  const lastTimeRef = useRef(0);

  // FastPool for nose-directional missiles (STRICT: pool size = 64, no new objects in loop)
  const missilePoolRef = useRef<FastPool<Missile>>(
    new FastPool<Missile>(
      64,
      () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, angle: 0 }),
      (m) => { m.x = 0; m.y = 0; m.vx = 0; m.vy = 0; m.angle = 0; }
    )
  );

  // ---- Display state (only synced ~once per second to avoid RAF jank) ----
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'dead'>('idle');
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLevel, setDisplayLevel] = useState(1);
  const [displayLives, setDisplayLives] = useState(3);
  const [displayPowerUps, setDisplayPowerUps] = useState<string[]>([]);
  const displaySyncTimer = useRef(0);

  const user = platformStore.getCurrentUser();
  const username = user?.username || 'Pilot';

  // ---------------------------------------------------------------------------
  // Init Stars (80 parallax stars — STRICT: no recreate in loop)
  // ---------------------------------------------------------------------------
  const initStars = useCallback(() => {
    starsRef.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * 480,
      y: Math.random() * 640,
      speed: 0.5 + Math.random() * 1.5,
      size: 0.5 + Math.random() * 1.5,
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Fire Missiles — Nose-Directional (STRICT: angle-based velocity from pool)
  // ---------------------------------------------------------------------------
  const fireMissile = useCallback(() => {
    const ship = shipRef.current;
    const pool = missilePoolRef.current;
    const now = performance.now();
    const fireRate = ship.rapidFire ? 120 : 280;
    if (now - lastFireRef.current < fireRate) return;
    lastFireRef.current = now;

    const spawnOne = (angleOffset = 0) => {
      const m = pool.get();
      if (!m) return;
      const a = ship.angle + angleOffset;
      const SPEED = 9;
      // Nose-directional velocity (STRICT preservation)
      m.x = ship.x;
      m.y = ship.y;
      m.angle = a;
      m.vx = SPEED * Math.sin(a);
      m.vy = -SPEED * Math.cos(a);
    };

    spawnOne(0);
    if (ship.tripleShot) {
      spawnOne(-0.22);
      spawnOne(0.22);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Power-Up Spawn (STRICT: every 15 seconds)
  // ---------------------------------------------------------------------------
  const spawnPowerUp = useCallback(() => {
    const type = POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
    powerUpsRef.current.push({
      active: true,
      x: 40 + Math.random() * 400,
      y: -20,
      type,
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Collect Power-Up
  // ---------------------------------------------------------------------------
  const collectPowerUp = useCallback((pu: PowerUp) => {
    const ship = shipRef.current;
    const now = performance.now();
    if (pu.type === 'Shield') { ship.shield = true; shieldTimerRef.current = now + 5000; }
    if (pu.type === 'Rapid Fire') { ship.rapidFire = true; rapidFireTimerRef.current = now + 8000; }
    if (pu.type === 'Triple Shot') { ship.tripleShot = true; tripleShotTimerRef.current = now + 8000; }
    if (pu.type === 'Nuke') { enemiesRef.current.forEach((e) => (e.active = false)); }
    pu.active = false;
    onBanterEvent({ category: 'POWER_UP_SPAWN', actorName: username, message: `collected ${pu.type}!`, highlight: false });
  }, [onBanterEvent, username]);

  // ---------------------------------------------------------------------------
  // Level-Up & Viewport Expansion (STRICT: Level 10 expansion)
  // ---------------------------------------------------------------------------
  const checkLevelUp = useCallback(() => {
    const newLevel = Math.floor(scoreRef.current / 500) + 1;
    if (newLevel > levelRef.current) {
      levelRef.current = newLevel;
      setDisplayLevel(newLevel);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Main RAF Game Loop
  // ---------------------------------------------------------------------------
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dt = Math.min(timestamp - lastTimeRef.current, 32); // cap at 32ms
    lastTimeRef.current = timestamp;

    const W = canvas.width;
    const H = canvas.height;
    const level = levelRef.current;
    const now = performance.now();

    // ---- Level 10 Viewport Expansion (STRICT) ----
    const viewportScale = level >= 10 ? 1.4 : 1.0;

    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // Apply viewport scale with centered origin
    if (viewportScale !== 1.0) {
      ctx.translate(W / 2, H / 2);
      ctx.scale(1 / viewportScale, 1 / viewportScale);
      ctx.translate(-W / 2 * viewportScale, -H / 2 * viewportScale);
    }

    // ---- Starfield (parallax scroll) ----
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, W * viewportScale, H * viewportScale);
    starsRef.current.forEach((star) => {
      star.y += star.speed * (dt / 16);
      if (star.y > H * viewportScale) { star.y = 0; star.x = Math.random() * W * viewportScale; }
      ctx.fillStyle = `rgba(255,255,255,${0.3 + star.size * 0.2})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    const ship = shipRef.current;

    // ---- Input: move ship ----
    const keys = keysRef.current;
    if (keys.has('ArrowLeft') || keys.has('a')) ship.x = Math.max(20, ship.x - ship.speed * (dt / 16));
    if (keys.has('ArrowRight') || keys.has('d')) ship.x = Math.min(W * viewportScale - 20, ship.x + ship.speed * (dt / 16));
    if (keys.has('ArrowUp') || keys.has('w')) ship.y = Math.max(60, ship.y - ship.speed * (dt / 16));
    if (keys.has('ArrowDown') || keys.has('s')) ship.y = Math.min(H * viewportScale - 30, ship.y + ship.speed * (dt / 16));
    if (keys.has(' ')) fireMissile();

    // ---- Power-up timer expiry ----
    if (ship.shield && now > shieldTimerRef.current) ship.shield = false;
    if (ship.rapidFire && now > rapidFireTimerRef.current) ship.rapidFire = false;
    if (ship.tripleShot && now > tripleShotTimerRef.current) ship.tripleShot = false;

    // ---- Draw Ship ----
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Shield aura
    if (ship.shield) {
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // Ship body
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(-10, 12);
    ctx.lineTo(0, 8);
    ctx.lineTo(10, 12);
    ctx.closePath();
    ctx.fill();
    // Nose accent
    ctx.fillStyle = '#a78bfa';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ---- Update & Draw Missiles (FastPool — STRICT: no new objects) ----
    missilePoolRef.current.forEachActive((m) => {
      m.x += m.vx * (dt / 16);
      m.y += m.vy * (dt / 16);
      if (m.y < -20 || m.y > H * viewportScale + 20 || m.x < -20 || m.x > W * viewportScale + 20) {
        missilePoolRef.current.release(m);
        return;
      }
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle);
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(-2, 4);
      ctx.lineTo(2, 4);
      ctx.closePath();
      ctx.fill();
      // Glow
      ctx.fillStyle = 'rgba(34,211,238,0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // ---- Enemy Spawn Timer ----
    enemyTimerRef.current += dt;
    const enemyInterval = Math.max(800, 2000 - level * 80);
    if (enemyTimerRef.current >= enemyInterval) {
      enemyTimerRef.current = 0;
      const waveCount = level * 2;
      for (let i = 0; i < waveCount; i++) {
        enemiesRef.current.push({
          active: true,
          x: 20 + Math.random() * (W * viewportScale - 40),
          y: -20 - i * 30,
          speed: 1 + level * 0.2,
          size: 14 + Math.floor(Math.random() * 8),
          hp: 1 + Math.floor(level / 3),
          color: `hsl(${Math.random() * 60 + 0}, 70%, 55%)`,
        });
      }
    }

    // ---- Power-Up Spawn Timer (STRICT: every 15 seconds) ----
    powerUpTimerRef.current += dt;
    if (powerUpTimerRef.current >= 15000) {
      powerUpTimerRef.current = 0;
      spawnPowerUp();
    }

    // ---- Update & Draw Enemies ----
    const deadEnemyIndices: number[] = [];
    enemiesRef.current.forEach((enemy, ei) => {
      if (!enemy.active) return;
      enemy.y += enemy.speed * (dt / 16);

      if (enemy.y > H * viewportScale + 30) {
        enemy.active = false;
        return;
      }

      // Enemy-missile collision
      missilePoolRef.current.forEachActive((m) => {
        const dx = m.x - enemy.x;
        const dy = m.y - enemy.y;
        if (Math.sqrt(dx * dx + dy * dy) < enemy.size + 6) {
          enemy.hp--;
          missilePoolRef.current.release(m);
          if (enemy.hp <= 0) {
            enemy.active = false;
            scoreRef.current += 10 + level * 2;
            checkLevelUp();
          }
        }
      });

      // Ship-enemy collision
      if (enemy.active) {
        const dx = ship.x - enemy.x;
        const dy = ship.y - enemy.y;
        if (Math.sqrt(dx * dx + dy * dy) < enemy.size + 14) {
          enemy.active = false;
          if (!ship.shield) {
            ship.lives--;
            setDisplayLives(ship.lives);
            if (ship.lives <= 0) {
              setGameState('dead');
              const score = scoreRef.current;
              onGameOver(score, { level, username });
              onBanterEvent({
                category: 'KILL_STREAK',
                actorName: username,
                message: `reached Level ${level} with score ${score}`,
                highlight: true,
              });
              ctx.restore();
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

    // Purge inactive enemies periodically
    if (enemiesRef.current.length > 200) {
      enemiesRef.current = enemiesRef.current.filter((e) => e.active);
    }

    // ---- Power-Ups ----
    powerUpsRef.current.forEach((pu) => {
      if (!pu.active) return;
      pu.y += 1.5 * (dt / 16);
      if (pu.y > H * viewportScale + 30) { pu.active = false; return; }
      // Collect check
      const dx = ship.x - pu.x;
      const dy = ship.y - pu.y;
      if (Math.sqrt(dx * dx + dy * dy) < 24) { collectPowerUp(pu); return; }
      // Draw
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
    if (powerUpsRef.current.length > 50) {
      powerUpsRef.current = powerUpsRef.current.filter((p) => p.active);
    }

    // ---- HUD (always in screen-space, unscaled) ----
    ctx.restore(); // undo viewport scale

    ctx.fillStyle = 'rgba(9,9,11,0.6)';
    ctx.fillRect(0, 0, W, 36);
    ctx.font = 'bold 13px monospace';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#22d3ee';
    ctx.textAlign = 'left';
    ctx.fillText(`${scoreRef.current}`, 10, 18);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`LVL ${level}${level >= 10 ? ' ✦ EXPANDED' : ''}`, W / 2, 18);

    ctx.fillStyle = '#f87171';
    ctx.textAlign = 'right';
    ctx.fillText(`${'❤ '.repeat(Math.max(0, ship.lives)).trim()}`, W - 10, 18);

    // Active power-up timers bottom bar
    const activePUs: string[] = [];
    if (ship.shield) activePUs.push('🛡 Shield');
    if (ship.rapidFire) activePUs.push('⚡ Rapid Fire');
    if (ship.tripleShot) activePUs.push('✦ Triple Shot');
    if (activePUs.length > 0) {
      ctx.fillStyle = 'rgba(9,9,11,0.7)';
      ctx.fillRect(0, H - 24, W, 24);
      ctx.fillStyle = '#a78bfa';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(activePUs.join('  '), W / 2, H - 12);
    }

    // ---- Sync display state ~1/sec ----
    displaySyncTimer.current += dt;
    if (displaySyncTimer.current > 1000) {
      displaySyncTimer.current = 0;
      setDisplayScore(scoreRef.current);
      setDisplayLevel(level);
      setDisplayLives(ship.lives);
      setDisplayPowerUps(activePUs);
    }

    if (gameState === 'playing') {
      rafRef.current = requestAnimationFrame(gameLoop);
    }
  }, [fireMissile, spawnPowerUp, collectPowerUp, checkLevelUp, onGameOver, onBanterEvent, gameState, username]);

  // -------------------------------------------------------------------------
  // Start Game
  // -------------------------------------------------------------------------
  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width;
    const H = canvas.height;
    shipRef.current = { x: W / 2, y: H - 80, angle: 0, speed: 4, shield: false, rapidFire: false, tripleShot: false, lives: 3 };
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

  // -------------------------------------------------------------------------
  // RAF lifecycle
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (gameState === 'playing') {
      rafRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [gameState, gameLoop]);

  // -------------------------------------------------------------------------
  // Auto-start on mount when rendered inside GameWrapper
  // -------------------------------------------------------------------------
  useEffect(() => {
    startGame();
  }, [startGame]);

  // -------------------------------------------------------------------------
  // Input Handlers (Prevent window scrolling on game keys)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const gameKeys = ['Space', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
      if (gameKeys.includes(e.code) || gameKeys.includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current.add(e.key);
    };
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Touch controls (left = move left, right = move right, tap center = fire)
  const handleTouch = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    Array.from(e.touches).forEach((touch) => {
      const tx = touch.clientX - rect.left;
      if (tx < W * 0.35) {
        keysRef.current.add('ArrowLeft');
        keysRef.current.delete('ArrowRight');
      } else if (tx > W * 0.65) {
        keysRef.current.add('ArrowRight');
        keysRef.current.delete('ArrowLeft');
      } else {
        fireMissile();
      }
    });
  }, [fireMissile]);

  const handleTouchEnd = useCallback(() => {
    keysRef.current.delete('ArrowLeft');
    keysRef.current.delete('ArrowRight');
  }, []);

  // -------------------------------------------------------------------------
  // Resize
  // -------------------------------------------------------------------------
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = Math.min(container.clientWidth, 480);
      canvas.height = Math.min(container.clientWidth * (640 / 480), 640);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col items-center gap-3 bg-zinc-950 px-2 py-4">
      <div ref={containerRef} className="relative w-full max-w-[480px]">
        <canvas
          ref={canvasRef}
          onTouchStart={handleTouch}
          onTouchMove={handleTouch}
          onTouchEnd={handleTouchEnd}
          className="rounded-xl border border-zinc-800 shadow-2xl shadow-indigo-900/20"
          style={{ width: '100%', touchAction: 'none' }}
        />
      </div>

      {/* Controls hint */}
      <p className="text-[10px] font-mono text-zinc-600">
        WASD / Arrows = Move · Space = Fire · Touch: Tap sides to move, center to fire
      </p>
    </div>
  );
}
