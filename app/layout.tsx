import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { AdSlot } from '@/components/monetization/AdSlot';

export const metadata: Metadata = {
  title: 'Ultimatum — High-Traffic Gaming, Michelin Kitchen & Tech Lab',
  description: 'The ultimate lifestyle destination: Play retro arcade canvas games, master Michelin chef recipes, and explore authoritative tech teardowns.',
  metadataBase: new URL('https://ultimatum.gg'),
  openGraph: {
    title: 'Ultimatum — Gaming, Recipes & Tech Lab',
    description: 'Play retro arcade games, cook Michelin-standard dishes, and read authoritative hardware reviews.',
    siteName: 'Ultimatum',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'Ultimatum Platform',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased selection:bg-cyan-500 selection:text-zinc-950 flex min-h-screen flex-col">
        <AnnouncementBar />
        <Navbar />

        {/* Global Header Billboard Ad Slot */}
        <div className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
          <AdSlot slot="header_banner" label="HEADER BILLBOARD LEADERBOARD (970x250 / 728x90)" />
        </div>

        <main className="flex-1">{children}</main>

        <Footer />
      </body>
    </html>
  );
}
