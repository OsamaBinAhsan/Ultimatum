'use client';

import React from 'react';
import { NeonAsteroidBlitzEngine } from './games/NeonAsteroidBlitz';
import { CyberSlicerEngine } from './games/CyberSlicer';
import { PixelKitchenRushEngine } from './games/PixelKitchenRush';
import { DungeonLootDashEngine } from './games/DungeonLootDash';
import { SabotageCircuitEngine } from './games/SabotageCircuit';

interface CanvasGameProps {
  gameId: string;
  gameTitle: string;
  gameSlug?: string;
  onScoreSubmitted?: (score: number) => void;
}

export function CanvasGame({ gameId, gameTitle, gameSlug, onScoreSubmitted }: CanvasGameProps) {
  const normalized = (gameSlug || gameTitle).toLowerCase();

  if (normalized.includes('sabotage') || normalized.includes('circuit')) {
    return <SabotageCircuitEngine gameId={gameId} gameTitle={gameTitle} onScoreSubmitted={onScoreSubmitted} />;
  }

  if (normalized.includes('slicer') || normalized.includes('cyber-slicer')) {
    return <CyberSlicerEngine gameId={gameId} gameTitle={gameTitle} onScoreSubmitted={onScoreSubmitted} />;
  }

  if (normalized.includes('kitchen') || normalized.includes('pixel-kitchen')) {
    return <PixelKitchenRushEngine gameId={gameId} gameTitle={gameTitle} onScoreSubmitted={onScoreSubmitted} />;
  }

  if (normalized.includes('dungeon') || normalized.includes('loot-dash')) {
    return <DungeonLootDashEngine gameId={gameId} gameTitle={gameTitle} onScoreSubmitted={onScoreSubmitted} />;
  }

  // Default to Neon Asteroid Blitz
  return <NeonAsteroidBlitzEngine gameId={gameId} gameTitle={gameTitle} onScoreSubmitted={onScoreSubmitted} />;
}
