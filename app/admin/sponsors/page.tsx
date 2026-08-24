'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  CheckCircle,
  Eye,
  MousePointer,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Sponsor, AdSlotPosition } from '@/lib/types';
import confetti from 'canvas-confetti';

export default function AdminSponsorsManager() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [form, setForm] = useState<Sponsor>({
    id: '',
    sponsor_name: '',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    destination_url: 'https://example.com/sponsor-deal',
    slot_position: 'header_banner',
    impressions_tracked: 0,
    clicks_tracked: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  });

  useEffect(() => {
    setSponsors(platformStore.getSponsors());
  }, []);

  const handleOpenCreate = () => {
    setForm({
      id: 'sp-' + Date.now(),
      sponsor_name: '',
      image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
      destination_url: 'https://example.com/sponsor',
      slot_position: 'header_banner',
      impressions_tracked: 0,
      clicks_tracked: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    });
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sponsor_name || !form.destination_url) {
      alert('Please provide Sponsor Name and Destination URL');
      return;
    }

    platformStore.saveSponsor(form);
    setSponsors(platformStore.getSponsors());
    setIsEditing(false);
    setFeedback(`Sponsor campaign "${form.sponsor_name}" deployed to slot [${form.slot_position}]!`);
    confetti({ particleCount: 70, spread: 60 });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleEdit = (sp: Sponsor) => {
    setForm({ ...sp });
    setIsEditing(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the sponsor campaign "${name}"?`)) {
      platformStore.deleteSponsor(id);
      setSponsors(platformStore.getSponsors());
      setFeedback(`Sponsor "${name}" deleted.`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
            <Megaphone className="w-4 h-4" />
            <span>DIRECT ADVERTISING ENGINE</span>
          </div>
          <h1 className="text-3xl font-black text-white">Sponsor Setup & Banner Tracking</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Configure direct brand takeover banners, custom target URLs, and audited impression analytics.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Direct Sponsor Campaign</span>
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
        <div className="rounded-3xl border border-amber-500/40 bg-zinc-900/95 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="text-xl font-bold text-white">
              {form.id.startsWith('sp-') ? 'Deploy New Sponsor Campaign' : 'Edit Sponsor Banner'}
            </h3>
            <button onClick={() => setIsEditing(false)} className="text-xs text-zinc-400 hover:text-white">
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Sponsor Brand Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Razer Blade Gaming"
                  value={form.sponsor_name}
                  onChange={(e) => setForm({ ...form, sponsor_name: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Assigned Ad Slot</label>
                <select
                  value={form.slot_position}
                  onChange={(e) => setForm({ ...form, slot_position: e.target.value as AdSlotPosition })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="header_banner">Header Billboard (970x250 / 728x90)</option>
                  <option value="sidebar">Sidebar Half-Page (300x600 / 300x250)</option>
                  <option value="in_content">In-Content Mid-Article (728x90)</option>
                  <option value="footer">Sticky Footer Leaderboard (728x90)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Destination URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://brand.com/special-offer"
                  value={form.destination_url}
                  onChange={(e) => setForm({ ...form, destination_url: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Banner Image URL</label>
                <input
                  type="text"
                  required
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-300 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-400"
              />
              <span className="text-xs font-bold text-white">Campaign Active & Live</span>
            </label>

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
                className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20"
              >
                Deploy Campaign
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SPONSOR CAMPAIGNS TABLE */}
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Active Sponsor Deployments</h3>
          <span className="text-xs font-mono text-zinc-400">{sponsors.length} Campaigns</span>
        </div>

        <div className="divide-y divide-zinc-800/80">
          {sponsors.map((sp) => (
            <div
              key={sp.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-zinc-900/90 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800">
                  <Image src={sp.image_url} alt={sp.sponsor_name} fill className="object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{sp.sponsor_name}</h4>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30">
                      SLOT: {sp.slot_position.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono mt-1">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      {sp.impressions_tracked.toLocaleString()} Impressions
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MousePointer className="w-3.5 h-3.5 text-emerald-400" />
                      {sp.clicks_tracked.toLocaleString()} Clicks
                    </span>
                    <span>•</span>
                    <span className="text-amber-400">
                      CTR: {sp.impressions_tracked > 0 ? ((sp.clicks_tracked / sp.impressions_tracked) * 100).toFixed(2) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={sp.destination_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-xl bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Target URL</span>
                </a>

                <button
                  onClick={() => handleEdit(sp)}
                  className="rounded-xl bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(sp.id, sp.sponsor_name)}
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
