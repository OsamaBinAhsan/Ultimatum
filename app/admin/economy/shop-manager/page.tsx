'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  AlertCircle,
  Coins,
  Sparkles,
  Gamepad2,
  Save,
  X,
  Search,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import type { GameItem, GameItemType } from '@/lib/types';
import { platformStore } from '@/lib/data/store';

const ITEM_TYPES: { value: GameItemType; label: string; color: string }[] = [
  { value: 'skin', label: 'Player / Ship Skin', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'powerup', label: 'Combat Power-up', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'cosmetic', label: 'Visual Cosmetic', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { value: 'badge', label: 'Trophy Profile Badge', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'avatar_frame', label: 'Avatar Frame Border', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { value: 'consumable', label: 'Consumable Boost', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
];

export default function AdminShopManagerPage() {
  const [items, setItems] = useState<GameItem[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [form, setForm] = useState<GameItem>({
    id: '',
    game_id: 'neon-asteroid-blitz',
    name: '',
    slug: '',
    item_type: 'skin',
    price_coins: 250,
    asset_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    is_active: true,
  });

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/economy/game-items');
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (e: any) {
      console.error('Error fetching game items:', e);
    }
  };

  useEffect(() => {
    fetchItems();
    setGames(platformStore.getGames());
  }, []);

  const handleOpenCreate = () => {
    setForm({
      id: `item-${Date.now()}`,
      game_id: games.length > 0 ? games[0].id : 'neon-asteroid-blitz',
      name: '',
      slug: '',
      item_type: 'skin',
      price_coins: 300,
      asset_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
      is_active: true,
    });
    setIsEditing(true);
  };

  const handleNameChange = (val: string) => {
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    setForm((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug ? prev.slug : autoSlug,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) {
      setFeedback({ type: 'error', message: 'Item name and slug are required' });
      return;
    }

    try {
      const res = await fetch('/api/admin/economy/game-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({ type: 'success', message: `Shop item "${form.name}" saved successfully!` });
        setIsEditing(false);
        fetchItems();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to save shop item' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error saving shop item' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete shop item "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/economy/game-items?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `"${name}" removed from shop catalog.` });
        fetchItems();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.game_id || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (typeFilter === 'all') return matchesSearch;
    return matchesSearch && item.item_type === typeFilter;
  });

  const getTypeBadge = (type: GameItemType) => {
    const match = ITEM_TYPES.find((t) => t.value === type);
    return match ? match.color : 'bg-slate-800 text-slate-300';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
            <ShoppingBag className="h-4 w-4" />
            <span>VIRTUAL ECONOMY &bull; INVENTORY SHOP</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Cosmetics &amp; Shop Manager</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage unlockable skins, power-ups, badges, and cosmetic gear in Microsoft SQL Server <code className="font-mono text-purple-300">[dbo].[game_items]</code>.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/25 hover:scale-105 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Upload New Game Item</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center gap-3 rounded-2xl p-4 text-xs font-bold ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Editor Modal / Inline Form */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="rounded-3xl border border-purple-500/30 bg-slate-900/95 p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <span>{form.id ? 'Configure Shop Asset' : 'Upload New Cosmetic Asset'}</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-300">Item Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Plasma Overcharge Shield MK-II"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Item Slug (Unique URL Identifier) *</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="plasma-overcharge-shield-mk2"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-mono text-purple-300 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Target Arena / Game</label>
              <select
                value={form.game_id || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, game_id: e.target.value || null }))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="">Global / Multi-Game Catalog</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Asset Type</label>
              <select
                value={form.item_type}
                onChange={(e) => setForm((prev) => ({ ...prev, item_type: e.target.value as GameItemType }))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                {ITEM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-emerald-400" />
                <span>Price (Virtual Coins)</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.price_coins}
                onChange={(e) => setForm((prev) => ({ ...prev, price_coins: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-mono font-bold text-emerald-400 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-300">Asset Graphic URL</label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={form.asset_url || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, asset_url: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-mono text-white focus:border-purple-500 focus:outline-none"
                />
                {form.asset_url && (
                  <div className="relative h-10 w-16 overflow-hidden rounded-lg border border-slate-700 flex-shrink-0">
                    <Image src={form.asset_url} alt="Asset" fill className="object-cover" unoptimized />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 md:col-span-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="is_active" className="text-xs font-bold text-white cursor-pointer">
                Active in Storefront (Players can purchase immediately)
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2 text-xs font-bold text-white hover:bg-purple-500 shadow-lg shadow-purple-600/30 transition-all"
            >
              <Save className="h-4 w-4" />
              <span>Save Item Asset</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search items by name, slug, or target game..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Filter Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="all">All Item Categories</option>
            {ITEM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-purple-400" />
            <span>Store Catalog Inventory</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {filteredItems.length} of {items.length} Active Items
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 font-mono">
            No store items found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/50 font-mono uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-3.5">Asset / Item Name</th>
                  <th className="px-6 py-3.5">Target Arena</th>
                  <th className="px-6 py-3.5">Category Type</th>
                  <th className="px-6 py-3.5">Coin Price</th>
                  <th className="px-6 py-3.5">Availability</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/90 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      {item.asset_url && (
                        <div className="relative h-12 w-12 rounded-xl border border-slate-700 overflow-hidden flex-shrink-0">
                          <Image src={item.asset_url} alt={item.name} fill className="object-cover" unoptimized />
                        </div>
                      )}
                      <div>
                        <div className="font-bold">{item.name}</div>
                        <div className="text-[11px] font-mono text-purple-400">/{item.slug}</div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-slate-400">
                      {item.game_id || 'Global Universal'}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-md px-2.5 py-1 text-[10px] font-mono font-bold uppercase border ${getTypeBadge(
                          item.item_type
                        )}`}
                      >
                        {item.item_type}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-emerald-400">
                      {item.price_coins.toLocaleString()} coins
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                          item.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {item.is_active ? 'Live In Store' : 'Archived'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setForm(item);
                            setIsEditing(true);
                          }}
                          className="rounded-lg bg-purple-950/50 border border-purple-800/40 p-2 text-purple-300 hover:bg-purple-900"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="rounded-lg bg-rose-950/50 border border-rose-800/40 p-2 text-rose-400 hover:bg-rose-900"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
