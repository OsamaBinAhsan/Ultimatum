'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Coins,
  ShoppingBag,
  UtensilsCrossed,
  FlaskConical,
  Sparkles,
  Newspaper,
  Gamepad2,
  Trophy,
  Users,
  BadgeDollarSign,
  FileCode2,
  Settings,
  ShieldCheck,
  ExternalLink,
  CalendarClock,
  Menu,
  X,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Profile } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

const NAVIGATION_GROUPS: NavGroup[] = [
  {
    groupTitle: 'Telemetry & Analytics',
    items: [
      { href: '/admin', label: 'Master Telemetry', icon: LayoutDashboard },
    ],
  },
  {
    groupTitle: 'Unified CMS Engine',
    items: [
      { href: '/admin/content/recipes', label: 'Recipes CMS', icon: UtensilsCrossed, badge: 'Michelin', badgeColor: 'bg-amber-500/20 text-amber-400' },
      { href: '/admin/content/reviews', label: 'Hardware Lab', icon: FlaskConical, badge: 'Tech', badgeColor: 'bg-cyan-500/20 text-cyan-400' },
      { href: '/admin/content/news', label: 'Newsroom & Breaking', icon: Newspaper, badge: 'Live', badgeColor: 'bg-purple-500/20 text-purple-400' },
      { href: '/admin/content/lifestyle', label: 'Beauty & Lifestyle', icon: Sparkles, badge: 'Affiliate', badgeColor: 'bg-pink-500/20 text-pink-400' },
    ],
  },
  {
    groupTitle: 'Game Economy & Vault',
    items: [
      { href: '/admin/economy/payouts', label: 'Weekly Payouts Engine', icon: Coins, badge: 'Automated', badgeColor: 'bg-emerald-500/20 text-emerald-400' },
      { href: '/admin/economy/shop-manager', label: 'Cosmetics & Shop', icon: ShoppingBag },
      { href: '/admin/leaderboards', label: 'Score Moderation', icon: Trophy },
      { href: '/admin/games', label: 'Arcade Vault', icon: Gamepad2 },
    ],
  },
  {
    groupTitle: 'Governance & Settings',
    items: [
      { href: '/admin/users', label: 'User Governance', icon: Users },
      { href: '/admin/sponsors', label: 'Direct Sponsors', icon: BadgeDollarSign },
      { href: '/admin/settings', label: 'Master Ad Switches', icon: Settings },
      { href: '/admin/pages', label: 'Custom Sub-Pages', icon: FileCode2 },
      { href: '/admin/scheduler', label: 'Post Scheduler', icon: CalendarClock },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(platformStore.getCurrentUser());
  }, []);

  const handlePromoteSelf = () => {
    platformStore.switchUser('admin');
    setCurrentUser(platformStore.getCurrentUser());
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
      {/* Desktop Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-slate-800/80 bg-slate-950/95 flex flex-col justify-between hidden lg:flex sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Logo & Branding */}
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-all">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-wider text-white uppercase">ULTIMATUM</span>
                <span className="rounded bg-purple-500/20 px-1.5 py-0.2 text-[10px] font-mono font-bold text-purple-400">
                  PRO
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 font-semibold">SUPER ADMIN CMS SUITE</p>
            </div>
          </Link>

          {/* Nav Groups */}
          <nav className="space-y-6">
            {NAVIGATION_GROUPS.map((group) => (
              <div key={group.groupTitle} className="space-y-1.5">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 px-3">
                  {group.groupTitle}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                          active
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase ${
                              active ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer info & Link */}
        <div className="p-6 border-t border-slate-800/80 space-y-3 bg-slate-950/40">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5 text-purple-400" />
              <span>Live Public Platform</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
          </Link>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {currentUser?.username || 'Guest'}
            </span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-purple-400 uppercase font-bold">
              {currentUser?.role || 'user'}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-6 z-10 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-white text-sm">ULTIMATUM CMS</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-5">
                {NAVIGATION_GROUPS.map((group) => (
                  <div key={group.groupTitle} className="space-y-1.5">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 px-2">
                      {group.groupTitle}
                    </div>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                              active
                                ? 'bg-purple-600 text-white'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className="rounded px-1.5 py-0.5 text-[9px] font-mono bg-slate-800 text-slate-300">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800/80 px-6 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SQL SERVER CONNECTED &bull; NEXT.JS 16</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>Public Hubs</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <div className="flex-1 p-6 sm:p-8 md:p-10 max-w-7xl w-full mx-auto">
          {!isAdmin ? (
            <div className="rounded-3xl border border-amber-500/40 bg-slate-900/90 p-8 text-center space-y-4 max-w-lg mx-auto my-12 shadow-2xl backdrop-blur-xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Super Admin Authorization Required</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                You are currently signed in with limited privileges ({currentUser?.username || 'Guest'}). Switch to Super Admin to access the complete CMS Suite, payout triggers, and shop engine.
              </p>
              <button
                onClick={handlePromoteSelf}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:scale-105 transition-all shadow-lg shadow-purple-600/30"
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
