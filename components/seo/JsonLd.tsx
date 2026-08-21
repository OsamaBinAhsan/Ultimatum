import React from 'react';
import { Recipe, Review, Game } from '@/lib/types';

interface RecipeJsonLdProps {
  recipe: Recipe;
}

export function RecipeJsonLd({ recipe }: RecipeJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description,
    image: [recipe.hero_image_url],
    author: {
      '@type': 'Person',
      name: recipe.author,
    },
    datePublished: recipe.created_at,
    prepTime: `PT${recipe.prep_time}M`,
    cookTime: `PT${recipe.cook_time}M`,
    totalTime: `PT${recipe.prep_time + recipe.cook_time}M`,
    recipeYield: `${recipe.servings} servings`,
    recipeCategory: recipe.category,
    recipeCuisine: recipe.cuisine,
    keywords: [
      recipe.cuisine ? `${recipe.cuisine} Cuisine` : null,
      ...(recipe.cuisine_tags || []),
      ...recipe.dietary_tags,
    ]
      .filter(Boolean)
      .join(', '),
    nutrition: {
      '@type': 'NutritionInformation',
      calories: `${recipe.calories} calories`,
      proteinContent: recipe.nutrition?.protein,
      carbohydrateContent: recipe.nutrition?.carbs,
      fatContent: recipe.nutrition?.fat,
      fiberContent: recipe.nutrition?.fiber,
    },
    recipeIngredient: recipe.ingredients.map(
      (ing) => `${ing.amount} ${ing.unit} ${ing.item}${ing.notes ? ` (${ing.notes})` : ''}`
    ),
    recipeInstructions: recipe.instructions.map((inst) => ({
      '@type': 'HowToStep',
      name: inst.title || `Step ${inst.step}`,
      text: inst.instruction,
      position: inst.step,
    })),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: recipe.rating,
      ratingCount: recipe.rating_count,
      bestRating: '5',
      worstRating: '1',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ReviewJsonLdProps {
  review: Review;
}

export function ReviewJsonLd({ review }: ReviewJsonLdProps) {
  const isTech = review.category === 'tech_hardware';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': isTech ? 'Product' : 'Service',
      name: review.product_name,
      image: review.hero_image_url,
      description: review.summary,
      ...(review.affiliate_link && {
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          url: review.affiliate_link,
          seller: {
            '@type': 'Organization',
            name: review.affiliate_retailer || 'Partner Retailer',
          },
        },
      }),
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': 'Person',
      name: review.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Ultimatum Lab',
      url: 'https://ultimatum.gg',
    },
    datePublished: review.created_at,
    reviewBody: `${review.summary} Verdict: ${review.verdict}`,
    positiveNotes: {
      '@type': 'ItemList',
      itemListElement: review.pros.map((pro, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: pro,
      })),
    },
    negativeNotes: {
      '@type': 'ItemList',
      itemListElement: review.cons.map((con, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: con,
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface GameJsonLdProps {
  game: Game;
}

export function GameJsonLd({ game }: GameJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.title,
    description: game.description,
    image: game.thumbnail_url,
    genre: [game.category, 'Arcade', 'HTML5 Game'],
    playMode: 'SinglePlayer',
    applicationCategory: 'Game',
    operatingSystem: 'Any (Web Browser)',
    author: {
      '@type': 'Organization',
      name: 'Ultimatum Arcade',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
