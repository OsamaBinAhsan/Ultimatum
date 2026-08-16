'use client';

import React, { useState, useEffect } from 'react';
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
    <div className="relative isolate flex items-center justify-between gap-x-6 overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-900 to-cyan-900 px-4 py-2 text-xs sm:px-6">
      <div className="mx-auto flex items-center gap-2 text-white font-medium">
        <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse flex-shrink-0" />
        <span>{announcement.text}</span>
        {announcement.link && (
          <Link
            href={announcement.link}
            className="flex items-center gap-1 font-bold text-amber-300 hover:text-white underline underline-offset-2 ml-1"
          >
            <span>Check it out</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="rounded p-1 text-zinc-300 hover:text-white hover:bg-white/10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
