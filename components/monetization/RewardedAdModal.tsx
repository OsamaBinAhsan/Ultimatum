'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sparkles, Trophy, CheckCircle, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardEarned: () => void;
  rewardDescription?: string;
}

export function RewardedAdModal({
  isOpen,
  onClose,
  onRewardEarned,
  rewardDescription = 'Revive with 1 Extra Life + 500 Bonus XP',
}: RewardedAdModalProps) {
  const [countdown, setCountdown] = useState(5);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setIsCompleted(false);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCompleted(true);
          // Trigger celebratory confetti
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaim = () => {
    onRewardEarned();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 p-6 text-white shadow-2xl">
        {/* Header Strip */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
              Rewarded Video Ad Integration
            </span>
          </div>
          {isCompleted && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Video Canvas Simulator */}
        <div className="relative my-4 aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <Image
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80"
            alt="Sponsored Game Gear"
            fill
            className="object-cover brightness-75"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          {/* Ad Content Overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SPONSORED SHOWCASE</span>
              </div>
              <h4 className="text-lg font-extrabold text-white">
                Razer Ultra-Speed Mechanical Keyboard
              </h4>
              <p className="text-xs text-zinc-300">
                Engineered for lightning actuation & esports dominance.
              </p>
            </div>

            {/* Countdown Badge */}
            {!isCompleted ? (
              <div className="flex flex-col items-center rounded-xl bg-black/80 px-3 py-1.5 border border-zinc-700">
                <span className="text-lg font-black text-cyan-400 font-mono">
                  00:0{countdown}
                </span>
                <span className="text-[10px] text-zinc-400 uppercase">Reward in</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-xl bg-emerald-950/90 border border-emerald-500 px-3 py-1.5 text-emerald-400 text-xs font-bold">
                <CheckCircle className="w-4 h-4" />
                <span>Ready!</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-1000"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Reward Status & CTA */}
        <div className="rounded-xl bg-zinc-900/90 p-4 border border-zinc-800 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-amber-400">
            <Trophy className="w-4 h-4" />
            <span>Reward Value</span>
          </div>
          <p className="mt-1 text-sm font-medium text-zinc-200">{rewardDescription}</p>

          <div className="mt-4 flex gap-3">
            {!isCompleted ? (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-800 py-3 text-sm font-semibold text-zinc-500 cursor-not-allowed"
              >
                <span>Watch ad to unlock reward ({countdown}s)</span>
              </button>
            ) : (
              <button
                onClick={handleClaim}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-cyan-400 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Claim Reward & Continue Playing</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
