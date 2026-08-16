'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Utensils,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  Eye,
  Clock,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Recipe, RecipeIngredient, RecipeInstruction } from '@/lib/types';
import confetti from 'canvas-confetti';

export default function AdminRecipesManager() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [form, setForm] = useState<Recipe>({
    id: '',
    slug: '',
    title: '',
    description: '',
    hero_image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80',
    prep_time: 20,
    cook_time: 30,
    servings: 4,
    calories: 540,
    category: 'Pasta & Italian',
    dietary_tags: ['Comfort Food'],
    ingredients: [
      { item: 'Main Protein or Pasta', amount: 16, unit: 'oz', notes: 'Fresh' },
      { item: 'Extra Virgin Olive Oil', amount: 2, unit: 'tbsp' },
      { item: 'Garlic Cloves', amount: 4, unit: 'cloves', notes: 'Minced' },
    ],
    instructions: [
      { step: 1, title: 'Prep Ingredients', instruction: 'Mise en place: slice aromatics and bring water to a rolling boil.' },
      { step: 2, title: 'Sear & Sauté', instruction: 'Warm oil in pan, sauté garlic until fragrant for 90 seconds.' },
      { step: 3, title: 'Finish & Plate', instruction: 'Combine ingredients, season to taste, and serve hot.' },
    ],
    author: 'Chef Marco Bellini',
    rating: 4.9,
    rating_count: 84,
    created_at: new Date().toISOString(),
  });

  useEffect(() => {
    setRecipes(platformStore.getRecipes());
  }, []);

  const handleOpenCreate = () => {
    setForm({
      id: 'rec-' + Date.now(),
      slug: '',
      title: '',
      description: '',
      hero_image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80',
      prep_time: 20,
      cook_time: 30,
      servings: 4,
      calories: 520,
      category: 'Pasta & Italian',
      dietary_tags: ['Chef Special', 'Quick Dinner'],
      ingredients: [
        { item: 'Fresh Pasta or Grain', amount: 16, unit: 'oz', notes: 'Al dente' },
        { item: 'Olive Oil', amount: 2, unit: 'tbsp' },
      ],
      instructions: [
        { step: 1, title: 'Preparation', instruction: 'Prepare all fresh ingredients and season with salt and pepper.' },
        { step: 2, title: 'Cooking', instruction: 'Simmer over medium heat until aromas develop fully.' },
      ],
      author: 'Chef Marco Bellini',
      rating: 5.0,
      rating_count: 1,
      created_at: new Date().toISOString(),
    });
    setIsEditing(true);
  };

  const handleTitleChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setForm((prev) => ({
      ...prev,
      title: val,
      slug: prev.id.startsWith('rec-') ? slug : prev.slug,
    }));
  };

  // Dynamic Ingredient Handlers
  const addIngredientRow = () => {
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { item: '', amount: 1, unit: 'cup', notes: '' }],
    }));
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: string | number) => {
    setForm((prev) => {
      const updated = [...prev.ingredients];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, ingredients: updated };
    });
  };

  const removeIngredient = (index: number) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  // Dynamic Step Handlers
  const addInstructionStep = () => {
    setForm((prev) => ({
      ...prev,
      instructions: [
        ...prev.instructions,
        {
          step: prev.instructions.length + 1,
          title: `Step ${prev.instructions.length + 1}`,
          instruction: '',
        },
      ],
    }));
  };

  const updateInstruction = (index: number, field: keyof RecipeInstruction, value: string | number) => {
    setForm((prev) => {
      const updated = [...prev.instructions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, instructions: updated };
    });
  };

  const removeInstruction = (index: number) => {
    setForm((prev) => {
      const filtered = prev.instructions.filter((_, i) => i !== index);
      // Re-index steps
      const reindexed = filtered.map((inst, i) => ({ ...inst, step: i + 1 }));
      return { ...prev, instructions: reindexed };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug) {
      alert('Please provide a Title and Slug.');
      return;
    }

    platformStore.saveRecipe(form);
    setRecipes(platformStore.getRecipes());
    setIsEditing(false);
    setFeedback(`Recipe "${form.title}" saved successfully!`);
    confetti({ particleCount: 70, spread: 60 });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleEdit = (recipe: Recipe) => {
    setForm({ ...recipe });
    setIsEditing(true);
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the recipe "${title}"?`)) {
      platformStore.deleteRecipe(id);
      setRecipes(platformStore.getRecipes());
      setFeedback(`Recipe "${title}" deleted.`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
            <Utensils className="w-4 h-4" />
            <span>THE KITCHEN CONTENT ENGINE</span>
          </div>
          <h1 className="text-3xl font-black text-white">Recipe Content Management</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Dynamic ingredient arrays, step instructions, and automatic JSON-LD SEO schema integration.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Master Recipe</span>
        </button>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 p-4 text-xs font-bold text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* DYNAMIC RECIPE FORM MODAL / BUILDER */}
      {isEditing && (
        <div className="rounded-3xl border border-amber-500/40 bg-zinc-900/95 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="text-xl font-bold text-white">
              {form.id.startsWith('rec-') ? 'Create New Scientific Recipe' : 'Edit Recipe'}
            </h3>
            <button onClick={() => setIsEditing(false)} className="text-xs text-zinc-400 hover:text-white">
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Recipe Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Signature Italian Baked Ziti with Crispy Basil"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                  URL Slug (/recipes/...)
                </label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Executive Culinary Summary
              </label>
              <textarea
                rows={2}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Prep Time (mins)</label>
                <input
                  type="number"
                  value={form.prep_time}
                  onChange={(e) => setForm({ ...form, prep_time: Number(e.target.value) })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Cook Time (mins)</label>
                <input
                  type="number"
                  value={form.cook_time}
                  onChange={(e) => setForm({ ...form, cook_time: Number(e.target.value) })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Base Servings</label>
                <input
                  type="number"
                  value={form.servings}
                  onChange={(e) => setForm({ ...form, servings: Number(e.target.value) })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">Calories (kcal)</label>
                <input
                  type="number"
                  value={form.calories}
                  onChange={(e) => setForm({ ...form, calories: Number(e.target.value) })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Hero Image URL (WebP / High Res Unsplash)
              </label>
              <input
                type="text"
                required
                value={form.hero_image_url}
                onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-300 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* DYNAMIC INGREDIENT BUILDER SECTION */}
            <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-amber-400" />
                    <span>Dynamic Ingredient Rows</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Add multiple structured ingredients for dynamic serving scaling & JSON-LD markup.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addIngredientRow}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-zinc-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Ingredient</span>
                </button>
              </div>

              <div className="space-y-2 pt-2">
                {form.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ingredient Name (e.g. San Marzano Tomatoes)"
                      value={ing.item}
                      onChange={(e) => updateIngredient(idx, 'item', e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Amount"
                      value={ing.amount}
                      onChange={(e) => updateIngredient(idx, 'amount', Number(e.target.value))}
                      className="w-20 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Unit (oz, tbsp, cup)"
                      value={ing.unit}
                      onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                      className="w-24 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Notes (optional: D.O.P certified)"
                      value={ing.notes || ''}
                      onChange={(e) => updateIngredient(idx, 'notes', e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(idx)}
                      className="rounded-lg p-2 text-zinc-500 hover:text-rose-400"
                      title="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* DYNAMIC INSTRUCTION STEPS BUILDER */}
            <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Step-by-Step Instructions</h4>
                  <p className="text-[11px] text-zinc-400">Sequential cooking blueprint</p>
                </div>

                <button
                  type="button"
                  onClick={addInstructionStep}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-zinc-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Step</span>
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {form.instructions.map((inst, idx) => (
                  <div key={idx} className="rounded-xl border border-zinc-850 bg-zinc-900 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/20 text-[11px] font-bold text-amber-400 font-mono">
                          {inst.step}
                        </span>
                        <input
                          type="text"
                          placeholder="Step Title (e.g. Par-Cook Pasta)"
                          value={inst.title || ''}
                          onChange={(e) => updateInstruction(idx, 'title', e.target.value)}
                          className="rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeInstruction(idx)}
                        className="text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Detailed culinary action..."
                      value={inst.instruction}
                      onChange={(e) => updateInstruction(idx, 'instruction', e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-xl bg-zinc-800 px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20"
              >
                Save & Deploy Recipe
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RECIPES LIST TABLE */}
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Live Kitchen Blueprints</h3>
          <span className="text-xs font-mono text-zinc-400">{recipes.length} Recipes Published</span>
        </div>

        <div className="divide-y divide-zinc-800/80">
          {recipes.map((r) => (
            <div
              key={r.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-zinc-900/90 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800">
                  <Image src={r.hero_image_url} alt={r.title} fill className="object-cover" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{r.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-0.5">
                    <span>{r.category}</span>
                    <span>•</span>
                    <span>{r.ingredients.length} ingredients</span>
                    <span>•</span>
                    <span>{r.prep_time + r.cook_time} mins total</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/recipes/${r.slug}`}
                  target="_blank"
                  className="flex items-center gap-1 rounded-xl bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </Link>

                <button
                  onClick={() => handleEdit(r)}
                  className="rounded-xl bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                  title="Edit Recipe"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(r.id, r.title)}
                  className="rounded-xl bg-rose-950/40 border border-rose-800/40 p-2 text-rose-400 hover:bg-rose-900/60 hover:text-white"
                  title="Delete Recipe"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
