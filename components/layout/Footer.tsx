'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gamepad2, Utensils, Cpu, ShieldCheck, Mail, ArrowRight, Newspaper, Sparkles } from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { CustomPage } from '@/lib/types';
import { AdSlot } from '@/components/monetization/AdSlot';
import { BrandLogo } from '@/components/ui/BrandLogo';

export function Footer() {
  const [footerPages, setFooterPages] = useState<CustomPage[]>([]);

  useEffect(() => {
    setFooterPages(platformStore.getPages().filter((p) => p.show_in_footer));
  }, []);

  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950 text-zinc-400 pb-safe">
      {/* Sticky / Footer Ad Slot Placement */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <AdSlot slot="footer" label="FOOTER STICKY LEADERBOARD (728x90)" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Brand Col */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-3">
            <Link href="/" className="group flex items-center gap-2.5">
              <BrandLogo size="md" />
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-zinc-400">
              The premier high-traffic nexus of retro canvas gaming, Michelin-standard kitchen recipes, skincare science, and authoritative tech lab teardowns.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Independent Editorial Testing</span>
            </div>
          </div>

          {/* Navigation Hubs */}
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
              The Hubs
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/games" className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>The Arcade (Games)</span>
                </Link>
              </li>
              <li>
                <Link href="/recipes" className="flex items-center gap-2 hover:text-amber-400 transition-colors">
                  <Utensils className="w-3.5 h-3.5" />
                  <span>The Kitchen (Recipes)</span>
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="flex items-center gap-2 hover:text-indigo-400 transition-colors">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>The Lab (Reviews)</span>
                </Link>
              </li>
              <li>
                <Link href="/beauty-fashion" className="flex items-center gap-2 hover:text-pink-400 transition-colors">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Beauty & Fashion Lab</span>
                </Link>
              </li>
              <li>
                <Link href="/news" className="flex items-center gap-2 hover:text-red-400 transition-colors">
                  <Newspaper className="w-3.5 h-3.5" />
                  <span>Newsroom & Blogs</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Custom Dynamic Pages */}
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
              Featured Guides & Specials
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              {footerPages.map((page) => (
                <li key={page.id}>
                  <Link href={`/pages/${page.slug}`} className="hover:text-white transition-colors">
                    {page.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/media-kit" className="text-amber-400 font-semibold hover:underline">
                  Media Kit & Direct Sponsorships →
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
              Trust & Monetization
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us & Editorial Standards
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy & Cookies
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-purple-400 font-semibold hover:underline">
                  Admin CMS Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} Ultimatum Media Group. Built for high-traffic monetization.</p>
          <div className="flex items-center gap-4">
            <span>FTC Affiliate Disclosure</span>
            <span>•</span>
            <span>GDPR / CCPA Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
