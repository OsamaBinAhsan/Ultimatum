'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Calendar } from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { CustomPage } from '@/lib/types';
import { AdSlot } from '@/components/monetization/AdSlot';

export default function DynamicSubPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [page, setPage] = useState<CustomPage | null>(null);

  useEffect(() => {
    const p = platformStore.getPageBySlug(slug);
    if (p) setPage(p);
  }, [slug]);

  if (!page && typeof window !== 'undefined') {
    const p = platformStore.getPageBySlug(slug);
    if (!p) return notFound();
  }

  if (!page) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Top Breadcrumb */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-cyan-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Homepage</span>
      </Link>

      {/* Page Header */}
      <header className="space-y-3 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>FEATURED SPECIAL GUIDE</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          {page.title}
        </h1>
        {page.subtitle && (
          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed">
            {page.subtitle}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono pt-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>Published on {new Date(page.created_at).toLocaleDateString()}</span>
        </div>
      </header>

      {/* Page Body Content */}
      <div className="prose prose-invert max-w-none text-zinc-200 leading-relaxed space-y-6">
        <div className="whitespace-pre-line rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-10 shadow-xl">
          {page.content}
        </div>
      </div>

      {/* Optional Ad Slot */}
      {page.enable_ads && (
        <div className="pt-6">
          <AdSlot slot="in_content" label="CUSTOM SUB-PAGE BANNER (728x90)" />
        </div>
      )}
    </div>
  );
}
