'use client';

import dynamic from 'next/dynamic';
import { GameLoadingFallback } from './GameLoadingFallback';

const NeonAsteroidBlitzEngine = dynamic(
  () =>
    import('./games/NeonAsteroidBlitz').then((mod) => ({
      default: mod.NeonAsteroidBlitzEngine,
    })),
  {
    ssr: false,
    loading: () => <GameLoadingFallback name="Neon Asteroid Blitz" />,
  }
);

const CyberSlicerEngine = dynamic(
  () =>
    import('./games/CyberSlicer').then((mod) => ({
      default: mod.CyberSlicerEngine,
    })),
  {
    ssr: false,
    loading: () => <GameLoadingFallback name="Cyber Slicer 2099" />,
  }
);

const PixelKitchenRushEngine = dynamic(
  () =>
    import('./games/PixelKitchenRush').then((mod) => ({
      default: mod.PixelKitchenRushEngine,
    })),
  {
    ssr: false,
    loading: () => <GameLoadingFallback name="Pixel Kitchen Rush" />,
  }
);

const DungeonLootDashEngine = dynamic(
  () =>
    import('./games/DungeonLootDash').then((mod) => ({
      default: mod.DungeonLootDashEngine,
    })),
  {
    ssr: false,
    loading: () => <GameLoadingFallback name="Dungeon Loot Dash" />,
  }
);

const SabotageCircuitEngine = dynamic(
  () =>
    import('./games/SabotageCircuit').then((mod) => ({
      default: mod.SabotageCircuitEngine,
    })),
  {
    ssr: false,
    loading: () => <GameLoadingFallback name="Sabotage Circuit" />,
  }
);

const TheArchitectAndTheRatsEngine = dynamic(
  () =>
    import('./games/TheArchitectAndTheRats').then((mod) => ({
      default: mod.TheArchitectAndTheRatsEngine,
    })),
  {
    ssr: false,
    loading: () => <GameLoadingFallback name="The Architect & The Rats" />,
  }
);

interface CanvasGameProps {
  gameId: string;
  gameTitle: string;
  gameSlug?: string;
  onScoreSubmitted?: (score: number) => void;
}

export function CanvasGame({ gameId, gameTitle, gameSlug, onScoreSubmitted }: CanvasGameProps) {
  const normalized = (gameSlug || gameTitle).toLowerCase();

  if (
    normalized.includes('architect') ||
    normalized.includes('archi-rat') ||
    normalized.includes('rats') ||
    normalized.includes('the-architect-and-the-rats')
  ) {
    return (
      <TheArchitectAndTheRatsEngine
        gameId={gameId}
        gameTitle={gameTitle}
        onScoreSubmitted={onScoreSubmitted}
      />
    );
  }

  if (normalized.includes('sabotage') || normalized.includes('circuit')) {
    return (
      <SabotageCircuitEngine
        gameId={gameId}
        gameTitle={gameTitle}
        onScoreSubmitted={onScoreSubmitted}
      />
    );
  }

  if (normalized.includes('slicer') || normalized.includes('cyber-slicer')) {
    return (
      <CyberSlicerEngine
        gameId={gameId}
        gameTitle={gameTitle}
        onScoreSubmitted={onScoreSubmitted}
      />
    );
  }

  if (normalized.includes('kitchen') || normalized.includes('pixel-kitchen')) {
    return (
      <PixelKitchenRushEngine
        gameId={gameId}
        gameTitle={gameTitle}
        onScoreSubmitted={onScoreSubmitted}
      />
    );
  }

  if (normalized.includes('dungeon') || normalized.includes('loot-dash')) {
    return (
      <DungeonLootDashEngine
        gameId={gameId}
        gameTitle={gameTitle}
        onScoreSubmitted={onScoreSubmitted}
      />
    );
  }

  // Default to Neon Asteroid Blitz
  return (
    <NeonAsteroidBlitzEngine
      gameId={gameId}
      gameTitle={gameTitle}
      onScoreSubmitted={onScoreSubmitted}
    />
  );
}
