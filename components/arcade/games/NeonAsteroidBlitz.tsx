'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Maximize2, Shield, Flame, Sparkles, Trophy, Zap, AlertTriangle } from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { RewardedAdModal } from '@/components/monetization/RewardedAdModal';
import { AuthModal } from '@/components/auth/AuthModal';
import confetti from 'canvas-confetti';

interface NeonAsteroidBlitzProps {
  gameId: string;
  gameTitle: string;
  onScoreSubmitted?: (score: number) => void;
}

// Advanced Multi-Channel Audio Synthesizer
class SpaceSynthEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playLaser(tier: number = 1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = tier >= 3 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(tier === 1 ? 880 : tier === 2 ? 1100 : 1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {}
  }

  playExplosion(type: 'small' | 'medium' | 'boss') {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const dur = type === 'boss' ? 0.6 : type === 'medium' ? 0.35 : 0.2;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(type === 'boss' ? 80 : 160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + dur);
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
      osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch {}
  }

  playPowerup() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.04 + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.04);
        osc.stop(this.ctx.currentTime + i * 0.04 + 0.08);
      });
    } catch {}
  }
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
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
}

interface BossEnemy {
  x: number;
  y: number;
  vx: number;
  radius: number;
  hp: number;
  maxHp: number;
  beamCharging: boolean;
  beamTimer: number;
}

