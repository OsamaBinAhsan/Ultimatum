'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  ShoppingBag,
  Plus,
  Trash2,
  Edit3,
  Eye,
  CheckCircle,
  Link as LinkIcon,
  Video,
  Quote,
  List,
  Heading,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Article, ShoppableItem, PostStatus } from '@/lib/types';
import { SchedulePostPanel } from '@/components/cms/SchedulePostPanel';
import confetti from 'canvas-confetti';
import { ArticleBodyRenderer } from '@/components/content/ArticleBodyRenderer';
import { formatDateTime } from '@/lib/utils/format';
import { ImageUpload } from '@/components/admin/ImageUpload';

export default function AdminLifestyleManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const [form, setForm] = useState<Article>({
    id: '',
    slug: '',
    title: '',
    subtitle: '',
    category: 'beauty_fashion',
    hero_image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80',
    ],
    content: `# New Beauty & Techwear Breakdown\n\nWrite your material analysis and styling guide here.`,
    tags: ['Techwear', 'Skincare'],
    author: 'Elena Vance',
    read_time: 5,
    shoppable_items: [
      {
        name: 'Technical Storm Shell',
        brand: 'AcroPulse Labs',
        price: '$350.00',
        affiliate_url: 'https://example.com/shop',
        image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80',
      },
    ],
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    status: 'published' as PostStatus,
    scheduled_for: null,
  });

  useEffect(() => {
    setArticles(platformStore.getAllArticles().filter((a) => a.category === 'beauty_fashion'));
  }, []);

  const handleOpenCreate = () => {
    setForm({
      id: 'art-' + Date.now(),
      slug: '',
      title: '',
      subtitle: '',
      category: 'beauty_fashion',
      hero_image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
      gallery_images: [],
      content: `# Fashion & Skincare Breakdown\n\nDetailed breakdown of materials, ingredients, and styling rules.`,
      tags: ['Techwear', 'Lifestyle'],
      author: 'Elena Vance',
      read_time: 5,
      shoppable_items: [],
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      status: 'published' as PostStatus,
      scheduled_for: null,
    });
    setIsEditing(true);
  };

  const handleTitleChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setForm((prev) => ({
      ...prev,
      title: val,
      slug: prev.id.startsWith('art-') ? slug : prev.slug,
    }));
  };

  const addShoppableRow = () => {
    setForm((prev) => ({
      ...prev,
      shoppable_items: [
        ...(prev.shoppable_items || []),
        {
          name: '',
          brand: '',
          price: '$0.00',
          affiliate_url: '',
          image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80',
        },
      ],
    }));
  };

  const updateShoppable = (idx: number, field: keyof ShoppableItem, val: string) => {
    setForm((prev) => {
      const items = [...(prev.shoppable_items || [])];
      items[idx] = { ...items[idx], [field]: val };
      return { ...prev, shoppable_items: items };
    });
  };

  const removeShoppable = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      shoppable_items: (prev.shoppable_items || []).filter((_, i) => i !== idx),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug) {
      alert('Title and Slug required');
      return;
    }
    platformStore.saveArticle(form);
    setArticles(platformStore.getAllArticles().filter((a) => a.category === 'beauty_fashion'));
    setIsEditing(false);

    if (form.status === 'scheduled') {
      setFeedback(`Article "${form.title}" scheduled for ${form.scheduled_for ? formatDateTime(form.scheduled_for) : 'future release'}!`);
    } else if (form.status === 'draft') {
      setFeedback(`Article "${form.title}" saved as draft.`);
    } else {
      setFeedback(`Beauty & Fashion article "${form.title}" published!`);
      confetti({ particleCount: 60, spread: 60 });
    }

    fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).catch(() => {});

    setTimeout(() => setFeedback(null), 5000);
  };

  const handleEdit = (art: Article) => {
    setForm({ ...art });
    setIsEditing(true);
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Delete article "${title}"?`)) {
      platformStore.deleteArticle(id);
      setArticles(platformStore.getAllArticles().filter((a) => a.category === 'beauty_fashion'));
      setFeedback(`Article "${title}" deleted.`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-pink-400">
            <Sparkles className="w-4 h-4" />
            <span>BEAUTY & FASHION CMS</span>
          </div>
          <h1 className="text-3xl font-black text-white">Lifestyle Lookbooks & Skincare CMS</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Publish shoppable trend drops, techwear breakdowns, and skincare science articles.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-pink-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-pink-500 shadow-lg shadow-pink-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Lookbook</span>
        </button>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 p-4 text-xs font-bold text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* FORM BUILDER */}
      {isEditing && (
        <div className="rounded-3xl border border-pink-500/40 bg-zinc-900/95 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="text-xl font-bold text-white">
              {form.id.startsWith('art-') ? 'Create Beauty & Fashion Article' : 'Edit Article'}
            </h3>
            <button onClick={() => setIsEditing(false)} className="text-xs text-zinc-400 hover:text-white">
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Article Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cyberpunk Techwear 2026: Modular Shells"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-pink-300 font-mono focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Subtitle / Summary</label>
              <input
                type="text"
                value={form.subtitle || ''}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-pink-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Hero Image URL</label>
              <input
                type="text"
                required
                value={form.hero_image_url}
                onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-300 font-mono focus:border-pink-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-mono text-zinc-400 uppercase">Article Body (Markdown & Embedded Links/Videos)</label>
                
                {/* Write / Preview Mode Toggle */}
                <div className="flex items-center rounded-lg bg-zinc-950 border border-zinc-800 p-0.5 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setActiveTab('write')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activeTab === 'write' ? 'bg-pink-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activeTab === 'preview' ? 'bg-pink-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Live Preview
                  </button>
                </div>
              </div>

              {activeTab === 'write' ? (
                <div className="space-y-2">
                  {/* Quick Embed Toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase px-1">Quick Embed:</span>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, content: prev.content + '\n[Link Title](https://example.com)' }))}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700/60 text-[11px] text-cyan-300 hover:bg-zinc-800 hover:border-cyan-500/50 transition-all"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>+ Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, content: prev.content + '\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ' }))}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700/60 text-[11px] text-pink-300 hover:bg-zinc-800 hover:border-pink-500/50 transition-all"
                    >
                      <Video className="w-3 h-3" />
                      <span>+ YouTube Embed</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, content: prev.content + '\n## Section Subheading' }))}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700/60 text-[11px] text-amber-300 hover:bg-zinc-800 hover:border-amber-500/50 transition-all"
                    >
                      <Heading className="w-3 h-3" />
                      <span>+ Subheading</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, content: prev.content + '\n> Key takeaway or expert formulation advice.' }))}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700/60 text-[11px] text-purple-300 hover:bg-zinc-800 hover:border-purple-500/50 transition-all"
                    >
                      <Quote className="w-3 h-3" />
                      <span>+ Pull-Quote</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, content: prev.content + '\n- Botanical extract formulation\n- Micro-exfoliating peptide matrix' }))}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700/60 text-[11px] text-emerald-300 hover:bg-zinc-800 hover:border-emerald-500/50 transition-all"
                    >
                      <List className="w-3 h-3" />
                      <span>+ List</span>
                    </button>
                  </div>

                  <textarea
                    rows={9}
                    required
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-200 focus:border-pink-500 focus:outline-none"
                    placeholder="Write article body with [Links](url), embedded YouTube URLs, # Headings, and > Quotes..."
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 min-h-[220px]">
                  <ArticleBodyRenderer content={form.content} />
                </div>
              )}
            </div>

            {/* SHOPPABLE ITEMS BUILDER */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-pink-400" />
                    <span>Shoppable Product Rack / Lookbook</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Add linked affiliate pieces with pricing and partner checkout links.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addShoppableRow}
                  className="flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-pink-300 hover:bg-zinc-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {(form.shoppable_items || []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={item.name}
                      onChange={(e) => updateShoppable(idx, 'name', e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Brand"
                      value={item.brand}
                      onChange={(e) => updateShoppable(idx, 'brand', e.target.value)}
                      className="w-28 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Price ($480)"
                      value={item.price}
                      onChange={(e) => updateShoppable(idx, 'price', e.target.value)}
                      className="w-24 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-amber-400 font-mono focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Affiliate Link URL"
                      value={item.affiliate_url}
                      onChange={(e) => updateShoppable(idx, 'affiliate_url', e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeShoppable(idx)}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <SchedulePostPanel
              status={form.status || 'published'}
              scheduledFor={form.scheduled_for || null}
              onChange={(s, sf) => setForm((prev) => ({ ...prev, status: s, scheduled_for: sf }))}
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-xl bg-zinc-800 px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-pink-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-pink-500 shadow-lg shadow-pink-600/20"
              >
                Deploy Lookbook
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ARTICLES TABLE */}
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Live Beauty & Fashion Lookbooks</h3>
          <span className="text-xs font-mono text-zinc-400">{articles.length} Articles Live</span>
        </div>

        <div className="divide-y divide-zinc-800/80">
          {articles.map((art) => (
            <div
              key={art.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-zinc-900/90 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800">
                  <Image src={art.hero_image_url} alt={art.title} fill className="object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{art.title}</h4>
                    {art.status === 'scheduled' ? (
                      <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[9px] font-mono font-bold text-purple-400 border border-purple-500/40">
                        SCHEDULED: {art.scheduled_for ? formatDateTime(art.scheduled_for) : 'SOON'}
                      </span>
                    ) : art.status === 'draft' ? (
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-[9px] font-mono font-bold text-zinc-400 border border-zinc-700">
                        DRAFT
                      </span>
                    ) : (
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-400 border border-emerald-500/40">
                        PUBLISHED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-0.5">
                    <span>{art.shoppable_items?.length || 0} Shoppable pieces</span>
                    <span>•</span>
                    <span>{art.read_time} min read</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/beauty-fashion/${art.slug}`}
                  target="_blank"
                  className="flex items-center gap-1 rounded-xl bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </Link>

                <button
                  onClick={() => handleEdit(art)}
                  className="rounded-xl bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(art.id, art.title)}
                  className="rounded-xl bg-rose-950/40 border border-rose-800/40 p-2 text-rose-400 hover:bg-rose-900/60 hover:text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
