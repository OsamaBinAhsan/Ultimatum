'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { platformStore } from '@/lib/data/store';

interface SaveRecipeButtonProps {
  recipeId: string;
  recipeSlug: string;
  recipeTitle: string;
  onAuthRequired?: () => void;
}

export function SaveRecipeButton({
  recipeId,
  recipeSlug,
  recipeTitle,
  onAuthRequired,
}: SaveRecipeButtonProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const user = platformStore.getCurrentUser();

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    fetch(`/api/account/saved-recipes?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        const ids = (data.data || []).map((x: { recipe_id: string }) => x.recipe_id);
        setSaved(ids.includes(recipeId));
      })
      .catch(() => {});
  }, [user, recipeId]);

  const toggle = async () => {
    if (!user) {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    setLoading(true);
    try {
      if (saved) {
        await fetch(`/api/account/saved-recipes?userId=${user.id}&recipeId=${recipeId}`, {
          method: 'DELETE',
        });
        setSaved(false);
      } else {
        await fetch('/api/account/saved-recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            recipe_id: recipeId,
            recipe_slug: recipeSlug,
            recipe_title: recipeTitle,
          }),
        });
        setSaved(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={saved ? 'Remove from Saved Recipes' : 'Save to My Account'}
      className={`flex items-center gap-1.5 rounded-2xl border px-4 py-2 text-xs font-bold transition-all disabled:opacity-60 hover:scale-105 ${
        saved
          ? 'border-rose-500/60 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 shadow-lg shadow-rose-500/10'
          : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-rose-500/40 hover:text-rose-400'
      }`}
    >
      <Heart className={`w-4 h-4 transition-all ${saved ? 'fill-rose-400 text-rose-400' : ''}`} />
      <span>{saved ? 'Saved in Vault' : 'Save Recipe'}</span>
    </button>
  );
}
