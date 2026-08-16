# Ultimatum — Lifestyle, Michelin Kitchen & Retro Arcade Gaming Platform

A modern, high-traffic, monetizable web platform engineered with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL, RLS, RPC Functions)**.

---

## 🌟 Key Platform Features

### 1. 🕹️ The Arcade (`/games` & `/games/[slug]`)
* **Interactive HTML5 Canvas Arcade Engine**: Playable retro space shooter ("Neon Asteroid Blitz") featuring particle systems, synthesized sound FX (Web Audio API), powerups, score multipliers, and full-screen support.
* **Live Weekly Leaderboards**: Real-time score submission with rank medals (🥇 Gold, 🥈 Silver, 🥉 Bronze) and user engagement XP rewards.
* **Rewarded Video Ad Units**: Dedicated 5-second simulated video ad stream allowing players to revive their spaceship with an extra life and double XP.

### 2. 🍳 The Kitchen (`/recipes` & `/recipes/[slug]`)
* **Dynamic JSON-LD `Recipe` Schema**: Rich SEO structured data in `<head>` (prepTime, cookTime, ingredients, instructions, nutrition telemetry, aggregate rating).
* **"Jump to Recipe" Button**: Instant smooth scroll directly to the recipe card.
* **Interactive Dynamic Servings Scaler**: Live recalculation of ingredient amounts when scaling portions up or down.
* **Interactive Checklists**: Checkable ingredients and step-by-step cooking progress.
* **Nutrition Telemetry**: Macros (protein, carbs, fat, fiber) per portion.

### 3. 🔬 The Lab (`/reviews` & `/reviews/[slug]`)
* **Distinct Review Layouts**:
  * **Tech & Hardware Variant**: Benchmarks, CNC Chassis / thermal telemetry, hardware teardown score rings, hot-swap sensor analysis.
  * **Food Delivery Variant**: Packaging freshness scores, Michelin flavor ratings, delivery temperature stability.
* **Dynamic JSON-LD `Review` & `Product` Schema**: Structured data for search engine rich snippets.
* **Pros & Cons Matrix**: Clean comparison cards with visual indicators.
* **Affiliate Monetization Callouts**: Clear FTC disclosure with high-converting CTA buttons.

### 4. 🚀 Dynamic Custom Sub-Pages & Routes (`/pages/[slug]`)
* **Admin Page Creator**: Admins can spawn infinite custom sub-pages at runtime with custom URLs, rich markdown/HTML content, SEO meta tags, and configurable ad slot visibility.

### 5. 🛡️ Super Admin CMS Panel (`/admin`)
* **Dark-Mode Sidebar Shell**: Analytics overview, content hubs, moderation tables.
* **Recipe CMS**: Dynamic ingredient row builder (`+ Add Ingredient`) and step editor.
* **Review CMS**: Hardware vs Food selector, pros/cons tag builder, spec key-value matrix.
* **Game Vault**: Deploy canvas games, toggle sponsored partner flags.
* **Leaderboard Moderation & Anti-Cheat**: Inspect submitted scores, delete fraudulent entries with one click, and trigger immediate Weekly Leaderboard Resets.
* **User Governance**: Promote Super Admins, adjust points, award custom badges, and ban abusive accounts.
* **Sponsor Setup & Banner Tracking**: Direct ad campaigns with impression and CTR telemetry.
* **Master Site Settings**: Master ad switches to toggle individual ad zones (header billboard, sidebar, in-content, sticky footer, rewarded video ads) ON or OFF.

### 6. 💰 Monetization & Ad Placement Containers
* Clear, marked containers (`<AdSlot />`) for easy drop-in of Google AdSense, Ezoic, or Mediavine tags.
* Full Next/Image WebP image optimization across all hubs.

---

## 🛠️ Tech Stack & Architecture

* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti.
* **Backend & Database**: Supabase PostgreSQL, Row Level Security (RLS), Stored Procedures (`reset_weekly_leaderboards`, `record_game_score`, `track_sponsor_impression`), Isomorphic client (`lib/supabase/client.ts`).
* **Deployment Target**: Vercel.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database (Optional)
Run the migration script in `supabase/schema.sql` inside your Supabase SQL Editor.
Create a `.env.local` file based on `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

*Note: The platform features a full in-memory and LocalStorage fallback store (`lib/data/store.ts`), meaning all pages, games, and admin CMS actions work out of the box with zero external dependencies.*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Access Admin CMS
Visit [http://localhost:3000/admin](http://localhost:3000/admin) to manage recipes, reviews, arcade games, custom sub-pages, users, and ad placements.
