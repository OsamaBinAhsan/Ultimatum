# Ultimatum — Lifestyle, Michelin Kitchen & Retro Arcade Gaming Platform

A modern, high-traffic, monetizable web platform engineered with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **MySQL (HostGator / cPanel / MariaDB)**.

---

## 🌟 Key Platform Features

### 1. 🕹️ The Arcade (`/games` & `/games/[slug]`)
* **Interactive HTML5 Canvas Arcade Engine**: Playable retro arcade games featuring particle systems, synthesized sound FX (Web Audio API), powerups, score multipliers, and full-screen support.
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

### 4. 📅 Post Scheduler & Event Manager (`/admin/scheduler`)
* **Future Post Scheduling**: Schedule recipes, hardware teardowns, and blogs to auto-publish at future release dates.
* **Automated Publisher Worker**: Background worker (`/api/scheduler/publish`) and audit logger (`scheduler_log`).

### 5. 🛡️ Super Admin CMS Panel (`/admin`)
* **Dark-Mode Sidebar Shell**: Analytics overview, content hubs, moderation tables.
* **Recipe CMS**: Dynamic ingredient row builder (`+ Add Ingredient`) and step editor with release scheduler panel.
* **Review CMS**: Hardware vs Food selector, pros/cons tag builder, spec key-value matrix.
* **Game Vault**: Deploy canvas games, toggle sponsored partner flags.
* **Leaderboard Moderation**: Inspect submitted scores, delete fraudulent entries with one click, and trigger immediate Weekly Leaderboard Resets.
* **User Governance**: Promote Super Admins, adjust points, award custom badges, and ban abusive accounts.
* **Sponsor Setup & Banner Tracking**: Direct ad campaigns with impression and CTR telemetry.
* **Master Site Settings**: Master ad switches to toggle individual ad zones (header billboard, sidebar, in-content, sticky footer, rewarded video ads) ON or OFF.

### 6. 💰 Monetization & Ad Placement Containers
* Clear, marked containers (`<AdSlot />`) for easy drop-in of Google AdSense, Ezoic, or Mediavine tags.
* Full Next/Image WebP image optimization across all hubs.

---

## 🛠️ Tech Stack & Architecture

* **Frontend**: Next.js 16 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti.
* **Backend & Database**: Hosted MySQL (`mysql2/promise`), custom Node.js Socket.io server (`server.js`).
* **Storage / Fallback**: Canonical MySQL database (`mysql-master-schema.sql` and `sql/add-upgrades.sql`) with in-memory / LocalStorage offline store (`lib/data/store.ts`).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database (Optional)
Run the migration scripts in `mysql-master-schema.sql` and `sql/add-upgrades.sql` inside your phpMyAdmin / MySQL console.
Create a `.env.local` file based on `.env.example`:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_db_user
MYSQL_PASSWORD=your_db_password
MYSQL_DATABASE=your_database_name
SCHEDULER_SECRET=your_scheduler_secret
```

### 3. Run Development Server
```bash
node server.js
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Access Admin CMS
Visit [http://localhost:3000/admin](http://localhost:3000/admin) to manage recipes, reviews, arcade games, custom sub-pages, users, and ad placements.
