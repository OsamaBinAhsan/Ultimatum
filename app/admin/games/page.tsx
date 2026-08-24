'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Gamepad2, Plus, Trash2, Edit3, Eye, CheckCircle } from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Game, GameCategory } from '@/lib/types';
import confetti from 'canvas-confetti';

export default function AdminGamesManager() {
  const [games, setGames] = useState<Game[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [form, setForm] = useState<Game>({
    id: '',
    slug: '',
    title: '',
    description: '',
    category: 'arcade',
    thumbnail_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    game_file_url: 'canvas://custom-engine',
    is_sponsored: false,
    sponsor_name: '',
    play_count: 1200,
    created_at: new Date().toISOString(),
  });

  useEffect(() => {
    setGames(platformStore.getGames());
  }, []);

  const handleOpenCreate = () => {
    setForm({
      id: 'game-' + Date.now(),
      slug: '',
      title: '',
      description: '',
      category: 'arcade',
      thumbnail_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
      game_file_url: 'canvas://custom-engine',
      is_sponsored: false,
      sponsor_name: '',
      play_count: 0,
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
      slug: prev.id.startsWith('game-') ? slug : prev.slug,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug) {
      alert('Please provide Title and Slug');
      return;
    }

    platformStore.saveGame(form);
    setGames(platformStore.getGames());
    setIsEditing(false);
    setFeedback(`Game "${form.title}" saved to Arcade Vault!`);
    confetti({ particleCount: 70, spread: 60 });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleEdit = (game: Game) => {
    setForm({ ...game });
    setIsEditing(true);
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to remove "${title}" from the Arcade?`)) {
      platformStore.deleteGame(id);
      setGames(platformStore.getGames());
      setFeedback(`Game "${title}" deleted.`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
            <Gamepad2 className="w-4 h-4" />
            <span>THE ARCADE VAULT</span>
          </div>
          <h1 className="text-3xl font-black text-white">Game Management & Deployments</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage canvas retro games, HTML5 engine paths, and sponsor attribution.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Deploy New Game</span>
        </button>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 p-4 text-xs font-bold text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {isEditing && (
        <div className="rounded-3xl border border-cyan-500/40 bg-zinc-900/95 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="text-xl font-bold text-white">
              {form.id.startsWith('game-') ? 'Deploy New Arcade Game' : 'Edit Game Details'}
            </h3>
            <button onClick={() => setIsEditing(false)} className="text-xs text-zinc-400 hover:text-white">
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Game Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neon Asteroid Blitz"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-cyan-300 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as GameCategory })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="arcade">Arcade Classic</option>
                  <option value="action">Fast Action</option>
                  <option value="puzzle">Puzzles & Cooking</option>
                  <option value="retro">8-Bit Retro Runner</option>
                  <option value="strategy">Strategy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Play Count</label>
                <input
                  type="number"
                  value={form.play_count}
                  onChange={(e) => setForm({ ...form, play_count: Number(e.target.value) })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Game Description</label>
              <textarea
                rows={3}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Thumbnail Image URL</label>
              <input
                type="text"
                required
                value={form.thumbnail_url}
                onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-300 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_sponsored}
                  onChange={(e) => setForm({ ...form, is_sponsored: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-400"
                />
                <span className="text-xs font-bold text-amber-400">Flag as Sponsored Game</span>
              </label>

              {form.is_sponsored && (
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Sponsor Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Razer / Anker / SteelSeries"
                    value={form.sponsor_name || ''}
                    onChange={(e) => setForm({ ...form, sponsor_name: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              )}
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
                className="rounded-xl bg-cyan-500 px-6 py-2.5 text-xs font-bold text-zinc-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
              >
                Save & Deploy Game
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GAMES LIST */}
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Arcade Vault Catalog</h3>
          <span className="text-xs font-mono text-zinc-400">{games.length} Games Active</span>
        </div>

        <div className="divide-y divide-zinc-800/80">
          {games.map((game) => (
            <div
              key={game.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-zinc-900/90 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800">
                  <Image src={game.thumbnail_url} alt={game.title} fill className="object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{game.title}</h4>
                    {game.is_sponsored && (
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-mono font-bold text-amber-400 border border-amber-500/30">
                        SPONSORED: {game.sponsor_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-0.5">
                    <span>{game.category.toUpperCase()}</span>
                    <span>•</span>
                    <span>{game.play_count.toLocaleString()} plays</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/games/${game.slug}`}
                  target="_blank"
                  className="flex items-center gap-1 rounded-xl bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Play Game</span>
                </Link>

                <button
                  onClick={() => handleEdit(game)}
                  className="rounded-xl bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(game.id, game.title)}
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
