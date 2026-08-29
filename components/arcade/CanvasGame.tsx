'use client';

import dynamic from 'next/dynamic';
import { GameWrapper } from './GameWrapper';
import { GameLoadingFallback } from './GameLoadingFallback';
import { getArcadeGameConfig } from '@/lib/types/arcade';

// ---------------------------------------------------------------------------
// Dynamic Imports — all existing games (ssr: false to preserve Canvas hooks)
// ---------------------------------------------------------------------------

const NeonAsteroidBlitzEngine = dynamic(
  () =>
    import('./games/NeonAsteroidBlitz').then((mod) => ({
      default: mod.NeonAsteroidBlitzEngine,
    })),
  { ssr: false, loading: () => <GameLoadingFallback name="Neon Asteroid Blitz" /> }
);

const CyberSlicerEngine = dynamic(
  () =>
    import('./games/CyberSlicer').then((mod) => ({
      default: mod.CyberSlicerEngine,
    })),
  { ssr: false, loading: () => <GameLoadingFallback name="Cyber Slicer 2099" /> }
);

const PixelKitchenRushEngine = dynamic(
  () =>
    import('./games/PixelKitchenRush').then((mod) => ({
      default: mod.PixelKitchenRushEngine,
    })),
  { ssr: false, loading: () => <GameLoadingFallback name="Pixel Kitchen Rush" /> }
);

const DungeonLootDashEngine = dynamic(
  () =>
    import('./games/DungeonLootDash').then((mod) => ({
      default: mod.DungeonLootDashEngine,
    })),
  { ssr: false, loading: () => <GameLoadingFallback name="Dungeon Loot Dash" /> }
);

const SabotageCircuitEngine = dynamic(
  () =>
    import('./games/SabotageCircuit').then((mod) => ({
      default: mod.SabotageCircuitEngine,
    })),
  { ssr: false, loading: () => <GameLoadingFallback name="Sabotage Circuit" /> }
);

const TheArchitectAndTheRatsEngine = dynamic(
  () =>
    import('./games/TheArchitectAndTheRats').then((mod) => ({
      default: mod.TheArchitectAndTheRatsEngine,
    })),
  { ssr: false, loading: () => <GameLoadingFallback name="The Architect & The Rats" /> }
);

// NEW — Triad entries (default export)
const HyperChessEngine = dynamic(
  () => import('./games/HyperChess'),
  { ssr: false, loading: () => <GameLoadingFallback name="Hyper-Chess" /> }
);

