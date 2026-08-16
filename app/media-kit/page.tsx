'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  Users,
  Eye,
  DollarSign,
  Gamepad2,
  Utensils,
  Cpu,
  CheckCircle,
  Mail,
  Send,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MediaKitPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    budget: '$5,000 - $10,000',
    placement: 'Rewarded Video + Header Billboard',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    confetti({ particleCount: 90, spread: 75 });
  };

  const metrics = [
    {
      label: 'Monthly Pageviews',
      value: '2,840,000+',
      trend: '+24% YoY',
      icon: Eye,
      color: 'text-cyan-400',
    },
    {
      label: 'Active Monthly Gamers',
      value: '480,000+',
      trend: '8.4m Avg Session',
      icon: Gamepad2,
      color: 'text-purple-400',
    },
    {
      label: 'Kitchen & Lab Readers',
      value: '1,250,000+',
      trend: '4.8★ Avg Rating',
      icon: Utensils,
      color: 'text-amber-400',
    },
    {
      label: 'Average Direct CPM',
      value: '$48.50',
      trend: '3.4x Industry Benchmark',
      icon: DollarSign,
      color: 'text-emerald-400',
    },
  ];

  const adPackages = [
    {
      name: 'Billboard & Header Takeover',
      rate: '$3,500 / month',
      impressions: '500,000+ Guaranteed Views',
      features: [
        '970x250 Desktop Leaderboard + Mobile 320x50',
        'Top-of-site persistent placement on all pages',
        'Direct tracking dashboard with click telemetry',
        'Co-branded Announcement Bar mention',
      ],
      badge: 'HIGH VISIBILITY',
    },
    {
      name: 'Arcade Rewarded Video Partner',
      rate: '$5,000 / month',
      impressions: '100% Opt-in Video Views',
      features: [
        '5-second unskippable video ad in HTML5 arcade games',
        'Players rewarded with extra life & XP points',
        'Branded in-game sponsor billboard in starfield',
        'Extreme engagement (94% completion rate)',
      ],
      badge: 'HIGHEST CONVERSION',
      featured: true,
    },
    {
      name: 'Sponsored Lab Teardown & Recipe',
      rate: '$4,200 / package',
      impressions: 'Permanent SEO Evergreen Asset',
      features: [
        'Full lab benchmark teardown or chef recipe creation',
        'High-resolution custom photography & JSON-LD schema',
        'Permanent featured position on The Kitchen / The Lab',
        'Direct affiliate CTA button integration',
      ],
      badge: 'EVERGREEN SEO',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-8 sm:p-14 text-center">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3.5 py-1 text-xs font-mono font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>2026 OFFICIAL MEDIA KIT & SPONSORSHIP DECK</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
            Reach 2.8M+ Passionate Gamers, Chefs & Tech Makers
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed">
            Partner directly with Ultimatum to sponsor interactive casual games, Michelin-standard recipe blueprints, and authoritative hardware reviews.
          </p>
        </div>
      </section>

      {/* 1. VISUALLY STRIKING STAT COUNTERS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl space-y-3 group hover:border-zinc-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 border border-zinc-800 ${m.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="rounded-md bg-zinc-950 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-zinc-800">
                  {m.trend}
                </span>
              </div>

              <div>
                <div className="text-3xl font-black font-mono text-white group-hover:scale-105 transition-transform">
                  {m.value}
                </div>
                <div className="mt-1 text-xs font-semibold text-zinc-400">{m.label}</div>
              </div>
            </div>
          );
        })}
      </section>

      {/* 2. AUDIENCE DEMOGRAPHICS INFOGRAPHIC */}
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 sm:p-12 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              AUDIENCE TELEMETRY
            </span>
            <h2 className="text-3xl font-black text-white">Who Reads & Plays on Ultimatum?</h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Our audience is comprised of tech-savvy digital natives, enthusiastic home cooks who invest in high-end culinary gear, and gaming fans who love competitive weekly leaderboards.
            </p>

            <div className="space-y-3 pt-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-white mb-1">
                  <span>Gamers & Hardware DIY Makers (18-34)</span>
                  <span className="text-cyan-400 font-mono">54%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: '54%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-white mb-1">
                  <span>Culinary Enthusiasts & Home Foodies</span>
                  <span className="text-amber-400 font-mono">32%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '32%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-white mb-1">
                  <span>Productivity & Lifestyle Gear Consumers</span>
                  <span className="text-indigo-400 font-mono">14%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '14%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-zinc-950 p-5 border border-zinc-800 text-center">
              <div className="text-2xl font-black font-mono text-cyan-400">72%</div>
              <div className="mt-1 text-xs text-zinc-400">Household Income &gt; $85k</div>
            </div>
            <div className="rounded-2xl bg-zinc-950 p-5 border border-zinc-800 text-center">
              <div className="text-2xl font-black font-mono text-amber-400">68%</div>
              <div className="mt-1 text-xs text-zinc-400">Purchased Gear Online in 30 Days</div>
            </div>
            <div className="rounded-2xl bg-zinc-950 p-5 border border-zinc-800 text-center">
              <div className="text-2xl font-black font-mono text-purple-400">8.4 min</div>
              <div className="mt-1 text-xs text-zinc-400">Average Time on Site</div>
            </div>
            <div className="rounded-2xl bg-zinc-950 p-5 border border-zinc-800 text-center">
              <div className="text-2xl font-black font-mono text-emerald-400">92%</div>
              <div className="mt-1 text-xs text-zinc-400">Ad Block Whitelist or In-Canvas</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SPONSORSHIP PACKAGES & RATE CARD */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-white">Direct Sponsorship Packages</h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Transparent rate card with dedicated slot locking and monthly campaign reporting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {adPackages.map((pkg) => (
            <div
              key={pkg.name}
              className={`relative flex flex-col justify-between rounded-3xl border p-8 shadow-2xl transition-all ${
                pkg.featured
                  ? 'border-purple-500 bg-gradient-to-b from-purple-950/40 via-zinc-900 to-zinc-950 scale-105'
                  : 'border-zinc-800 bg-zinc-900/80'
              }`}
            >
              <div>
                <div className="inline-flex rounded-full bg-zinc-800 px-3 py-1 text-[10px] font-mono font-bold text-amber-400">
                  {pkg.badge}
                </div>
                <h3 className="mt-3 text-xl font-bold text-white">{pkg.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black font-mono text-white">{pkg.rate}</span>
                </div>
                <div className="text-xs text-cyan-400 font-mono mt-1">{pkg.impressions}</div>

                <ul className="mt-6 space-y-3 border-t border-zinc-800 pt-6 text-xs text-zinc-300">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="#sponsor-form"
                className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all ${
                  pkg.featured
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400'
                    : 'bg-zinc-800 text-white hover:bg-zinc-700'
                }`}
              >
                <span>Reserve Placement</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* 4. DIRECT SPONSORSHIP INQUIRY FORM */}
      <section
        id="sponsor-form"
        className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-8 sm:p-12 shadow-2xl max-w-3xl mx-auto"
      >
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
            <Mail className="w-4 h-4" />
            <span>START A CAMPAIGN</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white">Direct Partnership Proposal</h3>
          <p className="text-xs sm:text-sm text-zinc-400">
            Fill out the form below to lock your preferred advertising tier. Our partnerships director responds within 4 business hours.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-8 text-center space-y-3">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-white">Inquiry Received Successfully!</h4>
            <p className="text-xs text-zinc-300 max-w-md mx-auto">
              Thank you, {formData.name || 'Partner'}. Our sponsorship team will review your proposal for {formData.company || 'your brand'} and send over insertion order details promptly.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 text-xs text-emerald-400 font-bold hover:underline"
            >
              Submit Another Inquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Company / Brand</label>
                <input
                  type="text"
                  required
                  placeholder="Razer / Anker / Brand Inc."
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="partnerships@brand.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Estimated Budget</label>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  <option>$2,500 - $5,000</option>
                  <option>$5,000 - $10,000</option>
                  <option>$10,000 - $25,000</option>
                  <option>$25,000+ (Custom Multi-Channel)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Desired Placement</label>
              <select
                value={formData.placement}
                onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
              >
                <option>Rewarded Video + Header Billboard</option>
                <option>Custom Lab Teardown & Food Review</option>
                <option>Full Platform Takeover (All Slots + Email)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Campaign Objectives</label>
              <textarea
                rows={3}
                placeholder="Tell us about the product or launch date you are aiming for..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-3.5 text-sm font-bold text-zinc-950 shadow-xl shadow-amber-400/20 hover:bg-amber-300 transition-all hover:scale-[1.01]"
            >
              <Send className="w-4 h-4" />
              <span>Submit Partnership Proposal</span>
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
