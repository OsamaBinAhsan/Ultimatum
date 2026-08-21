'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Trash2,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Filter,
  Users,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { LeaderboardEntry, Game } from '@/lib/types';
import confetti from 'canvas-confetti';

export default function AdminLeaderboardModeration() {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setScores(platformStore.getLeaderboard());
    setGames(platformStore.getGames());
    platformStore.syncLeaderboardFromApi().then((synced) => {
      setScores(synced);
    });
  }, []);

  const handleFilterChange = (id: string) => {
    setSelectedGameId(id);
    if (id === 'all') {
      setScores(platformStore.getLeaderboard());
      platformStore.syncLeaderboardFromApi().then((synced) => setScores(synced));
    } else {
      setScores(platformStore.getLeaderboard(id));
      platformStore.syncLeaderboardFromApi(id).then((synced) => setScores(synced));
    }
  };

  const handleDeleteScore = (id: string, username: string, scoreVal: number) => {
    if (confirm(`Delete fraudulent score of ${scoreVal.toLocaleString()} by "${username}"?`)) {
      platformStore.deleteLeaderboardScore(id);
      setScores(platformStore.getLeaderboard(selectedGameId === 'all' ? undefined : selectedGameId));
      setFeedback(`Score deleted successfully.`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleTriggerWeeklyReset = () => {
    if (
      confirm(
        '⚠️ CRITICAL ACTION: Are you sure you want to trigger the Weekly Leaderboard Reset? All scores for the current tournament round will be wiped/archived.'
      )
    ) {
      const res = platformStore.triggerWeeklyReset();
      setScores([]);
      setFeedback(`Weekly reset complete! Archived ${res.resetCount} scores. New week cycle active.`);
      confetti({ particleCount: 80, spread: 70 });
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  const getGameTitle = (gameId: string) => {
    const g = games.find((x) => x.id === gameId);
    return g ? g.title : 'Neon Asteroid Blitz';
  };

  return (
    <div className="space-y-8">
      {/* Header & Reset Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-400">
            <ShieldAlert className="w-4 h-4" />
            <span>ANTI-CHEAT & FAIR PLAY GOVERNANCE</span>
          </div>
          <h1 className="text-3xl font-black text-white">Leaderboard Moderation</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Monitor real-time score submissions, delete fraudulent cheat entries, and trigger tournament weekly resets.
          </p>
        </div>

        <button
          onClick={handleTriggerWeeklyReset}
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Trigger Weekly Reset</span>
        </button>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 p-4 text-xs font-bold text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter by Game */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-zinc-500" />
        <span className="text-xs font-mono text-zinc-400">Filter by Game:</span>
        <select
          value={selectedGameId}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none"
        >
          <option value="all">All Games</option>
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      </div>

      {/* Leaderboard Moderation Data Table */}
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Submitted Scores Stream</span>
          </h3>
          <span className="text-xs font-mono text-zinc-400">{scores.length} Active Records</span>
        </div>

        {scores.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 font-mono">
            No active scores found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="border-b border-zinc-800 bg-zinc-950/50 font-mono uppercase text-zinc-400">
                <tr>
                  <th className="px-6 py-3.5">Rank / Player</th>
                  <th className="px-6 py-3.5">Target Game</th>
                  <th className="px-6 py-3.5">Score Value</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {scores.map((s, idx) => {
                  const username = s.profile?.username || 'Player-' + s.user_id.slice(0, 5);

                  return (
                    <tr key={s.id} className="hover:bg-zinc-900/90 transition-colors">
                      <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                        <span className="font-mono text-zinc-500 font-bold w-5">#{idx + 1}</span>
                        <div>
                          <div className="font-bold">{username}</div>
                          {s.profile?.badges && s.profile.badges.length > 0 && (
                            <span className="text-[10px] text-cyan-400 font-mono">
                              {s.profile.badges[0]}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-zinc-400">
                        {getGameTitle(s.game_id)}
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm font-black font-mono text-cyan-400">
                          {s.score.toLocaleString()}
                        </span>{' '}
                        <span className="text-[10px] text-zinc-500 font-mono">pts</span>
                      </td>

                      <td className="px-6 py-4 font-mono text-zinc-500">
                        {new Date(s.created_at).toLocaleString()}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteScore(s.id, username, s.score)}
                          className="inline-flex items-center gap-1 rounded-xl bg-rose-950/50 border border-rose-800/50 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900 hover:text-white transition-colors"
                          title="Purge Fraud Score"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Score</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
