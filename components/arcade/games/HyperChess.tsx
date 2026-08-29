'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Zap,
  Shield,
  Clock,
  Bot,
  Globe,
  Users,
  RotateCcw,
  Sparkles,
  Play,
  Copy,
  CheckCircle,
  Radio,
  Swords,
  ChevronRight,
  ArrowLeft,
  Flame,
  Maximize2,
  Minimize2,
  HelpCircle,
  X,
  Target,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { platformStore } from '@/lib/data/store';
import { useEquippedLoadout } from '@/lib/hooks/useEquippedLoadout';
import { InGameLoadoutModal } from '@/components/arcade/InGameLoadoutModal';

interface HyperChessProps {
  gameId: string;
  gameTitle: string;
  onGameOver?: (score: number, metadata?: Record<string, any>) => void;
  onBanterEvent?: (event: any) => void;
  onScoreSubmitted?: (score: number) => void;
}

// ---------------------------------------------------------------------------
// Chess Types & Constants
// ---------------------------------------------------------------------------

type Color = 'white' | 'black';
type PieceType = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';
export type GameMode = 'hyper' | 'kinetic' | 'classic';
export type OpponentMode = 'ai' | 'global' | 'room' | 'local';

const PIECE_COOLDOWN_MS = 2400; // 2.4s cooldown per piece in Real-Time Kinetic Blitz

const ALL_ABILITIES = ['Teleport', 'EMP Shockwave', 'Freeze', 'Overcharge', 'Quantum Shield'] as const;
type Ability = typeof ALL_ABILITIES[number];

const ABILITY_COST: Record<Ability, number> = {
  Teleport: 15,
  'EMP Shockwave': 25,
  Freeze: 20,
  Overcharge: 15,
  'Quantum Shield': 15,
};

const ABILITY_DESCRIPTions: Record<Ability, string> = {
  'EMP Shockwave': 'Fires an ion pulse that disintegrates a targeted enemy piece and emits electric shockwaves.',
  Teleport: 'Quantum warps your selected piece to any open square on the board instantly.',
  Freeze: 'Freezes the enemy army in cryo-stasis, skipping their turn (or freezing their cooldowns for 3s in Blitz).',
  Overcharge: 'Channels cyber energy into your battery, instantly generating +30 Mana.',
  'Quantum Shield': 'Envelops your King in a plasma energy shield that completely absorbs the next attack.',
};

const PIECE_UNICODE: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

const PIECE_VALUES: Record<PieceType, number> = {
  P: 100,
  N: 320,
  B: 330,
  R: 500,
  Q: 900,
  K: 20000,
};

const GLOBAL_OPPONENTS = [
  { name: 'Valkyrie_99', elo: 1640, country: 'SE' },
  { name: 'CyberGrandmaster', elo: 1820, country: 'JP' },
  { name: 'TokyoDrifter', elo: 1510, country: 'KR' },
  { name: 'QuantumBishop', elo: 1730, country: 'US' },
  { name: 'NeonKnight_X', elo: 1590, country: 'DE' },
];

interface Move {
  row: number;
  col: number;
  isCapture: boolean;
}

interface ChessPiece {
  id: string;
  type: PieceType;
  color: Color;
  row: number;
  col: number;
  hasMoved?: boolean;
  isShielded?: boolean;
  cooldownUntil?: number;
  animX: number;
  animY: number;
  isMoving?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FXRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

function createPiece(id: string, type: PieceType, color: Color, row: number, col: number): ChessPiece {
  return {
    id,
    type,
    color,
    row,
    col,
    hasMoved: false,
    isShielded: false,
    cooldownUntil: 0,
    animX: col,
    animY: row,
    isMoving: false,
  };
}

function initBoard(): ChessPiece[] {
  const pieces: ChessPiece[] = [];
  const backRank: PieceType[] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  for (let c = 0; c < 8; c++) {
    pieces.push(createPiece(`b_${backRank[c]}_${c}`, backRank[c], 'black', 0, c));
    pieces.push(createPiece(`b_P_${c}`, 'P', 'black', 1, c));
    pieces.push(createPiece(`w_P_${c}`, 'P', 'white', 6, c));
    pieces.push(createPiece(`w_${backRank[c]}_${c}`, backRank[c], 'white', 7, c));
  }
  return pieces;
}

function getRawMoves(piece: ChessPiece, board: ChessPiece[]): Move[] {
  const moves: Move[] = [];
  const { row, col, color, type } = piece;
  const isOccupied = (r: number, c: number) => board.find((p) => p.row === r && p.col === c);

  if (type === 'P') {
    const dir = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;
    if (row + dir >= 0 && row + dir <= 7 && !isOccupied(row + dir, col)) {
      moves.push({ row: row + dir, col, isCapture: false });
      if (row === startRow && !isOccupied(row + 2 * dir, col)) {
        moves.push({ row: row + 2 * dir, col, isCapture: false });
      }
    }
    for (const dc of [-1, 1]) {
      const nc = col + dc;
      const nr = row + dir;
      if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
        const target = isOccupied(nr, nc);
        if (target && target.color !== color) {
          moves.push({ row: nr, col: nc, isCapture: true });
        }
      }
    }
  } else if (type === 'N') {
    const jumps = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    for (const [dr, dc] of jumps) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
        const target = isOccupied(nr, nc);
        if (!target) {
          moves.push({ row: nr, col: nc, isCapture: false });
        } else if (target.color !== color) {
          moves.push({ row: nr, col: nc, isCapture: true });
        }
      }
    }
  } else if (type === 'B' || type === 'R' || type === 'Q') {
    const dirs: number[][] = [];
    if (type === 'B' || type === 'Q') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    if (type === 'R' || type === 'Q') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);

    for (const [dr, dc] of dirs) {
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
        const target = isOccupied(r, c);
        if (!target) {
          moves.push({ row: r, col: c, isCapture: false });
        } else {
          if (target.color !== color) {
            moves.push({ row: r, col: c, isCapture: true });
          }
          break;
        }
        r += dr;
        c += dc;
      }
    }
  } else if (type === 'K') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
          const target = isOccupied(nr, nc);
          if (!target) {
            moves.push({ row: nr, col: nc, isCapture: false });
          } else if (target.color !== color) {
            moves.push({ row: nr, col: nc, isCapture: true });
          }
        }
      }
    }
  }
  return moves;
}

function isSquareAttacked(r: number, c: number, byColor: Color, board: ChessPiece[]): boolean {
  const attackers = board.filter((p) => p.color === byColor);
  for (const attacker of attackers) {
    const rawMoves = getRawMoves(attacker, board);
    if (rawMoves.some((m) => m.row === r && m.col === c)) {
      return true;
    }
  }
  return false;
}

function isKingInCheck(color: Color, board: ChessPiece[]): boolean {
  const king = board.find((p) => p.color === color && p.type === 'K');
  if (!king) return false;
  const enemyColor = color === 'white' ? 'black' : 'white';
  return isSquareAttacked(king.row, king.col, enemyColor, board);
}

