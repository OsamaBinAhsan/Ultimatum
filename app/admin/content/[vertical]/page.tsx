'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Utensils,
  Star,
  ShoppingBag,
  Flame,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle,
  Clock,
  Send,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import DynamicFormLoader, { VerticalType } from '@/components/cms/DynamicFormLoader';
import { formatDateTime } from '@/lib/utils/format';

const VALID_VERTICALS: VerticalType[] = ['recipes', 'reviews', 'news', 'lifestyle'];

export default function UnifiedCMSVerticalPage({
  params,
}: {
  params: Promise<{ vertical: string }>;
}) {
  const resolvedParams = use(params);
  const rawVertical = resolvedParams.vertical;

  if (!VALID_VERTICALS.includes(rawVertical as VerticalType)) {
    notFound();
  }

  const vertical = rawVertical as VerticalType;

  // List data state
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const refreshItems = () => {
    if (vertical === 'recipes') {
      setItems(platformStore.getAllRecipes());
    } else if (vertical === 'reviews') {
      setItems(platformStore.getAllReviews());
    } else {
      // News or Lifestyle
      const category = vertical === 'lifestyle' ? 'beauty_fashion' : undefined;
      setItems(platformStore.getArticles(category, 'all'));
    }
  };

  useEffect(() => {
    refreshItems();
  }, [vertical]);

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      if (vertical === 'recipes') {
        platformStore.deleteRecipe(id);
      } else if (vertical === 'reviews') {
        platformStore.deleteReview(id);
      } else {
        platformStore.deleteArticle(id);
      }
      refreshItems();
      setFeedback(`"${title}" deleted successfully.`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const filteredItems = items.filter((item) => {
    const title = item.title || item.product_name || '';
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.slug || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.author || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && (item.status || 'published') === statusFilter;
  });

  const getVerticalColor = () => {
    switch (vertical) {
      case 'recipes':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'reviews':
        return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
      case 'lifestyle':
        return 'text-pink-400 border-pink-500/30 bg-pink-500/10';
      case 'news':
        return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
    }
  };

  const getPublicLink = (slug: string) => {
    switch (vertical) {
      case 'recipes':
        return `/recipes/${slug}`;
      case 'reviews':
        return `/reviews/${slug}`;
      case 'lifestyle':
        return `/beauty-fashion/${slug}`;
      case 'news':
        return `/news/${slug}`;
    }
  };

  return (
    <div className="space-y-8">
      {/* Form Editor View */}
      {isCreatingNew || editingItem ? (
        <div className="space-y-6">
          <button
            onClick={() => {
              setIsCreatingNew(false);
              setEditingItem(null);
            }}
            className="inline-flex items-center gap-2 text-xs font-mono font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to {vertical.toUpperCase()} Catalog</span>
          </button>

          <DynamicFormLoader
            vertical={vertical}
            initialData={editingItem}
            onSaveSuccess={() => {
              refreshItems();
              setIsCreatingNew(false);
              setEditingItem(null);
            }}
            onCancel={() => {
              setIsCreatingNew(false);
              setEditingItem(null);
            }}
          />
        </div>
      ) : (
        /* Catalog List View */
        <div className="space-y-8">
          {/* Header & Create Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                <span className={`rounded-md px-2 py-0.5 border ${getVerticalColor()}`}>
                  {vertical.toUpperCase()} CMS
                </span>
                <span>• Unified Engine</span>
              </div>
              <h1 className="text-3xl font-black text-white mt-1">
                {vertical === 'recipes' && 'Michelin Kitchen Recipes'}
                {vertical === 'reviews' && 'Hardware Lab & Product Reviews'}
                {vertical === 'news' && 'Newsroom & Breaking Editorial'}
                {vertical === 'lifestyle' && 'Beauty, Wellness & Fashion Desk'}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Author, schedule, moderate, and publish high-performance content for the {vertical} vertical.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingItem(null);
                setIsCreatingNew(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/25 hover:scale-105 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create New {vertical.slice(0, -1).toUpperCase()}</span>
            </button>
          </div>

          {/* Feedback Toast */}
          {feedback && (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 p-4 text-xs font-bold text-emerald-300">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder={`Search ${vertical} by title, author, or slug...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Content</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Drafts</option>
              </select>
            </div>
          </div>

          {/* Content Catalog Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {vertical === 'recipes' && <Utensils className="h-4 w-4 text-amber-400" />}
                {vertical === 'reviews' && <Star className="h-4 w-4 text-cyan-400" />}
                {vertical === 'lifestyle' && <ShoppingBag className="h-4 w-4 text-pink-400" />}
                {vertical === 'news' && <Flame className="h-4 w-4 text-purple-400" />}
                <span>Active {vertical.toUpperCase()} Records</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {filteredItems.length} of {items.length} Entries
              </span>
            </div>

            {filteredItems.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 font-mono">
                No {vertical} records found matching your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-800 bg-slate-950/50 font-mono uppercase text-slate-400">
                    <tr>
                      <th className="px-6 py-3.5">Content Title</th>
                      <th className="px-6 py-3.5">Category &amp; Specs</th>
                      <th className="px-6 py-3.5">Release Status</th>
                      <th className="px-6 py-3.5">Publication Date</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredItems.map((item) => {
                      const title = item.title || item.product_name || 'Untitled';
                      const status: string = item.status || 'published';

                      return (
                        <tr key={item.id} className="hover:bg-slate-900/90 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {item.hero_image_url && (
                                <div className="relative h-12 w-12 rounded-xl border border-slate-700 overflow-hidden flex-shrink-0">
                                  <Image
                                    src={item.hero_image_url}
                                    alt={title}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-white hover:text-purple-300 transition-colors">
                                  {title}
                                </div>
                                <div className="text-[11px] font-mono text-slate-500">
                                  by {item.author || 'Editorial'} • /{item.slug}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-mono text-slate-400">
                            {vertical === 'recipes' && (
                              <span>
                                {item.prep_time + item.cook_time}m • {item.calories} kcal
                              </span>
                            )}
                            {vertical === 'reviews' && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                <span className="font-bold text-white">{item.rating}</span>
                              </div>
                            )}
                            {vertical === 'lifestyle' && (
                              <span>
                                {item.shoppable_items?.length || 0} Shoppable Carousel Items
                              </span>
                            )}
                            {vertical === 'news' && (
                              <span>
                                {item.is_breaking ? '🚨 Breaking' : `${item.read_time || 5} min read`}
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`rounded-md px-2.5 py-1 text-[10px] font-mono font-bold uppercase inline-flex items-center gap-1.5 ${
                                status === 'published'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : status === 'scheduled'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {status === 'published' && <Send className="h-3 w-3" />}
                              {status === 'scheduled' && <Clock className="h-3 w-3" />}
                              <span>{status}</span>
                            </span>
                          </td>

                          <td className="px-6 py-4 font-mono text-slate-500">
                            {item.scheduled_for
                              ? formatDateTime(item.scheduled_for)
                              : item.published_at
                              ? formatDateTime(item.published_at)
                              : formatDateTime(item.created_at)}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={getPublicLink(item.slug)}
                                target="_blank"
                                className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:text-white"
                                title="View Public Post"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>

                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setIsCreatingNew(false);
                                }}
                                className="rounded-lg bg-purple-950/50 border border-purple-800/40 p-2 text-purple-300 hover:bg-purple-900"
                                title="Edit Content"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleDelete(item.id, title)}
                                className="rounded-lg bg-rose-950/50 border border-rose-800/40 p-2 text-rose-400 hover:bg-rose-900"
                                title="Delete Content"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
