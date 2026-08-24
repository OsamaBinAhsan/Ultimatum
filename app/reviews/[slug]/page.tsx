'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Cpu,
  Star,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  ArrowLeft,
  Share2,
  Award,
  Zap,
  ShoppingBag,
  Info,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Review } from '@/lib/types';
import { ReviewJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { AdSlot } from '@/components/monetization/AdSlot';
import { CommentSection } from '@/components/account/CommentSection';
import { AuthModal } from '@/components/auth/AuthModal';

export default function SingleReviewPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [review, setReview] = useState<Review | null>(null);
  const [copied, setCopied] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const rev = platformStore.getReviewBySlug(slug);
    if (rev) {
      setReview(rev);
    }
  }, [slug]);

  if (!review && typeof window !== 'undefined') {
    const rev = platformStore.getReviewBySlug(slug);
    if (!rev) return notFound();
  }

  if (!review) return null;

  const isTech = review.category === 'tech_hardware';

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Dynamic JSON-LD Review Schema & Breadcrumbs */}
      <ReviewJsonLd review={review} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://ultimatum.gg' },
          { name: 'Hardware Lab', url: 'https://ultimatum.gg/reviews' },
          { name: review.product_name, url: `https://ultimatum.gg/reviews/${review.slug}` },
        ]}
      />

      {/* Top Breadcrumb & Share */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <Link
          href="/reviews"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to The Lab Reviews</span>
        </Link>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copied ? 'Copied!' : 'Share Review'}</span>
        </button>
      </div>

      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-mono font-bold ${
              isTech
                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
            }`}
          >
            {isTech ? 'HARDWARE BENCHMARK & TEARDOWN' : 'FOOD PROVISIONS & DELIVERY TEST'}
          </span>
          <span className="text-xs text-zinc-500 font-mono">
            {new Date(review.created_at).toLocaleDateString()}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
          {review.product_name}
        </h1>

        <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal">
          {review.summary}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800 pt-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-xs">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Evaluated by {review.author}</div>
              <div className="text-[11px] text-zinc-500">Ultimatum Test Bench Lead</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-zinc-900 border border-zinc-800 px-4 py-2">
            <div className="flex items-center gap-1 text-indigo-400 font-black text-lg font-mono">
              <Star className="w-5 h-5 fill-indigo-400 text-indigo-400" />
              <span>{review.rating}</span>
            </div>
            <span className="text-xs text-zinc-500 uppercase font-mono">/ 5.0 SCORE</span>
          </div>
        </div>
      </header>

      {/* Hero Image with Affiliate Quick CTA */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-zinc-800 shadow-2xl">
        <Image
          src={review.hero_image_url}
          alt={review.product_name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 960px"
          className="object-cover"
        />

        {review.affiliate_link && (
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
            <a
              href={review.affiliate_link}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-sm font-bold text-zinc-950 shadow-2xl hover:from-amber-300 hover:to-orange-400 transition-all hover:scale-105"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Check Current Best Price</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* FTC Affiliate Monetization Disclosure */}
      <div className="flex items-center gap-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 text-xs text-zinc-400">
        <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span>
          <strong className="text-zinc-200">Editorial Transparency & Disclosure:</strong> When you buy through links on our site, Ultimatum Lab may earn an affiliate commission from {review.affiliate_retailer || 'partner retailers'} at zero additional cost to you. Our lab evaluations remain 100% independent.
        </span>
      </div>

      {/* 2 DISTINCT UI VARIANTS: TECH HARDWARE VS FOOD DELIVERY */}
      {isTech ? (
        /* Tech Hardware Variant: Spec Matrix & Benchmark Analysis */
        <section className="space-y-6">
          <div className="rounded-3xl border border-cyan-500/30 bg-zinc-900/80 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xl font-bold text-white">Hardware Telemetry & Specifications</h3>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase">
                LAB AUDITED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(review.specifications).map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-xl bg-zinc-950 p-3.5 border border-zinc-800"
                >
                  <span className="text-xs text-zinc-400 font-mono">{key}</span>
                  <span className="text-xs font-bold text-white">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        /* Food Delivery Variant: Flavor & Freshness Packaging Card */
        <section className="space-y-6">
          <div className="rounded-3xl border border-amber-500/30 bg-zinc-900/80 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-xl font-bold text-white">Delivery Logistics & Flavor Profile</h3>
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold uppercase">
                TASTE BENCHMARK
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(review.specifications).map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-xl bg-zinc-950 p-3.5 border border-zinc-800"
                >
                  <span className="text-xs text-zinc-400 font-mono">{key}</span>
                  <span className="text-xs font-bold text-amber-300">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* IN-CONTENT AD SLOT */}
      <AdSlot slot="in_content" label="IN-CONTENT LAB REVIEW AD (728x90)" />

      {/* PROS AND CONS COMPARISON GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pros */}
        <div className="rounded-3xl border border-emerald-500/30 bg-zinc-950 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
            <Check className="w-5 h-5 text-emerald-400" />
            <span>The Highlights & Strengths</span>
          </div>
          <ul className="space-y-2.5">
            {review.pros.map((pro, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-200">
                <span className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
                  ✓
                </span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        <div className="rounded-3xl border border-rose-500/30 bg-zinc-950 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm uppercase tracking-wider">
            <X className="w-5 h-5 text-rose-400" />
            <span>The Tradeoffs & Limitations</span>
          </div>
          <ul className="space-y-2.5">
            {review.cons.map((con, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-200">
                <span className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 text-[10px]">
                  ✕
                </span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FINAL VERDICT BOX WITH AFFILIATE CTA */}
      <section className="rounded-3xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-950 p-8 shadow-2xl space-y-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              <span>Ultimatum Lab Final Verdict</span>
            </div>
            <h3 className="mt-1 text-2xl font-black text-white">{review.product_name}</h3>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-white font-black text-xl font-mono shadow-lg shadow-indigo-600/30">
            <Star className="w-5 h-5 fill-white" />
            <span>{review.rating} / 5.0</span>
          </div>
        </div>

        <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">{review.verdict}</p>

        {review.affiliate_link && (
          <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-400">
              Available at <span className="text-white font-semibold">{review.affiliate_retailer}</span>
            </div>

            <a
              href={review.affiliate_link}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-amber-400 px-8 py-3 text-sm font-bold text-zinc-950 shadow-xl shadow-amber-400/20 hover:bg-amber-300 transition-all hover:scale-105"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Purchase on {review.affiliate_retailer}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </section>

      {/* Community Comments */}
      <CommentSection
        contentType="review"
        contentId={review.id}
        contentSlug={review.slug}
        onAuthRequired={() => setAuthModalOpen(true)}
      />

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </article>
  );
}
