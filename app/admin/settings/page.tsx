'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Megaphone,
  Save,
  CheckCircle,
  AlertOctagon,
  DollarSign,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { SiteSettings } from '@/lib/types';
import confetti from 'canvas-confetti';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    announcement: {
      enabled: true,
      text: '🔥 ULTIMATUM ARCADE TOURNAMENT: Double XP Weekend is LIVE!',
      link: '/games',
    },
    monetization: {
      ads_enabled: true,
      header_ad: true,
      sidebar_ad: true,
      in_content_ad: true,
      sticky_footer_ad: true,
      rewarded_ads: true,
    },
    maintenance_mode: false,
  });

  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setSettings(platformStore.getSettings());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    platformStore.updateSettings(settings);
    setFeedback('Global platform settings & ad master switches updated successfully!');
    confetti({ particleCount: 60, spread: 60 });
    setTimeout(() => setFeedback(null), 5000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
          <Settings className="w-4 h-4" />
          <span>CENTRAL CONFIGURATION</span>
        </div>
        <h1 className="text-3xl font-black text-white">Platform Settings & Ad Switches</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Master control over site-wide monetization placements, top banner announcements, and system states.
        </p>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 p-4 text-xs font-bold text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* 1. AD MONETIZATION MASTER SWITCHES */}
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Monetization & Ad Zone Master Switches</h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.monetization.ads_enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    monetization: { ...settings.monetization, ads_enabled: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-400"
              />
              <span className="text-xs font-bold text-emerald-400 font-mono uppercase">
                {settings.monetization.ads_enabled ? 'All Ads Enabled' : 'All Ads Paused'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between rounded-xl bg-zinc-950 p-4 border border-zinc-800 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-white">Header Billboard Slot</div>
                <div className="text-[11px] text-zinc-500 font-mono">970x250 / 728x90 Top Banner</div>
              </div>
              <input
                type="checkbox"
                checked={settings.monetization.header_ad}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    monetization: { ...settings.monetization, header_ad: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded text-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl bg-zinc-950 p-4 border border-zinc-800 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-white">Sidebar Half-Page Slot</div>
                <div className="text-[11px] text-zinc-500 font-mono">300x600 / 300x250 Arcade & Lab</div>
              </div>
              <input
                type="checkbox"
                checked={settings.monetization.sidebar_ad}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    monetization: { ...settings.monetization, sidebar_ad: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded text-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl bg-zinc-950 p-4 border border-zinc-800 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-white">In-Content Mid-Article Slot</div>
                <div className="text-[11px] text-zinc-500 font-mono">728x90 Recipe & Review In-Feed</div>
              </div>
              <input
                type="checkbox"
                checked={settings.monetization.in_content_ad}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    monetization: { ...settings.monetization, in_content_ad: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded text-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl bg-zinc-950 p-4 border border-zinc-800 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-white">Sticky Footer Slot</div>
                <div className="text-[11px] text-zinc-500 font-mono">728x90 Persistent Bottom Bar</div>
              </div>
              <input
                type="checkbox"
                checked={settings.monetization.sticky_footer_ad}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    monetization: { ...settings.monetization, sticky_footer_ad: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded text-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl bg-zinc-950 p-4 border border-zinc-800 cursor-pointer sm:col-span-2">
              <div>
                <div className="text-xs font-bold text-white">Rewarded Video Arcade Revival Units</div>
                <div className="text-[11px] text-zinc-500 font-mono">5s Video Stream for Extra Life / 2x XP in Canvas Game</div>
              </div>
              <input
                type="checkbox"
                checked={settings.monetization.rewarded_ads}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    monetization: { ...settings.monetization, rewarded_ads: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded text-emerald-500"
              />
            </label>
          </div>
        </section>

        {/* 2. TOP ANNOUNCEMENT BAR */}
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Top Announcement Alert Bar</h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.announcement.enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcement: { ...settings.announcement, enabled: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded text-amber-500"
              />
              <span className="text-xs font-bold text-zinc-200">Display Alert</span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                Announcement Text
              </label>
              <input
                type="text"
                value={settings.announcement.text}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcement: { ...settings.announcement, text: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                Target Link URL
              </label>
              <input
                type="text"
                value={settings.announcement.link}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcement: { ...settings.announcement, link: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* 3. MAINTENANCE MODE */}
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-400" />
              <h3 className="text-lg font-bold text-white">Maintenance Mode</h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenance_mode || false}
                onChange={(e) =>
                  setSettings({ ...settings, maintenance_mode: e.target.checked })
                }
                className="h-4 w-4 rounded text-rose-500"
              />
              <span className="text-xs font-bold text-rose-400">
                {settings.maintenance_mode ? 'ACTIVE' : 'OFF'}
              </span>
            </label>
          </div>
          <p className="text-xs text-zinc-400">
            When enabled, non-admin visitors see a branded maintenance message while you deploy new games and recipes.
          </p>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-3.5 text-sm font-bold text-zinc-950 shadow-xl shadow-emerald-500/20 hover:from-emerald-400 hover:to-cyan-400 transition-all hover:scale-105"
          >
            <Save className="w-4 h-4" />
            <span>Save & Apply Master Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
