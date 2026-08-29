'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Volume2,
  Eye,
  Layers,
  Gift,
  Tag,
  Download,
  Key,
  Clock,
  History,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { platformStore } from '@/lib/data/store';
import type { ShopItem, ShopCategory, ItemTier, Profile, PlayerInventoryItem, PlayerRedemption } from '@/lib/types';
import { RewardRedemptionModal } from '@/components/shop/RewardRedemptionModal';

interface ShopClientProps {
  initialItems: ShopItem[];
}

const CATEGORY_TABS: { id: string; label: string; icon: any }[] = [
  { id: 'all', label: '🌟 All Rewards', icon: Sparkles },
  { id: 'GAME_LOADOUT', label: '🎮 In-Game Loadouts', icon: Gamepad2 },
  { id: 'PROFILE_COSMETIC', label: '🎨 Profile Cosmetics', icon: Palette },
  { id: 'SPONSORED_PERK', label: '🎁 Sponsored Perks', icon: Gift },
  { id: 'AFFILIATE_VOUCHER', label: '🏷️ Affiliate Vouchers', icon: Tag },
  { id: 'DIGITAL_DOWNLOAD', label: '💾 Digital Downloads', icon: Download },
];

const GAME_FILTERS = [
  { id: 'all', label: 'All Games' },
  { id: 'pixel-kitchen-rush', label: 'Pixel Kitchen' },
  { id: 'hyper-chess', label: 'Hyper-Chess' },
  { id: 'the-architect-and-the-rats', label: 'The Architect' },
  { id: 'sabotage-circuit', label: 'Sabotage Circuit' },
  { id: 'neon-asteroid-blitz', label: 'Asteroid Blitz' },
  { id: 'cyber-slicer-2099', label: 'Cyber Slicer' },
  { id: 'dungeon-loot-dash', label: 'Loot Dash' },
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

export function ShopClient({ initialItems }: ShopClientProps) {
  const [items, setItems] = useState<ShopItem[]>(initialItems);
  const [user, setUser] = useState<Profile | null>(null);
  const [inventory, setInventory] = useState<PlayerInventoryItem[]>([]);
  const [redemptions, setRedemptions] = useState<PlayerRedemption[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeGame, setActiveGame] = useState<string>('all');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Redemption Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [revealedItem, setRevealedItem] = useState<ShopItem | null>(null);
  const [revealedContent, setRevealedContent] = useState<string | null>(null);
  const [revealedRedemption, setRevealedRedemption] = useState<PlayerRedemption | null>(null);

  // Vault Drawer State
  const [vaultOpen, setVaultOpen] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const refreshUserData = useCallback(() => {
    const u = platformStore.getCurrentUser();
    setUser(u);
    if (u) {
      setInventory(platformStore.getInventory(u.id));
      setRedemptions(platformStore.getRedemptions(u.id));
    }
  }, []);

  useEffect(() => {
    refreshUserData();
    const handleEvents = () => refreshUserData();
    window.addEventListener('balance-updated', handleEvents);
    window.addEventListener('inventory-updated', handleEvents);
    window.addEventListener('loadout-updated', handleEvents);
    window.addEventListener('redemptions-updated', handleEvents);

    return () => {
      window.removeEventListener('balance-updated', handleEvents);
      window.removeEventListener('inventory-updated', handleEvents);
      window.removeEventListener('loadout-updated', handleEvents);
      window.removeEventListener('redemptions-updated', handleEvents);
    };
  }, [refreshUserData]);

  const ownedItemIds = useMemo(() => new Set(inventory.map((i) => i.item_id)), [inventory]);
  const equippedItemIds = useMemo(
    () => new Set(inventory.filter((i) => i.is_equipped).map((i) => i.item_id)),
    [inventory]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;

      // Game filter (only for in-game loadout items)
      if (activeCategory === 'GAME_LOADOUT' && activeGame !== 'all') {
        if ((item.target_game_id || item.game_id) !== activeGame) return false;
      }

      return true;
    });
  }, [items, activeCategory, activeGame]);

  const handleRedeem = async (item: ShopItem) => {
    if (!user) {
      setFeedback({ type: 'error', message: 'Please sign in to unlock rewards.' });
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
    setFeedback(null);

    try {
      const res = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setRevealedItem(item);
        setRevealedContent(data.deliveredContent);
        setRevealedRedemption(data.redemption);
        setModalOpen(true);

        refreshUserData();
        confetti({ particleCount: 80, spread: 75, origin: { y: 0.6 } });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Redemption failed.' });
      }
    } catch {
      const memRes = platformStore.redeemItem(user.id, item.id);
      if (memRes.success) {
        setRevealedItem(item);
        setRevealedContent(memRes.deliveredContent || '');
        setRevealedRedemption(memRes.redemption || null);
        setModalOpen(true);
        refreshUserData();
      }
    } finally {
      setPurchasingId(null);
    }
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Top Banner */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Link
                  href="/games"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white transition-all"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-mono font-bold text-amber-300">
                  <Gift className="h-3.5 w-3.5" />
                  <span>ULTIMATUM REWARDS STORE</span>
                </div>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
                Shop & Rewards Vault
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Redeem tournament coins for in-game loadouts, single-use sponsored coupons, and digital guides.
              </p>
            </div>

            {/* Wallet & Vault Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setVaultOpen(!vaultOpen)}
                className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs font-mono font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all"
              >
                <History className="h-4 w-4 text-purple-400" />
                <span>My Vault ({redemptions.length})</span>
              </button>

              <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 to-yellow-950/20 px-4 py-2.5 shadow-lg shadow-amber-950/20">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[9px] font-mono font-bold text-amber-400/80 uppercase">Coin Balance</div>
                  <div className="text-lg font-black font-mono text-amber-300">
                    {(user?.points || 0).toLocaleString()} <span className="text-[10px] text-amber-400">COINS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveCategory(tab.id);
                    setFeedback(null);
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-mono font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Secondary Game Filter (if In-Game Loadout active) */}
          {activeCategory === 'GAME_LOADOUT' && (
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase pr-1">Filter Game:</span>
              {GAME_FILTERS.map((gf) => (
                <button
                  key={gf.id}
                  onClick={() => setActiveGame(gf.id)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-mono transition-all ${
                    activeGame === gf.id
                      ? 'border-purple-500 bg-purple-950/50 text-purple-300 font-bold'
                      : 'border-zinc-800 bg-zinc-900/30 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {gf.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Redemptions Vault Drawer */}
      {vaultOpen && (
        <div className="border-b border-purple-500/30 bg-purple-950/20 px-4 py-6">
          <div className="mx-auto max-w-7xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-400" />
                <h3 className="text-base font-black text-white font-mono">My Redemptions Vault</h3>
              </div>
              <button
                onClick={() => setVaultOpen(false)}
                className="text-xs font-mono text-zinc-400 hover:text-white"
              >
                ✕ Close Vault
              </button>
            </div>

            {redemptions.length === 0 ? (
              <p className="text-xs text-zinc-500 font-mono">No rewards unlocked yet. Earn coins in tournaments to redeem perks!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {redemptions.map((rdm) => (
                  <div
                    key={rdm.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-2 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white tracking-tight">{rdm.item?.name || 'Reward Item'}</span>
                      <span className="text-[10px] text-amber-400 font-bold">-{rdm.coins_spent} COINS</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
                      <span className="text-xs font-mono text-cyan-300 truncate max-w-[180px]">
                        {rdm.delivered_content}
                      </span>
                      <button
                        onClick={() => handleCopyCode(rdm.id, rdm.delivered_content)}
                        className="text-zinc-400 hover:text-white ml-2 flex-shrink-0"
                      >
                        {copiedCodeId === rdm.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    <div className="text-[10px] text-zinc-500">
                      Redeemed on {new Date(rdm.redeemed_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedback Toast */}
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
                  {/* Top Badges & Stock */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-mono font-black ${tierStyle.badge}`}>
                      {item.tier}
                    </span>

                    {item.stock_remaining > 0 ? (
                      <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300 font-bold">
                        ⚡ {item.stock_remaining} LEFT
                      </span>
                    ) : item.stock_remaining === 0 ? (
                      <span className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-mono text-red-400">
                        OUT OF STOCK
                      </span>
                    ) : (
                      <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                        {item.slot_type || item.category}
                      </span>
                    )}
                  </div>

                  {/* Item Image */}
                  <div className="h-36 w-full rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden relative mb-4">
                    {item.asset_url ? (
                      <Image
                        src={item.asset_url}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 300px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-700">
                        <ShoppingBag className="h-10 w-10" />
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight leading-snug">{item.name}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1 mb-3">{item.description}</p>

                  {/* Metadata Attribute Pills */}
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3 mb-4 space-y-1 text-xs font-mono">
                    {meta.sponsorName && (
                      <div className="flex items-center justify-between text-amber-300">
                        <span className="text-zinc-500">Partner:</span>
                        <span className="font-bold">{meta.sponsorName}</span>
                      </div>
                    )}
                    {meta.discountPercentage && (
                      <div className="flex items-center justify-between text-emerald-300">
                        <span className="text-zinc-500">Discount:</span>
                        <span className="font-bold">{meta.discountPercentage}% OFF</span>
                      </div>
                    )}
                    {meta.fileSize && (
                      <div className="flex items-center justify-between text-cyan-300">
                        <span className="text-zinc-500">File Package:</span>
                        <span className="font-bold">{meta.fileSize}</span>
                      </div>
                    )}
                    {meta.stat && (
                      <div className="flex items-center justify-between text-purple-300">
                        <span className="text-zinc-500">{meta.stat}:</span>
                        <span className="font-bold">+{meta.value}x</span>
                      </div>
                    )}
                    {meta.chefSprite && (
                      <div className="flex items-center justify-between text-pink-300">
                        <span className="text-zinc-500">Skin Hull:</span>
                        <span className="font-bold">{meta.chefSprite}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Redeem Action */}
                <div className="pt-2">
                  <button
                    onClick={() => handleRedeem(item)}
                    disabled={isProcessing || item.stock_remaining === 0 || (user ? user.points < item.price_coins : false)}
                    className={`w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-mono font-bold transition-all shadow-lg ${
                      item.stock_remaining === 0
                        ? 'bg-zinc-800 text-zinc-600 border border-zinc-700/30 cursor-not-allowed'
                        : user && user.points >= item.price_coins
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-amber-500/20 active:scale-95'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
                    }`}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : item.stock_remaining === 0 ? (
                      <span>SOLD OUT</span>
                    ) : user && user.points >= item.price_coins ? (
                      <>
                        <Coins className="h-4 w-4" />
                        <span>REDEEM NOW ({item.price_coins} COINS)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>{item.price_coins} COINS</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Redemption Reveal Modal */}
      <RewardRedemptionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={revealedItem}
        deliveredContent={revealedContent}
        redemption={revealedRedemption}
      />
    </div>
  );
}
