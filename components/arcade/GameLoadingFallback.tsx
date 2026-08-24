'use client';

export function GameLoadingFallback({ name }: { name: string }) {
  return (
    <div className="relative w-full aspect-video rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center gap-5 select-none overflow-hidden shadow-2xl">
      {/* Subtle CRT Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl opacity-20"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.08) 2px, rgba(0, 255, 255, 0.08) 4px)',
        }}
      />

      {/* Cyberpunk grid backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative flex flex-col items-center gap-4 z-10">
        {/* Pixel loader grid */}
        <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-sm bg-gradient-to-tr from-cyan-500 to-purple-500 animate-pulse"
              style={{ animationDelay: `${i * 120}ms`, animationDuration: '1.2s' }}
            />
          ))}
        </div>

        <div className="text-center space-y-1">
          <div className="font-mono text-xs font-black text-cyan-400 tracking-widest uppercase">
            INITIALIZING {name}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono tracking-wider">
            STREAMING CANVAS AUDIO &amp; ENGINE ASSETS
          </div>
        </div>

        {/* Shimmer Progress bar */}
        <div className="w-48 h-1.5 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 animate-[loadbar_1.4s_ease-in-out_infinite_alternate]"
            style={{ width: '50%' }}
          />
        </div>
      </div>
    </div>
  );
}