const SpacecraftShooterEngine = dynamic(
  () => import('./games/SpacecraftShooter'),
  { ssr: false, loading: () => <GameLoadingFallback name="Spacecraft Shooter" /> }
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CanvasGameProps {
  gameId: string;
  gameTitle: string;
  gameSlug?: string;
  onScoreSubmitted?: (score: number) => void;
}

// ---------------------------------------------------------------------------
// CanvasGame — Universal Adapter with GameWrapper HOC
//
// HOW IT WORKS (Triad Integration Pattern):
//   1. Resolve the UltimatumGameConfig from the registry using gameSlug/gameId.
//   2. Wrap the game engine in <GameWrapper config={...}>.
//   3. Pass the GameWrapper's `onGameOver` and `onBanterEvent` render props
//      directly into the specific engine's props.
//   4. The engine's INTERNAL useEffect, Canvas hooks, and physics loops are
//      NEVER touched — only the game-over handler is bridged.
// ---------------------------------------------------------------------------

export function CanvasGame({ gameId, gameTitle, gameSlug, onScoreSubmitted }: CanvasGameProps) {
  const normalized = (gameSlug || gameId || gameTitle).toLowerCase();

  // --- Hyper-Chess ---
  if (normalized.includes('hyper-chess') || normalized.includes('chess')) {
    return (
      <HyperChessEngine
        gameId={gameId}
        gameTitle={gameTitle}
        onScoreSubmitted={onScoreSubmitted}
        onGameOver={(score) => {
          onScoreSubmitted?.(score);
        }}
      />
    );
  }

  // --- Spacecraft Shooter ---
  if (normalized.includes('spacecraft') || normalized.includes('shooter')) {
    const config = getArcadeGameConfig('spacecraft-shooter')!;
    return (
      <GameWrapper config={config}>
        {({ onGameOver, onBanterEvent, phase }) =>
          phase === 'PLAYING' ? (
            <SpacecraftShooterEngine
              gameId={gameId}
              gameTitle={gameTitle}
              onGameOver={onGameOver}
              onBanterEvent={onBanterEvent}
              onScoreSubmitted={onScoreSubmitted}
            />
          ) : null
        }
      </GameWrapper>
    );
  }

  // --- The Architect & The Rats ---
  if (
    normalized.includes('architect') ||
    normalized.includes('rats') ||
    normalized.includes('the-architect-and-the-rats')
  ) {
    const config = getArcadeGameConfig('the-architect-and-the-rats')!;
    return (
      <GameWrapper config={config}>
        {({ onGameOver, onBanterEvent, phase }) =>
          phase === 'PLAYING' ? (
            <TheArchitectAndTheRatsEngine
              gameId={gameId}
              gameTitle={gameTitle}
              onScoreSubmitted={(score) => {
                onGameOver(score);
                onScoreSubmitted?.(score);
              }}
            />
          ) : null
        }
      </GameWrapper>
    );
  }

  // --- Sabotage Circuit ---
  if (normalized.includes('sabotage') || normalized.includes('circuit')) {
    const config = getArcadeGameConfig('sabotage-circuit')!;
    return (
      <GameWrapper config={config}>
        {({ onGameOver, onBanterEvent, phase }) =>
          phase === 'PLAYING' ? (
            <SabotageCircuitEngine
              gameId={gameId}
              gameTitle={gameTitle}
              onScoreSubmitted={(score) => {
                onGameOver(score);
                onBanterEvent({
                  category: 'SABOTAGE_ALARM',
                  actorName: 'Operator',
                  message: `grid secured with score ${score}`,
                  highlight: true,
                });
                onScoreSubmitted?.(score);
              }}
            />
          ) : null
        }
      </GameWrapper>
    );
  }

  // --- Cyber Slicer ---
  if (normalized.includes('slicer') || normalized.includes('cyber-slicer')) {
    const config = getArcadeGameConfig('cyber-slicer')!;
    return (
      <GameWrapper config={config}>
        {({ onGameOver, onBanterEvent, phase }) =>
          phase === 'PLAYING' ? (
            <CyberSlicerEngine
              gameId={gameId}
              gameTitle={gameTitle}
              onScoreSubmitted={(score) => {
                onGameOver(score);
                onBanterEvent({ category: 'SLICER_COMBO', actorName: 'Slicer', message: `combo ended at ${score}pts`, highlight: false });
                onScoreSubmitted?.(score);
              }}
            />
          ) : null
        }
      </GameWrapper>
    );
  }

  // --- Pixel Kitchen Rush ---
  if (normalized.includes('kitchen') || normalized.includes('pixel-kitchen')) {
    const config = getArcadeGameConfig('pixel-kitchen-rush')!;
    return (
      <GameWrapper config={config}>
        {({ onGameOver, onBanterEvent, phase }) =>
          phase === 'PLAYING' ? (
            <PixelKitchenRushEngine
              gameId={gameId}
              gameTitle={gameTitle}
              onScoreSubmitted={(score) => {
                onGameOver(score);
                onBanterEvent({ category: 'SHIFT_RATED', actorName: 'Chef', message: `shift ended with ${score} tips`, highlight: true });
                onScoreSubmitted?.(score);
              }}
            />
          ) : null
        }
      </GameWrapper>
    );
  }

  // --- Dungeon Loot Dash ---
  if (normalized.includes('dungeon') || normalized.includes('loot-dash')) {
    const config = getArcadeGameConfig('dungeon-loot-dash')!;
    return (
      <GameWrapper config={config}>
        {({ onGameOver, onBanterEvent, phase }) =>
          phase === 'PLAYING' ? (
            <DungeonLootDashEngine
              gameId={gameId}
              gameTitle={gameTitle}
              onScoreSubmitted={(score) => {
                onGameOver(score);
                onBanterEvent({ category: 'DUNGEON_CLEARED', actorName: 'Adventurer', message: `loot run ended at ${score}`, highlight: false });
                onScoreSubmitted?.(score);
              }}
            />
          ) : null
        }
      </GameWrapper>
    );
  }

  // --- Neon Asteroid Blitz (default) ---
  const config = getArcadeGameConfig('neon-asteroid-blitz')!;
  return (
    <GameWrapper config={config}>
      {({ onGameOver, onBanterEvent, phase }) =>
        phase === 'PLAYING' ? (
          <NeonAsteroidBlitzEngine
            gameId={gameId}
            gameTitle={gameTitle}
            onScoreSubmitted={(score) => {
              onGameOver(score);
              onBanterEvent({ category: 'KILL_STREAK', actorName: 'Pilot', message: `blitz ended at ${score}pts`, highlight: false });
              onScoreSubmitted?.(score);
            }}
          />
        ) : null
      }
    </GameWrapper>
  );
}
