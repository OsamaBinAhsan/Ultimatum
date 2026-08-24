'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FilePlus,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { CustomPage } from '@/lib/types';
import { formatDate } from '@/lib/utils/format';
import confetti from 'canvas-confetti';

export default function AdminPagesManager() {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [form, setForm] = useState<CustomPage>({
    id: '',
    slug: '',
    title: '',
    subtitle: '',
    content: '',
    meta_description: '',
    show_in_nav: true,
    show_in_footer: true,
    enable_ads: true,
    created_at: new Date().toISOString(),
  });

  useEffect(() => {
    setPages(platformStore.getPages());
  }, []);

  const handleOpenCreate = () => {
    setForm({
      id: 'page-' + Date.now(),
      slug: '',
      title: '',
      subtitle: '',
      content: `# New Guide Title\n\nWrite your rich markdown content here.\n\n### Highlights\n- Point 1\n- Point 2`,
      meta_description: '',
      show_in_nav: true,
      show_in_footer: true,
      enable_ads: true,
      created_at: new Date().toISOString(),
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
      slug: prev.id.startsWith('page-') && !prev.slug.includes('-custom') ? slug : prev.slug,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug || !form.title) {
      alert('Please provide both a Title and URL Slug');
      return;
    }

    platformStore.savePage(form);
    setPages(platformStore.getPages());
    setIsEditing(false);
    setFeedback(`Sub-Page "${form.title}" published successfully at /pages/${form.slug}!`);
    confetti({ particleCount: 70, spread: 60 });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the sub-page "${title}"?`)) {
      platformStore.deletePage(id);
      setPages(platformStore.getPages());
      setFeedback(`Sub-page "${title}" deleted.`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleEdit = (page: CustomPage) => {
    setForm({ ...page });
    setIsEditing(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400">
            <FilePlus className="w-4 h-4" />
            <span>DYNAMIC SUB-PAGE BUILDER</span>
          </div>
          <h1 className="text-3xl font-black text-white">Dynamic Sub-Pages & Routes</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Spawn new custom sub-pages, tournament guides, or landing pages with custom URLs and ad layouts.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-500 shadow-lg shadow-purple-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Sub-Page</span>
        </button>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 p-4 text-xs font-bold text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* CREATE / EDIT SUB-PAGE FORM MODAL */}
      {isEditing && (
        <div className="rounded-3xl border border-purple-500/40 bg-zinc-900/95 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="text-xl font-bold text-white">
              {form.id.startsWith('page-') ? 'Publish New Dynamic Sub-Page' : 'Edit Sub-Page'}
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Page Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Winter Speedrun Showcase 2026"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                  URL Slug (/pages/...)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. winter-speedrun-2026"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-purple-300 font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Subtitle / Tagline</label>
              <input
                type="text"
                placeholder="Short descriptive summary shown beneath the header"
                value={form.subtitle || ''}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Rich Markdown / HTML Content
              </label>
              <textarea
                rows={8}
                required
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-200 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Visibility & Ad Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-zinc-800 pt-4">
              <label className="flex items-center gap-3 rounded-xl bg-zinc-950 p-3.5 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_in_nav}
                  onChange={(e) => setForm({ ...form, show_in_nav: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs font-medium text-zinc-200">Show in Main Navbar</span>
              </label>

              <label className="flex items-center gap-3 rounded-xl bg-zinc-950 p-3.5 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_in_footer}
                  onChange={(e) => setForm({ ...form, show_in_footer: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs font-medium text-zinc-200">Show in Footer Links</span>
              </label>

              <label className="flex items-center gap-3 rounded-xl bg-zinc-950 p-3.5 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enable_ads}
                  onChange={(e) => setForm({ ...form, enable_ads: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs font-medium text-zinc-200">Enable Ad Containers</span>
              </label>
            </div>

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
                className="rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-purple-500 shadow-lg shadow-purple-600/20"
              >
                Save & Publish Sub-Page
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-PAGES DATA TABLE */}
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Active Sub-Pages & Routes</h3>
          <span className="text-xs font-mono text-zinc-400">{pages.length} Pages Live</span>
        </div>

        <div className="divide-y divide-zinc-800/80">
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-zinc-900/90 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{page.title}</h4>
                  {page.show_in_nav && (
                    <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-400 border border-cyan-500/30">
                      NAVBAR
                    </span>
                  )}
                  {page.enable_ads && (
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30">
                      ADS ON
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                  <span>URL: /pages/{page.slug}</span>
                  <span>•</span>
                  <span>Created: {formatDate(page.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/pages/${page.slug}`}
                  target="_blank"
                  className="flex items-center gap-1 rounded-xl bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Live</span>
                </Link>

                <button
                  onClick={() => handleEdit(page)}
                  className="rounded-xl bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                  title="Edit Page"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(page.id, page.title)}
                  className="rounded-xl bg-rose-950/40 border border-rose-800/40 p-2 text-rose-400 hover:bg-rose-900/60 hover:text-white"
                  title="Delete Page"
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
