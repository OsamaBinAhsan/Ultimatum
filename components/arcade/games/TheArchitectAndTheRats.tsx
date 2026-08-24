'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Volume2,
  VolumeX,
  Trophy,
  Maximize2,
  Minimize2,
  Zap,
  Sparkles,
  Info,
  Eye,
  HelpCircle,
  Copy,
  Users,
  LogIn,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { RewardedAdModal } from '@/components/monetization/RewardedAdModal';
import { AuthModal } from '@/components/auth/AuthModal';
import confetti from 'canvas-confetti';

interface TheArchitectAndTheRatsProps {
  gameId: string;
  gameTitle: string;
  onScoreSubmitted?: (score: number) => void;
}

// ---------------------------------------------------------------------------
// Audio Synthesizer Engine (Retro 8-Bit & Mechanical Audio)
// ---------------------------------------------------------------------------
class RatMazeAudioSynth {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {}
  }

  playWallBuild() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {}
  }

  playTrapPlace() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }

  playDemolish() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }

  playSpikeHit() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {}
  }

  playSonar() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {}
  }

  playLightsOut() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch {}
  }

  playDetonation() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {}
  }

  playVictory() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.1 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.1);
        osc.stop(this.ctx.currentTime + i * 0.1 + 0.2);
      });
    } catch {}
  }

  playEmote() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }
}

const sfx = new RatMazeAudioSynth();

// ---------------------------------------------------------------------------
// Constants & Configuration
// ---------------------------------------------------------------------------
const GRID_SIZE = 20;
const TIME_ARCHITECT_PHASE = 45;
const TIME_RAT_PHASE = 60;
const TIME_SIMULTANEOUS_BUILD = 15;
const INITIAL_TOTAL_BUDGET = 1500;

const COST_WALL = 10;
const COST_SPIKE = 50;
const COST_DECOY = 100;
const COST_TRIGGER = 75;

const CELL_EMPTY = 0;
const CELL_WALL = 1;
const CELL_SPIKE = 2;
const CELL_DECOY = 3;
const CELL_TRIGGER = 4;

const RAT_RADIUS = 10;
const RAT_SPEED = 180;
const FOG_VISION_RADIUS_TILES = 3;
const SONAR_RADIUS_TILES = 12;
const SONAR_DURATION = 1.2;
const SONAR_TIME_PENALTY = 5;
const LIGHTS_OUT_DURATION = 3.0;
const TRIGGER_DETONATION_TIME = 1.5;

const RAT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const ARCHITECT_COLORS = ['#e94560', '#00f2fe'];

const RAT_SPAWN_OFFSETS = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
];

type GamePhase = 'LOBBY' | 'ARCHITECT' | 'RAT' | 'ROUNDOVER';
type ToolType = 'wall' | 'spike' | 'decoy' | 'trigger' | 'demolish';
type PlayerRole = 'Architect' | 'Rat';

interface PlayerInfo {
  id: string;
  name: string;
  role: PlayerRole;
  color: string;
  wins: number;
  isBot?: boolean;
}

interface Detonation {
  x: number;
  y: number;
  timeRemaining: number;
}

