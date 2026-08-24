'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Gamepad2,
  Utensils,
  Cpu,
  Sparkles,
  Newspaper,
  Menu,
  X,
  ChevronRight,
  Coins,
  ShieldAlert,
  User,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Profile, CustomPage } from '@/lib/types';
import { AuthModal } from '@/components/auth/AuthModal';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<Profile | null>(null);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);

  useEffect(() => {
    setUser(platformStore.getCurrentUser());
    setCustomPages(platformStore.getPages().filter((p) => p.show_in_nav));
  }, [pathname, authModalOpen]);

  const navLinks = [
    { name: 'The Arcade', href: '/games', icon: Gamepad2 },
    { name: 'The Kitchen', href: '/recipes', icon: Utensils },
    { name: 'The Lab', href: '/reviews', icon: Cpu },
    { name: 'Beauty & Style', href: '/beauty-fashion', icon: Sparkles },
    { name: 'News & Blogs', href: '/news', icon: Newspaper },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                ULTIMATUM<span className="text-cyan-400">.</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-zinc-800 text-cyan-400 shadow-sm'
                        : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-zinc-400'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}

              {/* Dynamic Custom Sub-Pages in Nav */}
              {customPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/pages/${page.slug}`}
                  className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                    pathname === `/pages/${page.slug}`
                      ? 'bg-zinc-800 text-cyan-400'
                      : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                  }`}
                >
                  {page.title.length > 18 ? page.title.slice(0, 18) + '...' : page.title}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Side: XP, Admin CMS, and User Auth */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* User Points Badge */}
            {user && (
              <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono">{user.points.toLocaleString()} XP</span>
              </div>
            )}

            {/* Admin CMS Quick Launcher */}
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/40 px-3 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-900/60 hover:text-white transition-all shadow-sm"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin CMS</span>
            </Link>

            {/* My Account Dashboard */}
            {user && (
              <Link
                href="/account"
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-sm ${
                  pathname === '/account'
                    ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-300'
                    : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>My Account</span>
              </Link>
            )}

            {/* Auth / Profile Trigger Button */}
            {user ? (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-1.5 hover:border-zinc-700 transition-all"
                title="Switch User / Sign Out"
              >
                <div className="relative h-6 w-6 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
                  <Image src={user.avatar_url} alt={user.username} fill className="object-cover" />
                </div>
                <span className="text-xs font-semibold text-zinc-200">{user.username}</span>
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs font-bold text-white"
            >
              {user ? user.username : 'Sign In'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl bg-zinc-900 p-2 text-zinc-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-4 lg:hidden space-y-3">
            <div className="flex flex-col gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold ${
                      isActive ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{link.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </Link>
                );
              })}

              {customPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/pages/${page.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-white"
                >
                  {page.title}
                </Link>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              {user ? (
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold text-cyan-400 flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>My Account</span>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="text-xs font-bold text-cyan-400 flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-bold text-purple-400 flex items-center gap-1"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Global Auth & Profile Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
