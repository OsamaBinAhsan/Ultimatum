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
  Zap,
  ShieldAlert,
  Clock,
  Share2,
  Check,
  Award,
  Maximize2,
  Minimize2,
  Pause,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { RewardedAdModal } from '@/components/monetization/RewardedAdModal';
import { AuthModal } from '@/components/auth/AuthModal';
import confetti from 'canvas-confetti';

interface CyberSlicerProps {
  gameId: string;
  gameTitle: string;
  onScoreSubmitted?: (score: number) => void;
}

// ---------------------------------------------------------------------------
// Blade Weapon Arsenal Types & Definitions
// ---------------------------------------------------------------------------
type BladeType = 'katana' | 'plasma' | 'thunder' | 'void';

interface BladeConfig {
  id: BladeType;
  name: string;
  color: string;
  coreColor: string;
  secondaryColor: string;
  icon: string;
  description: string;
  bonusText: string;
}

const BLADES: Record<BladeType, BladeConfig> = {
  katana: {
    id: 'katana',
    name: 'Cyber Katana',
    color: '#ec4899',
    coreColor: '#ffffff',
    secondaryColor: '#06b6d4',
    icon: '🗡️',
    description: 'Balanced hyper-carbon neon katana forged for precision cutting.',
    bonusText: 'Balanced Precision • Standard Blade',
  },
  plasma: {
    id: 'plasma',
    name: 'Plasma Edge',
    color: '#06b6d4',
    coreColor: '#ffffff',
    secondaryColor: '#3b82f6',
    icon: '⚡',
    description: 'Thermal plasma arc that prolongs Chrono Slowdown duration.',
    bonusText: '+35% Chrono Time Dilation Duration',
  },
  thunder: {
    id: 'thunder',
    name: 'Thunder Cleaver',
    color: '#eab308',
    coreColor: '#fef08a',
    secondaryColor: '#f97316',
    icon: '⚡',
    description: 'High-voltage electrified edge that supercharges combo score multipliers.',
    bonusText: '+25% Combo Bonus Multipliers',
  },
  void: {
    id: 'void',
    name: 'Void Reaper',
    color: '#a855f7',
    coreColor: '#f3e8ff',
    secondaryColor: '#ec4899',
    icon: '🌌',
    description: 'Dark-matter scythe that charges Overdrive Frenzy 40% faster.',
    bonusText: '+40% Faster Overdrive Meter Charge',
  },
};

type GameMode = 'survival' | 'blitz' | 'zen';

// ---------------------------------------------------------------------------
// Polyphonic Space Synthesizer (Katana Audio Engine)
// ---------------------------------------------------------------------------
class KatanaSynthAudio {
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

  playSlice(blade: BladeType = 'katana', combo = 1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (blade === 'thunder') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1800 + combo * 100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.1);
      } else if (blade === 'plasma') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1600 + combo * 120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.08);
      } else if (blade === 'void') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(950 + combo * 80, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.12);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400 + combo * 100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(250, this.ctx.currentTime + 0.09);
      }

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {}
  }

  playCriticalSlice() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch {}
  }

  playBomb() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(90, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch {}
  }

  playOverdriveStart() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      [330, 440, 660, 880, 1320].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.04);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.04 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.04);
        osc.stop(this.ctx.currentTime + i * 0.04 + 0.15);
      });
    } catch {}
  }

  playBossAlarm() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      [0, 0.14, 0.28].forEach((delay) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(480, this.ctx.currentTime + delay);
        osc.frequency.linearRampToValueAtTime(960, this.ctx.currentTime + delay + 0.1);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + 0.12);
      });
    } catch {}
  }
}

// ---------------------------------------------------------------------------
// Physical Angular Sliced Halves
// ---------------------------------------------------------------------------
interface AngularSlicedHalf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  side: 1 | -1;
  rot: number;
  vRot: number;
  color: string;
  life: number;
  maxLife: number;
}

