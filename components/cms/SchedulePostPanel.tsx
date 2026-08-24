'use client';

import React from 'react';
import { Clock, Send, FileText, Calendar } from 'lucide-react';
import type { PostStatus } from '@/lib/types';

interface SchedulePostPanelProps {
  status: PostStatus;
  scheduledFor: string | null;
  onChange: (status: PostStatus, scheduledFor: string | null) => void;
}

export function SchedulePostPanel({ status, scheduledFor, onChange }: SchedulePostPanelProps) {
  const getMinDateTime = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5);
    return d.toISOString().slice(0, 16);
  };

  const formatPreview = (val: string) => {
    if (!val) return null;
    try {
      const d = new Date(val);
      return d.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return val;
    }
  };

  const OPTIONS: { value: PostStatus; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      value: 'published',
      label: 'Publish Now',
      icon: <Send className="w-3.5 h-3.5 text-emerald-400" />,
      desc: 'Goes live immediately on save',
    },
    {
      value: 'draft',
      label: 'Save as Draft',
      icon: <FileText className="w-3.5 h-3.5 text-zinc-400" />,
      desc: 'Hidden from public, edit anytime',
    },
    {
      value: 'scheduled',
      label: 'Schedule Post',
      icon: <Calendar className="w-3.5 h-3.5 text-purple-400" />,
      desc: 'Auto-publish at a future date & time',
    },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 space-y-3 shadow-inner">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>Publishing &amp; Release Control</span>
        </div>
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
            status === 'published'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : status === 'scheduled'
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
          }`}
        >
          {status}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {OPTIONS.map((opt) => {
          const isSelected = status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                onChange(
                  opt.value,
                  opt.value === 'scheduled' ? scheduledFor || getMinDateTime() : null
                )
              }
              className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all ${
                isSelected
                  ? 'border-purple-500 bg-purple-500/10 text-white shadow-md shadow-purple-500/10'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                {opt.icon}
                <span>{opt.label}</span>
              </div>
              <div className="text-[11px] text-zinc-500 leading-snug">{opt.desc}</div>
            </button>
          );
        })}
      </div>

      {status === 'scheduled' && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3.5 space-y-2 mt-2">
          <label className="block text-[11px] font-mono font-bold text-purple-300 uppercase">
            Select Publication Date &amp; Time (Local)
          </label>
          <input
            type="datetime-local"
            min={getMinDateTime()}
            value={scheduledFor || getMinDateTime()}
            onChange={(e) => onChange('scheduled', e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none font-mono"
          />
          {scheduledFor && (
            <p className="text-[11px] text-purple-300 font-mono flex items-center gap-1.5 pt-1">
              <span>⏰</span>
              <span>
                Target: <strong>{formatPreview(scheduledFor)}</strong>
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
