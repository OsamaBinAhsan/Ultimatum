'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Coins,
  Sparkles,
  Gamepad2,
  CheckCircle,
  AlertCircle,
  Filter,
  ArrowLeft,
  Loader2,
  Lock,
  Trophy,
  Zap,
  Shield,
  Palette,
  Flame,
  Volume2,
  Eye,
  Layers,
  Star,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { platformStore } from '@/lib/data/store';
import type { ShopItem, ShopSlotType, ItemTier, Profile, PlayerInventoryItem } from '@/lib/types';

interface CosmeticsShopClientProps {
  initialItems: ShopItem[];
}

const GAME_TABS = [
  { id: 'all', label: 'All Catalog' },
  { id: 'universal', label: 'Universal Profile' },
  { id: 'pixel-kitchen-rush', label: 'Pixel Kitchen Rush' },
  { id: 'hyper-chess', label: 'Hyper-Chess' },
  { id: 'the-architect-and-the-rats', label: 'The Architect & The Rats' },
  { id: 'sabotage-circuit', label: 'Sabotage Circuit' },
  { id: 'neon-asteroid-blitz', label: 'Neon Asteroid Blitz' },
  { id: 'cyber-slicer-2099', label: 'Cyber Slicer 2099' },
  { id: 'dungeon-loot-dash', label: 'Dungeon Loot Dash' },
];

const SLOT_FILTERS: { id: string; label: string; icon: any }[] = [
  { id: 'all', label: 'All Slots', icon: Sparkles },
  { id: 'VISUAL_SKIN', label: 'Visual Skins', icon: Eye },
  { id: 'ACTION_JUICE', label: 'Action Juice', icon: Sparkles },
  { id: 'GAME_GEAR', label: 'Game Gear', icon: Shield },
  { id: 'AUDIO_THEME', label: 'Audio Themes', icon: Volume2 },
  { id: 'AVATAR_FRAME', label: 'Avatar Frames', icon: Palette },
  { id: 'PROFILE_TITLE', label: 'Profile Titles', icon: Trophy },
];

const TIER_COLORS: Record<ItemTier, { badge: string; border: string; glow: string }> = {
  COMMON: {
    badge: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    border: 'border-zinc-800 hover:border-zinc-700',
    glow: '',
  },
  RARE: {
    badge: 'bg-blue-950/80 text-blue-300 border-blue-600/50',
    border: 'border-blue-800/40 hover:border-blue-500/60',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
  },
  EPIC: {
    badge: 'bg-purple-950/80 text-purple-300 border-purple-600/50',
    border: 'border-purple-800/40 hover:border-purple-500/60',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
  },
  LEGENDARY: {
    badge: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
    border: 'border-amber-500/60 hover:border-amber-400',
    glow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]',
  },
};

