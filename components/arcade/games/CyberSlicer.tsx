'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Flame, Sparkles, Trophy, Zap, ShieldAlert, Clock } from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { RewardedAdModal } from '@/components/monetization/RewardedAdModal';
import { AuthModal } from '@/components/auth/AuthModal';
import confetti from 'canvas-confetti';

interface CyberSlicerProps {
  gameId: string;
  gameTitle: string;
  onScoreSubmitted?: (score: number) => void;
}

class KatanaSynthAudio {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playSlice() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, this.ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
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
      osc.frequency.setValueAtTime(80, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch {}
  }

  playFever() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      [440, 554.37, 659.25, 880].forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.05 + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.05);
        osc.stop(this.ctx.currentTime + i * 0.05 + 0.1);
      });
    } catch {}
  }
}

interface SlicedHalf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rot: number;
  vRot: number;
  color: string;
  side: 'left' | 'right';
  life: number;
}

interface CyberNode {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  type: 'data' | 'hardened' | 'chrono' | 'bomb' | 'golden';
  hp: number;
  points: number;
  rot: number;
  vRot: number;
}

export function CyberSlicerEngine({ gameId, gameTitle, onScoreSubmitted }: CyberSlicerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [feverActive, setFeverActive] = useState(false);
  const [feverTimer, setFeverTimer] = useState(0);
  const [bulletTime, setBulletTime] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showRewardedAd, setShowRewardedAd] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasUsedRevive, setHasUsedRevive] = useState(false);
  const [isScoreSubmitted, setIsScoreSubmitted] = useState(false);

  const soundRef = useRef<KatanaSynthAudio>(new KatanaSynthAudio());
  const animFrameRef = useRef<number | null>(null);

  const trailRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const nodesRef = useRef<CyberNode[]>([]);
  const slicedHalvesRef = useRef<SlicedHalf[]>([]);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[]>([]);
  const floatTextsRef = useRef<{ id: number; x: number; y: number; text: string; color: string; life: number; vy: number }[]>([]);
  const nextSpawnTimeRef = useRef<number>(0);
  const consecutiveSlicesRef = useRef<number>(0);
  const comboResetTimerRef = useRef<NodeJS.Timeout | null>(null);

  const addFloatText = (text: string, x: number, y: number, color = '#ec4899') => {
    floatTextsRef.current.push({
      id: Date.now() + Math.random(),
      x,
      y,
      text,
      color,
      life: 40,
      vy: -1.8,
    });
  };

  const createSparks = (x: number, y: number, color: string, count = 20) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 7 + 2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 25,
        color,
        size: Math.random() * 3 + 1.5,
      });
    }
  };

  const spawnWave = useCallback(() => {
    const count = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < count; i++) {
      const r = Math.random();
      const type = r < 0.2 ? 'bomb' : r < 0.35 ? 'hardened' : r < 0.45 ? 'chrono' : r < 0.6 ? 'golden' : 'data';
      const colors = {
        data: '#06b6d4',
        hardened: '#8b5cf6',
        chrono: '#3b82f6',
        bomb: '#ef4444',
        golden: '#fbbf24',
      };
      const points = {
        data: 100,
        hardened: 300,
        chrono: 200,
        bomb: 0,
        golden: 500,
      };

      const x = Math.random() * 600 + 100;
      const y = 620;
      const targetX = 400 + (Math.random() - 0.5) * 350;
      const vx = (targetX - x) / 55;
      const vy = -(Math.random() * 4 + 14);

      nodesRef.current.push({
        id: Date.now() + Math.random(),
        x,
        y,
        vx,
        vy,
        radius: type === 'bomb' ? 26 : type === 'golden' ? 20 : 24,
        color: colors[type],
        type,
        hp: type === 'hardened' ? 2 : 1,
        points: points[type],
        rot: 0,
        vRot: (Math.random() - 0.5) * 0.12,
      });
    }
  }, []);

  const checkSlashIntersection = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len < 5) return;

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
          createSparks(node.x, node.y, '#ef4444', 35);
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
          soundRef.current.playSlice();
          createSparks(node.x, node.y, node.color, 30);

          // Spawn physical sliced halves
          slicedHalvesRef.current.push({
            x: node.x - 6,
            y: node.y,
            vx: -3.5,
            vy: -4,
            radius: node.radius,
            rot: 0,
            vRot: -0.15,
            color: node.color,
            side: 'left',
            life: 35,
          });
          slicedHalvesRef.current.push({
            x: node.x + 6,
            y: node.y,
            vx: 3.5,
            vy: -4,
            radius: node.radius,
            rot: 0,
            vRot: 0.15,
            color: node.color,
            side: 'right',
            life: 35,
          });

          // Combo tracking
          consecutiveSlicesRef.current += 1;
          const curCombo = consecutiveSlicesRef.current;
          setCombo(curCombo);
          setMaxCombo((m) => Math.max(m, curCombo));

          if (curCombo >= 5) {
            soundRef.current.playFever();
            addFloatText(`🔥 ${curCombo}X SLICE STREAK!`, node.x, node.y - 20, '#ec4899');
          } else {
            addFloatText(`+${node.points * curCombo}`, node.x, node.y, node.color);
          }

          if (comboResetTimerRef.current) clearTimeout(comboResetTimerRef.current);
          comboResetTimerRef.current = setTimeout(() => {
            consecutiveSlicesRef.current = 0;
            setCombo(0);
          }, 800);

          if (node.type === 'chrono') {
            setBulletTime(true);
            setTimeout(() => setBulletTime(false), 3500);
            addFloatText('CHRONO SLOWDOWN', node.x, node.y, '#3b82f6');
          }

          setScore((s) => s + node.points * curCombo);
          nodesRef.current.splice(i, 1);
        } else {
          // Hardened first hit
          createSparks(node.x, node.y, '#8b5cf6', 15);
          addFloatText('ARMOR BROKEN! SLICE AGAIN', node.x, node.y, '#8b5cf6');
        }
      }
    }
  };

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const now = Date.now();

    // 1. Cyberpunk Neon Background
    ctx.fillStyle = '#060614';
    ctx.fillRect(0, 0, width, height);

    // Neon Grid Floor
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.12)';
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

    // Spawn Waves
    const spawnInterval = bulletTime ? 2200 : 1200;
    if (now > nextSpawnTimeRef.current) {
      spawnWave();
      nextSpawnTimeRef.current = now + (Math.random() * 800 + spawnInterval);
    }

    // Update & Render Nodes
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
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 18;
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠ BOMB', 0, 0);
      } else {
        // Glowing Crystal Hexagon
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
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 20;
        ctx.stroke();

        ctx.fillStyle = node.color;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.type === 'hardened' ? '2X CUT' : node.type === 'chrono' ? 'TIME' : node.type === 'golden' ? 'GOLD' : 'DATA', 0, 0);
      }
      ctx.restore();

      if (node.y > height + 60) nodesRef.current.splice(i, 1);
    }

    // Physical Sliced Halves
    for (let i = slicedHalvesRef.current.length - 1; i >= 0; i--) {
      const h = slicedHalvesRef.current[i];
      h.x += h.vx;
      h.y += h.vy;
      h.vy += 0.45;
      h.rot += h.vRot;
      h.life -= 1;

      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rot);
      ctx.beginPath();
      ctx.arc(0, 0, h.radius, h.side === 'left' ? Math.PI / 2 : -Math.PI / 2, h.side === 'left' ? (Math.PI * 3) / 2 : Math.PI / 2);
      ctx.closePath();
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = h.color;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = h.color;
      ctx.stroke();
      ctx.restore();

      if (h.life <= 0 || h.y > height + 60) slicedHalvesRef.current.splice(i, 1);
    }

    // Clean Trail
    trailRef.current = trailRef.current.filter((p) => now - p.time < 180);

    // Draw Blade Trail
    if (trailRef.current.length > 1) {
      for (let i = 1; i < trailRef.current.length; i++) {
        const p1 = trailRef.current[i - 1];
        const p2 = trailRef.current[i];
        const alpha = 1 - (now - p2.time) / 180;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(236, 72, 153, ${alpha})`;
        ctx.lineWidth = 8 * alpha;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 16;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        checkSlashIntersection(p1, p2);
      }
    }

    // Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const prt = particlesRef.current[i];
      prt.x += prt.vx;
      prt.y += prt.vy;
      prt.life -= 1;

      ctx.beginPath();
      ctx.arc(prt.x, prt.y, Math.max(1, (prt.life / 25) * prt.size), 0, Math.PI * 2);
      ctx.fillStyle = prt.color;
      ctx.shadowBlur = 10;
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
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = ft.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();

      if (ft.life <= 0) floatTextsRef.current.splice(i, 1);
    }

    if (gameState === 'playing') {
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, bulletTime, spawnWave]);

  useEffect(() => {
    if (gameState === 'playing') {
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, gameLoop]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    trailRef.current.push({ x, y, time: Date.now() });
  };

  const startGame = () => {
    setScore(0);
    setLives(3);
    setCombo(0);
    setMaxCombo(0);
    setBulletTime(false);
    setHasUsedRevive(false);
    setIsScoreSubmitted(false);
    nodesRef.current = [];
    slicedHalvesRef.current = [];
    particlesRef.current = [];
    trailRef.current = [];
    floatTextsRef.current = [];
    nextSpawnTimeRef.current = Date.now() + 600;
    setGameState('playing');
  };

  const handleRewardedRevive = () => {
    setLives(1);
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
    <div className="relative w-full overflow-hidden rounded-2xl border border-pink-500/40 bg-zinc-950 p-4 shadow-2xl space-y-3">
      {/* Top HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-zinc-900/90 p-3 border border-zinc-800">
        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400">Score</span>
          <div className="text-xl font-black font-mono text-pink-400">{score.toLocaleString()}</div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400">Combo Multiplier</span>
          <div className="text-lg font-black font-mono text-cyan-300">
            {combo > 1 ? `${combo}X STREAK` : '1X BASE'}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400">Time State</span>
          <div className="text-xs font-bold font-mono mt-1 text-zinc-300">
            {bulletTime ? <span className="text-cyan-400 animate-pulse">CHRONO SLOWDOWN</span> : 'NORMAL 60 FPS'}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <span
                key={i}
                className={`h-4 w-4 rounded transition-all ${
                  i < lives ? 'bg-pink-500 shadow-sm shadow-pink-500/50' : 'bg-zinc-800'
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
      <div className="relative aspect-[4/3] w-full max-h-[580px] overflow-hidden rounded-xl border border-zinc-800 bg-black touch-none">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onPointerMove={handlePointerMove}
          className="h-full w-full object-contain cursor-crosshair select-none"
        />

        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-sm">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pink-500/10 px-3 py-1 text-xs font-mono font-semibold text-pink-400 border border-pink-500/30">
              <Zap className="w-3.5 h-3.5" />
              <span>SYNTHWAVE CYBER KATANA SLICER: ZERO</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">{gameTitle}</h3>
            <p className="mt-2 max-w-md text-xs text-zinc-400 leading-relaxed">
              Swipe your mouse or touch across nodes to execute razor-sharp laser cuts. Slice multi-node combos for score multipliers and crack Chrono Orbs for bullet-time slow motion. <strong className="text-rose-400">Do NOT touch red glitch bombs!</strong>
            </p>
            <button
              onClick={startGame}
              className="mt-6 flex items-center gap-2 rounded-xl bg-pink-500 px-8 py-3.5 text-sm font-bold text-zinc-950 shadow-xl shadow-pink-500/30 hover:bg-pink-400 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Enter Cyber Grid</span>
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center backdrop-blur-md space-y-4">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-rose-500">FIREWALL BREACHED</div>
            <h3 className="text-4xl font-black text-white">SYSTEM CORRUPTED</h3>
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 w-full max-w-sm">
              <div className="text-xs text-zinc-400 font-mono">FINAL SCORE (MAX COMBO: {maxCombo}X)</div>
              <div className="text-3xl font-black font-mono text-pink-400">{score.toLocaleString()}</div>
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
                  <span>Watch Short Ad to Revive (+1 Shield)</span>
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
        onRewardEarned={handleRewardedRevive}
        rewardDescription="Revive firewall with +1 Shield and 500 bonus points!"
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Save Your Cyber Slicer High Score"
        onSuccess={() => {
          setIsScoreSubmitted(true);
          confetti({ particleCount: 80, spread: 60 });
          if (onScoreSubmitted) onScoreSubmitted(score);
        }}
      />
    </div>
  );
}
