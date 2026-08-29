'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Key,
  Gift,
  Download,
  Eye,
  Shield,
  Volume2,
  Tag,
  Palette,
  ExternalLink,
  Flame,
  Clock,
  RefreshCw,
} from 'lucide-react';
import type { ShopItem, ShopCategory, ShopSlotType, ItemTier } from '@/lib/types';
import { platformStore } from '@/lib/data/store';
import { ImageUpload } from '@/components/admin/ImageUpload';

const CATEGORIES: { id: ShopCategory; label: string; icon: any; color: string }[] = [
  { id: 'GAME_LOADOUT', label: 'In-Game Loadout', icon: Gamepad2, color: 'text-purple-400 bg-purple-950/40 border-purple-500/30' },
  { id: 'PROFILE_COSMETIC', label: 'Profile Cosmetic', icon: Palette, color: 'text-pink-400 bg-pink-950/40 border-pink-500/30' },
  { id: 'SPONSORED_PERK', label: 'Sponsored Perk', icon: Gift, color: 'text-amber-400 bg-amber-950/40 border-amber-500/30' },
  { id: 'AFFILIATE_VOUCHER', label: 'Affiliate Voucher', icon: Tag, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' },
  { id: 'DIGITAL_DOWNLOAD', label: 'Digital Download', icon: Download, color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30' },
];

const SLOT_TYPES: { id: ShopSlotType; label: string }[] = [
  { id: 'VISUAL_SKIN', label: 'Visual Skin' },
  { id: 'ACTION_JUICE', label: 'Action Juice' },
  { id: 'GAME_GEAR', label: 'Game Gear' },
  { id: 'AUDIO_THEME', label: 'Audio Theme' },
  { id: 'AVATAR_FRAME', label: 'Avatar Frame' },
  { id: 'PROFILE_TITLE', label: 'Profile Title' },
];

const TIERS: ItemTier[] = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];

export default function AdminShopManagerPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [serialCodesInput, setSerialCodesInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [form, setForm] = useState<ShopItem>({
    id: '',
    name: '',
    slug: '',
    description: '',
    category: 'GAME_LOADOUT',
    target_game_id: 'pixel-kitchen-rush',
    slot_type: 'VISUAL_SKIN',
    tier: 'RARE',
    price_coins: 350,
    metadata_json: JSON.stringify({ gameId: 'pixel-kitchen-rush', stat: 'cook_speed_multiplier', value: 1.25 }, null, 2),
    stock_remaining: -1,
    is_active: true,
    is_public: true,
    asset_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
  });

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/economy/shop-items');
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch {
      setItems(platformStore.getShopItems());
    }
  };

  useEffect(() => {
    fetchItems();
    setGames(platformStore.getGames());
  }, []);

  const handleOpenCreate = () => {
    setForm({
      id: `item-${Date.now()}`,
      name: '',
      slug: '',
      description: '',
      category: 'GAME_LOADOUT',
      target_game_id: games[0]?.id || 'pixel-kitchen-rush',
      slot_type: 'VISUAL_SKIN',
      tier: 'RARE',
      price_coins: 400,
      metadata_json: JSON.stringify({ gameId: 'pixel-kitchen-rush', chefSprite: 'cyber_blue' }, null, 2),
      stock_remaining: -1,
      is_active: true,
      is_public: true,
      asset_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
    });
    setSerialCodesInput('');
    setIsEditing(true);
  };

  const handleOpenEdit = (item: ShopItem) => {
    let formattedMeta = item.metadata_json;
    try {
      if (typeof item.metadata_json === 'object') {
        formattedMeta = JSON.stringify(item.metadata_json, null, 2);
      } else {
        formattedMeta = JSON.stringify(JSON.parse(item.metadata_json), null, 2);
      }
    } catch {}

    setForm({
      ...item,
      metadata_json: formattedMeta,
    });
    setSerialCodesInput('');
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
      slug: prev.slug && prev.slug !== prev.id ? prev.slug : autoSlug,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) {
      setFeedback({ type: 'error', message: 'Item name and slug are required' });
      return;
    }

    // Validate metadata JSON
    try {
      JSON.parse(form.metadata_json);
    } catch {
      setFeedback({ type: 'error', message: 'Metadata must be valid JSON' });
      return;
    }

    const serialsArray = serialCodesInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/admin/economy/shop-items', {
        method: form.id && items.some((i) => i.id === form.id) ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: form, serialCodes: serialsArray }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: `Reward item "${form.name}" saved successfully!`,
        });
        setIsEditing(false);
        fetchItems();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to save item' });
      }
    } catch {
      platformStore.createShopItem(form);
      if (serialsArray.length > 0) {
        platformStore.addSerialsPool(form.id, serialsArray);
      }
      setIsEditing(false);
      fetchItems();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/economy/shop-items?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `Item "${name}" deleted.` });
        fetchItems();
      }
    } catch {
      platformStore.deleteShopItem(id);
      fetchItems();
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.slug.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, categoryFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const loadouts = items.filter((i) => i.category === 'GAME_LOADOUT').length;
    const sponsored = items.filter((i) => i.category === 'SPONSORED_PERK' || i.category === 'AFFILIATE_VOUCHER').length;
    const downloads = items.filter((i) => i.category === 'DIGITAL_DOWNLOAD').length;
    return { total, loadouts, sponsored, downloads };
  }, [items]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-mono font-bold text-purple-300">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>ECONOMY & REWARDS CMS</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mt-2">
            Master Shop & Rewards Manager
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Deploy in-game 4-slot loadouts, unique sponsored promo code pools, and digital perks.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-purple-600/20 hover:from-purple-500 hover:to-indigo-500 transition-all tap-target"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Reward Item</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Total Active Items</div>
          <div className="text-2xl font-black text-white font-mono mt-1">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4">
          <div className="text-[10px] font-mono font-bold text-purple-400 uppercase">4-Slot Loadouts</div>
          <div className="text-2xl font-black text-purple-300 font-mono mt-1">{stats.loadouts}</div>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4">
          <div className="text-[10px] font-mono font-bold text-amber-400 uppercase">Sponsored Perks</div>
          <div className="text-2xl font-black text-amber-300 font-mono mt-1">{stats.sponsored}</div>
        </div>
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4">
          <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase">Digital Guides</div>
          <div className="text-2xl font-black text-cyan-300 font-mono mt-1">{stats.downloads}</div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-xs font-mono ${
            feedback.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
              : 'border-red-500/40 bg-red-950/30 text-red-300'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name, slug, or tags..."
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 pl-10 pr-4 py-2.5 text-xs text-zinc-300 placeholder-zinc-600 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`rounded-xl border px-3 py-1.5 text-xs font-mono font-bold whitespace-nowrap transition-all ${
              categoryFilter === 'all'
                ? 'border-purple-500 bg-purple-950/60 text-purple-300'
                : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            All Items
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-mono font-bold whitespace-nowrap transition-all ${
                categoryFilter === cat.id
                  ? 'border-purple-500 bg-purple-950/60 text-purple-300'
                  : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-zinc-400">
            <thead className="border-b border-zinc-800 bg-zinc-900/60 text-[10px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Category / Game</th>
                <th className="px-6 py-4">Slot & Tier</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock / Serials</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-600">
                    No items found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center relative flex-shrink-0">
                          {item.asset_url ? (
                            <Image
                              src={item.asset_url}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <ShoppingBag className="h-4 w-4 text-zinc-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white tracking-tight">{item.name}</div>
                          <div className="text-[10px] text-zinc-500">{item.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="inline-block rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                          {item.category}
                        </span>
                        <div className="text-[10px] text-zinc-500">
                          {item.target_game_id || item.game_id || 'Universal'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="inline-block rounded-md border border-purple-500/30 bg-purple-950/30 px-2 py-0.5 text-[10px] text-purple-300 font-bold">
                          {item.tier}
                        </span>
                        <div className="text-[10px] text-zinc-500">{item.slot_type || '—'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-bold text-amber-400">
                        <Coins className="h-3.5 w-3.5" />
                        <span>{item.price_coins}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        {item.stock_remaining === -1 ? (
                          <span className="text-emerald-400 font-bold">∞ Unlimited</span>
                        ) : (
                          <span className="text-amber-400 font-bold">{item.stock_remaining} left</span>
                        )}
                        {item.serials_count !== undefined && item.serials_count > 0 && (
                          <div className="text-[10px] text-cyan-400">
                            🔑 {item.serials_count} serials available
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            item.is_active && item.is_public ? 'bg-emerald-400' : 'bg-zinc-600'
                          }`}
                        />
                        <span className="text-[10px]">
                          {item.is_active && item.is_public ? 'Published' : 'Hidden'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:border-zinc-700 hover:text-white transition-all"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="rounded-xl border border-red-500/20 bg-red-950/20 p-2 text-red-400 hover:border-red-500/40 hover:text-red-300 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Drawer Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/50">
              <h2 className="text-lg font-black text-white font-mono">
                {form.id && items.some((i) => i.id === form.id) ? 'Edit Reward Item' : 'Create New Reward Item'}
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Item Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Cybernetic Head Chef"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Unique Slug</label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-zinc-300 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-bold">Description</label>
                <textarea
                  rows={2}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed description shown to players on storefront..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as ShopCategory })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Target Game</label>
                  <select
                    value={form.target_game_id || ''}
                    onChange={(e) => setForm({ ...form, target_game_id: e.target.value || null, game_id: e.target.value || null })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Universal / No Game</option>
                    {games.map((g) => (
                      <option key={g.id || g.slug} value={g.slug || g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Slot Type</label>
                  <select
                    value={form.slot_type || ''}
                    onChange={(e) => setForm({ ...form, slot_type: (e.target.value as ShopSlotType) || null })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">None (Voucher / Perk / Download)</option>
                    {SLOT_TYPES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Rarity Tier</label>
                  <select
                    value={form.tier}
                    onChange={(e) => setForm({ ...form, tier: e.target.value as ItemTier })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none"
                  >
                    {TIERS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Price in Coins</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.price_coins}
                    onChange={(e) => setForm({ ...form, price_coins: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Stock Remaining (-1 = Unlimited)</label>
                  <input
                    type="number"
                    value={form.stock_remaining}
                    onChange={(e) => setForm({ ...form, stock_remaining: parseInt(e.target.value, 10) ?? -1 })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Image Upload Component */}
              <ImageUpload
                label="Reward Artwork & Thumbnail"
                value={form.asset_url || ''}
                onChange={(url) => setForm({ ...form, asset_url: url })}
                category="game"
                aspectRatio="video"
                description="Upload custom artwork or pick from gaming presets."
              />

              {/* Dynamic Metadata JSON */}
              <div>
                <label className="block text-zinc-400 mb-1 font-bold">
                  Metadata JSON Telemetry (Stats, CSS Classes, URLs)
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.metadata_json}
                  onChange={(e) => setForm({ ...form, metadata_json: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 font-mono text-cyan-300 focus:border-purple-500 focus:outline-none text-xs"
                />
              </div>

              {/* Batch Serial Codes Pool */}
              {(form.category === 'SPONSORED_PERK' || form.category === 'AFFILIATE_VOUCHER') && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2">
                  <label className="block text-amber-300 font-bold">
                    🔑 Add Single-Use Serial / Promo Codes Pool
                  </label>
                  <p className="text-[11px] text-zinc-400">
                    Paste coupon codes separated by newlines or commas. Each buyer receives a unique unused code.
                  </p>
                  <textarea
                    rows={3}
                    value={serialCodesInput}
                    onChange={(e) => setSerialCodesInput(e.target.value)}
                    placeholder="RAZER-KEY-1001&#10;RAZER-KEY-1002&#10;RAZER-KEY-1003"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Visibility Switches */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_public}
                    onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                    className="rounded border-zinc-700 bg-zinc-800 text-purple-600 focus:ring-0"
                  />
                  <span>Published on Storefront</span>
                </label>

                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded border-zinc-700 bg-zinc-800 text-purple-600 focus:ring-0"
                  />
                  <span>Active for Redemptions</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2.5 font-bold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 font-bold text-white hover:bg-purple-500 shadow-lg shadow-purple-600/30"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
