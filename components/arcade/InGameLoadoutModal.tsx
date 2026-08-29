'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Sparkles,
  Shield,
  Zap,
  Volume2,
  Eye,
  CheckCircle2,
  Coins,
  Lock,
  Flame,
  Layers,
  ArrowRight,
  Info,
  Loader2,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import type { ShopItem, ShopSlotType, ItemTier, PlayerInventoryItem, GameLoadout } from '@/lib/types';
import confetti from 'canvas-confetti';

interface InGameLoadoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameSlug: string;
  gameTitle?: string;
  userId?: string;
}

const SLOT_CONFIGS: {
  type: ShopSlotType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}[] = [
  {
    type: 'VISUAL_SKIN',
    label: 'Visual Skin',
    icon: Eye,
    description: 'Custom board themes, character sprites, and blade hulls',
    color: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
  },
  {
    type: 'ACTION_JUICE',
    label: 'Action Juice',
    icon: Sparkles,
    description: 'VFX particle trails, supernova checkmates, and shatter blasts',
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  {
    type: 'GAME_GEAR',
    label: 'Game Gear',
    icon: Shield,
    description: 'Stat boosters, capacitor mana bonuses, and speed enhancers',
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  },
  {
    type: 'AUDIO_THEME',
    label: 'Audio Theme',
    icon: Volume2,
    description: 'Synthesizer presets, sub-bass impacts, and industrial soundscapes',
    color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  },
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

export function InGameLoadoutModal({
  isOpen,
  onClose,
  gameSlug,
  gameTitle,
  userId,
}: InGameLoadoutModalProps) {
  const [activeSlot, setActiveSlot] = useState<ShopSlotType>('VISUAL_SKIN');
  const [items, setItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<PlayerInventoryItem[]>([]);
  const [activeLoadout, setActiveLoadout] = useState<GameLoadout>({ gameGear: {} });
  const [userCoins, setUserCoins] = useState<number>(500);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeUser = platformStore.getCurrentUser();
  const targetUserId = userId || activeUser?.id || 'user-001';

  // Load items and inventory
  const refreshData = useCallback(() => {
    const allGameItems = platformStore.getShopItems(gameSlug);
    setItems(allGameItems);

    const userInv = platformStore.getInventory(targetUserId);
    setInventory(userInv);

    const loadout = platformStore.getLoadout(targetUserId, gameSlug);
    setActiveLoadout(loadout);

    const currentUser = platformStore.getCurrentUser();
    setUserCoins(currentUser?.points || 0);
  }, [gameSlug, targetUserId]);

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen, refreshData]);

  // Listen for inventory/balance events
  useEffect(() => {
    const handleEvents = () => refreshData();
    window.addEventListener('inventory-updated', handleEvents);
    window.addEventListener('loadout-updated', handleEvents);
    window.addEventListener('balance-updated', handleEvents);

    return () => {
      window.removeEventListener('inventory-updated', handleEvents);
      window.removeEventListener('loadout-updated', handleEvents);
      window.removeEventListener('balance-updated', handleEvents);
    };
  }, [refreshData]);

  // Filter items by active slot
  const slotItems = useMemo(() => {
    return items.filter((item) => item.slot_type === activeSlot);
  }, [items, activeSlot]);

  // Check ownership
  const ownedItemIds = useMemo(() => {
    return new Set(inventory.map((i) => i.item_id));
  }, [inventory]);

  // Check equipped status
  const equippedItemIds = useMemo(() => {
    return new Set(inventory.filter((i) => i.is_equipped).map((i) => i.item_id));
  }, [inventory]);

  // Equip / Unequip Action
  const handleToggleEquip = async (item: ShopItem) => {
    setProcessingId(item.id);
    const isCurrentlyEquipped = equippedItemIds.has(item.id);

    try {
      const res = await fetch('/api/shop/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          userId: targetUserId,
          action: isCurrentlyEquipped ? 'unequip' : 'equip',
          gameId: gameSlug,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(
          isCurrentlyEquipped ? `Unequipped ${item.name}` : `Equipped ${item.name} into ${item.slot_type}!`
        );
        refreshData();
        if (!isCurrentlyEquipped) {
          confetti({ particleCount: 35, spread: 45, origin: { y: 0.7 } });
        }
      } else {
        setStatusMessage(data.error || 'Failed to update loadout.');
      }
    } catch {
      // Offline fallback
      if (isCurrentlyEquipped) {
        platformStore.unequipItem(targetUserId, item.id);
      } else {
        platformStore.equipItem(targetUserId, item.id);
      }
      refreshData();
    } finally {
      setProcessingId(null);
    }
  };

  // Buy & Equip Action
  const handlePurchaseAndEquip = async (item: ShopItem) => {
    if (userCoins < item.price_coins) {
      setStatusMessage(`Insufficient Coins! Need ${item.price_coins} (You have ${userCoins}).`);
      return;
    }

    setProcessingId(item.id);

    try {
      const res = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          userId: targetUserId,
          autoEquip: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(`🎉 Unlocked & Equipped: ${item.name}!`);
        refreshData();
        confetti({ particleCount: 60, spread: 65, origin: { y: 0.6 } });
      } else {
        setStatusMessage(data.error || 'Purchase failed.');
      }
    } catch {
      const fallbackRes = platformStore.purchaseItem(targetUserId, item.id);
      if (fallbackRes.success) {
        setStatusMessage(`🎉 Unlocked: ${item.name}!`);
        refreshData();
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-zinc-800 bg-zinc-950/95 shadow-2xl shadow-cyan-950/30 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-inner">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  IN-GAME 4-SLOT LOADOUT & SKINS
                </h2>
                <span className="rounded-full bg-cyan-950 border border-cyan-700/50 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-400">
                  {gameTitle || gameSlug}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Equip customized skins, juice particles, and hardware gear without leaving the match
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Coin Balance Badge */}
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 font-mono text-xs font-black text-amber-300">
              <Coins className="h-4 w-4 text-amber-400" />
              <span>{userCoins.toLocaleString()}</span>
              <span className="text-[10px] text-amber-400/70">COINS</span>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:border-zinc-700 hover:text-white transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 4-Slot Tab Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-zinc-900/30 border-b border-zinc-800/60">
          {SLOT_CONFIGS.map((slot) => {
            const Icon = slot.icon;
            const isActive = activeSlot === slot.type;
            const equippedInThisSlot = inventory.find(
              (inv) => inv.is_equipped && inv.item?.slot_type === slot.type
            );

            return (
              <button
                key={slot.type}
                onClick={() => {
                  setActiveSlot(slot.type);
                  setStatusMessage(null);
                }}
                className={`relative flex flex-col items-start p-3 rounded-2xl border transition-all text-left ${
                  isActive
                    ? 'border-cyan-500 bg-cyan-950/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-zinc-400'}`} />
                    <span
                      className={`text-xs font-bold font-mono tracking-tight ${
                        isActive ? 'text-white' : 'text-zinc-300'
                      }`}
                    >
                      {slot.label}
                    </span>
                  </div>
                  {equippedInThisSlot && (
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                  )}
                </div>

                <p className="text-[10px] text-zinc-500 line-clamp-1">
                  {equippedInThisSlot ? (
                    <span className="text-emerald-400 font-mono font-medium">
                      ✓ {equippedInThisSlot.item?.name}
                    </span>
                  ) : (
                    'Empty Slot'
                  )}
                </p>
              </button>
            );
          })}
        </div>

        {/* Status Notification Toast */}
        {statusMessage && (
          <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-950/40 px-4 py-2 text-xs font-mono text-cyan-300">
            <span>{statusMessage}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-cyan-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Items Grid & Active Slot Catalog */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {slotItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Info className="h-10 w-10 text-zinc-600 mb-3" />
              <h3 className="text-sm font-bold text-zinc-400 font-mono">No items found in this slot category</h3>
              <p className="text-xs text-zinc-600 max-w-sm mt-1">
                Customizations for this game slot will appear during weekly tournament updates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {slotItems.map((item) => {
                const isOwned = ownedItemIds.has(item.id);
                const isEquipped = equippedItemIds.has(item.id);
                const tierStyle = TIER_COLORS[item.tier] || TIER_COLORS.COMMON;
                const isProcessing = processingId === item.id;

                let meta: Record<string, any> = {};
                try {
                  meta = typeof item.metadata_json === 'string' ? JSON.parse(item.metadata_json) : item.metadata_json;
                } catch {
                  meta = {};
                }

                return (
                  <div
                    key={item.id}
                    className={`relative flex flex-col justify-between rounded-2xl border bg-zinc-900/60 p-4 transition-all duration-200 ${
                      isEquipped
                        ? 'border-emerald-500/80 bg-emerald-950/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
                        : `${tierStyle.border} ${tierStyle.glow}`
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`rounded-lg border px-2 py-0.5 text-[10px] font-mono font-black ${tierStyle.badge}`}
                        >
                          {item.tier}
                        </span>

                        {isEquipped ? (
                          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono font-black text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>EQUIPPED</span>
                          </div>
                        ) : isOwned ? (
                          <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                            OWNED
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 font-mono text-xs font-black text-amber-400">
                            <Coins className="h-3.5 w-3.5" />
                            <span>{item.price_coins}</span>
                          </div>
                        )}
                      </div>

                      {/* Item Title & Slug */}
                      <h4 className="text-sm font-bold text-white tracking-tight">{item.name}</h4>
                      <p className="text-[11px] font-mono text-zinc-500 mb-3">{item.slug}</p>

                      {/* Dynamic Visual Preview Swatch */}
                      <div className="rounded-xl border border-zinc-800/80 bg-zinc-950 p-3 mb-3 space-y-1.5">
                        <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase flex items-center justify-between">
                          <span>Metadata Telemetry</span>
                          <Sparkles className="h-3 w-3 text-cyan-400" />
                        </div>

                        {/* Metadata breakdown */}
                        <div className="text-xs font-mono space-y-1">
                          {meta.stat && (
                            <div className="flex items-center justify-between text-cyan-300">
                              <span className="text-zinc-500">{meta.stat}:</span>
                              <span className="font-bold">+{meta.value}x</span>
                            </div>
                          )}
                          {meta.chefSprite && (
                            <div className="flex items-center justify-between text-pink-300">
                              <span className="text-zinc-500">Chef Hull:</span>
                              <span className="font-bold">{meta.chefSprite}</span>
                            </div>
                          )}
                          {meta.boardDark && (
                            <div className="flex items-center justify-between text-purple-300">
                              <span className="text-zinc-500">Board Hex:</span>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="h-3 w-3 rounded-full border border-white/20"
                                  style={{ backgroundColor: meta.coreColor || meta.boardLight }}
                                />
                                <span className="font-bold">{meta.coreColor || meta.boardLight}</span>
                              </div>
                            </div>
                          )}
                          {meta.dashParticleColor && (
                            <div className="flex items-center justify-between text-amber-300">
                              <span className="text-zinc-500">Trail:</span>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: meta.dashParticleColor }}
                                />
                                <span>{meta.trailType || 'nitro'}</span>
                              </div>
                            </div>
                          )}
                          {meta.synthPreset && (
                            <div className="flex items-center justify-between text-purple-300">
                              <span className="text-zinc-500">Synth Audio:</span>
                              <span className="font-bold">{meta.synthPreset}</span>
                            </div>
                          )}
                          {meta.borderClass && (
                            <div className="flex items-center justify-between text-cyan-300">
                              <span className="text-zinc-500">Frame FX:</span>
                              <span className="font-bold">Holo Glow</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      {isEquipped ? (
                        <button
                          onClick={() => handleToggleEquip(item)}
                          disabled={isProcessing}
                          className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-mono font-bold text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'UNEQUIP'}
                        </button>
                      ) : isOwned ? (
                        <button
                          onClick={() => handleToggleEquip(item)}
                          disabled={isProcessing}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-3 py-2 text-xs font-mono font-bold text-white hover:bg-cyan-500 transition-all shadow-md shadow-cyan-600/30 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Zap className="h-3.5 w-3.5" />
                              <span>EQUIP LOADOUT</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePurchaseAndEquip(item)}
                          disabled={isProcessing || userCoins < item.price_coins}
                          className={`w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-mono font-bold transition-all shadow-md ${
                            userCoins >= item.price_coins
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-amber-500/20'
                              : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
                          }`}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : userCoins >= item.price_coins ? (
                            <>
                              <Coins className="h-3.5 w-3.5" />
                              <span>BUY & EQUIP (${item.price_coins} COINS)</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-3.5 w-3.5" />
                              <span>NEED ${item.price_coins - userCoins} MORE COINS</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Loadout Summary Footer */}
        <div className="border-t border-zinc-800 bg-zinc-950 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase">ACTIVE 4-SLOT DECK:</span>
            <div className="flex items-center gap-2">
              {SLOT_CONFIGS.map((slot) => {
                const eq = inventory.find(
                  (inv) => inv.is_equipped && inv.item?.slot_type === slot.type
                );
                return (
                  <span
                    key={slot.type}
                    className={`rounded-lg border px-2.5 py-1 text-[10px] font-mono font-bold ${
                      eq
                        ? 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300'
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-600'
                    }`}
                  >
                    {slot.label}: {eq?.item?.name || 'Default'}
                  </span>
                );
              })}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-mono font-bold text-white hover:bg-zinc-700 transition-all"
          >
            DONE & RESUME
          </button>
        </div>
      </div>
    </div>
  );
}
