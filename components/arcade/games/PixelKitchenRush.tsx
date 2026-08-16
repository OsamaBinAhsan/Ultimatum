'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Flame, Sparkles, Trophy, Utensils, Clock, CheckCircle, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { RewardedAdModal } from '@/components/monetization/RewardedAdModal';
import { AuthModal } from '@/components/auth/AuthModal';
import confetti from 'canvas-confetti';

interface PixelKitchenProps {
  gameId: string;
  gameTitle: string;
  onScoreSubmitted?: (score: number) => void;
}

class KitchenSynthAudio {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
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
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(180, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  playDing() {
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

type ItemType = 'raw_meat' | 'chopped_meat' | 'grilled_meat' | 'burnt_meat' | 'bun' | 'raw_fish' | 'chopped_fish' | 'grilled_fish' | 'raw_veg' | 'chopped_veg' | 'burger_plate' | 'salmon_bowl';

interface Order {
  id: string;
  name: string;
  type: 'burger' | 'salmon';
  timeLeft: number;
  maxTime: number;
  reward: number;
}

export function PixelKitchenRushEngine({ gameId, gameTitle, onScoreSubmitted }: PixelKitchenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [reputation, setReputation] = useState(100);
  const [streak, setStreak] = useState(0);
  const [heldItem, setHeldItem] = useState<ItemType | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showRewardedAd, setShowRewardedAd] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasUsedRevive, setHasUsedRevive] = useState(false);
  const [isScoreSubmitted, setIsScoreSubmitted] = useState(false);

  const soundRef = useRef<KitchenSynthAudio>(new KitchenSynthAudio());
  const animFrameRef = useRef<number | null>(null);

  // Chef Player in Top-Down Kitchen
  const chefRef = useRef({
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    speed: 4.8,
    direction: 'down',
    walkCycle: 0,
    heldItem: null as ItemType | null,
  });

  // Interactive Kitchen Workstations (X, Y, W, H)
  const stations = {
    meatCrate: { x: 80, y: 100, w: 90, h: 70, name: '🥩 Raw Patty', type: 'crate_meat' },
    fishCrate: { x: 80, y: 220, w: 90, h: 70, name: '🐟 Raw Salmon', type: 'crate_fish' },
    vegCrate: { x: 80, y: 340, w: 90, h: 70, name: '🥬 Fresh Greens', type: 'crate_veg' },
    bunCrate: { x: 80, y: 460, w: 90, h: 70, name: '🍞 Brioche Bun', type: 'crate_bun' },

    cuttingBoard: { x: 300, y: 100, w: 100, h: 70, progress: 0, maxProgress: 100, item: null as ItemType | null },
    cuttingBoard2: { x: 420, y: 100, w: 100, h: 70, progress: 0, maxProgress: 100, item: null as ItemType | null },

    grill1: { x: 560, y: 100, w: 90, h: 70, status: 'empty' as 'empty' | 'cooking' | 'ready' | 'burnt', timer: 0, item: null as ItemType | null },
    grill2: { x: 670, y: 100, w: 90, h: 70, status: 'empty' as 'empty' | 'cooking' | 'ready' | 'burnt', timer: 0, item: null as ItemType | null },

    plateTable: { x: 340, y: 460, w: 120, h: 70, items: [] as ItemType[] },
    deliveryWindow: { x: 520, y: 460, w: 140, h: 70 },
    trashCan: { x: 680, y: 460, w: 70, h: 70 },
  };

  const stationsRef = useRef(stations);
  const keysRef = useRef<Record<string, boolean>>({});
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; color: string }[]>([]);
  const floatTextsRef = useRef<{ id: number; x: number; y: number; text: string; color: string; life: number; vy: number }[]>([]);

  const addFloatText = (text: string, x: number, y: number, color = '#fbbf24') => {
    floatTextsRef.current.push({
      id: Date.now() + Math.random(),
      x,
      y,
      text,
      color,
      life: 40,
      vy: -1.5,
    });
  };

  const spawnOrder = useCallback(() => {
    const isBurger = Math.random() > 0.5;
    const newOrd: Order = {
      id: 'ord-' + Date.now(),
      name: isBurger ? '🍔 Truffle Wagyu Burger' : '🍲 Crispy Salmon Bowl',
      type: isBurger ? 'burger' : 'salmon',
      timeLeft: 24,
      maxTime: 24,
      reward: isBurger ? 450 : 500,
    };
    setOrders((prev) => (prev.length < 3 ? [...prev, newOrd] : prev));
  }, []);

