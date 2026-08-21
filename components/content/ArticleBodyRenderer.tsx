'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Play, Quote, Sparkles } from 'lucide-react';

interface ArticleBodyRendererProps {
  content: string;
  className?: string;
}

// Extract YouTube Video ID if present
function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function ArticleBodyRenderer({ content, className = '' }: ArticleBodyRendererProps) {
  if (!content) return null;

  // Split into paragraphs / blocks
  const blocks = content.split(/\n\s*\n/);

  const renderInline = (text: string): React.ReactNode[] => {
    // Regex for markdown links [text](url), bold **text**, inline code `code`, and raw URLs
    const tokenRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s\)]+|\/[^\s\)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|(https?:\/\/[^\s<]+))/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // 1. Markdown Link [Anchor](URL)
      if (match[2] && match[3]) {
        const anchor = match[2];
        const url = match[3];
        const isExternal = url.startsWith('http');

        if (isExternal) {
          parts.push(
            <a
              key={match.index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/50 hover:decoration-cyan-400 transition-colors"
            >
              <span>{anchor}</span>
              <ExternalLink className="w-3 h-3 inline-block" />
            </a>
          );
        } else {
          parts.push(
            <Link
              key={match.index}
              href={url}
              className="inline-flex items-center gap-1 font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/50 hover:decoration-cyan-400 transition-colors"
            >
              <span>{anchor}</span>
            </Link>
          );
        }
      }
      // 2. Bold text **text**
      else if (match[4]) {
        parts.push(
          <strong key={match.index} className="font-bold text-white">
            {match[4]}
          </strong>
        );
      }
      // 3. Inline code `code`
      else if (match[5]) {
        parts.push(
          <code
            key={match.index}
            className="rounded-md bg-zinc-800 border border-zinc-700/80 px-1.5 py-0.5 font-mono text-xs text-amber-300"
          >
            {match[5]}
          </code>
        );
      }
      // 4. Raw URL https://...
      else if (match[6]) {
        const rawUrl = match[6];
        parts.push(
          <a
            key={match.index}
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/40 break-all transition-colors"
          >
            <span>{rawUrl}</span>
            <ExternalLink className="w-3 h-3 inline-block flex-shrink-0" />
          </a>
        );
      }

      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className={`space-y-6 text-zinc-300 text-base sm:text-lg leading-relaxed ${className}`}>
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();

        // 1. Check for standalone YouTube URL or [video](url) embed
        const ytMatch =
          trimmed.match(/^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i) ||
          trimmed.match(/^\[(?:video|embed|youtube)\]\((https?:\/\/[^\s\)]+)\)/i);

        if (ytMatch) {
          const ytUrl = ytMatch[1]?.startsWith('http') ? ytMatch[1] : trimmed;
          const videoId = getYouTubeId(ytUrl) || (ytMatch[3] ? ytMatch[3] : null);

          if (videoId) {
            return (
              <div
                key={bIdx}
                className="my-8 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl"
              >
                <div className="relative aspect-video w-full">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                    title="Embedded Video Player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                </div>
                <div className="flex items-center justify-between border-t border-zinc-800/80 bg-zinc-900/60 px-4 py-2 text-xs font-mono text-zinc-400">
                  <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <Play className="w-3.5 h-3.5 fill-cyan-400" />
                    <span>EMBEDDED VIDEO BROADCAST</span>
                  </span>
                  <a
                    href={`https://www.youtube.com/watch?v=${videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Watch on YouTube ↗
                  </a>
                </div>
              </div>
            );
          }
        }

        // 2. Heading 1: # Title
        if (trimmed.startsWith('# ')) {
          return (
            <h2
              key={bIdx}
              className="pt-6 pb-2 text-2xl sm:text-3xl font-black tracking-tight text-white border-b border-zinc-800"
            >
              {renderInline(trimmed.replace(/^#\s+/, ''))}
            </h2>
          );
        }

        // 3. Heading 2: ## Subtitle
        if (trimmed.startsWith('## ')) {
          return (
            <h3
              key={bIdx}
              className="pt-4 pb-1 text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2"
            >
              <span className="h-2 w-2 rounded-full bg-cyan-400 inline-block" />
              <span>{renderInline(trimmed.replace(/^##\s+/, ''))}</span>
            </h3>
          );
        }

        // 4. Heading 3: ### Subtitle
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={bIdx}
              className="pt-3 text-lg sm:text-xl font-bold text-cyan-200"
            >
              {renderInline(trimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }

        // 5. Blockquote: > Quote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={bIdx}
              className="my-6 relative rounded-2xl border-l-4 border-cyan-500 bg-gradient-to-r from-cyan-950/40 via-zinc-900/60 to-zinc-900/30 p-5 sm:p-6 italic text-zinc-200 shadow-lg"
            >
              <Quote className="w-6 h-6 text-cyan-400/40 absolute top-4 right-4" />
              <div className="text-base sm:text-lg leading-relaxed relative z-10">
                {renderInline(trimmed.replace(/^>\s+/, ''))}
              </div>
            </blockquote>
          );
        }

        // 6. Bullet List (- item or * item)
        if (trimmed.split('\n').every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '))) {
          const items = trimmed.split('\n');
          return (
            <ul key={bIdx} className="my-4 space-y-2.5 pl-2">
              {items.map((it, iIdx) => (
                <li key={iIdx} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                  <span>{renderInline(it.replace(/^[-*]\s+/, ''))}</span>
                </li>
              ))}
            </ul>
          );
        }

        // 7. Numbered List (1. item)
        if (trimmed.split('\n').every((line) => /^\d+\.\s+/.test(line.trim()))) {
          const items = trimmed.split('\n');
          return (
            <ol key={bIdx} className="my-4 space-y-2.5 pl-2">
              {items.map((it, iIdx) => {
                const textWithoutNum = it.replace(/^\d+\.\s+/, '');
                return (
                  <li key={iIdx} className="flex items-start gap-3">
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-xs font-bold text-cyan-300">
                      {iIdx + 1}
                    </span>
                    <span>{renderInline(textWithoutNum)}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        // 8. Standard Text Paragraph with multiple lines
        const lines = block.split('\n');
        return (
          <p key={bIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderInline(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
