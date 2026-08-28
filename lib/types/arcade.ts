/**
 * Universal Game Adapter Pattern for Ultimatum Platform
 * The Ultimatum Game Triad — Zero Barrier, Asymmetry & Banter, Unified Metagame
 *
 * Standardizes frontend game registration, short-code matchmaking, score submission,
 * skins, multiplayer capabilities, and juice engine telemetry for all arcade titles.
 */

// ---------------------------------------------------------------------------
// Core Metagame Types
// ---------------------------------------------------------------------------

export interface GameScoreSubmissionResult {
  rank: number;
  coinsEarned: number;
  newHighScore?: boolean;
  scoreId?: string;
  weekIdentifier?: string;
  previousHighScore?: number;
}

export interface GameSkinAsset {
  id: string;
  name: string;
  slug: string;
  itemType: 'skin' | 'powerup' | 'cosmetic' | 'badge' | 'avatar_frame' | 'consumable';
  priceCoins: number;
  assetUrl: string;
  isEquipped?: boolean;
  isOwned?: boolean;
}

// ---------------------------------------------------------------------------
// Banter & Telemetry Event System (Pillar 2: Asymmetry & Banter)
// ---------------------------------------------------------------------------

export type BanterEventCategory =
  | 'CHECK_DETECTED'      // Hyper-Chess
  | 'SABOTAGE_ALARM'      // Sabotage Circuit
  | 'ORDER_COMPLETED'     // Pixel Kitchen Rush
  | 'KILL_STREAK'         // Spacecraft Shooter / Neon Asteroid Blitz
  | 'FOG_BREACH'          // The Architect & The Rats
  | 'DUNGEON_CLEARED'     // Dungeon Loot Dash
  | 'SLICER_COMBO'        // Cyber Slicer
  | 'ABILITY_ACTIVATED'   // Hyper-Chess Ability Deck
  | 'POWER_UP_SPAWN'      // Spacecraft Shooter
  | 'SHIFT_RATED'         // Pixel Kitchen Rush
  | 'CRITICAL_HIT'        // Any game
  | 'GAME_EVENT';         // Generic fallback

export interface BanterTelemetryEvent {
  id: string;
  timestamp: number;
  category: BanterEventCategory;
  actorName: string;
  message: string;
  highlight?: boolean;  // If true: renders in accent color for maximum drama
  targetName?: string;
}

// ---------------------------------------------------------------------------
// Matchmaking & Room System (Pillar 1: Zero Barrier to Entry)
// ---------------------------------------------------------------------------

export interface GameRoom {
  code: string;          // 4-letter uppercase short code e.g. "K7WP"
  hostId: string;
  gameId: string;
  players: GameRoomPlayer[];
  maxPlayers: number;
  isStarted: boolean;
  createdAt: number;
}

export interface GameRoomPlayer {
  id: string;
  username: string;
  isHost: boolean;
  isReady: boolean;
  role?: string;         // Game-specific role assignment
}

// ---------------------------------------------------------------------------
// GameWrapper Internal Phase State
// ---------------------------------------------------------------------------

export type GamePhase =
  | 'LOBBY'       // Short-code host/join selection
  | 'WAITING'     // Room open, waiting for players
  | 'COUNTDOWN'   // 3...2...1...BEGIN
  | 'PLAYING'     // Active game viewport
  | 'RESULTS';    // Unified metagame payout screen

// ---------------------------------------------------------------------------
// Primary Config Interface (Pillar 3: Unified Metagame)
// ---------------------------------------------------------------------------

export interface UltimatumGameConfig {
  // --- Identity ---
  gameId: string;
  gameSlug: string;
  title: string;
  description?: string;
  category?: 'arcade' | 'action' | 'puzzle' | 'retro' | 'strategy' | 'chess' | 'shooter';

  // --- Cosmetics ---
  thumbnailUrl?: string;
  hasSkins: boolean;
  availableSkins?: GameSkinAsset[];

  // --- Multiplayer & Matchmaking ---
  hasMultiplayer: boolean;
  minPlayers?: number;
  maxPlayers?: number;
  shortCodeMatchmaking?: boolean;   // Enables 4-letter lobby system
  networkProtocol?: 'socket.io' | 'peerjs' | 'none';
  supportedControls?: ('keyboard' | 'mouse' | 'touch' | 'gamepad')[];