  // Player Interaction Trigger
  const interactWithNearbyStation = useCallback(() => {
    const chef = chefRef.current;
    const st = stationsRef.current;

    // 1. Meat Crate
    if (Math.hypot(chef.x - (st.meatCrate.x + 45), chef.y - (st.meatCrate.y + 35)) < 65) {
      if (!chef.heldItem) {
        chef.heldItem = 'raw_meat';
        setHeldItem('raw_meat');
        addFloatText('Grabbed Raw Patty', chef.x, chef.y - 20, '#fbbf24');
      }
      return;
    }

    // 2. Fish Crate
    if (Math.hypot(chef.x - (st.fishCrate.x + 45), chef.y - (st.fishCrate.y + 35)) < 65) {
      if (!chef.heldItem) {
        chef.heldItem = 'raw_fish';
        setHeldItem('raw_fish');
        addFloatText('Grabbed Raw Salmon', chef.x, chef.y - 20, '#38bdf8');
      }
      return;
    }

    // 3. Veg Crate
    if (Math.hypot(chef.x - (st.vegCrate.x + 45), chef.y - (st.vegCrate.y + 35)) < 65) {
      if (!chef.heldItem) {
        chef.heldItem = 'raw_veg';
        setHeldItem('raw_veg');
        addFloatText('Grabbed Fresh Greens', chef.x, chef.y - 20, '#34d399');
      }
      return;
    }

    // 4. Bun Crate
    if (Math.hypot(chef.x - (st.bunCrate.x + 45), chef.y - (st.bunCrate.y + 35)) < 65) {
      if (!chef.heldItem) {
        chef.heldItem = 'bun';
        setHeldItem('bun');
        addFloatText('Grabbed Brioche Bun', chef.x, chef.y - 20, '#f59e0b');
      }
      return;
    }

    // 5. Cutting Board 1
    if (Math.hypot(chef.x - (st.cuttingBoard.x + 50), chef.y - (st.cuttingBoard.y + 35)) < 70) {
      const cb = st.cuttingBoard;
      if (!cb.item && (chef.heldItem === 'raw_meat' || chef.heldItem === 'raw_fish' || chef.heldItem === 'raw_veg')) {
        cb.item = chef.heldItem;
        cb.progress = 0;
        chef.heldItem = null;
        setHeldItem(null);
      } else if (cb.item && cb.progress < cb.maxProgress) {
        // Chop!
        cb.progress += 25;
        soundRef.current.playChop();
        addFloatText(`🔪 CHOP ${cb.progress}%`, cb.x + 50, cb.y - 10, '#38bdf8');
        if (cb.progress >= cb.maxProgress) {
          if (cb.item === 'raw_meat') cb.item = 'chopped_meat';
          if (cb.item === 'raw_fish') cb.item = 'chopped_fish';
          if (cb.item === 'raw_veg') cb.item = 'chopped_veg';
        }
      } else if (cb.item && cb.progress >= cb.maxProgress && !chef.heldItem) {
        chef.heldItem = cb.item;
        setHeldItem(cb.item);
        cb.item = null;
        cb.progress = 0;
      }
      return;
    }

    // 6. Grill 1
    if (Math.hypot(chef.x - (st.grill1.x + 45), chef.y - (st.grill1.y + 35)) < 70) {
      const g = st.grill1;
      if (g.status === 'empty' && (chef.heldItem === 'chopped_meat' || chef.heldItem === 'chopped_fish' || chef.heldItem === 'raw_meat')) {
        g.item = chef.heldItem;
        g.status = 'cooking';
        g.timer = 0;
        chef.heldItem = null;
        setHeldItem(null);
      } else if (g.status === 'ready' && !chef.heldItem) {
        chef.heldItem = g.item === 'chopped_fish' ? 'grilled_fish' : 'grilled_meat';
        setHeldItem(chef.heldItem);
        g.status = 'empty';
        g.item = null;
        g.timer = 0;
        soundRef.current.playSizzle();
        addFloatText('🥩 Collected Sizzling Patty!', chef.x, chef.y - 20, '#10b981');
      } else if (g.status === 'burnt') {
        g.status = 'empty';
        g.item = null;
        soundRef.current.playBurn();
        addFloatText('Cleaned Burnt Ashes', chef.x, chef.y - 20, '#ef4444');
      }
      return;
    }

    // 7. Plate / Assembly Station
    if (Math.hypot(chef.x - (st.plateTable.x + 60), chef.y - (st.plateTable.y + 35)) < 75) {
      const pt = st.plateTable;
      if (chef.heldItem) {
        pt.items.push(chef.heldItem);
        addFloatText(`Added ${chef.heldItem}`, pt.x + 60, pt.y - 15, '#38bdf8');
        chef.heldItem = null;
        setHeldItem(null);

        // Check if assembled into Burger
        const hasBun = pt.items.includes('bun');
        const hasMeat = pt.items.includes('grilled_meat') || pt.items.includes('raw_meat');
        const hasVeg = pt.items.includes('chopped_veg') || pt.items.includes('raw_veg');

        if (hasBun && hasMeat) {
          chef.heldItem = 'burger_plate';
          setHeldItem('burger_plate');
          pt.items = [];
          soundRef.current.playDing();
          addFloatText('🍔 Truffle Burger Assembled!', chef.x, chef.y - 30, '#10b981');
        } else if (pt.items.includes('grilled_fish') && hasVeg) {
          chef.heldItem = 'salmon_bowl';
          setHeldItem('salmon_bowl');
          pt.items = [];
          soundRef.current.playDing();
          addFloatText('🍲 Salmon Bowl Assembled!', chef.x, chef.y - 30, '#10b981');
        }
      }
      return;
    }

    // 8. Delivery Service Window
    if (Math.hypot(chef.x - (st.deliveryWindow.x + 70), chef.y - (st.deliveryWindow.y + 35)) < 80) {
      if (chef.heldItem === 'burger_plate' || chef.heldItem === 'salmon_bowl') {
        const orderIdx = orders.findIndex(
          (o) => (chef.heldItem === 'burger_plate' && o.type === 'burger') || (chef.heldItem === 'salmon_bowl' && o.type === 'salmon')
        );

        if (orderIdx >= 0) {
          const ord = orders[orderIdx];
          const speedBonus = ord.timeLeft > 10 ? 300 : 150;
          const totalPts = ord.reward + speedBonus + streak * 50;

          soundRef.current.playDing();
          confetti({ particleCount: 60, spread: 60 });
          addFloatText(`+$${totalPts} VIP EXPEDITE!`, chef.x, chef.y - 40, '#10b981');

          setScore((s) => s + totalPts);
          setStreak((stk) => stk + 1);
          setOrders((prev) => prev.filter((_, i) => i !== orderIdx));
          chef.heldItem = null;
          setHeldItem(null);
        } else {
          addFloatText('Wrong Ticket!', chef.x, chef.y - 20, '#ef4444');
        }
      }
      return;
    }

    // 9. Trash Can
    if (Math.hypot(chef.x - (st.trashCan.x + 35), chef.y - (st.trashCan.y + 35)) < 60) {
      if (chef.heldItem) {
        addFloatText('Item Discarded', chef.x, chef.y - 20, '#ef4444');
        chef.heldItem = null;
        setHeldItem(null);
      }
    }
  }, [orders, streak]);

