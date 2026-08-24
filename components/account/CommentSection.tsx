'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { formatDate } from '@/lib/utils/format';

interface Comment {
  id: number;
  user_id: string;
  body: string;
  created_at: string;
  username?: string;
  avatar_url?: string;
}

interface CommentSectionProps {
  contentType: 'recipe' | 'review' | 'article' | 'game';
  contentId: string;
  contentSlug: string;
  onAuthRequired?: () => void;
}

export function CommentSection({
  contentType,
  contentId,
  contentSlug,
  onAuthRequired,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [postError, setPostError] = useState<string | null>(null);

  const user = platformStore.getCurrentUser();
  const isAdmin = user?.role === 'admin';

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/comments?post_id=${encodeURIComponent(contentId)}&contentSlug=${encodeURIComponent(contentSlug || '')}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setComments(data.data);
          return;
        }
      }
      // Fallback to local store
      const local = platformStore.getComments(contentId || contentSlug, contentType);
      setComments(local);
    } catch {
      const local = platformStore.getComments(contentId || contentSlug, contentType);
      setComments(local);
    } finally {
      setLoading(false);
    }
  }, [contentId, contentSlug, contentType]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError(null);
    if (!user) {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    const trimmed = body.trim();
    if (!trimmed || trimmed.length < 2) return;
    setPosting(true);
    try {
      // Optimistic / local save
      const savedComment = platformStore.addComment({
        user_id: user.id,
        content_type: contentType,
        content_id: contentId,
        content_slug: contentSlug,
        body: trimmed,
        username: user.username,
        avatar_url: user.avatar_url,
      });

      setComments((prev) => [savedComment, ...prev.filter((c) => c.id !== savedComment.id)]);
      setBody('');

      // Send to server API
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: contentId,
          user_id: user.id,
          content: trimmed,
          content_type: contentType,
          content_slug: contentSlug,
        }),
      });

      const data = await res.json().catch(() => null);
      if (data && data.success && data.comment) {
        setComments((prev) => [
          data.comment,
          ...prev.filter((c) => c.id !== data.comment.id && c.id !== savedComment.id),
        ]);
      }
    } catch (err: unknown) {
      console.warn('Comment post error:', err);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!user) return;
    try {
      platformStore.deleteComment(commentId, user.id);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      await fetch(`/api/comments?commentId=${commentId}&userId=${user.id}`, {
        method: 'DELETE',
      }).catch(() => {});
      await fetch(`/api/account/comments?commentId=${commentId}&userId=${user.id}`, {
        method: 'DELETE',
      }).catch(() => {});
    } catch {}
  };


  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8 space-y-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Community Discussion</h3>
        </div>
        <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-mono font-bold text-zinc-400">
          {comments.length}
        </span>
      </div>

      {/* Post comment input */}
      {user ? (
        <form onSubmit={handlePost} className="space-y-3">
          <div className="flex items-center gap-3 mb-2">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-7 h-7 rounded-lg object-cover border border-zinc-700"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
                {user.username[0].toUpperCase()}
              </div>
            )}
            <span className="text-xs font-bold text-zinc-300">Comment as {user.username}</span>
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a review note, cooking tip, or hardware reflection..."
            rows={3}
            maxLength={1000}
            className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 text-xs text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none leading-relaxed"
          />

          {postError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-mono text-rose-400">
              {postError}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-600 font-mono">{body.length}/1000</span>
            <button
              type="submit"
              disabled={posting || body.trim().length < 2}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2 text-xs font-bold text-white hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 transition-all shadow-md shadow-cyan-500/15"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{posting ? 'Posting...' : 'Post Comment'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-6 text-center space-y-2">
          <p className="text-xs text-zinc-400">Join the discussion with fellow chefs, gamers, and tech engineers.</p>
          <button
            onClick={() => onAuthRequired?.()}
            className="rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 text-xs font-bold text-white transition-all"
          >
            Sign In to Post a Comment
          </button>
        </div>
      )}

      {/* Comments feed */}
      {loading ? (
        <div className="space-y-3 pt-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-zinc-950 animate-pulse" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-600 font-mono">
          No comments yet. Start the conversation!
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          {comments.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4 space-y-2 hover:border-zinc-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-cyan-600 to-purple-600 text-[10px] font-bold text-white flex items-center justify-center flex-shrink-0">
                    {(c.username || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-200">{c.username || 'User'}</span>
                    <span className="text-[10px] text-zinc-600 font-mono ml-2">
                      {formatDate(c.created_at)}
                    </span>
                  </div>
                </div>

                {(user?.id === String(c.user_id) || isAdmin) && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-zinc-600 hover:text-rose-400 transition-colors p-1"
                    title="Delete Comment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed pl-8">{c.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
