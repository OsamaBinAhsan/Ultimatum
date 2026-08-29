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
  ShoppingCart,
  LogIn,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Profile, CustomPage } from '@/lib/types';
import { AuthModal } from '@/components/auth/AuthModal';
import { BrandLogo } from '@/components/ui/BrandLogo';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<Profile | null>(null);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);

  useEffect(() => {
    setUser(platformStore.getCurrentUser());
    setCustomPages(platformStore.getPages().filter((p) => p.show_in_nav));

    const handleBalanceUpdate = () => {
      setUser(platformStore.getCurrentUser());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ultimatum_balance_updated', handleBalanceUpdate);
      window.addEventListener('balance-updated', handleBalanceUpdate);
      return () => {
        window.removeEventListener('ultimatum_balance_updated', handleBalanceUpdate);
        window.removeEventListener('balance-updated', handleBalanceUpdate);
      };
    }
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'The Arcade', shortName: 'Arcade', href: '/games', icon: Gamepad2 },
    { name: 'Cosmetics Shop', shortName: 'Shop', href: '/games/shop', icon: ShoppingCart },
    { name: 'The Kitchen', shortName: 'Kitchen', href: '/recipes', icon: Utensils },
    { name: 'The Lab', shortName: 'Lab', href: '/reviews', icon: Cpu },
    { name: 'Beauty & Style', shortName: 'Beauty', href: '/beauty-fashion', icon: Sparkles },
    { name: 'News & Blogs', shortName: 'News', href: '/news', icon: Newspaper },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-4 lg:px-6 xl:px-8 gap-3 sm:gap-4">
          {/* ------------------------------------------------------------- */}
          {/* Left: Brand Logo & Main Navigation Hubs                       */}
          {/* ------------------------------------------------------------- */}
          <div className="flex items-center gap-3 lg:gap-4 xl:gap-6 min-w-0">
            <Link href="/" className="group flex items-center gap-2 flex-shrink-0">
              <BrandLogo size="md" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 min-w-0">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-1.5 rounded-xl px-2.5 xl:px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-zinc-800 text-cyan-400 shadow-sm'
                        : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        isActive ? 'text-cyan-400' : 'text-zinc-400'
                      }`}
                    />
                    <span className="hidden xl:inline">{link.name}</span>
                    <span className="inline xl:hidden">{link.shortName}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* Right: XP Pill, User Profile/Auth Trigger & Mobile Menu       */}
          {/* ------------------------------------------------------------- */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {/* User Points Badge with Direct Cosmetics Shop Link */}
            {user && (
              <Link
                href="/games/shop"
                title="Spend your Coins in the Cosmetics Shop"
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 sm:px-3 py-1 text-xs font-bold text-amber-400 transition-all hover:scale-105 shadow-sm whitespace-nowrap select-none"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="font-mono">
                  {user.points.toLocaleString()} <span className="hidden sm:inline">XP</span>
                </span>
              </Link>
            )}

            {/* Auth / User Profile Button */}
            {user ? (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-900 border border-zinc-800 px-2 sm:px-2.5 py-1.5 hover:border-zinc-700 hover:bg-zinc-850 transition-all tap-target flex-shrink-0 cursor-pointer select-none"
                title="Account Settings & Switch Profile"
              >
                <div className="relative h-6 w-6 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 flex-shrink-0">
                  <Image src={user.avatar_url} alt={user.username} fill className="object-cover" />
                </div>
                <span className="hidden md:inline text-xs font-semibold text-zinc-200 max-w-[85px] truncate">
                  {user.username}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition-all tap-target flex-shrink-0 whitespace-nowrap cursor-pointer select-none"
              >
                <LogIn className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile / Tablet Menu Button (Visible on < 1024px) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              className="flex lg:hidden items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 p-2 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all tap-target cursor-pointer select-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Mobile / Tablet Slide-out Navigation Drawer                   */}
        {/* ------------------------------------------------------------- */}
        {mobileMenuOpen && (
          <div className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-2xl px-4 py-5 lg:hidden space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200 max-h-[calc(100dvh-4rem)] overflow-y-auto no-scrollbar">
            {/* Quick User XP Banner in Drawer */}
            {user && (
              <div className="flex items-center justify-between rounded-2xl bg-zinc-900/90 border border-zinc-800 p-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative h-9 w-9 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 flex-shrink-0">
                    <Image src={user.avatar_url} alt={user.username} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{user.username}</div>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
                      <Coins className="w-3 h-3 flex-shrink-0" />
                      <span>{user.points.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/games/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/30 transition-colors flex-shrink-0"
                >
                  Shop
                </Link>
              </div>
            )}

            {/* Navigation Hub Links */}
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 px-3 py-1">
                Navigation Hubs
              </div>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all tap-target ${
                      isActive
                        ? 'bg-zinc-800/90 text-cyan-400 shadow-sm'
                        : 'text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? 'text-cyan-400' : 'text-zinc-400'
                        }`}
                      />
                      <span>{link.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                  </Link>
                );
              })}

              {/* Dynamic CMS Pages in Drawer */}
              {customPages.length > 0 && (
                <>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 px-3 pt-3 pb-1">
                    Special Guides
                  </div>
                  {customPages.map((page) => (
                    <Link
                      key={page.id}
                      href={`/pages/${page.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    >
                      <span className="truncate">{page.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                    </Link>
                  ))}
                </>
              )}
            </div>

            {/* Bottom Actions inside Drawer */}
            <div className="pt-3 border-t border-zinc-800 grid grid-cols-2 gap-2">
              {user ? (
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 py-2.5 text-xs font-bold text-cyan-400 hover:bg-zinc-800 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>My Account</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 py-2.5 text-xs font-bold text-cyan-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}

              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-purple-950/80 border border-purple-500/40 py-2.5 text-xs font-bold text-purple-300 hover:bg-purple-900 transition-colors"
              >
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                <span>Admin CMS</span>
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
