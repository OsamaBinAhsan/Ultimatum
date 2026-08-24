'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Sparkles,
  Shield,
  Gamepad2,
  Lock,
  Mail,
  User,
  Coins,
  Award,
  LogOut,
  Flame,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Profile } from '@/lib/types';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  onSuccess?: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  title = 'Ultimatum Member Access',
  subtitle = 'Sign in to save game progress, earn daily streak XP, and claim weekly tournament ranks.',
  onSuccess,
}: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup' | 'profile'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const user = platformStore.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setTab('profile');
    } else {
      setTab('signin');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQuickDemoLogin = (role: 'admin' | 'user') => {
    platformStore.switchUser(role);
    const user = platformStore.getCurrentUser();
    setCurrentUser(user);
    confetti({ particleCount: 70, spread: 60 });
    setMessage(`Signed in as ${user?.username} (${role === 'admin' ? 'Super Admin' : 'Player'})!`);
    setTimeout(() => {
      setMessage(null);
      if (onSuccess) onSuccess();
      onClose();
    }, 1200);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const endpoint = tab === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Authentication failed');
      }

      // Sync user profile into session
      const user = resData.user || platformStore.login(email, email.includes('admin') ? 'admin' : 'user');
      setCurrentUser(user);
      confetti({ particleCount: 60, spread: 60 });
      setMessage(tab === 'signup' ? `Account created! Welcome, ${user.username}!` : `Welcome back, ${user.username}!`);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setMessage(errorObj?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    platformStore.logout();
    setCurrentUser(null);
    setTab('signin');
    setMessage('Logged out successfully.');
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 text-white shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-black tracking-tight text-white">{title}</h3>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">{subtitle}</p>
        </div>

        {message && (
          <div className="mt-4 rounded-xl bg-cyan-950/80 border border-cyan-500/50 p-3 text-center text-xs font-bold text-cyan-300">
            {message}
          </div>
        )}

        {/* PROFILE VIEW (IF LOGGED IN) */}
        {currentUser ? (
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
                  <Image src={currentUser.avatar_url} alt={currentUser.username} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white truncate">{currentUser.username}</h4>
                    <span
                      className={`rounded px-2 py-0.5 text-[9px] font-mono font-bold uppercase ${
                        currentUser.role === 'admin'
                          ? 'bg-purple-900 text-purple-200 border border-purple-500/40'
                          : 'bg-cyan-900 text-cyan-200 border border-cyan-500/40'
                      }`}
                    >
                      {currentUser.role === 'admin' ? 'Super Admin' : 'Player'}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 font-mono">{currentUser.email || 'Member ID: ' + currentUser.id}</div>
                </div>
              </div>

              {/* Stats Strip */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800 text-center">
                <div className="rounded-xl bg-zinc-950 p-2.5">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase flex items-center justify-center gap-1">
                    <Coins className="w-3 h-3 text-amber-400" />
                    <span>Engagement XP</span>
                  </div>
                  <div className="font-black text-base text-amber-400 font-mono">
                    {currentUser.points.toLocaleString()}
                  </div>
                </div>

                <div className="rounded-xl bg-zinc-950 p-2.5">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase flex items-center justify-center gap-1">
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span>Daily Streak</span>
                  </div>
                  <div className="font-black text-base text-orange-400 font-mono">
                    {currentUser.daily_streak} Days
                  </div>
                </div>
              </div>

              {/* Badges Unlocked */}
              <div>
                <div className="text-[11px] font-mono text-zinc-400 uppercase mb-1.5 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Unlocked Badges</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentUser.badges.map((b) => (
                    <span
                      key={b}
                      className="rounded-md bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono text-cyan-300 font-bold"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {currentUser.role === 'admin' && (
                <a
                  href="/admin"
                  className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-500 transition-colors shadow-md"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Launch Admin CMS Dashboard</span>
                </a>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* SIGN IN / SIGN UP TABS */
          <div className="mt-6 space-y-5">
            {/* Quick 1-Click Demo Buttons */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 text-center">
                1-Click Instant Demo Login
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickDemoLogin('admin')}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-950/80 border border-purple-500/40 py-2 text-xs font-bold text-purple-300 hover:bg-purple-900 hover:text-white transition-all shadow-sm"
                >
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span>Super Admin</span>
                </button>

                <button
                  onClick={() => handleQuickDemoLogin('user')}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-900 hover:text-white transition-all shadow-sm"
                >
                  <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Player Gamer</span>
                </button>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-zinc-800" />
              <span className="absolute bg-zinc-950 px-2 text-[10px] font-mono text-zinc-500 uppercase">
                Or With Email & Password
              </span>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {tab === 'signup' && (
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="GamerTag"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition-all"
              >
                <span>{loading ? 'Processing...' : tab === 'signup' ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')}
                className="text-xs text-zinc-400 hover:text-cyan-400 transition-colors"
              >
                {tab === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
