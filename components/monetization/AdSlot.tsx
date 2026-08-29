'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { platformStore } from '@/lib/data/store';
import { Sponsor, AdSlotPosition } from '@/lib/types';
import { ExternalLink, Sparkles } from 'lucide-react';

interface AdSlotProps {
  slot: AdSlotPosition;
  className?: string;
  label?: string;
}

export function AdSlot({ slot, className = '', label }: AdSlotProps) {
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [adsEnabled, setAdsEnabled] = useState(true);

  useEffect(() => {
    const settings = platformStore.getSettings();
    if (!settings.monetization.ads_enabled) {
      setAdsEnabled(false);
      return;
    }

    // Check specific slot switch
    if (slot === 'header_banner' && !settings.monetization.header_ad) setAdsEnabled(false);
    if (slot === 'sidebar' && !settings.monetization.sidebar_ad) setAdsEnabled(false);
    if (slot === 'in_content' && !settings.monetization.in_content_ad) setAdsEnabled(false);
    if (slot === 'footer' && !settings.monetization.sticky_footer_ad) setAdsEnabled(false);

    const sp = platformStore.getSponsorBySlot(slot);
    if (sp) {
      setSponsor(sp);
      platformStore.trackImpression(sp.id);
    }
  }, [slot]);

  if (!adsEnabled) return null;

  const handleSponsorClick = () => {
    if (sponsor) {
      platformStore.trackClick(sponsor.id);
    }
  };

  // Dimensions configuration according to IAB guidelines
  const getSlotConfig = () => {
    switch (slot) {
      case 'header_banner':
        return {
          dimensions: '320x50 / 728x90 / 970x250',
          styleClasses: 'min-h-[60px] sm:min-h-[90px] md:min-h-[110px] max-w-5xl',
        };
      case 'sidebar':
        return {
          dimensions: '300x250 / 300x600',
          styleClasses: 'min-h-[250px] w-full',
        };
      case 'in_content':
        return {
          dimensions: '300x250 / 728x90',
          styleClasses: 'min-h-[90px] sm:min-h-[120px] max-w-3xl',
        };
      case 'footer':
        return {
          dimensions: '320x50 / 728x90',
          styleClasses: 'min-h-[50px] sm:min-h-[70px] md:min-h-[90px] max-w-4xl',
        };
      default:
        return {
          dimensions: 'Responsive Ad Unit',
          styleClasses: 'min-h-[80px] w-full',
        };
    }
  };

  const { dimensions, styleClasses } = getSlotConfig();

  return (
    <div
      data-ad-slot={slot}
      className={`relative mx-auto my-3 sm:my-4 overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-2 sm:p-2.5 shadow-sm transition-all hover:border-zinc-700 w-full ${styleClasses} ${className}`}
    >
      {sponsor ? (
        <a
          href={sponsor.destination_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleSponsorClick}
          className="group relative flex flex-col sm:flex-row h-full w-full items-start sm:items-center justify-between gap-3 overflow-hidden rounded-xl bg-zinc-950 p-2.5 sm:p-3 border border-zinc-800/80"
        >
          <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
            <div className="relative h-12 w-20 sm:h-14 sm:w-24 md:w-32 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-900">
              <Image
                src={sponsor.image_url}
                alt={sponsor.sponsor_name}
                fill
                sizes="(max-width: 768px) 120px, 200px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                  SPONSORED
                </span>
                <span className="text-zinc-600 text-[10px]">&bull;</span>
                <span className="text-[10px] text-zinc-400 truncate">Featured Partner</span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-400 truncate">
                {sponsor.sponsor_name}
              </div>
              <div className="text-[11px] text-zinc-400 line-clamp-1">
                Official Partner Campaign &bull; Click to learn more
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 group-hover:underline self-end sm:self-center flex-shrink-0">
            <span>Visit</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </a>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center text-center p-3 sm:p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/50">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
            <span>ADVERTISEMENT</span>
          </div>
          <div className="text-xs font-semibold text-zinc-300 mt-0.5">
            Partner With Ultimatum
          </div>
          <div className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
            Reach hundreds of thousands of gamers, chefs, and tech enthusiasts.
          </div>
        </div>
      )}
    </div>
  );
}
