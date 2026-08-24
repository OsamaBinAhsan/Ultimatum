'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Copy,
  ExternalLink,
  Moon,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { RewardedAdModal } from '@/components/monetization/RewardedAdModal';
import { AuthModal } from '@/components/auth/AuthModal';
import confetti from 'canvas-confetti';

interface SabotageCircuitProps {
  gameId: string;
  gameTitle: string;
  onScoreSubmitted?: (score: number) => void;
}

// ---------------------------------------------------------------------------
// Audio Synthesizer Engine (Tactile Industrial Audio)
// ---------------------------------------------------------------------------
class CircuitAudioSynth {
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

  playAlarm() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.setValueAtTime(440, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch {}
  }

  playSuccess() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.16); // G5
      gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch {}
  }

  playError() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.setValueAtTime(110, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {}
  }
}

const sfx = new CircuitAudioSynth();

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------
type PlayerRole = 'ENGINEER' | 'SABOTEUR';

interface Operator {
  id: string;
  name: string;
  isHost: boolean;
  role: PlayerRole;
  splitPart: number | null;
}

interface TelemetryEntry {
  id: string;
  ts: string;
  playerName: string;
  role: string;
  action: string;
  result?: string;
  type: 'safe' | 'danger' | 'sabotage';
}

interface CircuitGameState {
  status: 'LOBBY' | 'PLAYING' | 'GAMEOVER';
  health: number;
  timeLeft: number; // 300s (5 min)
  valves: { a: number; b: number; c: number };
  locks: { [key: string]: number };
  logicTargets: number[];
  logicActive: number[];
  logicGridErrors: number;
  surgeActive: boolean;
  surgeCode: string;
  surgeTicksLeft: number;
  nextSurgeInSec: number;
  overrideLockSec: number;
  signalSlider: number;
  signalTarget: number;
  signalTargetVel: number;
  breakers: [boolean, boolean, boolean, boolean]; // false = closed/green, true = tripped/red
  warningTimers: { [key: string]: number };
  s1_failed: boolean;
  s2_failed: boolean;
  s5_failed: boolean;
  s6_failed: boolean;
  s2_blurred: boolean;
  s2_power: boolean;
  blackoutTicks: number;
  blackoutCDTicks: number;
  log: TelemetryEntry[];
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function genCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

function newLogicTargets(): number[] {
  const all = Array.from({ length: 16 }, (_, i) => i + 1);
  const shuffled = all.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).sort((a, b) => a - b);
}

