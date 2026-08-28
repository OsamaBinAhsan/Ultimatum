# ULTIMATUM PLATFORM — MASTER SYSTEM DOCUMENTATION & ARCHITECTURE SPECIFICATION

> **Version:** 1.0.0  
> **Target Framework:** Next.js 16 (App Router) / React 18 / TypeScript 5.7 / Tailwind CSS 3.4  
> **Backend & Realtime:** Node.js Custom HTTP Server / Socket.io 4.8 / Microsoft SQL Server (MSSQL / Azure SQL)  
> **Repository Corpus:** `OsamaBinAhsan/Ultimatum`  

---

## 📑 TABLE OF CONTENTS
1. [Executive Summary & Platform Vision](#1-executive-summary--platform-vision)
2. [High-Level Architectural Blueprint](#2-high-level-architectural-blueprint)
3. [Complete Codebase & Directory Structure](#3-complete-codebase--directory-structure)
4. [Database Architecture & Master SQL Schema](#4-database-architecture--master-sql-schema)
5. [Data Access Layer & Dual-Storage Resiliency](#5-data-access-layer--dual-storage-resiliency)
6. [Real-Time Multiplayer Engine & WebSocket Protocol](#6-real-time-multiplayer-engine--websocket-protocol)
7. [The Arcade: HTML5 Canvas Gaming Vault](#7-the-arcade-html5-canvas-gaming-vault)
8. [The Kitchen: Michelin-Standard Culinary CMS](#8-the-kitchen-michelin-standard-culinary-cms)
9. [The Lab: Hardware Benchmarks & Food Teardowns](#9-the-lab-hardware-benchmarks--food-teardowns)
10. [Editorial Hubs: Newsroom & Cyberpunk Fashion](#10-editorial-hubs-newsroom--cyberpunk-fashion)
11. [User Progression, Merits & Community Engine](#11-user-progression-merits--community-engine)
12. [Super Admin CMS Management Suite](#12-super-admin-cms-management-suite)
13. [Monetization, Direct Sponsors & Ad Switches](#13-monetization-direct-sponsors--ad-switches)
14. [SEO Architecture & JSON-LD Structured Data](#14-seo-architecture--json-ld-structured-data)
15. [REST API Endpoint Reference](#15-rest-api-endpoint-reference)
16. [Environment Variables, Configuration & Deployment](#16-environment-variables-configuration--deployment)

---

## 1. EXECUTIVE SUMMARY & PLATFORM VISION

**Ultimatum** is a high-traffic, multi-vertical digital ecosystem designed to converge four high-engagement content verticals under a unified gamified platform:

1. **🕹️ The Arcade (`/games`)**: Interactive 60 FPS HTML5 Canvas games with Web Audio API sound synthesis, weekly global leaderboards, and rewarded ad units.
2. **🍳 The Kitchen (`/recipes`)**: Michelin-inspired culinary repository featuring dynamic portion scalers, step-by-step interactive cooking checklists, macro telemetry, and Rich JSON-LD Recipe Schema.
3. **🔬 The Lab (`/reviews`)**: In-depth hardware teardowns, thermal/silicon benchmarks, and food delivery packaging analysis with FTC affiliate integration.
4. **📰 Editorial & Lifestyle (`/news` & `/beauty-fashion`)**: Breaking tech/gaming news, cyberpunk modular techwear, dermatological skincare science, and shoppable affiliate carousels.

### Key Gamification & Monetization Loops
* **Universal XP & Streaks**: Users accumulate XP through high scores, reading articles (25-second merit tracker), and co-op shifts.
* **Dual-Engine Monetization**: Master-switched IAB-compliant ad slots (AdSense/Ezoic ready), direct sponsor banner tracking (impressions & CTR), and 5-second simulated rewarded video ads for in-game revives.

---

## 2. HIGH-LEVEL ARCHITECTURAL BLUEPRINT

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT BROWSERS                                   |
|   Next.js 16 Client Components / Canvas Game Engines / Tailwind UI / Confetti FX   |
+--------------------------+---------------------------------+----------------------+
                           |                                 |
              HTTPS / REST API Requests             WebSocket (Socket.io)
                           |                                 |
                           v                                 v
+-----------------------------------------------------------------------------------+
|                        CUSTOM NODE.JS SERVER (server.js)                          |
|  - Next.js App Router Request Handler                                            |
|  - Socket.io Real-Time Engine (20 Ticks/sec, Room Orchestration, State Sync)     |
|  - 60-Second Background Post Scheduler Worker (Calls /api/scheduler/publish)      |
+--------------------------+---------------------------------+----------------------+
                           |                                 |
                           v                                 v
+------------------------------------+   +------------------------------------------+
|  MICROSOFT SQL SERVER / AZURE SQL  |   |  IN-MEMORY & LOCALSTORAGE FALLBACK STORE |
|  - Tables: profiles, games,        |   |  - PlatformStore (lib/data/store.ts)     |
|    leaderboards, recipes, reviews, |   |  - Zero-config standalone execution      |
|    articles, sponsors, comments    |   |  - Automatic scheduled post auto-publish |
+------------------------------------+   +------------------------------------------+
```

### Core Architecture Principles
* **Dual-Layer Data Resiliency**: Every API route and store method attempts execution against Microsoft SQL Server first. If the database is disconnected or unreachable, the system gracefully falls back to the in-memory/LocalStorage `PlatformStore` without crashing or throwing 500 errors to the client.
* **Server-Authoritative Realtime State**: Multiplayer sessions (*Pixel Kitchen Rush*, *Sabotage Circuit*, *The Architect & The Rats*) run on a 20 ticks/second (50ms interval) authoritative loop on `server.js` with compressed state diffs sent over Socket.io.
* **Hybrid Static & Server Rendering**: Next.js App Router handles dynamic SEO metadata (`generateMetadata`), server component rendering for fast First Contentful Paint (FCP), and dynamic client components for game loops and interactive calculators.

---

## 3. COMPLETE CODEBASE & DIRECTORY STRUCTURE

```
Ultimatum/
├── app/                                    # Next.js App Router Root
│   ├── about/page.tsx                      # About Ultimatum company / mission page
│   ├── account/page.tsx                    # User dashboard, XP, badges, saved recipes
│   ├── admin/                              # Super Admin CMS Module
│   │   ├── layout.tsx                      # Admin navigation sidebar & role-gatekeeper
│   │   ├── page.tsx                        # Dashboard overview & analytics telemetry
│   │   ├── games/page.tsx                  # Arcade game vault & sponsor toggles
│   │   ├── leaderboards/page.tsx           # Score moderation & weekly leaderboard resets
│   │   ├── lifestyle/page.tsx              # Beauty & Fashion article CMS
│   │   ├── news/page.tsx                   # Newsroom & editorial article CMS
│   │   ├── pages/page.tsx                  # Custom dynamic sub-pages CMS
│   │   ├── recipes/page.tsx                # Recipe CMS (ingredient/step builder)
│   │   ├── reviews/page.tsx                # Hardware & food review CMS (spec matrix)
│   │   ├── scheduler/page.tsx              # Release scheduler & background worker audit log
│   │   ├── settings/page.tsx               # Master ad switches & maintenance mode
│   │   ├── sponsors/page.tsx               # Direct advertising campaigns & CTR telemetry
│   │   └── users/page.tsx                  # User governance, role promo & points adjustment
│   ├── api/                                # Backend REST API Handlers
│   │   ├── account/
│   │   │   ├── comments/route.ts           # Fetch user comment history
│   │   │   ├── game-stats/route.ts         # User high scores and total plays per game
│   │   │   └── saved-recipes/route.ts      # Bookmark / unbookmark recipes
│   │   ├── auth/
│   │   │   ├── login/route.ts              # Authentication login endpoint
│   │   │   └── signup/route.ts             # Account registration endpoint
│   │   ├── comments/route.ts               # Community comments CRUD & flagging
│   │   ├── cron/publish/route.ts           # Vercel Cron-compatible scheduler hook
│   │   ├── kitchen/payout/route.ts         # In-game coin wallet payouts for kitchen shifts
│   │   ├── leaderboards/
│   │   │   ├── reset/route.ts              # Emergency / scheduled weekly reset
│   │   │   └── route.ts                    # Global & game-specific high scores
│   │   ├── lifestyle/route.ts              # Lifestyle / Beauty articles endpoint
│   │   ├── news/route.ts                   # News & gaming articles endpoint
│   │   ├── pages/route.ts                  # Dynamic custom sub-pages endpoint
│   │   ├── posts/route.ts                  # Universal multi-content query endpoint
│   │   ├── recipes/route.ts                # Recipe catalog CRUD & scheduler filters
│   │   ├── reviews/route.ts                # Review catalog CRUD
│   │   ├── scheduler/
│   │   │   ├── log/route.ts                # Audit logs of auto-published items
│   │   │   └── publish/route.ts            # Scheduled post batch publisher worker
│   │   └── sponsors/route.ts               # Sponsor slot retrieval & telemetry update
│   ├── beauty-fashion/
│   │   ├── [slug]/page.tsx                 # Beauty/Fashion article view with shoppable drawer
│   │   └── page.tsx                        # Beauty & Fashion hub
│   ├── games/
│   │   ├── [slug]/page.tsx                 # Individual game runner, canvas container, leaderboard
│   │   └── page.tsx                        # Arcade game directory & tournament standings
│   ├── media-kit/page.tsx                  # Advertising media kit & demographic telemetry
│   ├── news/
│   │   ├── [slug]/page.tsx                 # News article view with reading XP tracker
│   │   └── page.tsx                        # Newsroom index & breaking news banner
│   ├── pages/[slug]/page.tsx               # Dynamic CMS-rendered sub-page
│   ├── privacy/page.tsx                    # Privacy policy & FTC affiliate disclosure
│   ├── recipes/
│   │   ├── [slug]/page.tsx                 # Interactive recipe card, scaler & JSON-LD
│   │   └── page.tsx                        # Recipe search, category filter & dietary badges
│   ├── reviews/
│   │   ├── [slug]/page.tsx                 # Tech & Food teardowns with pros/cons matrix
│   │   └── page.tsx                        # Hardware lab index & category switchers
│   ├── globals.css                         # Global CSS & Tailwind styling
│   ├── layout.tsx                          # Root layout, Navbar, Footer, Announcement bar
│   └── page.tsx                            # Homepage (Featured spotlight, hubs, top scores)
├── components/
│   ├── account/
│   │   ├── CommentSection.tsx              # Interactive comment stream with optimistic UI
│   │   └── SaveRecipeButton.tsx            # Heart toggle button for bookmarking recipes
│   ├── arcade/
│   │   ├── CanvasGame.tsx                  # Dynamic game engine loader & router
│   │   ├── GameLoadingFallback.tsx         # Skeleton loader for heavy game engines
│   │   └── games/                          # Pure Client-Side HTML5 Canvas Game Engines
│   │       ├── CyberSlicer.tsx             # Synthwave reflex rhythm slicer
│   │       ├── DungeonLootDash.tsx         # 8-bit procedural endless runner
│   │       ├── NeonAsteroidBlitz.tsx       # Physics-based space shooter with particle system
│   │       ├── PixelKitchenRush.tsx        # 4-player co-op cooking simulator (Socket.io)
│   │       ├── SabotageCircuit.tsx         # 5-player asymmetric deception simulator
│   │       └── TheArchitectAndTheRats.tsx  # 1v4 maze deception & escape arena
│   ├── auth/
│   │   └── AuthModal.tsx                   # Modal dialog for user login/signup
│   ├── cms/
│   │   └── SchedulePostPanel.tsx           # Date/time picker widget for scheduling content
│   ├── content/
│   │   └── ArticleBodyRenderer.tsx         # Markdown/HTML renderer (YouTube, callouts, images)
│   ├── layout/
│   │   ├── AnnouncementBar.tsx             # Dismissible global top announcement banner
│   │   ├── Footer.tsx                      # Universal multi-column site footer
│   │   └── Navbar.tsx                      # Responsive top navigation with search & profile modal
│   ├── merits/
│   │   └── ReadingMeritsTracker.tsx        # 25-sec milestone reader XP tracker with confetti
│   ├── monetization/
│   │   ├── AdSlot.tsx                      # Dynamic IAB responsive ad container
│   │   └── RewardedAdModal.tsx             # 5-sec rewarded video simulator for extra life/XP
│   └── seo/
│       └── JsonLd.tsx                      # Schema.org structured data generators
├── lib/
│   ├── data/
│   │   ├── mock-data.ts                    # Seed mock datasets for offline mode
│   │   └── store.ts                        # Unified in-memory/LocalStorage store (`platformStore`)
│   ├── db/
│   │   └── sqlserver.ts                    # MSSQL connection pool & parameterized query runner
│   ├── types.ts                            # Universal TypeScript domain interfaces & types
│   └── utils/
│       └── format.ts                       # Date formatting, score formatting & slug utilities
├── public/                                 # Static assets (images, icons, sound effects)
├── server.js                               # Node.js + Express + Socket.io + Next.js custom server
├── sqlserver-master-schema.sql             # Complete T-SQL schema, tables, indexes, and seed data
├── tailwind.config.js                      # Tailwind CSS configuration & custom theme colors
├── tsconfig.json                           # TypeScript compiler options & path aliases (`@/*`)
└── package.json                            # Scripts, dependencies, and project metadata
```

---

## 4. DATABASE ARCHITECTURE & MASTER SQL SCHEMA

The database is built on **Microsoft SQL Server (MSSQL / Azure SQL)**. The schema is fully defined in `sqlserver-master-schema.sql`.

### Key Tables & Schema Definitions

#### 1. `profiles`
Stores registered user accounts, Super Admin credentials, points, and gamification metadata.
```sql
CREATE TABLE [dbo].[profiles] (
    [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
    [email] NVARCHAR(255) NULL UNIQUE,
    [password_hash] NVARCHAR(MAX) NULL,
    [username] NVARCHAR(150) NOT NULL UNIQUE,
    [avatar_url] NVARCHAR(MAX) NULL,
    [role] NVARCHAR(50) NOT NULL DEFAULT 'user', -- 'user' | 'moderator' | 'admin'
    [points] INT NOT NULL DEFAULT 250,
    [daily_streak] INT NOT NULL DEFAULT 1,
    [last_active_date] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [vip_ad_lite_until] DATETIME2 NULL,
    [badges] NVARCHAR(MAX) NULL, -- JSON array of badge names
    [is_banned] BIT NOT NULL DEFAULT 0,
    [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [updated_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
```

#### 2. `games`
Arcade game catalog with play counts and sponsor affiliations.
```sql
CREATE TABLE [dbo].[games] (
    [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
    [slug] NVARCHAR(255) NOT NULL UNIQUE,
    [title] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(MAX) NOT NULL,
    [category] NVARCHAR(50) NOT NULL DEFAULT 'arcade',
    [thumbnail_url] NVARCHAR(MAX) NOT NULL,
    [game_file_url] NVARCHAR(MAX) NOT NULL,
    [is_sponsored] BIT NOT NULL DEFAULT 0,
    [sponsor_name] NVARCHAR(255) NULL,
    [play_count] INT NOT NULL DEFAULT 0,
    [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [updated_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
```

#### 3. `leaderboards` & `game_stats`
Records weekly tournament submissions and personal high-score stats.
```sql
CREATE TABLE [dbo].[leaderboards] (
    [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
    [user_id] NVARCHAR(64) NOT NULL,
    [game_id] NVARCHAR(64) NOT NULL,
    [score] INT NOT NULL,
    [week_timestamp] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [FK_leaderboards_profiles] FOREIGN KEY ([user_id]) REFERENCES [dbo].[profiles]([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_leaderboards_games] FOREIGN KEY ([game_id]) REFERENCES [dbo].[games]([id]) ON DELETE CASCADE
);

CREATE TABLE [dbo].[game_stats] (
    [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [user_id] NVARCHAR(64) NOT NULL,
    [game_id] NVARCHAR(64) NOT NULL,
    [game_slug] NVARCHAR(255) NOT NULL,
    [game_title] NVARCHAR(255) NOT NULL,
    [high_score] INT NOT NULL DEFAULT 0,
    [total_plays] INT NOT NULL DEFAULT 1,
    [last_played_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [UK_game_stats_user_game] UNIQUE ([user_id], [game_id]),
    CONSTRAINT [FK_game_stats_profiles] FOREIGN KEY ([user_id]) REFERENCES [dbo].[profiles]([id]) ON DELETE CASCADE
);
```

#### 4. `recipes` & `saved_recipes`
Culinary database with JSON-structured ingredients, cooking steps, and dietary tags.
```sql
CREATE TABLE [dbo].[recipes] (
    [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
    [slug] NVARCHAR(255) NOT NULL UNIQUE,
    [title] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(MAX) NOT NULL,
    [hero_image_url] NVARCHAR(MAX) NOT NULL,
    [prep_time] INT NOT NULL,
    [cook_time] INT NOT NULL,
    [servings] INT NOT NULL DEFAULT 4,
    [calories] INT NOT NULL,
    [category] NVARCHAR(100) NOT NULL,
    [cuisine] NVARCHAR(100) NULL,
    [cuisine_tags] NVARCHAR(MAX) NULL, -- JSON array
    [dietary_tags] NVARCHAR(MAX) NULL, -- JSON array
    [ingredients] NVARCHAR(MAX) NOT NULL, -- JSON array of RecipeIngredient
    [instructions] NVARCHAR(MAX) NOT NULL, -- JSON array of RecipeInstruction
    [nutrition] NVARCHAR(MAX) NULL, -- JSON object
    [rating] DECIMAL(3, 1) NOT NULL DEFAULT 4.9,
    [rating_count] INT NOT NULL DEFAULT 128,
    [author] NVARCHAR(255) NOT NULL DEFAULT 'Chef Marco Bellini',
    [status] NVARCHAR(50) NOT NULL DEFAULT 'published', -- 'draft' | 'scheduled' | 'published'
    [scheduled_for] DATETIME2 NULL,
    [published_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [updated_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
```

#### 5. `reviews`
Tech and culinary product teardowns with specs, verdict, and affiliate links.
```sql
CREATE TABLE [dbo].[reviews] (
    [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
    [slug] NVARCHAR(255) NOT NULL UNIQUE,
    [product_name] NVARCHAR(255) NOT NULL,
    [category] NVARCHAR(50) NOT NULL, -- 'tech_hardware' | 'food_lifestyle'
    [rating] DECIMAL(3, 1) NOT NULL,
    [summary] NVARCHAR(MAX) NOT NULL,
    [verdict] NVARCHAR(MAX) NOT NULL,
    [pros] NVARCHAR(MAX) NULL, -- JSON array
    [cons] NVARCHAR(MAX) NULL, -- JSON array
    [specifications] NVARCHAR(MAX) NOT NULL, -- JSON key-value object
    [affiliate_link] NVARCHAR(MAX) NULL,
    [affiliate_retailer] NVARCHAR(255) NULL DEFAULT 'Amazon / Direct Partner',
    [hero_image_url] NVARCHAR(MAX) NOT NULL,
    [author] NVARCHAR(255) NOT NULL DEFAULT 'Ultimatum Lab Editorial Team',
    [status] NVARCHAR(50) NOT NULL DEFAULT 'published',
    [scheduled_for] DATETIME2 NULL,
    [published_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [updated_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
```

#### 6. `articles`
Long-form journalism for Newsroom and Beauty & Fashion.
```sql
CREATE TABLE [dbo].[articles] (
    [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
    [slug] NVARCHAR(255) NOT NULL UNIQUE,
    [title] NVARCHAR(255) NOT NULL,
    [subtitle] NVARCHAR(MAX) NULL,
    [category] NVARCHAR(50) NOT NULL, -- 'beauty_fashion' | 'news_editorial' | 'gaming_news'
    [hero_image_url] NVARCHAR(MAX) NOT NULL,
    [gallery_images] NVARCHAR(MAX) NULL, -- JSON array of URLs
    [content] NVARCHAR(MAX) NOT NULL, -- Markdown / HTML content
    [tags] NVARCHAR(MAX) NULL, -- JSON array
    [author] NVARCHAR(255) NOT NULL,
    [read_time] INT NOT NULL DEFAULT 5,
    [is_breaking] BIT NOT NULL DEFAULT 0,
    [shoppable_items] NVARCHAR(MAX) NULL, -- JSON array of ShoppableItem
    [status] NVARCHAR(50) NOT NULL DEFAULT 'published',
    [scheduled_for] DATETIME2 NULL,
    [published_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [updated_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
```

#### 7. `sponsors`, `pages`, `user_comments`, `scheduler_log`, `site_settings`
```sql
CREATE TABLE [dbo].[sponsors] (
    [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
    [sponsor_name] NVARCHAR(255) NOT NULL,
    [image_url] NVARCHAR(MAX) NOT NULL,
    [destination_url] NVARCHAR(MAX) NOT NULL,
    [slot_position] NVARCHAR(50) NOT NULL,
    [impressions_tracked] INT NOT NULL DEFAULT 0,
    [clicks_tracked] INT NOT NULL DEFAULT 0,
    [is_active] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [updated_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE [dbo].[user_comments] (
    [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [user_id] NVARCHAR(64) NOT NULL,
    [content_type] NVARCHAR(50) NOT NULL,
    [content_id] NVARCHAR(255) NOT NULL,
    [content_slug] NVARCHAR(255) NOT NULL,
    [body] NVARCHAR(MAX) NOT NULL,
    [is_flagged] BIT NOT NULL DEFAULT 0,
    [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE [dbo].[scheduler_log] (
    [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [recipes_published] INT NOT NULL DEFAULT 0,
    [reviews_published] INT NOT NULL DEFAULT 0,
    [articles_published] INT NOT NULL DEFAULT 0,
    [total_published] INT NOT NULL DEFAULT 0,
    [duration_ms] INT NOT NULL DEFAULT 0,
    [notes] NVARCHAR(MAX) NULL,
    [executed_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
```

---

## 5. DATA ACCESS LAYER & DUAL-STORAGE RESILIENCY

The data access layer lives in `lib/db/sqlserver.ts` and `lib/data/store.ts`.

### `querySQLServer` Engine (`lib/db/sqlserver.ts`)
* Configures connection pooling (min: 0, max: 10, idle timeout: 30s) using the `mssql` package.
* Automatically transforms positional parameters (`?`) into T-SQL named parameters (`@p0`, `@p1`, etc.).
* Automatically casts numbers to `sql.Int` / `sql.Float`, booleans to `sql.Bit`, and objects/dates to `sql.DateTime2`.
* Normalizes MySQL backtick syntax (`` `table` ``) into T-SQL square brackets (`[table]`).

### `platformStore` Singleton (`lib/data/store.ts`)
* Acts as an in-memory client and server state store initialized with rich mock data from `lib/data/mock-data.ts`.
* Syncs with browser `localStorage` on client machines.
* Exposes full CRUD methods for `articles`, `recipes`, `reviews`, `games`, `leaderboards`, `sponsors`, `pages`, `comments`, and `settings`.
* Automatically evaluates and auto-publishes scheduled posts whenever queries are executed.

---

## 6. REAL-TIME MULTIPLAYER ENGINE & WEBSOCKET PROTOCOL

All real-time socket communication is hosted inside `server.js` at port 3000 (or `process.env.PORT`).

### Server Loop & State Broadcast
* **Tick Rate**: 20 Hz (every 50 milliseconds).
* **Room Pruning**: Rooms with 0 players or inactive for > 15 minutes are automatically purged from memory.
* **Payload Compression**: Player positions are rounded to integers, and key names are minified (`st`, `cb`, `ap`, `stat`, `tr`) to reduce WebSocket frame size.

### Protocol Specification by Game

#### 1. Pixel Kitchen Rush (Overcooked-style Co-Op)
* `create_room`: Host creates a 4-character room code (e.g. `K7X9`).
* `join_room`: Up to 4 players join with customized chef colors.
* `player_move`: Dispatches `{ x, y, vx, vy }` with server bounds collision checking (80px to 720px width, 140px to 520px height).
* `kitchen_action`: Handles kitchen operations:
  * `pick_ingredient`: Picks `bun`, `raw_patty`, `raw_lettuce`, `raw_tomato`, or `cheese`.
  * `interact_stove`: Places patties to cook (8s timer) or burn (after +6s).
  * `interact_chopping`: Progressively chops lettuce and tomatoes (5 chop hits).
  * `interact_plate`: Combines ingredients onto assembly plates.
  * `serve_order`: Validates plate recipe against active orders, awards points & tips.
  * `toss_trash`: Clears current held item.

#### 2. Sabotage Circuit (5-Player Asymmetric Deception)
* 4 Engineers vs. 1 secretly designated Saboteur.
* `sabotage_create_room` / `sabotage_join_room`: Lobby formation for 5 operators.
* `sabotage_client_intent`: Player inputs (fixing nodes, triggering surges) routed to host.
* `sabotage_state_sync`: Host broadcasts reconciled circuit health and alarm states.
* `sabotage_match_over`: Triggers victory or reactor meltdown sequences.

#### 3. The Architect & The Rats (1v4 Asymmetric Maze Escape Arena)
* 1 Architect vs. up to 4 Rats.
* Phase 1 (`ARCHITECT`): Architect places decoy exits, spike traps, and walls within a 20-second timer.
* Phase 2 (`RAT`): Rats navigate a dynamic fog-of-war labyrinth with a 45-second timer to find the single True Gold Exit.
* `archirat_trigger_trap`: Triggers hidden architect traps when a rat steps onto an armed tile.
* `archirat_ability`: Triggers special skills: "Sonar Ping", "Lights Out", "Speed Surge".

---

## 7. THE ARCADE: HTML5 CANVAS GAMING VAULT

All games run pure HTML5 Canvas render loops with Web Audio API sound synthesis and support high-refresh displays:

| Game | Slug | Category | Key Mechanics |
| :--- | :--- | :--- | :--- |
| **Neon Asteroid Blitz** | `neon-asteroid-blitz` | Arcade | Inertia physics, laser cannons, particle bursts, screen shake, powerup crystals, rewarded video revives. |
| **Cyber Slicer 2099** | `cyber-slicer-2099` | Action | Synthwave rhythm slicing, combo multipliers, particle trails, precision cutting windows. |
| **Pixel Kitchen Rush** | `pixel-kitchen-rush` | Puzzle / Co-Op | 4-player real-time multiplayer, order timers, stove burning mechanics, assembly plating, coin payouts. |
| **Dungeon Loot Dash** | `dungeon-loot-dash` | Retro / Runner | Endless 8-bit runner, jump mechanics, hazard hitboxes, gold chest multipliers. |
| **Sabotage Circuit** | `sabotage-circuit` | Action / Deception | 5-player asymmetric deception, crisis management, power grid maintenance, hidden traitor logic. |
| **The Architect & The Rats** | `the-architect-and-the-rats`| Retro / Strategy | 1v4 maze deception, fog of war, trap deployment, ability hotkeys, role rotation on win. |

---

## 8. THE KITCHEN: MICHELIN-STANDARD CULINARY CMS

The Kitchen (`/recipes` & `/recipes/[slug]`) offers an editorial cooking experience designed for high search engine visibility and cooking ergonomics:

### Key Features
1. **Dynamic Portion Scaler**: A live servings modifier (`-` / `+`) that recalculates all ingredient weights and measurements in real time without page reloads.
2. **Interactive Step Checklists**: Checkboxes on every ingredient and preparation step, tracking completion state as the chef cooks.
3. **Nutrition Telemetry**: Per-portion calorie count, protein, carbohydrates, fats, and dietary fiber telemetry.
4. **"Jump to Recipe" Button**: Smooth scrolls past editorial storytelling directly to `#recipe-card`.
5. **JSON-LD Schema**: Auto-injects rich `Recipe` schema (`prepTime`, `cookTime`, `recipeIngredient`, `recipeInstructions`, `aggregateRating`).
6. **Save to Vault**: Allows signed-in users to bookmark recipes to their account with one click.

---

## 9. THE LAB: HARDWARE BENCHMARKS & FOOD TEARDOWNS

The Lab (`/reviews` & `/reviews/[slug]`) utilizes a split-layout rendering system based on the category:

### 1. Tech & Hardware Layout (`category === 'tech_hardware'`)
* Thermal benchmark graphs and chassis stress-test results.
* Hardware spec matrix (APU, VRAM, Display, Weight, Battery Wh).
* Circular teardown score badges with performance ratings.

### 2. Food & Delivery Layout (`category === 'food_lifestyle'`)
* Packaging insulation score, transit temperature stability, and presentation freshness ratings.
* Taste profile breakdown and Michelin-scale flavor scoring.

### Universal Review Elements
* **Pros & Cons Matrix**: Clean cards with visual green `+` and red `-` indicators.
* **Affiliate Monetization Disclosures**: FTC-compliant affiliate notices with high-converting CTA links.
* **JSON-LD Schema**: Generates `Review`, `Product`, and `Offer` structured data for Google Search rich snippets.

---

## 10. EDITORIAL HUBS: NEWSROOM & CYBERPUNK FASHION

### Newsroom (`/news` & `/news/[slug]`)
* Breaking news ticker and top stories grid.
* Embedded rich media support (YouTube video embeds, pull quotes, code blocks via `ArticleBodyRenderer.tsx`).
* Categorized under `news_editorial` or `gaming_news`.

### Beauty & Fashion (`/beauty-fashion` & `/beauty-fashion/[slug]`)
* Focuses on technical apparel (Gore-Tex Pro 3-layer shells, Fidlock magnetic rigs, Schoeller fabrics) and dermatological skincare science (copper peptides, ceramide lipid barrier protection).
* **Shoppable Affiliate Carousel**: Interactive product cards displaying brand, pricing, and direct affiliate purchase links.

---

## 11. USER PROGRESSION, MERITS & COMMUNITY ENGINE

### 1. Engagement XP & Merits System
* **Reading Merits Tracker (`ReadingMeritsTracker.tsx`)**: Automatically awards **+25 XP** when a user spends 25 continuous seconds reading an article or recipe, accompanied by a confetti burst.
* **Arcade Rewards**: Submitting high scores grants XP equal to `Math.floor(score / 100)`.
* **Daily Streaks**: Tracks consecutive daily logins with streak multipliers.

### 2. Badges & Profile Governance
* Badges include: `Grand Champion`, `Arcade Master`, `Founding Chef`, `Super Admin`, `Taste Tester`, `Speed Demon`, `New Explorer`.

### 3. Community Comments Engine (`/components/account/CommentSection.tsx`)
* Real-time optimistic UI rendering.
* Full author badges and avatar rendering.
* Flagging support for toxic content moderation.

---

## 12. SUPER ADMIN CMS MANAGEMENT SUITE

Accessible via `/admin`, the Super Admin console provides complete control over every aspect of the platform:

| Module | Route | Key Capabilities |
| :--- | :--- | :--- |
| **Overview** | `/admin` | Live system telemetry, content counts, quick actions. |
| **Post Scheduler** | `/admin/scheduler` | Schedule future recipes/reviews/articles with background worker execution logs. |
| **Custom Sub-Pages** | `/admin/pages` | Create dynamic pages (`/pages/[slug]`), toggle nav/footer visibility, enable/disable ads. |
| **Kitchen Recipes** | `/admin/recipes` | Dynamic ingredient and instruction builder, calorie calculator, cuisine tagger. |
| **Hardware Lab** | `/admin/reviews` | Spec key-value matrix builder, pros/cons list manager, affiliate link config. |
| **Beauty & Fashion** | `/admin/lifestyle` | Shoppable affiliate item manager, image gallery uploader. |
| **Newsroom CMS** | `/admin/news` | Breaking news toggles, markdown editor, author attribution. |
| **Arcade Vault** | `/admin/games` | Register new canvas engines, toggle sponsored flags, view play telemetry. |
| **Score Moderation** | `/admin/leaderboards` | Inspect high scores, delete suspicious submissions, trigger instant Weekly Tournament Resets. |
| **User Governance** | `/admin/users` | Promote users to Admin, adjust points, award custom badges, ban accounts. |
| **Direct Sponsors** | `/admin/sponsors` | Manage sponsor banners, destination URLs, slot positions, view impression/click CTR. |
| **Master Ad Switches** | `/admin/settings` | Toggle global ads and individual ad zones (header, sidebar, in-content, footer, rewarded). |

---

## 13. MONETIZATION, DIRECT SPONSORS & AD SWITCHES

### 1. Master Ad Switches (`SiteSettings`)
Controlled in `/admin/settings` and stored in `site_settings` table:
* `ads_enabled`: Master kill switch for all monetization.
* `header_ad`: Toggles 728x90 / 970x250 billboard slot above navigation.
* `sidebar_ad`: Toggles 300x250 / 300x600 sticky sidebar slot.
* `in_content_ad`: Toggles mid-article / mid-recipe banners.
* `sticky_footer_ad`: Toggles 728x90 sticky footer banner.
* `rewarded_ads`: Toggles arcade rewarded video revives.

### 2. AdSlot Component (`components/monetization/AdSlot.tsx`)
* Automatically checks master settings before rendering.
* If an active direct sponsor matches the slot position, renders the sponsor banner and increments `impressions_tracked`.
* Clicks are routed through `trackClick()`, incrementing `clicks_tracked`.
* If no direct sponsor is assigned, displays an IAB standard placeholder container ready for Google AdSense, Ezoic, or Mediavine script tags.

### 3. Rewarded Video Ad Modal (`components/monetization/RewardedAdModal.tsx`)
* Simulates high-value 5-second video ads with countdown timer.
* Upon completion, fires celebratory confetti and executes `onRewardEarned()` (reviving the player's ship with an extra life or paying out bonus XP).

---

## 14. SEO ARCHITECTURE & JSON-LD STRUCTURED DATA

Implemented via `components/seo/JsonLd.tsx`:

1. **Recipe Schema**: Emits `@type: "Recipe"` with `name`, `image`, `author`, `prepTime`, `cookTime`, `nutrition`, `recipeIngredient`, `recipeInstructions`, and `aggregateRating`.
2. **Review Schema**: Emits `@type: "Review"` with `itemReviewed` (Product/Service), `reviewRating`, `positiveNotes` (Pros), `negativeNotes` (Cons), and `offers` (Affiliate retailer and URL).
3. **VideoGame Schema**: Emits `@type: "VideoGame"` for all arcade games with `playMode: "SinglePlayer"`, `genre`, and `applicationCategory: "Game"`.
4. **Article & NewsArticle Schema**: Emits `@type: "NewsArticle"` or `@type: "Article"` with `headline`, `image`, `author`, `publisher`, and `keywords`.
5. **BreadcrumbList Schema**: Emits full navigational breadcrumbs for search engine crawl hierarchy.

---

## 15. REST API ENDPOINT REFERENCE

### Authentication & Account
* `POST /api/auth/login`: Authenticates user by username/email.
* `POST /api/auth/signup`: Registers a new user profile.
* `GET /api/account/comments?userId=<id>`: Retrieves user's comment history.
* `GET /api/account/game-stats?userId=<id>`: Retrieves high score and play count per game.
* `GET /api/account/saved-recipes?userId=<id>`: Retrieves bookmarked recipes.
* `POST /api/account/saved-recipes`: Saves a recipe to the user's vault (`{ userId, recipe_id, recipe_slug, recipe_title }`).
* `DELETE /api/account/saved-recipes?userId=<id>&recipeId=<id>`: Removes a bookmarked recipe.

### Content Hubs
* `GET /api/recipes`: Lists published recipes (supports `?slug=<slug>` and `?status=all`).
* `POST /api/recipes`: Creates or updates a recipe (Admin).
* `GET /api/reviews`: Lists published reviews (supports `?slug=<slug>` and `?category=<category>`).
* `POST /api/reviews`: Creates or updates a review (Admin).
* `GET /api/news`: Lists news articles (supports `?slug=<slug>`).
* `POST /api/news`: Creates or updates a news article (Admin).
* `GET /api/lifestyle`: Lists beauty/fashion articles (supports `?slug=<slug>`).
* `POST /api/lifestyle`: Creates or updates a beauty/fashion article (Admin).
* `GET /api/pages`: Lists custom CMS sub-pages (supports `?slug=<slug>`).
* `POST /api/pages`: Creates or updates a custom sub-page (Admin).
* `GET /api/posts`: Universal endpoint returning aggregated recipes, reviews, and articles.

### Arcade & Leaderboards
* `GET /api/leaderboards`: Retrieves leaderboard entries (supports `?game_id=<id>`).
* `POST /api/leaderboards`: Submits a new score (`{ game_id, score, user_id, username }`).
* `DELETE /api/leaderboards?id=<id>`: Deletes a fraudulent score entry (Admin).
* `POST /api/leaderboards/reset`: Triggers a weekly tournament leaderboard reset.
* `POST /api/kitchen/payout`: Records coin and tip payouts for multiplayer kitchen shifts.

### Monetization & Schedulers
* `GET /api/sponsors`: Retrieves all active sponsor campaigns.
* `POST /api/sponsors`: Saves or updates a sponsor banner campaign (Admin).
* `POST /api/scheduler/publish`: Triggered by `server.js` or cron to publish due scheduled posts (`headers: { 'x-scheduler-secret': '...' }`).
* `GET /api/scheduler/log`: Retrieves scheduler audit history.
* `GET /api/cron/publish`: Vercel Cron-compatible scheduler publication endpoint.
* `GET /api/comments?contentId=<id>`: Fetches comments for an item.
* `POST /api/comments`: Submits a comment (`{ user_id, content_type, content_id, content_slug, body }`).

---

## 16. ENVIRONMENT VARIABLES, CONFIGURATION & DEPLOYMENT

### `.env.local` Configuration Reference
```env
# Microsoft SQL Server / Azure SQL Connection
MSSQL_HOST=localhost
MSSQL_PORT=1433
MSSQL_USER=sa
MSSQL_PASSWORD=YourSecurePassword123!
MSSQL_DATABASE=Ultimatum
MSSQL_ENCRYPT=false
MSSQL_TRUST_SERVER_CERTIFICATE=true

# Alternative single connection string (optional)
# DATABASE_URL=Server=localhost,1433;Database=Ultimatum;User Id=sa;Password=YourSecurePassword123!;TrustServerCertificate=True;

# Background Scheduler Security Secret
SCHEDULER_SECRET=ultimatum_secure_cron_secret_2026

# Server Port & Environment
PORT=3000
NODE_ENV=development
```

### Local Development & Startup Commands
```bash
# 1. Install dependencies
npm install

# 2. Start custom server (Next.js + Socket.io + Scheduler)
npm run dev
# Or directly: node server.js

# 3. Build for production
npm run build
npm start
```

### Production Deployment Notes
* When deploying to Node.js hosting (Docker, AWS ECS, Azure App Service, DigitalOcean, Railway), start with `node server.js` to ensure the Socket.io WebSocket server and the 60-second automated post scheduler background worker run concurrently.
* If deploying on serverless infrastructure (e.g. Vercel), Socket.io features operate in fallback mode and post scheduling can be triggered via `/api/cron/publish` using Vercel Cron jobs.

---
*Ultimatum Platform Architecture Specification • Master Documentation*
