'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Cpu,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  Eye,
  Star,
  ShoppingBag,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Review, ReviewCategory, PostStatus } from '@/lib/types';
import { SchedulePostPanel } from '@/components/cms/SchedulePostPanel';
import confetti from 'canvas-confetti';

export default function AdminReviewsManager() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [form, setForm] = useState<Review>({
    id: '',
    slug: '',
    product_name: '',
    category: 'tech_hardware',
    rating: 4.8,
    summary: '',
    verdict: '',
    pros: ['High build quality', 'Long battery life'],
    cons: ['High price point'],
    specifications: {
      'Form Factor': 'Compact Modular',
      'Connectivity': 'Bluetooth 5.4',
      'MSRP': '$199.00 USD',
    },
    affiliate_link: 'https://example.com/affiliate-link',
    affiliate_retailer: 'Amazon Prime',
    hero_image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
    author: 'Alex Mercer (Hardware Lead)',
    created_at: new Date().toISOString(),
    status: 'published' as PostStatus,
    scheduled_for: null,
  });

  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');

  useEffect(() => {
    setReviews(platformStore.getReviews());
  }, []);

  const handleOpenCreate = () => {
    setForm({
      id: 'rev-' + Date.now(),
      slug: '',
      product_name: '',
      category: 'tech_hardware',
      rating: 4.8,
      summary: '',
      verdict: '',
      pros: ['Exceptional performance', 'Premium materials'],
      cons: ['Minor software quirks'],
      specifications: {
        'Display': 'AMOLED 120Hz',
        'MSRP': '$299.00',
      },
      affiliate_link: '',
      affiliate_retailer: 'Official Partner',
      hero_image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
      author: 'Alex Mercer (Hardware Lead)',
      created_at: new Date().toISOString(),
      status: 'published' as PostStatus,
      scheduled_for: null,
    });
    setIsEditing(true);
  };

  const handleNameChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setForm((prev) => ({
      ...prev,
      product_name: val,
      slug: prev.id.startsWith('rev-') ? slug : prev.slug,
    }));
  };

  const addPro = () => {
    if (newPro.trim()) {
      setForm((prev) => ({ ...prev, pros: [...prev.pros, newPro.trim()] }));
      setNewPro('');
    }
  };

  const removePro = (idx: number) => {
    setForm((prev) => ({ ...prev, pros: prev.pros.filter((_, i) => i !== idx) }));
  };

  const addCon = () => {
    if (newCon.trim()) {
      setForm((prev) => ({ ...prev, cons: [...prev.cons, newCon.trim()] }));
      setNewCon('');
    }
  };

  const removeCon = (idx: number) => {
    setForm((prev) => ({ ...prev, cons: prev.cons.filter((_, i) => i !== idx) }));
  };

  const addSpec = () => {
    if (specKey.trim() && specVal.trim()) {
      setForm((prev) => ({
        ...prev,
        specifications: { ...prev.specifications, [specKey.trim()]: specVal.trim() },
      }));
      setSpecKey('');
      setSpecVal('');
    }
  };

  const removeSpec = (k: string) => {
    setForm((prev) => {
      const next = { ...prev.specifications };
      delete next[k];
      return { ...prev, specifications: next };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_name || !form.slug) {
      alert('Please provide Product Name and URL Slug.');
      return;
    }

    platformStore.saveReview(form);
    setReviews(platformStore.getReviews());
    setIsEditing(false);
    setFeedback(`Review for "${form.product_name}" published successfully!`);
    confetti({ particleCount: 70, spread: 60 });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleEdit = (rev: Review) => {
    setForm({ ...rev });
    setIsEditing(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the review "${name}"?`)) {
      platformStore.deleteReview(id);
      setReviews(platformStore.getReviews());
      setFeedback(`Review "${name}" deleted.`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400">
            <Cpu className="w-4 h-4" />
            <span>THE LAB REVIEW ENGINE</span>
          </div>
          <h1 className="text-3xl font-black text-white">Hardware & Provisions Review CMS</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Publish authoritative benchmark teardowns, food delivery tests, and affiliate monetized links.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Lab Review</span>
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
        <div className="rounded-3xl border border-indigo-500/40 bg-zinc-900/95 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="text-xl font-bold text-white">
              {form.id.startsWith('rev-') ? 'Create Authoritative Review' : 'Edit Review'}
            </h3>
            <button onClick={() => setIsEditing(false)} className="text-xs text-zinc-400 hover:text-white">
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Chrono V2 Modular Smartwatch"
                  value={form.product_name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Category Variant</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ReviewCategory })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="tech_hardware">Tech & Hardware Gear</option>
                  <option value="food_lifestyle">Food Delivery & Provisions</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-indigo-300 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                  Rating Score ({form.rating} / 5.0)
                </label>
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.1"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Executive Teardown Summary
              </label>
              <textarea
                rows={2}
                required
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Final Verdict</label>
              <textarea
                rows={2}
                required
                value={form.verdict}
                onChange={(e) => setForm({ ...form, verdict: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                  Affiliate Link URL
                </label>
                <input
                  type="text"
                  placeholder="https://amzn.to/..."
                  value={form.affiliate_link || ''}
                  onChange={(e) => setForm({ ...form, affiliate_link: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-amber-300 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                  Affiliate Retailer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amazon / MakerForge Direct"
                  value={form.affiliate_retailer || ''}
                  onChange={(e) => setForm({ ...form, affiliate_retailer: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Hero Image URL</label>
              <input
                type="text"
                required
                value={form.hero_image_url}
                onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-300 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* PROS & CONS BUILDER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              {/* Pros */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-emerald-400 uppercase">Pros & Highlights</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a pro..."
                    value={newPro}
                    onChange={(e) => setNewPro(e.target.value)}
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addPro}
                    className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-bold text-emerald-400 hover:bg-zinc-700"
                  >
                    Add
                  </button>
                </div>
                <ul className="space-y-1.5">
                  {form.pros.map((p, idx) => (
                    <li key={idx} className="flex items-center justify-between text-xs text-zinc-300 bg-zinc-900/60 p-2 rounded-lg">
                      <span>✓ {p}</span>
                      <button type="button" onClick={() => removePro(idx)} className="text-zinc-500 hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-rose-400 uppercase">Cons & Tradeoffs</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a limitation..."
                    value={newCon}
                    onChange={(e) => setNewCon(e.target.value)}
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addCon}
                    className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-bold text-rose-400 hover:bg-zinc-700"
                  >
                    Add
                  </button>
                </div>
                <ul className="space-y-1.5">
                  {form.cons.map((c, idx) => (
                    <li key={idx} className="flex items-center justify-between text-xs text-zinc-300 bg-zinc-900/60 p-2 rounded-lg">
                      <span>✕ {c}</span>
                      <button type="button" onClick={() => removeCon(idx)} className="text-zinc-500 hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* SPECIFICATIONS KEY-VALUE BUILDER */}
            <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-xs font-mono font-bold text-cyan-400 uppercase">
                Hardware / Food Specifications Matrix
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Spec Key (e.g. Battery Life)"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Spec Value (e.g. 14 Days Normal Usage)"
                  value={specVal}
                  onChange={(e) => setSpecVal(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addSpec}
                  className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-bold text-cyan-400 hover:bg-zinc-700"
                >
                  Add Spec
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {Object.entries(form.specifications).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-lg bg-zinc-900 p-2 text-xs border border-zinc-800">
                    <span className="font-mono text-zinc-400">{k}:</span>
                    <span className="font-bold text-white">{String(v)}</span>
                    <button type="button" onClick={() => removeSpec(k)} className="text-zinc-500 hover:text-rose-400 ml-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Publishing & Scheduling Control */}
            <SchedulePostPanel
              status={(form.status as PostStatus) || 'published'}
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
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
              >
                Publish Lab Evaluation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REVIEWS LIST TABLE */}
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Live Lab Evaluations</h3>
          <span className="text-xs font-mono text-zinc-400">{reviews.length} Reviews Published</span>
        </div>

        <div className="divide-y divide-zinc-800/80">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-zinc-900/90 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800">
                  <Image src={rev.hero_image_url} alt={rev.product_name} fill className="object-cover" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{rev.product_name}</h4>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-0.5">
                    <span>{rev.category === 'tech_hardware' ? 'Hardware Gear' : 'Food Delivery'}</span>
                    <span>•</span>
                    <span className="text-indigo-400 font-bold">{rev.rating} / 5.0 ★</span>
                    {rev.affiliate_link && <span>• Has Affiliate Link</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/reviews/${rev.slug}`}
                  target="_blank"
                  className="flex items-center gap-1 rounded-xl bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </Link>

                <button
                  onClick={() => handleEdit(rev)}
                  className="rounded-xl bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                  title="Edit Review"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(rev.id, rev.product_name)}
                  className="rounded-xl bg-rose-950/40 border border-rose-800/40 p-2 text-rose-400 hover:bg-rose-900/60 hover:text-white"
                  title="Delete Review"
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