interface CyberNode {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  type: 'data' | 'hardened' | 'chrono' | 'bomb' | 'golden' | 'boss_firewall';
  hp: number;
  maxHp: number;
  points: number;
  rot: number;
  vRot: number;
  pulse?: number;
}

export function CyberSlicerEngine({ gameId, gameTitle, onScoreSubmitted }: CyberSlicerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // High-Level Game State
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
  const [gameMode, setGameMode] = useState<GameMode>('survival');
  const [selectedBlade, setSelectedBlade] = useState<BladeType>('katana');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [blitzTimeLeft, setBlitzTimeLeft] = useState(60);

  // Overdrive Frenzy Gauge (0% to 100%)
  const [overdrivePct, setOverdrivePct] = useState(0);
  const [overdriveActive, setOverdriveActive] = useState(false);
  const [overdriveTimeLeft, setOverdriveTimeLeft] = useState(0);

  const [bulletTime, setBulletTime] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRewardedAd, setShowRewardedAd] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasUsedRevive, setHasUsedRevive] = useState(false);
  const [isScoreSubmitted, setIsScoreSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const soundRef = useRef<KatanaSynthAudio>(new KatanaSynthAudio());
  const animFrameRef = useRef<number | null>(null);
  const isPointerDownRef = useRef<boolean>(false);

  // Entities & Vectors
  const trailRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const nodesRef = useRef<CyberNode[]>([]);
  const slicedHalvesRef = useRef<AngularSlicedHalf[]>([]);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[]>([]);
  const floatTextsRef = useRef<{ id: number; x: number; y: number; text: string; color: string; life: number; vy: number; scale?: number }[]>([]);
  const screenShakeRef = useRef<number>(0);
  const hitStopTimerRef = useRef<number>(0);
  const nextSpawnTimeRef = useRef<number>(0);
  const nextBossTimeRef = useRef<number>(0);
  const consecutiveSlicesRef = useRef<number>(0);
  const comboResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Load High Score
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ultimatum_highscore_${gameId}_${gameMode}`);
      if (saved) setHighScore(parseInt(saved, 10));
    } catch {}
  }, [gameId, gameMode]);

  const addFloatText = (text: string, x: number, y: number, color = '#ec4899', scale = 1) => {
    floatTextsRef.current.push({
      id: Date.now() + Math.random(),
      x,
      y,
      text,
      color,
      life: 45,
      vy: -1.6,
      scale,
    });
  };

  const createSparks = (x: number, y: number, color: string, count = 20, large = false) => {
    screenShakeRef.current = Math.max(screenShakeRef.current, large ? 12 : 5);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * (large ? 8 : 5.5) + 1.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: large ? 35 : 22,
        color,
        size: Math.random() * (large ? 4 : 2.5) + 1.2,
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Spawn Waves (Including Overdrive Storms & Boss Firewall Mega-Cores)
  // ---------------------------------------------------------------------------
  const spawnWave = useCallback(() => {
    const isOverdrive = overdriveActive;
    const count = isOverdrive ? Math.floor(Math.random() * 4) + 4 : Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < count; i++) {
      const r = Math.random();
      const allowBombs = gameMode === 'survival';
      const type: CyberNode['type'] = isOverdrive
        ? r < 0.75
          ? 'golden'
          : 'data'
        : allowBombs && r < 0.18
        ? 'bomb'
        : r < 0.35
        ? 'hardened'
        : r < 0.45
        ? 'chrono'
        : r < 0.65
        ? 'golden'
        : 'data';

      const colors: Record<CyberNode['type'], string> = {
        data: '#06b6d4',
        hardened: '#8b5cf6',
        chrono: '#3b82f6',
        bomb: '#ef4444',
        golden: '#fbbf24',
        boss_firewall: '#f43f5e',
      };

      const points: Record<CyberNode['type'], number> = {
        data: 100,
        hardened: 350,
        chrono: 250,
        bomb: 0,
        golden: 600,
        boss_firewall: 5000,
      };

      const x = Math.random() * 600 + 100;
      const y = 620;
      const targetX = 400 + (Math.random() - 0.5) * 380;
      const vx = (targetX - x) / 55;
      const vy = -(Math.random() * 4.5 + (isOverdrive ? 15 : 13.5));

      nodesRef.current.push({
        id: Date.now() + Math.random(),
        x,
        y,
        vx,
        vy,
        radius: type === 'bomb' ? 26 : type === 'golden' ? 20 : type === 'hardened' ? 28 : 24,
        color: colors[type],
        type,
        hp: type === 'hardened' ? 2 : 1,
        maxHp: type === 'hardened' ? 2 : 1,
        points: points[type],
        rot: 0,
        vRot: (Math.random() - 0.5) * 0.12,
      });
    }
  }, [gameMode, overdriveActive]);

  const spawnBossFirewallCore = useCallback(() => {
    soundRef.current.playBossAlarm();
    screenShakeRef.current = 18;
    addFloatText('⚠️ FIREWALL MEGA-CORE DETECTED! ⚠️', 400, 200, '#f43f5e', 1.5);

    nodesRef.current.push({
      id: Date.now() + Math.random(),
      x: 400 + (Math.random() - 0.5) * 150,
      y: 630,
      vx: (Math.random() - 0.5) * 2.5,
      vy: -12.5,
      radius: 46,
      color: '#f43f5e',
      type: 'boss_firewall',
      hp: 4,
      maxHp: 4,
      points: 5000,
      rot: 0,
      vRot: 0.05,
      pulse: 0,
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Angular Vector Slicing Intersection & Physics
  // ---------------------------------------------------------------------------
  const checkSlashIntersection = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len < 6) return;

    const cutAngle = Math.atan2(dy, dx);
    const bladeConfig = BLADES[selectedBlade];

    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const node = nodesRef.current[i];
      const u = Math.max(0, Math.min(1, ((node.x - p1.x) * dx + (node.y - p1.y) * dy) / (len * len)));
      const closestX = p1.x + u * dx;
      const closestY = p1.y + u * dy;
      const dist = Math.hypot(node.x - closestX, node.y - closestY);

      if (dist < node.radius + 18) {
        node.hp -= 1;

        if (node.type === 'bomb') {
          soundRef.current.playBomb();
          createSparks(node.x, node.y, '#ef4444', 40, true);
          nodesRef.current.splice(i, 1);
          setLives((l) => {
            const next = l - 1;
            if (next <= 0) setGameState('gameover');
            return next;
          });
          consecutiveSlicesRef.current = 0;
          setCombo(0);
          break;
        }

        if (node.hp <= 0) {
          const isCritical = dist < 6;
          if (isCritical) {
            soundRef.current.playCriticalSlice();
            addFloatText('⚡ PERFECT CUT! 2X', node.x, node.y - 30, '#fbbf24', 1.4);
            hitStopTimerRef.current = 3;
          } else {
            soundRef.current.playSlice(selectedBlade, consecutiveSlicesRef.current);
          }

          createSparks(node.x, node.y, node.color, isCritical ? 40 : 25, node.type === 'boss_firewall');

          const pushSpd = isCritical ? 6.5 : 4.5;
          const perpAngle = cutAngle + Math.PI / 2;

          slicedHalvesRef.current.push({
            x: node.x - Math.cos(perpAngle) * 8,
            y: node.y - Math.sin(perpAngle) * 8,
            vx: -Math.cos(perpAngle) * pushSpd + node.vx * 0.4,
            vy: -Math.sin(perpAngle) * pushSpd + node.vy * 0.4 - 2,
            radius: node.radius,
            angle: cutAngle,
            side: -1,
            rot: 0,
            vRot: -0.16,
            color: node.color,
            life: 35,
            maxLife: 35,
          });

          slicedHalvesRef.current.push({
            x: node.x + Math.cos(perpAngle) * 8,
            y: node.y + Math.sin(perpAngle) * 8,
            vx: Math.cos(perpAngle) * pushSpd + node.vx * 0.4,
            vy: Math.sin(perpAngle) * pushSpd + node.vy * 0.4 - 2,
            radius: node.radius,
            angle: cutAngle,
            side: 1,
            rot: 0,
            vRot: 0.16,
            color: node.color,
            life: 35,
            maxLife: 35,
          });

          consecutiveSlicesRef.current += 1;
          const curCombo = consecutiveSlicesRef.current;
          setCombo(curCombo);
          setMaxCombo((m) => Math.max(m, curCombo));

          const comboMultiplier =
            selectedBlade === 'thunder' ? Math.floor(curCombo * 1.25) : curCombo;

          if (curCombo >= 5) {
            addFloatText(`🔥 ${curCombo}X SLICE STREAK!`, node.x, node.y - 20, bladeConfig.color, 1.3);
          } else {
            addFloatText(`+${node.points * comboMultiplier}`, node.x, node.y, node.color);
          }

          const chargeRate = selectedBlade === 'void' ? 1.4 : 1.0;
          const chargeAdd = (node.type === 'boss_firewall' ? 25 : node.type === 'golden' ? 6 : 3) * chargeRate;
          setOverdrivePct((prev) => Math.min(100, prev + chargeAdd));

          if (comboResetTimerRef.current) clearTimeout(comboResetTimerRef.current);
          comboResetTimerRef.current = setTimeout(() => {
            consecutiveSlicesRef.current = 0;
            setCombo(0);
          }, 850);

          if (node.type === 'chrono') {
            setBulletTime(true);
            const chronoDuration = selectedBlade === 'plasma' ? 5000 : 3500;
            setTimeout(() => setBulletTime(false), chronoDuration);
            addFloatText('⏱️ CHRONO DILATION', node.x, node.y, '#3b82f6', 1.3);
          }

          if (node.type === 'boss_firewall') {
            confetti({ particleCount: 120, spread: 80 });
            addFloatText('👑 FIREWALL DESTROYED! +5,000', node.x, node.y, '#f43f5e', 1.6);
          }

          const finalEarned = (node.points * comboMultiplier) * (isCritical ? 2 : 1);
          setScore((s) => {
            const next = s + finalEarned;
            if (next > highScore) setHighScore(next);
            return next;
          });

          nodesRef.current.splice(i, 1);
        } else {
          createSparks(node.x, node.y, node.color, 18);
          soundRef.current.playSlice(selectedBlade);
          addFloatText(`SHIELD BROKEN [${node.hp}/${node.maxHp}]`, node.x, node.y, node.color);
        }
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Main Engine Loop (High-Performance 60 FPS HTML5 Canvas)
  // ---------------------------------------------------------------------------
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 600;
    const now = performance.now();
    lastFrameTimeRef.current = now;

    if (hitStopTimerRef.current > 0) {
      hitStopTimerRef.current -= 1;
      animFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    ctx.save();

    if (screenShakeRef.current > 0) {
      const dx = (Math.random() - 0.5) * screenShakeRef.current;
      const dy = (Math.random() - 0.5) * screenShakeRef.current;
      ctx.translate(dx, dy);
      screenShakeRef.current *= 0.86;
      if (screenShakeRef.current < 0.3) screenShakeRef.current = 0;
    }

    // 1. Cyberpunk Neon Grid Arena
    const isOverdrive = overdriveActive;
    ctx.fillStyle = isOverdrive ? '#13091e' : '#060614';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = isOverdrive ? 'rgba(251, 191, 36, 0.18)' : 'rgba(236, 72, 153, 0.12)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Wave Spawner & Boss Timers (Only when playing)
    if (gameState === 'playing') {
      const spawnInterval = bulletTime ? 2200 : isOverdrive ? 650 : 1200;
      if (now > nextSpawnTimeRef.current) {
        spawnWave();
        nextSpawnTimeRef.current = now + (Math.random() * 600 + spawnInterval);
      }

      if (gameMode === 'survival' && now > nextBossTimeRef.current) {
        spawnBossFirewallCore();
        nextBossTimeRef.current = now + 45000;
      }
    }

    // 3. Update & Render Nodes
    const timeScale = bulletTime ? 0.35 : 1;
    const gravity = 0.38 * timeScale;

    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const node = nodesRef.current[i];
      node.x += node.vx * timeScale;
      node.y += node.vy * timeScale;
      node.vy += gravity;
      node.rot += node.vRot * timeScale;

      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.rotate(node.rot);

      if (node.type === 'bomb') {
        ctx.beginPath();
        ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#1e1014';
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠ BOMB', 0, 0);
      } else if (node.type === 'boss_firewall') {
        node.pulse = (node.pulse || 0) + 0.05;
        const ringRadius = node.radius + Math.sin(node.pulse) * 4;

        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(0, 0, node.radius - 8, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`FIREWALL [${node.hp}/${node.maxHp}]`, 0, 0);
      } else {
        ctx.beginPath();
        const sides = node.type === 'golden' ? 8 : 6;
        for (let s = 0; s < sides; s++) {
          const a = (s / sides) * Math.PI * 2;
          const px = Math.cos(a) * node.radius;
          const py = Math.sin(a) * node.radius;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.fillStyle = node.color;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          node.type === 'hardened'
            ? '2X CUT'
            : node.type === 'chrono'
            ? 'TIME'
            : node.type === 'golden'
            ? 'GOLD'
            : 'DATA',
          0,
          0
        );
      }
      ctx.restore();

      if (node.y > height + 70) nodesRef.current.splice(i, 1);
    }

    // 4. Update & Render Angular Severed Halves
    for (let i = slicedHalvesRef.current.length - 1; i >= 0; i--) {
      const h = slicedHalvesRef.current[i];
      h.x += h.vx;
      h.y += h.vy;
      h.vy += 0.48;
      h.rot += h.vRot;
      h.life -= 1;

      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.angle + h.rot);

      ctx.beginPath();
      if (h.side === -1) {
        ctx.arc(0, 0, h.radius, Math.PI / 2, (Math.PI * 3) / 2);
      } else {
        ctx.arc(0, 0, h.radius, -Math.PI / 2, Math.PI / 2);
      }
      ctx.closePath();
      ctx.fillStyle = '#090d1f';
      ctx.fill();
      ctx.strokeStyle = h.color;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -h.radius);
      ctx.lineTo(0, h.radius);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();

      if (h.life <= 0 || h.y > height + 70) slicedHalvesRef.current.splice(i, 1);
    }

    // 5. Clean & Draw Blade Trail
    trailRef.current = trailRef.current.filter((p) => now - p.time < 190);
    const bladeConfig = BLADES[selectedBlade];

    if (trailRef.current.length > 1) {
      for (let i = 1; i < trailRef.current.length; i++) {
        const p1 = trailRef.current[i - 1];
        const p2 = trailRef.current[i];
        const alpha = Math.max(0, 1 - (now - p2.time) / 190);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = isOverdrive ? `rgba(251, 191, 36, ${alpha})` : bladeConfig.color;
        ctx.lineWidth = (isOverdrive ? 12 : 8) * alpha;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = bladeConfig.coreColor;
        ctx.lineWidth = 3 * alpha;
        ctx.stroke();
        ctx.restore();

        if (gameState === 'playing') {
          checkSlashIntersection(p1, p2);
        }
      }
    }

    // 6. Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const prt = particlesRef.current[i];
      prt.x += prt.vx;
      prt.y += prt.vy;
      prt.life -= 1;

      ctx.beginPath();
      ctx.arc(prt.x, prt.y, Math.max(0.5, prt.size), 0, Math.PI * 2);
      ctx.fillStyle = prt.color;
      ctx.fill();

      if (prt.life <= 0) particlesRef.current.splice(i, 1);
    }

    // 7. Floating Texts
    for (let i = floatTextsRef.current.length - 1; i >= 0; i--) {
      const ft = floatTextsRef.current[i];
      ft.y += ft.vy;
      ft.life -= 1;

      ctx.save();
      ctx.font = `bold ${Math.round(14 * (ft.scale || 1))}px monospace`;
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();

      if (ft.life <= 0) floatTextsRef.current.splice(i, 1);
    }

    ctx.restore();

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, gameMode, selectedBlade, bulletTime, overdriveActive, spawnWave, spawnBossFirewallCore]);

  // Continuously run animation loop (draws ambient background even in idle)
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameLoop]);

  // ---------------------------------------------------------------------------
  // Blitz Timer & Overdrive Countdown
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (gameState === 'playing') {
      timer = setInterval(() => {
        if (gameMode === 'blitz') {
          setBlitzTimeLeft((t) => {
            if (t <= 1) {
              setGameState('gameover');
              return 0;
            }
            return t - 1;
          });
        }

        if (overdriveActive) {
          setOverdriveTimeLeft((t) => {
            if (t <= 1) {
              setOverdriveActive(false);
              return 0;
            }
            return t - 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameState, gameMode, overdriveActive]);

  const triggerOverdrive = useCallback(() => {
    if (overdrivePct < 100 || overdriveActive || gameState !== 'playing') return;
    setOverdrivePct(0);
    setOverdriveActive(true);
    setOverdriveTimeLeft(10);
    soundRef.current.playOverdriveStart();
    confetti({ particleCount: 140, spread: 90 });
    addFloatText('⚡ CYBER OVERDRIVE FRENZY ENGAGED! ⚡', 400, 250, '#fbbf24', 1.6);
  }, [overdrivePct, overdriveActive, gameState]);

  const startGame = () => {
    setScore(0);
    setLives(3);
    setCombo(0);
    setMaxCombo(0);
    setBulletTime(false);
    setBlitzTimeLeft(60);
    setOverdrivePct(0);
    setOverdriveActive(false);
    setOverdriveTimeLeft(0);
    setHasUsedRevive(false);
    setIsScoreSubmitted(false);

    nodesRef.current = [];
    slicedHalvesRef.current = [];
    particlesRef.current = [];
    trailRef.current = [];
    floatTextsRef.current = [];
    nextSpawnTimeRef.current = performance.now() + 600;
    nextBossTimeRef.current = performance.now() + 40000;
    lastFrameTimeRef.current = performance.now();

    setGameState('playing');
  };

  const addPointerPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 600 / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    trailRef.current.push({ x, y, time: performance.now() });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = true;
    addPointerPoint(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState === 'playing' || isPointerDownRef.current) {
      addPointerPoint(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      addPointerPoint(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleRewardedRevive = () => {
    setLives(1);
    setScore((s) => s + 500);
    setHasUsedRevive(true);
    setGameState('playing');
  };

  const handleSubmitScore = () => {
    if (isScoreSubmitted) return;
    try {
      localStorage.setItem(`ultimatum_highscore_${gameId}_${gameMode}`, score.toString());
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

  const handleShareChallenge = async () => {
    const challengeUrl = `${window.location.origin}/games/cyber-slicer?challenge_score=${score}&mode=${gameMode}`;
    const shareData = {
      title: '⚔️ Cyber Slicer Challenge on Ultimatum!',
      text: `I just sliced a score of ${score.toLocaleString()} on Cyber Slicer (${gameMode.toUpperCase()} mode)! Can you beat me?`,
      url: challengeUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(`${shareData.text} 👉 ${challengeUrl}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
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

  const getRankBadge = (pts: number) => {
    if (pts >= 25000) return { title: '🌌 S-TIER CYBER GOD', color: 'text-purple-400 border-purple-500' };
    if (pts >= 15000) return { title: '⚡ A-TIER NEON NINJA', color: 'text-cyan-400 border-cyan-500' };
    if (pts >= 8000) return { title: '🔥 B-TIER GRID RUNNER', color: 'text-amber-400 border-amber-500' };
    return { title: '🗡️ C-TIER SCRIPT KIDDIE', color: 'text-zinc-400 border-zinc-500' };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-pink-500/40 bg-zinc-950 p-4 shadow-2xl space-y-3 select-none"
    >
      {/* ---------------------------------------------------- */}
      {/* Game Mode & Blade Arsenal Selector Header            */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
        <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          {(['survival', 'blitz', 'zen'] as GameMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                if (gameState === 'idle') setGameMode(mode);
              }}
              disabled={gameState === 'playing'}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-lg uppercase transition-all ${
                gameMode === mode
                  ? 'bg-pink-500 text-zinc-950 shadow-md shadow-pink-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {mode === 'survival' ? '⚔️ Survival' : mode === 'blitz' ? '⏱️ 60s Blitz' : '🌸 Zen'}
            </button>
          ))}
        </div>

        {/* Blade Arsenal Picker */}
        <div className="flex items-center gap-1.5">
          {(Object.keys(BLADES) as BladeType[]).map((bKey) => {
            const b = BLADES[bKey];
            return (
              <button
                key={bKey}
                onClick={() => setSelectedBlade(bKey)}
                title={`${b.name}: ${b.bonusText}`}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                  selectedBlade === bKey
                    ? 'border-pink-500 bg-pink-500/20 text-pink-300'
                    : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-white'
                }`}
              >
                <span>{b.icon}</span>
                <span className="hidden sm:inline">{b.name}</span>
              </button>
            );
          })}
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
          <div className="text-xl font-black font-mono text-pink-400">{score.toLocaleString()}</div>
          <div className="text-[9px] font-mono text-zinc-500">BEST: {highScore.toLocaleString()}</div>
        </div>

        {/* Overdrive Frenzy Meter */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-zinc-400">Overdrive</span>
            <span
              className={`text-[10px] font-mono font-bold ${
                overdriveActive ? 'text-amber-300 animate-pulse' : overdrivePct >= 100 ? 'text-amber-400' : 'text-zinc-400'
              }`}
            >
              {overdriveActive ? `ACTIVE (${overdriveTimeLeft}s)` : overdrivePct >= 100 ? 'READY!' : `${overdrivePct}%`}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-3 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
              <div
                className={`h-full transition-all duration-100 ${
                  overdriveActive
                    ? 'bg-gradient-to-r from-amber-400 to-pink-500 animate-pulse'
                    : overdrivePct >= 100
                    ? 'bg-amber-400'
                    : 'bg-pink-500'
                }`}
                style={{ width: `${overdriveActive ? (overdriveTimeLeft / 10) * 100 : overdrivePct}%` }}
              />
            </div>
            {overdrivePct >= 100 && !overdriveActive && gameState === 'playing' && (
              <button
                onClick={triggerOverdrive}
                className="text-[9px] font-mono font-bold text-amber-300 bg-amber-500/30 border border-amber-400 px-1.5 py-0.5 rounded animate-pulse"
              >
                BURST
              </button>
            )}
          </div>
        </div>

        {/* Mode-Specific Status (Lives or Timer) */}
        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400">
            {gameMode === 'survival' ? 'Shield Lives' : gameMode === 'blitz' ? 'Time Remaining' : 'Zen Flow'}
          </span>
          <div className="flex items-center justify-between mt-1">
            {gameMode === 'survival' && (
              <div className="flex items-center gap-1.5">
                {[...Array(3)].map((_, i) => (
                  <span
                    key={i}
                    className={`h-4 w-4 rounded-md transition-all ${
                      i < lives ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-zinc-800'
                    }`}
                  />
                ))}
              </div>
            )}
            {gameMode === 'blitz' && (
              <span className="text-sm font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
                ⏱️ {blitzTimeLeft}s
              </span>
            )}
            {gameMode === 'zen' && (
              <span className="text-xs font-mono font-bold text-emerald-400">🌸 UNLIMITED</span>
            )}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400">Active Blade</span>
          <div className="text-xs font-mono font-bold text-pink-300 mt-1 flex items-center gap-1">
            <span>{BLADES[selectedBlade].icon}</span>
            <span>{BLADES[selectedBlade].name}</span>
          </div>
        </div>

        <div className="col-span-2 flex items-center justify-end gap-2">
          {gameState === 'playing' && (
            <button
              onClick={() => setGameState('paused')}
              className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-white"
              title="Pause Game"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          {gameState === 'paused' && (
            <button
              onClick={() => setGameState('playing')}
              className="rounded-lg bg-pink-500/20 border border-pink-500/40 p-2 text-pink-300 hover:bg-pink-500/30"
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
            {soundEnabled ? <Volume2 className="w-4 h-4 text-pink-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
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
      {/* HTML5 Canvas Arena                                   */}
      {/* ---------------------------------------------------- */}
      <div className="relative aspect-[4/3] w-full min-h-[420px] max-h-[580px] overflow-hidden rounded-xl border border-zinc-800 bg-black cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onTouchMove={handleTouchMove}
          className="h-full w-full object-contain touch-none"
        />

        {/* Start / Launch Overlay */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-sm">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pink-500/10 px-3.5 py-1 text-xs font-mono font-semibold text-pink-400 border border-pink-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CYBER SLICER 2.0: ANGULAR BLADE ENGINE</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">{gameTitle}</h3>
            <p className="mt-2 max-w-md text-xs text-zinc-400 leading-relaxed">
              Swipe rapidly across floating cyber-nodes to perform physical vector angle cuts! Fill your Overdrive meter for golden frenzies and avoid hazardous red bombs.
            </p>
            <button
              onClick={startGame}
              className="mt-6 flex items-center gap-2 rounded-xl bg-pink-500 px-8 py-3.5 text-sm font-bold text-zinc-950 shadow-xl shadow-pink-500/30 hover:bg-pink-400 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Slicing</span>
            </button>
          </div>
        )}

        {/* Paused Overlay */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-sm space-y-4">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-pink-400">GAME PAUSED</div>
            <h3 className="text-3xl font-black text-white">STANDBY</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setGameState('playing')}
                className="flex items-center gap-2 rounded-xl bg-pink-500 px-6 py-2.5 text-xs font-bold text-zinc-950 hover:bg-pink-400"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
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

        {/* Game Over Screen & Social Share Card */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center backdrop-blur-md space-y-4">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-rose-500">SIMULATION TERMINATED</div>
            <h3 className="text-4xl font-black text-white">CYBER RUN FINISHED</h3>

            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 w-full max-w-sm">
              <div className={`text-xs font-mono font-bold uppercase px-2 py-0.5 rounded border inline-block mb-2 ${getRankBadge(score).color}`}>
                {getRankBadge(score).title}
              </div>
              <div className="text-xs text-zinc-400 font-mono">FINAL SCORE</div>
              <div className="text-3xl font-black font-mono text-pink-400">{score.toLocaleString()}</div>
              <div className="text-xs text-zinc-400 mt-1 font-mono">
                Max Combo: <span className="text-amber-400 font-bold">{maxCombo}x</span> • Mode: <span className="uppercase text-white font-bold">{gameMode}</span>
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

              <button
                onClick={handleShareChallenge}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-3 text-xs font-bold text-white shadow-lg hover:opacity-90 transition-all"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Challenge Link Copied!' : 'Challenge a Friend (+Share)'}</span>
              </button>

              {!hasUsedRevive && gameMode === 'survival' && (
                <button
                  onClick={() => setShowRewardedAd(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-zinc-800 py-3 text-xs font-bold text-purple-300 border border-purple-500/40 hover:bg-zinc-700"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Watch Short Ad to Revive (+1 Life)</span>
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

      {/* Modals */}
      <RewardedAdModal
        isOpen={showRewardedAd}
        onClose={() => setShowRewardedAd(false)}
        onRewardEarned={handleRewardedRevive}
        rewardDescription="Revive star blade with +1 Life and +500 points!"
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Save Your Cyber Slicer Rank"
        onSuccess={() => {
          setIsScoreSubmitted(true);
          confetti({ particleCount: 80, spread: 60 });
          if (onScoreSubmitted) onScoreSubmitted(score);
        }}
      />
    </div>
  );
}
