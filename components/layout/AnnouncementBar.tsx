'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { platformStore } from '@/lib/data/store';

export function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<{ enabled: boolean; text: string; link: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const settings = platformStore.getSettings();
    if (settings.announcement && settings.announcement.enabled) {
      setAnnouncement(settings.announcement);
    }
  }, []);

  if (!announcement || !announcement.enabled || dismissed) return null;

  return (
    <div className="relative isolate flex items-center justify-between gap-x-3 sm:gap-x-6 overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-900 to-cyan-900 px-3 py-2 text-[11px] sm:text-xs sm:px-6">
      <div className="mx-auto flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-white font-medium text-center">
        <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse flex-shrink-0" />
        <span className="line-clamp-2 sm:line-clamp-1">{announcement.text}</span>
        {announcement.link && (
          <Link
            href={announcement.link}
            className="inline-flex items-center gap-1 font-bold text-amber-300 hover:text-white underline underline-offset-2 ml-1 flex-shrink-0"
          >
            <span>Explore</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg p-1 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
