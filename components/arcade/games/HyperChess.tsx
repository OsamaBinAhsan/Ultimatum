'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Zap, Shield, Swords } from 'lucide-react';
import { platformStore } from '@/lib/data/store';

interface HyperChessProps {
  gameId: string;
  gameTitle: string;
  onGameOver: (score: number, metadata?: Record<string, any>) => void;
  onBanterEvent: (event: any) => void;
  onScoreSubmitted?: (score: number) => void;
}

// ---------------------------------------------------------------------------
// Chess Constants
// ---------------------------------------------------------------------------

const PIECE_UNICODE: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

const ALL_ABILITIES = ['Teleport', 'EMP Shockwave', 'Freeze', 'Overcharge'] as const;
type Ability = typeof ALL_ABILITIES[number];
type Color = 'white' | 'black';

interface ChessPiece {
  type: string; // e.g. 'wK', 'bQ'
  color: Color;
  row: number;
  col: number;
}

function initBoard(): ChessPiece[] {
  const pieces: ChessPiece[] = [];
  const backRank = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  for (let c = 0; c < 8; c++) {
    pieces.push({ type: `b${backRank[c]}`, color: 'black', row: 0, col: c });
    pieces.push({ type: `bP`, color: 'black', row: 1, col: c });
    pieces.push({ type: `wP`, color: 'white', row: 6, col: c });
    pieces.push({ type: `w${backRank[c]}`, color: 'white', row: 7, col: c });
  }
  return pieces;
}

