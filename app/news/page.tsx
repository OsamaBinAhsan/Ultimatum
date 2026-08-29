'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight, Search, Zap } from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Article } from '@/lib/types';
import { AdSlot } from '@/components/monetization/AdSlot';

export default function NewsHubPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch both gaming news and editorial blogs
    const news = platformStore.getArticles().filter((a) => a.category !== 'beauty_fashion');
    setArticles(news);
  }, []);

  const categories = [
    { id: 'all', label: 'All Breaking & News' },
    { id: 'gaming_news', label: 'Gaming & Silicon News' },
    { id: 'news_editorial', label: 'Editorial & Esports' },
  ];

  const filtered = articles.filter((a) => {
    const matchesCat = selectedCategory === 'all' || a.category === selectedCategory;
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const breaking = articles.find((a) => a.is_breaking);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-r from-zinc-950 via-red-950/25 to-zinc-950 p-5 sm:p-8 md:p-12 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[10px] sm:text-xs font-mono font-bold text-red-400">
            <Zap className="w-3.5 h-3.5" />
            <span>DISPATCH WIRE & EDITORIAL ESSAYS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            The Newsroom & Blogs
          </h1>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Real-time gaming headlines, handheld silicon thermal benchmarks, tournament patch notes, and cultural essays covering the modern digital lifestyle.
          </p>
        </div>
      </div>

      {/* Breaking News Card (If Available) */}
      {breaking && (
        <Link
          href={`/news/${breaking.slug}`}
          className="group relative block overflow-hidden rounded-3xl border border-red-500/50 bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-950 p-4 sm:p-6 md:p-8 shadow-2xl hover:border-red-400 transition-all"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-[10px] sm:text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
                  BREAKING DISPATCH
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  {new Date(breaking.published_at).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white group-hover:text-red-400 transition-colors">
                {breaking.title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-3xl leading-relaxed">
                {breaking.subtitle}
              </p>
            </div>

            <div className="flex-shrink-0 w-full sm:w-auto">
              <span className="flex items-center justify-center gap-1.5 rounded-2xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 group-hover:bg-red-500 transition-all tap-target">
                <span>Read Story</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* Filter Strip */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center border-b border-zinc-800 pb-4">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl px-3 sm:px-4 py-2 text-xs font-bold transition-all tap-target ${
                selectedCategory === cat.id
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search news, esports, tech..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none tap-target"
          />
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        {filtered.map((article) => (
          <Link
            key={article.id}
            href={`/news/${article.slug}`}
            className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70 shadow-xl transition-all hover:border-red-500/50 hover:bg-zinc-900 hover:-translate-y-1"
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
                <span className="rounded-full bg-black/80 px-3 py-1 text-xs font-mono font-bold text-red-400 border border-red-500/30 backdrop-blur-sm uppercase">
                  {article.category.replace('_', ' ')}
                </span>
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

                <h3 className="mt-2.5 text-xl font-bold text-white group-hover:text-red-400 transition-colors">
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
                <span className="text-red-400 flex items-center gap-1 group-hover:underline">
                  <span>Read Story</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <AdSlot slot="in_content" label="NEWS IN-FEED LEADERBOARD (728x90)" />
    </div>
  );
}