  // --- Juice & Preservation Flags ---
  hasJuiceEngine?: boolean;         // Hyper-Chess: RAF Hit-Stop + Camera Shake
  hasFogOfWar?: boolean;            // Architect & Rats: globalCompositeOperation Fog
  hasObjectPooling?: boolean;       // Spacecraft / Neon Asteroid: FastPool missiles
  hostAuthority?: boolean;          // Sabotage Circuit: strict host SLIDER_INTENT auth
  hasShiftLoop?: boolean;           // Pixel Kitchen Rush: 3-min Shift + Star Rating

  // --- Banter & Telemetry ---
  banterCategories?: BanterEventCategory[];

  /**
   * Pillar 3: Unified Metagame hook.
   * Called by GameWrapper when internal game-over logic fires.
   * Returns standardized rank + coinsEarned for the payout screen.
   */
  onScoreSubmit: (
    score: number,
    metadata?: Record<string, any>
  ) => Promise<GameScoreSubmissionResult>;
}

import { platformStore } from '@/lib/data/store';

// ---------------------------------------------------------------------------
// Standard Score Submission Helper
// ---------------------------------------------------------------------------

export async function defaultArcadeScoreSubmit(
  gameId: string,
  gameSlug: string,
  score: number,
  userId?: string,
  username?: string
): Promise<GameScoreSubmissionResult> {
  const coinsEarned = Math.max(1, Math.floor(score / 100));

  // Update in-memory platform store and dispatch real-time events immediately
  const localEntry = platformStore.submitScore(gameId, score);

  try {
    const res = await fetch('/api/leaderboards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_id: gameId, score, user_id: userId, username }),
    });
    const data = await res.json();
    const rank = data?.data?.rank ?? localEntry.rank ?? 1;

    if (userId) {
      fetch('/api/account/game-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, game_id: gameId, game_slug: gameSlug, game_title: gameId, score }),
      }).catch(() => {});
    }

    return { rank, coinsEarned, newHighScore: data?.isNewHighScore ?? true, scoreId: data?.data?.id };
  } catch {
    return { rank: localEntry.rank ?? 1, coinsEarned, newHighScore: true };
  }
}

// ---------------------------------------------------------------------------
// Global Arcade Registry — All 8 Ultimatum Titles
// ---------------------------------------------------------------------------

