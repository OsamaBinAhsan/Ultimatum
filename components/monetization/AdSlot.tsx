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
          dimensions: '728x90 / 970x250',
          styleClasses: 'h-[90px] md:h-[120px] max-w-5xl',
        };
      case 'sidebar':
        return {
          dimensions: '300x250 / 300x600',
          styleClasses: 'min-h-[250px] w-full',
        };
      case 'in_content':
        return {
          dimensions: '728x90 / 336x280',
          styleClasses: 'min-h-[140px] max-w-3xl',
        };
      case 'footer':
        return {
          dimensions: '728x90 / 320x50',
          styleClasses: 'h-[70px] md:h-[90px] max-w-4xl',
        };
      default:
        return {
          dimensions: 'Responsive Ad Unit',
          styleClasses: 'min-h-[100px] w-full',
        };
    }
  };

  const { dimensions, styleClasses } = getSlotConfig();

  return (
    <div
      data-ad-slot={slot}
      className={`relative mx-auto my-4 overflow-hidden rounded-xl border border-dashed border-zinc-700/80 bg-zinc-900/60 p-2 shadow-inner transition-all hover:border-zinc-500 ${styleClasses} ${className}`}
    >
      {/* Visual Marker for AdSense/Ezoic Tag Drop-in */}
      <div className="absolute top-1 right-2 flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
        <span>{label || `AD SLOT [${slot.toUpperCase()}]`}</span>
      </div>

      {sponsor ? (
        <a
          href={sponsor.destination_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleSponsorClick}
          className="group relative flex h-full w-full items-center justify-between overflow-hidden rounded-lg bg-zinc-950 p-3"
        >
          <div className="relative h-full w-28 md:w-36 flex-shrink-0 overflow-hidden rounded-md">
            <Image
              src={sponsor.image_url}
              alt={sponsor.sponsor_name}
              fill
              sizes="(max-width: 768px) 100vw, 200px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-1 flex-col justify-center px-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Featured Partner
            </div>
            <div className="text-sm font-bold text-white group-hover:text-cyan-400">
              {sponsor.sponsor_name}
            </div>
            <div className="text-xs text-zinc-400">
              Official Partner Campaign • Click to learn more
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-cyan-400 group-hover:underline">
            <span>Visit</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </a>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center text-center">
          <div className="text-xs font-semibold text-zinc-400 tracking-wide">
            MONETIZATION PLACEMENT CONTAINER
          </div>
          <div className="text-[11px] font-mono text-zinc-500">
            Target Spec: {dimensions} • Drop AdSense / Ezoic / Mediavine Code Here
          </div>
        </div>
      )}
    </div>
  );
}