function getLegalMoves(piece: ChessPiece, board: ChessPiece[], isRealTimeKinetic = false): Move[] {
  const rawMoves = getRawMoves(piece, board);
  if (isRealTimeKinetic) {
    return rawMoves;
  }
  return rawMoves.filter((m) => {
    const nextBoard = board
      .filter((p) => !(p.row === m.row && p.col === m.col))
      .map((p) => (p.id === piece.id ? { ...p, row: m.row, col: m.col } : p));
    return !isKingInCheck(piece.color, nextBoard);
  });
}

function getAllLegalMoves(color: Color, board: ChessPiece[], isRealTimeKinetic = false): { piece: ChessPiece; moves: Move[] }[] {
  const now = Date.now();
  const pieces = board.filter((p) => p.color === color && (!isRealTimeKinetic || !p.cooldownUntil || p.cooldownUntil <= now));
  return pieces.map((p) => ({ piece: p, moves: getLegalMoves(p, board, isRealTimeKinetic) })).filter((pm) => pm.moves.length > 0);
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function HyperChess({ gameId, gameTitle, onGameOver, onBanterEvent, onScoreSubmitted }: HyperChessProps) {
  const mainWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const boardSizeRef = useRef<number>(440);

  // Lobby & Setup States
  const [inLobby, setInLobby] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>('kinetic');
  const [opponentMode, setOpponentMode] = useState<OpponentMode>('ai');
  const [roomCode, setRoomCode] = useState<string>('');
  const [inputRoomCode, setInputRoomCode] = useState<string>('');
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchmakingProgress, setMatchmakingProgress] = useState(0);
  const [matchedPlayer, setMatchedPlayer] = useState<typeof GLOBAL_OPPONENTS[0] | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHyperLoadoutOpen, setIsHyperLoadoutOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Equipped Cosmetic Loadout (Shop Visual Skin + Game Gear integration)
  // ---------------------------------------------------------------------------
  const _hcLoadout = platformStore.getLoadout(platformStore.getCurrentUser()?.id || 'user-001', 'hyper-chess');
  const _boardDark = _hcLoadout?.visualSkin?.boardDark || '#1e293b';
  const _boardLight = _hcLoadout?.visualSkin?.boardLight || '#e2e8f0';
  const _coreSkinColor = _hcLoadout?.visualSkin?.coreColor || '#a855f7';
  const _coreManaBonus = (_hcLoadout?.gameGear?.core_mana_bonus || 0);


  const [showHelpModal, setShowHelpModal] = useState(false);
  const [empTargeting, setEmpTargeting] = useState(false);

  // In-Game Refs & States (Supports Independent Multi-Touch Selection per Player)
  const piecesRef = useRef<ChessPiece[]>(initBoard());
  const selectedWhiteRef = useRef<ChessPiece | null>(null);
  const selectedBlackRef = useRef<ChessPiece | null>(null);
  const possibleMovesWhiteRef = useRef<Move[]>([]);
  const possibleMovesBlackRef = useRef<Move[]>([]);
  const turnRef = useRef<Color>('white');
  const manaRef = useRef<{ white: number; black: number }>({ white: 20, black: 20 });
  const capturedRef = useRef<{ white: ChessPiece[]; black: ChessPiece[] }>({ white: [], black: [] });
  const checkRef = useRef<Color | null>(null);
  const frozenColorRef = useRef<Color | null>(null);
  const frozenTurnsRef = useRef(0);
  const abilityDeckRef = useRef<[Ability, Ability]>(['EMP Shockwave', 'Teleport']);
  const abilityIdxRef = useRef(2);
  const particlesRef = useRef<Particle[]>([]);
  const fxRingsRef = useRef<FXRing[]>([]);
  const shakeFramesRef = useRef(0);
  const shakeMagRef = useRef(0);
  const hitStopFramesRef = useRef(0);
  const gameOverRef = useRef(false);
  const comboCountRef = useRef(0);
  const lastMoveTimeRef = useRef(Date.now());
  const gameScoreRef = useRef(0);

  const [displayTurn, setDisplayTurn] = useState<Color>('white');
  const [displayMana, setDisplayMana] = useState({ white: 20, black: 20 });
  const [displayDeck, setDisplayDeck] = useState<[Ability, Ability]>(['EMP Shockwave', 'Teleport']);
  const [displayCheck, setDisplayCheck] = useState<Color | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<Color | 'draw' | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('⚡ REAL-TIME BLITZ: Both sides play simultaneously! Move your pieces rapidly!');

  const user = platformStore.getCurrentUser();

  // -------------------------------------------------------------------------
  // Toggle Fullscreen Arena
  // -------------------------------------------------------------------------
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (mainWrapperRef.current?.requestFullscreen) {
        mainWrapperRef.current.requestFullscreen().catch(() => {});
      } else if ((mainWrapperRef.current as any)?.webkitRequestFullscreen) {
        (mainWrapperRef.current as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Restart Game
  // -------------------------------------------------------------------------
  const restartGame = useCallback(() => {
    piecesRef.current = initBoard();
    selectedWhiteRef.current = null;
    selectedBlackRef.current = null;
    possibleMovesWhiteRef.current = [];
    possibleMovesBlackRef.current = [];
    turnRef.current = 'white';
    manaRef.current = { white: 20, black: 20 };
    capturedRef.current = { white: [], black: [] };
    checkRef.current = null;
    frozenColorRef.current = null;
    frozenTurnsRef.current = 0;
    abilityDeckRef.current = ['EMP Shockwave', 'Teleport'];
    abilityIdxRef.current = 2;
    particlesRef.current = [];
    fxRingsRef.current = [];
    gameOverRef.current = false;
    comboCountRef.current = 0;
    gameScoreRef.current = 0;
    setEmpTargeting(false);

    setDisplayTurn('white');
    setDisplayMana({ white: 20, black: 20 });
    setDisplayDeck(['EMP Shockwave', 'Teleport']);
    setDisplayCheck(null);
    setIsGameOver(false);
    setWinner(null);
    setStatusMessage(
      gameMode === 'kinetic'
        ? '⚡ REAL-TIME BLITZ ACTIVE! Both players move simultaneously! 2.4s timeouts.'
        : gameMode === 'hyper'
        ? '⚡ HYPER MODE: Control center zone for mana! White to move.'
        : '🛡 CLASSIC MODE: Official tournament chess. White to move.'
    );
  }, [gameMode]);

  // -------------------------------------------------------------------------
  // Launch Game Handler (From Lobby)
  // -------------------------------------------------------------------------
  const handleLaunchGame = (mode: GameMode, opponent: OpponentMode) => {
    setGameMode(mode);
    setOpponentMode(opponent);

    if (opponent === 'global') {
      setIsMatchmaking(true);
      setMatchmakingProgress(10);
      const interval = setInterval(() => {
        setMatchmakingProgress((p) => {
          if (p >= 90) {
            clearInterval(interval);
            const randomOpp = GLOBAL_OPPONENTS[Math.floor(Math.random() * GLOBAL_OPPONENTS.length)];
            setMatchedPlayer(randomOpp);
            setTimeout(() => {
              setIsMatchmaking(false);
              setInLobby(false);
              restartGame();
            }, 1000);
            return 100;
          }
          return p + 30;
        });
      }, 350);
      return;
    }

    if (opponent === 'room' && !roomCode) {
      const code = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
      setRoomCode(code);
      return;
    }

    setInLobby(false);
    restartGame();
  };

  // -------------------------------------------------------------------------
  // Particle & FX Helpers
  // -------------------------------------------------------------------------
  const spawnParticles = (x: number, y: number, color: string, count = 20) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 3,
        alpha: 1,
        life: 0,
        maxLife: 20 + Math.random() * 20,
      });
    }
  };

  const spawnFXRing = (x: number, y: number, color: string, maxRadius = 80) => {
    fxRingsRef.current.push({
      x,
      y,
      radius: 5,
      maxRadius,
      color,
      alpha: 1,
      lineWidth: 3,
    });
  };

  // -------------------------------------------------------------------------
  // Ability Trigger & Deck Rotation
  // -------------------------------------------------------------------------
  const rotateDeck = useCallback(() => {
    const nextAbility = ALL_ABILITIES[abilityIdxRef.current % ALL_ABILITIES.length];
    abilityIdxRef.current++;
    const newDeck: [Ability, Ability] = [abilityDeckRef.current[1], nextAbility];
    abilityDeckRef.current = newDeck;
    setDisplayDeck([...newDeck]);
  }, []);

  const useAbility = useCallback((ability: Ability) => {
    if (gameOverRef.current) return;
    const cost = ABILITY_COST[ability];
    const color = turnRef.current;
    if (manaRef.current[color] < cost) return;

    const W = boardSizeRef.current;
    const cx = W / 2;
    const cy = W / 2;

    if (ability === 'EMP Shockwave') {
      // Tactical EMP Detonation: Destroys highest value active non-king enemy unit with lightning strike
      const enemies = piecesRef.current
        .filter((p) => p.color !== color && p.type !== 'K')
        .sort((a, b) => PIECE_VALUES[b.type] - PIECE_VALUES[a.type]);

      if (enemies.length > 0) {
        manaRef.current[color] -= cost;
        setDisplayMana({ ...manaRef.current });

        const victim = enemies[0];
        piecesRef.current = piecesRef.current.filter((p) => p.id !== victim.id);
        capturedRef.current[color].push(victim);

        const BOARD_SIZE = W - 10;
        const CELL = BOARD_SIZE / 8;
        const vx = (W - BOARD_SIZE) / 2 + victim.col * CELL + CELL / 2;
        const vy = 5 + victim.row * CELL + CELL / 2;

        spawnParticles(vx, vy, '#a855f7', 45);
        spawnParticles(vx, vy, '#06b6d4', 30);
        spawnFXRing(vx, vy, '#ec4899', 140);
        shakeFramesRef.current = 14;
        shakeMagRef.current = 8;
        setStatusMessage(`⚡ EMP SHOCKWAVE: Struck and disintegrated ${victim.color} ${victim.type}!`);
      } else {
        setStatusMessage(`No valid enemy units to target with EMP!`);
        return;
      }
    } else if (ability === 'Freeze') {
      manaRef.current[color] -= cost;
      setDisplayMana({ ...manaRef.current });
      frozenColorRef.current = color === 'white' ? 'black' : 'white';
      frozenTurnsRef.current = 1;

      // In Kinetic Blitz, freeze enemy cooldowns for 3s
      if (gameMode === 'kinetic') {
        const now = Date.now();
        piecesRef.current.forEach((p) => {
          if (p.color !== color) p.cooldownUntil = now + 3000;
        });
      }

      spawnParticles(cx, cy, '#38bdf8', 40);
      spawnFXRing(cx, cy, '#38bdf8', 150);
      shakeFramesRef.current = 8;
      shakeMagRef.current = 5;
      setStatusMessage(`❄ CRYO-FREEZE: Enemy army is frozen in stasis!`);
    } else if (ability === 'Overcharge') {
      manaRef.current[color] = Math.min(100, manaRef.current[color] - cost + 30);
      setDisplayMana({ ...manaRef.current });
      spawnParticles(cx, cy, '#f59e0b', 35);
      setStatusMessage(`⚡ OVERCHARGE: Generated +30 Mana surge!`);
    } else if (ability === 'Quantum Shield') {
      manaRef.current[color] -= cost;
      setDisplayMana({ ...manaRef.current });
      const myKing = piecesRef.current.find((p) => p.color === color && p.type === 'K');
      if (myKing) myKing.isShielded = true;
      spawnParticles(cx, cy, '#10b981', 30);
      setStatusMessage(`🛡 QUANTUM SHIELD: King is protected against the next attack!`);
    } else if (ability === 'Teleport') {
      const activeSelected = color === 'white' ? selectedWhiteRef.current : selectedBlackRef.current;
      if (activeSelected && activeSelected.color === color) {
        manaRef.current[color] -= cost;
        setDisplayMana({ ...manaRef.current });
        const occupied = new Set(piecesRef.current.map((p) => `${p.row},${p.col}`));
        const empties: { r: number; c: number }[] = [];
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (!occupied.has(`${r},${c}`)) empties.push({ r, c });
          }
        }
        if (empties.length > 0) {
          const target = empties[Math.floor(Math.random() * empties.length)];
          activeSelected.row = target.r;
          activeSelected.col = target.c;
          activeSelected.animX = target.c;
          activeSelected.animY = target.r;
          activeSelected.cooldownUntil = Date.now() + PIECE_COOLDOWN_MS;
          spawnParticles(cx, cy, '#06b6d4', 35);
          setStatusMessage(`🌀 TELEPORT: Warped ${activeSelected.type} to [${target.r}, ${target.c}]!`);
        }
      } else {
        setStatusMessage(`Click any of your pieces first to Teleport it!`);
        return;
      }
    }

    onBanterEvent?.({
      category: 'ABILITY_ACTIVATED',
      actorName: user?.username || color,
      message: `activated ${ability}!`,
      highlight: true,
    });

    rotateDeck();
  }, [gameMode, onBanterEvent, rotateDeck, user]);

  // -------------------------------------------------------------------------
  // Core Mana Zone (+5 on Center 4 squares)
  // -------------------------------------------------------------------------
  const addCoreMana = useCallback(() => {
    // Apply gear-hc-core-capacitor bonus mana per center control square occupied
    const centerSquares = [{ r: 3, c: 3 }, { r: 3, c: 4 }, { r: 4, c: 3 }, { r: 4, c: 4 }];
    let wGain = 0;
    let bGain = 0;
    piecesRef.current.forEach((p) => {
      if (centerSquares.some((s) => s.r === p.row && s.c === p.col)) {
        if (p.color === 'white') wGain += 5;
        else bGain += 5;
      }
    });
    manaRef.current.white = Math.min(100, manaRef.current.white + wGain + 2);
    manaRef.current.black = Math.min(100, manaRef.current.black + bGain + 2);
    setDisplayMana({ ...manaRef.current });
  }, []);

  // -------------------------------------------------------------------------
  // Execute Move (Supports both Turn-Based & Real-Time Cooldown Simultaneous Blitz)
  // -------------------------------------------------------------------------
  const executeMove = useCallback((piece: ChessPiece, targetRow: number, targetCol: number) => {
    const isKineticBlitz = gameMode === 'kinetic';
    const now = Date.now();

    if (isKineticBlitz && piece.cooldownUntil && piece.cooldownUntil > now) {
      return;
    }

    const targetPiece = piecesRef.current.find((p) => p.row === targetRow && p.col === targetCol);
    const W = boardSizeRef.current;
    const BOARD_SIZE = W - 10;
    const CELL = BOARD_SIZE / 8;
    const BOARD_X = (W - BOARD_SIZE) / 2;
    const BOARD_Y = 5;

    // Capture handling
    if (targetPiece) {
      if (targetPiece.isShielded) {
        targetPiece.isShielded = false;
        setStatusMessage(`🛡 Quantum Shield absorbed the attack!`);
      } else {
        // King Capture in Real-Time Kinetic Blitz
        if (isKineticBlitz && targetPiece.type === 'K') {
          piecesRef.current = piecesRef.current.filter((p) => p.id !== targetPiece.id);
          capturedRef.current[piece.color].push(targetPiece);
          gameOverRef.current = true;
          setIsGameOver(true);
          setWinner(piece.color);
          const finalScore = 2000 + comboCountRef.current * 150;
          onGameOver?.(finalScore, { winner: piece.color, gameMode, opponentMode });
          onScoreSubmitted?.(finalScore);
          confetti({ particleCount: 120, spread: 80 });
          setStatusMessage(`👑 KING CAPTURED! ${piece.color.toUpperCase()} WINS THE BLITZ!`);
          return;
        }

        piecesRef.current = piecesRef.current.filter((p) => p.id !== targetPiece.id);
        capturedRef.current[piece.color].push(targetPiece);
        hitStopFramesRef.current = 4;
        shakeFramesRef.current = 8;
        shakeMagRef.current = 5;

        const capX = BOARD_X + targetCol * CELL + CELL / 2;
        const capY = BOARD_Y + targetRow * CELL + CELL / 2;
        spawnParticles(capX, capY, piece.color === 'white' ? '#38bdf8' : '#e11d48', 25);
        spawnFXRing(capX, capY, '#f59e0b', 40);

        if (now - lastMoveTimeRef.current < 3000) {
          comboCountRef.current++;
        } else {
          comboCountRef.current = 1;
        }
        lastMoveTimeRef.current = now;
        gameScoreRef.current += PIECE_VALUES[targetPiece.type] * (isKineticBlitz ? comboCountRef.current : 1);
      }
    }

    // Pawn Promotion to Queen
    if (piece.type === 'P' && (targetRow === 0 || targetRow === 7)) {
      piece.type = 'Q';
      setStatusMessage(`👑 PAWN PROMOTED TO QUEEN!`);
    }

    // Move Piece
    piece.row = targetRow;
    piece.col = targetCol;
    piece.hasMoved = true;
    piece.isMoving = true;

    // Apply Cooldown in Real-Time Kinetic Blitz Mode
    if (isKineticBlitz) {
      piece.cooldownUntil = now + PIECE_COOLDOWN_MS;
    }

    if (piece.color === 'white') {
      selectedWhiteRef.current = null;
      possibleMovesWhiteRef.current = [];
    } else {
      selectedBlackRef.current = null;
      possibleMovesBlackRef.current = [];
    }

    // In Real-Time Simultaneous Mode, there is NO turn switching! Both can move freely!
    if (isKineticBlitz) {
      return;
    }

    // Next Turn for Turn-Based Modes (Hyper & Classic)
    const nextTurn: Color = piece.color === 'white' ? 'black' : 'white';

    // Frozen condition check
    if (frozenColorRef.current === nextTurn && frozenTurnsRef.current > 0) {
      frozenTurnsRef.current--;
      if (frozenTurnsRef.current <= 0) frozenColorRef.current = null;
      setStatusMessage(`❄ ${nextTurn} is frozen! Turn returns to ${piece.color}.`);
    } else {
      turnRef.current = nextTurn;
      setDisplayTurn(nextTurn);
    }

    if (gameMode === 'hyper') {
      addCoreMana();
    }

    // Check & Checkmate Evaluation
    const enemyInCheck = isKingInCheck(nextTurn, piecesRef.current);
    checkRef.current = enemyInCheck ? nextTurn : null;
    setDisplayCheck(enemyInCheck ? nextTurn : null);

    if (enemyInCheck) {
      shakeFramesRef.current = 12;
      shakeMagRef.current = 7;
      const king = piecesRef.current.find((p) => p.color === nextTurn && p.type === 'K');
      if (king) {
        const kx = BOARD_X + king.col * CELL + CELL / 2;
        const ky = BOARD_Y + king.row * CELL + CELL / 2;
        spawnFXRing(kx, ky, '#ef4444', 90);
      }

      onBanterEvent?.({
        category: 'CHECK_DETECTED',
        actorName: user?.username || piece.color,
        message: `CHECK! ${nextTurn} King is under siege!`,
        highlight: true,
      });

      const legalMovesRemaining = getAllLegalMoves(nextTurn, piecesRef.current, false);
      if (legalMovesRemaining.length === 0) {
        gameOverRef.current = true;
        setIsGameOver(true);
        setWinner(piece.color);
        const finalScore = 1500 + comboCountRef.current * 100 + manaRef.current[piece.color] * 10;
        onGameOver?.(finalScore, { winner: piece.color, gameMode, opponentMode });
        onScoreSubmitted?.(finalScore);
        confetti({ particleCount: 100, spread: 70 });
        setStatusMessage(`♛ CHECKMATE! ${piece.color.toUpperCase()} WINS!`);
        return;
      }
    } else {
      const legalMovesRemaining = getAllLegalMoves(nextTurn, piecesRef.current, false);
      if (legalMovesRemaining.length === 0) {
        gameOverRef.current = true;
        setIsGameOver(true);
        setWinner('draw');
        onGameOver?.(500, { winner: 'draw', gameMode, opponentMode });
        onScoreSubmitted?.(500);
        setStatusMessage(`STALEMATE! Game is a draw.`);
        return;
      }
    }
  }, [addCoreMana, gameMode, onBanterEvent, onGameOver, onScoreSubmitted, opponentMode, user]);

  // -------------------------------------------------------------------------
  // Real-Time & Turn-Based AI Controller
  // -------------------------------------------------------------------------
  const triggerAIMove = useCallback(() => {
    if (gameOverRef.current) return;
    if (opponentMode !== 'ai' && opponentMode !== 'global') return;

    const isKineticBlitz = gameMode === 'kinetic';
    if (!isKineticBlitz && turnRef.current !== 'black') return;

    const legalMoves = getAllLegalMoves('black', piecesRef.current, isKineticBlitz);
    if (legalMoves.length === 0) return;

    let bestMove: { piece: ChessPiece; target: Move; score: number } | null = null;

    for (const pm of legalMoves) {
      for (const m of pm.moves) {
        let score = 0;
        const targetPiece = piecesRef.current.find((p) => p.row === m.row && p.col === m.col);
        if (targetPiece) {
          score += PIECE_VALUES[targetPiece.type] * 10;
          if (targetPiece.type === 'K') score += 50000;
        }
        if ((m.row === 3 || m.row === 4) && (m.col === 3 || m.col === 4)) {
          score += 30;
        }
        score += Math.random() * 25;

        if (!bestMove || score > bestMove.score) {
          bestMove = { piece: pm.piece, target: m, score };
        }
      }
    }

    if (bestMove) {
      executeMove(bestMove.piece, bestMove.target.row, bestMove.target.col);
    }
  }, [executeMove, gameMode, opponentMode]);

  // Real-time AI Interval for Kinetic Blitz Mode (Kung-Fu Simultaneous Speed Chess)
  useEffect(() => {
    if (gameMode !== 'kinetic' || isGameOver || inLobby) return;
    if (opponentMode !== 'ai' && opponentMode !== 'global') return;

    const interval = setInterval(() => {
      triggerAIMove();
    }, 900 + Math.random() * 400);

    return () => clearInterval(interval);
  }, [gameMode, inLobby, isGameOver, opponentMode, triggerAIMove]);

  // Turn-Based AI Trigger for Classic & Hyper Modes
  useEffect(() => {
    if (gameMode === 'kinetic' || isGameOver || inLobby) return;
    if (displayTurn === 'black' && (opponentMode === 'ai' || opponentMode === 'global')) {
      const timer = setTimeout(() => triggerAIMove(), 500);
      return () => clearTimeout(timer);
    }
  }, [displayTurn, gameMode, inLobby, isGameOver, opponentMode, triggerAIMove]);

  // -------------------------------------------------------------------------
  // True Simultaneous 2-Player Multi-Touch / Pointerdown Handler
  // -------------------------------------------------------------------------
  const handleBoardPointerDown = useCallback((clientX: number, clientY: number) => {
    if (gameOverRef.current) return;
    const isKineticBlitz = gameMode === 'kinetic';
    const is2PLocal = opponentMode === 'local';

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const W = boardSizeRef.current;
    const scaleX = W / rect.width;
    const scaleY = W / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const BOARD_SIZE = W - 10;
    const CELL = BOARD_SIZE / 8;
    const BOARD_X = (W - BOARD_SIZE) / 2;
    const BOARD_Y = 5;

    const rawCol = Math.floor((x - BOARD_X) / CELL);
    const rawRow = Math.floor((y - BOARD_Y) / CELL);
    if (rawCol < 0 || rawCol > 7 || rawRow < 0 || rawRow > 7) return;

    const clickedPiece = piecesRef.current.find((p) => p.row === rawRow && p.col === rawCol);
    const now = Date.now();

    // 1. Check if clicked on a valid move destination for White
    if (selectedWhiteRef.current) {
      const validMove = possibleMovesWhiteRef.current.find((m) => m.row === rawRow && m.col === rawCol);
      if (validMove) {
        executeMove(selectedWhiteRef.current, rawRow, rawCol);
        return;
      }
    }

    // 2. Check if clicked on a valid move destination for Black (In 2P Local or Blitz)
    if (selectedBlackRef.current && (is2PLocal || isKineticBlitz)) {
      const validMove = possibleMovesBlackRef.current.find((m) => m.row === rawRow && m.col === rawCol);
      if (validMove) {
        executeMove(selectedBlackRef.current, rawRow, rawCol);
        return;
      }
    }

    // 3. Selection Handling
    if (clickedPiece) {
      // Clicking a White Piece
      if (clickedPiece.color === 'white' && (isKineticBlitz || turnRef.current === 'white')) {
        if (isKineticBlitz && clickedPiece.cooldownUntil && clickedPiece.cooldownUntil > now) {
          setStatusMessage(`⏳ White ${clickedPiece.type} is recharging! Wait ${((clickedPiece.cooldownUntil - now) / 1000).toFixed(1)}s`);
          return;
        }
        selectedWhiteRef.current = clickedPiece;
        possibleMovesWhiteRef.current = getLegalMoves(clickedPiece, piecesRef.current, isKineticBlitz);
        return;
      }

      // Clicking a Black Piece (Allowed in 2P Local or Kinetic Blitz 2P)
      if (clickedPiece.color === 'black') {
        if (!is2PLocal && (opponentMode === 'ai' || opponentMode === 'global')) {
          // Playing vs AI/Global — Black is opponent
          return;
        }
        if (isKineticBlitz || turnRef.current === 'black') {
          if (isKineticBlitz && clickedPiece.cooldownUntil && clickedPiece.cooldownUntil > now) {
            setStatusMessage(`⏳ Black ${clickedPiece.type} is recharging! Wait ${((clickedPiece.cooldownUntil - now) / 1000).toFixed(1)}s`);
            return;
          }
          selectedBlackRef.current = clickedPiece;
          possibleMovesBlackRef.current = getLegalMoves(clickedPiece, piecesRef.current, isKineticBlitz);
          return;
        }
      }
    }

    // Clicking Empty Unselected Square -> Clear Selection
    selectedWhiteRef.current = null;
    possibleMovesWhiteRef.current = [];
    selectedBlackRef.current = null;
    possibleMovesBlackRef.current = [];
  }, [executeMove, gameMode, opponentMode]);

  // -------------------------------------------------------------------------
  // Main Canvas Rendering Loop
  // -------------------------------------------------------------------------
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = boardSizeRef.current;
    const H = boardSizeRef.current;
    const BOARD_SIZE = W - 10;
    const CELL = BOARD_SIZE / 8;
    const BOARD_X = (W - BOARD_SIZE) / 2;
    const BOARD_Y = 5;
    const now = Date.now();
    const isKineticBlitz = gameMode === 'kinetic';

    ctx.save();

    if (shakeFramesRef.current > 0) {
      const mag = shakeMagRef.current * (shakeFramesRef.current / 12);
      ctx.translate((Math.random() - 0.5) * 2 * mag, (Math.random() - 0.5) * 2 * mag);
      shakeFramesRef.current--;
    }

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, W, H);

    // Board Squares
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const x = BOARD_X + c * CELL;
        const y = BOARD_Y + r * CELL;

        const isLight = (r + c) % 2 === 0;
        const isCoreZone = gameMode === 'hyper' && (r === 3 || r === 4) && (c === 3 || c === 4);

        if (isCoreZone) {
          ctx.fillStyle = isLight ? `${_coreSkinColor}40` : `${_coreSkinColor}30`;
        } else {
          ctx.fillStyle = isLight ? _boardLight : _boardDark;
        }
        ctx.fillRect(x, y, CELL, CELL);

        if (isCoreZone) {
          ctx.strokeStyle = _coreSkinColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
        }
      }
    }

    // Selected White Highlights (Cyan)
    if (selectedWhiteRef.current) {
      const p = selectedWhiteRef.current;
      ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.fillRect(BOARD_X + p.col * CELL, BOARD_Y + p.row * CELL, CELL, CELL);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(BOARD_X + p.col * CELL + 1, BOARD_Y + p.row * CELL + 1, CELL - 2, CELL - 2);
    }

    // Selected Black Highlights (Amber / Red)
    if (selectedBlackRef.current) {
      const p = selectedBlackRef.current;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.fillRect(BOARD_X + p.col * CELL, BOARD_Y + p.row * CELL, CELL, CELL);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(BOARD_X + p.col * CELL + 1, BOARD_Y + p.row * CELL + 1, CELL - 2, CELL - 2);
    }

    // Move Highlight Targets (White = Cyan dots / Red rings)
    possibleMovesWhiteRef.current.forEach((m) => {
      const cx = BOARD_X + m.col * CELL + CELL / 2;
      const cy = BOARD_Y + m.row * CELL + CELL / 2;

      if (m.isCapture) {
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, CELL * 0.38, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(cx, cy, CELL * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Move Highlight Targets (Black in 2P = Amber dots / Pink rings)
    possibleMovesBlackRef.current.forEach((m) => {
      const cx = BOARD_X + m.col * CELL + CELL / 2;
      const cy = BOARD_Y + m.row * CELL + CELL / 2;

      if (m.isCapture) {
        ctx.strokeStyle = '#fb7185';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, CELL * 0.38, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(cx, cy, CELL * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Check Aura (Turn-based mode)
    if (checkRef.current && !isKineticBlitz) {
      const king = piecesRef.current.find((p) => p.color === checkRef.current && p.type === 'K');
      if (king) {
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 150);
        ctx.fillStyle = `rgba(239, 68, 68, ${0.35 + pulse * 0.3})`;
        ctx.fillRect(BOARD_X + king.col * CELL, BOARD_Y + king.row * CELL, CELL, CELL);
      }
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Render Chess Pieces & Cooldown Rings
    piecesRef.current.forEach((p) => {
      p.animX += (p.col - p.animX) * 0.28;
      p.animY += (p.row - p.animY) * 0.28;

      const x = BOARD_X + p.animX * CELL + CELL / 2;
      const y = BOARD_Y + p.animY * CELL + CELL / 2;

      if (p.isShielded) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, y, CELL * 0.42, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw Piece Unicode
      ctx.font = `${CELL * 0.72}px "Segoe UI Symbol", "Apple Color Emoji", serif`;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText(PIECE_UNICODE[`${p.color[0]}${p.type}`] ?? '?', x + 1.5, y + 2);

      ctx.fillStyle = p.color === 'white' ? '#f8fafc' : '#0f172a';
      ctx.fillText(PIECE_UNICODE[`${p.color[0]}${p.type}`] ?? '?', x, y);

      // Real-Time Cooldown Radial Sweep Indicator (Kung-Fu Chess)
      if (isKineticBlitz && p.cooldownUntil && p.cooldownUntil > now) {
        const remaining = p.cooldownUntil - now;
        const fraction = Math.max(0, Math.min(1, remaining / PIECE_COOLDOWN_MS));

        ctx.strokeStyle = p.color === 'white' ? '#38bdf8' : '#f43f5e';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(x, y, CELL * 0.42, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.beginPath();
        ctx.arc(x, y, CELL * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Particle FX
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const pt = particlesRef.current[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.08;
      pt.life++;
      const alpha = Math.max(0, 1 - pt.life / pt.maxLife);

      ctx.fillStyle = pt.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (pt.life >= pt.maxLife) {
        particlesRef.current.splice(i, 1);
      }
    }

    // FX Shockwave Rings
    for (let i = fxRingsRef.current.length - 1; i >= 0; i--) {
      const ring = fxRingsRef.current[i];
      ring.radius += 3.5;
      const progress = ring.radius / ring.maxRadius;
      ring.alpha = Math.max(0, 1 - progress);

      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = ring.alpha;
      ctx.lineWidth = ring.lineWidth;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (ring.radius >= ring.maxRadius) {
        fxRingsRef.current.splice(i, 1);
      }
    }

    if (checkRef.current && !isKineticBlitz) {
      const alpha = 0.75 + 0.25 * Math.sin(Date.now() / 120);
      ctx.fillStyle = `rgba(225, 29, 72, ${alpha})`;
      ctx.fillRect(0, 0, W, 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`⚠ CHECK! ${checkRef.current.toUpperCase()} KING UNDER SIEGE`, W / 2, 12);
    }

    ctx.restore();
  }, [gameMode, opponentMode]);

  // -------------------------------------------------------------------------
  // RAF Animation Loop
  // -------------------------------------------------------------------------
  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      if (hitStopFramesRef.current > 0) {
        hitStopFramesRef.current--;
        renderFrame();
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      renderFrame();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [renderFrame]);

  // -------------------------------------------------------------------------
  // Responsive Canvas Sizing (Fullscreen + Normal Mode Scaling)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const gameKeys = ['Space', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (gameKeys.includes(e.code) || gameKeys.includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });

    const updateSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const clientW = container.clientWidth || 320;
      const isFull = !!document.fullscreenElement;
      const clientH = window.innerHeight ? window.innerHeight - (isFull ? 180 : 250) : 480;
      const targetSize = Math.max(280, Math.min(clientW, Math.min(clientH, isFull ? 640 : 460)));
      boardSizeRef.current = targetSize;

      canvas.width = targetSize;
      canvas.height = targetSize;
      canvas.style.width = `${targetSize}px`;
      canvas.style.height = `${targetSize}px`;
    };

    updateSize();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(() => updateSize());
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateSize);
      observer?.disconnect();
    };
  }, [inLobby, isFullscreen]);

  // -------------------------------------------------------------------------
  // Matchmaking Radar Overlay
  // -------------------------------------------------------------------------
  if (isMatchmaking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] bg-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-2xl text-center space-y-5 max-w-md mx-auto">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-cyan-500/40 animate-ping absolute inset-0" />
          <div className="w-20 h-20 rounded-full border-2 border-cyan-400 flex items-center justify-center bg-cyan-950/40 shadow-xl shadow-cyan-500/20">
            <Globe className="w-8 h-8 text-cyan-300 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono font-bold text-cyan-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>GLOBAL MATCHMAKING POOL</span>
          </div>
          <h3 className="text-xl font-black text-white mt-1.5">Searching for Opponent...</h3>
          <p className="text-[11px] text-zinc-400 mt-1">Matching with rating-calibrated worldwide players</p>
        </div>

        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-300"
            style={{ width: `${matchmakingProgress}%` }}
          />
        </div>

        {matchedPlayer && (
          <div className="p-3 rounded-2xl bg-zinc-900 border border-cyan-500/40 w-full flex items-center justify-between animate-in zoom-in-95">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-cyan-400">
                {matchedPlayer.country}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">{matchedPlayer.name}</div>
                <div className="text-[10px] font-mono text-zinc-400">ELO {matchedPlayer.elo} Rating</div>
              </div>
            </div>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Ready!
            </div>
          </div>
        )}

        <button
          onClick={() => setIsMatchmaking(false)}
          className="text-xs text-zinc-500 hover:text-zinc-300 font-mono transition-colors"
        >
          Cancel Matchmaking
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // LOBBY VIEW (Select between 3 Game Modes and 4 Opponent Types)
  // -------------------------------------------------------------------------
  if (inLobby) {
    return (
      <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-3xl" style={{boxShadow: '0 0 60px rgba(6,182,212,0.12), 0 20px 60px rgba(0,0,0,0.8)'}}>
        <style>{`
          @keyframes hcGridPulse { 0%, 100% { opacity: 0.03; } 50% { opacity: 0.06; } }
          @keyframes hcGlow { 0%, 100% { opacity: 0.05; } 50% { opacity: 0.12; } }
        `}</style>

        {/* Background: dark space gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#04080f] via-[#070f1e] to-[#050a14]" />

        {/* Animated chess grid background */}
        <div className="absolute inset-0 pointer-events-none" style={{backgroundImage: 'linear-gradient(rgba(6,182,212,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.035) 1px, transparent 1px)', backgroundSize: '48px 48px', animation: 'hcGridPulse 4s ease-in-out infinite'}} />

        {/* Glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 rounded-full blur-3xl" style={{background: 'radial-gradient(ellipse, rgba(6,182,212,0.09) 0%, transparent 70%)', animation: 'hcGlow 5s ease-in-out infinite'}} />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl" style={{background: 'radial-gradient(ellipse, rgba(168,85,247,0.07) 0%, transparent 70%)', animation: 'hcGlow 6s ease-in-out infinite', animationDelay: '1.5s'}} />

        {/* Border */}
        <div className="absolute inset-0 rounded-3xl border border-cyan-500/15 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col gap-5 p-5 sm:p-7">
        {/* Header */}
        <div className="text-center space-y-2 border-b border-cyan-500/10 pb-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-1.5 text-xs font-mono font-bold text-cyan-300" style={{boxShadow: '0 0 16px rgba(6,182,212,0.2)'}}>
            <Swords className="w-3.5 h-3.5" />
            <span>HYPER-CHESS ARENA — CYBER TOURNAMENT</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight" style={{background: 'linear-gradient(180deg, #ffffff 0%, #a5f3fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 12px rgba(6,182,212,0.4))'}}>
            Select Battle Mode
          </h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto font-mono">
            Classic tournament chess · Hyper cyber warfare with mana abilities · Real-Time Kinetic Blitz
          </p>

          {/* Active skin display */}
          {_hcLoadout?.visualSkin && (
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/30 px-3 py-1 text-[10px] font-mono text-purple-300">
              <Sparkles className="w-3 h-3" />
              <span>Board Skin Active — Custom Theme Equipped</span>
            </div>
          )}
        </div>

        {/* 1. SELECT GAME MODE (3 Distinct Fun Modes) */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>1. Choose Game Mode</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Mode 1: Real-Time Kinetic Blitz (Kung-Fu Simultaneous Speed Chess) */}
            <button
              type="button"
              onClick={() => setGameMode('kinetic')}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all relative overflow-hidden ${
                gameMode === 'kinetic'
                  ? 'border-amber-500 bg-amber-950/40 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500/50'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Flame className="w-4 h-4" />
                </div>
                {gameMode === 'kinetic' && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-zinc-950">
                    SELECTED
                  </span>
                )}
              </div>
              <div className="mt-2 font-bold text-xs sm:text-sm text-white">Kinetic Blitz</div>
              <p className="mt-0.5 text-[10.5px] text-zinc-400 leading-tight">
                ⚡ Real-time simultaneous chess! No turns — move with 2.4s piece timeouts!
              </p>
            </button>

            {/* Mode 2: Hyper Cyber Mode */}
            <button
              type="button"
              onClick={() => setGameMode('hyper')}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all relative overflow-hidden ${
                gameMode === 'hyper'
                  ? 'border-cyan-500 bg-cyan-950/40 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500/50'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Zap className="w-4 h-4" />
                </div>
                {gameMode === 'hyper' && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-cyan-500 text-zinc-950">
                    SELECTED
                  </span>
                )}
              </div>
              <div className="mt-2 font-bold text-xs sm:text-sm text-white">Hyper Mode</div>
              <p className="mt-0.5 text-[10.5px] text-zinc-400 leading-tight">
                Mana battery core zone + 5 Cyber Abilities (EMP, Teleport, Freeze).
              </p>
            </button>

            {/* Mode 3: Classic Mode */}
            <button
              type="button"
              onClick={() => setGameMode('classic')}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all relative overflow-hidden ${
                gameMode === 'classic'
                  ? 'border-purple-500 bg-purple-950/40 shadow-lg shadow-purple-500/20 ring-1 ring-purple-500/50'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                  <Shield className="w-4 h-4" />
                </div>
                {gameMode === 'classic' && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-purple-500 text-white">
                    SELECTED
                  </span>
                )}
              </div>
              <div className="mt-2 font-bold text-xs sm:text-sm text-white">Classic Mode</div>
              <p className="mt-0.5 text-[10.5px] text-zinc-400 leading-tight">
                Pure standard tournament chess rules and checkmate evaluation.
              </p>
            </button>
          </div>
        </div>

        {/* 2. SELECT OPPONENT & LAUNCH MATCH */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>2. Choose Match Type & Opponent</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Option A: Play against Computer (AI) */}
            <button
              onClick={() => handleLaunchGame(gameMode, 'ai')}
              className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800/80 hover:border-cyan-500/50 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-zinc-950 transition-all">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                    <span>Play vs Computer</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 bg-zinc-800 rounded text-cyan-300">AI</span>
                  </div>
                  <div className="text-[10.5px] text-zinc-400">Instant single-player match</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Option B: Play against Global Players */}
            <button
              onClick={() => handleLaunchGame(gameMode, 'global')}
              className="flex items-center justify-between p-3 rounded-xl border border-indigo-500/40 bg-indigo-950/30 hover:bg-indigo-900/50 hover:border-indigo-400 transition-all text-left group shadow-lg shadow-indigo-950/50"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                    <span>Global Players</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 bg-indigo-900 rounded text-indigo-200">ONLINE</span>
                  </div>
                  <div className="text-[10.5px] text-zinc-400">Match with worldwide rated players</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Option C: Room Mode for Friends */}
            <div className="sm:col-span-2 p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                  <Radio className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-white">Room Mode for Friends</div>
                  <div className="text-[10px] text-zinc-400">Create private battle code or join friend</div>
                </div>
              </div>

              {roomCode ? (
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-purple-500/40 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-mono text-zinc-500 uppercase">Your 4-Letter Room Code</div>
                    <div className="text-xl font-black font-mono tracking-widest text-purple-300">{roomCode}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(roomCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200"
                    >
                      {copiedCode ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => { setInLobby(false); restartGame(); }}
                      className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow"
                    >
                      Enter Room
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2 pt-0.5">
                  <button
                    onClick={() => handleLaunchGame(gameMode, 'room')}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/40 py-2 text-xs font-bold text-purple-200 hover:bg-purple-900/60"
                  >
                    <Radio className="w-3 h-3" />
                    <span>Host Private Room</span>
                  </button>

                  <div className="flex flex-1 gap-1.5">
                    <input
                      type="text"
                      value={inputRoomCode}
                      onChange={(e) => setInputRoomCode(e.target.value.toUpperCase().slice(0, 4))}
                      placeholder="ROOM CODE"
                      maxLength={4}
                      className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-center text-xs font-mono font-bold tracking-wider text-white uppercase outline-none focus:border-purple-500"
                    />
                    <button
                      disabled={inputRoomCode.length !== 4}
                      onClick={() => {
                        setRoomCode(inputRoomCode);
                        setInLobby(false);
                        restartGame();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 disabled:opacity-40 text-xs font-bold text-white hover:bg-zinc-700"
                    >
                      Join
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Option D: 2-Player Local Pass & Play (Simultaneous in Blitz!) */}
            <button
              onClick={() => handleLaunchGame(gameMode, 'local')}
              className="sm:col-span-2 flex items-center justify-between p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/50 transition-all text-left"
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-300">
                  2-Player Local (Both players move pieces simultaneously in Blitz!)
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">Launch 2P</span>
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // IN-GAME VIEW (With Fullscreen, 2P Simultaneous Support & Ability Guide)
  // -------------------------------------------------------------------------
  return (
    <div
      ref={mainWrapperRef}
      className={`flex flex-col items-center gap-2.5 bg-zinc-950 px-3 py-3 select-none rounded-2xl sm:rounded-3xl border border-zinc-800 shadow-2xl transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen max-w-none rounded-none p-4 justify-center bg-zinc-950 overflow-y-auto'
          : 'w-full max-w-[500px] mx-auto'
      }`}
    >
      {/* Top Header with Mode Badge, Fullscreen Toggle, and Ability Help */}
      <div className="flex items-center justify-between w-full border-b border-zinc-800 pb-2 gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setInLobby(true)}
            className="flex items-center gap-1 rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Modes</span>
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1 rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-zinc-800 transition-all"
            title="View Abilities & Rules Guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guide</span>
          </button>
        </div>

        {/* Current Active Mode Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold">
          {gameMode === 'kinetic' && <span className="text-amber-400 flex items-center gap-1"><Flame className="w-3 h-3" /> Real-Time Blitz</span>}
          {gameMode === 'hyper' && <span className="text-cyan-400 flex items-center gap-1"><Zap className="w-3 h-3" /> Hyper Mode</span>}
          {gameMode === 'classic' && <span className="text-purple-400 flex items-center gap-1"><Shield className="w-3 h-3" /> Classic</span>}
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400 uppercase text-[10px]">
            {opponentMode === 'ai' ? 'vs AI' : opponentMode === 'global' ? `vs ${matchedPlayer?.name || 'Global'}` : opponentMode === 'room' ? `Room ${roomCode}` : '2P Local'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={restartGame}
            title="Restart Game"
            className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Arena'}
            className="flex items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-2.5 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 hover:text-white transition-all shadow"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Full Screen'}</span>
          </button>
        </div>
      </div>

      {/* Turn & Status Bar */}
      <div className="flex w-full items-center justify-between gap-2 px-1">
        {gameMode === 'kinetic' ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              <span>SIMULTANEOUS KUNG-FU BLITZ</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-400">
              2.4s Piece Recharges
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`h-3.5 w-3.5 rounded-full shadow flex-shrink-0 ${
                  displayTurn === 'white' ? 'bg-white shadow-white/50' : 'bg-slate-900 border border-slate-600'
                }`}
              />
              <span className="text-xs font-mono font-black text-white uppercase tracking-wide truncate">
                {displayTurn}'s Turn
              </span>
            </div>

            {gameMode === 'hyper' && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 font-bold">
                <Zap className="h-3.5 w-3.5" />
                <span className="text-white">{displayMana[displayTurn]}</span>
                <span className="text-zinc-500">mana</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Canvas Arena Frame */}
      <div ref={containerRef} className="w-full flex justify-center items-center overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => handleBoardPointerDown(e.clientX, e.clientY)}
          className="cursor-pointer rounded-xl sm:rounded-2xl border border-zinc-800 shadow-2xl shadow-cyan-950/30 touch-none max-w-full aspect-square"
        />
      </div>

      {/* Power-Up Ability Deck (Hyper Mode Only) */}
      {gameMode === 'hyper' && (
        <div className="w-full space-y-1.5">
          <div className="grid grid-cols-2 gap-2 w-full">
            {displayDeck.map((ability, idx) => {
              const cost = ABILITY_COST[ability];
              const canAfford = displayMana[displayTurn] >= cost;
              return (
                <button
                  key={`${ability}-${idx}`}
                  onClick={() => useAbility(ability)}
                  disabled={!canAfford || isGameOver}
                  title={ABILITY_DESCRIPTions[ability]}
                  className={`flex items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                    canAfford
                      ? 'border-cyan-500/50 bg-cyan-950/50 text-cyan-300 hover:bg-cyan-900/60 shadow-md shadow-cyan-500/10 hover:scale-[1.02]'
                      : 'border-zinc-800 bg-zinc-900/50 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-cyan-400" />
                    <span className="truncate">{ability}</span>
                  </div>
                  <span className="text-[10.5px] font-mono font-bold text-amber-400 bg-zinc-950/80 px-1.5 py-0.5 rounded border border-amber-500/30 flex-shrink-0">
                    {cost}m
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="w-full rounded-xl bg-zinc-900/80 border border-zinc-800 p-2 text-center text-[11px] sm:text-xs font-mono text-zinc-300 leading-tight">
        {statusMessage}
      </div>

      {/* Game Over Banner */}
      {isGameOver && (
        <div className="w-full rounded-2xl border border-amber-500/50 bg-amber-950/80 p-3.5 text-center space-y-2">
          <div className="text-base sm:text-lg font-black text-amber-300">
            {winner === 'draw' ? 'STALEMATE — DRAW' : `👑 ${winner?.toUpperCase()} VICTORIOUS!`}
          </div>
          <div className="flex justify-center gap-2">
            <button
              onClick={restartGame}
              className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-colors shadow-lg"
            >
              Play Rematch
            </button>
            <button
              onClick={() => setInLobby(true)}
              className="rounded-xl bg-zinc-800 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-700 transition-colors"
            >
              Change Mode
            </button>
          </div>
        </div>
      )}

      {/* Ability & Rules Guide Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm font-mono">
                <HelpCircle className="w-4 h-4" />
                <span>Hyper-Chess Abilities & Mechanics</span>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                <div className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Mana Battery Core Zone</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-300 leading-relaxed">
                  Occupying any of the 4 center squares generates +5 Mana per turn to charge your cyber abilities.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                <div className="font-bold text-xs text-cyan-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  <span>⚡ EMP Shockwave (25 Mana)</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-300 leading-relaxed">
                  Discharges a powerful electric EMP pulse that immediately disintegrates the highest-value enemy unit on the board!
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                <div className="font-bold text-xs text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>🌀 Teleport (15 Mana)</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-300 leading-relaxed">
                  Select any of your pieces and activate Teleport to warp it to an open position anywhere on the battlefield.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                <div className="font-bold text-xs text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>❄ Cryo-Freeze (20 Mana)</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-300 leading-relaxed">
                  Freezes the opponent's entire army for 1 turn (or locks their cooldowns for 3s in Blitz).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                <div className="font-bold text-xs text-cyan-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>🛡 Quantum Shield (15 Mana)</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-300 leading-relaxed">
                  Creates an impenetrable plasma shield on your King that absorbs and nullifies the next attack.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 font-bold text-xs text-zinc-950 hover:bg-cyan-400 transition-all shadow"
            >
              Got It — Let's Play!
            </button>
          </div>
        </div>
      )}

      {/* Hyper-Chess 4-Slot Loadout Modal */}
      <InGameLoadoutModal
        isOpen={isHyperLoadoutOpen}
        onClose={() => setIsHyperLoadoutOpen(false)}
        gameSlug="hyper-chess"
        gameTitle="Hyper-Chess Tactics"
      />
    </div>
  );
}