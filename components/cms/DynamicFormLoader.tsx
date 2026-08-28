'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Utensils,
  Star,
  ShoppingBag,
  Flame,
  Clock,
  Sparkles,
  Save,
  X,
  Plus,
  Trash2,
  ExternalLink,
  Code,
  List,
  AlertCircle,
  CheckCircle,
  FileText,
  Tag,
  Sliders,
  Radio,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';
import { SchedulePostPanel } from '@/components/cms/SchedulePostPanel';
import type { PostStatus, ShoppableItem } from '@/lib/types';

export type VerticalType = 'recipes' | 'reviews' | 'news' | 'lifestyle';

export interface DynamicFormLoaderProps {
  vertical: VerticalType;
  initialData?: any;
  onSaveSuccess?: (savedData: any) => void;
  onCancel?: () => void;
}

interface FormState {
  id?: string;
  title: string;
  slug: string;
  author: string;
  hero_image_url: string;
  status: PostStatus;
  scheduled_for: string | null;
  tags: string[];
  // Recipe specific
  prep_time: number;
  cook_time: number;
  calories: number;
  servings: number;
  category: string;
  cuisine: string;
  dietary_tags: string[];
  ingredients: Array<{ item: string; amount: number; unit: string; notes?: string }>;
  instructions: Array<{ step: number; title?: string; instruction: string }>;
  // Review specific
  affiliate_link: string;
  affiliate_retailer: string;
  rating: number;
  summary: string;
  verdict: string;
  pros: string[];
  cons: string[];
  specifications: Record<string, string | number>;
  // Lifestyle / News specific
  subtitle: string;
  gallery_images: string[];
  content: string;
  read_time: number;
  is_breaking: boolean;
  shoppable_items: ShoppableItem[];
}

