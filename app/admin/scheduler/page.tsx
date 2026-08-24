'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  CheckCircle2,
  Terminal,
  Play,
  RefreshCw,
  Clock,
  Utensils,
  Cpu,
  Newspaper,
  Sparkles,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils/format';

type TabKey = 'upcoming' | 'published' | 'log';

interface ScheduledItem {
  id: string;
  title?: string;
  product_name?: string;
  type: 'recipe' | 'review' | 'article';
  status: string;
  scheduled_for: string;
  slug: string;
}

interface PublishedItem {
  id: string;
  title?: string;
  product_name?: string;
  type: 'recipe' | 'review' | 'article';
  published_at?: string;
  created_at?: string;
  slug: string;
}

interface LogEntry {
  id: number;
  run_at: string;
  recipes_published: number;
  reviews_published: number;
  articles_published: number;
  total_published: number;
  duration_ms: number;
  notes: string;
}

export default function SchedulerDashboard() {
  const [tab, setTab] = useState<TabKey>('upcoming');
  const [scheduled, setScheduled] = useState<ScheduledItem[]>([]);
  const [published, setPublished] = useState<PublishedItem[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rRecipes, rReviews, rArticles, rLog] = await Promise.all([
        fetch('/api/recipes?status=scheduled').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/reviews?status=scheduled').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/news?status=scheduled').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/scheduler/log').then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      const items: ScheduledItem[] = [
        ...((rRecipes.data || []).map((x: any) => ({ ...x, type: 'recipe' as const, title: x.title }))),
        ...((rReviews.data || []).map((x: any) => ({ ...x, type: 'review' as const, title: x.product_name }))),
        ...((rArticles.data || []).map((x: any) => ({ ...x, type: 'article' as const, title: x.title }))),
      ].sort((a, b) => new Date(a.scheduled_for || '').getTime() - new Date(b.scheduled_for || '').getTime());

      setScheduled(items);
      setLog(rLog.data || []);

      const [pRecipes, pReviews, pArticles] = await Promise.all([
        fetch('/api/recipes?status=published').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/reviews?status=published').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/news?status=published').then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      const pub: PublishedItem[] = [
        ...((pRecipes.data || []).slice(0, 15).map((x: any) => ({ ...x, type: 'recipe' as const }))),
        ...((pReviews.data || []).slice(0, 10).map((x: any) => ({ ...x, type: 'review' as const }))),
        ...((pArticles.data || []).slice(0, 10).map((x: any) => ({ ...x, type: 'article' as const }))),
      ]
        .sort(
          (a, b) =>
            new Date(b.published_at || b.created_at || '').getTime() -
            new Date(a.published_at || a.created_at || '').getTime()
        )
        .slice(0, 30);

      setPublished(pub);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRunNow = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch('/api/scheduler/publish', {
        method: 'POST',
        headers: { 'x-scheduler-secret': '' },
      });
      const data = await res.json();
      if (data.success) {
        setRunResult(
          data.total > 0
            ? `✅ Published ${data.total} item(s): ${data.published.recipes} recipes, ${data.published.reviews} reviews, ${data.published.articles} articles (${data.duration_ms}ms)`
            : `✅ Cron check completed (${data.duration_ms}ms). No scheduled posts due right now.`
        );
      } else {
        setRunResult(`⚠️ Worker response: ${data.error || 'Failed'}`);
      }
      await fetchData();
    } catch {
      setRunResult('❌ Failed to trigger publisher endpoint.');
    } finally {
      setRunning(false);
    }
  };

  const typeIcon = (type: string) => {
    if (type === 'recipe') return <Utensils className="w-4 h-4 text-orange-400" />;
    if (type === 'review') return <Cpu className="w-4 h-4 text-cyan-400" />;
    return <Newspaper className="w-4 h-4 text-purple-400" />;
  };

  const typeBadge = (type: string) => {
    const map: Record<string, string> = {
      recipe: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      review: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      article: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    };
    return `inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold font-mono uppercase ${
      map[type] || 'bg-zinc-800 text-zinc-400 border-zinc-700'
    }`;
  };

  const TABS = [
    { key: 'upcoming' as TabKey, label: 'Upcoming Scheduled', icon: Clock, count: scheduled.length },
    { key: 'published' as TabKey, label: 'Recently Published', icon: CheckCircle2, count: published.length },
    { key: 'log' as TabKey, label: 'Cron Execution Log', icon: Terminal, count: log.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
            <Sparkles className="w-4 h-4" />
            <span>Automated Release Manager</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-white">Post Scheduler</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Cron worker runs every 15 minutes to auto-publish recipes, hardware reviews, and articles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleRunNow}
            disabled={running}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/25 transition-all disabled:opacity-60"
          >
            <Play className="w-3.5 h-3.5" />
            {running ? 'Running Publisher...' : '▶ Run Publisher Now'}
          </button>
        </div>
      </div>

      {runResult && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-xs font-mono text-purple-300">
          {runResult}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-0">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-t-xl border-b-2 transition-all ${
                isActive
                  ? 'border-purple-500 text-white bg-purple-500/10 font-bold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                  isActive ? 'bg-purple-500/30 text-purple-200' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Upcoming Scheduled */}
      {tab === 'upcoming' && (
        <div className="space-y-3">
          {scheduled.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 py-16 text-center">
              <Calendar className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-400">No upcoming scheduled posts</p>
              <p className="text-xs text-zinc-600 mt-1 max-w-sm mx-auto">
                When creating or editing a Recipe, Review, or News article, select &quot;Schedule Post&quot; to set a release timestamp.
              </p>
            </div>
          ) : (
            scheduled.map((item) => {
              const targetDate = new Date(item.scheduled_for);
              const isPastDue = targetDate.getTime() <= Date.now();
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-zinc-950 p-2 border border-zinc-800">
                      {typeIcon(item.type)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{item.title || item.product_name}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={typeBadge(item.type)}>{item.type}</span>
                        <span className="text-[11px] font-mono text-zinc-500">/{item.slug}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div
                      className={`text-xs font-mono font-bold ${
                        isPastDue ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {formatDateTime(targetDate)}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {isPastDue ? '⚠️ Due for publish (Next cron tick)' : 'Scheduled'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Recently Published */}
      {tab === 'published' && (
        <div className="space-y-3">
          {published.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 py-16 text-center">
              <CheckCircle2 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-400">No published posts found</p>
            </div>
          ) : (
            published.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-zinc-950 p-2 border border-zinc-800">
                    {typeIcon(item.type)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{item.title || item.product_name}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={typeBadge(item.type)}>{item.type}</span>
                      <span className="text-[11px] font-mono text-zinc-500">/{item.slug}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right flex items-center sm:flex-col gap-3 sm:gap-1">
                  <div className="text-xs font-mono text-emerald-400">
                    {formatDate(item.published_at || item.created_at)}
                  </div>
                  <div className="text-[10px] text-zinc-500">Published</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Cron Log */}
      {tab === 'log' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>Cron Worker Telemetry Log (Last 50 Runs)</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">Auto-logged on interval</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950 text-zinc-400">
                  <th className="py-3 px-4 font-mono">Timestamp</th>
                  <th className="py-3 px-4 font-mono">Total</th>
                  <th className="py-3 px-4 font-mono">Recipes</th>
                  <th className="py-3 px-4 font-mono">Reviews</th>
                  <th className="py-3 px-4 font-mono">Articles</th>
                  <th className="py-3 px-4 font-mono">Duration</th>
                  <th className="py-3 px-4 font-mono">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {log.slice(0, 30).map((entry) => (
                  <tr key={entry.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-zinc-300">
                      {formatDateTime(entry.run_at)}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-white">
                      {entry.total_published > 0 ? (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-400 font-mono">
                          +{entry.total_published}
                        </span>
                      ) : (
                        <span className="text-zinc-500 font-mono">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-orange-400 font-mono">{entry.recipes_published}</td>
                    <td className="py-2.5 px-4 text-cyan-400 font-mono">{entry.reviews_published}</td>
                    <td className="py-2.5 px-4 text-purple-400 font-mono">{entry.articles_published}</td>
                    <td className="py-2.5 px-4 text-zinc-400 font-mono">{entry.duration_ms}ms</td>
                    <td className="py-2.5 px-4 text-zinc-400">{entry.notes || '—'}</td>
                  </tr>
                ))}
                {log.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-600 font-mono">
                      No cron runs recorded yet. Click &quot;Run Publisher Now&quot; to test.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
