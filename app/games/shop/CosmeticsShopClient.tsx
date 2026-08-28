'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { platformStore } from '@/lib/data/store';
import type { GameItem, GameItemType, Profile } from '@/lib/types';

interface CosmeticsShopClientProps {
  initialItems: GameItem[];
}

const CATEGORY_FILTERS: { id: string; label: string; icon: any }[] = [
  { id: 'all', label: 'All Gear', icon: Sparkles },
  { id: 'skin', label: 'Player & Ship Skins', icon: Palette },
  { id: 'powerup', label: 'Combat Power-Ups', icon: Zap },
  { id: 'cosmetic', label: 'Visual VFX', icon: Flame },
  { id: 'badge', label: 'Profile Badges', icon: Trophy },
  { id: 'avatar_frame', label: 'Avatar Frames', icon: Shield },
];

export function CosmeticsShopClient({ initialItems }: CosmeticsShopClientProps) {
  const [items, setItems] = useState<GameItem[]>(initialItems);
  const [user, setUser] = useState<Profile | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeGame, setActiveGame] = useState<string>('all');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [ownedItemIds, setOwnedItemIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const u = platformStore.getCurrentUser();
    setUser(u);

    // Listen for balance updates from anywhere in the window
    const handleBalanceEvent = () => {
      setUser(platformStore.getCurrentUser());
    };
    window.addEventListener('balance-updated', handleBalanceEvent);
    return () => window.removeEventListener('balance-updated', handleBalanceEvent);
  }, []);

  const handlePurchase = async (item: GameItem) => {
    if (!user) {
      setFeedback({ type: 'error', message: 'Please sign in to purchase cosmetics from the shop.' });
      return;
    }

    if (user.points < item.price_coins) {
      setFeedback({
        type: 'error',
        message: `Insufficient Coins: You need ${item.price_coins} coins for "${item.name}", but currently have ${user.points} coins. Win Arcade Tournaments to earn more!`,
      });
      return;
    }

    setPurchasingId(item.id);
    setFeedback(null);

    // 1. Optimistic Balance Update
    const previousPoints = user.points;
    const optimisticPoints = previousPoints - item.price_coins;
    platformStore.awardPoints(user.id, -item.price_coins);
    setUser((prev) => (prev ? { ...prev, points: optimisticPoints } : null));

    // Dispatch global event so Navbar immediately updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('balance-updated', { detail: { points: optimisticPoints } }));
    }

    try {
      const res = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, userId: user.id }),
      });

      const data = await res.json();

      if (data.success) {
        setOwnedItemIds((prev) => new Set([...prev, item.id]));
        setFeedback({
          type: 'success',
          message: `🎉 Unlocked "${item.name}"! Added to your permanent virtual inventory.`,
        });
        confetti({ particleCount: 100, spread: 80 });
      } else {
        // Rollback optimistic update
        platformStore.awardPoints(user.id, item.price_coins);
        setUser((prev) => (prev ? { ...prev, points: previousPoints } : null));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('balance-updated', { detail: { points: previousPoints } }));
        }
        setFeedback({ type: 'error', message: data.error || 'Purchase failed. Coins restored.' });
      }
    } catch (err: any) {
      // Rollback optimistic update
      platformStore.awardPoints(user.id, item.price_coins);
      setUser((prev) => (prev ? { ...prev, points: previousPoints } : null));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('balance-updated', { detail: { points: previousPoints } }));
      }
      setFeedback({ type: 'error', message: err.message || 'Network error processing transaction.' });
    } finally {
      setPurchasingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.item_type === activeCategory;
    const matchesGame = activeGame === 'all' || item.game_id === activeGame;
    return matchesCategory && matchesGame;
  });

  const getGameLabel = (gameId?: string | null) => {
    switch (gameId) {
      case 'neon-asteroid-blitz':
        return 'Neon Asteroid Blitz';
      case 'cyber-slicer':
        return 'Cyber Slicer 2099';
      case 'pixel-kitchen-rush':
        return 'Pixel Kitchen Rush';
      case 'dungeon-loot-dash':
        return 'Dungeon Loot Dash';
      case 'sabotage-circuit':
        return 'Sabotage Circuit';
      case 'the-architect-and-the-rats':
        return 'The Architect & Rats';
      default:
        return 'Universal Platform Gear';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-r from-zinc-950 via-purple-950/40 to-zinc-950 p-8 sm:p-12 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <Link
              href="/games"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-purple-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to The Arcade Vault</span>
            </Link>

            <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/40 bg-purple-500/10 px-3 py-1 text-xs font-mono font-bold text-purple-300">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>DIGITAL COSMETICS &amp; SKINS VAULT</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              The Cosmetics Shop
            </h1>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Equip bespoke hull skins, laser effects, golden spatulas, and profile badges with coins earned from weekly tournament leaderboards.
            </p>
          </div>

          {/* Live User Balance Card */}
          <div className="flex-shrink-0 rounded-2xl border border-amber-500/30 bg-zinc-900/90 p-5 space-y-2 text-center backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-slate-400 uppercase">
              <Coins className="h-4 w-4 text-amber-400" />
              <span>Available Coin Balance</span>
            </div>
            <div className="text-3xl font-black font-mono text-amber-400">
              {(user?.points || 0).toLocaleString()} <span className="text-sm font-sans text-slate-400">XP / Coins</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Signed in as <strong className="text-white">{user?.username || 'Guest'}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`flex items-center gap-3 rounded-2xl p-4 text-xs font-bold ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter Category Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-4">
        <Filter className="w-4 h-4 text-zinc-500 mr-2" />
        {CATEGORY_FILTERS.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 scale-105'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Cosmetics Responsive CSS Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => {
          const isOwned = ownedItemIds.has(item.id);
          const isPurchasing = purchasingId === item.id;
          const canAfford = (user?.points || 0) >= item.price_coins;

          return (
            <div
              key={item.id}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/80 shadow-xl transition-all duration-300 hover:border-purple-500/50 hover:bg-zinc-900 backdrop-blur-xl"
            >
              <div>
                {/* Asset Image */}
                <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
                  <Image
                    src={
                      item.asset_url ||
                      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'
                    }
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className="rounded-full bg-black/80 backdrop-blur-md px-3 py-1 text-[10px] font-mono font-bold text-purple-300 border border-purple-500/30">
                      {item.item_type.toUpperCase()}
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3">
                    <span className="rounded-full bg-zinc-950/90 px-3 py-1 text-[11px] font-mono font-bold text-amber-400 border border-amber-500/40 flex items-center gap-1 shadow-lg">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>{item.price_coins.toLocaleString()}</span>
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-2">
                  <div className="text-[11px] font-mono font-bold text-slate-400 uppercase truncate">
                    {getGameLabel(item.game_id)}
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                    {item.name}
                  </h3>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                {isOwned ? (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 py-2.5 text-xs font-bold text-emerald-300 cursor-default"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Unlocked &amp; In Vault</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={isPurchasing}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all shadow-lg hover:scale-102 ${
                      canAfford
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-600/25 hover:from-purple-500 hover:to-indigo-500'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                    } disabled:opacity-50`}
                  >
                    {isPurchasing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingBag className="h-4 w-4" />
                    )}
                    <span>
                      {isPurchasing
                        ? 'Processing Unlock...'
                        : canAfford
                        ? `Buy Now (${item.price_coins} c)`
                        : `Need ${item.price_coins} c`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