export default function DynamicFormLoader({
  vertical,
  initialData,
  onSaveSuccess,
  onCancel,
}: DynamicFormLoaderProps) {
  // Default values tailored to vertical
  const defaultCategory =
    vertical === 'recipes'
      ? 'Pasta & Italian'
      : vertical === 'reviews'
      ? 'tech_hardware'
      : vertical === 'lifestyle'
      ? 'beauty_fashion'
      : 'gaming_news';

  const defaultAuthor =
    vertical === 'recipes'
      ? 'Chef Marco Bellini'
      : vertical === 'reviews'
      ? 'Ultimatum Lab Hardware Team'
      : vertical === 'lifestyle'
      ? 'Lifestyle Editorial Desk'
      : 'Newsroom Editorial Staff';

  const [form, setForm] = useState<FormState>({
    id: initialData?.id || '',
    title: initialData?.title || initialData?.product_name || '',
    slug: initialData?.slug || '',
    author: initialData?.author || defaultAuthor,
    hero_image_url:
      initialData?.hero_image_url ||
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    status: (initialData?.status as PostStatus) || 'published',
    scheduled_for: initialData?.scheduled_for || null,
    tags: initialData?.tags || ['Featured', 'Trending'],
    // Recipe fields
    prep_time: initialData?.prep_time ?? 15,
    cook_time: initialData?.cook_time ?? 25,
    calories: initialData?.calories ?? 450,
    servings: initialData?.servings ?? 4,
    category: initialData?.category || defaultCategory,
    cuisine: initialData?.cuisine || 'Italian',
    dietary_tags: initialData?.dietary_tags || ['Gluten-Free Option', 'High Protein'],
    ingredients: initialData?.ingredients || [
      { item: 'Fresh Organic Pasta / Rice', amount: 16, unit: 'oz', notes: 'Al dente' },
      { item: 'Extra Virgin Olive Oil', amount: 2, unit: 'tbsp' },
      { item: 'Minced Garlic Cloves', amount: 3, unit: 'cloves' },
    ],
    instructions: initialData?.instructions || [
      { step: 1, title: 'Prep & Mise en Place', instruction: 'Prepare all vegetables and bring salted water to boil.' },
      { step: 2, title: 'Sauté & Infuse', instruction: 'Gently heat olive oil, toast aromatics until golden.' },
      { step: 3, title: 'Finish & Plate', instruction: 'Toss pasta into the sauce, garnish with fresh herbs, and serve hot.' },
    ],
    // Review fields
    affiliate_link: initialData?.affiliate_link || 'https://amazon.com/dp/example?tag=ultimatum-20',
    affiliate_retailer: initialData?.affiliate_retailer || 'Amazon Direct Partner',
    rating: initialData?.rating ?? 4.8,
    summary: initialData?.summary || '',
    verdict: initialData?.verdict || initialData?.content || '',
    pros: initialData?.pros || ['Class-leading thermal performance', 'Ultra-low latency audio drivers'],
    cons: initialData?.cons || ['Premium price point', 'Requires proprietary software for RGB'],
    specifications: initialData?.specifications || {
      'Sensor / Engine': 'Optical 30,000 DPI',
      'Battery Life': '90 Hours Continuous',
      'Weight': '58 grams',
      'Connectivity': '2.4GHz Wireless / Type-C',
    },
    // Lifestyle / News fields
    subtitle: initialData?.subtitle || '',
    gallery_images: initialData?.gallery_images || [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    ],
    content: initialData?.content || initialData?.description || '',
    read_time: initialData?.read_time ?? 5,
    is_breaking: initialData?.is_breaking ?? false,
    shoppable_items: initialData?.shoppable_items || [
      {
        name: 'Hydro-Barrier Ceramide Cream',
        brand: 'Dr. Jart+',
        price: '$48.00',
        affiliate_url: 'https://sephora.com',
        image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80',
      },
    ],
  });

  // State controls
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [shoppableEditorMode, setShoppableEditorMode] = useState<'array' | 'json'>('array');
  const [shoppableJsonError, setShoppableJsonError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');

  // Auto-slug generator
  const handleTitleChange = (val: string) => {
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    setForm((prev) => ({
      ...prev,
      title: val,
      slug: prev.slug ? prev.slug : autoSlug,
    }));
  };

  // Tag helpers
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (!form.tags.includes(tagInput.trim())) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tagToRemove) }));
  };

  // Recipe helpers
  const handleAddIngredient = () => {
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { item: '', amount: 1, unit: 'cup', notes: '' }],
    }));
  };

  const handleRemoveIngredient = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx),
    }));
  };

  const handleAddInstruction = () => {
    setForm((prev) => ({
      ...prev,
      instructions: [
        ...prev.instructions,
        { step: prev.instructions.length + 1, title: '', instruction: '' },
      ],
    }));
  };

  const handleRemoveInstruction = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      instructions: prev.instructions
        .filter((_, i) => i !== idx)
        .map((item, i) => ({ ...item, step: i + 1 })),
    }));
  };

  // Review helpers
  const handleAddPro = () => {
    setForm((prev) => ({ ...prev, pros: [...prev.pros, ''] }));
  };

  const handleAddCon = () => {
    setForm((prev) => ({ ...prev, cons: [...prev.cons, ''] }));
  };

  const handleAddSpec = () => {
    if (!specKey.trim()) return;
    setForm((prev) => ({
      ...prev,
      specifications: { ...prev.specifications, [specKey.trim()]: specVal.trim() },
    }));
    setSpecKey('');
    setSpecVal('');
  };

  const handleRemoveSpec = (key: string) => {
    setForm((prev) => {
      const next = { ...prev.specifications };
      delete next[key];
      return { ...prev, specifications: next };
    });
  };

  // Lifestyle Shoppable Items helpers
  const handleAddShoppableItem = () => {
    const newItem: ShoppableItem = {
      name: '',
      brand: '',
      price: '$0.00',
      affiliate_url: '',
      image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80',
    };
    setForm((prev) => ({
      ...prev,
      shoppable_items: [...prev.shoppable_items, newItem],
    }));
  };

  const handleRemoveShoppableItem = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      shoppable_items: prev.shoppable_items.filter((_, i) => i !== idx),
    }));
  };

  const handleShoppableJsonChange = (rawJson: string) => {
    try {
      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed)) {
        setForm((prev) => ({ ...prev, shoppable_items: parsed }));
        setShoppableJsonError(null);
      } else {
        setShoppableJsonError('Root element must be an array of objects.');
      }
    } catch (e: any) {
      setShoppableJsonError(e.message || 'Invalid JSON syntax');
    }
  };

  // Submit Handler calling /api/posts
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) {
      setFeedback({ type: 'error', message: 'Title and URL Slug are required.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const postPayload = {
      id: form.id || `${vertical.slice(0, 3)}-${Date.now()}`,
      title: form.title,
      slug: form.slug,
      subtitle: form.subtitle || form.summary,
      content: form.content || form.verdict,
      category: form.category,
      type: vertical === 'recipes' ? 'recipe' : vertical === 'reviews' ? 'review' : 'article',
      author: form.author,
      hero_image_url: form.hero_image_url,
      gallery_images: form.gallery_images,
      tags: form.tags,
      read_time: form.read_time,
      is_breaking: form.is_breaking,
      shoppable_items: form.shoppable_items,
      scheduled_for: form.status === 'scheduled' ? form.scheduled_for : null,
      status: form.status,
      // Pass vertical specific blobs
      prep_time: form.prep_time,
      cook_time: form.cook_time,
      calories: form.calories,
      servings: form.servings,
      cuisine: form.cuisine,
      dietary_tags: form.dietary_tags,
      ingredients: form.ingredients,
      instructions: form.instructions,
      affiliate_link: form.affiliate_link,
      affiliate_retailer: form.affiliate_retailer,
      rating: form.rating,
      pros: form.pros,
      cons: form.cons,
      specifications: form.specifications,
    };

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postPayload),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: `Saved ${vertical.toUpperCase()} post successfully! Status: ${form.status.toUpperCase()}`,
        });
        if (onSaveSuccess) onSaveSuccess(data);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to save post' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error saving post' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-800 bg-slate-900/90 text-white shadow-2xl p-6 sm:p-8 space-y-8 backdrop-blur-xl transition-all"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              vertical === 'recipes'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : vertical === 'reviews'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : vertical === 'lifestyle'
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
            }`}
          >
            {vertical === 'recipes' && <Utensils className="h-6 w-6" />}
            {vertical === 'reviews' && <Star className="h-6 w-6" />}
            {vertical === 'lifestyle' && <ShoppingBag className="h-6 w-6" />}
            {vertical === 'news' && <Flame className="h-6 w-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
              <span>UNIFIED CMS ENGINE</span>
              <span className="text-slate-600">•</span>
              <span
                className={
                  vertical === 'recipes'
                    ? 'text-amber-400'
                    : vertical === 'reviews'
                    ? 'text-cyan-400'
                    : vertical === 'lifestyle'
                    ? 'text-pink-400'
                    : 'text-purple-400'
                }
              >
                {vertical.toUpperCase()} VERTICAL
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              {form.id ? 'Edit Content Entry' : `Create New ${vertical.slice(0, -1)}`}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50 ${
              vertical === 'recipes'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                : vertical === 'reviews'
                ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
                : vertical === 'lifestyle'
                ? 'bg-pink-600 hover:bg-pink-500 shadow-pink-600/30'
                : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
            }`}
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? 'Saving to Database...' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`flex items-center gap-3 rounded-2xl p-4 text-xs font-bold ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* SECTION 1: Master Metadata (Title, Slug, Hero, Author) */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
          <FileText className="h-4 w-4 text-purple-400" />
          <span>Core Publication Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-300">
              {vertical === 'reviews' ? 'Product Name & Review Headline' : 'Content Title'} *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Razer Basilisk V3 Pro Wireless Ergonomic Review"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">URL Slug *</label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="razer-basilisk-v3-pro-review"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-mono text-purple-300 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Author / Editorial Bylines</label>
            <input
              type="text"
              value={form.author}
              onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-300">Hero Image URL</label>
            <div className="flex gap-3">
              <input
                type="url"
                value={form.hero_image_url}
                onChange={(e) => setForm((prev) => ({ ...prev, hero_image_url: e.target.value }))}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none font-mono"
              />
              {form.hero_image_url && (
                <div className="relative h-10 w-16 overflow-hidden rounded-lg border border-slate-700 flex-shrink-0">
                  <Image
                    src={form.hero_image_url}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Dynamic Vertical-Specific Fields */}

      {/* 2A: RECIPES VERTICAL */}
      {vertical === 'recipes' && (
        <div className="space-y-6 rounded-2xl border border-amber-500/20 bg-slate-950/60 p-6">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase">
            <Utensils className="h-4 w-4" />
            <span>Recipe Specifications & Nutrition</span>
          </div>

          {/* Metrics Number Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>Prep Time (Mins)</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.prep_time}
                onChange={(e) => setForm((prev) => ({ ...prev, prep_time: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono font-bold text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <Flame className="h-3.5 w-3.5 text-rose-400" />
                <span>Cook Time (Mins)</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.cook_time}
                onChange={(e) => setForm((prev) => ({ ...prev, cook_time: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono font-bold text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                <span>Calories (kcal)</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.calories}
                onChange={(e) => setForm((prev) => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono font-bold text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                <span>Servings</span>
              </label>
              <input
                type="number"
                min="1"
                value={form.servings}
                onChange={(e) => setForm((prev) => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono font-bold text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Category & Cuisine */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Culinary Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="Pasta & Italian">Pasta & Italian</option>
                <option value="Curries & Stews">Curries & Stews</option>
                <option value="Artisanal Bakery & Desserts">Artisanal Bakery & Desserts</option>
                <option value="Steakhouse & Grill">Steakhouse & Grill</option>
                <option value="Ramen & Asian Broths">Ramen & Asian Broths</option>
                <option value="Salads & Bowls">Salads & Bowls</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Cuisine Style</label>
              <input
                type="text"
                value={form.cuisine}
                onChange={(e) => setForm((prev) => ({ ...prev, cuisine: e.target.value }))}
                placeholder="Italian, Japanese, French Modern"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Dynamic Ingredients Editor */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Ingredients (Mise En Place)</label>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-bold text-amber-300 hover:bg-amber-500/30"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Ingredient</span>
              </button>
            </div>

            <div className="space-y-2">
              {form.ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ingredient Name"
                    value={ing.item}
                    onChange={(e) => {
                      const copy = [...form.ingredients];
                      copy[idx].item = e.target.value;
                      setForm((prev) => ({ ...prev, ingredients: copy }));
                    }}
                    className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={ing.amount}
                    onChange={(e) => {
                      const copy = [...form.ingredients];
                      copy[idx].amount = parseFloat(e.target.value) || 0;
                      setForm((prev) => ({ ...prev, ingredients: copy }));
                    }}
                    className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Unit (oz, tbsp)"
                    value={ing.unit}
                    onChange={(e) => {
                      const copy = [...form.ingredients];
                      copy[idx].unit = e.target.value;
                      setForm((prev) => ({ ...prev, ingredients: copy }));
                    }}
                    className="w-24 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(idx)}
                    className="rounded-lg bg-rose-950/40 border border-rose-800/40 p-2 text-rose-400 hover:bg-rose-900"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Step-by-Step Instructions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Step-by-Step Preparation Steps</label>
              <button
                type="button"
                onClick={handleAddInstruction}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-bold text-amber-300 hover:bg-amber-500/30"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Step</span>
              </button>
            </div>

            <div className="space-y-3">
              {form.instructions.map((inst, idx) => (
                <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-mono font-bold text-amber-400">
                      Step {inst.step}
                    </span>
                    <input
                      type="text"
                      placeholder="Step Title (e.g. Searing the Protein)"
                      value={inst.title || ''}
                      onChange={(e) => {
                        const copy = [...form.instructions];
                        copy[idx].title = e.target.value;
                        setForm((prev) => ({ ...prev, instructions: copy }));
                      }}
                      className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveInstruction(idx)}
                      className="rounded-lg bg-rose-950/40 border border-rose-800/40 p-1.5 text-rose-400 hover:bg-rose-900"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Describe culinary technique in detail..."
                    value={inst.instruction}
                    onChange={(e) => {
                      const copy = [...form.instructions];
                      copy[idx].instruction = e.target.value;
                      setForm((prev) => ({ ...prev, instructions: copy }));
                    }}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2B: REVIEWS VERTICAL */}
      {vertical === 'reviews' && (
        <div className="space-y-6 rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-6">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase">
            <Star className="h-4 w-4" />
            <span>Product Rating, Lab Specs & Affiliate Links</span>
          </div>

          {/* Rating Slider & Affiliate URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rating Slider (1.0 to 5.0) */}
            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-cyan-400" />
                  <span>Rating Score</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-lg font-black font-mono text-white">{form.rating.toFixed(1)}</span>
                  <span className="text-xs text-slate-500">/ 5.0</span>
                </div>
              </div>

              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={form.rating}
                onChange={(e) => setForm((prev) => ({ ...prev, rating: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />

              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>1.0 (Flawed)</span>
                <span>3.0 (Average)</span>
                <span>5.0 (Editor Choice)</span>
              </div>
            </div>

            {/* Affiliate Link Inputs */}
            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-cyan-400" />
                <span>Monetized Affiliate Partner Link</span>
              </label>

              <input
                type="url"
                value={form.affiliate_link}
                onChange={(e) => setForm((prev) => ({ ...prev, affiliate_link: e.target.value }))}
                placeholder="https://amazon.com/dp/..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              />

              <input
                type="text"
                value={form.affiliate_retailer}
                onChange={(e) => setForm((prev) => ({ ...prev, affiliate_retailer: e.target.value }))}
                placeholder="Retailer (e.g. Amazon / Razer Direct)"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pros */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>The Pros (Highlights)</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddPro}
                  className="text-[11px] font-mono text-emerald-400 hover:underline"
                >
                  + Add Pro
                </button>
              </div>
              {form.pros.map((p, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={p}
                    onChange={(e) => {
                      const copy = [...form.pros];
                      copy[idx] = e.target.value;
                      setForm((prev) => ({ ...prev, pros: copy }));
                    }}
                    className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, pros: prev.pros.filter((_, i) => i !== idx) }))}
                    className="p-1.5 text-slate-500 hover:text-rose-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Cons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>The Cons (Trade-offs)</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddCon}
                  className="text-[11px] font-mono text-rose-400 hover:underline"
                >
                  + Add Con
                </button>
              </div>
              {form.cons.map((c, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={c}
                    onChange={(e) => {
                      const copy = [...form.cons];
                      copy[idx] = e.target.value;
                      setForm((prev) => ({ ...prev, cons: copy }));
                    }}
                    className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, cons: prev.cons.filter((_, i) => i !== idx) }))}
                    className="p-1.5 text-slate-500 hover:text-rose-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Key-Value Specifications */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-slate-300">Technical Hardware Specifications</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Spec Key (e.g. Polling Rate)"
                value={specKey}
                onChange={(e) => setSpecKey(e.target.value)}
                className="w-1/3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Value (e.g. 8000Hz True Wireless)"
                value={specVal}
                onChange={(e) => setSpecVal(e.target.value)}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSpec}
                className="rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-3.5 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30"
              >
                Add Spec
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {Object.entries(form.specifications).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs"
                >
                  <span className="font-mono text-slate-400">{k}:</span>
                  <span className="font-bold text-white">{String(v)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(k)}
                    className="text-slate-500 hover:text-rose-400 pl-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2C: LIFESTYLE VERTICAL (Shoppable Affiliate Carousel Items Dual Editor) */}
      {vertical === 'lifestyle' && (
        <div className="space-y-6 rounded-2xl border border-pink-500/20 bg-slate-950/60 p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-pink-400 uppercase">
              <ShoppingBag className="h-4 w-4" />
              <span>Shoppable Affiliate Carousel Engine</span>
            </div>

            {/* Mode Switcher: Interactive Array vs JSON View */}
            <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setShoppableEditorMode('array')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  shoppableEditorMode === 'array'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>Interactive Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setShoppableEditorMode('json')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  shoppableEditorMode === 'json'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>Raw JSON Matrix</span>
              </button>
            </div>
          </div>

          {shoppableEditorMode === 'array' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Featured products render as high-conversion affiliate carousels directly inside the article.
                </p>
                <button
                  type="button"
                  onClick={handleAddShoppableItem}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-pink-500/20 border border-pink-500/40 px-3 py-1.5 text-xs font-bold text-pink-300 hover:bg-pink-500/30"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Carousel Product</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.shoppable_items.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3 relative group"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveShoppableItem(idx)}
                      className="absolute top-3 right-3 rounded-lg bg-rose-950/60 border border-rose-800/40 p-1.5 text-rose-400 hover:bg-rose-900"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex gap-3">
                      {item.image_url && (
                        <div className="relative h-16 w-16 rounded-xl border border-slate-700 overflow-hidden flex-shrink-0">
                          <Image src={item.image_url} alt={item.name} fill className="object-cover" unoptimized />
                        </div>
                      )}
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          placeholder="Product Name"
                          value={item.name}
                          onChange={(e) => {
                            const copy = [...form.shoppable_items];
                            copy[idx].name = e.target.value;
                            setForm((prev) => ({ ...prev, shoppable_items: copy }));
                          }}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-bold text-white focus:border-pink-500 focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Brand"
                            value={item.brand}
                            onChange={(e) => {
                              const copy = [...form.shoppable_items];
                              copy[idx].brand = e.target.value;
                              setForm((prev) => ({ ...prev, shoppable_items: copy }));
                            }}
                            className="w-1/2 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300 focus:border-pink-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="$ Price"
                            value={item.price}
                            onChange={(e) => {
                              const copy = [...form.shoppable_items];
                              copy[idx].price = e.target.value;
                              setForm((prev) => ({ ...prev, shoppable_items: copy }));
                            }}
                            className="w-1/2 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-mono text-emerald-400 focus:border-pink-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <input
                        type="url"
                        placeholder="Affiliate Destination URL"
                        value={item.affiliate_url}
                        onChange={(e) => {
                          const copy = [...form.shoppable_items];
                          copy[idx].affiliate_url = e.target.value;
                          setForm((prev) => ({ ...prev, shoppable_items: copy }));
                        }}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-[11px] font-mono text-slate-400 focus:border-pink-500 focus:outline-none"
                      />
                      <input
                        type="url"
                        placeholder="Product Image URL"
                        value={item.image_url}
                        onChange={(e) => {
                          const copy = [...form.shoppable_items];
                          copy[idx].image_url = e.target.value;
                          setForm((prev) => ({ ...prev, shoppable_items: copy }));
                        }}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-mono text-slate-400 focus:border-pink-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300">
                JSON Matrix Editor (Array of ShoppableItem objects)
              </label>
              <textarea
                rows={8}
                value={JSON.stringify(form.shoppable_items, null, 2)}
                onChange={(e) => handleShoppableJsonChange(e.target.value)}
                className="w-full font-mono text-xs rounded-xl border border-slate-800 bg-slate-950 p-4 text-pink-300 focus:border-pink-500 focus:outline-none"
              />
              {shoppableJsonError && (
                <div className="text-xs font-mono text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  <span>{shoppableJsonError}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2D: NEWS VERTICAL */}
      {vertical === 'news' && (
        <div className="space-y-6 rounded-2xl border border-purple-500/20 bg-slate-950/60 p-6">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 uppercase">
            <Flame className="h-4 w-4" />
            <span>Newsroom & Breaking Alerts Configuration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Breaking News Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Radio className="h-4 w-4 text-rose-500 animate-pulse" />
                  <span>Breaking News Alert Banner</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Pins this story with high-visibility neon badging on homepage headers.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_breaking}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_breaking: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            {/* Read Time */}
            <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Clock className="h-4 w-4 text-purple-400" />
                <span>Estimated Read Time (Minutes)</span>
              </label>
              <input
                type="number"
                min="1"
                value={form.read_time}
                onChange={(e) => setForm((prev) => ({ ...prev, read_time: parseInt(e.target.value) || 1 }))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm font-mono font-bold text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Main Editorial Content / Body */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
          <span>{vertical === 'reviews' ? 'In-Depth Lab Verdict & Analysis' : 'Editorial Article Body (Markdown)'}</span>
          <span className="text-[11px] font-mono text-slate-500">Supports Markdown & Headings</span>
        </label>
        <textarea
          rows={8}
          value={form.content}
          onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
          placeholder="Write your exhaustive editorial analysis, teardown, or culinary guide here..."
          className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none leading-relaxed"
        />
      </div>

      {/* SECTION 4: Cross-Niche Taxonomy Tags */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
          <Tag className="h-4 w-4 text-purple-400" />
          <span>Cross-Niche Taxonomy Tags</span>
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add tag (e.g. Michelin Techniques, 4K Benchmarks, Skincare Science)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-white transition-all"
          >
            Add Tag
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {form.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300"
            >
              <span>#{t}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(t)}
                className="hover:text-rose-400 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* SECTION 5: Post Scheduling & Publication Control */}
      <div className="pt-2">
        <SchedulePostPanel
          status={form.status}
          scheduledFor={form.scheduled_for}
          onChange={(newStatus, newScheduledFor) => {
            setForm((prev) => ({
              ...prev,
              status: newStatus,
              scheduled_for: newScheduledFor,
            }));
          }}
        />
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-6">
        <div className="text-xs text-slate-500 font-mono">
          Last saved: {new Date().toLocaleTimeString()}
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              Discard Changes
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:scale-105 transition-all disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? 'Saving...' : 'Publish Content'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
