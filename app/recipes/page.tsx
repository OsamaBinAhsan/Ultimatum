'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Utensils, Clock, Flame, Star, Search, ChefHat, Sparkles } from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Recipe } from '@/lib/types';
import { AdSlot } from '@/components/monetization/AdSlot';

export default function RecipesHubPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  useEffect(() => {
    setRecipes(platformStore.getRecipes());
  }, []);

  const tags = ['All', 'Comfort Food', 'High Protein', 'Desserts', 'Vegetarian Optional', 'Quick Dinner'];

  const filteredRecipes = recipes.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ingredients.some((ing) => ing.item.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag =
      selectedTag === 'All' ||
      r.dietary_tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()) ||
      r.category.toLowerCase().includes(selectedTag.toLowerCase());

    return matchesSearch && matchesTag;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Header Spotlight */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-zinc-950 via-amber-950/30 to-zinc-950 p-8 sm:p-12 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-mono font-bold text-amber-300">
            <ChefHat className="w-3.5 h-3.5" />
            <span>MICHELIN SCIENTIFIC RECIPES</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            The Kitchen Lab
          </h1>
          <p className="text-base text-zinc-300 leading-relaxed">
            Distraction-free, chef-tested culinary blueprints. Featuring dynamic serving scalers, full macro nutrition telemetry, and reproducible thermal science.
          </p>
        </div>
      </div>

      {/* Search & Tag Filter Strip */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search recipes or ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                selectedTag === tag
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredRecipes.map((recipe) => (
          <Link
            key={recipe.id}
            href={`/recipes/${recipe.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl transition-all hover:border-amber-500/50 hover:bg-zinc-900 hover:-translate-y-1"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
              <Image
                src={recipe.hero_image_url}
                alt={recipe.title}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="rounded-full bg-black/80 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30 backdrop-blur-sm">
                  {recipe.category}
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-1 font-bold text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{recipe.rating}</span>
                    <span className="text-zinc-500 font-normal">({recipe.rating_count})</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {recipe.prep_time + recipe.cook_time} mins
                    </span>
                    <span className="font-mono text-zinc-300">{recipe.calories} kcal</span>
                  </div>
                </div>

                <h3 className="mt-3 text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                  {recipe.title}
                </h3>
                <p className="mt-1.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {recipe.description}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-1.5 border-t border-zinc-800/80 pt-4">
                {recipe.dietary_tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* In-Content Placement */}
      <AdSlot slot="in_content" label="KITCHEN HUB LEADERBOARD (728x90)" />
    </div>
  );
}
