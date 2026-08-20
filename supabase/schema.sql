-- ==============================================================================
-- ULTIMATUM PLATFORM - HOSTING SERVER DATABASE SCHEMA & SEED DATA
-- Database Target: PostgreSQL / Supabase on Hosting Server
-- Tech: Next.js App Router, TypeScript, Supabase RLS / Direct Node.js DB Client
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Supports direct hosting server DB auth & Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    password_hash TEXT,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    points INTEGER DEFAULT 250,
    daily_streak INTEGER DEFAULT 1,
    last_active_date DATE DEFAULT CURRENT_DATE,
    vip_ad_lite_until TIMESTAMPTZ,
    badges JSONB DEFAULT '["Newbie Gamer", "Taste Explorer"]'::jsonb,
    is_banned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. GAMES TABLE
CREATE TABLE IF NOT EXISTS public.games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'arcade' CHECK (category IN ('arcade', 'action', 'puzzle', 'retro', 'strategy')),
    thumbnail_url TEXT NOT NULL,
    game_file_url TEXT NOT NULL,
    is_sponsored BOOLEAN DEFAULT false,
    sponsor_name TEXT,
    play_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. LEADERBOARDS TABLE
CREATE TABLE IF NOT EXISTS public.leaderboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    week_timestamp TIMESTAMPTZ DEFAULT date_trunc('week', NOW()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. RECIPES TABLE
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    hero_image_url TEXT NOT NULL,
    prep_time INTEGER NOT NULL,
    cook_time INTEGER NOT NULL,
    servings INTEGER DEFAULT 4 NOT NULL,
    calories INTEGER NOT NULL,
    category TEXT NOT NULL,
    dietary_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    ingredients JSONB NOT NULL,
    instructions JSONB NOT NULL,
    nutrition JSONB DEFAULT '{"protein": "28g", "carbs": "65g", "fat": "22g", "fiber": "6g"}'::jsonb,
    rating NUMERIC(2, 1) DEFAULT 4.9,
    rating_count INTEGER DEFAULT 128,
    author TEXT DEFAULT 'Chef Marco & Ultimatum Test Kitchen',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('tech_hardware', 'food_lifestyle')),
    rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    summary TEXT NOT NULL,
    verdict TEXT NOT NULL,
    pros TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    cons TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    specifications JSONB NOT NULL,
    affiliate_link TEXT,
    affiliate_retailer TEXT DEFAULT 'Amazon / Direct Partner',
    hero_image_url TEXT NOT NULL,
    author TEXT DEFAULT 'Ultimatum Lab Editorial Team',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. ARTICLES TABLE
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT NOT NULL CHECK (category IN ('beauty_fashion', 'news_editorial', 'gaming_news')),
    hero_image_url TEXT NOT NULL,
    gallery_images TEXT[] DEFAULT ARRAY[]::TEXT[],
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    author TEXT NOT NULL,
    read_time INTEGER DEFAULT 5,
    is_breaking BOOLEAN DEFAULT false,
    shoppable_items JSONB DEFAULT '[]'::jsonb,
    published_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. SPONSORS TABLE
CREATE TABLE IF NOT EXISTS public.sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sponsor_name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    slot_position TEXT NOT NULL CHECK (slot_position IN ('header_banner', 'sidebar', 'in_content', 'footer')),
    impressions_tracked INTEGER DEFAULT 0,
    clicks_tracked INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. CUSTOM PAGES TABLE
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    content TEXT NOT NULL,
    meta_description TEXT,
    show_in_nav BOOLEAN DEFAULT false,
    show_in_footer BOOLEAN DEFAULT true,
    enable_ads BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. USER BOOKMARKS
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('recipe', 'review', 'article', 'game')),
    item_id TEXT NOT NULL,
    item_title TEXT NOT NULL,
    item_slug TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. SITE SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_recipes_slug ON public.recipes(slug);
CREATE INDEX IF NOT EXISTS idx_reviews_slug ON public.reviews(slug);
CREATE INDEX IF NOT EXISTS idx_games_slug ON public.games(slug);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
CREATE INDEX IF NOT EXISTS idx_leaderboards_game_week ON public.leaderboards(game_id, week_timestamp, score DESC);

-- RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Public articles viewable" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Public profiles viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public games viewable" ON public.games FOR SELECT USING (true);
CREATE POLICY "Public leaderboards viewable" ON public.leaderboards FOR SELECT USING (true);
CREATE POLICY "Public recipes viewable" ON public.recipes FOR SELECT USING (true);
CREATE POLICY "Public reviews viewable" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public sponsors viewable" ON public.sponsors FOR SELECT USING (is_active = true);
CREATE POLICY "Public pages viewable" ON public.pages FOR SELECT USING (true);
CREATE POLICY "Public settings viewable" ON public.site_settings FOR SELECT USING (true);

-- INITIAL SEED DATA FOR HOSTING SERVER DATABASE
INSERT INTO public.profiles (id, username, email, role, points, daily_streak, badges)
VALUES 
    ('e1010000-0000-0000-0000-000000000001', 'PixelNinja', 'admin@ultimatum.gg', 'admin', 8450, 14, '["Super Admin", "Arcade Legend", "Michelin Gourmet"]'),
    ('e1010000-0000-0000-0000-000000000002', 'CyberChef_X', 'player@ultimatum.gg', 'user', 1250, 5, '["Weekly Top 10", "Taste Explorer"]')
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.games (id, slug, title, description, category, thumbnail_url, game_file_url, is_sponsored, play_count)
VALUES
    ('g1010000-0000-0000-0000-000000000001', 'neon-asteroid-blitz', 'Neon Asteroid Blitz', 'High-octane space vector shooter. Destroy cosmic anomalies, trigger hyper-bombs, and dominate weekly leaderboards!', 'arcade', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80', '/canvas/neon-blitz', true, 1420),
    ('g1010000-0000-0000-0000-000000000002', 'cyber-slicer', 'Cyber Slicer 2099', 'Precision sword slicing arcade game. Slash neon targets and avoid overload mines.', 'action', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80', '/canvas/cyber-slicer', false, 980),
    ('g1010000-0000-0000-0000-000000000006', 'the-architect-and-the-rats', 'The Architect & The Rats', '1v4 Asymmetrical Maze Deception & Escape Arena. 1-2 Architects forge a deadly labyrinth of spikes, decoys, and trigger traps while Rats navigate through fog of war to find the True Gold Exit before time runs out.', 'retro', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80', '/canvas/the-architect-and-the-rats', true, 31250)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.site_settings (key, value)
VALUES ('main_settings', '{"announcement": {"enabled": true, "text": "🔥 WEEKLY ARCADE TOURNAMENT LIVE: Play Neon Asteroid Blitz & Win 5,000 XP!", "link": "/games/neon-asteroid-blitz"}, "monetization": {"ads_enabled": true, "header_ad": true, "sidebar_ad": true, "in_content_ad": true, "sticky_footer_ad": true, "rewarded_ads": true}}'::jsonb)
ON CONFLICT (key) DO NOTHING;
