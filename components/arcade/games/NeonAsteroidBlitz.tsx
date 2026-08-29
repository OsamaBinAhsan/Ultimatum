'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  Trophy,
  Pause,
  ChevronRight,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { RewardedAdModal } from '@/components/monetization/RewardedAdModal';
import { AuthModal } from '@/components/auth/AuthModal';
import confetti from 'canvas-confetti';

interface NeonAsteroidBlitzProps {
  gameId: string;
  gameTitle: string;
  onScoreSubmitted?: (score: number) => void;
}

// ---------------------------------------------------------------------------
// Zero-GC High-Speed Object Pool Implementation
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
      if (this.pool[i].active) {
        callback(this.pool[i], i);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Polyphonic Space Synthesizer (Optimized Web Audio)
// ---------------------------------------------------------------------------
class SpaceSynthEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private musicInterval: number | null = null;
  private bassStep: number = 0;

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

  playLaser(tier: number = 1, isCryo: boolean = false) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isCryo ? 'sine' : tier >= 4 ? 'sawtooth' : tier >= 2 ? 'triangle' : 'sine';

      const baseFreq = isCryo ? 1400 : tier === 1 ? 920 : tier === 2 ? 1150 : tier === 3 ? 1380 : tier === 4 ? 1650 : 1900;
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(tier >= 3 ? 0.11 : 0.07, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }

  playCryoFreeze() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1800, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch {}
  }

  playOverheatAlarm() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(250, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {}
  }

  playMissile() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {}
  }

  playExplosion(type: 'small' | 'medium' | 'boss') {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const dur = type === 'boss' ? 0.7 : type === 'medium' ? 0.3 : 0.15;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(type === 'boss' ? 65 : type === 'medium' ? 130 : 180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + dur);

      gain.gain.setValueAtTime(type === 'boss' ? 0.35 : 0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + dur);
    } catch {}
  }

  playEMP() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2000, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch {}
  }

  playPowerup(type?: string) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const freqs =
        type === 'cryo'
          ? [700, 950, 1300, 1750]
          : type === 'shield' || type === 'aegis'
          ? [440, 554.37, 659.25, 880]
          : type === 'emp' || type === 'quantum'
          ? [300, 600, 900, 1400]
          : [523.25, 659.25, 783.99, 1046.5, 1318.51];

      freqs.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.07, this.ctx.currentTime + i * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.035 + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.035);
        osc.stop(this.ctx.currentTime + i * 0.035 + 0.08);
      });
    } catch {}
  }

  playBossAlarm() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      [0, 0.16, 0.32].forEach((delay) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450, this.ctx.currentTime + delay);
        osc.frequency.linearRampToValueAtTime(900, this.ctx.currentTime + delay + 0.1);
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.13);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + 0.13);
      });
    } catch {}
  }

  playShieldHit() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  playComboUp(combo: number) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const freq = Math.min(2200, 440 + combo * 110);
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.4, this.ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    } catch {}
  }

  startCyberMusic() {
    if (!this.enabled || this.musicInterval !== null) return;
    this.init();
    if (!this.ctx) return;
    const bassNotes = [110, 110, 130.81, 146.83, 110, 164.81, 146.83, 123.47];
    this.musicInterval = window.setInterval(() => {
      if (!this.enabled || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        const note = bassNotes[this.bassStep % bassNotes.length];
        this.bassStep++;
        osc.frequency.setValueAtTime(note, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
      } catch {}
    }, 190);
  }

  stopCyberMusic() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Entity Interfaces
// ---------------------------------------------------------------------------
interface PooledBullet {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
  isReflected?: boolean;
  isCryo?: boolean;
}

interface PooledMissile {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  life: number;
  color: string;
  damage: number;
}

interface PooledEnemyBullet {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
  scale?: number;
}

interface AlienDrone {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  lastShot: number;
  angle: number;
  isElite?: boolean;
  isStealth?: boolean;
  stealthAlpha?: number;
}

// 4 Distinct Boss Archetypes
type BossType = 'dreadnought' | 'valkyrie' | 'leviathan' | 'singularity_titan';

interface BossEnemy {
  x: number;
  y: number;
  vx: number;
  radius: number;
  hp: number;
  maxHp: number;
  beamCharging: boolean;
  beamTimer: number;
  lastCannonShot: number;
  phase: number;
  name: string;
  type: BossType;
  color: string;
  escortDrones?: { x: number; y: number; angle: number; hp: number }[];
  shieldRingAngle?: number;
  shieldCrystals?: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'shield' | 'weapon' | 'emp' | 'score' | 'magnet' | 'chrono' | 'speed' | 'quantum' | 'aegis' | 'evolution' | 'cryo';
  color: string;
  icon: string;
  vy: number;
  pulse: number;
}

interface CosmicAnomaly {
  x: number;
  y: number;
  radius: number;
  rot: number;
  vRot: number;
  color: string;
  life: number;
  maxLife: number;
}

export function NeonAsteroidBlitzEngine({ gameId, gameTitle, onScoreSubmitted }: NeonAsteroidBlitzProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // High-level Game States
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [shieldHealth, setShieldHealth] = useState(100);
  const [weaponTier, setWeaponTier] = useState(1); // 1 to 5 (Titan Hyper-Cannon)
  const [shipEvolutionLevel, setShipEvolutionLevel] = useState(1); // 1 = Scout Mk-I, 2 = Assault Frigate, 3 = Dread Flagship
  const [empCharges, setEmpCharges] = useState(2);
  const [wave, setWave] = useState(1);
  const [combo, setCombo] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ---------------------------------------------------------------------------
  // Equipped Cosmetic Loadout (Shop Visual Skin + Game Gear integration)
  // ---------------------------------------------------------------------------
  const _nabLoadout = platformStore.getLoadout(platformStore.getCurrentUser()?.id || 'user-001', 'neon-asteroid-blitz');
  const _shipColor = _nabLoadout?.visualSkin?.shipColor || '#38bdf8';
  const _laserColor = _nabLoadout?.visualSkin?.laserColor || '#38bdf8';
  const _magnetMultiplier = (_nabLoadout?.gameGear?.magnetRadius || 1.0);
  const _shieldRevives = (_nabLoadout?.gameGear?.shield_revives || 0);
  const _shatterParticleCount = Math.floor(_nabLoadout?.actionJuice?.shatterParticleCount || 20);


  const [showRewardedAd, setShowRewardedAd] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasUsedRevive, setHasUsedRevive] = useState(false);
  const [isScoreSubmitted, setIsScoreSubmitted] = useState(false);

  // Throttled UI Display States
  const [activeBoostersDisplay, setActiveBoostersDisplay] = useState<{
    speed: number;
    rapid: number;
    shield: number;
    magnet: number;
    chrono: number;
    quantum: number;
    aegis: number;
    cryo: number;
  }>({ speed: 0, rapid: 0, shield: 0, magnet: 0, chrono: 0, quantum: 0, aegis: 0, cryo: 0 });

  // Weapon Overheat Gauge State (0 to 100%)
  const [heatPercentage, setHeatPercentage] = useState(0);
  const [isOverheated, setIsOverheated] = useState(false);

  const soundRef = useRef<SpaceSynthEngine>(new SpaceSynthEngine());
  const animFrameIdRef = useRef<number | null>(null);

  // Player Spacecraft Position & Vectors
  const playerRef = useRef({
    x: 400,
    y: 520,
    vx: 0,
    vy: 0,
    radius: 22,
    baseSpeed: 7.5,
    speed: 7.5,
    tilt: 0,
    invincibleTimer: 0,
    afterimages: [] as { x: number; y: number; tilt: number; alpha: number }[],
  });

  // Weapon Overheat Dynamics Ref (3.5% heat per shot, 35% cool down per second)
  const heatRef = useRef({
    heat: 0, // 0 to 100
    isOverheated: false,
    heatPerShot: 3.5,
    coolRatePerSec: 35.0,
    lastShotTime: 0,
  });

  // Strict Real-Time Timestamp Boosters (in exact Seconds)
  const timersRef = useRef({
    speed: 0,
    rapid: 0,
    shield: 0,
    magnet: 0,
    chrono: 0,
    quantum: 0,
    aegis: 0,
    cryo: 0, // ❄️ Cryo-Coolant Zero-Kelvin Hyperflux (Stops heat buildup)
    lastFrameTime: 0,
    lastUiSync: 0,
  });

  // ---------------------------------------------------------------------------
  // Pre-allocated Object Pools (Zero-GC Optimization)
  // ---------------------------------------------------------------------------
  const bulletPoolRef = useRef(
    new FastPool<PooledBullet>(
      250,
      () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, radius: 4, color: '#38bdf8', damage: 1 }),
      (b) => {
        b.x = 0;
        b.y = 0;
        b.vx = 0;
        b.vy = 0;
        b.damage = 1;
        b.isReflected = false;
        b.isCryo = false;
      }
    )
  );

  const missilePoolRef = useRef(
    new FastPool<PooledMissile>(
      60,
      () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, angle: 0, speed: 14, life: 100, color: '#a855f7', damage: 5 }),
      (m) => {
        m.x = 0;
        m.y = 0;
        m.vx = 0;
        m.vy = 0;
        m.life = 100;
        m.damage = 5;
      }
    )
  );

  const enemyBulletPoolRef = useRef(
    new FastPool<PooledEnemyBullet>(
      160,
      () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, radius: 4.5, color: '#ef4444' }),
      (eb) => {
        eb.x = 0;
        eb.y = 0;
      }
    )
  );

  const particlePoolRef = useRef(
    new FastPool<PooledParticle>(
      400,
      () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 30, color: '#38bdf8', size: 3 }),
      (p) => {
        p.life = 0;
      }
    )
  );

  // Entities & Collections
  const starsRef = useRef<{ x: number; y: number; size: number; speed: number; color: string; alpha: number }[]>([]);
  const asteroidsRef = useRef<{
    x: number;
    y: number;
    radius: number;
    vx: number;
    vy: number;
    rot: number;
    vRot: number;
    type: 'magma' | 'iron' | 'crystal' | 'obsidian' | 'comet';
    color: string;
    hp: number;
    maxHp: number;
    points: number;
    size: 'large' | 'medium' | 'small';
    spikes: number[];
    isFrozen?: number;
  }[]>([]);
  const dronesRef = useRef<AlienDrone[]>([]);
  const bossRef = useRef<BossEnemy | null>(null);
  const powerupsRef = useRef<PowerUp[]>([]);
  const floatTextsRef = useRef<FloatingText[]>([]);
  const anomaliesRef = useRef<CosmicAnomaly[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const screenShakeRef = useRef<number>(0);
  const shockwavesRef = useRef<{ x: number; y: number; radius: number; maxRadius: number; color: string }[]>([]);
  const waveNoticeRef = useRef<{ text: string; subtext: string; life: number; maxLife: number } | null>(null);
  const killCountRef = useRef<number>(0);
  const comboTimerRef = useRef<number>(0);
  const comboCountRef = useRef<number>(1);

  // Load High Score
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ultimatum_highscore_${gameId}`);
      if (saved) setHighScore(parseInt(saved, 10));
    } catch {}
  }, [gameId]);

  // Init Parallax Starfield
  useEffect(() => {
    starsRef.current = [];
    for (let i = 0; i < 110; i++) {
      starsRef.current.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        size: Math.random() < 0.15 ? 2.8 : Math.random() < 0.5 ? 1.6 : 1,
        speed: Math.random() * 2.8 + 0.6,
        color: Math.random() < 0.3 ? '#38bdf8' : Math.random() < 0.5 ? '#c084fc' : '#ffffff',
        alpha: Math.random() * 0.6 + 0.4,
      });
    }
  }, []);

  const addFloatText = (text: string, x: number, y: number, color = '#38bdf8', scale = 1) => {
    floatTextsRef.current.push({
      id: Date.now() + Math.random(),
      x,
      y,
      text,
      color,
      life: 45,
      vy: -1.5,
      scale,
    });
  };

  const createShockwave = (x: number, y: number, color = '#38bdf8', maxRadius = 180) => {
    shockwavesRef.current.push({ x, y, radius: 10, maxRadius, color });
  };

  const spawnExplosionParticles = (x: number, y: number, color: string, count = 18, large = false) => {
    screenShakeRef.current = Math.max(screenShakeRef.current, large ? 16 : 8);
    for (let i = 0; i < count; i++) {
      const p = particlePoolRef.current.get();
      if (!p) break;
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * (large ? 7 : 4.5) + 1.2;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.life = large ? 45 : 25;
      p.maxLife = p.life;
      p.color = color;
      p.size = Math.random() * (large ? 4 : 2.8) + 1.2;
    }
  };

  const incrementCombo = useCallback(() => {
    // Post-Level 10 expands combo limit up to 15x
    const maxCombo = wave >= 10 ? 15 : 10;
    comboCountRef.current = Math.min(maxCombo, comboCountRef.current + 1);
    comboTimerRef.current = 3.2;
    setCombo(comboCountRef.current);
    soundRef.current.playComboUp(comboCountRef.current);

    if (comboCountRef.current === 5) {
      addFloatText('⚡ 5X HYPER COMBO! ⚡', playerRef.current.x, playerRef.current.y - 40, '#fbbf24', 1.4);
    } else if (comboCountRef.current === 10) {
      addFloatText('🔥 10X GODLIKE STREAK! 🔥', playerRef.current.x, playerRef.current.y - 40, '#f43f5e', 1.6);
      screenShakeRef.current = 10;
    } else if (comboCountRef.current === 15) {
      addFloatText('🌌 15X COSMIC OVERLORD! 🌌', playerRef.current.x, playerRef.current.y - 40, '#c084fc', 1.8);
      screenShakeRef.current = 15;
    }
  }, [wave]);

  // ---------------------------------------------------------------------------
  // Progressive Asteroid Spawning (With Level 10+ Comets and Cosmic Anomalies)
  // ---------------------------------------------------------------------------
  const spawnAsteroid = useCallback((forcedSize?: 'large' | 'medium' | 'small', posX?: number, posY?: number) => {
    const maxCeiling = Math.min(18, 9 + Math.floor(wave * 0.85));
    if (asteroidsRef.current.length >= maxCeiling) return;

    const isL10 = wave >= 10;
    const isComet = isL10 && Math.random() < 0.25;

    const size = forcedSize || (Math.random() > 0.65 ? 'large' : Math.random() > 0.5 ? 'medium' : 'small');
    const radius = isComet ? 18 : size === 'large' ? 36 : size === 'medium' ? 22 : 14;
    const types: ('magma' | 'iron' | 'crystal' | 'obsidian' | 'comet')[] = isComet
      ? ['comet']
      : isL10
      ? ['magma', 'iron', 'crystal', 'obsidian', 'obsidian']
      : wave >= 5
      ? ['magma', 'iron', 'crystal', 'magma']
      : ['magma', 'iron', 'crystal'];
    const type = types[Math.floor(Math.random() * types.length)];

    const baseHp = isComet
      ? 6
      : (type === 'obsidian' ? 5 : type === 'iron' ? 3 : 1) * (size === 'large' ? 3 : size === 'medium' ? 2 : 1);
    const hp = baseHp + Math.floor(wave / 3.5);
    const color = isComet
      ? '#38bdf8'
      : type === 'obsidian'
      ? '#c084fc'
      : type === 'magma'
      ? '#f97316'
      : type === 'iron'
      ? '#94a3b8'
      : '#38bdf8';
    const points = (isComet ? 1200 : size === 'large' ? 150 : size === 'medium' ? 300 : 600) * (type === 'crystal' ? 2 : type === 'obsidian' ? 3 : 1);

    const x = posX !== undefined ? posX : Math.random() * 720 + 40;
    const y = posY !== undefined ? posY : -40;

    const baseSpeed = isComet
      ? 5.8
      : (size === 'large' ? 1.6 : size === 'medium' ? 2.5 : 3.5) + Math.random() * 0.5;
    const speed = baseSpeed * (1 + wave * 0.035);
    const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.65;

    const spikes: number[] = [];
    for (let i = 0; i < 7; i++) {
      spikes.push(0.78 + Math.random() * 0.44);
    }

    asteroidsRef.current.push({
      x,
      y,
      radius,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.05,
      type,
      color,
      hp,
      maxHp: hp,
      points,
      size,
      spikes,
    });
  }, [wave]);

  const spawnAlienDrone = useCallback(() => {
    const maxDroneCeiling = Math.min(7, 2 + Math.floor(wave * 0.6));
    if (dronesRef.current.length >= maxDroneCeiling) return;

    const isL10 = wave >= 10;
    const isStealth = isL10 && Math.random() < 0.4;
    const isElite = (wave >= 4 && Math.random() < Math.min(0.75, 0.2 + wave * 0.06)) || isStealth;

    const baseVy = (2.2 + Math.random() * 0.8) * (1 + wave * 0.05);
    const baseVx = (Math.random() - 0.5) * (isStealth ? 5.8 : isElite ? 5.2 : 3.6) * (1 + wave * 0.04);

    dronesRef.current.push({
      x: Math.random() * 600 + 100,
      y: -30,
      vx: baseVx,
      vy: baseVy,
      radius: isStealth ? 19 : isElite ? 21 : 17,
      hp: isStealth ? 14 + Math.floor(wave / 2) : isElite ? 10 + Math.floor(wave / 2) : 4 + Math.floor(wave / 3),
      maxHp: isStealth ? 14 + Math.floor(wave / 2) : isElite ? 10 + Math.floor(wave / 2) : 4 + Math.floor(wave / 3),
      lastShot: Date.now() + 800,
      angle: 0,
      isElite,
      isStealth,
      stealthAlpha: 1.0,
    });
  }, [wave]);

  // ---------------------------------------------------------------------------
  // 4 Unique Dynamic Boss Encounters
  // ---------------------------------------------------------------------------
  const spawnBoss = useCallback((waveNum: number) => {
    soundRef.current.playBossAlarm();
    screenShakeRef.current = 28;

    let type: BossType = 'dreadnought';
    let name = 'CYBER DREADNOUGHT';
    let color = '#f43f5e';
    let maxHp = 80 + waveNum * 45;
    let radius = 65;

    if (waveNum >= 12 || (waveNum >= 10 && waveNum % 3 === 0)) {
      type = 'singularity_titan';
      name = 'OMEGA SINGULARITY TITAN';
      color = '#a855f7';
      maxHp = 180 + waveNum * 60;
      radius = 80;
    } else if (waveNum === 9 || (waveNum % 3 === 0 && waveNum > 6)) {
      type = 'leviathan';
      name = 'TEMPEST LEVIATHAN';
      color = '#10b981';
      maxHp = 140 + waveNum * 50;
      radius = 72;
    } else if (waveNum === 6 || waveNum % 2 === 0) {
      type = 'valkyrie';
      name = 'AEGIS VALKYRIE CARRIER';
      color = '#fbbf24';
      maxHp = 110 + waveNum * 45;
      radius = 60;
    }

    const escortDrones =
      type === 'valkyrie'
        ? [
            { x: -50, y: -20, angle: 0, hp: 20 },
            { x: 50, y: -20, angle: Math.PI, hp: 20 },
          ]
        : undefined;

    bossRef.current = {
      x: 400,
      y: -80,
      vx: type === 'valkyrie' ? 3.8 : 2.2 + waveNum * 0.1,
      radius,
      hp: maxHp,
      maxHp,
      beamCharging: false,
      beamTimer: 0,
      lastCannonShot: Date.now() + 1400,
      phase: 1,
      name,
      type,
      color,
      escortDrones,
      shieldRingAngle: 0,
      shieldCrystals: type === 'singularity_titan' ? 4 : 0,
    };

    waveNoticeRef.current = {
      text: `⚠️ SECTOR TITAN INVASION: ${name} ⚠️`,
      subtext:
        type === 'singularity_titan'
          ? 'DARK MATTER EVENT HORIZON • CRACK SHIELD DRONES BEFORE TARGETING CORE'
          : type === 'valkyrie'
          ? 'HIGH SPEED STRAFE PATTERN • DEPLOYING ESCORT FIGHTERS'
          : type === 'leviathan'
          ? 'SPIRAL PLASMA VORTEX • DODGE GRAVITATIONAL TRACTOR PULSE'
          : 'TARGET HEAVY TURRETS • EVADE CHARGING THERMAL BEAMS',
      life: 180,
      maxLife: 180,
    };
  }, []);

  const triggerEMP = useCallback(() => {
    if (empCharges <= 0 || gameState !== 'playing') return;
    setEmpCharges((c) => c - 1);
    soundRef.current.playEMP();
    createShockwave(playerRef.current.x, playerRef.current.y, '#38bdf8', 450);
    screenShakeRef.current = 25;

    let clearedPoints = 0;

    asteroidsRef.current.forEach((ast) => {
      spawnExplosionParticles(ast.x, ast.y, ast.color, 18, true);
      const earned = ast.points * comboCountRef.current;
      clearedPoints += earned;
      addFloatText(`+${earned}`, ast.x, ast.y, '#38bdf8');
    });
    asteroidsRef.current = [];

    dronesRef.current.forEach((d) => {
      spawnExplosionParticles(d.x, d.y, '#ef4444', 22, true);
      const earned = 900 * comboCountRef.current;
      clearedPoints += earned;
      addFloatText(`+${earned} EMP KILL`, d.x, d.y, '#ef4444');
    });
    dronesRef.current = [];
    enemyBulletPoolRef.current.resetAll();

    if (bossRef.current) {
      bossRef.current.hp -= 35;
      spawnExplosionParticles(bossRef.current.x, bossRef.current.y, '#38bdf8', 25, true);
      addFloatText('-35 EMP BLAST', bossRef.current.x, bossRef.current.y, '#38bdf8', 1.4);
    }

    if (clearedPoints > 0) {
      setScore((s) => {
        const next = s + clearedPoints;
        if (next > highScore) setHighScore(next);
        return next;
      });
      incrementCombo();
    }
  }, [empCharges, gameState, highScore, incrementCombo]);

  // ---------------------------------------------------------------------------
  // Firing Execution (3.5% Heat Increment, ❄️ Cryo Heat-Freeze & Tier 5 Titan Nova)
  // ---------------------------------------------------------------------------
  const executePlayerFire = useCallback((now: number) => {
    const player = playerRef.current;
    const timers = timersRef.current;
    const heat = heatRef.current;

    // If weapon is currently overheated, player cannot fire until fully cooled
    if (heat.isOverheated) {
      return;
    }

    const isRapid = timers.rapid > 0;
    const isQuantum = timers.quantum > 0;
    const isCryo = timers.cryo > 0;

    const fireInterval = isQuantum
      ? 60
      : isRapid
      ? 80
      : weaponTier >= 5
      ? 100
      : weaponTier === 4
      ? 120
      : weaponTier === 3
      ? 150
      : weaponTier === 2
      ? 180
      : 210;

    if (now - heat.lastShotTime < fireInterval) {
      return;
    }

    heat.lastShotTime = now;

    // ❄️ Cryo-Coolant Overdrive completely prevents heat buildup!
    if (!isCryo) {
      const heatIncrement = isQuantum ? 1.0 : isRapid ? 1.8 : heat.heatPerShot; // 3.5%
      heat.heat = Math.min(100, heat.heat + heatIncrement);

      if (heat.heat >= 100) {
        heat.isOverheated = true;
        soundRef.current.playOverheatAlarm();
        addFloatText('🔥 WEAPON OVERHEATED! COOLING...', player.x, player.y - 35, '#ef4444', 1.3);
        screenShakeRef.current = 8;
      } else {
        soundRef.current.playLaser(weaponTier, isCryo);
      }
    } else {
      heat.heat = 0; // Frozen at 0%
      soundRef.current.playLaser(weaponTier, true);
    }

    // Exact nose orientation unit vector: [sin(tilt), -cos(tilt)]
    const noseDirX = Math.sin(player.tilt);
    const noseDirY = -Math.cos(player.tilt);
    const muzzleX = player.x + 28 * noseDirX;
    const muzzleY = player.y + 28 * noseDirY;
    const bulletSpeed = isCryo ? 17 : 15;
    const baseDamageBonus = isCryo ? 1.5 : 1.0;

    if (isQuantum) {
      // 8-Directional Quantum Nova Ring Burst
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const b = bulletPoolRef.current.get();
        if (b) {
          b.x = player.x;
          b.y = player.y;
          b.vx = Math.cos(angle) * 16;
          b.vy = Math.sin(angle) * 16;
          b.radius = 5.5;
          b.color = '#38bdf8';
          b.damage = 3.5 * baseDamageBonus;
          b.isCryo = isCryo;
        }
      }
    } else if (weaponTier === 1) {
      // Dual nose-aligned parallel blasters
      const perpX = -noseDirY;
      const perpY = noseDirX;
      [-7, 7].forEach((offset) => {
        const b = bulletPoolRef.current.get();
        if (b) {
          b.x = muzzleX + perpX * offset;
          b.y = muzzleY + perpY * offset;
          b.vx = noseDirX * bulletSpeed + player.vx * 0.2;
          b.vy = noseDirY * bulletSpeed + player.vy * 0.2;
          b.radius = 4;
          b.color = isCryo ? '#67e8f9' : '#38bdf8';
          b.damage = (1 + (shipEvolutionLevel - 1) * 0.5) * baseDamageBonus;
          b.isCryo = isCryo;
        }
      });
    } else if (weaponTier === 2) {
      // Tri-spread blasters
      [-0.12, 0, 0.12].forEach((spreadAngle) => {
        const b = bulletPoolRef.current.get();
        if (b) {
          const spreadDirX = Math.sin(player.tilt + spreadAngle);
          const spreadDirY = -Math.cos(player.tilt + spreadAngle);
          b.x = muzzleX;
          b.y = muzzleY;
          b.vx = spreadDirX * (bulletSpeed + 1) + player.vx * 0.2;
          b.vy = spreadDirY * (bulletSpeed + 1) + player.vy * 0.2;
          b.radius = 4.5;
          b.color = isCryo ? '#67e8f9' : spreadAngle === 0 ? '#c084fc' : '#38bdf8';
          b.damage = (1.5 + (shipEvolutionLevel - 1) * 0.5) * baseDamageBonus;
          b.isCryo = isCryo;
        }
      });
    } else if (weaponTier === 3) {
      // Quad vulcan cannons
      [-0.18, -0.06, 0.06, 0.18].forEach((spreadAngle) => {
        const b = bulletPoolRef.current.get();
        if (b) {
          const spreadDirX = Math.sin(player.tilt + spreadAngle);
          const spreadDirY = -Math.cos(player.tilt + spreadAngle);
          b.x = muzzleX;
          b.y = muzzleY;
          b.vx = spreadDirX * (bulletSpeed + 2) + player.vx * 0.2;
          b.vy = spreadDirY * (bulletSpeed + 2) + player.vy * 0.2;
          b.radius = 5;
          b.color = isCryo ? '#a5f3fc' : Math.abs(spreadAngle) < 0.1 ? '#fbbf24' : '#f43f5e';
          b.damage = (2 + (shipEvolutionLevel - 1) * 0.5) * baseDamageBonus;
          b.isCryo = isCryo;
        }
      });
    } else if (weaponTier === 4) {
      // Tier 4: Hyper-Overdrive + Homing Rockets
      [-0.14, 0, 0.14].forEach((spreadAngle) => {
        const b = bulletPoolRef.current.get();
        if (b) {
          const spreadDirX = Math.sin(player.tilt + spreadAngle);
          const spreadDirY = -Math.cos(player.tilt + spreadAngle);
          b.x = muzzleX;
          b.y = muzzleY;
          b.vx = spreadDirX * (bulletSpeed + 3) + player.vx * 0.2;
          b.vy = spreadDirY * (bulletSpeed + 3) + player.vy * 0.2;
          b.radius = 5.5;
          b.color = isCryo ? '#67e8f9' : '#fbbf24';
          b.damage = (2.5 + (shipEvolutionLevel - 1) * 0.5) * baseDamageBonus;
          b.isCryo = isCryo;
        }
      });

      const m = missilePoolRef.current.get();
      if (m) {
        soundRef.current.playMissile();
        m.x = muzzleX;
        m.y = muzzleY;
        m.angle = player.tilt;
        m.speed = 15;
        m.vx = noseDirX * m.speed + player.vx * 0.3;
        m.vy = noseDirY * m.speed + player.vy * 0.3;
        m.life = 90;
        m.color = '#a855f7';
        m.damage = 5 * baseDamageBonus;
      }
    } else {
      // 💥 Tier 5: OMEGA TITAN NOVA (5-Way Plasma Barrage + Twin Railguns + Dual Missiles)
      [-0.24, -0.12, 0, 0.12, 0.24].forEach((spreadAngle) => {
        const b = bulletPoolRef.current.get();
        if (b) {
          const spreadDirX = Math.sin(player.tilt + spreadAngle);
          const spreadDirY = -Math.cos(player.tilt + spreadAngle);
          b.x = muzzleX;
          b.y = muzzleY;
          b.vx = spreadDirX * (bulletSpeed + 4) + player.vx * 0.2;
          b.vy = spreadDirY * (bulletSpeed + 4) + player.vy * 0.2;
          b.radius = 6;
          b.color = isCryo ? '#e0f2fe' : spreadAngle === 0 ? '#38bdf8' : '#f43f5e';
          b.damage = (3.5 + (shipEvolutionLevel - 1) * 0.8) * baseDamageBonus;
          b.isCryo = isCryo;
        }
      });

      // Dual wing homing rockets
      [-1, 1].forEach((side) => {
        const m = missilePoolRef.current.get();
        if (m) {
          soundRef.current.playMissile();
          m.x = muzzleX + side * 18;
          m.y = muzzleY;
          m.angle = player.tilt + side * 0.15;
          m.speed = 16;
          m.vx = (noseDirX + side * 0.2) * m.speed;
          m.vy = (noseDirY) * m.speed;
          m.life = 100;
          m.color = '#06b6d4';
          m.damage = 6 * baseDamageBonus;
        }
      });
    }
  }, [weaponTier, shipEvolutionLevel]);

  // ---------------------------------------------------------------------------
  // Main Engine Loop (High Performance 60 FPS Canvas)
  // ---------------------------------------------------------------------------
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const player = playerRef.current;
    const timers = timersRef.current;
    const heat = heatRef.current;
    const now = performance.now();

    const dt = timers.lastFrameTime ? Math.min(0.08, (now - timers.lastFrameTime) / 1000) : 0.016;
    timers.lastFrameTime = now;

    // 1. Weapon Heat Dissipation / Cooling Cycle
    if (timers.cryo > 0) {
      heat.heat = 0;
      heat.isOverheated = false;
    } else if (!keysRef.current['Space'] || heat.isOverheated) {
      heat.heat = Math.max(0, heat.heat - heat.coolRatePerSec * dt);
      if (heat.isOverheated && heat.heat <= 0) {
        heat.isOverheated = false;
        addFloatText('❄️ WEAPON COOLED - READY!', player.x, player.y - 35, '#34d399', 1.2);
      }
    }

    // 2. Strict Real-Time Timer Decrements
    if (timers.speed > 0) timers.speed = Math.max(0, timers.speed - dt);
    if (timers.rapid > 0) timers.rapid = Math.max(0, timers.rapid - dt);
    if (timers.shield > 0) timers.shield = Math.max(0, timers.shield - dt);
    if (timers.magnet > 0) timers.magnet = Math.max(0, timers.magnet - dt);
    if (timers.chrono > 0) timers.chrono = Math.max(0, timers.chrono - dt);
    if (timers.quantum > 0) timers.quantum = Math.max(0, timers.quantum - dt);
    if (timers.aegis > 0) timers.aegis = Math.max(0, timers.aegis - dt);
    if (timers.cryo > 0) timers.cryo = Math.max(0, timers.cryo - dt);

    // Combo decay
    if (comboTimerRef.current > 0) {
      comboTimerRef.current = Math.max(0, comboTimerRef.current - dt);
      if (comboTimerRef.current <= 0) {
        comboCountRef.current = 1;
        setCombo(1);
      }
    }

    // Throttled UI state sync (Every 100ms)
    if (now - timers.lastUiSync > 100) {
      timers.lastUiSync = now;
      setActiveBoostersDisplay({
        speed: Math.ceil(timers.speed),
        rapid: Math.ceil(timers.rapid),
        shield: Math.ceil(timers.shield),
        magnet: Math.ceil(timers.magnet),
        chrono: Math.ceil(timers.chrono),
        quantum: Math.ceil(timers.quantum),
        aegis: Math.ceil(timers.aegis),
        cryo: Math.ceil(timers.cryo),
      });

      setHeatPercentage(Math.round(heat.heat));
      setIsOverheated(heat.isOverheated);
    }

    const timeSlowFactor = timers.chrono > 0 ? 0.45 : 1.0;
    player.speed = timers.speed > 0 ? player.baseSpeed * 1.55 : player.baseSpeed;

    ctx.save();

    // Screen Shake
    if (screenShakeRef.current > 0) {
      const dx = (Math.random() - 0.5) * screenShakeRef.current;
      const dy = (Math.random() - 0.5) * screenShakeRef.current;
      ctx.translate(dx, dy);
      screenShakeRef.current *= 0.88;
      if (screenShakeRef.current < 0.3) screenShakeRef.current = 0;
    }

    // Dynamic Level 10+ Deep Space Aurora Background
    const isL10 = wave >= 10;
    if (isL10) {
      const grad = ctx.createLinearGradient(0, 0, 800, 600);
      grad.addColorStop(0, '#0c051a');
      grad.addColorStop(0.5, '#050a1f');
      grad.addColorStop(1, '#15061b');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = '#050713';
    }
    ctx.fillRect(0, 0, 800, 600);

    // Parallax Stars
    starsRef.current.forEach((st) => {
      st.y += st.speed * (waveNoticeRef.current ? 3.0 : isL10 ? 1.8 : 1.0) * timeSlowFactor;
      if (st.y > 600) {
        st.y = 0;
        st.x = Math.random() * 800;
      }
      ctx.fillStyle = isL10 ? '#c084fc' : st.color;
      ctx.globalAlpha = st.alpha;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Shockwaves
    for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
      const sw = shockwavesRef.current[i];
      sw.radius += 10;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = Math.max(1, (1 - sw.radius / sw.maxRadius) * 6);
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();

      if (sw.radius >= sw.maxRadius) shockwavesRef.current.splice(i, 1);
    }

    // Player Maneuvering
    let moveX = 0;
    let moveY = 0;
    if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) moveX -= 1;
    if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) moveX += 1;
    if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) moveY -= 1;
    if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) moveY += 1;

    player.vx = player.vx * 0.84 + moveX * player.speed * 0.16;
    player.vy = player.vy * 0.84 + moveY * player.speed * 0.16;
    player.x += player.vx;
    player.y += player.vy;
    player.tilt = player.tilt * 0.78 + moveX * 0.32;

    player.x = Math.max(26, Math.min(774, player.x));
    player.y = Math.max(45, Math.min(555, player.y));

    if (player.invincibleTimer > 0) player.invincibleTimer -= 1;

    if (keysRef.current['Space']) {
      executePlayerFire(now);
    }

    // ----------------------------------------------------
    // Dynamic Visual Transformations on the Starship
    // ----------------------------------------------------
    // ❄️ Cryo-Coolant Frost Aura & Crystals
    if (timers.cryo > 0) {
      for (let i = 0; i < 2; i++) {
        const p = particlePoolRef.current.get();
        if (p) {
          p.x = player.x + (Math.random() - 0.5) * 36;
          p.y = player.y + (Math.random() - 0.5) * 36;
          p.vx = (Math.random() - 0.5) * 2;
          p.vy = Math.random() * 2 + 1;
          p.life = 16;
          p.maxLife = 16;
          p.color = '#67e8f9';
          p.size = Math.random() * 3 + 1.5;
        }
      }
    }

    // Chrono Time-Warp Holographic Afterimages
    if (timers.chrono > 0) {
      player.afterimages.push({ x: player.x, y: player.y, tilt: player.tilt, alpha: 0.5 });
      if (player.afterimages.length > 5) player.afterimages.shift();

      player.afterimages.forEach((img) => {
        img.alpha -= 0.08;
        if (img.alpha > 0) {
          ctx.save();
          ctx.translate(img.x, img.y);
          ctx.rotate(img.tilt);
          ctx.beginPath();
          ctx.moveTo(0, -28);
          ctx.lineTo(20, 22);
          ctx.lineTo(0, 24);
          ctx.lineTo(-20, 22);
          ctx.closePath();
          ctx.strokeStyle = `rgba(168, 85, 247, ${img.alpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
      });
    }

    // Speed Thruster Flaming Afterburner Trail
    if (timers.speed > 0) {
      for (let i = 0; i < 3; i++) {
        const p = particlePoolRef.current.get();
        if (p) {
          p.x = player.x + (Math.random() - 0.5) * 12;
          p.y = player.y + 22;
          p.vx = (Math.random() - 0.5) * 3;
          p.vy = Math.random() * 8 + 8;
          p.life = 18;
          p.maxLife = 18;
          p.color = Math.random() < 0.5 ? '#f97316' : '#fbbf24';
          p.size = Math.random() * 4 + 2;
        }
      }
    } else {
      const p = particlePoolRef.current.get();
      if (p) {
        p.x = player.x + (Math.random() - 0.5) * 8;
        p.y = player.y + 20;
        p.vx = (Math.random() - 0.5) * 1.5;
        p.vy = Math.random() * 4.5 + 4.5;
        p.life = 14;
        p.maxLife = 14;
        p.color = timers.cryo > 0 ? '#67e8f9' : '#38bdf8';
        p.size = Math.random() * 3 + 2;
      }
    }

    // Draw Spaceship Model
    if (player.invincibleTimer % 4 < 2) {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.tilt);

      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(shipEvolutionLevel >= 3 ? 30 : shipEvolutionLevel >= 2 ? 25 : 20, 22);
      ctx.lineTo(10, 16);
      ctx.lineTo(0, 24);
      ctx.lineTo(-10, 16);
      ctx.lineTo(shipEvolutionLevel >= 3 ? -30 : shipEvolutionLevel >= 2 ? -25 : -20, 22);
      ctx.closePath();
      ctx.fillStyle = '#090d1f';
      ctx.fill();

      const hullColor = timers.cryo > 0
        ? '#67e8f9'
        : heat.isOverheated
        ? '#ef4444'
        : timers.quantum > 0
        ? '#38bdf8'
        : timers.speed > 0
        ? '#fbbf24'
        : weaponTier >= 5
        ? '#06b6d4'
        : weaponTier >= 4
        ? '#f43f5e'
        : '#38bdf8';

      ctx.strokeStyle = hullColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -3, 6, 0, Math.PI * 2);
      ctx.fillStyle = hullColor;
      ctx.fill();

      if (shipEvolutionLevel >= 2) {
        ctx.beginPath();
        ctx.moveTo(-18, 8);
        ctx.lineTo(-28, 22);
        ctx.moveTo(18, 8);
        ctx.lineTo(28, 22);
        ctx.strokeStyle = timers.rapid > 0 ? '#f43f5e' : '#c084fc';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      if (shipEvolutionLevel >= 3) {
        ctx.beginPath();
        ctx.rect(-8, 6, 16, 12);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (timers.quantum > 0) {
        const orbitAngle = now * 0.005;
        for (let i = 0; i < 4; i++) {
          const a = orbitAngle + (i * Math.PI) / 2;
          const satX = Math.cos(a) * 38;
          const satY = Math.sin(a) * 38;
          ctx.beginPath();
          ctx.arc(satX, satY, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
        }
      }

      if (timers.cryo > 0) {
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(103, 232, 249, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (timers.aegis > 0) {
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3.5;
        ctx.stroke();
      } else if (shieldHealth > 0 || timers.shield > 0) {
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(52, 211, 153, ${Math.max(0.3, shieldHealth / 100)})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.beginPath();
      const heatAngle = (heat.heat / 100) * Math.PI;
      ctx.arc(0, 0, 32, -Math.PI / 2 - heatAngle / 2, -Math.PI / 2 + heatAngle / 2);
      ctx.strokeStyle = timers.cryo > 0 ? '#67e8f9' : heat.isOverheated ? '#ef4444' : heat.heat > 70 ? '#f97316' : '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();
    }

    // 6. Update Pooled Bullets
    bulletPoolRef.current.forEachActive((b) => {
      b.x += b.vx;
      b.y += b.vy;

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();

      if (b.y < -30 || b.y > 630 || b.x < -30 || b.x > 830) {
        bulletPoolRef.current.release(b);
      }
    });

    // 7. Update Pooled Missiles
    missilePoolRef.current.forEachActive((m) => {
      m.life -= 1;

      let targetX = m.x + m.vx;
      let targetY = m.y + m.vy;
      if (bossRef.current) {
        targetX = bossRef.current.x;
        targetY = bossRef.current.y;
      } else if (dronesRef.current.length > 0) {
        targetX = dronesRef.current[0].x;
        targetY = dronesRef.current[0].y;
      } else if (asteroidsRef.current.length > 0) {
        targetX = asteroidsRef.current[0].x;
        targetY = asteroidsRef.current[0].y;
      }

      const targetAngle = Math.atan2(targetY - m.y, targetX - m.x);
      m.vx = m.vx * 0.88 + Math.cos(targetAngle) * 2.2;
      m.vy = m.vy * 0.88 + Math.sin(targetAngle) * 2.2;

      m.x += m.vx;
      m.y += m.vy;

      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(Math.atan2(m.vy, m.vx) + Math.PI / 2);
      ctx.fillStyle = m.color;
      ctx.fillRect(-3, -7, 6, 14);
      ctx.restore();

      if (m.life <= 0 || m.y < -40 || m.y > 640 || m.x < -40 || m.x > 840) {
        missilePoolRef.current.release(m);
      }
    });

    // 8. Alien Drones
    if (wave >= 2 && !bossRef.current && Math.random() < (isL10 ? 0.038 : 0.028)) {
      spawnAlienDrone();
    }

    for (let i = dronesRef.current.length - 1; i >= 0; i--) {
      const drone = dronesRef.current[i];
      drone.angle += 0.05 * timeSlowFactor;
      drone.x += (drone.vx + Math.sin(drone.angle) * 1.6) * timeSlowFactor;
      drone.y += drone.vy * timeSlowFactor;
      if (drone.x < 45 || drone.x > 755) drone.vx *= -1;

      // Stealth Drone Cloak Shader
      if (drone.isStealth) {
        drone.stealthAlpha = 0.25 + Math.abs(Math.sin(now * 0.003)) * 0.75;
      }

      // Drone Fire
      if (now > drone.lastShot) {
        const dx = (player.x - drone.x) / 45;
        const eb = enemyBulletPoolRef.current.get();
        if (eb) {
          eb.x = drone.x;
          eb.y = drone.y + 16;
          eb.vx = Math.max(-6, Math.min(6, dx));
          eb.vy = (drone.isElite ? 7.0 : 5.2) + wave * 0.15;
          eb.radius = 4.5;
          eb.color = drone.isStealth ? '#38bdf8' : drone.isElite ? '#a855f7' : '#ef4444';
        }

        if (drone.isElite && wave >= 4) {
          const eb2 = enemyBulletPoolRef.current.get();
          if (eb2) {
            eb2.x = drone.x - 12;
            eb2.y = drone.y + 16;
            eb2.vx = Math.max(-6, Math.min(6, dx - 1.2));
            eb2.vy = 6.2 + wave * 0.12;
            eb2.radius = 4.5;
            eb2.color = '#f43f5e';
          }
        }

        drone.lastShot = now + Math.max(700, 1600 - wave * 75);
      }

      ctx.save();
      ctx.translate(drone.x, drone.y);
      ctx.globalAlpha = drone.stealthAlpha !== undefined ? drone.stealthAlpha : 1.0;
      ctx.beginPath();
      ctx.arc(0, 0, drone.radius, 0, Math.PI * 2);
      ctx.fillStyle = drone.isStealth ? '#06283d' : '#1e1014';
      ctx.fill();
      ctx.strokeStyle = drone.isStealth ? '#06b6d4' : drone.isElite ? '#a855f7' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // Bullets vs Drone
      bulletPoolRef.current.forEachActive((b) => {
        if (Math.hypot(b.x - drone.x, b.y - drone.y) < drone.radius + b.radius) {
          bulletPoolRef.current.release(b);
          drone.hp -= b.damage;
          spawnExplosionParticles(drone.x, drone.y, '#ef4444', 6);

          if (b.isCryo) {
            drone.vx *= 0.5;
            drone.vy *= 0.5;
          }

          if (drone.hp <= 0) {
            spawnExplosionParticles(drone.x, drone.y, drone.isStealth ? '#06b6d4' : '#ef4444', 24, true);
            soundRef.current.playExplosion('medium');
            const earned = (drone.isStealth ? 2500 : drone.isElite ? 1500 : 750) * comboCountRef.current;
            setScore((s) => s + earned);
            incrementCombo();
            addFloatText(`+${earned} DRONE ELIMINATED`, drone.x, drone.y, '#ef4444', 1.2);
            killCountRef.current += 1;
            dronesRef.current.splice(i, 1);
          }
        }
      });

      // Missiles vs Drone
      missilePoolRef.current.forEachActive((m) => {
        if (Math.hypot(m.x - drone.x, m.y - drone.y) < drone.radius + 10) {
          missilePoolRef.current.release(m);
          spawnExplosionParticles(drone.x, drone.y, '#c084fc', 28, true);
          soundRef.current.playExplosion('medium');
          const earned = 1200 * comboCountRef.current;
          setScore((s) => s + earned);
          incrementCombo();
          addFloatText(`+${earned} MISSILE KILL!`, drone.x, drone.y, '#c084fc', 1.3);
          killCountRef.current += 1;
          dronesRef.current.splice(i, 1);
        }
      });

      if (drone.y > 640) dronesRef.current.splice(i, 1);
    }

    // 9. 4 Distinct Boss Archetypes Handling
    if (bossRef.current) {
      const boss = bossRef.current;

      if (boss.y < 115) {
        boss.y += 1.2 * timeSlowFactor;
      } else {
        boss.x += boss.vx * timeSlowFactor;
        if (boss.x < 120 || boss.x > 680) boss.vx *= -1;
      }

      // Archetype 1: CYBER DREADNOUGHT (Rotary Cannons + Charging Death Beam)
      if (boss.type === 'dreadnought') {
        if (now > boss.lastCannonShot) {
          const cannonOffsets = boss.hp < boss.maxHp * 0.4 ? [-35, -18, 0, 18, 35] : [-25, 0, 25];
          cannonOffsets.forEach((offset) => {
            const angle = Math.atan2(player.y - (boss.y + 35), player.x - (boss.x + offset));
            const eb = enemyBulletPoolRef.current.get();
            if (eb) {
              eb.x = boss.x + offset;
              eb.y = boss.y + 35;
              eb.vx = Math.cos(angle) * (5.0 + wave * 0.1);
              eb.vy = Math.sin(angle) * (5.0 + wave * 0.1);
              eb.radius = 5.5;
              eb.color = '#f43f5e';
            }
          });
          boss.lastCannonShot = now + Math.max(800, 1400 - wave * 40);
        }

        boss.beamTimer += 1 * timeSlowFactor;
        if (boss.beamTimer > 250) boss.beamCharging = true;
        if (boss.beamTimer > 330) {
          ctx.fillStyle = 'rgba(244, 63, 94, 0.85)';
          ctx.fillRect(boss.x - 18, boss.y + 30, 36, 600);

          if (Math.abs(player.x - boss.x) < 32 && player.invincibleTimer <= 0) {
            player.invincibleTimer = 40;
            screenShakeRef.current = 22;
            spawnExplosionParticles(player.x, player.y, '#f43f5e', 20, true);
            if (shieldHealth > 0 || timers.shield > 0) {
              setShieldHealth((sh) => Math.max(0, sh - 50));
              soundRef.current.playShieldHit();
            } else {
              soundRef.current.playExplosion('boss');
              setLives((l) => {
                const nxt = l - 1;
                if (nxt <= 0) setGameState('gameover');
                return nxt;
              });
            }
          }

          if (boss.beamTimer > 390) {
            boss.beamCharging = false;
            boss.beamTimer = 0;
          }
        }
      }

      // Archetype 2: AEGIS VALKYRIE (Fast Strafe & Radial Starburst)
      else if (boss.type === 'valkyrie') {
        if (now > boss.lastCannonShot) {
          // Radial 8-Way Starburst Pulse
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            const eb = enemyBulletPoolRef.current.get();
            if (eb) {
              eb.x = boss.x;
              eb.y = boss.y + 20;
              eb.vx = Math.cos(a) * 4.8;
              eb.vy = Math.sin(a) * 4.8;
              eb.radius = 5;
              eb.color = '#fbbf24';
            }
          }
          boss.lastCannonShot = now + 1200;
        }
      }

      // Archetype 3: TEMPEST LEVIATHAN (Spiral Vortex Plasma Barrage)
      else if (boss.type === 'leviathan') {
        if (now > boss.lastCannonShot) {
          const spiralAngle = now * 0.008;
          [-0.3, 0, 0.3].forEach((angOffset) => {
            const eb = enemyBulletPoolRef.current.get();
            if (eb) {
              eb.x = boss.x;
              eb.y = boss.y + 35;
              eb.vx = Math.sin(spiralAngle + angOffset) * 5.5;
              eb.vy = Math.cos(spiralAngle + angOffset) * 5.5;
              eb.radius = 5.5;
              eb.color = '#10b981';
            }
          });
          boss.lastCannonShot = now + 400; // Continuous rapid spiral stream
        }
      }

      // Archetype 4: OMEGA SINGULARITY TITAN (Cosmic Void God - Tri-Laser & Singularity Pull)
      else if (boss.type === 'singularity_titan') {
        boss.shieldRingAngle = (boss.shieldRingAngle || 0) + 0.03;

        if (now > boss.lastCannonShot) {
          [-40, 0, 40].forEach((offset) => {
            for (let a = -0.2; a <= 0.2; a += 0.2) {
              const eb = enemyBulletPoolRef.current.get();
              if (eb) {
                eb.x = boss.x + offset;
                eb.y = boss.y + 40;
                eb.vx = Math.sin(a) * 6.5;
                eb.vy = Math.cos(a) * 6.5;
                eb.radius = 6.5;
                eb.color = '#a855f7';
              }
            }
          });
          boss.lastCannonShot = now + 1100;
        }
      }

      // Render Boss Ship
      ctx.save();
      ctx.translate(boss.x, boss.y);

      if (boss.type === 'singularity_titan') {
        // Singularity Black Hole Warp Event Horizon
        ctx.beginPath();
        ctx.arc(0, 0, boss.radius + 15, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.moveTo(0, 50);
      ctx.lineTo(boss.radius, 0);
      ctx.lineTo(boss.radius - 10, -40);
      ctx.lineTo(0, -30);
      ctx.lineTo(-boss.radius + 10, -40);
      ctx.lineTo(-boss.radius, 0);
      ctx.closePath();
      ctx.fillStyle = '#0f0b18';
      ctx.fill();
      ctx.strokeStyle = boss.color;
      ctx.lineWidth = 4;
      ctx.stroke();

      const corePulse = Math.sin(now * 0.008) * 4 + 14;
      ctx.beginPath();
      ctx.arc(0, 0, corePulse, 0, Math.PI * 2);
      ctx.fillStyle = boss.hp < boss.maxHp * 0.4 ? '#ef4444' : boss.color;
      ctx.fill();
      ctx.restore();

      // Bullets vs Boss
      bulletPoolRef.current.forEachActive((b) => {
        if (Math.hypot(b.x - boss.x, b.y - boss.y) < boss.radius + b.radius) {
          bulletPoolRef.current.release(b);
          boss.hp -= b.damage;

          if (boss.hp <= 0) {
            spawnExplosionParticles(boss.x, boss.y, boss.color, 60, true);
            createShockwave(boss.x, boss.y, boss.color, 400);
            soundRef.current.playExplosion('boss');
            confetti({ particleCount: 150, spread: 90 });

            const bossScore = (boss.type === 'singularity_titan' ? 12000 : 6000) * wave * comboCountRef.current;
            setScore((s) => s + bossScore);
            incrementCombo();
            addFloatText(`👑 ${boss.name} DEFEATED! +${bossScore.toLocaleString()}`, boss.x, boss.y, boss.color, 1.6);

            bossRef.current = null;
            killCountRef.current = 0;
            setWave((w) => w + 1);

            // Expansion Alert if passing level 10
            if (wave + 1 >= 10) {
              waveNoticeRef.current = {
                text: `🌌 DEEP SPACE DIMENSION RIFT UNLOCKED! (SECTOR ${wave + 1})`,
                subtext: 'ANOMALIES & HYPER-KINNETIC COMETS DETECTED • 15X MAX COMBO ACTIVE',
                life: 200,
                maxLife: 200,
              };
            } else {
              waveNoticeRef.current = {
                text: `SECTOR ${wave + 1} CLEARED!`,
                subtext: 'WARP SPEED ENGAGED • ENEMY THREAT ELEVATED',
                life: 160,
                maxLife: 160,
              };
            }
          }
        }
      });
    }

    // 10. Update Pooled Enemy Bullets (Aegis Deflector)
    enemyBulletPoolRef.current.forEachActive((eb) => {
      eb.x += eb.vx * timeSlowFactor;
      eb.y += eb.vy * timeSlowFactor;

      ctx.beginPath();
      ctx.arc(eb.x, eb.y, eb.radius, 0, Math.PI * 2);
      ctx.fillStyle = eb.color || '#ef4444';
      ctx.fill();

      if (timers.aegis > 0 && Math.hypot(eb.x - player.x, eb.y - player.y) < 45) {
        enemyBulletPoolRef.current.release(eb);
        const pb = bulletPoolRef.current.get();
        if (pb) {
          pb.x = eb.x;
          pb.y = eb.y;
          pb.vx = -eb.vx * 1.5;
          pb.vy = -Math.abs(eb.vy) * 1.5;
          pb.radius = 5;
          pb.color = '#34d399';
          pb.damage = 3;
          soundRef.current.playShieldHit();
          addFloatText('🛡️ REFLECT!', player.x, player.y - 20, '#34d399');
        }
        return;
      }

      if (Math.hypot(eb.x - player.x, eb.y - player.y) < eb.radius + player.radius && player.invincibleTimer <= 0) {
        enemyBulletPoolRef.current.release(eb);
        screenShakeRef.current = 15;
        player.invincibleTimer = 35;
        comboCountRef.current = 1;
        setCombo(1);
        spawnExplosionParticles(player.x, player.y, '#ef4444', 18);

        if (shieldHealth > 0 || timers.shield > 0) {
          setShieldHealth((sh) => Math.max(0, sh - 35));
          soundRef.current.playShieldHit();
        } else {
          soundRef.current.playExplosion('small');
          setLives((l) => {
            const nxt = l - 1;
            if (nxt <= 0) setGameState('gameover');
            return nxt;
          });
        }
      }

      if (eb.y > 630 || eb.y < -30 || eb.x < -30 || eb.x > 830) {
        enemyBulletPoolRef.current.release(eb);
      }
    });

    // 11. Asteroids Incursion
    const spawnRate = bossRef.current ? 0.012 : 0.035 + wave * 0.004;
    if (Math.random() < spawnRate) {
      spawnAsteroid();
    }

    for (let i = asteroidsRef.current.length - 1; i >= 0; i--) {
      const ast = asteroidsRef.current[i];
      ast.x += ast.vx * timeSlowFactor;
      ast.y += ast.vy * timeSlowFactor;
      ast.rot += ast.vRot * timeSlowFactor;

      ctx.save();
      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.rot);

      ctx.beginPath();
      const numSpikes = ast.spikes.length;
      for (let s = 0; s < numSpikes; s++) {
        const rad = (s / numSpikes) * Math.PI * 2;
        const dist = ast.radius * ast.spikes[s];
        const px = Math.cos(rad) * dist;
        const py = Math.sin(rad) * dist;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#0a0d1e';
      ctx.fill();
      ctx.strokeStyle = ast.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // Bullets vs Asteroid
      bulletPoolRef.current.forEachActive((b) => {
        if (Math.hypot(b.x - ast.x, b.y - ast.y) < ast.radius + b.radius) {
          bulletPoolRef.current.release(b);
          ast.hp -= b.damage;

          if (b.isCryo) {
            ast.vx *= 0.7;
            ast.vy *= 0.7;
          }

          if (ast.hp <= 0) {
            spawnExplosionParticles(ast.x, ast.y, ast.color, ast.size === 'large' ? 20 : 12, ast.size === 'large');
            soundRef.current.playExplosion(ast.size === 'large' ? 'medium' : 'small');
            const earned = ast.points * comboCountRef.current;
            setScore((s) => s + earned);
            incrementCombo();
            addFloatText(`+${earned}`, ast.x, ast.y, ast.color);
            killCountRef.current += 1;

            if (ast.size === 'large') {
              spawnAsteroid('medium', ast.x - 14, ast.y);
              spawnAsteroid('medium', ast.x + 14, ast.y);
            }

            // High-Weight Power-Up Drops (15% Drop Rate, max 5 floating drops)
            if (Math.random() < 0.15 && powerupsRef.current.length < 5) {
              // Weighted higher for Weapon Upgrades, Cryo-Coolant, Evolutions
              const types: PowerUp['type'][] = [
                'weapon', 'weapon', 'weapon', // High weapon boost weight
                'cryo', 'cryo', // ❄️ Heat-freezing Cryo-Coolant
                'evolution', 'evolution', // Ship tier upgrade
                'quantum',
                'shield',
                'aegis',
                'speed',
                'magnet',
                'chrono',
                'emp',
                'score'
              ];
              const icons: Record<string, string> = {
                shield: '🛡️',
                weapon: '⚡',
                emp: '💥',
                score: '💎',
                magnet: '🧲',
                chrono: '⏱️',
                speed: '🏎️',
                evolution: '🚀',
                quantum: '⚡',
                aegis: '🛡️',
                cryo: '❄️',
              };
              const colors: Record<string, string> = {
                shield: '#34d399',
                weapon: '#f43f5e',
                emp: '#38bdf8',
                score: '#fbbf24',
                magnet: '#eab308',
                chrono: '#a855f7',
                speed: '#f97316',
                evolution: '#06b6d4',
                quantum: '#38bdf8',
                aegis: '#10b981',
                cryo: '#67e8f9',
              };
              const type = types[Math.floor(Math.random() * types.length)];
              powerupsRef.current.push({
                x: ast.x,
                y: ast.y,
                type,
                color: colors[type],
                icon: icons[type],
                vy: 1.8,
                pulse: 0,
              });
            }

            // Wave Boss Trigger
            if (!bossRef.current && killCountRef.current >= 24 + wave * 5) {
              if (wave % 3 === 0) {
                spawnBoss(wave);
              } else {
                setWave((w) => w + 1);
                killCountRef.current = 0;

                if (wave + 1 >= 10) {
                  waveNoticeRef.current = {
                    text: `🌌 DEEP SPACE DIMENSION RIFT UNLOCKED! (SECTOR ${wave + 1})`,
                    subtext: 'ANOMALIES & HYPER-KINNETIC COMETS DETECTED • 15X MAX COMBO ACTIVE',
                    life: 200,
                    maxLife: 200,
                  };
                } else {
                  waveNoticeRef.current = {
                    text: `SECTOR ${wave + 1}: HOSTILE COMBAT ZONE`,
                    subtext: 'ENEMY INVASION FLEET APPROACHING',
                    life: 140,
                    maxLife: 140,
                  };
                }
              }
            }

            asteroidsRef.current.splice(i, 1);
          }
        }
      });

      // Player Collision with Asteroid
      if (Math.hypot(player.x - ast.x, player.y - ast.y) < ast.radius + player.radius && player.invincibleTimer <= 0) {
        asteroidsRef.current.splice(i, 1);
        screenShakeRef.current = 18;
        player.invincibleTimer = 35;
        comboCountRef.current = 1;
        setCombo(1);
        spawnExplosionParticles(ast.x, ast.y, '#f43f5e', 22, true);

        if (shieldHealth > 0 || timers.shield > 0) {
          setShieldHealth((sh) => Math.max(0, sh - 50));
          soundRef.current.playShieldHit();
        } else {
          soundRef.current.playExplosion('medium');
          setLives((l) => {
            const nextLives = l - 1;
            if (nextLives <= 0) setGameState('gameover');
            return nextLives;
          });
        }
      }

      if (ast.y > 650) asteroidsRef.current.splice(i, 1);
    }

    // 12. Power-Up Pickups
    for (let i = powerupsRef.current.length - 1; i >= 0; i--) {
      const p = powerupsRef.current[i];
      p.pulse += 0.08;

      if (timers.magnet > 0) {
        const angle = Math.atan2(player.y - p.y, player.x - p.x);
        p.x += Math.cos(angle) * 7.5;
        p.y += Math.sin(angle) * 7.5;
      } else {
        p.y += p.vy;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 16 + Math.sin(p.pulse) * 2, 0, Math.PI * 2);
      ctx.fillStyle = '#090d1f';
      ctx.fill();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = p.color;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.icon, p.x, p.y);
      ctx.restore();

      if (Math.hypot(player.x - p.x, player.y - p.y) < 18 + player.radius) {
        soundRef.current.playPowerup(p.type);

        if (p.type === 'cryo') {
          timers.cryo = 8.0;
          heat.heat = 0;
          heat.isOverheated = false;
          soundRef.current.playCryoFreeze();
          addFloatText('❄️ ZERO-KELVIN CRYO-COOLANT (8s HEAT FREEZE)', player.x, player.y, '#67e8f9', 1.5);
          confetti({ particleCount: 60, spread: 50, colors: ['#67e8f9', '#38bdf8', '#ffffff'] });
        } else if (p.type === 'shield') {
          setShieldHealth(100);
          timers.shield = 10.0;
          player.invincibleTimer = 60;
          addFloatText('🛡️ SHIELD OVERDRIVE (10s)', player.x, player.y, '#34d399', 1.3);
        } else if (p.type === 'weapon') {
          setWeaponTier((w) => Math.min(5, w + 1));
          timers.rapid = 10.0;
          const label = weaponTier >= 4 ? '💥 TITAN HYPER-CANNON TIER 5' : '⚡ WEAPONS OVERCLOCKED (10s)';
          addFloatText(label, player.x, player.y, '#f43f5e', 1.4);
          confetti({ particleCount: 70, spread: 60 });
        } else if (p.type === 'evolution') {
          setShipEvolutionLevel((lvl) => Math.min(3, lvl + 1));
          setShieldHealth(100);
          addFloatText('🚀 STARSHIP EVOLVED: LEVEL ' + Math.min(3, shipEvolutionLevel + 1), player.x, player.y, '#06b6d4', 1.5);
          confetti({ particleCount: 70, spread: 60 });
        } else if (p.type === 'speed') {
          timers.speed = 7.0;
          addFloatText('🏎️ HYPER-DRIVE SPEED (7s)', player.x, player.y, '#f97316', 1.3);
        } else if (p.type === 'emp') {
          setEmpCharges((e) => e + 1);
          addFloatText('💥 +1 EMP BOMB', player.x, player.y, '#38bdf8', 1.3);
        } else if (p.type === 'score') {
          const bonus = 1500 * comboCountRef.current;
          setScore((s) => s + bonus);
          incrementCombo();
          addFloatText(`💎 +${bonus.toLocaleString()} HYPER GEM`, player.x, player.y, '#fbbf24', 1.3);
        } else if (p.type === 'magnet') {
          timers.magnet = 8.0;
          addFloatText('🧲 VACUUM MAGNET (8s)', player.x, player.y, '#eab308', 1.3);
        } else if (p.type === 'chrono') {
          timers.chrono = 5.0;
          addFloatText('⏱️ CHRONO DILATION (5s)', player.x, player.y, '#a855f7', 1.3);
        } else if (p.type === 'quantum') {
          timers.quantum = 8.0;
          addFloatText('⚡ QUANTUM NOVA (8s)', player.x, player.y, '#38bdf8', 1.5);
        } else if (p.type === 'aegis') {
          timers.aegis = 6.0;
          addFloatText('🛡️ AEGIS REFLECTOR (6s)', player.x, player.y, '#10b981', 1.5);
        }

        powerupsRef.current.splice(i, 1);
      }

      if (p.y > 640) powerupsRef.current.splice(i, 1);
    }

    // 13. Update Pooled Particles
    particlePoolRef.current.forEachActive((prt) => {
      prt.x += prt.vx * timeSlowFactor;
      prt.y += prt.vy * timeSlowFactor;
      prt.life -= 1;

      ctx.beginPath();
      ctx.arc(prt.x, prt.y, Math.max(0.5, (prt.life / prt.maxLife) * prt.size), 0, Math.PI * 2);
      ctx.fillStyle = prt.color;
      ctx.fill();

      if (prt.life <= 0) particlePoolRef.current.release(prt);
    });

    // 14. Floating Texts
    for (let i = floatTextsRef.current.length - 1; i >= 0; i--) {
      const ft = floatTextsRef.current[i];
      ft.y += ft.vy;
      ft.life -= 1;

      ctx.save();
      ctx.font = `bold ${Math.round(13 * (ft.scale || 1))}px monospace`;
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();

      if (ft.life <= 0) floatTextsRef.current.splice(i, 1);
    }

    // 15. In-Canvas Boss HP Bar with Specific Archetype Colors
    if (bossRef.current) {
      const boss = bossRef.current;
      const barWidth = 380;
      const barHeight = 10;
      const pct = Math.max(0, boss.hp / boss.maxHp);

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(400 - barWidth / 2 - 10, 15, barWidth + 20, 34);
      ctx.strokeStyle = boss.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(400 - barWidth / 2 - 10, 15, barWidth + 20, 34);

      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = boss.color;
      ctx.textAlign = 'center';
      ctx.fillText(`⚔️ ${boss.name} [${boss.hp}/${boss.maxHp} HP]`, 400, 27);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(400 - barWidth / 2, 32, barWidth, barHeight);
      ctx.fillStyle = boss.color;
      ctx.fillRect(400 - barWidth / 2, 32, barWidth * pct, barHeight);
      ctx.restore();
    }

    ctx.restore();

    if (gameState === 'playing') {
      animFrameIdRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, shieldHealth, weaponTier, shipEvolutionLevel, wave, spawnAsteroid, spawnAlienDrone, spawnBoss, incrementCombo, executePlayerFire]);

  // Keyboard Event Handlers (No scrolling)
  useEffect(() => {
    const gameKeys = new Set([
      'Space',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'KeyB',
      'KeyE',
      'KeyP',
      'Escape',
    ]);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameKeys.has(e.code)) {
        if (gameState === 'playing' || gameState === 'paused') {
          e.preventDefault();
        }
      }

      keysRef.current[e.code] = true;

      if (e.code === 'KeyB' || e.code === 'KeyE') triggerEMP();

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameState === 'playing') setGameState('paused');
        else if (gameState === 'paused') setGameState('playing');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameKeys.has(e.code) && (gameState === 'playing' || gameState === 'paused')) {
        e.preventDefault();
      }
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, triggerEMP]);

  // Game Loop Animation Frame Trigger
  useEffect(() => {
    if (gameState === 'playing') {
      soundRef.current.startCyberMusic();
      animFrameIdRef.current = requestAnimationFrame(gameLoop);
    } else {
      soundRef.current.stopCyberMusic();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    }
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      soundRef.current.stopCyberMusic();
    };
  }, [gameState, gameLoop]);

  const startGame = () => {
    setScore(0);
    setLives(3);
    setShieldHealth(100);
    setWeaponTier(1);
    setShipEvolutionLevel(1);
    setEmpCharges(2);
    setWave(1);
    setCombo(1);
    setHasUsedRevive(false);
    setIsScoreSubmitted(false);

    playerRef.current.x = 400;
    playerRef.current.y = 520;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playerRef.current.tilt = 0;
    playerRef.current.invincibleTimer = 60;
    playerRef.current.afterimages = [];

    heatRef.current.heat = 0;
    heatRef.current.isOverheated = false;
    heatRef.current.lastShotTime = 0;

    bulletPoolRef.current.resetAll();
    missilePoolRef.current.resetAll();
    enemyBulletPoolRef.current.resetAll();
    particlePoolRef.current.resetAll();

    asteroidsRef.current = [];
    dronesRef.current = [];
    bossRef.current = null;
    powerupsRef.current = [];
    floatTextsRef.current = [];
    anomaliesRef.current = [];
    killCountRef.current = 0;

    timersRef.current.speed = 0;
    timersRef.current.rapid = 0;
    timersRef.current.shield = 0;
    timersRef.current.magnet = 0;
    timersRef.current.chrono = 0;
    timersRef.current.quantum = 0;
    timersRef.current.aegis = 0;
    timersRef.current.cryo = 0;
    timersRef.current.lastFrameTime = performance.now();

    comboCountRef.current = 1;

    waveNoticeRef.current = {
      text: 'SECTOR 1: ASTEROID INVASION',
      subtext: 'BURST-FIRE TO MANAGE WEAPON HEAT • COLLECT STARSHIP EVOLUTIONS',
      life: 150,
      maxLife: 150,
    };

    setGameState('playing');
  };

  // Auto-start on mount when launched from Arcade
  useEffect(() => {
    startGame();
  }, []);

  // Automated Score Submission on Game Over (Zero manual button clicks required)
  useEffect(() => {
    if (gameState === 'gameover') {
      try {
        localStorage.setItem(`ultimatum_highscore_${gameId}`, score.toString());
      } catch {}
      platformStore.submitScore(gameId, score);
      setIsScoreSubmitted(true);
      if (onScoreSubmitted) {
        onScoreSubmitted(score);
      }
    }
  }, [gameState, score, gameId, onScoreSubmitted]);

  const handleRewardedAdRevive = () => {
    setLives(1);
    setShieldHealth(100);
    setEmpCharges(2);
    setScore((s) => s + 500);
    setHasUsedRevive(true);
    playerRef.current.invincibleTimer = 90;
    playerRef.current.x = 400;
    playerRef.current.y = 520;
    heatRef.current.heat = 0;
    heatRef.current.isOverheated = false;
    setGameState('playing');
  };

  const handleSubmitScore = () => {
    if (isScoreSubmitted) return;
    try {
      localStorage.setItem(`ultimatum_highscore_${gameId}`, score.toString());
      if (score > highScore) setHighScore(score);
    } catch {}

    if (!platformStore.isLoggedIn()) {
      platformStore.setPendingScore(gameId, score);
      setShowAuthModal(true);
      return;
    }
    platformStore.submitScore(gameId, score);
    setIsScoreSubmitted(true);
    confetti({ particleCount: 120, spread: 85 });
    if (onScoreSubmitted) onScoreSubmitted(score);
  };

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

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const targetX = ((touch.clientX - rect.left) / rect.width) * 800;
    const targetY = ((touch.clientY - rect.top) / rect.height) * 600;

    playerRef.current.x = Math.max(26, Math.min(774, targetX));
    playerRef.current.y = Math.max(45, Math.min(555, targetY));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-cyan-500/40 bg-zinc-950 p-4 shadow-2xl space-y-3 select-none"
    >
      {/* ---------------------------------------------------- */}
      {/* Competitive Arcade Overdrive Header                  */}
      {/* ---------------------------------------------------- */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ENDLESS ARCADE OVERDRIVE</span>
          </div>
          {wave >= 10 && (
            <span className="animate-pulse text-[11px] font-mono font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
              🌌 VOID SINGULARITY DIMENSION
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-400 text-[11px]">WEAPON TIER:</span>
          <span className="text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
            {weaponTier === 5 ? '💥 TIER 5 TITAN NOVA' : `⚡ TIER ${weaponTier}`}
          </span>
          <span className="text-zinc-400 text-[11px] ml-2">CHASSIS:</span>
          <span className="text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
            {shipEvolutionLevel === 1 ? '🚀 Scout Mk-I' : shipEvolutionLevel === 2 ? '⚡ Assault Frigate' : '👑 Dread Flagship'}
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Persistent HUD Bar                                   */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 rounded-xl bg-zinc-900/90 p-3 border border-zinc-800">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-zinc-400">Score</span>
            {combo > 1 && (
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20 px-1 rounded">
                {combo}x
              </span>
            )}
          </div>
          <div className="text-xl font-black font-mono text-cyan-400">{score.toLocaleString()}</div>
          <div className="text-[9px] font-mono text-zinc-500">BEST: {highScore.toLocaleString()}</div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400">Hull Integrity</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-3 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
              <div
                className={`h-full transition-all ${
                  shieldHealth > 50 ? 'bg-emerald-400' : shieldHealth > 25 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${shieldHealth}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">{shieldHealth}%</span>
          </div>
        </div>

        {/* Tactile Weapon Overheat Heat Bar (With Cryo-Coolant indicator) */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-zinc-400">Weapon Heat</span>
            <span
              className={`text-[10px] font-mono font-bold ${
                activeBoostersDisplay.cryo > 0
                  ? 'text-cyan-300 animate-pulse'
                  : isOverheated
                  ? 'text-rose-500 animate-pulse'
                  : heatPercentage > 70
                  ? 'text-orange-400'
                  : 'text-cyan-300'
              }`}
            >
              {activeBoostersDisplay.cryo > 0 ? '❄️ ZERO-KELVIN' : isOverheated ? 'OVERHEATED!' : `${heatPercentage}%`}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-3 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
              <div
                className={`h-full transition-all duration-75 ${
                  activeBoostersDisplay.cryo > 0
                    ? 'bg-cyan-300 animate-pulse'
                    : isOverheated
                    ? 'bg-rose-500 animate-pulse'
                    : heatPercentage > 70
                    ? 'bg-orange-500'
                    : heatPercentage > 40
                    ? 'bg-amber-400'
                    : 'bg-cyan-400'
                }`}
                style={{ width: `${activeBoostersDisplay.cryo > 0 ? 100 : heatPercentage}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-zinc-400">
              {activeBoostersDisplay.cryo > 0 ? 'FROZEN' : isOverheated ? 'COOLING' : heatPercentage < 30 ? 'COOL' : 'WARM'}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400">Sector Wave</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
              WAVE {wave}
            </span>
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <span
                  key={i}
                  className={`h-3.5 w-3.5 rounded transition-all ${
                    i < lives ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400">Smart Bomb</span>
          <div className="mt-1">
            <button
              onClick={triggerEMP}
              disabled={empCharges <= 0}
              className="w-full rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 py-0.5 text-xs font-bold text-cyan-300 font-mono transition-all disabled:opacity-30"
            >
              {empCharges} EMP [B / E]
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          {gameState === 'playing' && (
            <button
              onClick={() => setGameState('paused')}
              className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-white"
              title="Pause Game [P]"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          {gameState === 'paused' && (
            <button
              onClick={() => setGameState('playing')}
              className="rounded-lg bg-cyan-500/20 border border-cyan-500/40 p-2 text-cyan-300 hover:bg-cyan-500/30"
              title="Resume Game"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              soundRef.current.enabled = !soundEnabled;
            }}
            className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-white"
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-white"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Real-Time Active Booster Status Shelf                */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-zinc-950/80 p-2 border border-zinc-800/80 text-xs font-mono">
        <span className="text-[10px] uppercase text-zinc-500 font-bold px-1">Active Boosters:</span>

        {activeBoostersDisplay.cryo > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-cyan-500/30 border border-cyan-400 px-2 py-0.5 text-cyan-200 animate-pulse">
            <span>❄️ Cryo-Coolant (Zero Heat)</span>
            <span className="font-bold text-cyan-300">{activeBoostersDisplay.cryo}s</span>
          </div>
        )}

        {activeBoostersDisplay.speed > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-orange-500/20 border border-orange-500/40 px-2 py-0.5 text-orange-300">
            <span>🏎️ Speed Thruster</span>
            <span className="font-bold text-orange-400">{activeBoostersDisplay.speed}s</span>
          </div>
        )}

        {activeBoostersDisplay.rapid > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-rose-300">
            <span>⚡ Rapid Fire</span>
            <span className="font-bold text-rose-400">{activeBoostersDisplay.rapid}s</span>
          </div>
        )}

        {activeBoostersDisplay.shield > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-emerald-300">
            <span>🛡️ Shield Overdrive</span>
            <span className="font-bold text-emerald-400">{activeBoostersDisplay.shield}s</span>
          </div>
        )}

        {activeBoostersDisplay.magnet > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-amber-300">
            <span>🧲 Vacuum Magnet</span>
            <span className="font-bold text-amber-400">{activeBoostersDisplay.magnet}s</span>
          </div>
        )}

        {activeBoostersDisplay.chrono > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-purple-300">
            <span>⏱️ Chrono Warp</span>
            <span className="font-bold text-purple-400">{activeBoostersDisplay.chrono}s</span>
          </div>
        )}

        {activeBoostersDisplay.quantum > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-cyan-300 animate-pulse">
            <span>⚡ Quantum Nova</span>
            <span className="font-bold text-cyan-400">{activeBoostersDisplay.quantum}s</span>
          </div>
        )}

        {activeBoostersDisplay.aegis > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-emerald-300 animate-pulse">
            <span>🛡️ Aegis Reflector</span>
            <span className="font-bold text-emerald-400">{activeBoostersDisplay.aegis}s</span>
          </div>
        )}

        {Object.values(activeBoostersDisplay).every((v) => v === 0) && (
          <span className="text-[11px] text-zinc-500 italic">No temporary boosters active • Destroy asteroids for 15% drop chance</span>
        )}
      </div>
        {/* ---------------------------------------------------- */}
        {/* HTML5 Canvas Frame                                   */}
        {/* ---------------------------------------------------- */}
        <div className="relative aspect-[4/3] w-full max-h-[580px] overflow-hidden rounded-xl border border-zinc-800 bg-black">
          {/* Cinematic Start / Launch Overlay */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
              <style>{`
                @keyframes nabFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
                @keyframes nabPulseGlow { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.9; } }
                @keyframes nabScan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
              `}</style>

              {/* Deep space gradient background */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#010208] via-[#040d18] to-[#020510]" />

              {/* Animated scanlines overlay */}
              <div className="absolute inset-0 pointer-events-none" style={{backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,240,255,0.018) 3px, rgba(0,240,255,0.018) 4px)'}} />

              {/* Animated nebula orbs */}
              <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" style={{animation: 'nabPulseGlow 4s ease-in-out infinite'}} />
              <div className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full bg-purple-500/8 blur-3xl" style={{animation: 'nabPulseGlow 5s ease-in-out infinite', animationDelay: '1s'}} />
              <div className="absolute top-2/3 left-1/3 w-40 h-40 rounded-full bg-blue-500/6 blur-2xl" style={{animation: 'nabPulseGlow 6s ease-in-out infinite', animationDelay: '2s'}} />

              {/* Animated scan line */}
              <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" style={{animation: 'nabScan 4s linear infinite'}} />

              {/* Badge */}
              <div className="relative z-10 mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-1.5 text-xs font-mono font-bold text-cyan-300" style={{boxShadow: '0 0 20px rgba(6,182,212,0.3)'}}>
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>SECTOR ZERO — DEEP SPACE OVERDRIVE</span>
              </div>

              {/* Game Title */}
              <h1 className="relative z-10 text-4xl sm:text-5xl font-black tracking-tight text-center px-4 mb-1" style={{background: 'linear-gradient(180deg, #ffffff 0%, #a5f3fc 60%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 30px rgba(6,182,212,0.8))'}}>
                {gameTitle}
              </h1>
              <div className="relative z-10 text-[10px] font-mono text-cyan-400/70 tracking-[0.35em] uppercase mb-5">
                Endless Combat · Sector 10 Dimension Boss Awaits
              </div>

              {/* Animated ship preview */}
              <div className="relative z-10 mb-5 flex items-center justify-center h-24">
                <div className="relative" style={{animation: 'nabFloat 3s ease-in-out infinite'}}>
                  <svg width="72" height="88" viewBox="0 0 72 88" className="overflow-visible" style={{filter: `drop-shadow(0 0 12px ${_shipColor})`}}>
                    <polygon points="36,4 56,70 36,56 16,70" fill="#0a0e1a" stroke={_shipColor} strokeWidth="2" />
                    <polygon points="36,4 30,28 42,28" fill={_shipColor} opacity="0.8" />
                    <circle cx="36" cy="20" r="5" fill={_shipColor} opacity="0.9" />
                    <line x1="26" y1="56" x2="14" y2="80" stroke="#ff0077" strokeWidth="2.5" opacity="0.7" />
                    <line x1="46" y1="56" x2="58" y2="80" stroke="#ff0077" strokeWidth="2.5" opacity="0.7" />
                    <ellipse cx="36" cy="62" rx="10" ry="5" fill="#ff0077" opacity="0.4" />
                  </svg>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-12 rounded-full" style={{background: `radial-gradient(ellipse, ${_shipColor}60 0%, transparent 70%)`, filter: 'blur(6px)'}} />
                </div>
              </div>

              {/* Controls row */}
              <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono text-zinc-400 mb-5">
                <span className="rounded-lg border border-zinc-700 bg-zinc-900/90 px-2.5 py-1">WASD / Arrows — Steer</span>
                <span className="rounded-lg border border-zinc-700 bg-zinc-900/90 px-2.5 py-1">SPACE — Fire Blasters</span>
                <span className="rounded-lg border border-cyan-500/40 bg-cyan-950/50 px-2.5 py-1 text-cyan-300">B / E — EMP Shockwave</span>
                <span className="rounded-lg border border-amber-500/30 bg-amber-950/30 px-2.5 py-1 text-amber-300">❄️ Cryo — Freeze Overheat</span>
              </div>

              {/* Launch button */}
              <button
                onClick={startGame}
                className="relative z-10 group flex items-center gap-3 rounded-2xl px-10 py-4 text-sm font-black text-white transition-all hover:scale-105 active:scale-95"
                style={{background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', boxShadow: '0 0 40px rgba(6,182,212,0.5), 0 4px 30px rgba(0,0,0,0.5)'}}
              >
                <Play className="w-5 h-5 fill-current" />
                <span className="tracking-wider">LAUNCH MISSION</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* High score */}
              {highScore > 0 && (
                <div className="relative z-10 mt-4 flex items-center gap-2 text-xs font-mono text-amber-400">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Personal Best: {highScore.toLocaleString()} pts</span>
                </div>
              )}
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onTouchMove={handleTouchMove}
            className="h-full w-full object-contain cursor-crosshair touch-none"
          />

        {/* Paused Overlay */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-sm space-y-4">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">SIMULATION PAUSED</div>
            <h3 className="text-3xl font-black text-white">MISSION ON STANDBY</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setGameState('playing')}
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-2.5 text-xs font-bold text-zinc-950 hover:bg-cyan-400"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Flight</span>
              </button>
              <button
                onClick={startGame}
                className="flex items-center gap-2 rounded-xl bg-zinc-800 px-6 py-2.5 text-xs font-semibold text-white hover:bg-zinc-700"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart</span>
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center backdrop-blur-md space-y-4">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-rose-500">HULL DESTROYED</div>
            <h3 className="text-4xl font-black text-white">MISSION TERMINATED</h3>
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 w-full max-w-sm">
              <div className="text-xs text-zinc-400 font-mono">FINAL SCORE</div>
              <div className="text-3xl font-black font-mono text-cyan-400">{score.toLocaleString()}</div>
              <div className="text-xs text-emerald-400 font-bold mt-1">
                +{Math.floor(score / 100)} XP Earned • Sector {wave} Reached
              </div>
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
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 text-xs font-bold text-white shadow-lg hover:opacity-90"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Watch Short Ad to Revive (+1 Hull & EMPs)</span>
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

      {/* Mobile Touch Action Pad */}
      {gameState === 'playing' && (
        <div className="flex sm:hidden items-center justify-between gap-3 pt-2">
          <button
            onTouchStart={() => {
              keysRef.current['Space'] = true;
            }}
            onTouchEnd={() => {
              keysRef.current['Space'] = false;
            }}
            onMouseDown={() => {
              keysRef.current['Space'] = true;
            }}
            onMouseUp={() => {
              keysRef.current['Space'] = false;
            }}
            disabled={isOverheated}
            className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider ${
              isOverheated
                ? 'bg-rose-900 text-rose-300 border border-rose-700 animate-pulse'
                : 'bg-cyan-500 text-zinc-950 active:bg-cyan-400'
            }`}
          >
            {isOverheated ? '🔥 Overheated' : '🔥 Fire Blasters'}
          </button>
          <button
            onClick={triggerEMP}
            disabled={empCharges <= 0}
            className="flex-1 py-3.5 rounded-xl bg-purple-600 font-black text-xs text-white active:bg-purple-500 disabled:opacity-40 uppercase tracking-wider"
          >
            💥 EMP Bomb ({empCharges})
          </button>
        </div>
      )}

      {/* Modals */}
      <RewardedAdModal
        isOpen={showRewardedAd}
        onClose={() => setShowRewardedAd(false)}
        onRewardEarned={handleRewardedAdRevive}
        rewardDescription="Revive starship with +1 Life, 100% Shield & 2 EMPs!"
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Claim & Save Your Leaderboard Score"
        onSuccess={() => {
          setIsScoreSubmitted(true);
          confetti({ particleCount: 80, spread: 60 });
          if (onScoreSubmitted) onScoreSubmitted(score);
        }}
      />
    </div>
  );
}