export const ARCADE_GAMES_REGISTRY: Record<string, UltimatumGameConfig> = {
  'neon-asteroid-blitz': {
    gameId: 'neon-asteroid-blitz',
    gameSlug: 'neon-asteroid-blitz',
    title: 'Neon Asteroid Blitz',
    description: 'High-speed vector space dogfight with particle shockwaves and laser overcharge.',
    category: 'arcade',
    hasSkins: true,
    hasMultiplayer: false,
    shortCodeMatchmaking: false,
    networkProtocol: 'none',
    hasObjectPooling: true,
    supportedControls: ['keyboard', 'touch'],
    banterCategories: ['KILL_STREAK', 'POWER_UP_SPAWN', 'CRITICAL_HIT'],
    onScoreSubmit: async (score, meta) =>
      defaultArcadeScoreSubmit('neon-asteroid-blitz', 'neon-asteroid-blitz', score, meta?.userId, meta?.username),
  },
  'cyber-slicer': {
    gameId: 'cyber-slicer',
    gameSlug: 'cyber-slicer',
    title: 'Cyber Slicer 2099',
    description: 'Fast-paced cyberpunk blade reflexes test slashing neon cubes and data packets.',
    category: 'action',
    hasSkins: true,
    hasMultiplayer: false,
    shortCodeMatchmaking: false,
    networkProtocol: 'none',
    supportedControls: ['mouse', 'touch'],
    banterCategories: ['SLICER_COMBO', 'CRITICAL_HIT'],
    onScoreSubmit: async (score, meta) =>
      defaultArcadeScoreSubmit('cyber-slicer', 'cyber-slicer', score, meta?.userId, meta?.username),
  },
  'pixel-kitchen-rush': {
    gameId: 'pixel-kitchen-rush',
    gameSlug: 'pixel-kitchen-rush',
    title: 'Pixel Kitchen Rush',
    description: 'Collaborative line-cook simulator with customer tip multipliers and cooking shifts.',
    category: 'puzzle',
    hasSkins: true,
    hasMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 4,
    shortCodeMatchmaking: true,
    networkProtocol: 'socket.io',
    hostAuthority: true,
    hasShiftLoop: true,
    supportedControls: ['keyboard', 'mouse', 'touch'],
    banterCategories: ['ORDER_COMPLETED', 'SHIFT_RATED', 'GAME_EVENT'],
    onScoreSubmit: async (score, meta) =>
      defaultArcadeScoreSubmit('pixel-kitchen-rush', 'pixel-kitchen-rush', score, meta?.userId, meta?.username),
  },
  'dungeon-loot-dash': {
    gameId: 'dungeon-loot-dash',
    gameSlug: 'dungeon-loot-dash',
    title: 'Dungeon Loot Dash',
    description: 'Procedural rogue-lite coin dash through monster traps and relic vaults.',
    category: 'retro',
    hasSkins: true,
    hasMultiplayer: false,
    shortCodeMatchmaking: false,
    networkProtocol: 'none',
    supportedControls: ['keyboard', 'touch'],
    banterCategories: ['DUNGEON_CLEARED', 'CRITICAL_HIT'],
    onScoreSubmit: async (score, meta) =>
      defaultArcadeScoreSubmit('dungeon-loot-dash', 'dungeon-loot-dash', score, meta?.userId, meta?.username),
  },
  'sabotage-circuit': {
    gameId: 'sabotage-circuit',
    gameSlug: 'sabotage-circuit',
    title: 'Sabotage Circuit',
    description: 'Overclocked microchip logic puzzle rerouting neon power grids before meltdown.',
    category: 'puzzle',
    hasSkins: false,
    hasMultiplayer: true,
    minPlayers: 2,
    maxPlayers: 2,
    shortCodeMatchmaking: true,
    networkProtocol: 'socket.io',
    hostAuthority: true,
    supportedControls: ['mouse', 'touch'],
    banterCategories: ['SABOTAGE_ALARM', 'CRITICAL_HIT', 'GAME_EVENT'],
    onScoreSubmit: async (score, meta) =>
      defaultArcadeScoreSubmit('sabotage-circuit', 'sabotage-circuit', score, meta?.userId, meta?.username),
  },
  'the-architect-and-the-rats': {
    gameId: 'the-architect-and-the-rats',
    gameSlug: 'the-architect-and-the-rats',
    title: 'The Architect & The Rats',
    description: 'MS-Paint styled tower defense trapping robotic rat swarms with cheese decoys.',
    category: 'strategy',
    hasSkins: false,
    hasMultiplayer: true,
    minPlayers: 2,
    maxPlayers: 5,
    shortCodeMatchmaking: true,
    networkProtocol: 'peerjs',
    hasFogOfWar: true,
    supportedControls: ['mouse', 'touch'],
    banterCategories: ['FOG_BREACH', 'GAME_EVENT'],
    onScoreSubmit: async (score, meta) =>
      defaultArcadeScoreSubmit('the-architect-and-the-rats', 'the-architect-and-the-rats', score, meta?.userId, meta?.username),
  },
  'hyper-chess': {
    gameId: 'hyper-chess',
    gameSlug: 'hyper-chess',
    title: 'Hyper-Chess',
    description: '60 FPS animated chess with mana, rotating ability decks, and screen-shake on check.',
    category: 'chess',
    hasSkins: true,
    hasMultiplayer: true,
    minPlayers: 2,
    maxPlayers: 2,
    shortCodeMatchmaking: true,
    networkProtocol: 'peerjs',
    hasJuiceEngine: true,
    supportedControls: ['mouse', 'touch'],
    banterCategories: ['CHECK_DETECTED', 'ABILITY_ACTIVATED', 'CRITICAL_HIT', 'GAME_EVENT'],
    onScoreSubmit: async (score, meta) =>
      defaultArcadeScoreSubmit('hyper-chess', 'hyper-chess', score, meta?.userId, meta?.username),
  },
  'spacecraft-shooter': {
    gameId: 'spacecraft-shooter',
    gameSlug: 'spacecraft-shooter',
    title: 'Spacecraft Shooter',
    description: 'Zero-GC space scrolling shooter with object-pooled missiles and dynamic viewport expansion at Level 10.',
    category: 'shooter',
    hasSkins: true,
    hasMultiplayer: false,
    shortCodeMatchmaking: false,
    networkProtocol: 'none',
    hasObjectPooling: true,
    supportedControls: ['keyboard', 'touch'],
    banterCategories: ['KILL_STREAK', 'POWER_UP_SPAWN', 'CRITICAL_HIT'],
    onScoreSubmit: async (score, meta) =>
      defaultArcadeScoreSubmit('spacecraft-shooter', 'spacecraft-shooter', score, meta?.userId, meta?.username),
  },
};

export function getArcadeGameConfig(slugOrId: string): UltimatumGameConfig | undefined {
  if (ARCADE_GAMES_REGISTRY[slugOrId]) return ARCADE_GAMES_REGISTRY[slugOrId];
  return Object.values(ARCADE_GAMES_REGISTRY).find(
    (g) => g.gameId === slugOrId || g.gameSlug === slugOrId
  );
}
