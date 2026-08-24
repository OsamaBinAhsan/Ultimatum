'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Utensils,
  Clock,
  Star,
  Search,
  ChefHat,
  Check,
  X,
  Layers,
  Globe2,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Recipe } from '@/lib/types';
import { AdSlot } from '@/components/monetization/AdSlot';

const POPULAR_PANTRY_INGREDIENTS = [
  // Proteins
  { name: 'Chicken', category: 'protein' },
  { name: 'Mutton', category: 'protein' },
  { name: 'Beef', category: 'protein' },
  { name: 'Salmon', category: 'protein' },
  { name: 'Shrimp', category: 'protein' },
  { name: 'Eggs', category: 'protein' },
  { name: 'Ricotta / Mozzarella Cheese', category: 'dairy' },
  // Aromatics & Veggies
  { name: 'Garlic', category: 'produce' },
  { name: 'Ginger', category: 'produce' },
  { name: 'Onion', category: 'produce' },
  { name: 'Tomato', category: 'produce' },
  { name: 'Spinach', category: 'produce' },
  { name: 'Avocado', category: 'produce' },
  { name: 'Chili / Chilies', category: 'produce' },
  { name: 'Scallions / Green Onions', category: 'produce' },
  { name: 'Basil', category: 'produce' },
  // Pantry Staples & Dairy
  { name: 'Butter', category: 'dairy' },
  { name: 'Heavy Cream', category: 'dairy' },
  { name: 'Yogurt', category: 'dairy' },
  { name: 'Rice / Basmati', category: 'pantry' },
  { name: 'Pasta / Noodles', category: 'pantry' },
  { name: 'Flour', category: 'pantry' },
  { name: 'Soy Sauce', category: 'pantry' },
  { name: 'Olive Oil', category: 'pantry' },
  { name: 'Peanuts', category: 'pantry' },
];

const FOOD_CATEGORIES = [
  'All',
  'Curries & Stews',
  'Pasta & Italian',
  'Asian & Stir-Fry',
  'Seafood & Bowls',
  'Steakhouse & Grills',
  'Mexican & Street Food',
  'Poultry & Mains',
  'Breakfast & Brunch',
  'Desserts & Baking',
  'Artisanal Pizzas & Breads',
];

const CUISINES = [
  'All',
  'Indian',
  'Desi',
  'Chinese',
  'Italian',
  'Japanese',
  'Mexican',
  'American',
  'Mediterranean',
];

const DIETARY_TAGS = [
  'All',
  'Comfort Food',
  'High Protein',
  'Quick Dinner',
  'Vegetarian Optional',
  'Gluten-Free',
  'Spicy',
  'Gourmet',
];

