'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Utensils,
  Star,
  ChefHat,
  Share2,
  Printer,
  CheckCircle2,
  ArrowDownCircle,
  Plus,
  Minus,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { platformStore } from '@/lib/data/store';
import { Recipe } from '@/lib/types';
import { RecipeJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { AdSlot } from '@/components/monetization/AdSlot';
import { SaveRecipeButton } from '@/components/account/SaveRecipeButton';
import { CommentSection } from '@/components/account/CommentSection';
import { AuthModal } from '@/components/auth/AuthModal';

export default function SingleRecipePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [servingsMultiplier, setServingsMultiplier] = useState<number>(1);
  const [checkedIngredients, setCheckedIngredients] = useState<{ [key: string]: boolean }>({});
  const [completedSteps, setCompletedSteps] = useState<{ [key: number]: boolean }>({});
  const [copied, setCopied] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const r = platformStore.getRecipeBySlug(slug);
    if (r) {
      setRecipe(r);
    }
  }, [slug]);

  if (!recipe && typeof window !== 'undefined') {
    const r = platformStore.getRecipeBySlug(slug);
    if (!r) return notFound();
  }

  if (!recipe) return null;

  const currentServings = Math.round(recipe.servings * servingsMultiplier);

  const handleScaleServings = (delta: number) => {
    const next = servingsMultiplier + delta;
    if (next >= 0.5 && next <= 4) {
      setServingsMultiplier(Number(next.toFixed(2)));
    }
  };

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) => ({ ...prev, [stepNumber]: !prev[stepNumber] }));
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const scrollToRecipe = () => {
    const target = document.getElementById('recipe-card');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Dynamic JSON-LD Recipe Schema & Breadcrumbs */}
      <RecipeJsonLd recipe={recipe} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://ultimatum.gg' },
          { name: 'Kitchen Vault', url: 'https://ultimatum.gg/recipes' },
          { name: recipe.title, url: `https://ultimatum.gg/recipes/${recipe.slug}` },
        ]}
      />

      {/* Top Navigation & Jump to Recipe Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <Link
          href="/recipes"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-amber-400 transition-colors tap-target"
        >
          <ArrowLeft className="w-4 h-4 flex-shrink-0" />
          <span>Back to The Kitchen Vault</span>
        </Link>

        {/* PROMINENT JUMP TO RECIPE BUTTON & ACTIONS */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={scrollToRecipe}
            className="flex items-center gap-2 rounded-2xl bg-amber-500 px-4 sm:px-5 py-2.5 text-xs font-black text-zinc-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all hover:scale-105 tap-target"
          >
            <ArrowDownCircle className="w-4 h-4 flex-shrink-0" />
            <span>JUMP TO RECIPE</span>
          </button>

          <SaveRecipeButton
            recipeId={recipe.id}
            recipeSlug={recipe.slug}
            recipeTitle={recipe.title}
            onAuthRequired={() => setAuthModalOpen(true)}
          />

          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white tap-target"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white tap-target"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Header & Title Section */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {recipe.cuisine && (
            <span className="rounded-full bg-cyan-950/90 border border-cyan-500/50 px-3 py-1 text-xs font-mono font-bold text-cyan-300">
              {recipe.cuisine} Cuisine
            </span>
          )}
          <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-mono font-bold text-amber-400">
            {recipe.category}
          </span>
          {recipe.cuisine_tags?.map((ctag) => (
            <span
              key={ctag}
              className="rounded-full bg-zinc-900 border border-cyan-900/50 px-3 py-1 text-xs text-cyan-200 font-medium"
            >
              {ctag}
            </span>
          ))}
          {recipe.dietary_tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs text-zinc-300 font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
          {recipe.title}
        </h1>

        <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal">
          {recipe.description}
        </p>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs sm:text-sm text-zinc-400 border-t border-zinc-800/80 pt-4">
          <div className="flex items-center gap-2 text-white font-medium">
            <div className="h-7 w-7 rounded-full bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              <ChefHat className="w-4 h-4" />
            </div>
            <span>Developed by {recipe.author}</span>
          </div>

          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <Star className="w-4 h-4 fill-amber-400" />
            <span>{recipe.rating}</span>
            <span className="text-zinc-500 font-normal">({recipe.rating_count} community reviews)</span>
          </div>
        </div>
      </header>

      {/* High-Resolution Hero Visual */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-zinc-800 shadow-2xl">
        <Image
          src={recipe.hero_image_url}
          alt={recipe.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 896px"
          className="object-cover"
        />
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-5 shadow-xl">
        <div className="text-center">
          <span className="text-[10px] sm:text-[11px] font-mono uppercase text-zinc-400">Prep Time</span>
          <div className="mt-1 text-base sm:text-lg font-bold text-white">{recipe.prep_time} mins</div>
        </div>
        <div className="text-center">
          <span className="text-[10px] sm:text-[11px] font-mono uppercase text-zinc-400">Cook Time</span>
          <div className="mt-1 text-base sm:text-lg font-bold text-white">{recipe.cook_time} mins</div>
        </div>
        <div className="text-center">
          <span className="text-[10px] sm:text-[11px] font-mono uppercase text-zinc-400">Base Servings</span>
          <div className="mt-1 text-base sm:text-lg font-bold text-amber-400">{recipe.servings} portions</div>
        </div>
        <div className="text-center">
          <span className="text-[10px] sm:text-[11px] font-mono uppercase text-zinc-400">Calories</span>
          <div className="mt-1 text-base sm:text-lg font-bold text-cyan-400">{recipe.calories} kcal</div>
        </div>
      </div>

      {/* Narrative & Culinary Science Notes */}
      <div className="prose prose-invert max-w-none text-zinc-300 space-y-4">
        <h3 className="text-xl font-bold text-white">Why This Blueprint Works</h3>
        <p className="leading-relaxed text-sm sm:text-base">
          Standard recipes often suffer from inconsistent moisture loss and uneven caramelization. In the Ultimatum Kitchen test trials, we established that par-cooking pasta precisely 2 minutes short of al dente allows the pasta core to absorb the savory San Marzano tomato emulsion without turning mushy during high-heat broiling.
        </p>
      </div>

      {/* IN-CONTENT AD PLACEMENT (MID-ARTICLE) */}
      <AdSlot slot="in_content" label="IN-CONTENT RECIPE MID-BANNER (728x90)" />

      {/* 2. THE DEDICATED RECIPE CARD (Target of Jump to Recipe) */}
      <section
        id="recipe-card"
        className="scroll-mt-24 rounded-3xl border border-amber-500/40 bg-zinc-950 p-5 sm:p-8 md:p-10 shadow-2xl space-y-6 sm:space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              <span>Official Recipe Card</span>
            </div>
            <h2 className="mt-1 text-xl sm:text-2xl md:text-3xl font-black text-white">{recipe.title}</h2>
          </div>

          {/* DYNAMIC SERVINGS SCALER */}
          <div className="flex items-center gap-3 rounded-2xl bg-zinc-900 border border-zinc-800 px-4 py-2 w-fit">
            <span className="text-xs font-mono text-zinc-400 uppercase">Servings:</span>
            <button
              onClick={() => handleScaleServings(-0.5)}
              disabled={servingsMultiplier <= 0.5}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-30 tap-target"
              title="Decrease Servings"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="min-w-[2.5rem] text-center font-bold text-amber-400 font-mono text-base">
              {currentServings}
            </span>
            <button
              onClick={() => handleScaleServings(0.5)}
              disabled={servingsMultiplier >= 4}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-30 tap-target"
              title="Increase Servings"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* INGREDIENTS CHECKLIST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-400" />
              <span>Ingredients (Scaled for {currentServings} Servings)</span>
            </h3>
            <span className="text-xs text-zinc-500">Check off as you cook</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recipe.ingredients.map((ing, idx) => {
              const scaledAmount = Number((ing.amount * servingsMultiplier).toFixed(2));
              const isChecked = checkedIngredients[idx];

              return (
                <div
                  key={idx}
                  onClick={() => toggleIngredient(idx)}
                  className={`flex items-start gap-3 rounded-xl p-3.5 border transition-all cursor-pointer select-none ${
                    isChecked
                      ? 'bg-zinc-900/40 border-zinc-800 text-zinc-500 line-through'
                      : 'bg-zinc-900/90 border-zinc-800/80 text-zinc-200 hover:border-amber-500/50'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-all ${
                      isChecked
                        ? 'bg-amber-500 border-amber-500 text-zinc-950'
                        : 'border-zinc-700 bg-zinc-800'
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                  </div>

                  <div className="text-sm">
                    <span className="font-bold text-amber-400 font-mono">
                      {scaledAmount} {ing.unit}
                    </span>{' '}
                    <span className={isChecked ? 'text-zinc-500' : 'text-zinc-100 font-medium'}>
                      {ing.item}
                    </span>
                    {ing.notes && (
                      <span className="ml-1 text-xs text-zinc-400 italic">({ing.notes})</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP-BY-STEP INSTRUCTIONS CHECKLIST */}
        <div className="space-y-6 pt-4 border-t border-zinc-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-amber-400" />
            <span>Step-by-Step Cooking Instructions</span>
          </h3>

          <div className="space-y-4">
            {recipe.instructions.map((inst) => {
              const isStepDone = completedSteps[inst.step];

              return (
                <div
                  key={inst.step}
                  onClick={() => toggleStep(inst.step)}
                  className={`rounded-2xl border p-5 transition-all cursor-pointer ${
                    isStepDone
                      ? 'bg-zinc-900/30 border-zinc-800/60 opacity-60'
                      : 'bg-zinc-900/90 border-zinc-800 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-black transition-all ${
                          isStepDone
                            ? 'bg-emerald-500 text-zinc-950'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}
                      >
                        {isStepDone ? '✓' : inst.step}
                      </div>
                      <h4 className="text-base font-bold text-white">
                        {inst.title || `Step ${inst.step}`}
                      </h4>
                    </div>

                    <span className="text-[11px] font-mono text-zinc-500">
                      {isStepDone ? 'Completed' : 'Click to complete'}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-zinc-300 leading-relaxed pl-10">
                    {inst.instruction}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* NUTRITION TELEMETRY */}
        {recipe.nutrition && (
          <div className="rounded-2xl bg-zinc-900 p-5 border border-zinc-800 space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Verified Nutritional Telemetry (Per Serving)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-xl bg-zinc-950 p-2.5">
                <div className="text-[11px] text-zinc-400 uppercase font-mono">Protein</div>
                <div className="font-bold text-sm text-white">{recipe.nutrition.protein}</div>
              </div>
              <div className="rounded-xl bg-zinc-950 p-2.5">
                <div className="text-[11px] text-zinc-400 uppercase font-mono">Carbs</div>
                <div className="font-bold text-sm text-white">{recipe.nutrition.carbs}</div>
              </div>
              <div className="rounded-xl bg-zinc-950 p-2.5">
                <div className="text-[11px] text-zinc-400 uppercase font-mono">Fat</div>
                <div className="font-bold text-sm text-white">{recipe.nutrition.fat}</div>
              </div>
              <div className="rounded-xl bg-zinc-950 p-2.5">
                <div className="text-[11px] text-zinc-400 uppercase font-mono">Fiber</div>
                <div className="font-bold text-sm text-white">{recipe.nutrition.fiber}</div>
              </div>
            </div>
          </div>
        )}

        {/* COMMUNITY COMMENTS & FEEDBACK */}
        <CommentSection
          contentType="recipe"
          contentId={recipe.id}
          contentSlug={recipe.slug}
          onAuthRequired={() => setAuthModalOpen(true)}
        />
      </section>

      {/* Auth Modal for Guests */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </article>
  );
}