const ABILITY_COST: Record<Ability, number> = {
  Teleport: 15,
  'EMP Shockwave': 25,
  Freeze: 20,
  Overcharge: 10,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HyperChess({ gameId, gameTitle, onGameOver, onBanterEvent }: HyperChessProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // ----- Mutable hot-loop refs (no useState = no re-render jank) -----
  const piecesRef = useRef<ChessPiece[]>(initBoard());
  const selectedRef = useRef<ChessPiece | null>(null);
  const turnRef = useRef<Color>('white');
  const manaRef = useRef<{ white: number; black: number }>({ white: 0, black: 0 });
  const capturedCountRef = useRef(0);
  const hitStopFramesRef = useRef(0);
  const shakeFramesRef = useRef(0);
  const shakeMagRef = useRef(0);
  const checkRef = useRef<Color | null>(null);
  const frozenColorRef = useRef<Color | null>(null);
  const frozenTurnsRef = useRef(0);
  const abilityDeckRef = useRef<[Ability, Ability]>(['Teleport', 'EMP Shockwave']);
  const abilityNextIdxRef = useRef(2);
  const gameOverRef = useRef(false);

  // ----- React display state -----
  const [displayTurn, setDisplayTurn] = useState<Color>('white');
  const [displayMana, setDisplayMana] = useState({ white: 0, black: 0 });
  const [displayDeck, setDisplayDeck] = useState<[Ability, Ability]>(['Teleport', 'EMP Shockwave']);
  const [displayCheck, setDisplayCheck] = useState<Color | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  const user = platformStore.getCurrentUser();

  // -------------------------------------------------------------------------
  // Core Control Zone: center 4 squares (rows 3-4, cols 3-4) grant +5 mana
  // -------------------------------------------------------------------------
  const addCoreMana = useCallback(() => {
    const centerSquares = [{ r: 3, c: 3 }, { r: 3, c: 4 }, { r: 4, c: 3 }, { r: 4, c: 4 }];
    let whiteManaGain = 0;
    let blackManaGain = 0;
    piecesRef.current.forEach((p) => {
      if (centerSquares.some((s) => s.r === p.row && s.c === p.col)) {
        if (p.color === 'white') whiteManaGain += 5;
        else blackManaGain += 5;
      }
    });
    manaRef.current.white += whiteManaGain;
    manaRef.current.black += blackManaGain;
    setDisplayMana({ ...manaRef.current });
  }, []);

  // -------------------------------------------------------------------------
  // Ability Deck Rotation
  // -------------------------------------------------------------------------
  const rotateAbilityDeck = useCallback(() => {
    const nextAbility = ALL_ABILITIES[abilityNextIdxRef.current % ALL_ABILITIES.length];
    abilityNextIdxRef.current++;
    const newDeck: [Ability, Ability] = [abilityDeckRef.current[1], nextAbility];
    abilityDeckRef.current = newDeck;
    setDisplayDeck([...newDeck]);
  }, []);

  const useAbility = useCallback((ability: Ability) => {
    const cost = ABILITY_COST[ability];
    const color = turnRef.current;
    if (manaRef.current[color] < cost) return;
    manaRef.current[color] -= cost;
    setDisplayMana({ ...manaRef.current });

    if (ability === 'Freeze') {
      frozenColorRef.current = color === 'white' ? 'black' : 'white';
      frozenTurnsRef.current = 2;
    }
    if (ability === 'EMP Shockwave') {
      // Remove a random enemy piece
      const enemies = piecesRef.current.filter(
        (p) => p.color !== color && !p.type.includes('K')
      );
      if (enemies.length > 0) {
        const victim = enemies[Math.floor(Math.random() * enemies.length)];
        piecesRef.current = piecesRef.current.filter((p) => p !== victim);
        capturedCountRef.current++;
        hitStopFramesRef.current = 5;
      }
    }

    onBanterEvent({
      category: 'ABILITY_ACTIVATED',
      actorName: user?.username || color,
      message: `activated ${ability}!`,
      highlight: false,
    });

    rotateAbilityDeck();
  }, [onBanterEvent, rotateAbilityDeck, user]);

  // -------------------------------------------------------------------------
  // Check Detection (simplified: check if king squares are attacked)
  // -------------------------------------------------------------------------
  const detectCheck = useCallback((): Color | null => {
    // Simplified: a king is "in check" if an opponent piece is on an adjacent square
    for (const color of ['white', 'black'] as Color[]) {
      const king = piecesRef.current.find((p) => p.type === `${color === 'white' ? 'w' : 'b'}K`);
      if (!king) return color; // checkmate if no king
      const opponents = piecesRef.current.filter((p) => p.color !== color);
      const inCheck = opponents.some(
        (op) => Math.abs(op.row - king.row) <= 1 && Math.abs(op.col - king.col) <= 1 && (op.row !== king.row || op.col !== king.col)
      );
      if (inCheck) return color;
    }
    return null;
  }, []);

  // -------------------------------------------------------------------------
  // Canvas Rendering Loop (requestAnimationFrame Juice Engine)
  // -------------------------------------------------------------------------
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const BOARD_SIZE = Math.min(W, H) - 10;
    const CELL = BOARD_SIZE / 8;
    const BOARD_X = (W - BOARD_SIZE) / 2;
    const BOARD_Y = 5;

    ctx.save();

    // ----- Camera Shake (Juice Engine — Pillar 2) -----
    if (shakeFramesRef.current > 0) {
      const mag = shakeMagRef.current * (shakeFramesRef.current / 10);
      ctx.translate(
        (Math.random() - 0.5) * 2 * mag,
        (Math.random() - 0.5) * 2 * mag
      );
      shakeFramesRef.current--;
    }

    // Background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, W, H);

    // ----- Board -----
    const isFlipped = turnRef.current === 'black';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const drawR = isFlipped ? 7 - r : r;
        const drawC = isFlipped ? 7 - c : c;
        const x = BOARD_X + drawC * CELL;
        const y = BOARD_Y + drawR * CELL;

        // Core control zone highlight
        const isCoreZone = (r === 3 || r === 4) && (c === 3 || c === 4);
        const isLight = (r + c) % 2 === 0;

        ctx.fillStyle = isCoreZone
          ? isLight ? '#7c3aed55' : '#6d28d955'
          : isLight ? '#d8c9b0' : '#7d5a3c';
        ctx.fillRect(x, y, CELL, CELL);

        // Core zone glow border
        if (isCoreZone) {
          ctx.strokeStyle = '#a78bfa80';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, CELL, CELL);
        }
      }
    }

    // Selected square highlight
    if (selectedRef.current) {
      const p = selectedRef.current;
      const drawR = isFlipped ? 7 - p.row : p.row;
      const drawC = isFlipped ? 7 - p.col : p.col;
      ctx.fillStyle = '#22d3ee60';
      ctx.fillRect(BOARD_X + drawC * CELL, BOARD_Y + drawR * CELL, CELL, CELL);
    }

    // ----- Pieces -----
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    piecesRef.current.forEach((piece) => {
      const drawR = isFlipped ? 7 - piece.row : piece.row;
      const drawC = isFlipped ? 7 - piece.col : piece.col;
      const x = BOARD_X + drawC * CELL + CELL / 2;
      const y = BOARD_Y + drawR * CELL + CELL / 2;
      ctx.font = `${CELL * 0.72}px serif`;
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText(PIECE_UNICODE[piece.type] ?? '?', x + 1.5, y + 1.5);
      ctx.fillStyle = piece.color === 'white' ? '#f8fafc' : '#18181b';
      ctx.fillText(PIECE_UNICODE[piece.type] ?? '?', x, y);
    });

    // ----- CHECK DETECTED Banner (Pillar 2: Asymmetry & Banter) -----
    if (checkRef.current) {
      const alpha = 0.65 + 0.25 * Math.sin(Date.now() / 150);
      ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
      ctx.fillRect(0, 0, W, 30);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`⚠ CHECK DETECTED — ${checkRef.current.toUpperCase()} KING UNDER SIEGE`, W / 2, 15);
    }

    ctx.restore();
  }, []);

  // -------------------------------------------------------------------------
  // RAF Game Loop
  // -------------------------------------------------------------------------
  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running || gameOverRef.current) return;
      // Hit-Stop: skip logic, only render, for `hitStopFrames` frames
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
  // Canvas Click — Move Logic
  // -------------------------------------------------------------------------
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOverRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const BOARD_SIZE = Math.min(canvas.width, canvas.height) - 10;
    const CELL = BOARD_SIZE / 8;
    const BOARD_X = (canvas.width - BOARD_SIZE) / 2;
    const BOARD_Y = 5;

    const rawCol = Math.floor((x - BOARD_X) / CELL);
    const rawRow = Math.floor((y - BOARD_Y) / CELL);
    if (rawCol < 0 || rawCol > 7 || rawRow < 0 || rawRow > 7) return;

    const isFlipped = turnRef.current === 'black';
    const col = isFlipped ? 7 - rawCol : rawCol;
    const row = isFlipped ? 7 - rawRow : rawRow;

    const clickedPiece = piecesRef.current.find((p) => p.row === row && p.col === col);

    if (!selectedRef.current) {
      if (clickedPiece && clickedPiece.color === turnRef.current) {
        selectedRef.current = clickedPiece;
      }
      return;
    }

    const moving = selectedRef.current;

    if (clickedPiece && clickedPiece.color === turnRef.current) {
      // Re-select own piece
      selectedRef.current = clickedPiece;
      return;
    }

    // Capture
    if (clickedPiece && clickedPiece.color !== turnRef.current) {
      const isKing = clickedPiece.type.endsWith('K');
      piecesRef.current = piecesRef.current.filter((p) => p !== clickedPiece);
      capturedCountRef.current++;
      hitStopFramesRef.current = 5; // Hit-Stop

      if (isKing) {
        // CHECKMATE
        gameOverRef.current = true;
        setIsGameOver(true);
        const score = manaRef.current[turnRef.current] * 10 + capturedCountRef.current * 50;
        onGameOver(score, { winner: turnRef.current });
        return;
      }
    }

    // Move piece
    moving.row = row;
    moving.col = col;
    selectedRef.current = null;

    // End turn
    const nextTurn: Color = turnRef.current === 'white' ? 'black' : 'white';

    // Frozen turn skip
    if (frozenColorRef.current === nextTurn && frozenTurnsRef.current > 0) {
      frozenTurnsRef.current--;
      if (frozenTurnsRef.current <= 0) frozenColorRef.current = null;
      // Skip opponent's turn — stay on current color
    } else {
      turnRef.current = nextTurn;
      setDisplayTurn(nextTurn);
    }

    // Core mana
    addCoreMana();

    // Check detection
    const checked = detectCheck();
    checkRef.current = checked;
    setDisplayCheck(checked);
    if (checked) {
      shakeFramesRef.current = 10;
      shakeMagRef.current = 6;
      onBanterEvent({
        category: 'CHECK_DETECTED',
        actorName: user?.username || turnRef.current,
        message: `CHECK! ${checked} King is under siege!`,
        highlight: true,
      });
    }
  }, [addCoreMana, detectCheck, onBanterEvent, onGameOver, user]);

  // -------------------------------------------------------------------------
  // Resize & Key Scroll Prevention
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const gameKeys = ['Space', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (gameKeys.includes(e.code) || gameKeys.includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });

    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const size = Math.min(container.clientWidth, 480);
      canvas.width = size;
      canvas.height = size;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col items-center gap-4 bg-zinc-950 px-2 py-4 select-none">
      {/* Turn & Check Status */}
      <div className="flex w-full max-w-[480px] items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${displayTurn === 'white' ? 'bg-white' : 'bg-zinc-800 border border-zinc-500'}`} />
          <span className="text-xs font-mono font-bold text-white capitalize">{displayTurn}'s Turn</span>
        </div>
        {displayCheck && (
          <div className="flex items-center gap-1.5 rounded-lg border border-rose-500/60 bg-rose-950/60 px-3 py-1 text-xs font-mono font-bold text-rose-300 animate-pulse">
            <Shield className="h-3 w-3" />
            CHECK!
          </div>
        )}
        <div className="flex items-center gap-1 text-xs font-mono text-amber-400">
          <Zap className="h-3.5 w-3.5" />
          <span className="text-white">{displayMana[displayTurn]}</span>
          <span className="text-zinc-500">mana</span>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="w-full max-w-[480px]">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="cursor-pointer rounded-xl border border-zinc-800 shadow-2xl shadow-purple-900/20"
          style={{ touchAction: 'none', width: '100%', height: 'auto' }}
        />
      </div>

      {/* Ability Deck — 2-slot rotating array */}
      <div className="flex w-full max-w-[480px] items-center gap-3">
        <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Ability Deck:</div>
        {displayDeck.map((ability, idx) => {
          const cost = ABILITY_COST[ability];
          const canAfford = displayMana[displayTurn] >= cost;
          return (
            <button
              key={`${ability}-${idx}`}
              onClick={() => useAbility(ability)}
              disabled={!canAfford || isGameOver}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all ${
                canAfford
                  ? 'border-violet-500/50 bg-violet-900/40 text-violet-200 hover:bg-violet-800/60'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <Swords className="h-3 w-3" />
              <span>{ability}</span>
              <span className="text-[10px] text-amber-400">{cost}m</span>
            </button>
          );
        })}
      </div>

      {/* Mana Bars */}
      <div className="w-full max-w-[480px] space-y-1.5">
        {(['white', 'black'] as Color[]).map((color) => (
          <div key={color} className="flex items-center gap-2">
            <div className={`w-12 text-right text-[10px] font-mono font-bold capitalize ${color === 'white' ? 'text-slate-200' : 'text-zinc-400'}`}>
              {color}
            </div>
            <div className="flex-1 h-2 rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (displayMana[color] / 100) * 100)}%` }}
              />
            </div>
            <div className="w-8 text-[10px] font-mono text-violet-400">{displayMana[color]}</div>
          </div>
        ))}
      </div>

      {isGameOver && (
        <div className="w-full max-w-[480px] rounded-2xl border border-amber-500/30 bg-amber-950/50 p-4 text-center text-sm font-bold text-amber-300">
          ♛ Checkmate! {displayTurn === 'white' ? 'Black' : 'White'} wins the Hyper-Chess arena.
        </div>
      )}
    </div>
  );
}