interface FloatingEmote {
  text: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

// ---------------------------------------------------------------------------
// Pathfinding BFS (Authoritative Maze Solver)
// ---------------------------------------------------------------------------
function validatePathExists(
  testGrid: number[][],
  start: { x: number; y: number },
  exit: { x: number; y: number }
): boolean {
  const queue: [number, number][] = [[start.x, start.y]];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!;
    if (cx === exit.x && cy === exit.y) return true;

    const neighbors: [number, number][] = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];
    for (const [dx, dy] of neighbors) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
        if (testGrid[ny][nx] !== CELL_WALL && testGrid[ny][nx] !== CELL_SPIKE) {
          const key = `${nx},${ny}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push([nx, ny]);
          }
        }
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function TheArchitectAndTheRatsEngine({
  gameId,
  onScoreSubmitted,
}: TheArchitectAndTheRatsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const [playMode, setPlayMode] = useState<'solo' | 'multi'>('solo');
  const [soloRoleChoice, setSoloRoleChoice] = useState<PlayerRole>('Rat');
  const [selectedGameMode] = useState<'standard' | 'simultaneous'>('standard');

  const [phase, setPhase] = useState<GamePhase>('LOBBY');
  const [myPeerId, setMyPeerId] = useState('p1-local');
  const [myRole, setMyRole] = useState<PlayerRole>('Rat');
  const [myPlayerColor] = useState(RAT_COLORS[0]);
  const [players, setPlayers] = useState<PlayerInfo[]>([
    { id: 'p1-local', name: 'Player 1 (You)', role: 'Rat', color: RAT_COLORS[0], wins: 0 },
  ]);
  const [architectIds, setArchitectIds] = useState<string[]>([]);
  const [budget, setBudget] = useState(INITIAL_TOTAL_BUDGET);
  const [selectedTool, setSelectedTool] = useState<ToolType>('wall');
  const [matchTimer, setMatchTimer] = useState(0);
  const [isSpectator, setIsSpectator] = useState(false);
  const [deathFlashVisible, setDeathFlashVisible] = useState(false);
  const [roundOverData, setRoundOverData] = useState<{
    winnerRole: PlayerRole;
    winnerName: string;
  } | null>(null);

  // Online Multiplayer State
  const [roomCode, setRoomCode] = useState('');
  const [joinInputCode, setJoinInputCode] = useState('');
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const roomCodeRef = useRef<string>('');
  roomCodeRef.current = roomCode;
  const playModeRef = useRef<'solo' | 'multi'>(playMode);
  playModeRef.current = playMode;
  const myRoleRef = useRef<PlayerRole>(myRole);
  myRoleRef.current = myRole;

  const gridRef = useRef<number[][]>(
    Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(CELL_EMPTY))
  );
  const startTile = useRef({ x: 1, y: 1 });
  const trueExitTile = useRef({ x: 18, y: 18 });
  const localRatRef = useRef({
    x: 1.5 * 40,
    y: 1.5 * 40,
    angle: 0,
    isDead: false,
    sonarActive: false,
    sonarTimer: 0,
  });
  const mySpawnPosRef = useRef({ x: 1.5 * 40, y: 1.5 * 40 });
  const remoteRatsRef = useRef<{
    [id: string]: {
      id: string;
      x: number;
      y: number;
      angle: number;
      color: string;
      isDead: boolean;
      sonarActive: boolean;
      isBot?: boolean;
    };
  }>({});
  const activeDetonationsRef = useRef<Detonation[]>([]);
  const floatingEmotesRef = useRef<FloatingEmote[]>([]);
  const lightsOutTimerRef = useRef(0);
  const lightsOutUsedThisRoundRef = useRef(false);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const isMouseDownRef = useRef(false);
  const hoverGridRef = useRef({ x: -1, y: -1 });
  const lastPlacedCellRef = useRef({ x: -1, y: -1 });

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up socket and channel on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sfx.enabled = next;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const setupEmptyGrid = useCallback(() => {
    const newGrid = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(CELL_EMPTY));
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (r === 0 || r === GRID_SIZE - 1 || c === 0 || c === GRID_SIZE - 1) {
          newGrid[r][c] = CELL_WALL;
        }
      }
    }
    gridRef.current = newGrid;
  }, []);

  const randomizeExit = useCallback(() => {
    let rx = 18;
    let ry = 18;
    while (true) {
      rx = Math.floor(2 + Math.random() * 16);
      ry = Math.floor(2 + Math.random() * 16);
      const dist = Math.abs(rx - startTile.current.x) + Math.abs(ry - startTile.current.y);
      if (dist >= 10) break;
    }
    trueExitTile.current = { x: rx, y: ry };
  }, []);

  const generateAILabyrinth = useCallback(() => {
    setupEmptyGrid();
    randomizeExit();
    const g = gridRef.current;

    for (let r = 2; r < GRID_SIZE - 2; r += 2) {
      for (let c = 2; c < GRID_SIZE - 2; c += 2) {
        if (Math.random() < 0.65) {
          const testVal = g[r][c];
          g[r][c] = CELL_WALL;
          if (!validatePathExists(g, startTile.current, trueExitTile.current)) {
            g[r][c] = testVal;
          }
        }
      }
    }

    let placedSpikes = 0;
    for (let attempts = 0; attempts < 25 && placedSpikes < 5; attempts++) {
      const rx = Math.floor(2 + Math.random() * 16);
      const ry = Math.floor(2 + Math.random() * 16);
      if (
        g[ry][rx] === CELL_EMPTY &&
        (rx !== startTile.current.x || ry !== startTile.current.y) &&
        (rx !== trueExitTile.current.x || ry !== trueExitTile.current.y)
      ) {
        g[ry][rx] = CELL_SPIKE;
        if (!validatePathExists(g, startTile.current, trueExitTile.current)) {
          g[ry][rx] = CELL_EMPTY;
        } else {
          placedSpikes++;
        }
      }
    }

    for (let attempts = 0; attempts < 10; attempts++) {
      const rx = Math.floor(2 + Math.random() * 16);
      const ry = Math.floor(2 + Math.random() * 16);
      if (
        g[ry][rx] === CELL_EMPTY &&
        (rx !== startTile.current.x || ry !== startTile.current.y) &&
        (rx !== trueExitTile.current.x || ry !== trueExitTile.current.y)
      ) {
        g[ry][rx] = CELL_DECOY;
        break;
      }
    }

    for (let attempts = 0; attempts < 10; attempts++) {
      const rx = Math.floor(2 + Math.random() * 16);
      const ry = Math.floor(2 + Math.random() * 16);
      if (
        g[ry][rx] === CELL_EMPTY &&
        (rx !== startTile.current.x || ry !== startTile.current.y) &&
        (rx !== trueExitTile.current.x || ry !== trueExitTile.current.y)
      ) {
        g[ry][rx] = CELL_TRIGGER;
        break;
      }
    }
  }, [setupEmptyGrid, randomizeExit]);

  const startArchitectPhase = useCallback(() => {
    if (playMode === 'solo' && soloRoleChoice === 'Rat') {
      generateAILabyrinth();
    } else {
      setupEmptyGrid();
      randomizeExit();
    }

    const archCount = Math.max(1, architectIds.length || 1);
    const splitBudget = Math.floor(INITIAL_TOTAL_BUDGET / archCount);
    setBudget(splitBudget);

    lightsOutUsedThisRoundRef.current = false;
    lightsOutTimerRef.current = 0;
    activeDetonationsRef.current = [];
    setIsSpectator(false);
    setDeathFlashVisible(false);

    localRatRef.current.isDead = false;
    localRatRef.current.sonarActive = false;
    localRatRef.current.sonarTimer = 0;

    const tileSize = 40;
    const newRemoteRats: typeof remoteRatsRef.current = {};
    let ratIdx = 0;

    players.forEach((p) => {
      if (p.role === 'Rat') {
        const offset = RAT_SPAWN_OFFSETS[ratIdx % RAT_SPAWN_OFFSETS.length];
        const sx = (startTile.current.x + offset.x + 0.5) * tileSize;
        const sy = (startTile.current.y + offset.y + 0.5) * tileSize;

        if (p.id === myPeerId) {
          mySpawnPosRef.current = { x: sx, y: sy };
          localRatRef.current.x = sx;
          localRatRef.current.y = sy;
        } else {
          newRemoteRats[p.id] = {
            id: p.id,
            x: sx,
            y: sy,
            angle: 0,
            color: p.color,
            isDead: false,
            sonarActive: false,
            isBot: p.isBot,
          };
        }
        ratIdx++;
      }
    });

    remoteRatsRef.current = newRemoteRats;
    setPhase('ARCHITECT');

    const duration =
      selectedGameMode === 'simultaneous' ? TIME_SIMULTANEOUS_BUILD : TIME_ARCHITECT_PHASE;
    setMatchTimer(duration);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setMatchTimer((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          startRatPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [
    playMode,
    soloRoleChoice,
    generateAILabyrinth,
    setupEmptyGrid,
    randomizeExit,
    architectIds.length,
    players,
    myPeerId,
    selectedGameMode,
  ]);

  const startRatPhase = useCallback(() => {
    if (!validatePathExists(gridRef.current, startTile.current, trueExitTile.current)) {
      for (let i = 1; i < GRID_SIZE - 1; i++) {
        gridRef.current[i][i] = CELL_EMPTY;
        gridRef.current[i][i + 1] = CELL_EMPTY;
      }
    }

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setPhase('RAT');
    setMatchTimer(TIME_RAT_PHASE);
    sfx.playWallBuild();

    // Broadcast maze layout to online room
    if (playModeRef.current === 'multi' && myRoleRef.current === 'Architect' && socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('archirat_maze_ready', {
        roomCode: roomCodeRef.current,
        grid: gridRef.current,
        trueExit: trueExitTile.current,
        startTile: startTile.current,
      });
    }

    timerIntervalRef.current = setInterval(() => {
      setMatchTimer((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          concludeRound('Architect', architectIds[0] || 'p1-local');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [architectIds]);

  const concludeRound = useCallback(
    (winnerRole: PlayerRole, winnerId: string) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setPhase('ROUNDOVER');

      let winnerName = 'Architect';
      setPlayers((prev) => {
        const updated = prev.map((p) => {
          if (p.id === winnerId || (winnerRole === 'Architect' && p.role === 'Architect')) {
            winnerName = p.name;
            return { ...p, wins: p.wins + 1 };
          }
          return p;
        });

        if (winnerRole === 'Rat') {
          return updated.map((p) => {
            if (p.id === winnerId) return { ...p, role: 'Architect' as PlayerRole, color: ARCHITECT_COLORS[0] };
            return { ...p, role: 'Rat' as PlayerRole };
          });
        }
        return updated;
      });

      setRoundOverData({ winnerRole, winnerName });

      const earned =
        winnerRole === 'Rat'
          ? Math.round(10000 + (localRatRef.current.isDead ? 0 : 5000))
          : Math.round(7500);

      if (winnerRole === 'Rat' && !localRatRef.current.isDead) {
        sfx.playVictory();
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      } else {
        sfx.playSpikeHit();
      }

      try {
        platformStore.submitScore(gameId, earned);
        if (onScoreSubmitted) onScoreSubmitted(earned);
      } catch {}

      if (playModeRef.current === 'multi' && socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('archirat_round_over', {
          roomCode: roomCodeRef.current,
          winnerRole,
          winnerName,
          nextArchitectId: winnerRole === 'Rat' ? winnerId : null,
        });
      }

      setTimeout(() => {
        startArchitectPhase();
      }, 3500);
    },
    [gameId, onScoreSubmitted, startArchitectPhase]
  );

  const eliminateRat = useCallback(
    (peerId: string) => {
      if (peerId === myPeerId) {
        localRatRef.current.isDead = true;
        setIsSpectator(true);
        setDeathFlashVisible(true);
        sfx.playSpikeHit();
        setTimeout(() => setDeathFlashVisible(false), 1200);
      }
      if (remoteRatsRef.current[peerId]) {
        remoteRatsRef.current[peerId].isDead = true;
      }

      const allRatsDead =
        (myRole !== 'Rat' || localRatRef.current.isDead) &&
        Object.values(remoteRatsRef.current).every((r) => r.isDead);

      if (allRatsDead) {
        concludeRound('Architect', architectIds[0] || 'p1-local');
      }
    },
    [myPeerId, myRole, architectIds, concludeRound]
  );

  const handleGridClick = useCallback(
    (gx: number, gy: number, isRightClick: boolean = false) => {
      if (gx <= 0 || gx >= GRID_SIZE - 1 || gy <= 0 || gy >= GRID_SIZE - 1) return;
      if (gx === startTile.current.x && gy === startTile.current.y) return;
      if (gx === trueExitTile.current.x && gy === trueExitTile.current.y) return;

      const tool = isRightClick ? 'demolish' : selectedTool;
      const currentVal = gridRef.current[gy][gx];

      if (phase === 'ARCHITECT' && myRole === 'Architect') {
        if (tool === 'demolish') {
          if (currentVal !== CELL_EMPTY) {
            let refund = COST_WALL;
            if (currentVal === CELL_SPIKE) refund = COST_SPIKE;
            if (currentVal === CELL_DECOY) refund = COST_DECOY;
            if (currentVal === CELL_TRIGGER) refund = COST_TRIGGER;
            setBudget((b) => b + refund);
            gridRef.current[gy][gx] = CELL_EMPTY;
            sfx.playDemolish();
          }
          return;
        }

        let cost = COST_WALL;
        let targetVal = CELL_WALL;
        if (tool === 'spike') {
          cost = COST_SPIKE;
          targetVal = CELL_SPIKE;
        }
        if (tool === 'decoy') {
          cost = COST_DECOY;
          targetVal = CELL_DECOY;
        }
        if (tool === 'trigger') {
          cost = COST_TRIGGER;
          targetVal = CELL_TRIGGER;
        }

        if (currentVal === targetVal || budget < cost) return;

        const cached = gridRef.current[gy][gx];
        gridRef.current[gy][gx] = targetVal;

        if (targetVal === CELL_WALL || targetVal === CELL_SPIKE) {
          if (!validatePathExists(gridRef.current, startTile.current, trueExitTile.current)) {
            gridRef.current[gy][gx] = cached;
            return;
          }
        }

        setBudget((b) => b - cost);
        if (targetVal === CELL_WALL) sfx.playWallBuild();
        else sfx.playTrapPlace();
      } else if (phase === 'RAT' && myRole === 'Architect') {
        if (gridRef.current[gy][gx] === CELL_TRIGGER) {
          const trapData = {
            x: gx,
            y: gy,
            timeRemaining: TRIGGER_DETONATION_TIME,
          };
          activeDetonationsRef.current.push(trapData);
          gridRef.current[gy][gx] = CELL_EMPTY;
          sfx.playDetonation();

          if (playModeRef.current === 'multi' && socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('archirat_trigger_trap', {
              roomCode: roomCodeRef.current,
              trapData,
            });
          }
        }
      }
    },
    [phase, myRole, selectedTool, budget]
  );

  // -------------------------------------------------------------------------
  // Connect to Socket.IO & BroadcastChannel on Room Setup
  // -------------------------------------------------------------------------
  const initSocket = useCallback(() => {
    if (socketRef.current) return socketRef.current;

    const socket = io({
      transports: ['websocket', 'polling'],
    });

    socket.on('archirat_room_created', ({ roomCode: code, playerId, players: roster }) => {
      setPlayMode('multi');
      setRoomCode(code);
      roomCodeRef.current = code;
      setMyPeerId(playerId);
      setMyRole('Architect');
      setArchitectIds([playerId]);
      setPlayers(roster || []);
      setupLocalChannel(code);
      setTimeout(() => {
        startArchitectPhase();
      }, 200);
    });

    socket.on('archirat_room_joined', ({ roomCode: code, playerId, players: roster }) => {
      setPlayMode('multi');
      setRoomCode(code);
      roomCodeRef.current = code;
      setMyPeerId(playerId);
      setMyRole('Rat');
      const arch = (roster || []).find((p: PlayerInfo) => p.role === 'Architect');
      setArchitectIds(arch ? [arch.id] : []);
      setPlayers(roster || []);
      setupLocalChannel(code);
    });

    socket.on('archirat_roster', ({ players: roster }) => {
      setPlayers(roster || []);
      const arch = (roster || []).find((p: PlayerInfo) => p.role === 'Architect');
      if (arch) setArchitectIds([arch.id]);
    });

    socket.on('archirat_phase_architect', ({ timer, players: roster }) => {
      if (roster) setPlayers(roster);
      startArchitectPhase();
    });

    socket.on('archirat_phase_rat', ({ grid, trueExit, startTile: stTile }) => {
      gridRef.current = grid;
      trueExitTile.current = trueExit;
      if (stTile) startTile.current = stTile;
      startRatPhase();
    });

    socket.on('archirat_remote_rat_move', ({ ratState }) => {
      if (ratState && ratState.id && ratState.id !== (socketRef.current?.id || myPeerId)) {
        remoteRatsRef.current[ratState.id] = {
          id: ratState.id,
          x: ratState.x,
          y: ratState.y,
          angle: ratState.angle,
          color: ratState.color || '#fbbf24',
          isDead: ratState.isDead,
          sonarActive: ratState.sonarActive,
        };
      }
    });

    socket.on('archirat_trap_detonated', (trapData) => {
      activeDetonationsRef.current.push(trapData);
      sfx.playDetonation();
    });

    socket.on('archirat_ability_triggered', ({ senderId, ability, payload }) => {
      if (ability === 'lights_out') {
        lightsOutUsedThisRoundRef.current = true;
        lightsOutTimerRef.current = LIGHTS_OUT_DURATION;
        sfx.playLightsOut();
      } else if (ability === 'sonar') {
        if (remoteRatsRef.current[senderId]) {
          remoteRatsRef.current[senderId].sonarActive = true;
        }
        sfx.playSonar();
      } else if (ability === 'emote') {
        floatingEmotesRef.current.push({
          text: payload.emote,
          x: payload.x || 400,
          y: payload.y || 400,
          life: 2.0,
          maxLife: 2.0,
        });
        sfx.playEmote();
      }
    });

    socket.on('archirat_round_ended', ({ winnerRole, winnerName, players: roster }) => {
      if (roster) setPlayers(roster);
      setRoundOverData({ winnerRole, winnerName });
      setPhase('ROUNDOVER');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setTimeout(() => {
        startArchitectPhase();
      }, 3500);
    });

    socket.on('archirat_player_left', ({ players: roster }) => {
      if (roster) setPlayers(roster);
    });

    socket.on('archirat_join_error', ({ message }) => {
      alert(message || 'Failed to join maze room.');
    });

    socketRef.current = socket;
    return socket;
  }, [startArchitectPhase, startRatPhase, myPeerId]);

  const setupLocalChannel = useCallback((code: string) => {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return;
    if (broadcastChannelRef.current) broadcastChannelRef.current.close();
    broadcastChannelRef.current = new BroadcastChannel(`archirat_${code}`);
  }, []);

  const triggerSonarAbility = useCallback(() => {
    if (myRole !== 'Rat' || phase !== 'RAT' || localRatRef.current.isDead || localRatRef.current.sonarActive)
      return;
    localRatRef.current.sonarActive = true;
    localRatRef.current.sonarTimer = SONAR_DURATION;
    setMatchTimer((prev) => Math.max(1, prev - SONAR_TIME_PENALTY));
    sfx.playSonar();

    if (playMode === 'multi' && socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('archirat_ability', {
        roomCode: roomCodeRef.current,
        ability: 'sonar',
        payload: {},
      });
    }
  }, [myRole, phase, playMode]);

  const triggerLightsOutAbility = useCallback(() => {
    if (myRole !== 'Architect' || phase !== 'RAT' || lightsOutUsedThisRoundRef.current) return;
    lightsOutUsedThisRoundRef.current = true;
    lightsOutTimerRef.current = LIGHTS_OUT_DURATION;
    sfx.playLightsOut();

    if (playMode === 'multi' && socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('archirat_ability', {
        roomCode: roomCodeRef.current,
        ability: 'lights_out',
        payload: {},
      });
    }
  }, [myRole, phase, playMode]);

  const sendTrashTalkEmote = useCallback((emote: string) => {
    let spawnX = 400;
    let spawnY = 400;
    if (localRatRef.current) {
      spawnX = localRatRef.current.x;
      spawnY = localRatRef.current.y - 15;
    }
    floatingEmotesRef.current.push({
      text: emote,
      x: spawnX,
      y: spawnY,
      life: 2.0,
      maxLife: 2.0,
    });
    sfx.playEmote();

    if (playModeRef.current === 'multi' && socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('archirat_ability', {
        roomCode: roomCodeRef.current,
        ability: 'emote',
        payload: { emote, x: spawnX, y: spawnY },
      });
    }
  }, []);

  const startSoloMatch = (role: PlayerRole) => {
    setPlayMode('solo');
    setSoloRoleChoice(role);
    setMyRole(role);
    setMyPeerId('p1-local');

    if (role === 'Architect') {
      setArchitectIds(['p1-local']);
      setPlayers([
        { id: 'p1-local', name: 'You (Architect)', role: 'Architect', color: ARCHITECT_COLORS[0], wins: 0 },
        { id: 'bot-1', name: 'Bot Blue', role: 'Rat', color: RAT_COLORS[0], wins: 0, isBot: true },
        { id: 'bot-2', name: 'Bot Green', role: 'Rat', color: RAT_COLORS[1], wins: 0, isBot: true },
        { id: 'bot-3', name: 'Bot Yellow', role: 'Rat', color: RAT_COLORS[2], wins: 0, isBot: true },
      ]);
    } else {
      setArchitectIds(['bot-arch']);
      setPlayers([
        { id: 'bot-arch', name: 'AI Architect', role: 'Architect', color: ARCHITECT_COLORS[0], wins: 0, isBot: true },
        { id: 'p1-local', name: 'You (Rat)', role: 'Rat', color: RAT_COLORS[0], wins: 0 },
        { id: 'bot-2', name: 'Rat Ally 1', role: 'Rat', color: RAT_COLORS[1], wins: 0, isBot: true },
        { id: 'bot-3', name: 'Rat Ally 2', role: 'Rat', color: RAT_COLORS[2], wins: 0, isBot: true },
      ]);
    }

    setTimeout(() => {
      startArchitectPhase();
    }, 100);
  };

  const createLobbyRoom = () => {
    sfx.playClick();
    const socket = initSocket();
    if (socket) {
      socket.emit('archirat_create_room', { playerName: 'Architect (Host)' });
    } else {
      const code = Math.random().toString(36).substring(2, 7).toUpperCase();
      setPlayMode('multi');
      setRoomCode(code);
      roomCodeRef.current = code;
      setMyRole('Architect');
      setArchitectIds(['p1-local']);
      setPlayers([
        { id: 'p1-local', name: 'Host (You)', role: 'Architect', color: ARCHITECT_COLORS[0], wins: 0 },
        { id: 'p2-guest', name: 'Player 2 (Waiting...)', role: 'Rat', color: RAT_COLORS[0], wins: 0 },
      ]);
      setupLocalChannel(code);
      setTimeout(() => {
        startArchitectPhase();
      }, 200);
    }
  };

  const joinLobbyRoom = (codeToJoin: string) => {
    sfx.playClick();
    const code = codeToJoin.trim().toUpperCase();
    if (!code) return;
    const socket = initSocket();
    if (socket) {
      socket.emit('archirat_join_room', { roomCode: code, playerName: 'Rat Guest' });
      setJoinModalOpen(false);
    } else {
      setPlayMode('multi');
      setRoomCode(code);
      roomCodeRef.current = code;
      setMyRole('Rat');
      setupLocalChannel(code);
      setJoinModalOpen(false);
      setTimeout(() => {
        startArchitectPhase();
      }, 200);
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;

      if (phase === 'ARCHITECT' && myRole === 'Architect') {
        if (k === '1') setSelectedTool('wall');
        if (k === '2') setSelectedTool('spike');
        if (k === '3') setSelectedTool('decoy');
        if (k === '4') setSelectedTool('trigger');
      }

      if (phase === 'RAT') {
        if (k === '1') sendTrashTalkEmote('💀');
        if (k === '2') sendTrashTalkEmote('🏃');
        if (k === '3') sendTrashTalkEmote('❓');
        if (k === '4') sendTrashTalkEmote('😈');
        if (k === 'f') triggerSonarAbility();
        if (k === ' ' && myRole === 'Architect') {
          e.preventDefault();
          triggerLightsOutAbility();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [phase, myRole, sendTrashTalkEmote, triggerSonarAbility, triggerLightsOutAbility]);

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tileSize = canvas.width / GRID_SIZE;

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (lightsOutTimerRef.current > 0) {
        lightsOutTimerRef.current -= dt;
      }
      for (let i = activeDetonationsRef.current.length - 1; i >= 0; i--) {
        activeDetonationsRef.current[i].timeRemaining -= dt;
        if (activeDetonationsRef.current[i].timeRemaining <= 0) {
          activeDetonationsRef.current.splice(i, 1);
        }
      }
      for (let i = floatingEmotesRef.current.length - 1; i >= 0; i--) {
        floatingEmotesRef.current[i].y -= 25 * dt;
        floatingEmotesRef.current[i].life -= dt;
        if (floatingEmotesRef.current[i].life <= 0) {
          floatingEmotesRef.current.splice(i, 1);
        }
      }

      if (phase === 'RAT' && myRole === 'Rat' && !localRatRef.current.isDead) {
        if (localRatRef.current.sonarTimer > 0) {
          localRatRef.current.sonarTimer -= dt;
          if (localRatRef.current.sonarTimer <= 0) {
            localRatRef.current.sonarActive = false;
          }
        }

        let dx = 0;
        let dy = 0;
        const keys = keysRef.current;
        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;

        if (dx !== 0 || dy !== 0) {
          localRatRef.current.angle = Math.atan2(dy, dx);
          const len = Math.hypot(dx, dy);
          const vx = (dx / len) * RAT_SPEED * dt;
          const vy = (dy / len) * RAT_SPEED * dt;

          localRatRef.current.x += vx;
          const startCX = Math.floor((localRatRef.current.x - RAT_RADIUS) / tileSize);
          const endCX = Math.floor((localRatRef.current.x + RAT_RADIUS) / tileSize);
          const startRY = Math.floor((localRatRef.current.y - RAT_RADIUS) / tileSize);
          const endRY = Math.floor((localRatRef.current.y + RAT_RADIUS) / tileSize);

          for (let r = startRY; r <= endRY; r++) {
            for (let c = startCX; c <= endCX; c++) {
              if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                if (gridRef.current[r][c] === CELL_WALL) {
                  const tileL = c * tileSize;
                  const tileR = (c + 1) * tileSize;
                  if (vx > 0) localRatRef.current.x = tileL - RAT_RADIUS;
                  else if (vx < 0) localRatRef.current.x = tileR + RAT_RADIUS;
                }
              }
            }
          }

          localRatRef.current.y += vy;
          const sCX = Math.floor((localRatRef.current.x - RAT_RADIUS) / tileSize);
          const eCX = Math.floor((localRatRef.current.x + RAT_RADIUS) / tileSize);
          const sRY = Math.floor((localRatRef.current.y - RAT_RADIUS) / tileSize);
          const eRY = Math.floor((localRatRef.current.y + RAT_RADIUS) / tileSize);

          for (let r = sRY; r <= eRY; r++) {
            for (let c = sCX; c <= eCX; c++) {
              if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                if (gridRef.current[r][c] === CELL_WALL) {
                  const tileT = r * tileSize;
                  const tileB = (r + 1) * tileSize;
                  if (vy > 0) localRatRef.current.y = tileT - RAT_RADIUS;
                  else if (vy < 0) localRatRef.current.y = tileB + RAT_RADIUS;
                }
              }
            }
          }
        }

        localRatRef.current.x = Math.max(
          tileSize + RAT_RADIUS,
          Math.min(canvas.width - tileSize - RAT_RADIUS, localRatRef.current.x)
        );
        localRatRef.current.y = Math.max(
          tileSize + RAT_RADIUS,
          Math.min(canvas.height - tileSize - RAT_RADIUS, localRatRef.current.y)
        );

        const cellX = Math.floor(localRatRef.current.x / tileSize);
        const cellY = Math.floor(localRatRef.current.y / tileSize);

        if (cellX === trueExitTile.current.x && cellY === trueExitTile.current.y) {
          concludeRound('Rat', myPeerId);
        } else if (gridRef.current[cellY] && gridRef.current[cellY][cellX] === CELL_SPIKE) {
          eliminateRat(myPeerId);
        }

        activeDetonationsRef.current.forEach((det) => {
          const detPX = (det.x + 0.5) * tileSize;
          const detPY = (det.y + 0.5) * tileSize;
          if (Math.hypot(localRatRef.current.x - detPX, localRatRef.current.y - detPY) < tileSize * 1.2) {
            eliminateRat(myPeerId);
          }
        });
      }

      if (phase === 'RAT') {
        Object.values(remoteRatsRef.current).forEach((r) => {
          if (r.isBot && !r.isDead) {
            const targetX = (trueExitTile.current.x + 0.5) * tileSize;
            const targetY = (trueExitTile.current.y + 0.5) * tileSize;
            const angle = Math.atan2(targetY - r.y, targetX - r.x) + (Math.random() - 0.5) * 0.3;
            r.angle = angle;
            const moveSpeed = RAT_SPEED * 0.7;

            const nextX = r.x + Math.cos(angle) * moveSpeed * dt;
            const nextY = r.y + Math.sin(angle) * moveSpeed * dt;
            const testCellX = Math.floor(nextX / tileSize);
            const testCellY = Math.floor(nextY / tileSize);

            if (
              testCellX >= 1 &&
              testCellX < GRID_SIZE - 1 &&
              testCellY >= 1 &&
              testCellY < GRID_SIZE - 1 &&
              gridRef.current[testCellY] &&
              gridRef.current[testCellY][testCellX] !== CELL_WALL
            ) {
              r.x = nextX;
              r.y = nextY;
            } else {
              const altAngle = angle + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);
              const altX = r.x + Math.cos(altAngle) * moveSpeed * dt;
              const altY = r.y + Math.sin(altAngle) * moveSpeed * dt;
              const altCX = Math.floor(altX / tileSize);
              const altCY = Math.floor(altY / tileSize);
              if (
                altCX >= 1 &&
                altCX < GRID_SIZE - 1 &&
                altCY >= 1 &&
                altCY < GRID_SIZE - 1 &&
                gridRef.current[altCY] &&
                gridRef.current[altCY][altCX] !== CELL_WALL
              ) {
                r.x = altX;
                r.y = altY;
              }
            }

            r.x = Math.max(tileSize + RAT_RADIUS, Math.min(canvas.width - tileSize - RAT_RADIUS, r.x));
            r.y = Math.max(tileSize + RAT_RADIUS, Math.min(canvas.height - tileSize - RAT_RADIUS, r.y));

            const bx = Math.floor(r.x / tileSize);
            const by = Math.floor(r.y / tileSize);
            if (bx === trueExitTile.current.x && by === trueExitTile.current.y) {
              concludeRound('Rat', r.id);
            } else if (gridRef.current[by] && gridRef.current[by][bx] === CELL_SPIKE) {
              r.isDead = true;
              sfx.playSpikeHit();
            }
          }
        });
      }

      // Drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0a0c16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#16213e';
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * tileSize);
        ctx.lineTo(canvas.width, i * tileSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(i * tileSize, 0);
        ctx.lineTo(i * tileSize, canvas.height);
        ctx.stroke();
      }

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const cell = gridRef.current[r][c];
          const px = c * tileSize;
          const py = r * tileSize;

          if (cell === CELL_WALL) {
            ctx.fillStyle = '#05070f';
            ctx.fillRect(px, py, tileSize, tileSize);
            ctx.strokeStyle = '#e94560';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
          } else if (cell === CELL_SPIKE) {
            ctx.fillStyle = '#e94560';
            ctx.fillRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('▲', px + tileSize / 2, py + 26);
          } else if (cell === CELL_DECOY) {
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('EXIT', px + tileSize / 2, py + 24);
          } else if (cell === CELL_TRIGGER) {
            ctx.fillStyle = '#ff0055';
            ctx.fillRect(px + 6, py + 6, tileSize - 12, tileSize - 12);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px + 6, py + 6, tileSize - 12, tileSize - 12);
          }
        }
      }

      ctx.fillStyle = '#10b981';
      ctx.fillRect(startTile.current.x * tileSize, startTile.current.y * tileSize, tileSize, tileSize);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('START', (startTile.current.x + 0.5) * tileSize, startTile.current.y * tileSize + 24);

      const pulse = 0.85 + Math.sin(time / 200) * 0.15;
      ctx.fillStyle = `rgba(251, 191, 36, ${pulse})`;
      ctx.fillRect(trueExitTile.current.x * tileSize, trueExitTile.current.y * tileSize, tileSize, tileSize);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', (trueExitTile.current.x + 0.5) * tileSize, trueExitTile.current.y * tileSize + 24);

      activeDetonationsRef.current.forEach((det) => {
        ctx.fillStyle = 'rgba(255, 0, 85, 0.75)';
        ctx.beginPath();
        ctx.arc((det.x + 0.5) * tileSize, (det.y + 0.5) * tileSize, tileSize * 1.3, 0, Math.PI * 2);
        ctx.fill();
      });

      const drawRatSprite = (x: number, y: number, angle: number, color: string) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, RAT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(-RAT_RADIUS * 0.5, -RAT_RADIUS * 0.7, 3.5, 0, Math.PI * 2);
        ctx.arc(-RAT_RADIUS * 0.5, RAT_RADIUS * 0.7, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(RAT_RADIUS * 0.4, -RAT_RADIUS * 0.3, 2, 0, Math.PI * 2);
        ctx.arc(RAT_RADIUS * 0.4, RAT_RADIUS * 0.3, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      if (phase === 'RAT' || phase === 'ROUNDOVER') {
        if (myRole === 'Rat' && !localRatRef.current.isDead) {
          drawRatSprite(localRatRef.current.x, localRatRef.current.y, localRatRef.current.angle, myPlayerColor);
        }
        Object.values(remoteRatsRef.current).forEach((r) => {
          if (!r.isDead) {
            drawRatSprite(r.x, r.y, r.angle, r.color);
          }
        });
      }

      if (phase === 'RAT' && myRole === 'Rat' && !isSpectator) {
        ctx.save();

        if (lightsOutTimerRef.current > 0) {
          ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.fillStyle = 'rgba(5, 7, 15, 0.96)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.globalCompositeOperation = 'destination-out';
          const sightRadius =
            (localRatRef.current.sonarActive ? SONAR_RADIUS_TILES : FOG_VISION_RADIUS_TILES) * tileSize;
          const grad = ctx.createRadialGradient(
            localRatRef.current.x,
            localRatRef.current.y,
            sightRadius * 0.6,
            localRatRef.current.x,
            localRatRef.current.y,
            sightRadius
          );
          grad.addColorStop(0, 'rgba(0,0,0,1.0)');
          grad.addColorStop(0.8, 'rgba(0,0,0,1.0)');
          grad.addColorStop(1, 'rgba(0,0,0,0.0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(localRatRef.current.x, localRatRef.current.y, sightRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        if (localRatRef.current.sonarActive) {
          ctx.save();
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(
            localRatRef.current.x,
            localRatRef.current.y,
            SONAR_RADIUS_TILES * tileSize * 0.95,
            0,
            Math.PI * 2
          );
          ctx.stroke();
          ctx.restore();
        }
      }

      floatingEmotesRef.current.forEach((em) => {
        ctx.save();
        ctx.font = '26px sans-serif';
        ctx.textAlign = 'center';
        ctx.globalAlpha = Math.max(0, em.life / em.maxLife);
        ctx.fillText(em.text, em.x, em.y);
        ctx.restore();
      });

      if (
        phase === 'ARCHITECT' &&
        myRole === 'Architect' &&
        hoverGridRef.current.x >= 0 &&
        hoverGridRef.current.y >= 0
      ) {
        ctx.fillStyle = 'rgba(233, 69, 96, 0.4)';
        ctx.fillRect(
          hoverGridRef.current.x * tileSize,
          hoverGridRef.current.y * tileSize,
          tileSize,
          tileSize
        );
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [phase, myRole, myPlayerColor, isSpectator, myPeerId, concludeRound, eliminateRat]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const tileSize = canvas.width / GRID_SIZE;
    const gx = Math.floor(((e.clientX - rect.left) * scaleX) / tileSize);
    const gy = Math.floor(((e.clientY - rect.top) * scaleY) / tileSize);
    hoverGridRef.current = { x: gx, y: gy };

    if (isMouseDownRef.current && phase === 'ARCHITECT' && myRole === 'Architect') {
      if (lastPlacedCellRef.current.x !== gx || lastPlacedCellRef.current.y !== gy) {
        lastPlacedCellRef.current = { x: gx, y: gy };
        handleGridClick(gx, gy, e.button === 2 || e.ctrlKey);
      }
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const tileSize = canvas.width / GRID_SIZE;
    const gx = Math.floor(((e.clientX - rect.left) * scaleX) / tileSize);
    const gy = Math.floor(((e.clientY - rect.top) * scaleY) / tileSize);

    isMouseDownRef.current = true;
    hoverGridRef.current = { x: gx, y: gy };
    lastPlacedCellRef.current = { x: gx, y: gy };
    handleGridClick(gx, gy, e.button === 2 || e.ctrlKey);
  };

  const handleCanvasMouseUp = () => {
    isMouseDownRef.current = false;
    lastPlacedCellRef.current = { x: -1, y: -1 };
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-2xl border-2 border-pink-500/40 bg-zinc-950 font-sans shadow-2xl ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none p-4 flex flex-col justify-center items-center' : ''
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex w-full items-center justify-between border-b-2 border-pink-500/40 bg-zinc-900/90 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/20 border border-pink-500/50">
            <Zap className="h-4 w-4 text-pink-400" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-pink-400 uppercase">
              Retro Asymmetrical Arcade
            </div>
            <h1 className="text-base font-black tracking-wider text-white">
              THE ARCHITECT & THE RATS
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {roomCode && (
            <div className="flex items-center gap-1.5 rounded-lg border border-pink-500/50 bg-pink-500/10 px-2.5 py-1 text-xs font-mono text-pink-300">
              <span className="text-zinc-400">ROOM:</span>
              <span className="font-bold tracking-wider text-white">{roomCode}</span>
              <button
                onClick={handleCopyLink}
                className="ml-1 p-1 hover:text-white transition-colors"
                title="Copy Room Code"
              >
                <Copy className="h-3 w-3" />
              </button>
              {copiedCode && <span className="text-[10px] text-emerald-400 font-bold">COPIED</span>}
            </div>
          )}

          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-zinc-800 bg-black/60 px-3 py-1 text-xs font-mono">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-zinc-400 uppercase font-bold">WINS:</span>
            {players.slice(0, 4).map((p) => (
              <span
                key={p.id}
                className="rounded px-1.5 py-0.5 text-[11px] font-bold"
                style={{ backgroundColor: `${p.color}25`, color: p.color }}
              >
                {p.name.slice(0, 4)}: {p.wins}
              </span>
            ))}
          </div>

          <button
            onClick={() => setRulesOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 transition-colors hover:border-pink-500 hover:text-white"
            title="How to Play"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          <button
            onClick={toggleSound}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 transition-colors hover:border-pink-500 hover:text-white"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-zinc-500" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 transition-colors hover:border-pink-500 hover:text-white"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 p-4">
        <div className="w-full lg:w-72 flex flex-col gap-3">
          <div className="rounded-xl border border-pink-500/30 bg-zinc-900/80 p-3.5 shadow-lg">
            <div className="text-[11px] font-mono font-bold tracking-widest text-zinc-400 uppercase">
              Current Phase
            </div>
            <div className="text-2xl font-black text-pink-400 tracking-wider mt-0.5">
              {phase}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-2 text-xs font-mono">
              <span className="text-zinc-400 uppercase">Time Remaining</span>
              <span className="text-xl font-bold text-white">
                {phase === 'LOBBY' ? '--' : `${matchTimer}s`}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 uppercase">Your Role</span>
              <span
                className="font-bold uppercase tracking-wider"
                style={{ color: myRole === 'Architect' ? ARCHITECT_COLORS[0] : myPlayerColor }}
              >
                {myRole}
              </span>
            </div>
          </div>

          {myRole === 'Architect' && (
            <div className="rounded-xl border border-pink-500/30 bg-zinc-900/80 p-3.5 shadow-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase">
                  Architect Budget
                </span>
                <span className="text-lg font-bold text-emerald-400 font-mono">${budget}</span>
              </div>

              {phase === 'ARCHITECT' && (
                <div className="space-y-1.5 pt-1 border-t border-zinc-800">
                  <button
                    onClick={() => setSelectedTool('wall')}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-mono font-bold transition-all ${
                      selectedTool === 'wall'
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30 border border-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-sm bg-zinc-950 border border-pink-500" />
                      <span>Wall ($10)</span>
                    </div>
                    <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px]">1</span>
                  </button>

                  <button
                    onClick={() => setSelectedTool('spike')}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-mono font-bold transition-all ${
                      selectedTool === 'spike'
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30 border border-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-sm bg-pink-600 flex items-center justify-center text-[9px]">
                        ▲
                      </span>
                      <span>Spike Trap ($50)</span>
                    </div>
                    <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px]">2</span>
                  </button>

                  <button
                    onClick={() => setSelectedTool('decoy')}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-mono font-bold transition-all ${
                      selectedTool === 'decoy'
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30 border border-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-sm bg-amber-400 text-black text-[9px] font-bold flex items-center justify-center">
                        E
                      </span>
                      <span>Decoy Exit ($100)</span>
                    </div>
                    <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px]">3</span>
                  </button>

                  <button
                    onClick={() => setSelectedTool('trigger')}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-mono font-bold transition-all ${
                      selectedTool === 'trigger'
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30 border border-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-sm bg-rose-500 border border-white" />
                      <span>Trigger Trap ($75)</span>
                    </div>
                    <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px]">4</span>
                  </button>

                  <button
                    onClick={() => setSelectedTool('demolish')}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-mono font-bold transition-all ${
                      selectedTool === 'demolish'
                        ? 'bg-zinc-700 text-white border border-zinc-400'
                        : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    <span>Demolish (Refund)</span>
                    <span className="text-[10px]">Right Click</span>
                  </button>

                  <button
                    onClick={startRatPhase}
                    className="w-full rounded-lg bg-emerald-500 py-2 text-xs font-mono font-bold text-zinc-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-all mt-2"
                  >
                    READY (LOCK MAZE)
                  </button>
                </div>
              )}

              {phase === 'RAT' && (
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <button
                    onClick={triggerLightsOutAbility}
                    disabled={lightsOutUsedThisRoundRef.current}
                    className="w-full rounded-lg border border-amber-400/50 bg-amber-500/20 py-2 text-xs font-mono font-bold text-amber-300 hover:bg-amber-500/30 transition-all disabled:opacity-40"
                  >
                    ⚡ Lights Out (3s Blind) [SPACE]
                  </button>
                  <p className="text-[11px] text-zinc-400 font-mono leading-tight">
                    Click placed Trigger Traps during this phase to remotely detonate explosive blast radius!
                  </p>
                </div>
              )}
            </div>
          )}

          {myRole === 'Rat' && (
            <div className="rounded-xl border border-pink-500/30 bg-zinc-900/80 p-3.5 shadow-lg space-y-2">
              <div className="text-[11px] font-mono font-bold text-zinc-400 uppercase">
                Rat Abilities & Controls
              </div>
              <div className="text-xs text-zinc-300 space-y-1 font-mono">
                <p>Movement: <span className="font-bold text-white">W A S D</span> or Arrows</p>
                <p>Sonar Radar: <span className="font-bold text-amber-300">F key</span> (-5s penalty)</p>
                <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                  Reach the True Gold Exit before time runs out to become the next Architect!
                </p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-pink-500/30 bg-zinc-900/80 p-3 shadow-lg">
            <div className="text-[11px] font-mono font-bold text-zinc-400 uppercase mb-2">
              Trash Talk Emotes [1-4]
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {['💀', '🏃', '❓', '😈'].map((em, idx) => (
                <button
                  key={em}
                  onClick={() => sendTrashTalkEmote(em)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 text-lg hover:border-pink-500 hover:bg-zinc-700 transition-all"
                  title={`Emote ${idx + 1}`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex-1 flex items-center justify-center rounded-xl border border-zinc-800 bg-black overflow-hidden aspect-square max-h-[72vh]">
          <canvas
            ref={canvasRef}
            width={800}
            height={800}
            onMouseMove={handleCanvasMouseMove}
            onMouseDown={handleCanvasMouseDown}
            onMouseUp={handleCanvasMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full object-contain cursor-crosshair"
          />

          {phase === 'LOBBY' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/95 p-6 text-center backdrop-blur-md">
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/40 bg-pink-500/10 px-3 py-1 text-xs font-mono font-bold text-pink-300 mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                <span>1v4 ASYMMETRICAL MULTIPLAYER</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-wider text-white">
                THE ARCHITECT & THE RATS
              </h2>
              <p className="mt-2 max-w-md text-xs text-zinc-400 leading-relaxed">
                Architects construct deadly mazes with spikes and trigger traps. Rats race in fog of war to find the True Gold Exit and steal the throne!
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-2xl">
                {/* Solo Mode */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 flex flex-col justify-between space-y-3">
                  <div className="text-left">
                    <div className="text-xs font-mono font-bold text-pink-400 uppercase">
                      Solo Arcade Mode
                    </div>
                    <div className="text-sm font-bold text-white mt-1">Play with AI Bots</div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Play as Rat escaping AI traps or Architect hunting bots.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startSoloMatch('Rat')}
                      className="flex-1 rounded-lg bg-pink-600 py-2 text-xs font-mono font-bold text-white shadow-md hover:bg-pink-500 transition-all"
                    >
                      Rat
                    </button>
                    <button
                      onClick={() => startSoloMatch('Architect')}
                      className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 py-2 text-xs font-mono font-bold text-zinc-200 hover:bg-zinc-700 transition-all"
                    >
                      Architect
                    </button>
                  </div>
                </div>

                {/* Host Online Room */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 flex flex-col justify-between space-y-3">
                  <div className="text-left">
                    <div className="text-xs font-mono font-bold text-cyan-400 uppercase">
                      Online Arena (Host)
                    </div>
                    <div className="text-sm font-bold text-white mt-1">Create Room Code</div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Host a 1v4 room for friends across multiple devices.
                    </p>
                  </div>
                  <button
                    onClick={createLobbyRoom}
                    className="w-full rounded-lg bg-cyan-600 py-2 text-xs font-mono font-bold text-white shadow-md hover:bg-cyan-500 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>HOST MAZE</span>
                  </button>
                </div>

                {/* Join Online Room */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 flex flex-col justify-between space-y-3">
                  <div className="text-left">
                    <div className="text-xs font-mono font-bold text-emerald-400 uppercase">
                      Join Room (Rat)
                    </div>
                    <div className="text-sm font-bold text-white mt-1">Enter Code</div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Enter a 4-letter room code to join an active arena.
                    </p>
                  </div>
                  <button
                    onClick={() => setJoinModalOpen(true)}
                    className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-mono font-bold text-white shadow-md hover:bg-emerald-500 transition-all flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>JOIN ROOM</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Join Room Code Modal */}
          {joinModalOpen && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl border-2 border-emerald-500/50 bg-zinc-900 p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <LogIn className="h-5 w-5" />
                  <h3 className="text-lg font-bold text-white font-mono">ENTER MAZE ROOM CODE</h3>
                </div>
                <p className="text-xs text-zinc-400 font-mono">
                  Type the 4-letter room code provided by the Architect:
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={joinInputCode}
                  onChange={(e) => setJoinInputCode(e.target.value.toUpperCase())}
                  placeholder="e.g. RATS"
                  className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-2.5 font-mono text-xl font-bold tracking-widest text-emerald-300 text-center uppercase focus:border-emerald-500 focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setJoinModalOpen(false)}
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 py-2 text-xs font-mono font-bold text-zinc-300 hover:bg-zinc-700 transition-all"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={() => joinLobbyRoom(joinInputCode)}
                    disabled={!joinInputCode.trim()}
                    className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-mono font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-md"
                  >
                    CONNECT
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === 'ARCHITECT' && myRole === 'Rat' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/95 p-6 text-center backdrop-blur-md">
              <div className="h-12 w-12 rounded-full border-2 border-pink-500 flex items-center justify-center animate-pulse mb-3">
                <Eye className="h-6 w-6 text-pink-400" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-wider">
                WAITING IN THE DARK...
              </h3>
              <p className="mt-2 max-w-sm text-xs text-zinc-400">
                The Architect is currently forging the deadly maze. Prepare your escape route!
              </p>
              <div className="mt-4 font-mono text-3xl font-bold text-pink-400">
                {matchTimer}s
              </div>
            </div>
          )}

          {phase === 'ROUNDOVER' && roundOverData && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/95 p-6 text-center backdrop-blur-md">
              <h2
                className="text-3xl sm:text-4xl font-black tracking-wider"
                style={{
                  color: roundOverData.winnerRole === 'Rat' ? '#fbbf24' : '#e94560',
                }}
              >
                {roundOverData.winnerRole === 'Rat'
                  ? `${roundOverData.winnerName.toUpperCase()} ESCAPED!`
                  : 'ARCHITECT WINS!'}
              </h2>
              <p className="mt-2 max-w-sm text-xs text-zinc-300">
                {roundOverData.winnerRole === 'Rat'
                  ? 'A new Architect has arisen and takes power for the next round!'
                  : 'All Rats were eliminated in the maze. Architect remains in power!'}
              </p>
              <div className="mt-4 text-xs font-mono text-amber-400">
                Starting next round in 3 seconds...
              </div>
            </div>
          )}

          {deathFlashVisible && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-pink-600/90 text-center animate-in fade-in zoom-in duration-200">
              <h1 className="text-5xl font-black tracking-widest text-white drop-shadow-lg">
                BUSTED!
              </h1>
              <div className="mt-2 font-mono text-sm font-bold text-zinc-200">
                ENTERING SPECTATOR MODE...
              </div>
            </div>
          )}
        </div>
      </div>

      {rulesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-pink-400" />
                <h3 className="text-base font-bold text-white">How to Play</h3>
              </div>
              <button
                onClick={() => setRulesOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed font-mono">
              <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800">
                <div className="font-bold text-pink-400 uppercase mb-1">🏗️ Architect Phase (45s)</div>
                <p>
                  Place walls ($10), lethal spikes ($50), decoy exits ($100), and trigger traps ($75). BFS algorithm guarantees a legal solvable path to the True Exit.
                </p>
              </div>

              <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800">
                <div className="font-bold text-cyan-400 uppercase mb-1">🐀 Rat Escape Phase (60s)</div>
                <p>
                  Rats race through fog of war. Press <span className="text-amber-300 font-bold">F for Sonar</span> to reveal the map (-5s time penalty). Find the True Exit to win!
                </p>
              </div>

              <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800">
                <div className="font-bold text-amber-400 uppercase mb-1">⚡ Sabotage & Traps</div>
                <p>
                  Architect can press <span className="text-amber-300 font-bold">SPACE for Lights Out</span> (3s blindness) and click trigger traps to detonate lethal explosions!
                </p>
              </div>
            </div>

            <button
              onClick={() => setRulesOpen(false)}
              className="w-full rounded-lg bg-pink-600 py-2.5 text-xs font-mono font-bold text-white hover:bg-pink-500 transition-all"
            >
              GOT IT, LET'S PLAY
            </button>
          </div>
        </div>
      )}

      {adModalOpen && (
        <RewardedAdModal
          isOpen={adModalOpen}
          onClose={() => setAdModalOpen(false)}
          onRewardEarned={() => {
            setAdModalOpen(false);
            setBudget((b) => b + 500);
          }}
          rewardDescription="Gain +$500 Architect Budget & Double XP"
        />
      )}

      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => setAuthModalOpen(false)}
        />
      )}
    </div>
  );
}
