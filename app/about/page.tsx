import Image from 'next/image';
import { Sparkles, Cpu, Utensils, Gamepad2 } from 'lucide-react';

export default function AboutPage() {
  const team = [
    {
      name: 'Elena Vance',
      role: 'Editor-in-Chief & Pastry Architect',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      bio: 'Former Michelin 2-star pastry chef turned digital creator obsessed with food chemistry and baking precision.',
    },
    {
      name: 'Alex Mercer',
      role: 'Hardware Bench Lead',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      bio: 'Embedded systems engineer with 12+ years tearing down wearables, custom keyboards, and microcontrollers.',
    },
    {
      name: 'Marco Bellini',
      role: 'Culinary Director',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      bio: 'Author of artisanal pasta guides and developer of reproducible home kitchen blueprints.',
    },
    {
      name: 'Devon Wright',
      role: 'Arcade Engine Architect',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      bio: 'Retro gaming enthusiast and HTML5 canvas game designer pioneering high-FPS web experiences.',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      {/* Hero */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-mono font-bold text-cyan-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>OUR MISSION & PHILOSOPHY</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Where Gaming Culture Meets Culinary & Tech Science
        </h1>
        <p className="text-base sm:text-lg text-zinc-300 leading-relaxed">
          Ultimatum was founded on a simple belief: the web should be engaging, rewarding, and built on meticulous quality. We test every recipe in our kitchen lab and benchmark every device in our hardware cleanroom.
        </p>
      </section>

      {/* Editorial Principles */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Zero Bloat Gaming</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Our retro arcade games run instantly on 60 FPS HTML5 canvas with zero client downloads, fair weekly reset tournaments, and community rewards.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <Utensils className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Scientific Culinary Ratios</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            No fluff life stories before recipes. Every recipe features direct jump buttons, dynamic portion scaling, and verified nutritional telemetry.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Audited Hardware Labs</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            We purchase test units independently. Our reviews include full spec teardowns, thermal benchmarks, and transparent affiliate disclosures.
          </p>
        </div>
      </section>

      {/* Team Grid */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-black text-white">Meet the Editorial & Test Team</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Engineers, pastry chefs, and retro arcade developers working together.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member) => (
            <div
              key={member.name}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 text-center space-y-3 shadow-lg"
            >
              <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-2xl border border-zinc-700">
                <Image src={member.image} alt={member.name} fill className="object-cover" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">{member.name}</h4>
                <div className="text-xs text-cyan-400 font-mono">{member.role}</div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