function createInitialState(): CircuitGameState {
  return {
    status: 'LOBBY',
    health: 100,
    timeLeft: 300,
    valves: { a: 15, b: 20, c: 10 },
    locks: { s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, s6: 0 },
    logicTargets: newLogicTargets(),
    logicActive: [],
    logicGridErrors: 0,
    surgeActive: false,
    surgeCode: '',
    surgeTicksLeft: 0,
    nextSurgeInSec: 25,
    overrideLockSec: 0,
    signalSlider: 50,
    signalTarget: 50,
    signalTargetVel: 1.5,
    breakers: [false, false, false, false],
    warningTimers: { s1: 0, s2: 0, s5: 0, s6: 0 },
    s1_failed: false,
    s2_failed: false,
    s5_failed: false,
    s6_failed: false,
    s2_blurred: false,
    s2_power: true,
    blackoutTicks: 0,
    blackoutCDTicks: 0,
    log: [],
  };
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function SabotageCircuitEngine({
  gameId,
  onScoreSubmitted,
}: SabotageCircuitProps) {
  // Container & UI
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Network & Session
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [myId, setMyId] = useState('');
  const [myName, setMyName] = useState('OPERATOR-1');
  const [joinInputCode, setJoinInputCode] = useState('');
  const [joinInputName, setJoinInputName] = useState('OPERATOR-2');
  const [players, setPlayers] = useState<Operator[]>([]);
  const [myRole, setMyRole] = useState<PlayerRole>('ENGINEER');
  const [mySplitPart, setMySplitPart] = useState<number | null>(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  // Authoritative Game State
  const [gameState, setGameState] = useState<CircuitGameState>(createInitialState());
  const [overrideInputValue, setOverrideInputValue] = useState('');
  const [winner, setWinner] = useState<PlayerRole | null>(null);
  const [saboteurNames, setSaboteurNames] = useState<string[]>([]);
  const [scoreEarned, setScoreEarned] = useState(0);

  // Network references
  const localChannelRef = useRef<BroadcastChannel | null>(null);
  const masterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef<CircuitGameState>(gameState);
  stateRef.current = gameState;
  const playersRef = useRef<Operator[]>(players);
  playersRef.current = players;
  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;
  const myIdRef = useRef(myId);
  myIdRef.current = myId;
  const myNameRef = useRef(myName);
  myNameRef.current = myName;

  // -------------------------------------------------------------------------
  // Sound toggle
  // -------------------------------------------------------------------------
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sfx.enabled = next;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Ambient Mini Oscilloscope Animation
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.fillStyle = '#060e08';
      ctx.fillRect(0, 0, cvs.width, cvs.height);

      const isDanger = stateRef.current.health < 35;
      ctx.strokeStyle = isDanger ? '#ff2244' : '#00ff66';
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      for (let x = 0; x < cvs.width; x++) {
        const amp = isDanger ? 9 : 4.5;
        const y = cvs.height / 2 + Math.sin(x * 0.09 + phase) * amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += isDanger ? 0.22 : 0.08;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  // -------------------------------------------------------------------------
  // Telemetry Log Helper
  // -------------------------------------------------------------------------
  const appendLog = useCallback(
    (
      actorId: string,
      action: string,
      result: string,
      type: 'safe' | 'danger' | 'sabotage'
    ) => {
      const now = new Date();
      const ts = `${String(now.getMinutes()).padStart(2, '0')}:${String(
        now.getSeconds()
      ).padStart(2, '0')}`;
      const p = playersRef.current.find((pl) => pl.id === actorId);
      const pName = p ? p.name : actorId === 'SYSTEM' ? 'SYSTEM' : 'OPERATOR';
      const pRole = p ? `[${p.role}]` : '';

      const entry: TelemetryEntry = {
        id: Math.random().toString(36).substring(2, 9),
        ts,
        playerName: pName,
        role: pRole,
        action,
        result,
        type,
      };

      setGameState((prev) => ({
        ...prev,
        log: [entry, ...prev.log].slice(0, 25),
      }));
    },
    []
  );

  // -------------------------------------------------------------------------
  // Broadcast & Intent Dispatch
  // -------------------------------------------------------------------------
  const broadcastMsg = useCallback((msg: unknown) => {
    if (localChannelRef.current) {
      try {
        localChannelRef.current.postMessage({ fromLocal: true, senderId: myIdRef.current, msg });
      } catch {}
    }
  }, []);

  const sendIntentToHost = useCallback((intent: unknown) => {
    if (localChannelRef.current) {
      try {
        localChannelRef.current.postMessage({
          fromLocal: true,
          senderId: myIdRef.current,
          clientMsg: intent,
        });
      } catch {}
    }
  }, []);

  // -------------------------------------------------------------------------
  // Host Intent Processing
  // -------------------------------------------------------------------------
  const processHostIntent = useCallback(
    (senderId: string, intent: any) => {
      if (!intent || !intent.type) return;
      const G = stateRef.current;
      if (G.status !== 'PLAYING') return;

      switch (intent.type) {
        case 'SLIDER_INTENT': {
          const { valve, delta } = intent.payload;
          if (!['a', 'b', 'c'].includes(valve)) return;
          const oldVal = (G.valves as any)[valve] || 0;
          const newVal = clamp(oldVal + delta, 0, 100);
          setGameState((prev) => ({
            ...prev,
            valves: { ...prev.valves, [valve]: newVal },
          }));
          break;
        }

        case 'SIGNAL_INTENT': {
          const { value } = intent.payload;
          setGameState((prev) => ({ ...prev, signalSlider: clamp(value, 0, 100) }));
          break;
        }

        case 'BREAKER_TOGGLE': {
          const { breakerIndex } = intent.payload;
          if (breakerIndex >= 0 && breakerIndex < 4) {
            setGameState((prev) => {
              const updated = [...prev.breakers] as [boolean, boolean, boolean, boolean];
              updated[breakerIndex] = false; // Closed/Green
              return { ...prev, breakers: updated };
            });
            appendLog(senderId, `reset Breaker ${breakerIndex + 1}`, 'Circuit restored', 'safe');
            sfx.playSuccess();
          }
          break;
        }

        case 'LOGIC_CLICK': {
          const { nodeId } = intent.payload;
          if (!G.s2_power) return;
          if (G.logicTargets.includes(nodeId) && !G.logicActive.includes(nodeId)) {
            const nextActive = [...G.logicActive, nodeId];
            if (nextActive.length >= G.logicTargets.length) {
              setGameState((prev) => ({
                ...prev,
                health: Math.min(100, prev.health + 10),
                logicTargets: newLogicTargets(),
                logicActive: [],
                logicGridErrors: 0,
              }));
              appendLog(senderId, 'logic sequence COMPLETE', '+10 HP', 'safe');
              sfx.playSuccess();
            } else {
              setGameState((prev) => ({ ...prev, logicActive: nextActive }));
              appendLog(senderId, `activated node [${nodeId}]`, '', 'safe');
              sfx.playClick();
            }
          } else if (!G.logicTargets.includes(nodeId)) {
            setGameState((prev) => ({
              ...prev,
              health: Math.max(0, prev.health - 8),
              logicGridErrors: 1,
              overrideLockSec: 5,
            }));
            appendLog(senderId, `logic node [${nodeId}] WRONG!`, '-8 HP · S3 locked 5s', 'sabotage');
            sfx.playError();
            setTimeout(() => {
              setGameState((prev) => ({ ...prev, logicGridErrors: 0, logicActive: [] }));
            }, 5000);
          }
          break;
        }

        case 'OVERRIDE_SUB': {
          const { code } = intent.payload;
          if (!G.surgeActive || G.overrideLockSec > 0) return;
          if (code.toUpperCase() === G.surgeCode) {
            setGameState((prev) => ({
              ...prev,
              surgeActive: false,
              surgeCode: '',
              nextSurgeInSec: 30,
            }));
            appendLog(senderId, `override [${code}] ACCEPTED`, 'Surge cleared', 'safe');
            sfx.playSuccess();
          } else {
            setGameState((prev) => ({ ...prev, overrideLockSec: 3 }));
            appendLog(senderId, `override [${code}] REJECTED`, '3s lockout', 'danger');
            sfx.playError();
          }
          break;
        }

        case 'BLACKOUT_REQ': {
          const sender = playersRef.current.find((p) => p.id === senderId);
          if (!sender || sender.role !== 'SABOTEUR') return;
          if (G.blackoutTicks > 0 || G.blackoutCDTicks > 0) return;
          setGameState((prev) => ({
            ...prev,
            blackoutTicks: 5,
            blackoutCDTicks: 30,
          }));
          appendLog(senderId, 'TRIGGERED BLACKOUT', '5s darkness for engineers', 'sabotage');
          sfx.playAlarm();
          break;
        }
      }
    },
    [appendLog]
  );

  // -------------------------------------------------------------------------
  // Host Master Game Loop (Authoritative 1000ms Interval)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isHost || gameState.status !== 'PLAYING') {
      if (masterTimerRef.current) clearInterval(masterTimerRef.current);
      return;
    }

    masterTimerRef.current = setInterval(() => {
      setGameState((prev) => {
        if (prev.status !== 'PLAYING') return prev;

        // 1. Time countdown
        const nextTime = Math.max(0, prev.timeLeft - 1);
        if (nextTime <= 0) {
          endGame('ENGINEER');
          return { ...prev, timeLeft: 0, status: 'GAMEOVER' };
        }

        // 2. Natural valve drift (gentle rise)
        const vA = Math.min(100, prev.valves.a + rand(0.3, 0.7));
        const vB = Math.min(100, prev.valves.b + rand(0.3, 0.7));
        const vC = Math.min(100, prev.valves.c + rand(0.3, 0.7));

        // 3. Signal target drift
        let sTarget = prev.signalTarget + prev.signalTargetVel;
        let sVel = prev.signalTargetVel;
        if (sTarget >= 85) {
          sTarget = 85;
          sVel = -rand(1.0, 2.0);
        }
        if (sTarget <= 15) {
          sTarget = 15;
          sVel = rand(1.0, 2.0);
        }
        sTarget = clamp(Math.round(sTarget), 0, 100);

        // 4. Breaker random trip (~8% chance per tick)
        const nextBreakers = [...prev.breakers] as [boolean, boolean, boolean, boolean];
        if (Math.random() < 0.08) {
          const untripped = nextBreakers
            .map((b, idx) => (b ? null : idx))
            .filter((x) => x !== null) as number[];
          if (untripped.length > 0) {
            const tripIdx = untripped[Math.floor(Math.random() * untripped.length)];
            nextBreakers[tripIdx] = true;
            appendLog('SYSTEM', `Breaker ${tripIdx + 1} TRIPPED`, 'Power loss warning', 'danger');
            sfx.playAlarm();
          }
        }

        // 5. Surge cycle
        let surgeAct = prev.surgeActive;
        let surgeCd = prev.surgeCode;
        let surgeTicks = prev.surgeTicksLeft;
        let nextSurge = prev.nextSurgeInSec;
        let healthDeduction = 0;

        if (!surgeAct) {
          nextSurge--;
          if (nextSurge <= 0) {
            surgeAct = true;
            surgeCd = genCode(6);
            surgeTicks = 20;
            appendLog('SYSTEM', `Surge code issued: ${surgeCd}`, 'Solve in 20s!', 'danger');
            sfx.playAlarm();
          }
        } else {
          surgeTicks--;
          if (surgeTicks <= 0) {
            healthDeduction += 15;
            appendLog('SYSTEM', 'Surge EXPIRED — penalty applied', '-15 HP', 'sabotage');
            surgeAct = false;
            surgeCd = '';
            nextSurge = 30;
          }
        }

        const nextOverrideLock = Math.max(0, prev.overrideLockSec - 1);
        const nextBlackout = Math.max(0, prev.blackoutTicks - 1);
        const nextBlackoutCD = Math.max(0, prev.blackoutCDTicks - 1);

        // 6. Evaluate Failure States
        const avgValves = (vA + vB + vC) / 3;
        const s1_fail = avgValves > 75;
        const s2_fail = prev.logicGridErrors > 0;
        const s5_fail = Math.abs(prev.signalSlider - sTarget) > 10;
        const s6_fail = nextBreakers.some((b) => b === true);

        // Cascades
        const s2_blur = s1_fail;
        const s2_pwr = !s6_fail;

        // S5 failure power surge randomize
        let newVA = vA;
        let newVB = vB;
        let newVC = vC;
        if (s5_fail && (prev.warningTimers.s5 || 0) % 5 === 1) {
          newVA = Math.floor(Math.random() * 101);
          newVB = Math.floor(Math.random() * 101);
          newVC = Math.floor(Math.random() * 101);
          appendLog('SYSTEM', 'Power Surge: S1 Valves Randomized (S5 failure)', '', 'danger');
        }

        // 7. Grace Periods & Health Drain
        const nextWarningTimers = { ...prev.warningTimers };
        const sectors = [
          { k: 's1', f: s1_fail, n: 'S1 Valves' },
          { k: 's2', f: s2_fail, n: 'S2 Logic' },
          { k: 's5', f: s5_fail, n: 'S5 Tuning' },
          { k: 's6', f: s6_fail, n: 'S6 Breakers' },
        ];

        let drainHP = 0;
        sectors.forEach((sec) => {
          if (sec.f) {
            nextWarningTimers[sec.k] = (nextWarningTimers[sec.k] || 0) + 1;
            if (nextWarningTimers[sec.k] > 5) {
              drainHP += 1;
              appendLog('SYSTEM', `${sec.n} Unresolved (>5s)`, '-1 HP', 'danger');
            }
          } else {
            nextWarningTimers[sec.k] = 0;
          }
        });

        // 8. Core Healing (+2 HP if all sectors nominal)
        let healHP = 0;
        if (!s1_fail && !s2_fail && !s5_fail && !s6_fail) {
          healHP = 2;
        }

        let newHealth = clamp(prev.health - healthDeduction - drainHP + healHP, 0, 100);
        if (newHealth <= 0) {
          endGame('SABOTEUR');
          return { ...prev, health: 0, status: 'GAMEOVER' };
        }

        const nextState: CircuitGameState = {
          ...prev,
          health: newHealth,
          timeLeft: nextTime,
          valves: { a: newVA, b: newVB, c: newVC },
          signalTarget: sTarget,
          signalTargetVel: sVel,
          breakers: nextBreakers,
          surgeActive: surgeAct,
          surgeCode: surgeCd,
          surgeTicksLeft: surgeTicks,
          nextSurgeInSec: nextSurge,
          overrideLockSec: nextOverrideLock,
          blackoutTicks: nextBlackout,
          blackoutCDTicks: nextBlackoutCD,
          s1_failed: s1_fail,
          s2_failed: s2_fail,
          s5_failed: s5_fail,
          s6_failed: s6_fail,
          s2_blurred: s2_blur,
          s2_power: s2_pwr,
          warningTimers: nextWarningTimers,
        };

        // Broadcast to clients
        const codeParts = surgeAct
          ? [surgeCd.slice(0, 3) + '***', '***' + surgeCd.slice(3)]
          : [];
        broadcastMsg({
          type: 'STATE_SYNC',
          payload: { state: nextState, surgeCodeParts: codeParts },
        });

        return nextState;
      });
    }, 1000);

    return () => {
      if (masterTimerRef.current) clearInterval(masterTimerRef.current);
    };
  }, [isHost, gameState.status, appendLog, broadcastMsg]);

  // -------------------------------------------------------------------------
  // Match Completion & Leaderboard Score
  // -------------------------------------------------------------------------
  const endGame = useCallback(
    (winRole: PlayerRole) => {
      setWinner(winRole);
      const sabs = playersRef.current
        .filter((p) => p.role === 'SABOTEUR')
        .map((p) => p.name);
      setSaboteurNames(sabs);

      const calculatedScore =
        winRole === 'ENGINEER'
          ? Math.round(stateRef.current.health * 75 + stateRef.current.timeLeft * 10)
          : Math.round(3000 + (300 - stateRef.current.timeLeft) * 15);

      setScoreEarned(calculatedScore);

      if (winRole === 'ENGINEER') {
        sfx.playSuccess();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } else {
        sfx.playError();
      }

      // Record score in Ultimatum platform store
      try {
        platformStore.submitScore(gameId, calculatedScore);
        if (onScoreSubmitted) onScoreSubmitted(calculatedScore);
      } catch {}

      broadcastMsg({
        type: 'MATCH_OVER',
        payload: { state: stateRef.current, winner: winRole, saboteurs: sabs, calculatedScore },
      });
    },
    [gameId, onScoreSubmitted, broadcastMsg]
  );

  // -------------------------------------------------------------------------
  // Connect to BroadcastChannel on Room Setup
  // -------------------------------------------------------------------------
  const setupLocalChannel = useCallback(
    (code: string) => {
      if (typeof window === 'undefined' || !window.BroadcastChannel) return;
      if (localChannelRef.current) localChannelRef.current.close();

      const channel = new BroadcastChannel(`sabotage_circuit_${code}`);
      channel.onmessage = (ev) => {
        if (!ev.data || !ev.data.fromLocal) return;

        // Handle client message on Host
        if (isHostRef.current && ev.data.clientMsg) {
          const clientMsg = ev.data.clientMsg;
          if (clientMsg.type === 'JOIN_REQ') {
            const pId = clientMsg.payload.id;
            if (!playersRef.current.some((p) => p.id === pId) && playersRef.current.length < 5) {
              const newPlayers: Operator[] = [
                ...playersRef.current,
                {
                  id: pId,
                  name: clientMsg.payload.name,
                  isHost: false,
                  role: 'ENGINEER',
                  splitPart: null,
                },
              ];
              setPlayers(newPlayers);
              channel.postMessage({
                fromLocal: true,
                senderId: myIdRef.current,
                msg: { type: 'ROSTER', payload: { players: newPlayers } },
              });
            }
          } else {
            processHostIntent(ev.data.senderId, clientMsg);
          }
          return;
        }

        // Handle host message on Joiner
        if (!isHostRef.current && ev.data.msg) {
          const msg = ev.data.msg;
          if (msg.type === 'ROSTER') {
            setPlayers(msg.payload.players);
          } else if (msg.type === 'START') {
            setPlayers(msg.payload.players);
            const me = msg.payload.players.find((p: Operator) => p.id === myIdRef.current);
            if (me) {
              setMyRole(me.role);
              setMySplitPart(me.splitPart);
            }
            setGameState(msg.payload.initState);
            setRoleModalVisible(true);
          } else if (msg.type === 'STATE_SYNC') {
            setGameState(msg.payload.state);
          } else if (msg.type === 'MATCH_OVER') {
            setGameState(msg.payload.state);
            setWinner(msg.payload.winner);
            setSaboteurNames(msg.payload.saboteurs);
            setScoreEarned(msg.payload.calculatedScore || 0);
          }
        }
      };

      localChannelRef.current = channel;
    },
    [processHostIntent]
  );

  // -------------------------------------------------------------------------
  // Lobby Actions
  // -------------------------------------------------------------------------
  const handleStartSoloMission = (asRole: 'ENGINEER' | 'SABOTEUR' = 'ENGINEER') => {
    sfx.playClick();
    const hostId = 'OPERATOR-YOU';
    const name = myName.trim().toUpperCase() || 'CHIEF-ENG';

    setIsHost(true);
    setRoomCode('SOLO');
    setMyId(hostId);
    setMyName(name);

    const soloPlayers: Operator[] = [
      { id: hostId, name: `${name} (YOU)`, isHost: true, role: asRole, splitPart: null },
      { id: 'BOT-1', name: 'UNIT-ALPHA', isHost: false, role: asRole === 'ENGINEER' ? 'SABOTEUR' : 'ENGINEER', splitPart: 0 },
      { id: 'BOT-2', name: 'UNIT-BETA', isHost: false, role: 'ENGINEER', splitPart: 1 },
      { id: 'BOT-3', name: 'UNIT-GAMMA', isHost: false, role: 'ENGINEER', splitPart: null },
      { id: 'BOT-4', name: 'UNIT-DELTA', isHost: false, role: 'ENGINEER', splitPart: null },
    ];

    setPlayers(soloPlayers);
    setMyRole(asRole);
    setMySplitPart(null);

    const initG: CircuitGameState = {
      ...createInitialState(),
      status: 'PLAYING',
    };
    setGameState(initG);
    setRoleModalVisible(true);
  };

  const handleHostInit = () => {
    sfx.playClick();
    const code = genCode(4);
    const hostId = `HOST_${code}`;
    const name = myName.trim().toUpperCase() || 'HOST-1';

    setIsHost(true);
    setRoomCode(code);
    setMyId(hostId);
    setMyName(name);

    const initialPlayers: Operator[] = [
      { id: hostId, name, isHost: true, role: 'ENGINEER', splitPart: null },
    ];
    setPlayers(initialPlayers);
    setupLocalChannel(code);
  };

  const handleJoinCircuit = () => {
    sfx.playClick();
    const code = joinInputCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const name = joinInputName.trim().toUpperCase() || 'OPERATOR-2';
    if (!code) return;

    const joinerId = `JOIN_${Math.random().toString(36).substring(2, 7)}`;
    setIsHost(false);
    setRoomCode(code);
    setMyId(joinerId);
    setMyName(name);

    setupLocalChannel(code);

    // Send JOIN_REQ
    setTimeout(() => {
      if (localChannelRef.current) {
        localChannelRef.current.postMessage({
          fromLocal: true,
          senderId: joinerId,
          clientMsg: { type: 'JOIN_REQ', payload: { id: joinerId, name } },
        });
      }
    }, 150);
  };

  const handleStartMission = () => {
    if (!isHost) return;
    sfx.playClick();

    // Assign exactly 1 Saboteur
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    shuffled.forEach((p, idx) => {
      p.role = idx === 0 ? 'SABOTEUR' : 'ENGINEER';
    });

    // Assign split code views to joiners
    const joiners = shuffled.filter((p) => !p.isHost);
    joiners.forEach((p, idx) => {
      p.splitPart = idx < 2 ? idx : null;
    });

    const initG: CircuitGameState = {
      ...createInitialState(),
      status: 'PLAYING',
    };

    setPlayers(shuffled);
    const me = shuffled.find((p) => p.id === myId);
    if (me) {
      setMyRole(me.role);
      setMySplitPart(me.splitPart);
    }
    setGameState(initG);
    setRoleModalVisible(true);

    broadcastMsg({
      type: 'START',
      payload: { players: shuffled, initState: initG },
    });
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDuplicateTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank');
    }
  };

  // -------------------------------------------------------------------------
  // Interaction Handlers (Sliders, Buttons, Submits)
  // -------------------------------------------------------------------------
  const handleValveChange = (valve: 'a' | 'b' | 'c', val: number) => {
    if (gameState.status !== 'PLAYING') return;
    const old = gameState.valves[valve];
    const delta = val - old;
    if (isHost) {
      processHostIntent(myId, { type: 'SLIDER_INTENT', payload: { valve, delta } });
    } else {
      sendIntentToHost({ type: 'SLIDER_INTENT', payload: { valve, delta } });
    }
  };

  const handleSignalSlider = (val: number) => {
    if (gameState.status !== 'PLAYING') return;
    if (isHost) {
      processHostIntent(myId, { type: 'SIGNAL_INTENT', payload: { value: val } });
    } else {
      sendIntentToHost({ type: 'SIGNAL_INTENT', payload: { value: val } });
    }
  };

  const handleBreakerToggle = (idx: number) => {
    if (gameState.status !== 'PLAYING') return;
    if (isHost) {
      processHostIntent(myId, { type: 'BREAKER_TOGGLE', payload: { breakerIndex: idx } });
    } else {
      sendIntentToHost({ type: 'BREAKER_TOGGLE', payload: { breakerIndex: idx } });
    }
  };

  const handleLogicNodeClick = (nodeId: number) => {
    if (gameState.status !== 'PLAYING' || !gameState.s2_power) return;
    if (isHost) {
      processHostIntent(myId, { type: 'LOGIC_CLICK', payload: { nodeId } });
    } else {
      sendIntentToHost({ type: 'LOGIC_CLICK', payload: { nodeId } });
    }
  };

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideInputValue.trim() || gameState.overrideLockSec > 0) return;
    const code = overrideInputValue.trim().toUpperCase();
    setOverrideInputValue('');
    if (isHost) {
      processHostIntent(myId, { type: 'OVERRIDE_SUB', payload: { code } });
    } else {
      sendIntentToHost({ type: 'OVERRIDE_SUB', payload: { code } });
    }
  };

  const handleSaboteurBlackout = () => {
    if (myRole !== 'SABOTEUR' || gameState.blackoutCDTicks > 0) return;
    if (isHost) {
      processHostIntent(myId, { type: 'BLACKOUT_REQ', payload: {} });
    } else {
      sendIntentToHost({ type: 'BLACKOUT_REQ', payload: {} });
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-3xl border border-zinc-800 bg-[#161c24] text-zinc-100 shadow-2xl font-mono select-none ${
        isFullscreen ? 'h-screen p-4' : 'min-h-[720px] p-4 sm:p-6'
      }`}
    >
      {/* CRT Scanline Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-40 opacity-15"
        style={{
          background: 'repeating-linear-gradient(rgba(0,0,0,0) 0px 3px, rgba(0,0,0,0.4) 3px 4px)',
        }}
      />

      {/* Top Header Bar */}
      <div className="relative z-30 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-black bg-[#0d1318] px-4 py-2.5 shadow-md">
        <div className="flex items-center gap-3">
          <canvas
            ref={canvasRef}
            width={70}
            height={24}
            className="rounded border border-emerald-500/50 bg-[#060e08]"
          />
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-wider text-emerald-400">
              SABOTAGE CIRCUIT v2
            </span>
            <span className="text-[10px] text-zinc-400">
              {gameState.status === 'LOBBY'
                ? 'LOBBY WAITING'
                : `MISSION ACTIVE · TIME: ${Math.floor(gameState.timeLeft / 60)}:${String(
                    gameState.timeLeft % 60
                  ).padStart(2, '0')}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {gameState.status === 'PLAYING' && (
            <span
              className={`rounded-md border px-2.5 py-1 text-xs font-bold ${
                myRole === 'SABOTEUR'
                  ? 'border-red-500 bg-red-950/80 text-red-400 animate-pulse'
                  : 'border-emerald-500 bg-emerald-950/80 text-emerald-300'
              }`}
            >
              ROLE: {myRole}
            </span>
          )}

          <button
            onClick={toggleSound}
            className="flex items-center gap-1 rounded-lg border border-black bg-[#1e2d3d] px-2.5 py-1 text-xs font-bold text-zinc-300 hover:bg-emerald-600 hover:text-black transition-all"
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span>{soundEnabled ? 'SFX ON' : 'MUTED'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1 rounded-lg border border-black bg-[#1e2d3d] px-2.5 py-1 text-xs font-bold text-zinc-300 hover:bg-cyan-600 hover:text-black transition-all"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ===================================================================
          SCREEN 1: LOBBY & OPERATOR ROOM DISCOVERY
          =================================================================== */}
      {gameState.status === 'LOBBY' && (
        <div className="relative z-30 mx-auto max-w-2xl rounded-2xl border-4 border-black bg-[#e8e0cf] p-6 text-zinc-900 shadow-2xl">
          <div className="border-b-4 border-black pb-3 text-center">
            <h1 className="text-3xl font-black tracking-widest text-[#161c24]">
              CIRCUIT CONTROL LOBBY
            </h1>
            <p className="mt-1 text-xs font-bold text-zinc-600">
              5-PLAYER ASYNCHRONOUS DECEPTION · 3x2 INDUSTRIAL CONSOLE
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Host Box */}
            <div className="flex flex-col justify-between rounded-xl border-3 border-black bg-[#f0ead8] p-4 shadow-[4px_4px_0_#000]">
              <div>
                <h3 className="border-b-2 border-black pb-1 text-xs font-black text-[#161c24]">
                  HOST A CIRCUIT
                </h3>
                <div className="mt-3 space-y-1">
                  <label className="text-[10px] font-bold text-zinc-600">CALL-SIGN</label>
                  <input
                    type="text"
                    value={myName}
                    onChange={(e) => setMyName(e.target.value.toUpperCase())}
                    disabled={isHost}
                    maxLength={12}
                    className="w-full rounded border-2 border-black bg-white px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-black shadow-inner"
                  />
                </div>
              </div>

              {!isHost ? (
                <button
                  onClick={handleHostInit}
                  className="mt-4 rounded-lg border-3 border-black bg-[#2a9d8f] py-2.5 text-xs font-black tracking-wider text-white shadow-[3px_3px_0_#000] hover:brightness-110 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  INITIALIZE CIRCUIT
                </button>
              ) : (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between rounded border-2 border-emerald-500 bg-[#060e08] px-3 py-2 text-emerald-400">
                    <span className="text-base font-black tracking-widest">{roomCode}</span>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-1 rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-800"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{copiedCode ? 'COPIED!' : 'COPY'}</span>
                    </button>
                  </div>
                  <button
                    onClick={handleDuplicateTab}
                    className="flex w-full items-center justify-center gap-1 rounded border border-black bg-[#d6ccba] py-1 text-[10px] font-bold text-zinc-800 hover:bg-zinc-300"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Open 2nd Player Tab</span>
                  </button>
                </div>
              )}
            </div>

            {/* Join Box */}
            <div className="flex flex-col justify-between rounded-xl border-3 border-black bg-[#f0ead8] p-4 shadow-[4px_4px_0_#000]">
              <div>
                <h3 className="border-b-2 border-black pb-1 text-xs font-black text-[#161c24]">
                  JOIN EXISTING CIRCUIT
                </h3>
                <div className="mt-3 space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-600">CALL-SIGN</label>
                    <input
                      type="text"
                      value={joinInputName}
                      onChange={(e) => setJoinInputName(e.target.value.toUpperCase())}
                      maxLength={12}
                      className="w-full rounded border-2 border-black bg-white px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-black shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-600">ROOM CODE</label>
                    <input
                      type="text"
                      value={joinInputCode}
                      onChange={(e) => setJoinInputCode(e.target.value.toUpperCase())}
                      placeholder="e.g. 4829"
                      maxLength={10}
                      className="w-full rounded border-2 border-black bg-white px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-black shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleJoinCircuit}
                className="mt-4 rounded-lg border-3 border-black bg-[#e76f51] py-2.5 text-xs font-black tracking-wider text-white shadow-[3px_3px_0_#000] hover:brightness-110 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                CONNECT OPERATOR
              </button>
            </div>
          </div>

          {/* Quick Solo Practice / AI Simulation Bar */}
          <div className="mt-4 rounded-xl border-3 border-black bg-emerald-100 p-3 shadow-[3px_3px_0_#000] flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black text-emerald-950 uppercase">⚡ SOLO PRACTICE SIMULATION</div>
              <div className="text-[10px] text-emerald-800 font-semibold">Play instantly offline against AI Engineer/Saboteur bots!</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStartSoloMission('ENGINEER')}
                className="rounded-lg border-2 border-black bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-black text-white shadow"
              >
                🛡️ Play as Chief Engineer
              </button>
              <button
                onClick={() => handleStartSoloMission('SABOTEUR')}
                className="rounded-lg border-2 border-black bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-black text-white shadow"
              >
                😈 Play as Secret Saboteur
              </button>
            </div>
          </div>

          {/* Connected Roster */}
          <div className="mt-6 rounded-xl border-3 border-black bg-[#f0ead8] p-4 shadow-[4px_4px_0_#000]">
            <div className="flex items-center justify-between border-b-2 border-black pb-2 text-xs font-black text-zinc-700">
              <span>CONNECTED OPERATORS ({players.length} / 5)</span>
              <span className="text-[10px] text-[#2a9d8f]">LOCAL MESH READY</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 min-h-[42px]">
              {players.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-1.5 rounded-md border-2 border-black px-3 py-1 text-xs font-bold ${
                    p.isHost ? 'bg-[#fff4d6] border-[#b84328]' : 'bg-[#e8e0cf]'
                  }`}
                >
                  <div className="h-2 w-2 rounded-full bg-emerald-500 border border-black" />
                  <span>
                    {p.name} {p.id === myId ? '(YOU)' : ''} {p.isHost ? '★' : ''}
                  </span>
                </div>
              ))}
            </div>

            {isHost && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleStartMission}
                  className="rounded-lg border-3 border-black bg-[#2a9d8f] px-6 py-2.5 text-sm font-black tracking-widest text-white shadow-[3px_3px_0_#000] hover:brightness-110 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  ▶ START MISSION
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
          SCREEN 2: 3x2 INTERACTIVE CONTROL PANEL (DASHBOARD)
          =================================================================== */}
      {gameState.status === 'PLAYING' && (
        <div
          className="relative z-30 mx-auto grid max-w-[1200px] grid-cols-1 gap-4 lg:grid-cols-3"
          style={{ transform: 'perspective(1500px) rotateX(3deg)' }}
        >
          {/* Blackout Overlay */}
          {gameState.blackoutTicks > 0 && myRole !== 'SABOTEUR' && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl bg-black/95 text-red-500 backdrop-blur-md">
              <Moon className="h-12 w-12 animate-pulse" />
              <h2 className="mt-2 text-2xl font-black tracking-widest">
                SYSTEM BLACKOUT ACTIVE
              </h2>
              <p className="text-xs text-zinc-400">Saboteur triggered terminal power blackout.</p>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────────
              SECTOR 1: VALVE BALANCER
              ──────────────────────────────────────────────────────────────── */}
          <div
            className={`flex flex-col justify-between rounded-2xl border-4 border-black bg-[#e8e0cf] p-4 text-zinc-900 shadow-[5px_5px_0_#000] transition-all ${
              gameState.s1_failed ? 'ring-4 ring-red-500 bg-red-100' : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                <span className="text-xs font-black tracking-wider text-[#161c24]">
                  SEC 01 // VALVE BALANCER
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    gameState.s1_failed
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-[#2a9d8f] text-white'
                  }`}
                >
                  {gameState.s1_failed ? 'OVERPRESSURE' : 'NOMINAL'}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-zinc-600">
                Keep average valve pressure &lt; 75%. Drift occurs naturally.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {(['a', 'b', 'c'] as const).map((vKey) => {
                  const val = gameState.valves[vKey];
                  const isHigh = val > 75;
                  return (
                    <div
                      key={vKey}
                      className="flex flex-col items-center rounded-lg border-2 border-black bg-[#f0ead8] p-2"
                    >
                      <span className="text-[11px] font-black text-zinc-800">
                        VALVE {vKey.toUpperCase()}
                      </span>
                      <span
                        className={`mt-1 text-sm font-black ${
                          isHigh ? 'text-red-600' : 'text-[#2a9d8f]'
                        }`}
                      >
                        {Math.round(val)}%
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(val)}
                        onChange={(e) => handleValveChange(vKey, parseFloat(e.target.value))}
                        className="mt-2 h-20 w-4 cursor-pointer appearance-none bg-zinc-300 accent-[#2a9d8f]"
                        style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-3 text-[9px] text-zinc-500 text-right">
              AVG PRESSURE:{' '}
              {Math.round(
                (gameState.valves.a + gameState.valves.b + gameState.valves.c) / 3
              )}
              %
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────────
              SECTOR 2: LOGIC MATRIX
              ──────────────────────────────────────────────────────────────── */}
          <div
            className={`flex flex-col justify-between rounded-2xl border-4 border-black bg-[#e8e0cf] p-4 text-zinc-900 shadow-[5px_5px_0_#000] transition-all ${
              gameState.s2_blurred ? 'blur-[3px]' : ''
            } ${!gameState.s2_power ? 'opacity-30 pointer-events-none' : ''}`}
          >
            <div>
              <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                <span className="text-xs font-black tracking-wider text-[#161c24]">
                  SEC 02 // LOGIC MATRIX
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    !gameState.s2_power
                      ? 'bg-zinc-800 text-white'
                      : gameState.s2_blurred
                      ? 'bg-amber-600 text-white'
                      : 'bg-[#2a9d8f] text-white'
                  }`}
                >
                  {!gameState.s2_power ? 'NO POWER' : gameState.s2_blurred ? 'BLURRED' : 'READY'}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px]">
                <span className="text-zinc-600">Activate target nodes:</span>
                <span className="font-bold text-[#b84328]">
                  [{gameState.logicTargets.join(', ')}]
                </span>
              </div>

              {/* 16-node Grid */}
              <div className="mt-3 grid grid-cols-4 gap-2">
                {Array.from({ length: 16 }, (_, i) => i + 1).map((nodeId) => {
                  const isActive = gameState.logicActive.includes(nodeId);
                  const isTarget = gameState.logicTargets.includes(nodeId);
                  return (
                    <button
                      key={nodeId}
                      onClick={() => handleLogicNodeClick(nodeId)}
                      className={`h-9 rounded border-2 border-black text-xs font-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all ${
                        isActive
                          ? 'bg-emerald-500 text-white'
                          : isTarget
                          ? 'bg-[#f0ead8] hover:bg-emerald-200 text-zinc-900'
                          : 'bg-[#e8e0cf] text-zinc-600 hover:bg-red-200'
                      }`}
                    >
                      {String(nodeId).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-3 text-[9px] text-zinc-500">
              *Cascade: S1 overpressure blurs grid. S6 failure cuts power.
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────────
              SECTOR 3: SPLIT-CODE OVERRIDE
              ──────────────────────────────────────────────────────────────── */}
          <div className="flex flex-col justify-between rounded-2xl border-4 border-black bg-[#e8e0cf] p-4 text-zinc-900 shadow-[5px_5px_0_#000]">
            <div>
              <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                <span className="text-xs font-black tracking-wider text-[#161c24]">
                  SEC 03 // SURGE OVERRIDE
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    gameState.surgeActive
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-zinc-600 text-white'
                  }`}
                >
                  {gameState.surgeActive ? 'SURGE ACTIVE' : 'STANDBY'}
                </span>
              </div>

              {/* Surge Display */}
              <div className="mt-3 rounded-lg border-2 border-black bg-[#060e08] p-3 text-emerald-400">
                <div className="flex items-center justify-between text-xs">
                  <span>OVERRIDE STATUS</span>
                  <span>
                    {gameState.surgeActive
                      ? `${gameState.surgeTicksLeft}s LEFT`
                      : `NEXT IN ${gameState.nextSurgeInSec}s`}
                  </span>
                </div>

                {gameState.surgeActive && (
                  <div className="mt-2 h-2 w-full overflow-hidden rounded bg-emerald-950 border border-emerald-700">
                    <div
                      className="h-full bg-red-500 transition-all duration-1000"
                      style={{ width: `${(gameState.surgeTicksLeft / 20) * 100}%` }}
                    />
                  </div>
                )}

                <div className="mt-2 text-center text-sm font-black tracking-widest text-emerald-300">
                  {mySplitPart !== null && gameState.surgeActive
                    ? mySplitPart === 0
                      ? `PART 1: ${gameState.surgeCode.slice(0, 3)}***`
                      : `PART 2: ***${gameState.surgeCode.slice(3)}`
                    : gameState.surgeActive
                    ? 'COORDINATE OPERATORS FOR SPLIT CODE'
                    : 'SYSTEM FREQUENCY STABLE'}
                </div>
              </div>

              {/* Input Form */}
              <form onSubmit={handleOverrideSubmit} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={overrideInputValue}
                  onChange={(e) => setOverrideInputValue(e.target.value.toUpperCase())}
                  placeholder="ENTER 6-CHAR CODE"
                  disabled={!gameState.surgeActive || gameState.overrideLockSec > 0}
                  maxLength={6}
                  className="flex-1 rounded border-2 border-black bg-white px-3 py-1 text-xs font-black uppercase text-black shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!gameState.surgeActive || gameState.overrideLockSec > 0}
                  className="rounded border-2 border-black bg-[#2a9d8f] px-3 py-1 text-xs font-black text-white shadow-[2px_2px_0_#000] hover:brightness-110 disabled:opacity-40"
                >
                  TRANSMIT
                </button>
              </form>

              {gameState.overrideLockSec > 0 && (
                <span className="mt-1 block text-[10px] font-bold text-red-600">
                  LOCKOUT: {gameState.overrideLockSec}s
                </span>
              )}
            </div>
            <div className="mt-3 text-[9px] text-zinc-500">
              *Saboteur wrong inputs lock override for 3s.
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────────
              SECTOR 4: CORE INTEGRITY & TELEMETRY HUD
              ──────────────────────────────────────────────────────────────── */}
          <div className="flex flex-col justify-between rounded-2xl border-4 border-black bg-[#e8e0cf] p-4 text-zinc-900 shadow-[5px_5px_0_#000]">
            <div>
              <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                <span className="text-xs font-black tracking-wider text-[#161c24]">
                  SEC 04 // CORE INTEGRITY HUD
                </span>
                <span className="text-[10px] font-black text-[#2a9d8f]">
                  STATUS: {gameState.health > 40 ? 'OPERATIONAL' : 'CRITICAL'}
                </span>
              </div>

              {/* Health Gauge */}
              <div className="mt-3 rounded-lg border-2 border-black bg-[#060e08] p-3 text-emerald-400">
                <div className="flex items-center justify-between text-xs font-black">
                  <span>CORE HEALTH</span>
                  <span
                    className={
                      gameState.health < 30 ? 'text-red-500 animate-pulse' : 'text-emerald-400'
                    }
                  >
                    {Math.round(gameState.health)}%
                  </span>
                </div>
                <div className="mt-1.5 h-3 w-full overflow-hidden rounded bg-emerald-950 border border-emerald-600">
                  <div
                    className={`h-full transition-all duration-300 ${
                      gameState.health < 30 ? 'bg-red-500' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${gameState.health}%` }}
                  />
                </div>
              </div>

              {/* Saboteur Special Ability */}
              {myRole === 'SABOTEUR' && (
                <div className="mt-3 rounded-lg border-2 border-red-500 bg-red-950/70 p-2.5 text-red-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold">BLACKOUT EMP DISRUPTOR</span>
                    <span className="text-[9px]">
                      {gameState.blackoutCDTicks > 0
                        ? `CD: ${gameState.blackoutCDTicks}s`
                        : 'READY'}
                    </span>
                  </div>
                  <button
                    onClick={handleSaboteurBlackout}
                    disabled={gameState.blackoutCDTicks > 0}
                    className="mt-1.5 w-full rounded border-2 border-black bg-red-600 py-1 text-xs font-black text-white shadow-[2px_2px_0_#000] hover:bg-red-500 disabled:opacity-40"
                  >
                    TRIGGER 5s BLACKOUT
                  </button>
                </div>
              )}

              {/* Telemetry Log Window */}
              <div className="mt-3 h-28 overflow-y-auto rounded-lg border-2 border-black bg-[#060e08] p-2 text-[10px] text-emerald-400">
                <div className="border-b border-emerald-900 pb-0.5 font-bold text-emerald-500">
                  LIVE AUDIT TELEMETRY
                </div>
                <div className="mt-1 space-y-1">
                  {gameState.log.map((entry) => (
                    <div
                      key={entry.id}
                      className={`leading-tight ${
                        entry.type === 'sabotage'
                          ? 'text-red-400 font-bold'
                          : entry.type === 'danger'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      [{entry.ts}] {entry.playerName} {entry.role}: {entry.action}{' '}
                      {entry.result && `→ ${entry.result}`}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────────
              SECTOR 5: SIGNAL TUNING
              ──────────────────────────────────────────────────────────────── */}
          <div
            className={`flex flex-col justify-between rounded-2xl border-4 border-black bg-[#e8e0cf] p-4 text-zinc-900 shadow-[5px_5px_0_#000] transition-all ${
              gameState.s5_failed ? 'ring-4 ring-red-500 bg-red-100' : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                <span className="text-xs font-black tracking-wider text-[#161c24]">
                  SEC 05 // SIGNAL TUNING
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    gameState.s5_failed
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-[#2a9d8f] text-white'
                  }`}
                >
                  {gameState.s5_failed ? 'UNLOCKED DRIFT' : 'LOCKED'}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-zinc-600">
                Keep the needle inside the green target zone (±10 units).
              </p>

              {/* Gauge Display */}
              <div className="mt-3 rounded-lg border-2 border-black bg-[#060e08] p-3 text-emerald-400">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>TARGET: {gameState.signalTarget}</span>
                  <span
                    className={
                      gameState.s5_failed ? 'text-red-500' : 'text-emerald-400'
                    }
                  >
                    VALUE: {Math.round(gameState.signalSlider)}
                  </span>
                </div>

                {/* Track */}
                <div className="relative mt-2 h-6 w-full rounded border border-emerald-700 bg-emerald-950">
                  {/* Safe Zone */}
                  <div
                    className="absolute top-0 bottom-0 bg-emerald-500/50 border-x border-emerald-400"
                    style={{
                      left: `${clamp(gameState.signalTarget - 10, 0, 100)}%`,
                      width: '20%',
                    }}
                  />
                  {/* Needle */}
                  <div
                    className="absolute top-0 bottom-0 w-1.5 bg-red-500 border border-white shadow"
                    style={{ left: `${clamp(gameState.signalSlider, 0, 100)}%` }}
                  />
                </div>
              </div>

              {/* Control Slider */}
              <div className="mt-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(gameState.signalSlider)}
                  onChange={(e) => handleSignalSlider(parseFloat(e.target.value))}
                  className="w-full cursor-pointer appearance-none bg-zinc-300 accent-[#2a9d8f] h-3 rounded"
                />
              </div>
            </div>
            <div className="mt-3 text-[9px] text-zinc-500">
              *Cascade: Sustained S5 misalignment causes S1 valve pressure surges.
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────────
              SECTOR 6: BREAKER BOX
              ──────────────────────────────────────────────────────────────── */}
          <div
            className={`flex flex-col justify-between rounded-2xl border-4 border-black bg-[#e8e0cf] p-4 text-zinc-900 shadow-[5px_5px_0_#000] transition-all ${
              gameState.s6_failed ? 'ring-4 ring-red-500 bg-red-100' : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                <span className="text-xs font-black tracking-wider text-[#161c24]">
                  SEC 06 // BREAKER BOX
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    gameState.s6_failed
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-[#2a9d8f] text-white'
                  }`}
                >
                  {gameState.s6_failed ? 'BREAKER TRIPPED' : 'ALL CLOSED'}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-zinc-600">
                Click tripped breakers to restore subsystem circuit connections.
              </p>

              {/* 4 Breaker Toggle Buttons */}
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {gameState.breakers.map((isTripped, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleBreakerToggle(idx)}
                    className={`flex flex-col items-center justify-center rounded-xl border-3 border-black py-2.5 shadow-[3px_3px_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all ${
                      isTripped
                        ? 'bg-red-600 text-white animate-pulse hover:bg-red-500'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
                    }`}
                  >
                    <span className="text-xs font-black">BREAKER {idx + 1}</span>
                    <span className="text-[10px] font-bold">
                      {isTripped ? 'TRIPPED [CLICK]' : 'CLOSED [OK]'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 text-[9px] text-zinc-500">
              *Cascade: Any tripped breaker cuts power to Sector 2 Logic Grid.
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          ROLE REVEAL MODAL (SECRET BRIEFING)
          =================================================================== */}
      {roleModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border-4 border-black bg-[#e8e0cf] p-6 text-zinc-900 shadow-2xl">
            <div className="text-center">
              <span
                className={`inline-block rounded-full border-2 border-black px-4 py-1 text-sm font-black ${
                  myRole === 'SABOTEUR'
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                YOUR SECRET ROLE: {myRole}
              </span>
              <h2 className="mt-3 text-2xl font-black text-[#161c24]">
                {myRole === 'SABOTEUR' ? 'DEFEAT THE ENGINEERS' : 'PROTECT CORE HEALTH'}
              </h2>
              <p className="mt-2 text-xs text-zinc-700 leading-relaxed">
                {myRole === 'SABOTEUR'
                  ? 'Your objective is to subtly cause cascading failures, misalign signal tuning, overload valves, or enter incorrect override codes to drain Core Health to 0%.'
                  : 'Your objective is to collaborate with fellow engineers, balance valves, solve logic patterns, expedite surge codes, and keep Core Health alive for 5 minutes!'}
              </p>
            </div>
            <button
              onClick={() => setRoleModalVisible(false)}
              className="mt-6 w-full rounded-xl border-3 border-black bg-[#2a9d8f] py-2.5 text-sm font-black text-white shadow-[3px_3px_0_#000] hover:brightness-110"
            >
              ACKNOWLEDGE & ENTER CONSOLE
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          SCREEN 3: GAME OVER & LEADERBOARD REWARD
          =================================================================== */}
      {gameState.status === 'GAMEOVER' && (
        <div className="relative z-30 mx-auto max-w-lg rounded-2xl border-4 border-black bg-[#e8e0cf] p-6 text-zinc-900 shadow-2xl">
          <div className="text-center">
            <span
              className={`inline-block rounded-full px-4 py-1 text-xs font-black ${
                winner === 'ENGINEER' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              {winner === 'ENGINEER' ? 'CORE PRESERVED' : 'CORE MELTDOWN'}
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#161c24]">
              {winner === 'ENGINEER' ? 'ENGINEERS WIN!' : 'SABOTEUR PREVAILS!'}
            </h1>
            <p className="mt-1 text-xs font-bold text-zinc-600">
              Identity of Saboteur: {saboteurNames.join(', ') || 'Unknown'}
            </p>

            <div className="mt-4 rounded-xl border-2 border-black bg-[#f0ead8] p-4 text-center">
              <span className="text-xs font-bold text-zinc-600">ARCADE XP & SCORE EARNED</span>
              <div className="mt-1 text-3xl font-black text-[#2a9d8f]">+{scoreEarned} PTS</div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {isHost && (
              <button
                onClick={handleStartMission}
                className="w-full rounded-xl border-3 border-black bg-[#2a9d8f] py-2.5 text-sm font-black text-white shadow-[3px_3px_0_#000] hover:brightness-110"
              >
                PLAY AGAIN (NEW ROLES)
              </button>
            )}
            <button
              onClick={() => setGameState(createInitialState())}
              className="w-full rounded-xl border-2 border-black bg-[#d6ccba] py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-300"
            >
              RETURN TO LOBBY
            </button>
          </div>
        </div>
      )}

      {/* Monetization & Auth Modals */}
      <RewardedAdModal
        isOpen={adModalOpen}
        onClose={() => setAdModalOpen(false)}
        onRewardEarned={() => {
          setAdModalOpen(false);
          setGameState((prev) => ({ ...prev, health: 50, status: 'PLAYING' }));
        }}
        rewardDescription="Revive Core Health to 50% & continue mission"
      />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