export default function RecipesHubPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedDietaryTag, setSelectedDietaryTag] = useState('All');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [customIngredientInput, setCustomIngredientInput] = useState('');
  const [pantryDrawerOpen, setPantryDrawerOpen] = useState(false);
  const [matchMode, setMatchMode] = useState<'any' | 'strict'>('any');
  const [sortBy, setSortBy] = useState<'best_match' | 'rating' | 'prep_time' | 'calories'>('best_match');

  useEffect(() => {
    setRecipes(platformStore.getRecipes());
  }, []);

  const toggleIngredient = (ingName: string) => {
    setSelectedIngredients((prev) => {
      const exists = prev.some((i) => i.toLowerCase() === ingName.toLowerCase());
      if (exists) {
        return prev.filter((i) => i.toLowerCase() !== ingName.toLowerCase());
      } else {
        return [...prev, ingName];
      }
    });
  };

  const handleAddCustomIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customIngredientInput.trim();
    if (!trimmed) return;
    if (!selectedIngredients.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedIngredients((prev) => [...prev, trimmed]);
    }
    setCustomIngredientInput('');
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedCuisine('All');
    setSelectedDietaryTag('All');
    setSelectedIngredients([]);
    setSortBy('best_match');
  };

  // Helper function to check if recipe ingredients contain user ingredient
  const checkIngredientMatch = (recipeIngItem: string, userIng: string) => {
    const rLower = recipeIngItem.toLowerCase();
    const uLower = userIng.toLowerCase();

    // Handle slash separated items (e.g. "Rice / Basmati" -> ["rice", "basmati"])
    const uParts = uLower.split('/').map((s) => s.trim());
    return uParts.some((part) => rLower.includes(part));
  };

  // Filter and score recipes
  const recipeMatchDetails = useMemo(() => {
    return recipes.map((recipe) => {
      let matchedCount = 0;
      const matchedItems: string[] = [];

      if (selectedIngredients.length > 0) {
        recipe.ingredients.forEach((ing) => {
          const matched = selectedIngredients.some((uIng) =>
            checkIngredientMatch(ing.item, uIng)
          );
          if (matched) {
            matchedCount++;
            matchedItems.push(ing.item);
          }
        });
      }

      const totalIngredients = recipe.ingredients.length;
      const matchPercentage =
        totalIngredients > 0 ? Math.round((matchedCount / totalIngredients) * 100) : 0;

      return {
        recipe,
        matchedCount,
        matchedItems,
        totalIngredients,
        matchPercentage,
      };
    });
  }, [recipes, selectedIngredients]);

  const filteredAndSortedRecipes = useMemo(() => {
    let list = recipeMatchDetails.filter(({ recipe, matchedCount, matchPercentage }) => {
      // 1. Text Search Match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        recipe.title.toLowerCase().includes(q) ||
        recipe.description.toLowerCase().includes(q) ||
        (recipe.cuisine && recipe.cuisine.toLowerCase().includes(q)) ||
        recipe.category.toLowerCase().includes(q) ||
        (recipe.cuisine_tags && recipe.cuisine_tags.some((t) => t.toLowerCase().includes(q))) ||
        recipe.ingredients.some((ing) => ing.item.toLowerCase().includes(q));

      // 2. Category Match
      const matchesCategory =
        selectedCategory === 'All' ||
        recipe.category.toLowerCase() === selectedCategory.toLowerCase() ||
        recipe.category.toLowerCase().includes(selectedCategory.toLowerCase());

      // 3. Cuisine Match
      const matchesCuisine =
        selectedCuisine === 'All' ||
        (recipe.cuisine && recipe.cuisine.toLowerCase() === selectedCuisine.toLowerCase()) ||
        (recipe.cuisine_tags &&
          recipe.cuisine_tags.some((t) => t.toLowerCase().includes(selectedCuisine.toLowerCase())));

      // 4. Dietary Tag Match
      const matchesDietary =
        selectedDietaryTag === 'All' ||
        recipe.dietary_tags.some((t) => t.toLowerCase() === selectedDietaryTag.toLowerCase());

      // 5. Ingredient Pantry Match
      let matchesPantry = true;
      if (selectedIngredients.length > 0) {
        if (matchMode === 'strict') {
          // In strict mode: at least 40% of the recipe's ingredients or at least 3 matching ingredients must be in the pantry
          matchesPantry = matchPercentage >= 40 || matchedCount >= Math.min(3, recipe.ingredients.length);
        } else {
          // In any mode: at least 1 ingredient must match
          matchesPantry = matchedCount > 0;
        }
      }

      return matchesSearch && matchesCategory && matchesCuisine && matchesDietary && matchesPantry;
    });

    // Sorting
    list.sort((a, b) => {
      if (selectedIngredients.length > 0 && sortBy === 'best_match') {
        if (b.matchPercentage !== a.matchPercentage) {
          return b.matchPercentage - a.matchPercentage;
        }
        return b.matchedCount - a.matchedCount;
      }
      if (sortBy === 'rating') return b.recipe.rating - a.recipe.rating;
      if (sortBy === 'prep_time')
        return (
          a.recipe.prep_time + a.recipe.cook_time - (b.recipe.prep_time + b.recipe.cook_time)
        );
      if (sortBy === 'calories') return a.recipe.calories - b.recipe.calories;
      return b.recipe.rating - a.recipe.rating;
    });

    return list;
  }, [
    recipeMatchDetails,
    searchQuery,
    selectedCategory,
    selectedCuisine,
    selectedDietaryTag,
    selectedIngredients,
    matchMode,
    sortBy,
  ]);

  const activeFiltersCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedCuisine !== 'All' ? 1 : 0) +
    (selectedDietaryTag !== 'All' ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    selectedIngredients.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Spotlight */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-zinc-950 via-amber-950/30 to-zinc-950 p-8 sm:p-12 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3.5 py-1 text-xs font-mono font-bold text-amber-300">
            <ChefHat className="w-4 h-4" />
            <span>MICHELIN SCIENTIFIC RECIPES & PANTRY MATCHER</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            The Kitchen Lab & Pantry Hub
          </h1>
          <p className="text-base text-zinc-300 leading-relaxed">
            Distraction-free culinary blueprints. Filter by food categories, authentic world cuisines
            (Indian, Desi, Chinese, Italian, Japanese, Mexican), or choose what ingredients you have in your fridge to discover immediate recipes!
          </p>
        </div>
      </div>

      {/* PANTRY INGREDIENT MATCHER TOOLBAR */}
      <div className="rounded-3xl border border-amber-500/30 bg-zinc-900/90 p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>What Ingredients Do You Have?</span>
                {selectedIngredients.length > 0 && (
                  <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-zinc-950 font-mono">
                    {selectedIngredients.length} Active
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                Pick ingredients below to instantly filter recipes you can cook right now.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {selectedIngredients.length > 0 && (
              <>
                <div className="inline-flex rounded-xl bg-zinc-950 border border-zinc-800 p-1">
                  <button
                    onClick={() => setMatchMode('any')}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                      matchMode === 'any'
                        ? 'bg-amber-500 text-zinc-950 shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Contains Ingredients
                  </button>
                  <button
                    onClick={() => setMatchMode('strict')}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                      matchMode === 'strict'
                        ? 'bg-amber-500 text-zinc-950 shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Strict Pantry Match
                  </button>
                </div>

                <button
                  onClick={() => setSelectedIngredients([])}
                  className="flex items-center gap-1 rounded-xl bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Pantry</span>
                </button>
              </>
            )}

            <button
              onClick={() => setPantryDrawerOpen(!pantryDrawerOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{pantryDrawerOpen ? 'Hide Full Pantry' : 'Browse All Ingredients'}</span>
            </button>
          </div>
        </div>

        {/* Selected Ingredients Pills */}
        {selectedIngredients.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase mr-1">
              Your Pantry:
            </span>
            {selectedIngredients.map((ing) => (
              <span
                key={ing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 px-3 py-1 text-xs font-bold text-amber-200"
              >
                <span>{ing}</span>
                <button
                  onClick={() => toggleIngredient(ing)}
                  className="rounded-full hover:bg-amber-500/40 p-0.5"
                  title="Remove"
                >
                  <X className="w-3 h-3 text-amber-300" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Popular Quick Ingredient Selector */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {POPULAR_PANTRY_INGREDIENTS.slice(0, pantryDrawerOpen ? undefined : 14).map((ing) => {
              const isSelected = selectedIngredients.some(
                (i) => i.toLowerCase() === ing.name.toLowerCase()
              );
              return (
                <button
                  key={ing.name}
                  onClick={() => toggleIngredient(ing.name)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/25 scale-105'
                      : 'bg-zinc-950 text-zinc-300 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-850 hover:text-white'
                  }`}
                >
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400/60" />
                  )}
                  <span>{ing.name}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Ingredient Input Bar */}
          <form onSubmit={handleAddCustomIngredient} className="flex max-w-md items-center gap-2 pt-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Type custom ingredient (e.g. Paneer, Fenugreek, Cumin)..."
                value={customIngredientInput}
                onChange={(e) => setCustomIngredientInput(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!customIngredientInput.trim()}
              className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-400 disabled:opacity-40 transition-all"
            >
              + Add to Pantry
            </button>
          </form>
        </div>
      </div>

      {/* MULTI-TIER FILTER STRIP: SEARCH, CATEGORIES, CUISINES & TAGS */}
      <div className="space-y-4">
        {/* Row 1: Search & Sorting */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by title, ingredient, cuisine (e.g. Butter Chicken, Biryani, Ziti)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Sort Selector & Reset */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-1.5">
              <span className="text-xs text-zinc-400 font-mono">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="best_match" className="bg-zinc-900 text-white">
                  Best Pantry Match
                </option>
                <option value="rating" className="bg-zinc-900 text-white">
                  Top Community Rated
                </option>
                <option value="prep_time" className="bg-zinc-900 text-white">
                  Quickest Time
                </option>
                <option value="calories" className="bg-zinc-900 text-white">
                  Lowest Calories
                </option>
              </select>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All ({activeFiltersCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: CUISINE TAGS BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 border-t border-zinc-850 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 flex-shrink-0">
            <Globe2 className="w-3.5 h-3.5" />
            <span>CUISINES:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            {CUISINES.map((cuisine) => {
              const isSelected = selectedCuisine === cuisine;
              return (
                <button
                  key={cuisine}
                  onClick={() => setSelectedCuisine(cuisine)}
                  className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/25'
                      : 'bg-zinc-900/90 text-zinc-300 border border-zinc-800/80 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {cuisine === 'All' ? 'All Cuisines' : `${cuisine} Cuisine`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: FOOD CATEGORIES BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 flex-shrink-0">
            <Layers className="w-3.5 h-3.5" />
            <span>CATEGORIES:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            {FOOD_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/25'
                      : 'bg-zinc-900/90 text-zinc-300 border border-zinc-800/80 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {cat === 'All' ? 'All Food Categories' : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 4: DIETARY & LIFESTYLE TAGS */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-pink-400 flex-shrink-0">
            <Tag className="w-3.5 h-3.5" />
            <span>LIFESTYLE:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            {DIETARY_TAGS.map((tag) => {
              const isSelected = selectedDietaryTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedDietaryTag(tag)}
                  className={`rounded-xl px-3 py-1 text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-pink-500 text-zinc-950 font-bold shadow-md shadow-pink-500/25'
                      : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800/60 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Header Counter */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span>Showing</span>
          <span className="font-bold text-white font-mono">{filteredAndSortedRecipes.length}</span>
          <span>of</span>
          <span className="font-mono text-zinc-300">{recipes.length} Master Recipes</span>
          {selectedIngredients.length > 0 && (
            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-amber-300 font-bold">
              Matching your selected ingredients
            </span>
          )}
        </div>

        {filteredAndSortedRecipes.length === 0 && (
          <button
            onClick={clearAllFilters}
            className="text-amber-400 hover:underline font-bold"
          >
            Clear filters to show all recipes
          </button>
        )}
      </div>

      {/* Recipes Grid */}
      {filteredAndSortedRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAndSortedRecipes.map(
            ({ recipe, matchedCount, totalIngredients, matchPercentage, matchedItems }) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl transition-all hover:border-amber-500/50 hover:bg-zinc-900 hover:-translate-y-1"
              >
                {/* Hero Image & Badges */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
                  <Image
                    src={recipe.hero_image_url}
                    alt={recipe.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Top Left Tags: Cuisine & Category */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {recipe.cuisine && (
                      <span className="rounded-full bg-cyan-950/90 border border-cyan-500/50 px-2.5 py-0.5 text-[11px] font-mono font-bold text-cyan-300 backdrop-blur-sm">
                        {recipe.cuisine}
                      </span>
                    )}
                    <span className="rounded-full bg-black/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-500/30 backdrop-blur-sm">
                      {recipe.category}
                    </span>
                  </div>

                  {/* Top Right: Pantry Match Score Pill */}
                  {selectedIngredients.length > 0 && matchedCount > 0 && (
                    <div className="absolute top-3 right-3 rounded-full bg-emerald-950/90 border border-emerald-500/60 px-3 py-1 text-xs font-mono font-bold text-emerald-300 shadow-lg backdrop-blur-sm">
                      ✨ {matchedCount}/{totalIngredients} Matched ({matchPercentage}%)
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    {/* Metrics Bar */}
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-1 font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{recipe.rating}</span>
                        <span className="text-zinc-500 font-normal">({recipe.rating_count})</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          {recipe.prep_time + recipe.cook_time} mins
                        </span>
                        <span className="font-mono text-zinc-300">{recipe.calories} kcal</span>
                      </div>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                      {recipe.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {recipe.description}
                    </p>

                    {/* Pantry Match Details */}
                    {selectedIngredients.length > 0 && matchedItems.length > 0 && (
                      <div className="mt-3 rounded-xl bg-zinc-950/80 border border-emerald-900/40 p-2.5 text-[11px] space-y-1">
                        <div className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Includes from your pantry:</span>
                        </div>
                        <p className="text-zinc-300 line-clamp-1 italic">
                          {matchedItems.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Dietary & Cuisine Tags Footer */}
                  <div className="mt-5 flex flex-wrap gap-1.5 border-t border-zinc-800/80 pt-3.5">
                    {recipe.cuisine_tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 text-[11px] font-medium text-cyan-300"
                      >
                        {tag}
                      </span>
                    ))}
                    {recipe.dietary_tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            )
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-12 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No Recipes Match Your Exact Criteria</h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Try removing some pantry ingredient filters, changing your cuisine selection, or searching with broader keywords.
          </p>
          <button
            onClick={clearAllFilters}
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-all"
          >
            Clear All Active Filters
          </button>
        </div>
      )}

      {/* In-Content Placement */}
      <AdSlot slot="in_content" label="KITCHEN HUB LEADERBOARD (728x90)" />
    </div>
  );
}

