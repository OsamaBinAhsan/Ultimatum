'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Gamepad2,
  Utensils,
  MessageSquare,
  User,
  Trophy,
  Star,
  Clock,
  Heart,
  Trash2,
  ArrowRight,
  Shield,
  Flame,
  Coins,
  Sparkles,
  ExternalLink,
  ChevronRight,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Profile } from '@/lib/types';
import { AuthModal } from '@/components/auth/AuthModal';

type TabKey = 'gaming' | 'recipes' | 'comments' | 'profile';

interface GameStat {
  id: number;
  game_id: string;
  game_slug: string;
  game_title: string;
  high_score: number;
  total_plays: number;
  best_rank: number | null;
  last_played_at: string;
}

interface SavedRecipe {
  id: number;
  recipe_id: string;
  recipe_slug: string;
  recipe_title: string;
  saved_at: string;
}

interface UserComment {
  id: number;
  content_type: string;
  content_id: string;
  content_slug: string;
  body: string;
  created_at: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<Profile | null>(null);
  const [tab, setTab] = useState<TabKey>('gaming');
  const [gameStats, setGameStats] = useState<GameStat[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [avatarInput, setAvatarInput] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const u = platformStore.getCurrentUser();
    setUser(u);
    if (u) setAvatarInput(u.avatar_url || '');
  }, []);

  const fetchTabData = useCallback(async (t: TabKey) => {
    if (!user) return;
    setLoading(true);
    try {
      if (t === 'gaming') {
        const res = await fetch(`/api/account/game-stats?userId=${user.id}`);
        const data = await res.json();
        setGameStats(data.data || []);
      } else if (t === 'recipes') {
        const res = await fetch(`/api/account/saved-recipes?userId=${user.id}`);
        const data = await res.json();
        setSavedRecipes(data.data || []);
      } else if (t === 'comments') {
        const res = await fetch(`/api/account/comments?userId=${user.id}`);
        const data = await res.json();
        setComments(data.data || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTabData(tab);
  }, [tab, fetchTabData]);

  const handleUnsaveRecipe = async (recipeId: string) => {
    if (!user) return;
    await fetch(`/api/account/saved-recipes?userId=${user.id}&recipeId=${recipeId}`, {
      method: 'DELETE',
    });
    setSavedRecipes((prev) => prev.filter((r) => r.recipe_id !== recipeId));
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;
    await fetch(`/api/account/comments?commentId=${commentId}&userId=${user.id}`, {
      method: 'DELETE',
    });
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    platformStore.updateUserProfile(user.id, { avatar_url: avatarInput });
    setUser(platformStore.getCurrentUser());
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 4000);
  };

  const contentTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      recipe: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      review: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      article: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      game: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    };
    return `rounded-md border px-2 py-0.5 text-[10px] font-bold font-mono uppercase ${
      map[type] || 'bg-zinc-800 text-zinc-400 border-zinc-700'
    }`;
  };

  const contentHref = (type: string, slug: string) => {
    if (type === 'recipe') return `/recipes/${slug}`;
    if (type === 'review') return `/reviews/${slug}`;
    if (type === 'game') return `/games/${slug}`;
    return `/news/${slug}`;
  };

  const TABS = [
    { key: 'gaming' as TabKey, label: 'Arcade Records', icon: Gamepad2 },
    { key: 'recipes' as TabKey, label: 'Saved Kitchen Vault', icon: Utensils },
    { key: 'comments' as TabKey, label: 'My Comments', icon: MessageSquare },
    { key: 'profile' as TabKey, label: 'Profile & Merits', icon: User },
  ];

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center space-y-5 max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Member Portal Access</h2>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Sign in or create an account to view your live arcade high scores, save Michelin recipes, and track community discussions.
            </p>
          </div>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 py-3 text-xs font-bold text-white shadow-xl shadow-cyan-500/20 hover:from-cyan-400 hover:to-purple-500 transition-all hover:scale-105"
          >
            Open Ultimatum Sign In
          </button>
        </div>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => setUser(platformStore.getCurrentUser())}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Profile Header Hero */}
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div
          className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl pointer-events-none"
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 flex-shrink-0">
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="h-20 w-20 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-xl"
                />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-xl">
                  {user.username[0].toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{user.username}</h1>
                <span
                  className={`rounded-lg px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                    user.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : user.role === 'moderator'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-mono">{user.email || 'Verified Member'}</p>

              {/* Badges preview */}
              {user.badges && user.badges.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {user.badges.map((b) => (
                    <span
                      key={b}
                      className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300 flex items-center gap-1"
                    >
                      <Star className="w-2.5 h-2.5 text-amber-400" />
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 py-3 text-center sm:text-right">
              <div className="flex items-center justify-center sm:justify-end gap-1.5 text-amber-400 font-black font-mono text-base">
                <Coins className="w-4 h-4" />
                <span>{user.points?.toLocaleString() || 250}</span>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono uppercase">Merit XP</div>
            </div>

            <div className="flex-1 sm:flex-initial rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 py-3 text-center sm:text-right">
              <div className="flex items-center justify-center sm:justify-end gap-1.5 text-orange-400 font-black font-mono text-base">
                <Flame className="w-4 h-4" />
                <span>{user.daily_streak || 1}d</span>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono uppercase">Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Nav + Dynamic Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-3 text-xs font-bold transition-all w-full text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/15 font-black'
                      : 'border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{t.label}</span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 opacity-50 hidden lg:block ${isActive ? 'opacity-100' : ''}`}
                  />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-6">
          {/* 1. Gaming Stats Tab */}
          {tab === 'gaming' && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Your Arcade Records</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">High scores and session stats tracked across canvas games.</p>
                </div>
                <Link
                  href="/games"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <span>Play More Games</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 rounded-2xl bg-zinc-950 animate-pulse" />
                  ))}
                </div>
              ) : gameStats.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 py-16 text-center space-y-3">
                  <Gamepad2 className="w-10 h-10 text-zinc-600 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-400">No arcade games played yet</p>
                  <p className="text-xs text-zinc-600 max-w-sm mx-auto">
                    Jump into Neon Asteroid Blitz, Cyber Slicer, or Sabotage Circuit to set your first high score.
                  </p>
                  <Link
                    href="/games"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-cyan-400 transition-all"
                  >
                    <span>Launch Arcade Vault</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {gameStats.map((g) => (
                    <div
                      key={g.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-white">{g.game_title}</h3>
                          <span className="text-[10px] font-mono text-zinc-500">/{g.game_slug}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-black font-mono text-cyan-400">
                            {g.high_score.toLocaleString()}
                          </div>
                          <div className="text-[9px] font-mono text-zinc-500 uppercase">High Score</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-900 pt-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{g.total_plays} sessions</span>
                        </span>
                        <Link
                          href={`/games/${g.game_slug}`}
                          className="flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300"
                        >
                          <span>Play</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. Saved Recipes Tab */}
          {tab === 'recipes' && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Saved Kitchen Vault</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Quick access to bookmarked recipes and culinary instructions.</p>
                </div>
                <Link
                  href="/recipes"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <span>Explore All Recipes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 rounded-2xl bg-zinc-950 animate-pulse" />
                  ))}
                </div>
              ) : savedRecipes.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 py-16 text-center space-y-3">
                  <Heart className="w-10 h-10 text-zinc-600 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-400">No recipes saved yet</p>
                  <p className="text-xs text-zinc-600 max-w-sm mx-auto">
                    Click &quot;Save Recipe&quot; on any dish in the Kitchen Vault to pin it here for quick access while cooking.
                  </p>
                  <Link
                    href="/recipes"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-all"
                  >
                    <span>Browse Michelin Recipes</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedRecipes.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-4 hover:border-amber-500/40 transition-all"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                          <Utensils className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/recipes/${r.recipe_slug}`}
                            className="text-sm font-bold text-white hover:text-amber-400 transition-colors truncate block"
                          >
                            {r.recipe_title}
                          </Link>
                          <span className="text-[10px] font-mono text-zinc-500">
                            Saved {new Date(r.saved_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/recipes/${r.recipe_slug}`}
                          className="flex items-center gap-1 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => handleUnsaveRecipe(r.recipe_id)}
                          className="rounded-xl border border-zinc-800 p-2 text-zinc-500 hover:border-rose-500/40 hover:text-rose-400 hover:bg-rose-950/20 transition-all"
                          title="Remove from Saved"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Comments Tab */}
          {tab === 'comments' && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Your Discussion History</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Comments left across recipes, hardware reviews, news, and games.</p>
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 rounded-2xl bg-zinc-950 animate-pulse" />
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 py-16 text-center space-y-2">
                  <MessageSquare className="w-10 h-10 text-zinc-600 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-400">No comments posted yet</p>
                  <p className="text-xs text-zinc-600">Join the discussion at the bottom of any article or recipe.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3 hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={contentTypeBadge(c.content_type)}>{c.content_type}</span>
                          <Link
                            href={contentHref(c.content_type, c.content_slug)}
                            className="text-xs font-bold text-zinc-300 hover:text-cyan-400 transition-colors flex items-center gap-1"
                          >
                            <span>/{c.content_slug}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                          <span className="text-[10px] text-zinc-600 font-mono">
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-zinc-600 hover:text-rose-400 transition-colors p-1"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/60">
                        {c.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Profile Tab */}
          {tab === 'profile' && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="border-b border-zinc-800 pb-4">
                <h2 className="text-base font-bold text-white">Profile &amp; Account Settings</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Customize your public avatar, view permissions, and track achievements.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Username</label>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-300 font-mono">
                      {user.username}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Platform Role</label>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-300 font-mono uppercase">
                      {user.role}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Avatar Image URL</label>
                  <input
                    type="url"
                    value={avatarInput}
                    onChange={(e) => setAvatarInput(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                  {avatarInput && (
                    <div className="flex items-center gap-3 pt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarInput}
                        alt="Avatar preview"
                        className="h-12 w-12 rounded-xl object-cover border border-zinc-700"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                      <span className="text-[11px] text-zinc-500">Live preview</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  {profileSaved && (
                    <span className="text-xs font-mono text-emerald-400">✅ Avatar updated successfully!</span>
                  )}
                  <button
                    type="submit"
                    className="ml-auto rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-purple-500 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
