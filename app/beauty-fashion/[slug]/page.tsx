'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  ShoppingBag,
  ArrowLeft,
  Share2,
  ExternalLink,
  ZoomIn,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Article } from '@/lib/types';
import { formatDate } from '@/lib/utils/format';
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { ReadingMeritsTracker } from '@/components/merits/ReadingMeritsTracker';
import { AdSlot } from '@/components/monetization/AdSlot';
import { ArticleBodyRenderer } from '@/components/content/ArticleBodyRenderer';
import { CommentSection } from '@/components/account/CommentSection';
import { AuthModal } from '@/components/auth/AuthModal';

export default function SingleBeautyFashionPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Dynamic JSON-LD Article Schema & Breadcrumbs */}
      <ArticleJsonLd article={article} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://ultimatum.gg' },
          { name: 'Beauty & Fashion', url: 'https://ultimatum.gg/beauty-fashion' },
          { name: article.title, url: `https://ultimatum.gg/beauty-fashion/${article.slug}` },
        ]}
      />

      {/* Passive Reading Merits Tracker */}
      <ReadingMeritsTracker contentSlug={article.slug} contentType="article" />

      {/* Breadcrumb & Share */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <Link
          href="/beauty-fashion"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-pink-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Beauty & Fashion Lab</span>
        </Link>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copied ? 'Copied!' : 'Share Article'}</span>
        </button>
      </div>

      {/* Header */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-pink-500/10 border border-pink-500/30 px-3 py-1 text-xs font-mono font-bold text-pink-300">
            FASHION & SKINCARE SCIENCE
          </span>
          {article.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs text-zinc-300">
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
          <span>By {article.author}</span>
          <span>•</span>
          <span>{article.read_time} min read</span>
          <span>•</span>
          <span>Published: {formatDate(article.published_at)}</span>
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

      {/* SHOPPABLE LOOKBOOK / PRODUCT RACK (High-Monetization Module) */}
      {article.shoppable_items && article.shoppable_items.length > 0 && (
        <section className="rounded-3xl border border-pink-500/40 bg-zinc-950 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-pink-400" />
              <h3 className="text-lg font-bold text-white">Shoppable Featured Pieces & Serums</h3>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold uppercase">
              VERIFIED LAB SELECTIONS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {article.shoppable_items.map((item, idx) => (
              <div
                key={idx}
                className="group flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg hover:border-pink-500/40 transition-all"
              >
                <div>
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-950">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      sizes="200px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-3">
                    <div className="text-[11px] font-mono text-zinc-400">{item.brand}</div>
                    <div className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors">
                      {item.name}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
                  <span className="text-sm font-black font-mono text-amber-400">{item.price}</span>
                  <a
                    href={item.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="flex items-center gap-1 rounded-lg bg-pink-500/20 border border-pink-500/40 px-3 py-1 text-xs font-bold text-pink-300 hover:bg-pink-500 hover:text-zinc-950 transition-all"
                  >
                    <span>Shop Now</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Content Body with Embedded Links & Media */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/30 p-6 sm:p-10 shadow-xl">
        <ArticleBodyRenderer content={article.content} />
      </div>

      {/* Multi-Image Gallery Grid (Click to Zoom Lightbox) */}
      {article.gallery_images && article.gallery_images.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <span>Material Close-Ups & Field Photo Gallery</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {article.gallery_images.map((imgUrl, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedImage(imgUrl)}
                className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 cursor-pointer shadow-lg"
              >
                <Image
                  src={imgUrl}
                  alt={`Gallery detail ${idx + 1}`}
                  fill
                  sizes="300px"
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

      <AdSlot slot="in_content" label="ARTICLE IN-CONTENT BANNER (728x90)" />

      {/* Community Comments */}
      <CommentSection
        contentType="article"
        contentId={article.id}
        contentSlug={article.slug}
        onAuthRequired={() => setAuthModalOpen(true)}
      />

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </article>
  );
}