export function CosmeticsShopClient({ initialItems }: CosmeticsShopClientProps) {
  const [items, setItems] = useState<ShopItem[]>(initialItems);
  const [user, setUser] = useState<Profile | null>(null);
  const [inventory, setInventory] = useState<PlayerInventoryItem[]>([]);
  const [activeGame, setActiveGame] = useState<string>('all');
  const [activeSlot, setActiveSlot] = useState<string>('all');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const refreshUserData = useCallback(() => {
    const u = platformStore.getCurrentUser();
    setUser(u);
    if (u) {
      setInventory(platformStore.getInventory(u.id));
    }
  }, []);

  useEffect(() => {
    refreshUserData();
    const handleEvents = () => refreshUserData();
    window.addEventListener('balance-updated', handleEvents);
    window.addEventListener('inventory-updated', handleEvents);
    window.addEventListener('loadout-updated', handleEvents);

    return () => {
      window.removeEventListener('balance-updated', handleEvents);
      window.removeEventListener('inventory-updated', handleEvents);
      window.removeEventListener('loadout-updated', handleEvents);
    };
  }, [refreshUserData]);

  const ownedItemIds = useMemo(() => new Set(inventory.map((i) => i.item_id)), [inventory]);
  const equippedItemIds = useMemo(
    () => new Set(inventory.filter((i) => i.is_equipped).map((i) => i.item_id)),
    [inventory]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Game Filter
      if (activeGame === 'universal' && item.game_id !== null) return false;
      if (activeGame !== 'all' && activeGame !== 'universal' && item.game_id !== activeGame) return false;

      // Slot Filter
      if (activeSlot !== 'all' && item.slot_type !== activeSlot) return false;

      return true;
    });
  }, [items, activeGame, activeSlot]);

  const handleToggleEquip = async (item: ShopItem) => {
    if (!user) return;
    setPurchasingId(item.id);
    const isEquipped = equippedItemIds.has(item.id);

    try {
      const res = await fetch('/api/shop/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          userId: user.id,
          action: isEquipped ? 'unequip' : 'equip',
          gameId: item.game_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: isEquipped ? `Unequipped ${item.name}` : `Equipped ${item.name}!`,
        });
        refreshUserData();
      }
    } catch {
      if (isEquipped) {
        platformStore.unequipItem(user.id, item.id);
      } else {
        platformStore.equipItem(user.id, item.id);
      }
      refreshUserData();
    } finally {
      setPurchasingId(null);
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!user) {
      setFeedback({ type: 'error', message: 'Please sign in to unlock gear.' });
      return;
    }

    if (user.points < item.price_coins) {
      setFeedback({
        type: 'error',
        message: `Insufficient Coins: Need ${item.price_coins} Coins (you have ${user.points}). Win tournament matches to claim more!`,
      });
      return;
    }

    setPurchasingId(item.id);

    try {
      const res = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, userId: user.id, autoEquip: true }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: `🎉 Unlocked & Equipped: ${item.name}!`,
        });
        refreshUserData();
        confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Purchase failed.' });
      }
    } catch {
      platformStore.purchaseItem(user.id, item.id);
      refreshUserData();
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Link
                  href="/games"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white transition-all"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono font-bold text-cyan-300">
                  <Layers className="h-3.5 w-3.5" />
                  <span>UNIFIED 4-SLOT LOADOUT ENGINE</span>
                </div>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
                Arcade Cosmetics & Loadout Gear
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Equip customized skins, particle juice, and hardware bonuses across all 7 titles.
              </p>
            </div>

            {/* Wallet Card */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 to-yellow-950/20 px-5 py-3 shadow-lg shadow-amber-950/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <Coins className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold text-amber-400/80 uppercase">Wallet Balance</div>
                  <div className="text-xl font-black font-mono text-amber-300">
                    {(user?.points || 0).toLocaleString()} <span className="text-xs font-bold text-amber-400">COINS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Game Tabs */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {GAME_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveGame(tab.id)}
                className={`rounded-xl border px-3.5 py-1.5 text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  activeGame === tab.id
                    ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Slot Type Filters */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {SLOT_FILTERS.map((slot) => {
              const Icon = slot.icon;
              const isSelected = activeSlot === slot.id;
              return (
                <button
                  key={slot.id}
                  onClick={() => setActiveSlot(slot.id)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-mono transition-all ${
                    isSelected
                      ? 'border-pink-500 bg-pink-950/40 text-pink-300 font-bold'
                      : 'border-zinc-800/80 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{slot.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
          <div
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-xs font-mono ${
              feedback.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                : 'border-red-500/40 bg-red-950/30 text-red-300'
            }`}
          >
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-white">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Catalog Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const isOwned = ownedItemIds.has(item.id);
            const isEquipped = equippedItemIds.has(item.id);
            const isProcessing = purchasingId === item.id;
            const tierStyle = TIER_COLORS[item.tier] || TIER_COLORS.COMMON;

            let meta: Record<string, any> = {};
            try {
              meta = typeof item.metadata_json === 'string' ? JSON.parse(item.metadata_json) : item.metadata_json;
            } catch {
              meta = {};
            }

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between rounded-3xl border bg-zinc-950/80 p-5 transition-all duration-200 ${
                  isEquipped
                    ? 'border-emerald-500/80 bg-emerald-950/10 shadow-[0_0_25px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/40'
                    : `${tierStyle.border} ${tierStyle.glow}`
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-mono font-black ${tierStyle.badge}`}>
                      {item.tier}
                    </span>
                    <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                      {item.slot_type}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">{item.name}</h3>
                  <p className="text-xs font-mono text-cyan-400 mb-3">{item.game_id || 'Universal Profile'}</p>

                  {/* Metadata Visual Telemetry Card */}
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 mb-4 space-y-1 text-xs font-mono">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase flex items-center justify-between mb-1">
                      <span>Attribute Data</span>
                      <Zap className="h-3 w-3 text-amber-400" />
                    </div>
                    {meta.stat && (
                      <div className="flex items-center justify-between text-cyan-300">
                        <span className="text-zinc-400">{meta.stat}:</span>
                        <span className="font-bold">+{meta.value}x</span>
                      </div>
                    )}
                    {meta.chefSprite && (
                      <div className="flex items-center justify-between text-pink-300">
                        <span className="text-zinc-400">Chef Hull:</span>
                        <span className="font-bold">{meta.chefSprite}</span>
                      </div>
                    )}
                    {meta.boardDark && (
                      <div className="flex items-center justify-between text-purple-300">
                        <span className="text-zinc-400">Theme Hex:</span>
                        <span className="font-bold">{meta.coreColor || meta.boardLight}</span>
                      </div>
                    )}
                    {meta.dashParticleColor && (
                      <div className="flex items-center justify-between text-amber-300">
                        <span className="text-zinc-400">Trail:</span>
                        <span className="font-bold">{meta.trailType || 'nitro'}</span>
                      </div>
                    )}
                    {meta.synthPreset && (
                      <div className="flex items-center justify-between text-purple-300">
                        <span className="text-zinc-400">Audio:</span>
                        <span className="font-bold">{meta.synthPreset}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom CTA Action */}
                <div className="pt-2">
                  {isEquipped ? (
                    <button
                      onClick={() => handleToggleEquip(item)}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-mono font-bold text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'UNEQUIP'}
                    </button>
                  ) : isOwned ? (
                    <button
                      onClick={() => handleToggleEquip(item)}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-xs font-mono font-bold text-white hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-600/30 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Zap className="h-4 w-4" />
                          <span>EQUIP LOADOUT</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={isProcessing || (user ? user.points < item.price_coins : false)}
                      className={`w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold transition-all shadow-lg ${
                        user && user.points >= item.price_coins
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-amber-500/20'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
                      }`}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : user && user.points >= item.price_coins ? (
                        <>
                          <Coins className="h-4 w-4" />
                          <span>BUY & EQUIP ({item.price_coins} COINS)</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>{item.price_coins} COINS</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
