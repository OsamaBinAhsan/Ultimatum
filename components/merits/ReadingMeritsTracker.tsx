'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Coins, CheckCircle } from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import confetti from 'canvas-confetti';

interface ReadingMeritsTrackerProps {
  contentSlug: string;
  contentType?: 'article' | 'recipe' | 'review';
}

export function ReadingMeritsTracker({ contentSlug, contentType = 'article' }: ReadingMeritsTrackerProps) {
  const [hasAwarded, setHasAwarded] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // 30 seconds reading milestone
    const timer = setTimeout(() => {
      if (!hasAwarded) {
        const bonus = platformStore.awardReadingXP(contentSlug);
        if (bonus > 0) {
          setHasAwarded(true);
          setShowToast(true);
          confetti({ particleCount: 50, spread: 50, origin: { y: 0.85 } });
          setTimeout(() => setShowToast(false), 5000);
        }
      }
    }, 25000); // 25s threshold

    return () => clearTimeout(timer);
  }, [contentSlug, hasAwarded]);

  if (!showToast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce">
      <div className="flex items-center gap-3 rounded-2xl border border-amber-500/50 bg-zinc-950/95 p-4 text-white shadow-2xl backdrop-blur-xl">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-zinc-950">
          <Coins className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Reading Merit Unlocked!</span>
          </div>
          <div className="text-xs text-zinc-300">
            +25 Engagement XP awarded to your profile.
          </div>
        </div>
      </div>
    </div>
  );
}
