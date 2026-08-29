'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  Sparkles,
  Share2,
  Info,
  ArrowLeft,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Game, LeaderboardEntry } from '@/lib/types';
import { CanvasGame } from '@/components/arcade/CanvasGame';
import { GameJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { AdSlot } from '@/components/monetization/AdSlot';
import { CommentSection } from '@/components/account/CommentSection';
import { AuthModal } from '@/components/auth/AuthModal';

export default function SingleGamePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [game, setGame] = useState<Game | null>(() => {
    if (typeof slug === 'string') {
      return platformStore.getGameBySlug(slug) || null;
    }
    return null;
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    // Lock scroll to top so page never jumps to comments on load
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
    }

    const foundGame = platformStore.getGameBySlug(slug);
    if (foundGame) {
      setGame(foundGame);
      setLeaderboard(platformStore.getLeaderboard(foundGame.id));
      platformStore.syncLeaderboardFromApi(foundGame.id).then((synced) => {
        setLeaderboard(synced);
      });
    }

    const handleLeaderboardUpdate = () => {
      const g = platformStore.getGameBySlug(slug);
      if (g) {
        setLeaderboard(platformStore.getLeaderboard(g.id));
      }
    };

    window.addEventListener('leaderboard-updated', handleLeaderboardUpdate);
    window.addEventListener('balance-updated', handleLeaderboardUpdate);
    return () => {
      window.removeEventListener('leaderboard-updated', handleLeaderboardUpdate);
      window.removeEventListener('balance-updated', handleLeaderboardUpdate);
    };
  }, [slug]);

  if (!game && typeof window !== 'undefined') {
    const g = platformStore.getGameBySlug(slug);
    if (!g) return notFound();
  }

  if (!game) return null;

  const handleScoreSubmitted = (score?: number) => {
    // Refresh leaderboard locally and sync with API
    const updated = platformStore.getLeaderboard(game.id);
    setLeaderboard(updated);
    platformStore.syncLeaderboardFromApi(game.id).then((synced) => {
      setLeaderboard(synced);
    });

    // Record in user game_stats if logged in
    const currentUser = platformStore.getCurrentUser();
    if (currentUser && typeof score === 'number' && score > 0) {
      fetch('/api/account/game-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          game_id: game.id,
          game_slug: game.slug,
          game_title: game.title,
          score,
        }),
      }).catch(() => {});
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <GameJsonLd game={game} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://ultimatum.gg' },
          { name: 'Arcade Vault', url: 'https://ultimatum.gg/games' },
          { name: game.title, url: `https://ultimatum.gg/games/${game.slug}` },
        ]}
      />

      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <Link
          href="/games"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Arcade Games</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Link Copied!' : 'Share Challenge'}</span>
          </button>
          {game.is_sponsored && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400">
              Sponsored by {game.sponsor_name}
            </div>
          )}
        </div>
      </div>

      {/* Main Arcade Layout: Game Canvas (Left) + Live Leaderboard & Rewards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Canvas Game Engine & Instructions (7-8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <CanvasGame
            gameId={game.id}
            gameTitle={game.title}
            gameSlug={game.slug}
            onScoreSubmitted={handleScoreSubmitted}
          />

          {/* Game Description & Mechanics Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-6 shadow-xl">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              <Info className="w-4 h-4" />
              <span>Official Game Brief & Pro Controls</span>
            </div>
            <h2 className="mt-2 text-xl sm:text-2xl font-bold text-white">{game.title}</h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">{game.description}</p>

            <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 border-t border-zinc-800 pt-4 sm:pt-6">
              <div className="rounded-xl bg-zinc-950 p-3 sm:p-3.5 border border-zinc-800/80">
                <div className="text-[10px] sm:text-xs font-mono text-zinc-400 uppercase">Primary Control</div>
                <div className="mt-1 font-bold text-xs sm:text-sm text-white">
                  {game.slug === 'cyber-slicer-2099'
                    ? 'Mouse / Touch Swipe'
                    : game.slug === 'pixel-kitchen-rush'
                    ? 'Station Taps / Click'
                    : game.slug === 'dungeon-loot-dash'
                    ? 'SPACE / UP (Double Jump)'
                    : game.slug === 'sabotage-circuit'
                    ? 'Valve Sliders & Breakers'
                    : game.slug === 'the-architect-and-the-rats'
                    ? 'WASD / Click to Build'
                    : 'Arrow Keys / WASD'}
                </div>
              </div>
              <div className="rounded-xl bg-zinc-950 p-3 sm:p-3.5 border border-zinc-800/80">
                <div className="text-[10px] sm:text-xs font-mono text-zinc-400 uppercase">Secondary Action</div>
                <div className="mt-1 font-bold text-xs sm:text-sm text-white">
                  {game.slug === 'cyber-slicer-2099'
                    ? 'Multi-Slash Combos'
                    : game.slug === 'pixel-kitchen-rush'
                    ? 'Chop, Sizzle, Expedite'
                    : game.slug === 'dungeon-loot-dash'
                    ? 'DOWN (Slide Obstacles)'
                    : game.slug === 'sabotage-circuit'
                    ? 'Signal Tuning & Split Code'
                    : game.slug === 'the-architect-and-the-rats'
                    ? 'F (Sonar Radar) / SPACE (Lights Out)'
                    : 'SPACEBAR Plasma Lasers'}
                </div>
              </div>
              <div className="rounded-xl bg-zinc-950 p-3 sm:p-3.5 border border-zinc-800/80">
                <div className="text-[10px] sm:text-xs font-mono text-zinc-400 uppercase">Pro Tip</div>
                <div className="mt-1 font-bold text-xs sm:text-sm text-cyan-300">
                  {game.slug === 'cyber-slicer-2099'
                    ? 'Slice 3+ nodes in 1 stroke!'
                    : game.slug === 'pixel-kitchen-rush'
                    ? 'Do not let steaks burn!'
                    : game.slug === 'dungeon-loot-dash'
                    ? 'Grab diamond chests for +500'
                    : game.slug === 'sabotage-circuit'
                    ? 'Keep all 6 sectors nominal to heal Core!'
                    : game.slug === 'the-architect-and-the-rats'
                    ? 'Sonar costs 5s off the clock—use it tactically!'
                    : 'Detonate EMP with key B / E'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Weekly Leaderboard, Rewarded Ad Container & Sidebar Ad (4-5 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Live Weekly Leaderboard Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Weekly Global Top 10</h3>
              </div>
              <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30">
                LIVE
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {leaderboard.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                  No scores recorded yet this week. Be the first to claim #1!
                </div>
              ) : (
                leaderboard.slice(0, 7).map((entry, index) => {
                  const isTop3 = index < 3;
                  const rankColors = [
                    'text-amber-400 bg-amber-500/10 border-amber-500/40',
                    'text-zinc-300 bg-zinc-400/10 border-zinc-400/40',
                    'text-amber-700 bg-amber-700/10 border-amber-700/40',
                  ];

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl bg-zinc-950/80 p-3 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Rank Badge */}
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black font-mono border ${
                            isTop3
                              ? rankColors[index]
                              : 'text-zinc-500 bg-zinc-900 border-zinc-800'
                          }`}
                        >
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>

                        <div>
                          <div className="text-xs font-bold text-zinc-100">
                            {entry.profile?.username || 'Gamer-' + entry.user_id.slice(0, 5)}
                          </div>
                          {entry.profile?.badges && entry.profile.badges.length > 0 && (
                            <span className="text-[10px] text-cyan-400 font-mono">
                              {entry.profile.badges[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black font-mono text-cyan-400">
                          {entry.score.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">pts</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 rounded-xl bg-zinc-950 p-3 text-center border border-zinc-800/60">
              <div className="text-[11px] text-zinc-400">
                Weekly Leaderboards reset every Sunday midnight UTC.
              </div>
            </div>
          </div>

          {/* Dedicated Rewarded Video Ad Container */}
          <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/40 to-zinc-950 p-5 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>REWARDED VIDEO AD INTEGRATION</span>
            </div>
            <h4 className="mt-2 text-sm font-bold text-white">
              Watch 5s Sponsor Stream for In-Game Revival Token
            </h4>
            <p className="mt-1 text-xs text-zinc-400">
              Triggered automatically upon spaceship hull breach or directly from game over menu.
            </p>
          </div>

          {/* Sidebar High-Yield Ad Slot */}
          <AdSlot slot="sidebar" label="SIDEBAR HALF-PAGE (300x600 / 300x250)" />
        </div>
      </div>

      {/* Arcade Community Discussion */}
      <CommentSection
        contentType="game"
        contentId={game.id}
        contentSlug={game.slug}
        onAuthRequired={() => setAuthModalOpen(true)}
      />

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
