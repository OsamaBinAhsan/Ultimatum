import Link from 'next/link';
import Image from 'next/image';
import {
  Gamepad2,
  Utensils,
  Cpu,
  Trophy,
  Sparkles,
  ArrowRight,
  Newspaper,
  ShoppingBag,
  Coins,
  Zap,
} from 'lucide-react';
import {
  INITIAL_GAMES,
  INITIAL_RECIPES,
  INITIAL_REVIEWS,
  INITIAL_ARTICLES,
  INITIAL_LEADERBOARD,
} from '@/lib/data/mock-data';
import { AdSlot } from '@/components/monetization/AdSlot';

export default function HomePage() {
  const featuredGame = INITIAL_GAMES[0];
  const featuredRecipe = INITIAL_RECIPES[0];
  const featuredReview = INITIAL_REVIEWS[0];
  const beautyArticles = INITIAL_ARTICLES.filter((a) => a.category === 'beauty_fashion');
  const newsArticles = INITIAL_ARTICLES.filter((a) => a.category !== 'beauty_fashion');
  const topScores = INITIAL_LEADERBOARD.slice(0, 3);

  return (
    <div className="w-full space-y-8 sm:space-y-12 md:space-y-14 lg:space-y-16 pb-16 sm:pb-20 overflow-x-hidden">
      {/* ----------------------------------------------------------------- */}
      {/* 1. HERO SPOTLIGHT                                                 */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative w-full overflow-hidden pt-2 sm:pt-4 md:pt-6">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-4 sm:p-7 md:p-9 lg:p-10 xl:p-12 shadow-2xl">
            {/* Ambient Glows securely bounded by overflow-hidden */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-center">
              {/* Left Text & CTA */}
              <div className="lg:col-span-7 space-y-3.5 sm:space-y-5 min-w-0">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 sm:px-3.5 sm:py-1.5 text-[10px] sm:text-xs font-mono font-semibold text-cyan-300">
                  <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">THE PREMIER LIFESTYLE & GAMING HUB</span>
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black tracking-tight text-white leading-[1.15] sm:leading-[1.1] break-words">
                  Play Hard.{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-400">
                    Live Sharp.
                  </span>{' '}
                  Build The Future.
                </h1>

                <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-zinc-300 max-w-2xl leading-relaxed">
                  Ultimatum brings together 60 FPS retro canvas games with weekly tournament leaderboards, Michelin-standard recipe science, skincare engineering, and authoritative hardware teardowns.
                </p>

                {/* Symmetrical Fluid CTA Row */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1">
                  <Link
                    href="/games/neon-asteroid-blitz"
                    className="flex-1 sm:flex-initial min-w-[130px] sm:min-w-[140px] flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 sm:px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-xl shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all hover:scale-105 tap-target select-none"
                  >
                    <Gamepad2 className="w-4 h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Play Arcade</span>
                  </Link>

                  <Link
                    href="/recipes"
                    className="flex-1 sm:flex-initial min-w-[120px] flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/80 px-3.5 sm:px-4 py-3 text-xs sm:text-sm font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all tap-target select-none"
                  >
                    <Utensils className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="whitespace-nowrap">The Kitchen</span>
                  </Link>

                  <Link
                    href="/beauty-fashion"
                    className="flex-1 sm:flex-initial min-w-[120px] flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/80 px-3.5 sm:px-4 py-3 text-xs sm:text-sm font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all tap-target select-none"
                  >
                    <Sparkles className="w-4 h-4 text-pink-400 flex-shrink-0" />
                    <span className="whitespace-nowrap">Beauty & Style</span>
                  </Link>

                  <Link
                    href="/news"
                    className="flex-1 sm:flex-initial min-w-[110px] flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/80 px-3.5 sm:px-4 py-3 text-xs sm:text-sm font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all tap-target select-none"
                  >
                    <Newspaper className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="whitespace-nowrap">Newsroom</span>
                  </Link>
                </div>
              </div>

              {/* Right Featured Card */}
              <div className="lg:col-span-5 w-full min-w-0">
                <div className="relative overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 p-3.5 sm:p-5 shadow-2xl group w-full">
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-950">
                    <Image
                      src={featuredGame.thumbnail_url}
                      alt={featuredGame.title}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 480px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 left-2.5 rounded-full bg-cyan-950/90 border border-cyan-500/50 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-mono font-bold text-cyan-300">
                      FEATURED GAME
                    </div>
                  </div>

                  <div className="mt-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white truncate">
                        {featuredGame.title}
                      </h3>
                      <span className="text-[11px] sm:text-xs font-mono text-zinc-400 flex-shrink-0 whitespace-nowrap">
                        {featuredGame.play_count.toLocaleString()} Plays
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {featuredGame.description}
                    </p>
                    <Link
                      href={`/games/${featuredGame.slug}`}
                      className="mt-2.5 flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2.5 sm:py-3 text-xs font-bold text-zinc-950 hover:bg-cyan-400 transition-colors tap-target select-none"
                    >
                      <span>Launch Instant Play</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 2. MERITS & ENGAGEMENT REWARDS BANNER                              */}
      {/* ----------------------------------------------------------------- */}
      <section className="w-full mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-gradient-to-r from-zinc-950 via-amber-950/20 to-zinc-950 p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 shadow-xl">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  ULTIMATUM MERITS PROGRAM
                </span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                  ACTIVE
                </span>
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mt-0.5 truncate">
                Earn Engagement XP While You Read & Play
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                Earn +100 XP on daily login, +25 XP per article read, and qualify for weekly $10k sponsor prize pools.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto flex-shrink-0">
            <Link
              href="/games"
              className="w-full sm:w-auto text-center rounded-xl bg-amber-500 px-5 py-2.5 sm:py-3 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20 tap-target flex items-center justify-center select-none"
            >
              Start Earning Merits
            </Link>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 3. BEAUTY & FASHION LAB                                            */}
      {/* ----------------------------------------------------------------- */}
      <section className="w-full mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4 border-b border-zinc-800 pb-3 sm:pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-pink-400">
              <Sparkles className="w-4 h-4" />
              <span>BEAUTY, TECHWEAR & SKINCARE SCIENCE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Beauty & Fashion Lab</h2>
          </div>
          <Link
            href="/beauty-fashion"
            className="flex items-center gap-1 text-xs font-bold text-pink-400 hover:text-pink-300"
          >
            <span>View All Lookbooks</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
          {beautyArticles.map((art) => (
            <Link
              key={art.id}
              href={`/beauty-fashion/${art.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-800 bg-zinc-900/70 hover:border-pink-500/50 hover:bg-zinc-900 transition-all shadow-xl"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
                <Image
                  src={art.hero_image_url}
                  alt={art.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {art.shoppable_items && art.shoppable_items.length > 0 && (
                  <div className="absolute top-3 left-3 rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-bold text-pink-300 border border-pink-500/30 flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" />
                    <span>{art.shoppable_items.length} Shoppable Pieces</span>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                    <span>{art.read_time} min read</span>
                    <span>•</span>
                    <span>By {art.author}</span>
                  </div>
                  <h3 className="mt-2 text-lg sm:text-xl font-bold text-white group-hover:text-pink-400 transition-colors">
                    {art.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {art.subtitle}
                  </p>
                </div>
                <div className="text-xs font-semibold text-pink-400 flex items-center gap-1 group-hover:underline pt-2">
                  <span>Explore Lookbook</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 4. THE NEWSROOM & BLOGS                                            */}
      {/* ----------------------------------------------------------------- */}
      <section className="w-full mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4 border-b border-zinc-800 pb-3 sm:pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400">
              <Zap className="w-4 h-4" />
              <span>DISPATCH WIRE & EDITORIALS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">The Newsroom & Blogs</h2>
          </div>
          <Link
            href="/news"
            className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300"
          >
            <span>View All News Stories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
          {newsArticles.map((art) => (
            <Link
              key={art.id}
              href={`/news/${art.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-800 bg-zinc-900/70 hover:border-red-500/50 hover:bg-zinc-900 transition-all shadow-xl"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
                <Image
                  src={art.hero_image_url}
                  alt={art.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {art.is_breaking && (
                  <div className="absolute top-3 left-3 rounded-full bg-red-600 px-3 py-1 text-[10px] font-mono font-bold text-white shadow-md">
                    BREAKING DISPATCH
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                    <span>{art.read_time} min read</span>
                    <span>•</span>
                    <span>By {art.author}</span>
                  </div>
                  <h3 className="mt-2 text-lg sm:text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                    {art.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {art.subtitle}
                  </p>
                </div>
                <div className="text-xs font-semibold text-red-400 flex items-center gap-1 group-hover:underline pt-2">
                  <span>Read Full Dispatch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 5. THE ARCADE & TOURNAMENT LEADERBOARD                             */}
      {/* ----------------------------------------------------------------- */}
      <section className="w-full mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4 border-b border-zinc-800 pb-3 sm:pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
              <Gamepad2 className="w-4 h-4" />
              <span>THE ARCADE VAULT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Featured Arcade Games</h2>
          </div>
          <Link href="/games" className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300">
            <span>View All Games & Leaderboards</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Game Cards Grid */}
          <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {INITIAL_GAMES.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.slug}`}
                className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 sm:p-4 transition-all hover:border-cyan-500/50 hover:bg-zinc-900 shadow-md"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-950">
                  <Image
                    src={game.thumbnail_url}
                    alt={game.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {game.is_sponsored && (
                    <div className="absolute top-2 left-2 rounded bg-amber-500/90 px-2 py-0.5 text-[9px] font-bold text-zinc-950 font-mono">
                      SPONSORED
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                    {game.title}
                  </h4>
                  <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">{game.description}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Live Leaderboard Widget */}
          <div className="lg:col-span-5 xl:col-span-4 rounded-2xl sm:rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-white truncate">Top Contenders</h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase whitespace-nowrap">
                RESET: SUN 00:00
              </span>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {topScores.map((entry, idx) => (
                <div key={entry.id} className="flex items-center justify-between gap-2 rounded-xl bg-zinc-950 p-2.5 sm:p-3 border border-zinc-800 min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs sm:text-sm font-black font-mono text-zinc-400 flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {entry.player_name || entry.profile?.username || 'Player'}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono truncate">
                        {entry.profile?.badges?.[0] || 'Gamer'}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-black text-cyan-400 flex-shrink-0">
                    {entry.score.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/games"
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-zinc-800 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition-colors tap-target select-none"
            >
              <span>Play to Claim #1 Spot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 6. THE KITCHEN & THE LAB SHOWCASE                                  */}
      {/* ----------------------------------------------------------------- */}
      <section className="w-full mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {/* Kitchen Spotlight */}
        <div className="rounded-2xl sm:rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-6 lg:p-8 space-y-3.5 sm:space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
              <Utensils className="w-4 h-4" />
              <span>THE KITCHEN VAULT</span>
            </div>
            <Link href="/recipes" className="text-xs font-semibold text-amber-400 hover:underline">
              All Recipes &rarr;
            </Link>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">{featuredRecipe.title}</h3>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl sm:rounded-2xl bg-zinc-950">
            <Image src={featuredRecipe.hero_image_url} alt={featuredRecipe.title} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">{featuredRecipe.description}</p>
          <Link
            href={`/recipes/${featuredRecipe.slug}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 sm:py-3 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-colors tap-target select-none"
          >
            <span>View Full Recipe & Instructions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Lab Spotlight */}
        <div className="rounded-2xl sm:rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-6 lg:p-8 space-y-3.5 sm:space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400">
              <Cpu className="w-4 h-4" />
              <span>THE HARDWARE LAB</span>
            </div>
            <Link href="/reviews" className="text-xs font-semibold text-indigo-400 hover:underline">
              All Reviews &rarr;
            </Link>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">{featuredReview.product_name}</h3>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl sm:rounded-2xl bg-zinc-950">
            <Image src={featuredReview.hero_image_url} alt={featuredReview.product_name} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">{featuredReview.summary}</p>
          <Link
            href={`/reviews/${featuredReview.slug}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 sm:py-3 text-xs font-bold text-white hover:bg-indigo-500 transition-colors tap-target select-none"
          >
            <span>Read In-Depth Review & Benchmarks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 7. IN-FEED SPONSOR AD SLOT                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="w-full mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <AdSlot slot="in_content" label="HOMEPAGE IN-FEED SPONSOR LEADERBOARD (728x90)" />
      </div>
    </div>
  );
}
