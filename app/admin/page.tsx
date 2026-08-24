'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Users,
  Gamepad2,
  Utensils,
  Cpu,
  Trophy,
  Megaphone,
  Sparkles,
  FilePlus,
  Plus,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import confetti from 'canvas-confetti';

export default function AdminDashboardPage() {
  const [gamesCount, setGamesCount] = useState(0);
  const [recipesCount, setRecipesCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [sponsorsCount, setSponsorsCount] = useState(0);
  const [pagesCount, setPagesCount] = useState(0);
  const [leaderboardCount, setLeaderboardCount] = useState(0);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    setGamesCount(platformStore.getGames().length);
    setRecipesCount(platformStore.getRecipes().length);
    setReviewsCount(platformStore.getReviews().length);
    setSponsorsCount(platformStore.getSponsors().length);
    setPagesCount(platformStore.getPages().length);
    setLeaderboardCount(platformStore.getLeaderboard().length);
  }, []);

  const handleTriggerWeeklyReset = () => {
    if (confirm('Are you sure you want to trigger the Weekly Leaderboard Reset? All current scores will be archived.')) {
      const res = platformStore.triggerWeeklyReset();
      setLeaderboardCount(0);
      setResetMessage(`Successfully reset ${res.resetCount} scores for the new tournament week!`);
      confetti({ particleCount: 70, spread: 60 });
      setTimeout(() => setResetMessage(null), 5000);
    }
  };

  const stats = [
    {
      title: 'Estimated Ad Revenue (MTD)',
      value: '$137,840',
      change: '+18.4% vs last mo.',
      icon: DollarSign,
      color: 'text-emerald-400',
    },
    {
      title: 'Blended Platform RPM',
      value: '$48.54',
      change: 'Header + Rewarded Ads',
      icon: TrendingUp,
      color: 'text-cyan-400',
    },
    {
      title: 'Live Active Players',
      value: '1,492 online',
      change: '60 FPS Canvas Game Engine',
      icon: Users,
      color: 'text-purple-400',
    },
    {
      title: 'Active Sponsor Campaigns',
      value: `${sponsorsCount} Active`,
      change: '142,000+ Tracked Views',
      icon: Megaphone,
      color: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-10">
      {/* Top Banner & Super Admin Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CENTRAL COMMAND & CONTENT HUB</span>
          </div>
          <h1 className="text-3xl font-black text-white">Platform Overview & Analytics</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleTriggerWeeklyReset}
            className="flex items-center gap-2 rounded-xl border border-rose-500/50 bg-rose-950/40 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/60 hover:text-white transition-all shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Trigger Weekly Leaderboard Reset</span>
          </button>

          <Link
            href="/admin/pages"
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/25"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Sub-Page</span>
          </Link>
        </div>
      </div>

      {resetMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 p-4 text-xs font-bold text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-3 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">{stat.title}</span>
                <div className={`p-2 rounded-xl bg-zinc-950 border border-zinc-800 ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-mono text-white">{stat.value}</div>
              <div className="text-[11px] text-zinc-500 font-mono">{stat.change}</div>
            </div>
          );
        })}
      </div>

      {/* Content Hub Navigation Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Content Hub & System Control Center</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dynamic Sub-Pages */}
          <Link
            href="/admin/pages"
            className="group rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 hover:border-purple-500/50 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-purple-600/20 text-purple-400">
                <FilePlus className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold text-purple-400">{pagesCount} Pages</span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
              Dynamic Sub-Pages CMS
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Create, edit, and publish infinite custom sub-pages, special guides, and tournament hubs.
            </p>
          </Link>

          {/* Recipes */}
          <Link
            href="/admin/recipes"
            className="group rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 hover:border-amber-500/50 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
                <Utensils className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">{recipesCount} Recipes</span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
              The Kitchen Recipe CMS
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Dynamic ingredient row builder, instruction steps, and automated JSON-LD schema generation.
            </p>
          </Link>

          {/* Reviews */}
          <Link
            href="/admin/reviews"
            className="group rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 hover:border-indigo-500/50 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold text-indigo-400">{reviewsCount} Reviews</span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
              The Lab Review CMS
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Hardware teardowns vs food delivery reviews, pros/cons tags, and affiliate link links.
            </p>
          </Link>

          {/* Games */}
          <Link
            href="/admin/games"
            className="group rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 hover:border-cyan-500/50 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400">{gamesCount} Games</span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
              Arcade Game Vault
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Deploy canvas games, manage sponsor integrations, and monitor real-time play counts.
            </p>
          </Link>

          {/* Leaderboard Moderation */}
          <Link
            href="/admin/leaderboards"
            className="group rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 hover:border-rose-500/50 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400">
                <Trophy className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold text-rose-400">{leaderboardCount} Scores</span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-white group-hover:text-rose-400 transition-colors">
              Leaderboard Anti-Cheat & Moderation
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Detect score spoofing, delete fraudulent submissions, and trigger weekly prize resets.
            </p>
          </Link>

          {/* Master Ad & Site Settings */}
          <Link
            href="/admin/settings"
            className="group rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 hover:border-emerald-500/50 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                <Megaphone className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">Master Switch</span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
              Ad Monetization & Master Settings
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Toggle individual ad zones site-wide, edit announcement bar alerts, and configure maintenance mode.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
