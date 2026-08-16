'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Gamepad2,
  UtensilsCrossed,
  FlaskConical,
  Trophy,
  Users,
  BadgeDollarSign,
  FileCode2,
  Settings,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Sparkles,
  Newspaper,
  ShieldAlert,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Profile } from '@/lib/types';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/pages', label: 'Custom Sub-Pages', icon: FileCode2 },
  { href: '/admin/recipes', label: 'Kitchen Recipes', icon: UtensilsCrossed },
  { href: '/admin/reviews', label: 'Hardware Lab', icon: FlaskConical },
  { href: '/admin/lifestyle', label: 'Beauty & Fashion', icon: Sparkles },
  { href: '/admin/news', label: 'Blogs & Newsroom', icon: Newspaper },
  { href: '/admin/games', label: 'Arcade Vault', icon: Gamepad2 },
  { href: '/admin/leaderboards', label: 'Score Moderation', icon: Trophy },
  { href: '/admin/users', label: 'User Governance', icon: Users },
  { href: '/admin/sponsors', label: 'Direct Sponsors', icon: BadgeDollarSign },
  { href: '/admin/settings', label: 'Master Ad Switches', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  useEffect(() => {
    setCurrentUser(platformStore.getCurrentUser());
  }, []);

  const handlePromoteSelf = () => {
    platformStore.switchUser('admin');
    setCurrentUser(platformStore.getCurrentUser());
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-zinc-800/80 bg-zinc-950/90 flex flex-col justify-between hidden md:flex">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-md shadow-purple-500/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wider text-white uppercase">ULTIMATUM CMS</h2>
              <p className="text-[10px] font-mono text-purple-400 font-semibold">SUPER ADMIN CONSOLE</p>
            </div>
          </div>

          <nav className="space-y-1">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                    active
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-zinc-800 space-y-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <span>Live Public Site</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <div className="text-[11px] font-mono text-zinc-500 text-center">
            {currentUser?.username || 'Guest'} ({currentUser?.role || 'user'})
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-zinc-800 px-6 bg-zinc-950/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-medium text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM OPERATIONAL
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Public Hubs
            </Link>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          {!isAdmin ? (
            <div className="rounded-3xl border border-amber-500/40 bg-zinc-900/90 p-8 text-center space-y-4 max-w-lg mx-auto my-12 shadow-2xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Super Admin Access Required</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                You are currently signed in as a standard user ({currentUser?.username || 'Guest'}). Click below to switch to the Super Admin role and unlock full CMS control.
              </p>
              <button
                onClick={handlePromoteSelf}
                className="rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/25"
              >
                Switch to Super Admin (PixelNinja)
              </button>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