export function NeonAsteroidBlitzEngine({ gameId, gameTitle, onScoreSubmitted }: NeonAsteroidBlitzProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [shieldHealth, setShieldHealth] = useState(100);
  const [weaponTier, setWeaponTier] = useState(1);
  const [empCharges, setEmpCharges] = useState(2);
  const [wave, setWave] = useState(1);
  const [waveProgress, setWaveProgress] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showRewardedAd, setShowRewardedAd] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasUsedRevive, setHasUsedRevive] = useState(false);
  const [isScoreSubmitted, setIsScoreSubmitted] = useState(false);

  const soundRef = useRef<SpaceSynthEngine>(new SpaceSynthEngine());
  const animFrameIdRef = useRef<number | null>(null);

  // Entities
  const playerRef = useRef({
    x: 400,
    y: 520,
    vx: 0,
    vy: 0,
    radius: 20,
    speed: 7.5,
    tilt: 0,
  });

  const starsRef = useRef<{ x: number; y: number; size: number; speed: number; color: string }[]>([]);
  const bulletsRef = useRef<{ x: number; y: number; vx: number; vy: number; radius: number; color: string }[]>([]);
  const enemyBulletsRef = useRef<{ x: number; y: number; vx: number; vy: number; radius: number }[]>([]);
  const asteroidsRef = useRef<{
    x: number;
    y: number;
    radius: number;
    vx: number;
    vy: number;
    rot: number;
    vRot: number;
    type: 'magma' | 'iron' | 'crystal';
    color: string;
    hp: number;
    maxHp: number;
    points: number;
    size: 'large' | 'medium' | 'small';
  }[]>([]);
  const dronesRef = useRef<AlienDrone[]>([]);
  const bossRef = useRef<BossEnemy | null>(null);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }[]>([]);
  const powerupsRef = useRef<{ x: number; y: number; type: 'shield' | 'weapon' | 'emp' | 'score'; color: string }[]>([]);
  const floatTextsRef = useRef<FloatingText[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const lastShotRef = useRef<number>(0);
  const screenShakeRef = useRef<number>(0);
  const shockwavesRef = useRef<{ x: number; y: number; radius: number; maxRadius: number; color: string }[]>([]);

  // Init Parallax Stars
  useEffect(() => {
    starsRef.current = [];
    for (let i = 0; i < 120; i++) {
      starsRef.current.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        size: Math.random() < 0.2 ? 2.5 : Math.random() < 0.5 ? 1.5 : 1,
        speed: Math.random() * 2.5 + 0.5,
        color: Math.random() < 0.3 ? '#38bdf8' : Math.random() < 0.5 ? '#c084fc' : '#ffffff',
      });
    }
  }, []);

  const addFloatText = (text: string, x: number, y: number, color = '#38bdf8') => {
    floatTextsRef.current.push({
      id: Date.now() + Math.random(),
      x,
      y,
      text,
      color,
      life: 45,
      vy: -1.4,
    });
  };

  const createShockwave = (x: number, y: number, color = '#38bdf8') => {
    shockwavesRef.current.push({ x, y, radius: 10, maxRadius: 160, color });
  };

  const createExplosion = (x: number, y: number, color: string, count = 25, large = false) => {
    screenShakeRef.current = large ? 16 : 8;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * (large ? 8 : 5) + 1.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: large ? 50 : 30,
        maxLife: large ? 50 : 30,
        color,
        size: Math.random() * 4 + 2,
      });
    }
  };

  const spawnAsteroid = useCallback((forcedSize?: 'large' | 'medium' | 'small', posX?: number, posY?: number) => {
    const size = forcedSize || (Math.random() > 0.6 ? 'large' : Math.random() > 0.5 ? 'medium' : 'small');
    const radius = size === 'large' ? 36 : size === 'medium' ? 22 : 14;
    const types: ('magma' | 'iron' | 'crystal')[] = ['magma', 'iron', 'crystal'];
    const type = types[Math.floor(Math.random() * types.length)];
    const hp = (type === 'iron' ? 3 : 1) * (size === 'large' ? 3 : size === 'medium' ? 2 : 1);
    const color = type === 'magma' ? '#f97316' : type === 'iron' ? '#94a3b8' : '#38bdf8';
    const points = (size === 'large' ? 150 : size === 'medium' ? 300 : 600) * (type === 'crystal' ? 2 : 1);

    const x = posX !== undefined ? posX : Math.random() * 740 + 30;
    const y = posY !== undefined ? posY : -50;
    const speed = (size === 'large' ? 1.6 : size === 'medium' ? 2.5 : 3.6) + Math.random() * 0.6;
    const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.6;

    asteroidsRef.current.push({
      x,
      y,
      radius,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.06,
      type,
      color,
      hp,
      maxHp: hp,
      points,
      size,
    });
  }, []);

  const spawnAlienDrone = useCallback(() => {
    dronesRef.current.push({
      x: Math.random() * 600 + 100,
      y: -40,
      vx: (Math.random() - 0.5) * 3,
      vy: 2.2,
      radius: 18,
      hp: 5,
      maxHp: 5,
      lastShot: Date.now() + 1000,
    });
  }, []);

  const triggerEMP = useCallback(() => {
    if (empCharges <= 0) return;
    setEmpCharges((c) => c - 1);
    soundRef.current.playEMP();
    createShockwave(playerRef.current.x, playerRef.current.y, '#38bdf8');
    screenShakeRef.current = 24;

    asteroidsRef.current.forEach((ast) => {
      createExplosion(ast.x, ast.y, ast.color, 30, true);
      setScore((s) => s + ast.points);
      addFloatText(`+${ast.points}`, ast.x, ast.y, '#38bdf8');
    });
    asteroidsRef.current = [];

    dronesRef.current.forEach((d) => {
      createExplosion(d.x, d.y, '#ef4444', 30, true);
      setScore((s) => s + 800);
      addFloatText('+800 EMP KILL', d.x, d.y, '#ef4444');
    });
    dronesRef.current = [];
    enemyBulletsRef.current = [];
  }, [empCharges]);

  // Main 60 FPS Game Loop
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const player = playerRef.current;
    const now = Date.now();

    ctx.save();

    // 1. Camera Screen Shake
    if (screenShakeRef.current > 0) {
      const dx = (Math.random() - 0.5) * screenShakeRef.current;
      const dy = (Math.random() - 0.5) * screenShakeRef.current;
      ctx.translate(dx, dy);
      screenShakeRef.current *= 0.88;
      if (screenShakeRef.current < 0.4) screenShakeRef.current = 0;
    }

    // 2. Cinematic Deep Space Background & Nebula
    ctx.fillStyle = '#050713';
    ctx.fillRect(0, 0, width, height);

    // Nebula clouds
    const grad1 = ctx.createRadialGradient(200, 200, 20, 200, 200, 350);
    grad1.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
    grad1.addColorStop(1, 'transparent');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, width, height);

    const grad2 = ctx.createRadialGradient(650, 450, 20, 650, 450, 300);
    grad2.addColorStop(0, 'rgba(192, 132, 252, 0.08)');
    grad2.addColorStop(1, 'transparent');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, width, height);

    // 3. Parallax Starfield
    starsRef.current.forEach((st) => {
      st.y += st.speed;
      if (st.y > height) {
        st.y = 0;
        st.x = Math.random() * width;
      }
      ctx.fillStyle = st.color;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Shockwaves
    for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
      const sw = shockwavesRef.current[i];
      sw.radius += 8;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = Math.max(1, (1 - sw.radius / sw.maxRadius) * 6);
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();

      if (sw.radius >= sw.maxRadius) shockwavesRef.current.splice(i, 1);
    }

    // 5. Player Physics & Input
    let moveX = 0;
    let moveY = 0;
    if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) moveX -= 1;
    if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) moveX += 1;
    if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) moveY -= 1;
    if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) moveY += 1;

    player.vx = player.vx * 0.85 + moveX * player.speed * 0.15;
    player.vy = player.vy * 0.85 + moveY * player.speed * 0.15;
    player.x += player.vx;
    player.y += player.vy;

    player.tilt = player.tilt * 0.8 + moveX * 0.25;

    player.x = Math.max(25, Math.min(width - 25, player.x));
    player.y = Math.max(50, Math.min(height - 40, player.y));

    // Player Shooting
    const fireInterval = weaponTier >= 3 ? 120 : weaponTier === 2 ? 160 : 200;
    if (keysRef.current['Space'] && now - lastShotRef.current > fireInterval) {
      soundRef.current.playLaser(weaponTier);
      lastShotRef.current = now;

      if (weaponTier === 1) {
        bulletsRef.current.push({ x: player.x, y: player.y - 20, vx: 0, vy: -12, radius: 4, color: '#38bdf8' });
      } else if (weaponTier === 2) {
        bulletsRef.current.push({ x: player.x - 10, y: player.y - 15, vx: -1, vy: -13, radius: 4, color: '#38bdf8' });
        bulletsRef.current.push({ x: player.x + 10, y: player.y - 15, vx: 1, vy: -13, radius: 4, color: '#38bdf8' });
      } else {
        bulletsRef.current.push({ x: player.x, y: player.y - 22, vx: 0, vy: -14, radius: 5, color: '#f43f5e' });
        bulletsRef.current.push({ x: player.x - 14, y: player.y - 12, vx: -2.5, vy: -12, radius: 4, color: '#fbbf24' });
        bulletsRef.current.push({ x: player.x + 14, y: player.y - 12, vx: 2.5, vy: -12, radius: 4, color: '#fbbf24' });
      }
    }

    // Engine Thrusters Particle Jet
    for (let i = 0; i < 2; i++) {
      particlesRef.current.push({
        x: player.x + (Math.random() - 0.5) * 8,
        y: player.y + 20,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 4 + 4,
        life: 14,
        maxLife: 14,
        color: '#38bdf8',
        size: Math.random() * 3 + 2,
      });
    }

    // Draw Player Starship
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.tilt);

    // Ship Hull
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(18, 18);
    ctx.lineTo(8, 14);
    ctx.lineTo(0, 20);
    ctx.lineTo(-8, 14);
    ctx.lineTo(-18, 18);
    ctx.closePath();
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = weaponTier >= 3 ? '#f43f5e' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = weaponTier >= 3 ? '#f43f5e' : '#38bdf8';
    ctx.stroke();

    // Energy Cockpit
    ctx.beginPath();
    ctx.arc(0, -2, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.fill();

    // Shield Aura
    if (shieldHealth > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(52, 211, 153, ${shieldHealth / 100})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 18;
      ctx.stroke();
    }
    ctx.restore();

    // Bullets
    for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
      const b = bulletsRef.current[i];
      b.x += b.vx;
      b.y += b.vy;

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.shadowBlur = 14;
      ctx.shadowColor = b.color;
      ctx.fill();

      if (b.y < -20) bulletsRef.current.splice(i, 1);
    }

    // Alien Drone Management
    if (wave >= 2 && Math.random() < 0.012 && dronesRef.current.length < 3) {
      spawnAlienDrone();
    }

    for (let i = dronesRef.current.length - 1; i >= 0; i--) {
      const drone = dronesRef.current[i];
      drone.x += drone.vx;
      drone.y += drone.vy;
      if (drone.x < 50 || drone.x > width - 50) drone.vx *= -1;

      // Shoot at player
      if (now > drone.lastShot) {
        enemyBulletsRef.current.push({
          x: drone.x,
          y: drone.y + 15,
          vx: (player.x - drone.x) / 50,
          vy: 5,
          radius: 4,
        });
        drone.lastShot = now + 2000;
      }

      // Draw Alien Drone
      ctx.save();
      ctx.translate(drone.x, drone.y);
      ctx.beginPath();
      ctx.arc(0, 0, drone.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#1e1014';
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ef4444';
      ctx.stroke();

      // Drone Eye
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.restore();

      // Bullet hit on drone
      for (let j = bulletsRef.current.length - 1; j >= 0; j--) {
        const b = bulletsRef.current[j];
        if (Math.hypot(b.x - drone.x, b.y - drone.y) < drone.radius + b.radius) {
          bulletsRef.current.splice(j, 1);
          drone.hp -= 1;
          createExplosion(drone.x, drone.y, '#ef4444', 8);

          if (drone.hp <= 0) {
            createExplosion(drone.x, drone.y, '#ef4444', 30, true);
            soundRef.current.playExplosion('medium');
            setScore((s) => s + 750);
            addFloatText('+750 DRONE DESTROYED', drone.x, drone.y, '#ef4444');
            dronesRef.current.splice(i, 1);
            break;
          }
        }
      }

      if (drone.y > height + 40) dronesRef.current.splice(i, 1);
    }

    // Enemy Bullets
    for (let i = enemyBulletsRef.current.length - 1; i >= 0; i--) {
      const eb = enemyBulletsRef.current[i];
      eb.x += eb.vx;
      eb.y += eb.vy;

      ctx.beginPath();
      ctx.arc(eb.x, eb.y, eb.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ef4444';
      ctx.fill();

      // Hit player
      if (Math.hypot(eb.x - player.x, eb.y - player.y) < eb.radius + player.radius) {
        enemyBulletsRef.current.splice(i, 1);
        screenShakeRef.current = 14;
        createExplosion(player.x, player.y, '#ef4444', 20);

        if (shieldHealth > 0) {
          setShieldHealth((sh) => Math.max(0, sh - 40));
        } else {
          setLives((l) => {
            const nxt = l - 1;
            if (nxt <= 0) setGameState('gameover');
            return nxt;
          });
        }
      }

      if (eb.y > height + 20) enemyBulletsRef.current.splice(i, 1);
    }

    // Asteroids
    if (Math.random() < 0.038) spawnAsteroid();

    for (let i = asteroidsRef.current.length - 1; i >= 0; i--) {
      const ast = asteroidsRef.current[i];
      ast.x += ast.vx;
      ast.y += ast.vy;
      ast.rot += ast.vRot;

      ctx.save();
      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.rot);

      ctx.beginPath();
      const spikes = 7;
      for (let s = 0; s < spikes; s++) {
        const rad = (s / spikes) * Math.PI * 2;
        const dist = ast.radius * (s % 2 === 0 ? 1 : 0.75);
        const px = Math.cos(rad) * dist;
        const py = Math.sin(rad) * dist;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = ast.color;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 14;
      ctx.shadowColor = ast.color;
      ctx.stroke();
      ctx.restore();

      // Bullet hit
      for (let j = bulletsRef.current.length - 1; j >= 0; j--) {
        const b = bulletsRef.current[j];
        if (Math.hypot(b.x - ast.x, b.y - ast.y) < ast.radius + b.radius) {
          bulletsRef.current.splice(j, 1);
          ast.hp -= 1;
          createExplosion(ast.x, ast.y, ast.color, 8);

          if (ast.hp <= 0) {
            createExplosion(ast.x, ast.y, ast.color, ast.size === 'large' ? 26 : 14, ast.size === 'large');
            soundRef.current.playExplosion(ast.size === 'large' ? 'medium' : 'small');
            setScore((s) => s + ast.points);
            addFloatText(`+${ast.points}`, ast.x, ast.y, ast.color);

            // Split
            if (ast.size === 'large') {
              spawnAsteroid('medium', ast.x - 15, ast.y);
              spawnAsteroid('medium', ast.x + 15, ast.y);
            } else if (ast.size === 'medium') {
              spawnAsteroid('small', ast.x, ast.y);
            }

            // Powerup drop
            if (Math.random() < 0.16) {
              const types: ('shield' | 'weapon' | 'emp' | 'score')[] = ['shield', 'weapon', 'emp', 'score'];
              const type = types[Math.floor(Math.random() * types.length)];
              const colors = { shield: '#34d399', weapon: '#f43f5e', emp: '#38bdf8', score: '#fbbf24' };
              powerupsRef.current.push({ x: ast.x, y: ast.y, type, color: colors[type] });
            }

            asteroidsRef.current.splice(i, 1);
            break;
          }
        }
      }

      // Player Collision
      if (Math.hypot(player.x - ast.x, player.y - ast.y) < ast.radius + player.radius) {
        asteroidsRef.current.splice(i, 1);
        screenShakeRef.current = 18;
        createExplosion(ast.x, ast.y, '#f43f5e', 30, true);

        if (shieldHealth > 0) {
          setShieldHealth((sh) => Math.max(0, sh - 50));
          soundRef.current.playExplosion('small');
        } else {
          soundRef.current.playExplosion('medium');
          setLives((l) => {
            const nextLives = l - 1;
            if (nextLives <= 0) setGameState('gameover');
            return nextLives;
          });
        }
      }

      if (ast.y > height + 60) asteroidsRef.current.splice(i, 1);
    }

    // Powerups
    for (let i = powerupsRef.current.length - 1; i >= 0; i--) {
      const p = powerupsRef.current[i];
      p.y += 2.2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 18;
      ctx.shadowColor = p.color;
      ctx.stroke();

      ctx.fillStyle = p.color;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.type === 'shield' ? '🛡️' : p.type === 'weapon' ? '⚡' : p.type === 'emp' ? '💥' : '💎', p.x, p.y);
      ctx.restore();

      if (Math.hypot(player.x - p.x, player.y - p.y) < 16 + player.radius) {
        soundRef.current.playPowerup();
        if (p.type === 'shield') {
          setShieldHealth(100);
          addFloatText('SHIELD OVERCHARGED', player.x, player.y, '#34d399');
        } else if (p.type === 'weapon') {
          setWeaponTier((w) => Math.min(3, w + 1));
          addFloatText('WEAPONS UPGRADED!', player.x, player.y, '#f43f5e');
        } else if (p.type === 'emp') {
          setEmpCharges((e) => e + 1);
          addFloatText('+1 EMP BOMB', player.x, player.y, '#38bdf8');
        } else if (p.type === 'score') {
          setScore((s) => s + 1000);
          addFloatText('+1,000 BONUS GEM', player.x, player.y, '#fbbf24');
        }
        powerupsRef.current.splice(i, 1);
      }

      if (p.y > height + 40) powerupsRef.current.splice(i, 1);
    }

    // Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const prt = particlesRef.current[i];
      prt.x += prt.vx;
      prt.y += prt.vy;
      prt.life -= 1;

      ctx.beginPath();
      ctx.arc(prt.x, prt.y, (prt.life / prt.maxLife) * prt.size, 0, Math.PI * 2);
      ctx.fillStyle = prt.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = prt.color;
      ctx.fill();

      if (prt.life <= 0) particlesRef.current.splice(i, 1);
    }

    // Floating Texts
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

    ctx.restore();

    if (gameState === 'playing') {
      animFrameIdRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, shieldHealth, weaponTier, spawnAsteroid, spawnAlienDrone]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'KeyB' || e.code === 'KeyE') triggerEMP();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [triggerEMP]);

  useEffect(() => {
    if (gameState === 'playing') {
      animFrameIdRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [gameState, gameLoop]);

  const startGame = () => {
    setScore(0);
    setLives(3);
    setShieldHealth(100);
    setWeaponTier(1);
    setEmpCharges(2);
    setWave(1);
    setHasUsedRevive(false);
    setIsScoreSubmitted(false);
    playerRef.current.x = 400;
    playerRef.current.y = 520;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    bulletsRef.current = [];
    enemyBulletsRef.current = [];
    asteroidsRef.current = [];
    dronesRef.current = [];
    particlesRef.current = [];
    powerupsRef.current = [];
    floatTextsRef.current = [];
    setGameState('playing');
  };

  const handleRewardedAdRevive = () => {
    setLives(1);
    setShieldHealth(100);
    setEmpCharges(2);
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
    <div className="relative w-full overflow-hidden rounded-2xl border border-cyan-500/40 bg-zinc-950 p-4 shadow-2xl space-y-3">
      {/* Dynamic Cyberpunk HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-zinc-900/90 p-3 border border-zinc-800">
        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400">Score</span>
          <div className="text-xl font-black font-mono text-cyan-400">{score.toLocaleString()}</div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400">Shields</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-3 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
              <div className="h-full bg-emerald-400 transition-all" style={{ width: `${shieldHealth}%` }} />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">{shieldHealth}%</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400">Weapon & Bombs</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="rounded bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-xs font-bold text-rose-300 font-mono">
              Tier {weaponTier}
            </span>
            <span className="rounded bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-xs font-bold text-cyan-300 font-mono">
              {empCharges} EMP [B]
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <span
                key={i}
                className={`h-4 w-4 rounded transition-all ${
                  i < lives ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-zinc-800'
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

      {/* HTML5 Canvas Frame */}
      <div className="relative aspect-[4/3] w-full max-h-[580px] overflow-hidden rounded-xl border border-zinc-800 bg-black">
        <canvas ref={canvasRef} width={800} height={600} className="h-full w-full object-contain cursor-crosshair" />

        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-sm">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-mono font-semibold text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ARCADE VECTOR SPACE SHOOTER: OVERDRIVE</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">{gameTitle}</h3>
            <p className="mt-2 max-w-md text-xs text-zinc-400 leading-relaxed">
              Use <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-white">WASD / Arrows</kbd> to maneuver your starship, <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-white">SPACE</kbd> to fire, and <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-white">B / E</kbd> for Smart EMP Shockwaves. Collect weapon powerups to upgrade blasters to spread fire!
            </p>
            <button
              onClick={startGame}
              className="mt-6 flex items-center gap-2 rounded-xl bg-cyan-500 px-8 py-3.5 text-sm font-bold text-zinc-950 shadow-xl shadow-cyan-500/30 hover:bg-cyan-400 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Mission</span>
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center backdrop-blur-md space-y-4">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-rose-500">HULL DESTROYED</div>
            <h3 className="text-4xl font-black text-white">MISSION TERMINATED</h3>
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 w-full max-w-sm">
              <div className="text-xs text-zinc-400 font-mono">FINAL SCORE</div>
              <div className="text-3xl font-black font-mono text-cyan-400">{score.toLocaleString()}</div>
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
