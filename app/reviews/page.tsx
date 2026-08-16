'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Cpu, Star, ExternalLink, ShieldCheck, Sparkles, Filter, Check, X, ArrowRight } from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Review, ReviewCategory } from '@/lib/types';
import { AdSlot } from '@/components/monetization/AdSlot';

export default function ReviewsHubPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    setReviews(platformStore.getReviews());
  }, []);

  const tabs = [
    { id: 'all', label: 'All Lab Evaluations' },
    { id: 'tech_hardware', label: 'Hardware & Tech Gear' },
    { id: 'food_lifestyle', label: 'Food Delivery & Provisions' },
  ];

  const filteredReviews =
    activeTab === 'all' ? reviews : reviews.filter((r) => r.category === activeTab);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Header Spotlight */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-zinc-950 via-indigo-950/30 to-zinc-950 p-8 sm:p-12 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-3 py-1 text-xs font-mono font-bold text-indigo-300">
            <Cpu className="w-3.5 h-3.5" />
            <span>AUTHORITATIVE TEST BENCH EVALUATIONS</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            The Lab Reviews
          </h1>
          <p className="text-base text-zinc-300 leading-relaxed">
            In-depth hardware teardowns, microcontroller evaluations, and Michelin-grade food delivery box tests. 100% independent benchmarks and transparent affiliate breakdowns.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Review Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredReviews.map((review) => {
          const isTech = review.category === 'tech_hardware';

          return (
            <Link
              key={review.id}
              href={`/reviews/${review.slug}`}
              className="group flex flex-col sm:flex-row overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl transition-all hover:border-indigo-500/50 hover:bg-zinc-900 hover:-translate-y-1"
            >
              <div className="relative aspect-square sm:w-56 sm:h-56 flex-shrink-0 overflow-hidden rounded-2xl bg-zinc-950">
                <Image
                  src={review.hero_image_url}
                  alt={review.product_name}
                  fill
                  sizes="240px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 rounded-full bg-black/80 px-2.5 py-0.5 text-[10px] font-mono font-bold text-indigo-300 border border-indigo-500/30">
                  {isTech ? 'HARDWARE' : 'FOOD DELIVERY'}
                </div>
              </div>

              <div className="mt-4 sm:mt-0 sm:ml-6 flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 rounded-lg bg-indigo-500/20 px-2.5 py-1 text-xs font-bold text-indigo-400">
                      <Star className="w-3.5 h-3.5 fill-indigo-400" />
                      <span>{review.rating} / 5.0</span>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">By {review.author}</span>
                  </div>

                  <h3 className="mt-3 text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {review.product_name}
                  </h3>
                  <p className="mt-2 text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                    {review.summary}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-4 text-xs font-semibold">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Lab Tested</span>
                  </span>
                  <span className="text-indigo-400 group-hover:underline flex items-center gap-1">
                    <span>Full Breakdown</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Lab In-Content Ad Placement */}
      <AdSlot slot="in_content" label="LAB REVIEWS LEADERBOARD (728x90)" />
    </div>
  );
}
