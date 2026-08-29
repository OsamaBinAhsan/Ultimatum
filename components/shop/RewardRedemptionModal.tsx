'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  CheckCircle2,
  Copy,
  Check,
  Download,
  ExternalLink,
  Sparkles,
  Gift,
  Shield,
  Zap,
  Tag,
  Key,
  QrCode,
  ArrowRight,
  Clock,
  HelpCircle,
} from 'lucide-react';
import type { ShopItem, PlayerRedemption, ItemTier } from '@/lib/types';

interface RewardRedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ShopItem | null;
  deliveredContent: string | null;
  redemption?: PlayerRedemption | null;
}

const TIER_COLORS: Record<ItemTier, { badge: string; border: string; glow: string }> = {
  COMMON: {
    badge: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    border: 'border-zinc-800',
    glow: '',
  },
  RARE: {
    badge: 'bg-blue-950 text-blue-300 border-blue-600/60',
    border: 'border-blue-500/50',
    glow: 'shadow-[0_0_25px_rgba(59,130,246,0.25)]',
  },
  EPIC: {
    badge: 'bg-purple-950 text-purple-300 border-purple-600/60',
    border: 'border-purple-500/50',
    glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
  },
  LEGENDARY: {
    badge: 'bg-amber-950 text-amber-300 border-amber-500/60',
    border: 'border-amber-400/80',
    glow: 'shadow-[0_0_35px_rgba(245,158,11,0.35)]',
  },
};

export function RewardRedemptionModal({
  isOpen,
  onClose,
  item,
  deliveredContent,
  redemption,
}: RewardRedemptionModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  let meta: Record<string, any> = {};
  try {
    meta = typeof item.metadata_json === 'string' ? JSON.parse(item.metadata_json) : item.metadata_json;
  } catch {
    meta = {};
  }

  const tierStyle = TIER_COLORS[item.tier] || TIER_COLORS.COMMON;
  const isVoucherOrPerk = item.category === 'SPONSORED_PERK' || item.category === 'AFFILIATE_VOUCHER';
  const isDownload = item.category === 'DIGITAL_DOWNLOAD';
  const isGameLoadout = item.category === 'GAME_LOADOUT' || item.category === 'PROFILE_COSMETIC';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-lg rounded-3xl border bg-zinc-950 p-6 sm:p-8 text-white shadow-2xl overflow-hidden ${tierStyle.border} ${tierStyle.glow}`}
      >
        {/* Decorative Background Glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:border-zinc-700 hover:text-white transition-all z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-950/30">
            <Sparkles className="h-7 w-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-mono font-bold text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>REWARD UNLOCKED & RECORDED</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">{item.name}</h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">{item.description}</p>
        </div>

        {/* Dynamic Redemption Details Box */}
        <div className="mt-6 space-y-4">
          {isVoucherOrPerk && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-amber-400" />
                  <span>SINGLE-USE REWARD SERIAL CODE</span>
                </span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300">VALIDATED</span>
              </div>

              {/* Serial Code Display & Copy Box */}
              <div className="flex items-center justify-between rounded-xl border border-amber-500/50 bg-black/80 px-4 py-3 font-mono">
                <span className="text-lg sm:text-xl font-black tracking-widest text-amber-300 select-all">
                  {deliveredContent || 'PROMO-CODE-UNLOCKED'}
                </span>
                <button
                  onClick={() => copyToClipboard(deliveredContent || '')}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-black text-black hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'COPIED!' : 'COPY'}</span>
                </button>
              </div>

              {/* Sponsor & Instructions */}
              <div className="text-[11px] font-mono text-zinc-400 space-y-1">
                {meta.sponsorName && (
                  <div>
                    <strong className="text-zinc-300">Sponsor:</strong> {meta.sponsorName}
                  </div>
                )}
                {meta.instructions && (
                  <div>
                    <strong className="text-zinc-300">Instructions:</strong> {meta.instructions}
                  </div>
                )}
                {meta.expiryDate && (
                  <div className="flex items-center gap-1 text-zinc-500">
                    <Clock className="h-3 w-3" />
                    <span>Expires: {meta.expiryDate}</span>
                  </div>
                )}
              </div>

              {meta.redeemUrl && (
                <a
                  href={meta.redeemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-2 text-xs font-mono font-bold text-white hover:bg-zinc-800 transition-all"
                >
                  <span>Go to Merchant Checkout</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}

          {isDownload && (
            <div className="rounded-2xl border border-cyan-500/40 bg-cyan-950/20 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <Download className="h-4 w-4 text-cyan-400" />
                  <span>DIGITAL PACKAGE READY FOR DOWNLOAD</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">{meta.fileSize || 'PDF'}</span>
              </div>

              {meta.decryptionPass && (
                <div className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-black/80 px-3.5 py-2 font-mono text-xs">
                  <span className="text-zinc-400">Decryption Pass:</span>
                  <span className="font-bold text-cyan-300">{meta.decryptionPass}</span>
                  <button
                    onClick={() => copyToClipboard(meta.decryptionPass)}
                    className="text-cyan-400 hover:text-white"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <a
                href={deliveredContent || meta.downloadUrl || '#'}
                download
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-xs font-mono font-bold text-white hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-600/30"
              >
                <Download className="h-4 w-4" />
                <span>DOWNLOAD FILE NOW</span>
              </a>
            </div>
          )}

          {isGameLoadout && (
            <div className="rounded-2xl border border-purple-500/40 bg-purple-950/20 p-5 space-y-3 text-center">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-purple-300">
                <Zap className="h-4 w-4 text-purple-400" />
                <span>EQUIPPED TO ACTIVE 4-SLOT LOADOUT</span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                This item is now equipped in your active loadout deck for {item.target_game_id || item.game_id || 'Universal profile'}.
              </p>
              {item.target_game_id && (
                <Link
                  href={`/games/${item.target_game_id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-mono font-bold text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/30"
                >
                  <span>LAUNCH GAME & PLAY</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>Saved to Redemptions Vault</span>
          <button
            onClick={onClose}
            className="rounded-xl bg-zinc-800 px-4 py-2 font-bold text-white hover:bg-zinc-700 transition-all"
          >
            CONTINUE BROWSING
          </button>
        </div>
      </div>
    </div>
  );
}
