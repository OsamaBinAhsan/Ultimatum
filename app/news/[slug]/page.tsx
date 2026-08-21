'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Newspaper,
  Clock,
  ArrowLeft,
  Share2,
  Sparkles,
  Zap,
  ZoomIn,
  ShieldCheck,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Article } from '@/lib/types';
import { ReadingMeritsTracker } from '@/components/merits/ReadingMeritsTracker';
import { AdSlot } from '@/components/monetization/AdSlot';
import { ArticleBodyRenderer } from '@/components/content/ArticleBodyRenderer';

export default function SingleNewsPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const a = platformStore.getArticleBySlug(slug);
    if (a) setArticle(a);
  }, [slug]);

  if (!article && typeof window !== 'undefined') {
    const a = platformStore.getArticleBySlug(slug);
    if (!a) return notFound();
  }

  if (!article) return null;

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.subtitle,
    image: [article.hero_image_url, ...(article.gallery_images || [])],
    datePublished: article.published_at,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Ultimatum Dispatch News',
      url: 'https://ultimatum.gg',
    },
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Dynamic JSON-LD NewsArticle Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* Passive Reading Merits Tracker */}
      <ReadingMeritsTracker contentSlug={article.slug} contentType="article" />

      {/* Breadcrumb & Share */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-red-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All News & Blogs</span>
        </Link>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copied ? 'Copied!' : 'Share Story'}</span>
        </button>
      </div>

      {/* Header */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {article.is_breaking && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/50 px-3 py-1 text-xs font-mono font-bold text-red-400">
              <Zap className="w-3.5 h-3.5 fill-red-400 animate-pulse" />
              <span>BREAKING DISPATCH</span>
            </span>
          )}
          <span className="rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs font-mono text-zinc-300 uppercase">
            {article.category.replace('_', ' ')}
          </span>
          {article.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
          {article.title}
        </h1>

        {article.subtitle && (
          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal">
            {article.subtitle}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono border-t border-zinc-800 pt-4">
          <span className="text-white font-semibold">Reported by {article.author}</span>
          <span>•</span>
          <span>{article.read_time} min read</span>
          <span>•</span>
          <span>Published: {new Date(article.published_at).toLocaleDateString()}</span>
        </div>
      </header>

      {/* Hero Visual */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-zinc-800 shadow-2xl">
        <Image
          src={article.hero_image_url}
          alt={article.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 896px"
          className="object-cover"
        />
      </div>

      {/* Content Body with Embedded Links & Media */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/30 p-6 sm:p-10 shadow-xl">
        <ArticleBodyRenderer content={article.content} />
      </div>

      {/* Multi-Image Gallery */}
      {article.gallery_images && article.gallery_images.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-400" />
            <span>Telemetry & Benchmark Photo Breakdown</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {article.gallery_images.map((imgUrl, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedImage(imgUrl)}
                className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 cursor-pointer shadow-lg"
              >
                <Image
                  src={imgUrl}
                  alt={`Benchmark photo ${idx + 1}`}
                  fill
                  sizes="400px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1 text-xs text-white">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Zoom In</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md cursor-zoom-out"
        >
          <div className="relative max-h-[85vh] max-w-4xl w-full aspect-[16/10] overflow-hidden rounded-3xl border border-zinc-700 shadow-2xl">
            <Image src={selectedImage} alt="High resolution detail" fill className="object-contain" />
          </div>
        </div>
      )}

      <AdSlot slot="in_content" label="NEWS STORY IN-CONTENT AD (728x90)" />
    </article>
  );
}
