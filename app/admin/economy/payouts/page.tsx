'use client';

import { useState, useEffect } from 'react';
import {
  Coins,
  Trophy,
  RotateCcw,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  Sparkles,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { PayoutProcessResult, PayoutWinnerDetail } from '@/lib/types';

const PAYOUT_TIERS: { rank: number; coins: number; label: string }[] = [
  { rank: 1, coins: 1000, label: '1st Place Champion' },
  { rank: 2, coins: 600, label: '2nd Place Runner-Up' },
  { rank: 3, coins: 400, label: '3rd Place Bronze' },
  { rank: 4, coins: 300, label: '4th Place Top Tier' },
  { rank: 5, coins: 200, label: '5th Place Top Tier' },
  { rank: 6, coins: 150, label: '6th Place Challenger' },
  { rank: 7, coins: 100, label: '7th Place Challenger' },
  { rank: 8, coins: 75, label: '8th Place Contender' },
  { rank: 9, coins: 50, label: '9th Place Contender' },
  { rank: 10, coins: 25, label: '10th Place Contender' },
];

export default function AdminEconomyPayoutsPage() {
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [isExecutingPayout, setIsExecutingPayout] = useState(false);
  const [payoutResult, setPayoutResult] = useState<PayoutProcessResult | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch('/api/admin/leaderboards/process-payouts');
      const data = await res.json();
      if (data.success) {
        setPreviewData(data);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to load preview' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Error connecting to database' });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, []);

  const handleExecutePayout = async () => {
    if (
      !confirm(
        '⚠️ CRITICAL ATOMIC TRANSACTION: Execute automated weekly payouts across SQL Server? This will lock [dbo].[wallets] with UPDLOCK, credit coins to all top 10 winners, log audit entries in [leaderboard_payout_logs], and execute TRUNCATE TABLE [leaderboards].'
      )
    ) {
      return;
    }

    setIsExecutingPayout(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/leaderboards/process-payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = (await res.json()) as PayoutProcessResult;

      if (data.success) {
        setPayoutResult(data);
        setFeedback({
          type: 'success',
          message: `🎉 Weekly tournament reset & payout executed successfully! ${data.total_coins_distributed} coins distributed across ${data.total_winners_awarded} placements.`,
        });
        confetti({ particleCount: 150, spread: 100 });
        // Refresh preview after truncate
        fetchPreview();
      } else {
        setFeedback({
          type: 'error',
          message: (data as any).error || 'Database transaction error during payout execution',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error executing payout' });
    } finally {
      setIsExecutingPayout(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            <Coins className="h-4 w-4" />
            <span>GAME ECONOMY &bull; AUTOMATED TOURNAMENTS</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Weekly Leaderboard Payout Engine</h1>
          <p className="text-xs text-slate-400 mt-1">
            Atomic T-SQL multi-game reward distributor with <code className="font-mono text-purple-300">WITH (UPDLOCK, ROWLOCK)</code> concurrency protection and automated audit logging.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPreview}
            disabled={isLoadingPreview || isExecutingPayout}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
          >
            <RotateCcw className={`h-4 w-4 ${isLoadingPreview ? 'animate-spin' : ''}`} />
            <span>Refresh Preview</span>
          </button>

          <button
            onClick={handleExecutePayout}
            disabled={isExecutingPayout || isLoadingPreview}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:scale-105 transition-all disabled:opacity-50"
          >
            {isExecutingPayout ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>Trigger Weekly Payout &amp; Reset</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center gap-3 rounded-2xl p-4 text-xs font-bold ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-1 backdrop-blur-xl">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">Target Tournament Cycle</span>
          <div className="text-2xl font-black font-mono text-white">
            {previewData?.week_identifier || '2026-W35'}
          </div>
          <span className="text-[11px] text-slate-500">ISO 8601 Global Tournament Week</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-1 backdrop-blur-xl">
          <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase">Pending Coin Pool</span>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {(previewData?.total_coins_to_distribute || 0).toLocaleString()} <span className="text-xs font-sans text-slate-400">Coins</span>
          </div>
          <span className="text-[11px] text-slate-500">Across {previewData?.total_winners || 0} Qualified Placements</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-1 backdrop-blur-xl">
          <span className="text-[11px] font-mono font-bold text-purple-400 uppercase">Active Game Arenas</span>
          <div className="text-2xl font-black font-mono text-purple-300">
            {previewData?.total_games || 0} <span className="text-xs font-sans text-slate-400">Arenas</span>
          </div>
          <span className="text-[11px] text-slate-500">HTML5 Canvas 60 FPS Catalog</span>
        </div>
      </div>

      {/* Payout Matrix Hierarchy */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span>Server-Side Reward Tier Matrix (Top 10)</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">Immutable Smart Rules</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {PAYOUT_TIERS.map((tier) => (
            <div
              key={tier.rank}
              className={`rounded-xl border p-3 text-center space-y-1 ${
                tier.rank === 1
                  ? 'border-amber-500/40 bg-amber-500/10'
                  : tier.rank === 2
                  ? 'border-slate-400/40 bg-slate-400/10'
                  : tier.rank === 3
                  ? 'border-amber-700/40 bg-amber-700/10'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <div className="text-[10px] font-mono font-bold uppercase text-slate-400">#{tier.rank} Rank</div>
              <div className="text-lg font-black font-mono text-emerald-400">+{tier.coins}</div>
              <div className="text-[9px] text-slate-500 truncate">{tier.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Winners Preview Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-400" />
            <span>Pending Payout Allocations (Live Database Preview)</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {previewData?.mode || 'SQL Server'}
          </span>
        </div>

        {isLoadingPreview ? (
          <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2 font-mono">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            <span>Querying SQL Server Top 10 Window Functions...</span>
          </div>
        ) : !previewData?.payouts_by_game || Object.keys(previewData.payouts_by_game).length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 font-mono">
            No active leaderboard scores recorded for this tournament round.
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {Object.entries(previewData.payouts_by_game).map(([gameId, winners]: [string, any]) => (
              <div key={gameId} className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white font-mono uppercase text-purple-300">
                    🎮 Game: {gameId}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {winners.length} Qualified Winners
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {winners.map((w: PayoutWinnerDetail) => (
                    <div
                      key={w.user_id + w.rank_position}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-mono font-bold text-slate-300">
                          #{w.rank_position}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white">{w.username}</div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {w.score.toLocaleString()} pts
                          </div>
                        </div>
                      </div>

                      <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-xs font-mono font-bold text-emerald-400">
                        +{w.coins_awarded} c
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
