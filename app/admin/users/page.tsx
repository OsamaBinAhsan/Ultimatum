'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Users,
  CheckCircle,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Profile, UserRole } from '@/lib/types';
import confetti from 'canvas-confetti';

export default function AdminUserGovernance() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setProfiles(platformStore.getProfiles());
  }, []);

  const handleRoleChange = (id: string, newRole: UserRole) => {
    platformStore.updateUserProfile(id, { role: newRole });
    setProfiles(platformStore.getProfiles());
    setFeedback(`User role updated to ${newRole.toUpperCase()}.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAdjustPoints = (id: string, delta: number) => {
    const user = profiles.find((p) => p.id === id);
    if (user) {
      const newPoints = Math.max(0, user.points + delta);
      platformStore.updateUserProfile(id, { points: newPoints });
      setProfiles(platformStore.getProfiles());
      setFeedback(`Adjusted points for ${user.username} by ${delta > 0 ? '+' : ''}${delta} XP.`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleAwardBadge = (id: string, badgeName: string) => {
    const user = profiles.find((p) => p.id === id);
    if (user) {
      if (!user.badges.includes(badgeName)) {
        const newBadges = [...user.badges, badgeName];
        platformStore.updateUserProfile(id, { badges: newBadges });
        setProfiles(platformStore.getProfiles());
        setFeedback(`Awarded "${badgeName}" badge to ${user.username}!`);
        confetti({ particleCount: 60, spread: 60 });
        setTimeout(() => setFeedback(null), 4000);
      } else {
        alert('User already has this badge.');
      }
    }
  };

  const handleToggleBan = (id: string, currentBan: boolean = false) => {
    const user = profiles.find((p) => p.id === id);
    if (user) {
      platformStore.updateUserProfile(id, { is_banned: !currentBan });
      setProfiles(platformStore.getProfiles());
      setFeedback(`User ${user.username} ${!currentBan ? 'BANNED' : 'UNBANNED'}.`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400">
          <Users className="w-4 h-4" />
          <span>USER & ROLE GOVERNANCE</span>
        </div>
        <h1 className="text-3xl font-black text-white">Super Admin User Control</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Direct power to promote admins, award custom points/badges, and ban fraudulent accounts.
        </p>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 p-4 text-xs font-bold text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Profiles Table */}
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Registered Users & Players</h3>
          <span className="text-xs font-mono text-zinc-400">{profiles.length} Accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-950/50 font-mono uppercase text-zinc-400">
              <tr>
                <th className="px-6 py-3.5">User Identity</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Engagement XP</th>
                <th className="px-6 py-3.5">Assigned Badges</th>
                <th className="px-6 py-3.5 text-right">Power Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {profiles.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-zinc-900/90 transition-colors ${
                    p.is_banned ? 'bg-rose-950/20 opacity-60' : ''
                  }`}
                >
                  {/* Identity */}
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="relative h-9 w-9 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
                      <Image src={p.avatar_url} alt={p.username} fill className="object-cover" />
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{p.username}</span>
                        {p.is_banned && (
                          <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-mono text-rose-400 border border-rose-500/40">
                            BANNED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500">ID: {p.id}</div>
                    </div>
                  </td>

                  {/* Role Selector */}
                  <td className="px-6 py-4">
                    <select
                      value={p.role}
                      onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                      className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Super Admin</option>
                    </select>
                  </td>

                  {/* Points Adjuster */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-black font-mono text-amber-400 text-sm">
                        {p.points.toLocaleString()} XP
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAdjustPoints(p.id, 500)}
                          className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 hover:bg-zinc-700"
                          title="Add 500 XP"
                        >
                          +500
                        </button>
                        <button
                          onClick={() => handleAdjustPoints(p.id, -500)}
                          className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-rose-400 hover:bg-zinc-700"
                          title="Deduct 500 XP"
                        >
                          -500
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Badges */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {p.badges.map((b) => (
                        <span
                          key={b}
                          className="rounded bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono text-cyan-300 font-bold"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Power Actions */}
                  <td className="px-6 py-4 text-right space-x-2">
                    {/* Grant Badge Button */}
                    <button
                      onClick={() => handleAwardBadge(p.id, 'Grand Champion')}
                      className="rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-bold text-cyan-400 hover:bg-zinc-700"
                    >
                      + Award Badge
                    </button>

                    {/* Ban / Unban */}
                    <button
                      onClick={() => handleToggleBan(p.id, p.is_banned)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                        p.is_banned
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50'
                          : 'bg-rose-950/40 text-rose-400 border border-rose-800/40 hover:bg-rose-900/60'
                      }`}
                    >
                      {p.is_banned ? 'Unban' : 'Ban'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
