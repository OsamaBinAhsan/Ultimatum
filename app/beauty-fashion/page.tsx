'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ShoppingBag, Clock, ArrowRight, Search } from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Article } from '@/lib/types';
import { AdSlot } from '@/components/monetization/AdSlot';

export default function BeautyFashionHubPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setArticles(platformStore.getArticles('beauty_fashion'));
  }, []);

  const tags = ['All', 'Techwear', 'Skincare Science', 'Streetwear', 'Dermatology', 'Modular Fashion'];

  const filtered = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'All' || a.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
    return matchesSearch && matchesTag;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-pink-500/30 bg-gradient-to-r from-zinc-950 via-pink-950/25 to-zinc-950 p-5 sm:p-8 md:p-12 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-400/40 bg-pink-500/10 px-3 py-1 text-[10px] sm:text-xs font-mono font-bold text-pink-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>BEAUTY, SKINCARE SCIENCE & TECHWEAR</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Beauty & Fashion Lab
          </h1>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Dermatological screen-defense science, modular techwear teardowns, and curated shoppable street style lookbooks backed by verified material engineering.
          </p>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search beauty, techwear, skincare..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none tap-target"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`rounded-xl px-3 sm:px-3.5 py-1.5 text-xs font-bold transition-all tap-target ${
                selectedTag === tag
                  ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        {filtered.map((article) => (
          <Link
            key={article.id}
            href={`/beauty-fashion/${article.slug}`}
            className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70 shadow-xl transition-all hover:border-pink-500/50 hover:bg-zinc-900 hover:-translate-y-1"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
              <Image
                src={article.hero_image_url}
                alt={article.title}
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="rounded-full bg-black/80 px-3 py-1 text-xs font-mono font-bold text-pink-300 border border-pink-500/30 backdrop-blur-sm">
                  LIFESTYLE LAB
                </span>
                {article.shoppable_items && article.shoppable_items.length > 0 && (
                  <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-zinc-950 flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" />
                    <span>{article.shoppable_items.length} Shoppable Pieces</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
              <div>
                <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {article.read_time} min read
                  </span>
                  <span>•</span>
                  <span>By {article.author}</span>
                </div>

                <h3 className="mt-2.5 text-xl font-bold text-white group-hover:text-pink-400 transition-colors">
                  {article.title}
                </h3>
                <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {article.subtitle}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800 pt-4 text-xs font-semibold">
                <div className="flex flex-wrap gap-1.5">
                  {article.tags.map((t) => (
                    <span key={t} className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                      {t}
                    </span>
                  ))}
                </div>
                <span className="text-pink-400 flex items-center gap-1 group-hover:underline">
                  <span>Explore Lookbook</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <AdSlot slot="in_content" label="BEAUTY & FASHION IN-FEED AD (728x90)" />
    </div>
  );
}
