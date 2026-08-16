'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Gamepad2, Trophy, Flame, Play, Sparkles, Filter } from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Game, GameCategory } from '@/lib/types';
import { AdSlot } from '@/components/monetization/AdSlot';

export default function GamesHubPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    setGames(platformStore.getGames());
  }, []);

  const categories = [
    { id: 'all', label: 'All Arcade Vault' },
    { id: 'arcade', label: 'Classic Arcade' },
    { id: 'action', label: 'Fast Action' },
    { id: 'puzzle', label: 'Puzzles & Cooking' },
    { id: 'retro', label: '8-Bit Retro' },
  ];

  const filteredGames =
    activeCategory === 'all' ? games : games.filter((g) => g.category === activeCategory);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-zinc-950 via-cyan-950/40 to-zinc-950 p-8 sm:p-12 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-mono font-bold text-cyan-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PLAYABLE 2D & CANVAS ENGINES</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            The Arcade Vault
          </h1>
          <p className="text-base text-zinc-300 leading-relaxed">
            Play responsive casual & MS-paint styled arcade games directly in your browser. Set weekly high scores, earn Engagement XP, and claim limited-edition profile badges.
          </p>
        </div>
      </div>

      {/* Category Filter Strip */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-4">
        <Filter className="w-4 h-4 text-zinc-500 mr-2" />
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeCategory === cat.id
                ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredGames.map((game) => (
          <div
            key={game.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl transition-all hover:border-cyan-500/50 hover:bg-zinc-900"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-950">
              <Image
                src={game.thumbnail_url}
                alt={game.title}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="rounded-full bg-black/80 px-3 py-1 text-[11px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                  {game.category.toUpperCase()}
                </span>
                {game.is_sponsored && (
                  <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-zinc-950">
                    SPONSORED
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between p-6">
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {game.title}
                </h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed line-clamp-3">
                  {game.description}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-4">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>{game.play_count.toLocaleString()} plays</span>
                </div>

                <Link
                  href={`/games/${game.slug}`}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-cyan-400 transition-all shadow-md shadow-cyan-500/20"
                >
                  <Play className="w-3.5 h-3.5 fill-zinc-950" />
                  <span>Play Game</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar / Bottom Ad Placement */}
      <AdSlot slot="in_content" label="ARCADE HUB LEADERBOARD (728x90)" />
    </div>
  );
}