  // Main 60 FPS Canvas Game Loop
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const chef = chefRef.current;
    const st = stationsRef.current;

    // 1. Chef Movement
    let mx = 0;
    let my = 0;
    if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
      mx -= 1;
      chef.direction = 'left';
    }
    if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
      mx += 1;
      chef.direction = 'right';
    }
    if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) {
      my -= 1;
      chef.direction = 'up';
    }
    if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) {
      my += 1;
      chef.direction = 'down';
    }

    if (mx !== 0 || my !== 0) {
      chef.walkCycle += 0.2;
      chef.x += mx * chef.speed;
      chef.y += my * chef.speed;
    }

    // Boundaries
    chef.x = Math.max(180, Math.min(width - 40, chef.x));
    chef.y = Math.max(180, Math.min(420, chef.y));

    // 2. Clear & Warm Kitchen Floor Tiles
    ctx.fillStyle = '#1e1b2e';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#2a243d';
    for (let x = 0; x < width; x += 40) {
      for (let y = 0; y < height; y += 40) {
        if ((x / 40 + y / 40) % 2 === 0) {
          ctx.fillRect(x, y, 40, 40);
        }
      }
    }

    // 3. Draw Stations
    // Ingredient Crates
    const crates = [st.meatCrate, st.fishCrate, st.vegCrate, st.bunCrate];
    crates.forEach((c) => {
      ctx.fillStyle = '#3f2d24';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(c.name, c.x + c.w / 2, c.y + c.h / 2 + 4);
    });

    // Cutting Board
    const cbs = [st.cuttingBoard, st.cuttingBoard2];
    cbs.forEach((cb, idx) => {
      ctx.fillStyle = '#334155';
      ctx.fillRect(cb.x, cb.y, cb.w, cb.h);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(cb.x, cb.y, cb.w, cb.h);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(cb.item ? `${cb.item} (${cb.progress}%)` : `🔪 Chop Board ${idx + 1}`, cb.x + cb.w / 2, cb.y + 30);

      // Chop progress bar
      if (cb.progress > 0) {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(cb.x + 10, cb.y + 45, (cb.progress / 100) * (cb.w - 20), 12);
        ctx.strokeStyle = '#38bdf8';
        ctx.strokeRect(cb.x + 10, cb.y + 45, cb.w - 20, 12);
      }
    });

    // Grills
    const grills = [st.grill1, st.grill2];
    grills.forEach((g, idx) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle = g.status === 'burnt' ? '#ef4444' : g.status === 'ready' ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(g.x, g.y, g.w, g.h);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        g.status === 'ready' ? 'READY! 🔥' : g.status === 'burnt' ? 'BURNT! 💀' : g.status === 'cooking' ? `Sizzling ${Math.floor(g.timer)}%` : `🔥 Grill ${idx + 1}`,
        g.x + g.w / 2,
        g.y + 30
      );

      if (g.status === 'cooking') {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(g.x + 10, g.y + 45, (g.timer / 100) * (g.w - 20), 12);
        ctx.strokeStyle = '#f59e0b';
        ctx.strokeRect(g.x + 10, g.y + 45, g.w - 20, 12);
      }
    });

    // Assembly Counter
    ctx.fillStyle = '#334155';
    ctx.fillRect(st.plateTable.x, st.plateTable.y, st.plateTable.w, st.plateTable.h);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.strokeRect(st.plateTable.x, st.plateTable.y, st.plateTable.w, st.plateTable.h);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`🍽️ Assembly Plate (${st.plateTable.items.length})`, st.plateTable.x + st.plateTable.w / 2, st.plateTable.y + 38);

    // Delivery Window
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(st.deliveryWindow.x, st.deliveryWindow.y, st.deliveryWindow.w, st.deliveryWindow.h);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.strokeRect(st.deliveryWindow.x, st.deliveryWindow.y, st.deliveryWindow.w, st.deliveryWindow.h);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('🛎️ VIP EXPEDITE', st.deliveryWindow.x + st.deliveryWindow.w / 2, st.deliveryWindow.y + 38);

    // Trash Can
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(st.trashCan.x, st.trashCan.y, st.trashCan.w, st.trashCan.h);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(st.trashCan.x, st.trashCan.y, st.trashCan.w, st.trashCan.h);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('🗑️ Trash', st.trashCan.x + st.trashCan.w / 2, st.trashCan.y + 38);

    // 4. Draw Animated Chef Sprite
    ctx.save();
    ctx.translate(chef.x, chef.y);

    // Chef Shadow
    ctx.beginPath();
    ctx.ellipse(0, 18, 16, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();

    // Chef Body / Uniform
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-12, -10, 24, 24);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(-12, -10, 24, 24);

    // Red Scarf
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-8, -10, 16, 4);

    // Chef Head
    ctx.beginPath();
    ctx.arc(0, -18, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#fde047';
    ctx.fill();

    // Chef Toque (Hat)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, -36, 16, 12);
    ctx.beginPath();
    ctx.arc(0, -36, 10, 0, Math.PI * 2);
    ctx.fill();

    // Held Item over head
    if (chef.heldItem) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      const itemIcons: Record<string, string> = {
        raw_meat: '🥩',
        chopped_meat: '🥩',
        grilled_meat: '🔥🥩',
        raw_fish: '🐟',
        chopped_fish: '🐟',
        grilled_fish: '🔥🐟',
        raw_veg: '🥬',
        chopped_veg: '🥗',
        bun: '🍞',
        burger_plate: '🍔',
        salmon_bowl: '🍲',
      };
      ctx.fillText(itemIcons[chef.heldItem] || '📦', 0, -48);
    }
    ctx.restore();

    // 5. Floating Texts
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
  }, [gameState]);

  // Timers & Orders Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      // Grill sizzle progression
      const st = stationsRef.current;
      [st.grill1, st.grill2].forEach((g) => {
        if (g.status === 'cooking') {
          g.timer += 15;
          if (g.timer >= 100 && g.timer < 180) {
            g.status = 'ready';
          } else if (g.timer >= 180) {
            g.status = 'burnt';
            soundRef.current.playBurn();
          }
        }
      });

      // Ticket Countdowns
      setOrders((prev) => {
        const updated = prev.map((o) => ({ ...o, timeLeft: o.timeLeft - 1 }));
        const expired = updated.filter((o) => o.timeLeft <= 0);

        if (expired.length > 0) {
          soundRef.current.playBurn();
          setReputation((r) => {
            const next = r - expired.length * 25;
            if (next <= 0) setGameState('gameover');
            return Math.max(0, next);
          });
          setStreak(0);
        }

        return updated.filter((o) => o.timeLeft > 0);
      });

      // Spawn orders
      if (Math.random() < 0.35) {
        spawnOrder();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, spawnOrder]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') {
        e.preventDefault();
        interactWithNearbyStation();
      }
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
  }, [interactWithNearbyStation]);

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
    setReputation(100);
    setStreak(0);
    setHeldItem(null);
    setOrders([]);
    chefRef.current.x = 400;
    chefRef.current.y = 300;
    chefRef.current.heldItem = null;
    stationsRef.current.grill1.status = 'empty';
    stationsRef.current.grill1.timer = 0;
    stationsRef.current.grill2.status = 'empty';
    stationsRef.current.grill2.timer = 0;
    stationsRef.current.cuttingBoard.progress = 0;
    stationsRef.current.cuttingBoard.item = null;
    stationsRef.current.plateTable.items = [];
    floatTextsRef.current = [];
    setIsScoreSubmitted(false);
    setHasUsedRevive(false);
    spawnOrder();
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
    <div className="relative w-full overflow-hidden rounded-2xl border border-amber-500/40 bg-zinc-950 p-4 shadow-2xl space-y-3">
      {/* Top HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-zinc-900/90 p-3 border border-zinc-800">
        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400">Score & Tips</span>
          <div className="text-xl font-black font-mono text-amber-400">${score.toLocaleString()}</div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400">Michelin Streak</span>
          <div className="text-lg font-black font-mono text-emerald-400">
            {streak > 1 ? `${streak}X CHEF STREAK!` : '1X BASE'}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400">Restaurant Reputation</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-3 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
              <div
                className={`h-full transition-all ${
                  reputation > 50 ? 'bg-emerald-400' : reputation > 25 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${reputation}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-white">{reputation}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="text-xs font-mono font-bold text-cyan-300">
            Holding: {heldItem ? <span className="text-amber-400 uppercase">{heldItem}</span> : 'NONE'}
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

      {/* Active Orders Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {orders.map((ord) => (
          <div key={ord.id} className="rounded-xl bg-zinc-900 border border-zinc-800 p-2.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">{ord.name}</div>
              <div className="text-[10px] text-amber-400 font-mono">+${ord.reward} Reward</div>
            </div>
            <div className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{ord.timeLeft}s</span>
            </div>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div className="relative aspect-[4/3] w-full max-h-[560px] overflow-hidden rounded-xl border border-zinc-800 bg-black">
        <canvas ref={canvasRef} width={800} height={600} className="h-full w-full object-contain" />

        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-sm">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-mono font-semibold text-amber-400 border border-amber-500/30">
              <Utensils className="w-3.5 h-3.5" />
              <span>TOP-DOWN PIXEL KITCHEN ARCADE</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">{gameTitle}</h3>
            <p className="mt-2 max-w-md text-xs text-zinc-400 leading-relaxed">
              Use <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-white">WASD / Arrow Keys</kbd> to move Chef. Press <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-white">SPACE / E</kbd> to interact with crates, chop boards, sizzling grills, assembly plates, and delivery windows!
            </p>
            <button
              onClick={startGame}
              className="mt-6 flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-3.5 text-sm font-bold text-zinc-950 shadow-xl shadow-amber-500/30 hover:bg-amber-400 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Open Kitchen</span>
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center backdrop-blur-md space-y-4">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-rose-500">REPUTATION DEPLETED</div>
            <h3 className="text-4xl font-black text-white">RESTAURANT CLOSED</h3>
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 w-full max-w-sm">
              <div className="text-xs text-zinc-400 font-mono">FINAL CHEF REVENUE</div>
              <div className="text-3xl font-black font-mono text-amber-400">${score.toLocaleString()}</div>
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

      {/* On-screen quick controls for touch / mobile */}
      <div className="flex items-center justify-between rounded-xl bg-zinc-900/60 p-2 border border-zinc-800">
        <span className="text-xs text-zinc-400 font-mono">Quick Action:</span>
        <button
          onClick={interactWithNearbyStation}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2 text-xs font-bold text-zinc-950 active:scale-95 transition-all shadow-md"
        >
          <Utensils className="w-4 h-4" />
          <span>[SPACE] Grab / Chop / Grill / Deliver</span>
        </button>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Save Your Master Chef Revenue"
        onSuccess={() => {
          setIsScoreSubmitted(true);
          confetti({ particleCount: 80, spread: 60 });
          if (onScoreSubmitted) onScoreSubmitted(score);
        }}
      />
    </div>
  );
}
