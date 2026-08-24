-- ==============================================================================
-- ULTIMATUM PLATFORM - MASTER MICROSOFT SQL SERVER DATABASE SCHEMA & SEED
-- Compatible with Microsoft SQL Server 2016, 2017, 2019, 2022, and Azure SQL Database
-- ==============================================================================

-- Create Database if not exists (Skip if using existing Azure SQL database)
-- CREATE DATABASE [Ultimatum];
-- GO
-- USE [Ultimatum];
-- GO

-- --------------------------------------------------------
-- 1. CORE PLATFORM TABLES
-- --------------------------------------------------------

-- Profiles (User accounts, admin roles, reward points)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'profiles')
BEGIN
    CREATE TABLE [dbo].[profiles] (
        [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
        [email] NVARCHAR(255) NULL UNIQUE,
        [password_hash] NVARCHAR(MAX) NULL,
        [username] NVARCHAR(150) NOT NULL UNIQUE,
        [avatar_url] NVARCHAR(MAX) NULL,
        [role] NVARCHAR(50) NOT NULL DEFAULT 'user',
        [points] INT NOT NULL DEFAULT 250,
        [daily_streak] INT NOT NULL DEFAULT 1,
        [last_active_date] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [vip_ad_lite_until] DATETIME2 NULL,
        [badges] NVARCHAR(MAX) NULL,
        [is_banned] BIT NOT NULL DEFAULT 0,
        [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE INDEX [IX_profiles_role] ON [dbo].[profiles] ([role]);
END
GO

-- Games Catalog
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'games')
BEGIN
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
    CREATE INDEX [IX_games_category] ON [dbo].[games] ([category]);
END
GO

-- Leaderboard High Scores
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'leaderboards')
BEGIN
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
    CREATE INDEX [IX_leaderboards_game_score] ON [dbo].[leaderboards] ([game_id], [score] DESC);
    CREATE INDEX [IX_leaderboards_user] ON [dbo].[leaderboards] ([user_id]);
END
GO

-- User Game Play Stats
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'game_stats')
BEGIN
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
    CREATE INDEX [IX_game_stats_user] ON [dbo].[game_stats] ([user_id]);
END
GO

-- Recipes CMS
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'recipes')
BEGIN
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
        [cuisine_tags] NVARCHAR(MAX) NULL,
        [dietary_tags] NVARCHAR(MAX) NULL,
        [ingredients] NVARCHAR(MAX) NOT NULL,
        [instructions] NVARCHAR(MAX) NOT NULL,
        [nutrition] NVARCHAR(MAX) NULL,
        [rating] DECIMAL(3, 1) NOT NULL DEFAULT 4.9,
        [rating_count] INT NOT NULL DEFAULT 128,
        [author] NVARCHAR(255) NOT NULL DEFAULT 'Chef Marco & Ultimatum Test Kitchen',
        [status] NVARCHAR(50) NOT NULL DEFAULT 'published',
        [scheduled_for] DATETIME2 NULL,
        [published_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE INDEX [IX_recipes_status_created] ON [dbo].[recipes] ([status], [created_at] DESC);
    CREATE INDEX [IX_recipes_category] ON [dbo].[recipes] ([category]);
    CREATE INDEX [IX_recipes_slug] ON [dbo].[recipes] ([slug]);
END
GO

-- User Saved / Bookmarked Recipes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'saved_recipes')
BEGIN
    CREATE TABLE [dbo].[saved_recipes] (
        [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] NVARCHAR(64) NOT NULL,
        [recipe_id] NVARCHAR(64) NOT NULL,
        [recipe_slug] NVARCHAR(255) NOT NULL,
        [recipe_title] NVARCHAR(255) NOT NULL,
        [saved_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [UK_saved_recipes_user_recipe] UNIQUE ([user_id], [recipe_id]),
        CONSTRAINT [FK_saved_recipes_profiles] FOREIGN KEY ([user_id]) REFERENCES [dbo].[profiles]([id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_saved_recipes_user] ON [dbo].[saved_recipes] ([user_id]);
END
GO

-- Product & Hardware Reviews
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'reviews')
BEGIN
    CREATE TABLE [dbo].[reviews] (
        [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
        [slug] NVARCHAR(255) NOT NULL UNIQUE,
        [product_name] NVARCHAR(255) NOT NULL,
        [category] NVARCHAR(50) NOT NULL,
        [rating] DECIMAL(3, 1) NOT NULL,
        [summary] NVARCHAR(MAX) NOT NULL,
        [verdict] NVARCHAR(MAX) NOT NULL,
        [pros] NVARCHAR(MAX) NULL,
        [cons] NVARCHAR(MAX) NULL,
        [specifications] NVARCHAR(MAX) NOT NULL,
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
    CREATE INDEX [IX_reviews_status_created] ON [dbo].[reviews] ([status], [created_at] DESC);
    CREATE INDEX [IX_reviews_category] ON [dbo].[reviews] ([category]);
    CREATE INDEX [IX_reviews_slug] ON [dbo].[reviews] ([slug]);
END
GO

-- News & Lifestyle Editorial Articles
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'articles')
BEGIN
    CREATE TABLE [dbo].[articles] (
        [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
        [slug] NVARCHAR(255) NOT NULL UNIQUE,
        [title] NVARCHAR(255) NOT NULL,
        [subtitle] NVARCHAR(MAX) NULL,
        [category] NVARCHAR(50) NOT NULL,
        [hero_image_url] NVARCHAR(MAX) NOT NULL,
        [gallery_images] NVARCHAR(MAX) NULL,
        [content] NVARCHAR(MAX) NOT NULL,
        [tags] NVARCHAR(MAX) NULL,
        [author] NVARCHAR(255) NOT NULL,
        [read_time] INT NOT NULL DEFAULT 5,
        [is_breaking] BIT NOT NULL DEFAULT 0,
        [shoppable_items] NVARCHAR(MAX) NULL,
        [status] NVARCHAR(50) NOT NULL DEFAULT 'published',
        [scheduled_for] DATETIME2 NULL,
        [published_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE INDEX [IX_articles_status_created] ON [dbo].[articles] ([status], [created_at] DESC);
    CREATE INDEX [IX_articles_category] ON [dbo].[articles] ([category]);
    CREATE INDEX [IX_articles_slug] ON [dbo].[articles] ([slug]);
END
GO

-- Advertisements & Sponsor Slots
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sponsors')
BEGIN
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
    CREATE INDEX [IX_sponsors_active_slot] ON [dbo].[sponsors] ([is_active], [slot_position]);
END
GO

-- Custom CMS Pages (About, Terms, Privacy, etc.)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'pages')
BEGIN
    CREATE TABLE [dbo].[pages] (
        [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
        [slug] NVARCHAR(255) NOT NULL UNIQUE,
        [title] NVARCHAR(255) NOT NULL,
        [subtitle] NVARCHAR(MAX) NULL,
        [content] NVARCHAR(MAX) NOT NULL,
        [meta_description] NVARCHAR(MAX) NULL,
        [show_in_nav] BIT NOT NULL DEFAULT 0,
        [show_in_footer] BIT NOT NULL DEFAULT 1,
        [enable_ads] BIT NOT NULL DEFAULT 1,
        [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE INDEX [IX_pages_slug] ON [dbo].[pages] ([slug]);
END
GO

-- Bookmarked Items (Generic)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'bookmarks')
BEGIN
    CREATE TABLE [dbo].[bookmarks] (
        [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
        [user_id] NVARCHAR(64) NOT NULL,
        [item_type] NVARCHAR(50) NOT NULL,
        [item_id] NVARCHAR(255) NOT NULL,
        [item_title] NVARCHAR(255) NOT NULL,
        [item_slug] NVARCHAR(255) NOT NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [FK_bookmarks_profiles] FOREIGN KEY ([user_id]) REFERENCES [dbo].[profiles]([id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_bookmarks_user] ON [dbo].[bookmarks] ([user_id]);
END
GO

-- User Comments
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_comments')
BEGIN
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
    CREATE INDEX [IX_comments_content] ON [dbo].[user_comments] ([content_type], [content_id], [is_flagged], [created_at] DESC);
    CREATE INDEX [IX_comments_user] ON [dbo].[user_comments] ([user_id]);
END
GO

-- Scheduler Background Execution Logs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'scheduler_log')
BEGIN
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
    CREATE INDEX [IX_scheduler_log_executed] ON [dbo].[scheduler_log] ([executed_at] DESC);
END
GO

-- Site Settings Key-Value Store
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'site_settings')
BEGIN
    CREATE TABLE [dbo].[site_settings] (
        [key] NVARCHAR(255) NOT NULL PRIMARY KEY,
        [value] NVARCHAR(MAX) NOT NULL,
        [updated_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

-- --------------------------------------------------------
-- 2. COLLABORATOR GAME ECONOMY TABLES (PIXEL KITCHEN RUSH)
-- --------------------------------------------------------

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'player_profiles')
BEGIN
    CREATE TABLE [dbo].[player_profiles] (
        [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
        [username] NVARCHAR(64) NOT NULL UNIQUE,
        [display_name] NVARCHAR(64) NULL,
        [avatar_url] NVARCHAR(255) NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'wallets')
BEGIN
    CREATE TABLE [dbo].[wallets] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [player_id] NVARCHAR(64) NOT NULL UNIQUE,
        [coin_balance] INT NOT NULL DEFAULT 250,
        [total_earned] INT NOT NULL DEFAULT 250,
        [total_spent] INT NOT NULL DEFAULT 0,
        [updated_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [FK_wallets_player] FOREIGN KEY ([player_id]) REFERENCES [dbo].[player_profiles]([id]) ON DELETE CASCADE
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'shop_items')
BEGIN
    CREATE TABLE [dbo].[shop_items] (
        [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
        [name] NVARCHAR(100) NOT NULL,
        [category] NVARCHAR(50) NOT NULL,
        [description] NVARCHAR(MAX) NOT NULL,
        [price] INT NOT NULL,
        [effect_type] NVARCHAR(64) NOT NULL,
        [effect_value] FLOAT NOT NULL DEFAULT 1.0,
        [icon_placeholder] NVARCHAR(255) NOT NULL
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'inventory')
BEGIN
    CREATE TABLE [dbo].[inventory] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [player_id] NVARCHAR(64) NOT NULL,
        [item_id] NVARCHAR(64) NOT NULL,
        [item_name] NVARCHAR(100) NOT NULL,
        [quantity] INT NOT NULL DEFAULT 1,
        [is_equipped] BIT NOT NULL DEFAULT 0,
        [purchased_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [UK_player_item] UNIQUE ([player_id], [item_id]),
        CONSTRAINT [FK_inventory_player] FOREIGN KEY ([player_id]) REFERENCES [dbo].[player_profiles]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_inventory_item] FOREIGN KEY ([item_id]) REFERENCES [dbo].[shop_items]([id]) ON DELETE CASCADE
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'kitchen_shifts')
BEGIN
    CREATE TABLE [dbo].[kitchen_shifts] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [room_code] NVARCHAR(8) NOT NULL,
        [player_id] NVARCHAR(64) NOT NULL,
        [shift_number] INT NOT NULL DEFAULT 1,
        [orders_served] INT NOT NULL DEFAULT 0,
        [orders_burned] INT NOT NULL DEFAULT 0,
        [orders_failed] INT NOT NULL DEFAULT 0,
        [star_rating] DECIMAL(3,1) NOT NULL DEFAULT 5.0,
        [tips_earned] INT NOT NULL DEFAULT 0,
        [is_doubled] BIT NOT NULL DEFAULT 0,
        [customer_review] NVARCHAR(MAX) NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE INDEX [IX_kitchen_player_shifts] ON [dbo].[kitchen_shifts] ([player_id]);
    CREATE INDEX [IX_kitchen_room] ON [dbo].[kitchen_shifts] ([room_code]);
END
GO

-- --------------------------------------------------------
-- 3. MASTER IDEMPOTENT SEED DATA
-- --------------------------------------------------------

-- 3.1 Seed Profiles
IF NOT EXISTS (SELECT 1 FROM [dbo].[profiles] WHERE [id] = N'user-001')
    INSERT INTO [dbo].[profiles] ([id], [username], [email], [avatar_url], [role], [points], [daily_streak], [last_active_date], [badges], [created_at], [updated_at])
    VALUES (N'user-001', N'PixelNinja', N'admin@ultimatum.gg', N'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80', N'admin', 4850, 5, N'2026-08-16', N'["Grand Champion","Arcade Master","Founding Chef","Super Admin"]', N'2026-01-15T08:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[profiles] WHERE [id] = N'user-002')
    INSERT INTO [dbo].[profiles] ([id], [username], [email], [avatar_url], [role], [points], [daily_streak], [last_active_date], [badges], [created_at], [updated_at])
    VALUES (N'user-002', N'CyberGourmet', N'gamer@ultimatum.gg', N'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80', N'user', 3420, 3, N'2026-08-16', N'["Top Gun","Recipe Critic","High Roller"]', N'2026-02-01T10:30:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[profiles] WHERE [id] = N'user-003')
    INSERT INTO [dbo].[profiles] ([id], [username], [email], [avatar_url], [role], [points], [daily_streak], [last_active_date], [badges], [created_at], [updated_at])
    VALUES (N'user-003', N'AeroStrike', N'aerostrike@ultimatum.gg', N'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', N'user', 2980, 2, N'2026-08-24T00:00:00Z', N'["Sharpshooter","Speed Demon"]', N'2026-02-10T14:15:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[profiles] WHERE [id] = N'user-004')
    INSERT INTO [dbo].[profiles] ([id], [username], [email], [avatar_url], [role], [points], [daily_streak], [last_active_date], [badges], [created_at], [updated_at])
    VALUES (N'user-004', N'SpiceOverlord', N'spice@ultimatum.gg', N'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', N'user', 1840, 1, N'2026-08-24T00:00:00Z', N'["Taste Tester","Kitchen Samurai"]', N'2026-03-01T09:00:00Z', GETUTCDATE());
GO

-- 3.2 Seed Games
IF NOT EXISTS (SELECT 1 FROM [dbo].[games] WHERE [id] = N'game-001')
    INSERT INTO [dbo].[games] ([id], [slug], [title], [description], [category], [thumbnail_url], [game_file_url], [is_sponsored], [sponsor_name], [play_count], [created_at], [updated_at])
    VALUES (N'game-001', N'neon-asteroid-blitz', N'Neon Asteroid Blitz', N'High-octane retro arcade shooter. Pilot your neon starship through deep space debris, unleash laser blasts, collect powerup crystals, and dominate the weekly global leaderboard.', N'arcade', N'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80', N'canvas://neon-asteroid-blitz', 1, N'Razer Gaming Gear', 34820, N'2026-01-20T10:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[games] WHERE [id] = N'game-002')
    INSERT INTO [dbo].[games] ([id], [slug], [title], [description], [category], [thumbnail_url], [game_file_url], [is_sponsored], [sponsor_name], [play_count], [created_at], [updated_at])
    VALUES (N'game-002', N'cyber-slicer-2099', N'Cyber Slicer 2099', N'Fast-paced rhythmic reflex slicer. Cut glowing energy nodes before they breach your firewall perimeter in this futuristic synthwave challenge.', N'action', N'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80', N'canvas://cyber-slicer', 0, NULL, 22150, N'2026-02-05T12:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[games] WHERE [id] = N'game-003')
    INSERT INTO [dbo].[games] ([id], [slug], [title], [description], [category], [thumbnail_url], [game_file_url], [is_sponsored], [sponsor_name], [play_count], [created_at], [updated_at])
    VALUES (N'game-003', N'pixel-kitchen-rush', N'Pixel Kitchen Rush', N'Frenetic 2D culinary rush! Juggle gourmet orders, chop ingredients, flip steaks, and satisfy demanding VIP food critics before the timer expires.', N'puzzle', N'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', N'canvas://pixel-kitchen', 1, N'Hestan Masterware', 18940, N'2026-02-18T15:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[games] WHERE [id] = N'game-004')
    INSERT INTO [dbo].[games] ([id], [slug], [title], [description], [category], [thumbnail_url], [game_file_url], [is_sponsored], [sponsor_name], [play_count], [created_at], [updated_at])
    VALUES (N'game-004', N'dungeon-loot-dash', N'Dungeon Loot Dash', N'Classic 8-bit endless runner. Dodge lava traps, jump over spike barriers, and stack legendary gold chests to redeem exclusive profile badges.', N'retro', N'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80', N'canvas://dungeon-loot', 0, NULL, 14780, N'2026-03-02T18:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[games] WHERE [id] = N'game-005')
    INSERT INTO [dbo].[games] ([id], [slug], [title], [description], [category], [thumbnail_url], [game_file_url], [is_sponsored], [sponsor_name], [play_count], [created_at], [updated_at])
    VALUES (N'game-005', N'sabotage-circuit', N'Sabotage Circuit', N'5-Player Asynchronous Deception & Crisis Management Simulator. 4 Engineers must maintain Core Integrity while 1 secretly assigned Saboteur triggers cascading failures across 6 interconnected power and logic sectors.', N'action', N'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', N'canvas://sabotage-circuit', 1, N'CyberCore Industries', 28940, N'2026-03-10T16:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[games] WHERE [id] = N'game-006')
    INSERT INTO [dbo].[games] ([id], [slug], [title], [description], [category], [thumbnail_url], [game_file_url], [is_sponsored], [sponsor_name], [play_count], [created_at], [updated_at])
    VALUES (N'game-006', N'the-architect-and-the-rats', N'The Architect & The Rats', N'1v4 Asymmetrical Maze Deception & Escape Arena. 1-2 Architects forge a deadly labyrinth of spikes, decoys, and trigger traps while Rats navigate through fog of war to find the True Gold Exit before time runs out.', N'retro', N'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80', N'canvas://the-architect-and-the-rats', 1, N'RetroGrid Labs', 31250, N'2026-03-15T10:00:00Z', GETUTCDATE());
GO

-- 3.3 Seed Leaderboards
IF NOT EXISTS (SELECT 1 FROM [dbo].[leaderboards] WHERE [id] = N'lb-001')
    INSERT INTO [dbo].[leaderboards] ([id], [user_id], [game_id], [score], [week_timestamp], [created_at])
    VALUES (N'lb-001', N'user-001', N'game-001', 18450, N'2026-08-11T00:00:00Z', N'2026-08-15T12:30:00Z');
IF NOT EXISTS (SELECT 1 FROM [dbo].[leaderboards] WHERE [id] = N'lb-002')
    INSERT INTO [dbo].[leaderboards] ([id], [user_id], [game_id], [score], [week_timestamp], [created_at])
    VALUES (N'lb-002', N'user-002', N'game-001', 15200, N'2026-08-11T00:00:00Z', N'2026-08-14T19:45:00Z');
IF NOT EXISTS (SELECT 1 FROM [dbo].[leaderboards] WHERE [id] = N'lb-003')
    INSERT INTO [dbo].[leaderboards] ([id], [user_id], [game_id], [score], [week_timestamp], [created_at])
    VALUES (N'lb-003', N'user-003', N'game-001', 12900, N'2026-08-11T00:00:00Z', N'2026-08-15T09:10:00Z');
IF NOT EXISTS (SELECT 1 FROM [dbo].[leaderboards] WHERE [id] = N'lb-005')
    INSERT INTO [dbo].[leaderboards] ([id], [user_id], [game_id], [score], [week_timestamp], [created_at])
    VALUES (N'lb-005', N'user-003', N'game-002', 24800, N'2026-08-11T00:00:00Z', N'2026-08-15T10:00:00Z');
IF NOT EXISTS (SELECT 1 FROM [dbo].[leaderboards] WHERE [id] = N'lb-006')
    INSERT INTO [dbo].[leaderboards] ([id], [user_id], [game_id], [score], [week_timestamp], [created_at])
    VALUES (N'lb-006', N'user-001', N'game-002', 19500, N'2026-08-11T00:00:00Z', N'2026-08-14T11:00:00Z');
IF NOT EXISTS (SELECT 1 FROM [dbo].[leaderboards] WHERE [id] = N'lb-007')
    INSERT INTO [dbo].[leaderboards] ([id], [user_id], [game_id], [score], [week_timestamp], [created_at])
    VALUES (N'lb-007', N'user-004', N'game-003', 9600, N'2026-08-11T00:00:00Z', N'2026-08-15T14:30:00Z');
IF NOT EXISTS (SELECT 1 FROM [dbo].[leaderboards] WHERE [id] = N'lb-008')
    INSERT INTO [dbo].[leaderboards] ([id], [user_id], [game_id], [score], [week_timestamp], [created_at])
    VALUES (N'lb-008', N'user-002', N'game-003', 7850, N'2026-08-11T00:00:00Z', N'2026-08-14T16:00:00Z');
IF NOT EXISTS (SELECT 1 FROM [dbo].[leaderboards] WHERE [id] = N'lb-009')
    INSERT INTO [dbo].[leaderboards] ([id], [user_id], [game_id], [score], [week_timestamp], [created_at])
    VALUES (N'lb-009', N'user-001', N'game-004', 14200, N'2026-08-11T00:00:00Z', N'2026-08-15T18:00:00Z');
IF NOT EXISTS (SELECT 1 FROM [dbo].[leaderboards] WHERE [id] = N'lb-010')
    INSERT INTO [dbo].[leaderboards] ([id], [user_id], [game_id], [score], [week_timestamp], [created_at])
    VALUES (N'lb-010', N'user-003', N'game-004', 11900, N'2026-08-11T00:00:00Z', N'2026-08-14T20:00:00Z');
IF NOT EXISTS (SELECT 1 FROM [dbo].[leaderboards] WHERE [id] = N'lb-013')
    INSERT INTO [dbo].[leaderboards] ([id], [user_id], [game_id], [score], [week_timestamp], [created_at])
    VALUES (N'lb-013', N'user-001', N'game-005', 9800, N'2026-08-11T00:00:00Z', N'2026-08-15T16:00:00Z');
IF NOT EXISTS (SELECT 1 FROM [dbo].[leaderboards] WHERE [id] = N'lb-014')
    INSERT INTO [dbo].[leaderboards] ([id], [user_id], [game_id], [score], [week_timestamp], [created_at])
    VALUES (N'lb-014', N'user-003', N'game-005', 8450, N'2026-08-11T00:00:00Z', N'2026-08-14T20:15:00Z');
IF NOT EXISTS (SELECT 1 FROM [dbo].[leaderboards] WHERE [id] = N'lb-015')
    INSERT INTO [dbo].[leaderboards] ([id], [user_id], [game_id], [score], [week_timestamp], [created_at])
    VALUES (N'lb-015', N'user-001', N'game-006', 15000, N'2026-08-11T00:00:00Z', N'2026-08-15T18:30:00Z');
IF NOT EXISTS (SELECT 1 FROM [dbo].[leaderboards] WHERE [id] = N'lb-016')
    INSERT INTO [dbo].[leaderboards] ([id], [user_id], [game_id], [score], [week_timestamp], [created_at])
    VALUES (N'lb-016', N'user-002', N'game-006', 12500, N'2026-08-11T00:00:00Z', N'2026-08-14T21:00:00Z');
GO

-- 3.4 Seed Articles
IF NOT EXISTS (SELECT 1 FROM [dbo].[articles] WHERE [id] = N'art-001')
    INSERT INTO [dbo].[articles] ([id], [slug], [title], [subtitle], [category], [hero_image_url], [gallery_images], [content], [tags], [author], [read_time], [is_breaking], [shoppable_items], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'art-001', N'cyberpunk-techwear-modular-shells-2026', N'Cyberpunk Techwear 2026: Rainproof Modular Shells, Magnetic Fidlock & Urban Stealth', N'From 3-layer Gore-Tex Pro membranes to hot-swappable magnetic cargo systems, we test the best technical apparel for digital nomads and gamers.', N'beauty_fashion', N'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80', N'["https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80"]', N'# The Convergence of Streetwear and Functional Ergonomics

Modern lifestyle fashion has evolved far beyond superficial branding. In 2026, **Techwear** combines military-grade water repellency, magnetic quick-release fasteners, and breathable membranes engineered for maximum mobility.

> "True technical apparel is not an aesthetic costume — it is personal environmental architecture that adapts to any weather scenario." — Elena Vance

### Key Materials & Thermal Profiling
- **Gore-Tex Pro 3-Layer Laminate**: Offers unmatched 28,000mm hydrostatic head water resistance while allowing vapor sweat perspiration to escape freely. Learn more at [Gore-Tex Technical Engineering](https://www.gore-tex.com).
- **Fidlock V-Buckle Fasteners**: German-engineered neodymium magnetic closures that snap shut automatically under high tension.
- **Schoeller Dryskin 4-Way Stretch**: Abrasion-resistant ballistic nylon blend that repels street grime and rain splatters. Check our [Hardware Lab Reviews](/reviews) for wearable accessory teardowns.

### Real-World Field Testing & Teardown
During our 30-day continuous urban monsoon test in Tokyo and Seattle, the modular magnetic jacket shell kept internal electronics (mechanical keyboard, portable power banks, camera lenses) 100% dry with zero condensation buildup.', N'["Techwear","Modular Fashion","Streetwear","Apparel Teardown"]', N'Elena Vance (Style & Materials Architect)', 6, 0, N'[{"name":"AcroPulse Modular Storm Shell J1","brand":"AcroPulse Design Labs","price":"$480.00","affiliate_url":"https://example.com/shop/acropulse-shell","image_url":"https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80"},{"name":"Fidlock Magnetic Utility Rig V2","brand":"Fidlock Hardware","price":"$120.00","affiliate_url":"https://example.com/shop/fidlock-rig","image_url":"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80"},{"name":"Dryskin Tapered Cargo Pants","brand":"Schoeller Urban","price":"$260.00","affiliate_url":"https://example.com/shop/dryskin-cargo","image_url":"https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=400&q=80"}]', N'published', NULL, N'2026-03-01T12:00:00Z', N'2026-03-01T12:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[articles] WHERE [id] = N'art-002')
    INSERT INTO [dbo].[articles] ([id], [slug], [title], [subtitle], [category], [hero_image_url], [gallery_images], [content], [tags], [author], [read_time], [is_breaking], [shoppable_items], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'art-002', N'gamer-skincare-blue-light-barrier-science', N'Blue Light Barrier Science: Active Peptides, Ceramides & Skincare for High-Screen Demographics', N'10+ hours in front of OLED monitors causes oxidative barrier fatigue. Here is the scientific dermatological protocol to restore hydration and collagen integrity.', N'beauty_fashion', N'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80', N'["https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80"]', N'# Understanding High-Energy Visible (HEV) Blue Light Skin Stress

Prolonged exposure to 400-500nm high-energy visible light from monitors and mobile displays produces reactive oxygen species (ROS) that degrade skin elastin and barrier lipids.

> "Screen-induced oxidative stress damages skin moisture barriers just as aggressively as environmental UV radiation." — Dr. Sarah Lin

### The 3-Step Evidence-Based Routine
1. **Copper Tripeptide-1 Serum (GHK-Cu)**: Stimulates dermal matrix synthesis and soothes inflammation caused by dry conditioned room air. Learn more about skin resilience at [National Library of Medicine Dermatology Portal](https://pubmed.ncbi.nlm.nih.gov).
2. **5-Ceramide NP Complex Moisturizer**: Rebuilds the intercellular lipid mortar, locking in 98% of trans-epidermal water for 24 hours.
3. **Ectoin & Lutein Antioxidant Mist**: Shields cellular structures from screen oxidation without greasy residue. Pair this with our [Artisanal Anti-Oxidant Meal Recipes](/recipes) for holistic cellular nourishment.', N'["Skincare Science","Dermatology","Blue Light Protection","Grooming"]', N'Dr. Sarah Lin (Dermatological Chemistry)', 5, 0, N'[{"name":"GHK-Cu Pure Copper Peptide Serum","brand":"BioCellular Labs","price":"$68.00","affiliate_url":"https://example.com/shop/copper-peptide","image_url":"https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80"},{"name":"Multi-Ceramide Barrier Recovery Balm","brand":"DermaMatrix Pro","price":"$42.00","affiliate_url":"https://example.com/shop/ceramide-balm","image_url":"https://images.unsplash.com/photo-1608248597359-577742a03e1e?auto=format&fit=crop&w=400&q=80"}]', N'published', NULL, N'2026-03-04T10:00:00Z', N'2026-03-04T10:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[articles] WHERE [id] = N'art-003')
    INSERT INTO [dbo].[articles] ([id], [slug], [title], [subtitle], [category], [hero_image_url], [gallery_images], [content], [tags], [author], [read_time], [is_breaking], [shoppable_items], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'art-003', N'next-gen-portable-handhelds-oled-showdown', N'Next-Gen Portable Handhelds: APU Thermal Benchmarks & 144Hz OLED Showdown', N'We put the latest Zen 5 handheld compute blades through 200 hours of frame-time testing, battery curve profiling, and VRR latency benchmarks.', N'gaming_news', N'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80', N'["https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=800&q=80"]', N'# The Handheld Renaissance: Zen 5 RDNA 3.5 Silicon Analyzed

Portable PC gaming has reached a historic inflection point. With 15W TDP envelopes now capable of sustained 1080p 60FPS gaming in AAA titles, the hardware engineering inside modern handhelds is astonishing.

https://www.youtube.com/watch?v=dQw4w9WgXcQ

### Thermal & Acoustic Benchmark Takeaways
- **Vapor Chamber Dissipation**: Liquid metal thermal interface material (TIM) dropped peak hot-spot temperatures from 88°C down to 69°C.
- **VRR OLED Panels**: 48Hz-144Hz Variable Refresh Rate eliminated tearing entirely in high-FPS retro canvas titles like [Cyber Slicer 2099](/games/cyber-slicer-2099) and [Neon Asteroid Blitz](/games/neon-asteroid-blitz).
- **Battery Life Curves**: 80Wh battery cells yield 4.2 hours of heavy gameplay and up to 9 hours of retro arcade gaming. Read our complete teardown in [The Hardware Lab](/reviews).', N'["Gaming News","Handhelds","Hardware Benchmarks","OLED"]', N'Alex Mercer (Hardware Lead)', 7, 1, N'[]', N'published', NULL, N'2026-03-06T15:00:00Z', N'2026-03-06T15:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[articles] WHERE [id] = N'art-004')
    INSERT INTO [dbo].[articles] ([id], [slug], [title], [subtitle], [category], [hero_image_url], [gallery_images], [content], [tags], [author], [read_time], [is_breaking], [shoppable_items], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'art-004', N'ultimatum-summer-championship-2026-announcement', N'Ultimatum Summer Arcade Championship 2026: $10,000 Prize Pool & Double XP Announced', N'Six weeks of global weekly reset leaderboards, sponsored gear bounties from Razer and Anker, and limited-edition profile badges.', N'news_editorial', N'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80', N'[]', N'# The Biggest Web Arcade Tournament in Platform History

Starting this weekend, **The Arcade** will host the official 2026 Summer Tournament.

> "Climb the weekly tournament leaderboard to claim exclusive hardware bounties and permanent hall-of-fame badges." — Ultimatum Esports Commission

### Tournament Highlights
1. **Weekly Score Resets**: Resetting every Sunday midnight UTC. Check live standings at [The Global Leaderboards](/games).
2. **Anti-Cheat Verification**: Real-time score validation and crypto hash checking.
3. **Engagement XP Multipliers**: Earn 2x XP for all high-score submissions, shift tips, and reading time!', N'["Tournaments","Double XP","Esports","Community"]', N'Devon Wright (Arcade Lead)', 4, 1, N'[]', N'published', NULL, N'2026-03-07T09:00:00Z', N'2026-03-07T09:00:00Z', GETUTCDATE());
GO

-- 3.5 Seed Recipes
IF NOT EXISTS (SELECT 1 FROM [dbo].[recipes] WHERE [id] = N'rec-001')
    INSERT INTO [dbo].[recipes] ([id], [slug], [title], [description], [hero_image_url], [prep_time], [cook_time], [servings], [calories], [category], [cuisine], [cuisine_tags], [dietary_tags], [ingredients], [instructions], [nutrition], [rating], [rating_count], [author], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'rec-001', N'signature-italian-baked-ziti', N'Signature Italian Baked Ziti with Crispy Basil & Whipped Ricotta', N'An irresistible comfort classic featuring al dente ziti folded into a slow-simmered San Marzano tomato-basil ragù, layered with creamy whipped whole-milk ricotta, and finished under the broiler with crispy golden mozzarella.', N'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80', 25, 40, 6, 580, N'Pasta & Italian', N'Italian', N'["Italian Cuisine","Mediterranean","Pasta"]', N'["Comfort Food","Vegetarian Optional","Crowd Pleaser"]', N'[{"item":"Ziti or Rigatoni Pasta","amount":16,"unit":"oz","notes":"Cooked 2 mins shy of al dente"},{"item":"San Marzano Crushed Tomatoes","amount":28,"unit":"oz can","notes":"D.O.P certified"},{"item":"Whole Milk Ricotta Cheese","amount":15,"unit":"oz","notes":"Whipped with lemon zest"},{"item":"Fresh Low-Moisture Mozzarella","amount":12,"unit":"oz","notes":"Grated coarsely"},{"item":"Aged Parmigiano-Reggiano","amount":1,"unit":"cup","notes":"Freshly microplaned"},{"item":"Extra Virgin Olive Oil","amount":3,"unit":"tbsp"},{"item":"Garlic Cloves","amount":5,"unit":"cloves","notes":"Thinly slivered"},{"item":"Fresh Genovese Basil Leaves","amount":1,"unit":"bunch","notes":"Torn + fried for garnish"},{"item":"Crushed Red Pepper Flakes","amount":0.5,"unit":"tsp"},{"item":"Kosher Salt & Fresh Black Pepper","amount":1,"unit":"tsp","notes":"To taste"}]', N'[{"step":1,"title":"Par-Cook the Pasta","instruction":"Bring 4 quarts of heavily salted water to a rolling boil. Drop the ziti and cook for precisely 8 minutes (it should still have a firm center). Drain and toss with 1 tbsp olive oil to prevent sticking."},{"step":2,"title":"Simmer the San Marzano Pomodoro","instruction":"In a heavy Dutch oven, warm 2 tbsp olive oil over medium-low heat. Add slivered garlic and red pepper flakes. Sauté for 90 seconds until fragrant and golden (do not brown). Pour in crushed tomatoes, season with salt and pepper, and simmer for 15 minutes."},{"step":3,"title":"Whip the Herb Ricotta","instruction":"In a medium bowl, whisk together whole milk ricotta, half the grated Parmigiano-Reggiano, fresh cracked black pepper, a pinch of lemon zest, and half of the torn basil until light, fluffy, and cloud-like."},{"step":4,"title":"Layer and Assemble","instruction":"Toss the par-cooked ziti directly into the tomato sauce. Spread half of the pasta mixture into a 9x13-inch baking dish. Dollop generous spoonfuls of the whipped ricotta across the surface. Top with remaining pasta, then blanket completely with shredded mozzarella and remaining Parmigiano."},{"step":5,"title":"Bake to Golden Perfection","instruction":"Bake at 400°F (200°C) for 25 minutes until bubbling vigorously around the edges. Switch the oven to high broil for 3-4 minutes until deep golden brown blister spots form on top. Rest for 10 minutes, garnish with flash-fried basil leaves, and serve."}]', N'{"calories":580,"protein":"32g","carbs":"68g","fat":"21g","fiber":"5g"}', 4.9, 342, N'Chef Marco Bellini', N'published', NULL, N'2026-02-14T11:00:00Z', N'2026-02-14T11:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[recipes] WHERE [id] = N'rec-002')
    INSERT INTO [dbo].[recipes] ([id], [slug], [title], [description], [hero_image_url], [prep_time], [cook_time], [servings], [calories], [category], [cuisine], [cuisine_tags], [dietary_tags], [ingredients], [instructions], [nutrition], [rating], [rating_count], [author], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'rec-002', N'triple-layer-chocolate-mocha-fudge-cake', N'Triple-Layer Chocolate Mocha Fudge Cake with Espresso Ganache', N'An ultra-decadent dessert featuring three tiers of dark cocoa sponge infused with freshly pulled espresso, layered with silky whipped dark chocolate fudge, and draped in a mirror-shine espresso ganache drip.', N'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80', 45, 35, 12, 620, N'Desserts & Baking', N'American', N'["American Cuisine","Baking","Desserts"]', N'["Vegetarian","Indulgent","Celebration"]', N'[{"item":"Dutch Processed Dark Cocoa Powder","amount":1,"unit":"cup","notes":"Sifted"},{"item":"Fresh Hot Espresso / Strong Coffee","amount":1.5,"unit":"cups","notes":"Freshly brewed"},{"item":"All-Purpose Flour","amount":2.5,"unit":"cups"},{"item":"Granulated Sugar","amount":2,"unit":"cups"},{"item":"Buttermilk","amount":1,"unit":"cup","notes":"Room temperature"},{"item":"Vegetable or Avocado Oil","amount":0.75,"unit":"cup"},{"item":"Large Eggs","amount":3,"unit":"whole","notes":"Room temperature"},{"item":"Pure Vanilla Bean Paste","amount":1.5,"unit":"tbsp"},{"item":"Baking Powder & Baking Soda","amount":1.5,"unit":"tsp each"},{"item":"70% Dark Bittersweet Chocolate","amount":14,"unit":"oz","notes":"Finely chopped for ganache"},{"item":"Heavy Whipping Cream","amount":1.5,"unit":"cups","notes":"For ganache & frosting"},{"item":"Flaky Maldon Sea Salt","amount":1,"unit":"tsp","notes":"For finishing"}]', N'[{"step":1,"title":"Bloom Cocoa in Hot Espresso","instruction":"In a heatproof bowl, whisk the dark cocoa powder directly into the piping-hot freshly pulled espresso. Let bloom for 5 minutes to activate deep chocolate aromatics."},{"step":2,"title":"Mix the Batter","instruction":"Whisk dry ingredients in a large stand mixer bowl. In a separate pitcher, whisk buttermilk, oil, eggs, and vanilla. Pour wet mixture into dry, followed by the warm espresso-cocoa elixir on low speed until glossy."},{"step":3,"title":"Bake Three Sponge Rounds","instruction":"Divide batter evenly between three 8-inch cake pans. Bake at 350°F (175°C) for 30-35 minutes until a toothpick comes out clean. Cool completely on wire racks."},{"step":4,"title":"Prepare Velvet Espresso Ganache","instruction":"Heat heavy cream until simmering. Pour over chopped dark chocolate, let rest 3 minutes, then whisk from the center outward until smooth."},{"step":5,"title":"Stack, Frost, and Chill","instruction":"Stack layers with whipped fudge filling. Pour luscious espresso ganache over top, letting dramatic drips cascade down the sides."}]', N'{"calories":620,"protein":"9g","carbs":"74g","fat":"34g","fiber":"7g"}', 5, 512, N'Pastry Chef Elena Vance', N'published', NULL, N'2026-02-22T14:00:00Z', N'2026-02-22T14:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[recipes] WHERE [id] = N'rec-003')
    INSERT INTO [dbo].[recipes] ([id], [slug], [title], [description], [hero_image_url], [prep_time], [cook_time], [servings], [calories], [category], [cuisine], [cuisine_tags], [dietary_tags], [ingredients], [instructions], [nutrition], [rating], [rating_count], [author], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'rec-003', N'crispy-garlic-butter-salmon-bowls', N'Crispy Garlic Butter Salmon Bowls with Avocado & Sticky Rice', N'Crisp, caramelized pan-seared salmon cubes glazed in a soy-garlic honey butter, served over warm jasmine rice with sliced avocado, pickled cucumbers, and spicy sriracha mayo.', N'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80', 15, 15, 4, 520, N'Seafood & Bowls', N'Japanese', N'["Japanese Cuisine","Asian Fusion","Seafood"]', N'["High Protein","Gluten-Free Optional","Quick Dinner"]', N'[{"item":"Fresh Atlantic Salmon Fillet","amount":1.5,"unit":"lbs","notes":"Cut into 1-inch bite-sized cubes"},{"item":"Unsalted Grass-Fed Butter","amount":3,"unit":"tbsp"},{"item":"Garlic Cloves","amount":4,"unit":"cloves","notes":"Minced"},{"item":"Low-Sodium Tamari / Soy Sauce","amount":2,"unit":"tbsp"},{"item":"Wild Blossom Honey","amount":1.5,"unit":"tbsp"},{"item":"Cooked Jasmine Rice","amount":3,"unit":"cups"},{"item":"Ripe Haas Avocados","amount":2,"unit":"whole"},{"item":"Persian Cucumbers","amount":2,"unit":"whole"},{"item":"Toasted Sesame Oil & Seeds","amount":1,"unit":"tbsp"},{"item":"Sriracha Mayo Drizzle","amount":2,"unit":"tbsp"}]', N'[{"step":1,"title":"Prep Salmon Cubes","instruction":"Pat salmon cubes dry. Season with sea salt, black pepper, and garlic powder."},{"step":2,"title":"Pan-Sear for Golden Crust","instruction":"Sear salmon in a hot cast-iron skillet for 2-3 minutes per side until golden and crispy."},{"step":3,"title":"Glaze with Garlic Butter","instruction":"Add butter, garlic, soy sauce, and honey. Baste sizzling glaze over salmon for 60 seconds."},{"step":4,"title":"Assemble Nourishing Bowls","instruction":"Divide warm jasmine rice into bowls. Top with glazed salmon, avocado, pickled cucumbers, and sriracha mayo."}]', N'{"calories":520,"protein":"42g","carbs":"48g","fat":"18g","fiber":"4g"}', 4.8, 215, N'Chef Marco Bellini', N'published', NULL, N'2026-03-01T16:00:00Z', N'2026-03-01T16:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[recipes] WHERE [id] = N'rec-004')
    INSERT INTO [dbo].[recipes] ([id], [slug], [title], [description], [hero_image_url], [prep_time], [cook_time], [servings], [calories], [category], [cuisine], [cuisine_tags], [dietary_tags], [ingredients], [instructions], [nutrition], [rating], [rating_count], [author], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'rec-004', N'truffle-butter-ribeye-steak', N'Dry-Aged Ribeye Steak with Black Truffle Compound Butter & Charred Asparagus', N'A 45-day dry-aged prime ribeye seared in cast iron with foaming rosemary-garlic butter, finished with an earthy black truffle compound butter medallion and charred lemon-parmesan asparagus spears.', N'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80', 15, 12, 2, 690, N'Steakhouse & Grills', N'American', N'["American Cuisine","Steakhouse","Gourmet"]', N'["High Protein","Keto Friendly","Gourmet"]', N'[{"item":"Dry-Aged USDA Prime Ribeye (1.5-inch thick)","amount":2,"unit":"steaks (16 oz ea)","notes":"Brought to room temperature"},{"item":"European High-Fat Unsalted Butter","amount":4,"unit":"tbsp","notes":"Divided for searing & compound butter"},{"item":"Black Truffle Pate / Minced Truffles","amount":1.5,"unit":"tbsp"},{"item":"Fresh Rosemary Sprigs","amount":3,"unit":"sprigs"},{"item":"Fresh Thyme Sprigs","amount":4,"unit":"sprigs"},{"item":"Garlic Cloves","amount":6,"unit":"cloves","notes":"Lightly crushed with skin on"},{"item":"Fresh Asparagus","amount":1,"unit":"bunch","notes":"Woody ends trimmed"},{"item":"Flaky Maldon Smoked Sea Salt","amount":1,"unit":"tbsp"},{"item":"Coarsely Cracked Black Peppercorns","amount":1,"unit":"tbsp"},{"item":"Aged Parmigiano-Reggiano","amount":2,"unit":"tbsp","notes":"Shaved over asparagus"},{"item":"Fresh Lemon Juice","amount":1,"unit":"tbsp"}]', N'[{"step":1,"title":"Compound Butter Preparation","instruction":"Mix softened European butter, minced black truffle, a pinch of sea salt, and minced thyme in a small bowl. Roll into a log using parchment paper and chill in the freezer for 15 minutes to firm up."},{"step":2,"title":"Dry Brine & Season Steaks","instruction":"Pat ribeye steaks thoroughly dry with paper towels. Season generously on all sides and edges with flaky smoked sea salt and cracked black pepper."},{"step":3,"title":"Cast-Iron Hard Sear","instruction":"Heat a heavy cast-iron skillet over high heat until lightly smoking. Add 1 tbsp avocado oil, then lay the steaks in gently. Sear undisturbed for 2 minutes per side to develop a deep Maillard crust."},{"step":4,"title":"Aromatics & Butter Basting (Arrosé)","instruction":"Lower heat to medium. Drop in 2 tbsp butter, crushed garlic, thyme, and rosemary. Tilt the pan and continuously spoon the foaming aromatic butter over the steaks for 2-3 minutes until internal temperature hits 130°F (54°C) for medium-rare."},{"step":5,"title":"Rest & Char Asparagus","instruction":"Transfer steaks to a cutting board and top each with a thick medallion of truffle butter; rest for 8 minutes. In the remaining pan drippings, flash-sear the asparagus for 3 minutes. Finish with lemon juice and shaved Parmigiano before serving alongside sliced steak."}]', N'{"calories":690,"protein":"58g","carbs":"6g","fat":"48g","fiber":"3g"}', 4.95, 428, N'Chef Marco Bellini', N'published', NULL, N'2026-03-05T18:00:00Z', N'2026-03-05T18:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[recipes] WHERE [id] = N'rec-005')
    INSERT INTO [dbo].[recipes] ([id], [slug], [title], [description], [hero_image_url], [prep_time], [cook_time], [servings], [calories], [category], [cuisine], [cuisine_tags], [dietary_tags], [ingredients], [instructions], [nutrition], [rating], [rating_count], [author], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'rec-005', N'artisan-margherita-pizza-napoletana', N'72-Hour Fermented Neapolitan Pizza Margherita with Fior di Latte', N'Authentic wood-fired style pizza featuring a 72-hour cold-fermented high-hydration dough with blistered leopard spotting, crushed San Marzano D.O.P. sauce, torn fresh fior di latte mozzarella, and cold-pressed olive oil.', N'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80', 30, 8, 4, 480, N'Artisanal Pizzas & Breads', N'Italian', N'["Italian Cuisine","Neapolitan","Pizza"]', N'["Comfort Food","Vegetarian Optional","Crowd Pleaser"]', N'[{"item":"Tipo 00 Italian Pizza Flour","amount":500,"unit":"g"},{"item":"Cold Filtered Water (65% hydration)","amount":325,"unit":"ml"},{"item":"Fine Sea Salt","amount":15,"unit":"g"},{"item":"Instant Dry Yeast","amount":1.5,"unit":"g"},{"item":"San Marzano D.O.P. Whole Peeled Tomatoes","amount":14,"unit":"oz can","notes":"Hand-crushed with salt"},{"item":"Fresh Fior di Latte Mozzarella","amount":250,"unit":"g","notes":"Drained and torn"},{"item":"Fresh Genovese Basil Leaves","amount":16,"unit":"leaves"},{"item":"Extra Virgin Olive Oil (Cold Pressed)","amount":2,"unit":"tbsp"},{"item":"Semolina Flour","amount":0.25,"unit":"cup","notes":"For dusting peel"}]', N'[{"step":1,"title":"72-Hour Cold Fermentation Dough","instruction":"Mix flour, water, yeast, and salt until smooth. Bulk ferment for 2 hours at room temperature, fold into 4 tight dough balls (210g each), and cold-proof in airtight containers in the refrigerator for 48 to 72 hours."},{"step":2,"title":"Hand-Crush Sauce & Drain Cheese","instruction":"Hand-crush San Marzano tomatoes with a pinch of sea salt (do not blend to avoid seeds bittering). Tear fior di latte into bite-sized pieces and let drain on paper towels for 30 minutes to prevent soggy crust."},{"step":3,"title":"Oven & Pizza Stone Preheating","instruction":"Preheat oven with a pizza steel or stone on the top rack at maximum heat (500°F - 550°F / 260°C - 290°C) for at least 60 minutes."},{"step":4,"title":"Shape Dough & Assemble","instruction":"Dust work surface with semolina. Gently stretch a dough ball from the center outward, preserving the airy outer cornicione rim. Spread 3 tbsp tomato sauce, arrange torn mozzarella, and drizzle extra virgin olive oil."},{"step":5,"title":"Bake to Leopard Blistered Perfection","instruction":"Switch oven to high broil. Launch pizza onto the blazing steel. Bake for 5-7 minutes until the crust exhibits charred leopard spots and cheese is bubbling vigorously. Garnish immediately with fresh basil leaves and a final olive oil swirl."}]', N'{"calories":480,"protein":"22g","carbs":"64g","fat":"15g","fiber":"4g"}', 4.9, 389, N'Chef Marco Bellini', N'published', NULL, N'2026-03-08T12:00:00Z', N'2026-03-08T12:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[recipes] WHERE [id] = N'rec-006')
    INSERT INTO [dbo].[recipes] ([id], [slug], [title], [description], [hero_image_url], [prep_time], [cook_time], [servings], [calories], [category], [cuisine], [cuisine_tags], [dietary_tags], [ingredients], [instructions], [nutrition], [rating], [rating_count], [author], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'rec-006', N'smoky-birria-beef-tacos', N'Slow-Braised Jalisco Beef Birria Quesa-Tacos with Rich Consomé', N'Tender beef chuck and short ribs slow-braised for 4 hours in a rich Guajillo and Ancho chili broth, shredded and folded into corn tortillas dipped in spiced chili oil, griddled with Oaxaca cheese, and served with steaming cilantro consomé.', N'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80', 30, 240, 6, 560, N'Mexican & Street Food', N'Mexican', N'["Mexican Cuisine","Street Food","Tacos"]', N'["Comfort Food","High Protein","Crowd Pleaser"]', N'[{"item":"Beef Chuck Roast & Bone-In Short Ribs","amount":3.5,"unit":"lbs","notes":"Cut into large chunks"},{"item":"Dried Guajillo Chiles","amount":6,"unit":"whole","notes":"Stemmed and deseeded"},{"item":"Dried Ancho Chiles","amount":3,"unit":"whole","notes":"Stemmed and deseeded"},{"item":"Dried Chiles de Árbol","amount":2,"unit":"whole","notes":"For gentle heat"},{"item":"White Onion & Garlic Head","amount":1,"unit":"each","notes":"Halved onion + 8 peeled garlic cloves"},{"item":"Mexican Cinnamon Stick (Canela)","amount":1,"unit":"stick"},{"item":"Mexican Oregano & Ground Cumin","amount":1,"unit":"tbsp each"},{"item":"Apple Cider Vinegar","amount":0.25,"unit":"cup"},{"item":"Beef Bone Broth","amount":4,"unit":"cups"},{"item":"Yellow Corn Tortillas","amount":18,"unit":"count"},{"item":"Oaxaca Cheese or Quesadilla Cheese","amount":12,"unit":"oz","notes":"Shredded"},{"item":"Fresh Cilantro & Diced White Onion","amount":1,"unit":"cup","notes":"For garnish and dipping cup"},{"item":"Fresh Limes","amount":3,"unit":"whole","notes":"Cut into wedges"}]', N'[{"step":1,"title":"Toast & Rehydrate Dried Chilies","instruction":"Toast dried guajillo, ancho, and árbol chilies in a dry Dutch oven for 60 seconds until fragrant. Cover with hot water and soak for 15 minutes until softened."},{"step":2,"title":"Blend the Adobo Marinade","instruction":"Transfer softened chilies to a high-speed blender with vinegar, garlic cloves, onion, Mexican oregano, cumin, cinnamon, black pepper, and 1 cup of beef broth. Blend until silky smooth."},{"step":3,"title":"Slow-Braise Beef to Fall-Apart Tenderness","instruction":"Season beef heavily with salt. Sear in the Dutch oven until browned. Strain chili adobo over the meat and add remaining beef broth. Cover tightly and simmer on low heat (or 325°F oven) for 3.5 to 4 hours until meltingly tender."},{"step":4,"title":"Shred Meat & Skim Consomé Oil","instruction":"Shred the succulent beef and discard bones. Skim the rich spiced red oil from the surface of the consomé into a wide bowl. Season the broth with lime juice and salt."},{"step":5,"title":"Griddle Quesa-Tacos & Serve with Dipping Consomé","instruction":"Dip corn tortillas into the skimmed chili oil, place on a hot flat-top griddle. Top with shredded Oaxaca cheese and beef. Fold in half and fry until deeply golden and crispy. Serve piping hot with mugs of chopped cilantro-onion consomé for dipping."}]', N'{"calories":560,"protein":"38g","carbs":"34g","fat":"31g","fiber":"6g"}', 4.98, 620, N'Chef Sophia Rossi', N'published', NULL, N'2026-03-10T14:00:00Z', N'2026-03-10T14:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[recipes] WHERE [id] = N'rec-007')
    INSERT INTO [dbo].[recipes] ([id], [slug], [title], [description], [hero_image_url], [prep_time], [cook_time], [servings], [calories], [category], [cuisine], [cuisine_tags], [dietary_tags], [ingredients], [instructions], [nutrition], [rating], [rating_count], [author], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'rec-007', N'creamy-tuscan-garlic-chicken', N'Pan-Seared Creamy Tuscan Garlic Chicken with Sun-Dried Tomatoes & Spinach', N'Golden herb-crusted chicken cutlets swimming in a velvety parmesan and garlic cream sauce laced with tart sun-dried tomatoes, wilted baby spinach, and fresh basil ribbons.', N'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80', 10, 20, 4, 490, N'Poultry & Mains', N'Italian', N'["Italian Cuisine","Tuscan","Poultry"]', N'["High Protein","Keto Friendly","Quick Dinner"]', N'[{"item":"Boneless Skinless Chicken Breasts","amount":2,"unit":"large (1.5 lbs)","notes":"Sliced horizontally into 4 thin cutlets"},{"item":"Italian Herb Seasoning & Smoked Paprika","amount":1,"unit":"tbsp"},{"item":"Extra Virgin Olive Oil","amount":2,"unit":"tbsp"},{"item":"Unsalted Butter","amount":2,"unit":"tbsp"},{"item":"Garlic Cloves","amount":6,"unit":"cloves","notes":"Finely minced"},{"item":"Oil-Packed Sun-Dried Tomatoes","amount":0.5,"unit":"cup","notes":"Drained and julienned"},{"item":"Heavy Cream","amount":1,"unit":"cup"},{"item":"Low-Sodium Chicken Bone Broth","amount":0.5,"unit":"cup"},{"item":"Aged Parmigiano-Reggiano","amount":0.75,"unit":"cup","notes":"Freshly grated"},{"item":"Fresh Baby Spinach Leaves","amount":3,"unit":"cups","notes":"Packed"},{"item":"Fresh Basil Ribbons","amount":0.25,"unit":"cup"}]', N'[{"step":1,"title":"Season & Sear Chicken Cutlets","instruction":"Pat chicken dry. Season with salt, pepper, Italian herbs, and paprika. Heat olive oil and 1 tbsp butter in a 12-inch skillet over medium-high heat. Sear cutlets for 4-5 minutes per side until golden and cooked to 165°F. Transfer to a plate."},{"step":2,"title":"Sauté Garlic & Sun-Dried Tomatoes","instruction":"Melt remaining butter in the same skillet. Add minced garlic and sun-dried tomatoes; sauté for 60 seconds until delightfully fragrant."},{"step":3,"title":"Simmer Cream & Parmesan Velouté","instruction":"Pour in chicken broth to deglaze pan browned bits. Stir in heavy cream and bring to a gentle simmer. Reduce heat to low, whisk in grated Parmigiano until silky smooth and slightly thickened."},{"step":4,"title":"Fold Spinach & Return Chicken","instruction":"Add fresh baby spinach and stir until gently wilted (about 2 minutes). Return golden chicken cutlets and resting juices back to the skillet, spooning the luxurious cream sauce over the meat."},{"step":5,"title":"Garnish & Serve","instruction":"Garnish with fresh basil ribbons and cracked black pepper. Serve immediately over buttered fettuccine, cauliflower mash, or crusty ciabatta."}]', N'{"calories":490,"protein":"46g","carbs":"11g","fat":"28g","fiber":"3g"}', 4.88, 275, N'Chef Marco Bellini', N'published', NULL, N'2026-03-12T17:30:00Z', N'2026-03-12T17:30:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[recipes] WHERE [id] = N'rec-008')
    INSERT INTO [dbo].[recipes] ([id], [slug], [title], [description], [hero_image_url], [prep_time], [cook_time], [servings], [calories], [category], [cuisine], [cuisine_tags], [dietary_tags], [ingredients], [instructions], [nutrition], [rating], [rating_count], [author], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'rec-008', N'matcha-green-tea-tiramisu', N'Ceremonial Uji Matcha Tiramisu with Whipped Mascarpone & Yuzu Kiss', N'A modern Japanese-Italian fusion dessert crafted with sponge ladyfingers drenched in ceremonial grade Uji matcha liquor, layered with cloud-like yuzu mascarpone cream, and dusted with emerald matcha velvet.', N'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=1200&q=80', 35, 20, 8, 410, N'Desserts & Baking', N'Japanese', N'["Japanese Cuisine","Fusion","Desserts"]', N'["Desserts","Vegetarian","Indulgent"]', N'[{"item":"Ceremonial Grade Uji Matcha Powder","amount":3,"unit":"tbsp","notes":"Sifted (divided for soaking & dusting)"},{"item":"Warm Water (175°F / 80°C)","amount":1.5,"unit":"cups"},{"item":"Italian Savoiardi Ladyfingers","amount":24,"unit":"cookies"},{"item":"Authentic Mascarpone Cheese","amount":16,"unit":"oz (450g)","notes":"Room temperature"},{"item":"Heavy Whipping Cream (36% fat)","amount":1.25,"unit":"cups","notes":"Chilled"},{"item":"Granulated Sugar","amount":0.75,"unit":"cup"},{"item":"Pasteurized Egg Yolks","amount":3,"unit":"large"},{"item":"Fresh Yuzu Juice or Lemon Zest","amount":1,"unit":"tsp","notes":"For subtle citrus lift"},{"item":"Mirin or Sweet White Rum (Optional)","amount":1,"unit":"tbsp"}]', N'[{"step":1,"title":"Whisk Matcha Soaking Elixir","instruction":"In a shallow dish, whisk 2 tbsp sifted ceremonial matcha powder with warm water, 2 tbsp sugar, and optional rum using a bamboo chasen whisk until smooth and frothy. Allow to cool."},{"step":2,"title":"Whip Sabayon & Creamy Mascarpone","instruction":"Whisk egg yolks with remaining sugar over a gentle double boiler for 4-5 minutes until pale and doubled in volume. Whisk in mascarpone and yuzu juice until glossy and uniform."},{"step":3,"title":"Fold Whipped Cream for Cloud Texture","instruction":"In a chilled bowl, beat heavy whipping cream to medium-stiff peaks. Gently fold whipped cream into the mascarpone mixture in three additions with a rubber spatula."},{"step":4,"title":"Dip Ladyfingers & Layer Dish","instruction":"Quickly submerge each ladyfinger in the matcha tea for 1-2 seconds (do not over-soak). Line the bottom of an 8x8-inch glass dish. Spread half the mascarpone cream. Repeat with a second layer of soaked ladyfingers and finish with remaining cream smoothed flat."},{"step":5,"title":"Chill & Velvet Matcha Dusting","instruction":"Refrigerate uncovered for at least 6 hours (or overnight) to set. Right before presenting, generously dust the top with remaining ceremonial matcha powder using a fine sieve for a pristine emerald finish."}]', N'{"calories":410,"protein":"8g","carbs":"42g","fat":"23g","fiber":"2g"}', 4.92, 310, N'Pastry Chef Elena Vance', N'published', NULL, N'2026-03-14T11:00:00Z', N'2026-03-14T11:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[recipes] WHERE [id] = N'rec-009')
    INSERT INTO [dbo].[recipes] ([id], [slug], [title], [description], [hero_image_url], [prep_time], [cook_time], [servings], [calories], [category], [cuisine], [cuisine_tags], [dietary_tags], [ingredients], [instructions], [nutrition], [rating], [rating_count], [author], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'rec-009', N'shoyu-ramen-with-chashu-pork', N'Kyoto-Style Shoyu Ramen with 12-Hour Chashu Pork Belly & Ajitsuke Tamago', N'Silky clear chicken-dashi broth infused with aged smoked soy tare, springy hand-folded alkaline noodles, melt-in-the-mouth rolled pork chashu, jammy marinated eggs, and fragrant scallion oil.', N'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80', 40, 180, 4, 640, N'Asian & Stir-Fry', N'Japanese', N'["Japanese Cuisine","Ramen","Noodles"]', N'["Comfort Food","High Protein","Gourmet"]', N'[{"item":"Fresh Alkaline Ramen Noodles","amount":4,"unit":"portions (600g)"},{"item":"Pork Belly (Skin-on or off)","amount":2,"unit":"lbs","notes":"Rolled and tied with butcher twine"},{"item":"Japanese Shoyu (Aged Soy Sauce)","amount":0.75,"unit":"cup"},{"item":"Mirin & Japanese Sake","amount":0.5,"unit":"cup each"},{"item":"Kombu Kelp & Katsuobushi (Bonito Flakes)","amount":1,"unit":"sheet + 1 cup flakes","notes":"For dashi base"},{"item":"Rich Chicken Stock","amount":6,"unit":"cups"},{"item":"Large Eggs (Soft-boiled 6 min 30 sec)","amount":4,"unit":"whole","notes":"Marinated in tare"},{"item":"Scallions / Green Onions","amount":6,"unit":"stalks","notes":"Thinly sliced"},{"item":"Seasoned Menma (Bamboo Shoots)","amount":0.5,"unit":"cup"},{"item":"Toasted Nori Seaweed Sheets","amount":4,"unit":"sheets"},{"item":"Aromatic Scallion Oil / Rayu","amount":2,"unit":"tbsp"}]', N'[{"step":1,"title":"Braise Chashu Pork Belly","instruction":"Sear rolled pork belly in a Dutch oven until golden on all sides. Add soy sauce, mirin, sake, water, scallion whites, and ginger. Simmer on low covered for 2 hours until tender. Chill pork before slicing into neat 1/4-inch rounds."},{"step":2,"title":"Marinate Jammy Ajitsuke Eggs","instruction":"Boil eggs for exactly 6 minutes and 30 seconds, plunge into ice water and peel carefully. Submerge in 1/2 cup of cooled chashu braising liquid for 4 to 12 hours."},{"step":3,"title":"Simmer Double-Soup Broth & Tare","instruction":"Steep kombu kelp and bonito flakes in hot chicken stock for 20 minutes; strain to create a pristine dashi-chicken double broth. Keep at a rolling simmer."},{"step":4,"title":"Boil Fresh Noodles","instruction":"Boil fresh alkaline ramen noodles in a large pot of unsalted boiling water for 90 seconds (firm bite). Shake noodles thoroughly in a strainer to remove excess moisture."},{"step":5,"title":"Bowl Assembly & Torch Garnish","instruction":"In 4 pre-warmed ramen bowls, add 2 tbsp smoked shoyu tare and 1 tsp scallion oil. Ladle 1.5 cups piping hot broth and whisk. Fold noodles in. Top with torched chashu slices, halved jammy egg, menma, scallions, and nori sheets."}]', N'{"calories":640,"protein":"36g","carbs":"68g","fat":"26g","fiber":"4g"}', 4.96, 480, N'Chef Kenji Takahashi', N'published', NULL, N'2026-03-15T15:00:00Z', N'2026-03-15T15:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[recipes] WHERE [id] = N'rec-010')
    INSERT INTO [dbo].[recipes] ([id], [slug], [title], [description], [hero_image_url], [prep_time], [cook_time], [servings], [calories], [category], [cuisine], [cuisine_tags], [dietary_tags], [ingredients], [instructions], [nutrition], [rating], [rating_count], [author], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'rec-010', N'avocado-poached-egg-sourdough-toast', N'Artisanal Sourdough Avocado Toast with Poached Eggs, Pickled Shallots & Dukkah', N'Charred rustic sourdough lathered with citrus-smashed Hass avocados, perfectly poached organic eggs with runny yolks, crunchy Egyptian dukkah spice blend, microgreens, and pickled shallot rings.', N'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80', 10, 5, 2, 380, N'Breakfast & Brunch', N'Mediterranean', N'["Mediterranean","Brunch","Healthy"]', N'["Vegetarian Optional","High Protein","Quick Dinner"]', N'[{"item":"Artisanal Country Sourdough Bread","amount":2,"unit":"thick slices"},{"item":"Ripe Hass Avocados","amount":2,"unit":"whole"},{"item":"Fresh Organic Large Eggs","amount":2,"unit":"whole"},{"item":"Egyptian Dukkah (Toasted Hazelnuts, Sesame, Coriander, Cumin)","amount":2,"unit":"tbsp"},{"item":"Pickled Red Shallot Rings","amount":2,"unit":"tbsp"},{"item":"Fresh Lime Juice","amount":1,"unit":"tbsp"},{"item":"Extra Virgin Olive Oil","amount":1,"unit":"tbsp"},{"item":"Garlic Clove","amount":1,"unit":"clove","notes":"Cut in half for rubbing bread"},{"item":"Organic Pea Shoots or Radish Microgreens","amount":0.5,"unit":"cup"},{"item":"Flaky Pink Himalayan Salt & Aleppo Pepper","amount":0.5,"unit":"tsp each"}]', N'[{"step":1,"title":"Toast & Garlic-Rub Sourdough","instruction":"Brush thick slices of sourdough with olive oil and toast on a hot cast-iron skillet until deeply golden with charred edges. Lightly rub cut garlic clove across the warm crusty surface."},{"step":2,"title":"Citrus Herb Avocado Smash","instruction":"Scoop ripe avocados into a bowl. Add fresh lime juice, flaky sea salt, black pepper, and a drizzle of olive oil. Coarsely mash with a fork, leaving satisfying chunks."},{"step":3,"title":"Poach Eggs to Silky Yolk Perfection","instruction":"Bring a pot of water to a gentle sub-boil (190°F) with 1 tbsp white vinegar. Create a gentle whirlpool, drop cracked egg into the center, and poach for precisely 3 minutes. Remove with a slotted spoon and drain on paper towel."},{"step":4,"title":"Assemble with Crunch & Color","instruction":"Generously spread chunky smashed avocado over the toasted sourdough. Crown each slice with a warm poached egg."},{"step":5,"title":"Finishing Touches","instruction":"Scatter crunchy hazelnut dukkah spice, tangy pickled shallot rings, fresh microgreens, and a dusting of Aleppo pepper flakes. Slice open the egg yolk to cascade down the avocado."}]', N'{"calories":380,"protein":"18g","carbs":"32g","fat":"22g","fiber":"8g"}', 4.85, 194, N'Chef Sophia Rossi', N'published', NULL, N'2026-03-16T08:30:00Z', N'2026-03-16T08:30:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[recipes] WHERE [id] = N'rec-011')
    INSERT INTO [dbo].[recipes] ([id], [slug], [title], [description], [hero_image_url], [prep_time], [cook_time], [servings], [calories], [category], [cuisine], [cuisine_tags], [dietary_tags], [ingredients], [instructions], [nutrition], [rating], [rating_count], [author], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'rec-011', N'velvety-butter-chicken-murgh-makhani', N'Restaurant-Grade Velvety Butter Chicken (Murgh Makhani) with Kasuri Methi', N'Smoky, charred tandoori-marinated chicken thighs simmered in a velvety silk gravy of San Marzano tomatoes, cashew butter, double cream, and crushed sun-dried fenugreek leaves (kasuri methi).', N'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=1200&q=80', 25, 35, 5, 590, N'Curries & Stews', N'Indian', N'["Indian Cuisine","North Indian","Curry","Mughlai"]', N'["High Protein","Gluten-Free","Comfort Food","Crowd Pleaser"]', N'[{"item":"Boneless Skinless Chicken Thighs","amount":2,"unit":"lbs","notes":"Cut into bite-sized chunks"},{"item":"Greek Yogurt / Hung Curd","amount":0.5,"unit":"cup","notes":"For tandoori marinade"},{"item":"Garlic-Ginger Paste","amount":2.5,"unit":"tbsp","notes":"Freshly pounded"},{"item":"Kashmiri Red Chili Powder","amount":2,"unit":"tbsp","notes":"Vibrant color and mild heat"},{"item":"Garam Masala & Ground Cumin","amount":1.5,"unit":"tbsp each"},{"item":"Ripe Plum / San Marzano Tomatoes","amount":24,"unit":"oz","notes":"Blanched and pureed smooth"},{"item":"Raw Cashew Nuts","amount":0.33,"unit":"cup","notes":"Soaked in hot water and blended smooth"},{"item":"Grass-Fed Butter","amount":4,"unit":"tbsp","notes":"Divided"},{"item":"Heavy Double Cream","amount":0.5,"unit":"cup"},{"item":"Kasuri Methi (Dried Fenugreek Leaves)","amount":1.5,"unit":"tbsp","notes":"Toasted and crushed between palms"},{"item":"Honey or Jaggery","amount":1,"unit":"tbsp","notes":"To balance acidity"},{"item":"Fresh Cilantro","amount":0.25,"unit":"cup","notes":"Finely chopped for garnish"}]', N'[{"step":1,"title":"Tandoori Chicken Marinade","instruction":"In a bowl, mix chicken with Greek yogurt, 1 tbsp ginger-garlic paste, 1 tbsp Kashmiri chili, 1 tsp garam masala, lemon juice, and 1 tsp salt. Marinate for at least 30 minutes (or overnight)."},{"step":2,"title":"High-Heat Charring","instruction":"Heat 1 tbsp butter in a cast-iron skillet or broil chicken on high rack for 8-10 minutes until edges develop deep smoky tandoori char spots. Remove and set aside."},{"step":3,"title":"Build the Makhani Velouté","instruction":"Melt 2 tbsp butter in a heavy saucepot. Sauté remaining ginger-garlic paste for 60 seconds. Pour in pureed tomatoes, Kashmiri chili, cumin, and salt. Simmer covered on medium-low for 15 minutes until oil separates."},{"step":4,"title":"Silk Cashew Emulsion & Cream","instruction":"Pour the blended cashew paste and simmer for 5 minutes until creamy. Strain gravy through a fine-mesh sieve if restaurant-mirror silkiness is desired. Stir in heavy cream and honey."},{"step":5,"title":"Simmer Chicken & Fenugreek Aromatics","instruction":"Fold charred chicken into the velvety sauce along with resting juices. Simmer for 7 minutes on low. Finish with remaining butter and crush toasted kasuri methi over top. Garnish with cream swirl and fresh cilantro."}]', N'{"calories":590,"protein":"44g","carbs":"14g","fat":"38g","fiber":"4g"}', 4.97, 512, N'Chef Rajesh Sharma & Ultimatum Test Kitchen', N'published', NULL, N'2026-03-18T10:00:00Z', N'2026-03-18T10:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[recipes] WHERE [id] = N'rec-012')
    INSERT INTO [dbo].[recipes] ([id], [slug], [title], [description], [hero_image_url], [prep_time], [cook_time], [servings], [calories], [category], [cuisine], [cuisine_tags], [dietary_tags], [ingredients], [instructions], [nutrition], [rating], [rating_count], [author], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'rec-012', N'authentic-lahori-mutton-karahi', N'Authentic Lahori Mutton Karahi with Fresh Ginger Juliennes & Green Chilies', N'A legendary Desi specialty cooked in an authentic iron wok on blazing high flame. Tender bone-in goat/lamb braised in fresh tomatoes, garlic, freshly ground black peppercorns, roasted cumin, and pungent green chilies with zero onion filler.', N'https://images.unsplash.com/photo-1545247181-516773cae7be?auto=format&fit=crop&w=1200&q=80', 20, 55, 4, 610, N'Curries & Stews', N'Desi', N'["Desi Cuisine","Pakistani","Lahori","Karahi","Mutton"]', N'["High Protein","Keto Friendly","Gluten-Free","Spicy"]', N'[{"item":"Bone-In Mutton or Young Goat/Lamb","amount":2,"unit":"lbs","notes":"Cut into 1.5-inch curry pieces"},{"item":"Fresh Red Tomatoes","amount":6,"unit":"large","notes":"Halved lengthwise"},{"item":"Fresh Ginger","amount":3,"unit":"inch knobs","notes":"Divided: half crushed paste, half thin juliennes"},{"item":"Fresh Garlic Cloves","amount":10,"unit":"cloves","notes":"Crushed with coarse salt"},{"item":"Desi Ghee or Mustard Oil","amount":0.33,"unit":"cup"},{"item":"Fresh Green Birds-Eye Chilies","amount":6,"unit":"whole","notes":"Slit lengthwise"},{"item":"Coarsely Crushed Black Peppercorns","amount":1.5,"unit":"tbsp","notes":"Freshly mortar-pestle cracked"},{"item":"Roasted Coriander & Cumin Seeds","amount":1.5,"unit":"tbsp","notes":"Dry roasted and coarsely cracked"},{"item":"Whisked Greek Yogurt","amount":3,"unit":"tbsp"},{"item":"Fresh Cilantro","amount":0.5,"unit":"cup","notes":"Generously chopped"},{"item":"Fresh Lemon Juice","amount":1.5,"unit":"tbsp"}]', N'[{"step":1,"title":"Initial Meat Braise in Wok (Karahi)","instruction":"In a traditional cast-iron wok (karahi), add mutton, crushed garlic paste, half the ginger paste, 1 cup water, and 1 tsp salt. Cover tightly and simmer on medium-low for 35-40 minutes until meat is 80% tender."},{"step":2,"title":"Layer Halved Tomatoes","instruction":"Uncover wok and arrange halved tomatoes cut-side down directly over the simmering meat. Cover for 7 minutes until skins loosen. Use kitchen tongs to peel off and discard all tomato skins, then mash the pulp into the juices with a flat spatula."},{"step":3,"title":"High-Flame Desi Bhunai (Sear)","instruction":"Turn the burner to high heat. Add desi ghee, slit green chilies, and whisked yogurt. Stir vigorously for 8-10 minutes (bhunai technique) until water evaporates and fragrant red-gold ghee separates around the rim."},{"step":4,"title":"Add Fresh Aromatics & Roasted Spices","instruction":"Sprinkle freshly crushed black peppercorns, roasted coriander-cumin powder, and garam masala. Toss for 90 seconds to lock in aromas without scorching spices."},{"step":5,"title":"Garnish & Sizzling Presentation","instruction":"Remove from flame. Generously heap fresh ginger juliennes, chopped cilantro, and fresh lemon juice over the bubbling karahi. Serve sizzling hot directly in the wok with tandoori roghani naan."}]', N'{"calories":610,"protein":"48g","carbs":"9g","fat":"42g","fiber":"3g"}', 4.99, 488, N'Chef Tariq Lahori & Ultimatum Test Kitchen', N'published', NULL, N'2026-03-20T12:00:00Z', N'2026-03-20T12:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[recipes] WHERE [id] = N'rec-013')
    INSERT INTO [dbo].[recipes] ([id], [slug], [title], [description], [hero_image_url], [prep_time], [cook_time], [servings], [calories], [category], [cuisine], [cuisine_tags], [dietary_tags], [ingredients], [instructions], [nutrition], [rating], [rating_count], [author], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'rec-013', N'royal-hyderabadi-mutton-dum-biryani', N'Royal Hyderabadi Mutton Dum Biryani with Saffron Milk & Caramelized Onions', N'The pinnacle of royal Mughlai-Deccani cuisine. Marinated bone-in mutton par-cooked with aromatic whole spices, layered with 70% par-boiled aged long-grain basmati rice, fried crisp shallots (birista), saffron-infused warm milk, and sealed with dough for authentic steam dum cooking.', N'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=80', 40, 60, 8, 670, N'Curries & Stews', N'Desi', N'["Desi Cuisine","Indian Cuisine","Biryani","Hyderabadi","Rice"]', N'["High Protein","Comfort Food","Celebration","Crowd Pleaser"]', N'[{"item":"Aged Extra-Long Basmati Rice (2+ Years Aged)","amount":3.5,"unit":"cups (700g)","notes":"Washed and soaked for 45 mins"},{"item":"Bone-In Tender Mutton / Goat","amount":2.5,"unit":"lbs","notes":"Cut into medium pieces"},{"item":"Golden Fried Crispy Onions (Birista)","amount":2,"unit":"cups","notes":"Thinly sliced and golden fried"},{"item":"Thick Whole Milk Yogurt","amount":1.25,"unit":"cups"},{"item":"Fresh Ginger-Garlic Paste","amount":3,"unit":"tbsp"},{"item":"Kewra Water & Rose Water","amount":1,"unit":"tsp each"},{"item":"Pure Saffron Strands soaked in Warm Milk","amount":1,"unit":"pinch + 0.33 cup milk"},{"item":"Desi Ghee","amount":0.33,"unit":"cup"},{"item":"Fresh Mint & Cilantro Leaves","amount":1,"unit":"cup each","notes":"Coarsely chopped"},{"item":"Whole Spices (Green Cardamom, Cloves, Star Anise, Black Cardamom, Shahi Jeera, Cinnamon)","amount":2,"unit":"tbsp combined"},{"item":"Raw Green Papaya Paste (Meat Tenderizer)","amount":1.5,"unit":"tbsp"},{"item":"Wheat Flour Dough","amount":1,"unit":"ball","notes":"For hermetic pot rim sealing"}]', N'[{"step":1,"title":"Royal Mutton Marination (Kacchi Akhni)","instruction":"Marinate mutton with yogurt, ginger-garlic paste, papaya paste, half the fried onions, mint, cilantro, red chili powder, shahi jeera, garam masala, ghee, and salt. Refrigerate for at least 3 hours to break down collagen fibers."},{"step":2,"title":"70% Rice Par-Boil (Al Dente Basmati)","instruction":"In a massive stockpot with 5 liters of heavily salted boiling water (infused with green cardamom, cinnamon, and bay leaf), boil soaked basmati rice for precisely 5-6 minutes until 70% cooked (grain bends slightly but does not snap). Drain immediately."},{"step":3,"title":"The Dum Layering Architecture","instruction":"In a heavy-bottomed copper or cast-iron handi, spread the marinated mutton evenly as the bottom base. Layer the fragrant steaming basmati over the meat. Top with remaining golden onions, fresh mint, cilantro, warm saffron milk, kewra water, and swirls of melted desi ghee."},{"step":4,"title":"Hermetic Flour Dough Seal (Dum Pukht)","instruction":"Roll wheat dough into a thick rope along the rim of the pot. Press lid down firmly to lock all internal steam pressure. Cook on medium flame for 15 minutes, then place a flat cast iron tawa underneath and slow-steam on low flame for 40 minutes."},{"step":5,"title":"Rest & Royal Reveal","instruction":"Turn off flame and let rest for 15 minutes. Slice through the crisp dough seal. Use a flat saucer or skimmer to gently lift layers from bottom to top, revealing gradient hues of saffron, pure white basmati, and succulent spiced mutton. Serve with chilled cucumber-mint raita and mirchi ka salan."}]', N'{"calories":670,"protein":"42g","carbs":"76g","fat":"22g","fiber":"4g"}', 5, 640, N'Ustad Khursheed & Ultimatum Test Kitchen', N'published', NULL, N'2026-03-22T14:00:00Z', N'2026-03-22T14:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[recipes] WHERE [id] = N'rec-014')
    INSERT INTO [dbo].[recipes] ([id], [slug], [title], [description], [hero_image_url], [prep_time], [cook_time], [servings], [calories], [category], [cuisine], [cuisine_tags], [dietary_tags], [ingredients], [instructions], [nutrition], [rating], [rating_count], [author], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'rec-014', N'authentic-szechuan-kung-pao-chicken', N'Traditional Szechuan Kung Pao Chicken with Roasted Peanuts & Facing-Heaven Chilies', N'Fiery, sweet, tart, and mouth-numbing (Málà). Diced velvety chicken thighs wok-charred with authentic Szechuan peppercorns, dried facing-heaven chilies, crisp leek batons, and crunchy roasted peanuts in a complex dark Chinkiang vinegar glaze.', N'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1200&q=80', 20, 10, 4, 460, N'Asian & Stir-Fry', N'Chinese', N'["Chinese Cuisine","Szechuan","Wok Stir-Fry","Spicy"]', N'["High Protein","Quick Dinner","Spicy"]', N'[{"item":"Boneless Skinless Chicken Thighs","amount":1.5,"unit":"lbs","notes":"Diced into neat 3/4-inch cubes"},{"item":"Shaoxing Cooking Wine","amount":2,"unit":"tbsp"},{"item":"Light Soy Sauce & Dark Soy Sauce","amount":1.5,"unit":"tbsp each"},{"item":"Cornstarch (for velveting & sauce)","amount":2,"unit":"tbsp"},{"item":"Authentic Red Szechuan Peppercorns","amount":1,"unit":"tbsp","notes":"Lightly crushed and deseeded"},{"item":"Dried Facing-Heaven / Tien Tsin Chilies","amount":15,"unit":"whole","notes":"Snipped into halves, seeds shaken out"},{"item":"Aged Chinkiang Black Vinegar","amount":2,"unit":"tbsp"},{"item":"Raw Sugar or Brown Sugar","amount":1.5,"unit":"tbsp"},{"item":"Chicken Bone Broth","amount":0.25,"unit":"cup"},{"item":"Scallions / Leeks","amount":4,"unit":"stalks","notes":"Cut into 1-inch white batons"},{"item":"Fresh Garlic & Ginger","amount":4,"unit":"cloves + 1 inch knob","notes":"Thinly sliced into coins"},{"item":"Roasted Unsalted Peanuts","amount":0.5,"unit":"cup","notes":"Crisp and skins removed"},{"item":"Peanut Oil or Neutral Oil","amount":3,"unit":"tbsp"}]', N'[{"step":1,"title":"Velvet the Chicken Cubes","instruction":"In a bowl, toss diced chicken with 1 tbsp Shaoxing wine, 1 tbsp light soy sauce, 1 tbsp cornstarch, 1 tbsp water, and 1 tsp oil. Let sit for 15 minutes to create an insulating velvet protein seal."},{"step":2,"title":"Whisk the Master Sweet-Sour-Salty Glaze","instruction":"In a small bowl, whisk Chinkiang black vinegar, sugar, dark soy sauce, remaining Shaoxing wine, chicken broth, and 1 tsp cornstarch until sugar dissolves completely."},{"step":3,"title":"Season the Wok & Bloom Aromatics","instruction":"Heat a carbon-steel wok over maximum high flame until smoking hot. Add peanut oil, drop in Szechuan peppercorns and dried chilies. Stir-fry for 15 seconds until chilies darken to deep mahogany and oil is fragrant (do not burn)."},{"step":4,"title":"Flash Stir-Fry Chicken (Wok Hei)","instruction":"Slide in chicken cubes and spread across the blazing wok surface. Sear for 90 seconds, then toss rapidly. Add sliced garlic, ginger, and scallion white batons; stir-fry for another 60 seconds."},{"step":5,"title":"Glaze & Peanut Finish","instruction":"Pour the stirred master sauce around the perimeter of the wok. Toss vigorously as the sauce instantly thickens and coats every chicken cube in a glossy lacquer. Toss in roasted peanuts, give two swift wok flips, and serve immediately with jasmine rice."}]', N'{"calories":460,"protein":"36g","carbs":"18g","fat":"26g","fiber":"4g"}', 4.94, 376, N'Chef Lin Wei & Ultimatum Test Kitchen', N'published', NULL, N'2026-03-24T11:00:00Z', N'2026-03-24T11:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[recipes] WHERE [id] = N'rec-015')
    INSERT INTO [dbo].[recipes] ([id], [slug], [title], [description], [hero_image_url], [prep_time], [cook_time], [servings], [calories], [category], [cuisine], [cuisine_tags], [dietary_tags], [ingredients], [instructions], [nutrition], [rating], [rating_count], [author], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'rec-015', N'cantonese-dim-sum-ginger-scallion-dumplings', N'Artisanal Cantonese Dim Sum Ginger-Scallion Chicken & Shrimp Dumplings', N'Delicate translucent pleated dumplings packed with juicy minced chicken, wild tiger shrimp chunks, water chestnuts, toasted sesame oil, and fragrant scallion-ginger oil. Served with homemade chili crisp and black vinegar dip.', N'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=1200&q=80', 35, 10, 4, 390, N'Asian & Stir-Fry', N'Chinese', N'["Chinese Cuisine","Dim Sum","Cantonese","Dumplings","Appetizer"]', N'["High Protein","Comfort Food","Crowd Pleaser"]', N'[{"item":"Ground Chicken Thigh or Pork","amount":1,"unit":"lb"},{"item":"Raw Tiger Shrimp","amount":0.5,"unit":"lb","notes":"Peeled, deveined, and coarsely diced into chunks"},{"item":"Round Dumpling / Gyoza Wrappers","amount":32,"unit":"wrappers","notes":"Fresh thin wheat wrappers"},{"item":"Fresh Water Chestnuts","amount":0.5,"unit":"cup","notes":"Finely minced for crunch"},{"item":"Scallions / Spring Onions","amount":4,"unit":"stalks","notes":"Finely minced"},{"item":"Fresh Ginger","amount":1.5,"unit":"tbsp","notes":"Grated to fine paste"},{"item":"Toasted Sesame Oil","amount":1.5,"unit":"tbsp"},{"item":"Shaoxing Wine & Light Soy Sauce","amount":1,"unit":"tbsp each"},{"item":"White Pepper & Sugar","amount":0.5,"unit":"tsp each"},{"item":"Chili Crisp Oil & Chinkiang Vinegar","amount":3,"unit":"tbsp each","notes":"For dipping sauce"}]', N'[{"step":1,"title":"Whip the Springy Dumpling Filling","instruction":"In a large bowl, combine minced chicken, shrimp chunks, water chestnuts, ginger, scallions, soy sauce, Shaoxing wine, sesame oil, white pepper, salt, and cornstarch. Stir vigorously in one circular direction for 3 minutes until paste becomes cohesive and springy."},{"step":2,"title":"Pleat & Fold Dumplings","instruction":"Place a wrapper on your palm. Add 1 tbsp filling to center. Moisten edges with a fingertip of water. Fold wrapper in half and create 5-6 tight overlapping pleats along one side to seal completely with zero air bubbles."},{"step":3,"title":"Bamboo Steamer Setup","instruction":"Line bamboo steamer baskets with perforated parchment paper or napa cabbage leaves. Arrange dumplings with 1/2 inch gap between them."},{"step":4,"title":"High-Steam Cooking","instruction":"Bring water in a wok to a vigorous rolling boil. Place stacked bamboo steamers on top. Cover tightly and steam over high heat for precisely 8-9 minutes until wrappers turn glossy and translucent."},{"step":5,"title":"Dipping Sauce & Presentation","instruction":"Whisk chili crisp oil with Chinkiang black vinegar and minced scallions. Serve dumplings piping hot straight from the bamboo basket."}]', N'{"calories":390,"protein":"28g","carbs":"38g","fat":"12g","fiber":"3g"}', 4.96, 420, N'Master Dim Sum Chef Chen & Ultimatum Test Kitchen', N'published', NULL, N'2026-03-26T09:00:00Z', N'2026-03-26T09:00:00Z', GETUTCDATE());
GO

-- 3.6 Seed Reviews
IF NOT EXISTS (SELECT 1 FROM [dbo].[reviews] WHERE [id] = N'rev-001')
    INSERT INTO [dbo].[reviews] ([id], [slug], [product_name], [category], [rating], [summary], [verdict], [pros], [cons], [specifications], [affiliate_link], [affiliate_retailer], [hero_image_url], [author], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'rev-001', N'apex-chrono-v2-modular-smartwatch', N'Apex Chrono V2 Modular Smartwatch', N'tech_hardware', 4.8, N'A revolutionary titanium-chassis smartwatch featuring swappable sensor modules, 14-day battery life, and an ultra-bright 2000-nit AMOLED display engineered for extreme gamers and outdoor adventurers.', N'The Apex Chrono V2 is undeniably the most versatile and durable wearable we have tested this year. The modular magnetic sensor system solves the upgrade dilemma, offering unmatched build quality.', N'["Hot-swappable sensor modules (Heart rate, GPS, EMG muscle tracker)","Astonishing 14-day real-world battery endurance","Aircraft-grade Grade 5 Titanium bezel with sapphire crystal","Ultra-responsive 120Hz 2000-nit AMOLED panel"]', N'["Proprietary charging puck required","Heavier on smaller wrists (68g without strap)","Companion app setup takes 15 minutes"]', N'{"Display":"1.43-inch AMOLED, 466x466 (2000 nits peak)","Case Material":"Grade 5 Brushed Titanium & Ceramic Back","Battery Capacity":"620 mAh (Up to 14 Days Normal Usage)","Water Resistance":"10 ATM (100m Submersion Certified)","Connectivity":"Bluetooth 5.4, Wi-Fi 6, Dual-Frequency Multi-GNSS","Weight":"68 grams (Chassis only)","OS Compatibility":"iOS 16+ & Android 12+","MSRP":"$449.00 USD"}', N'https://example.com/affiliate/apex-chrono-v2', N'Apex Official Store / Amazon Prime', N'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80', N'Alex Mercer (Hardware Lead)', N'published', NULL, N'2026-02-18T10:00:00Z', N'2026-02-18T10:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[reviews] WHERE [id] = N'rev-002')
    INSERT INTO [dbo].[reviews] ([id], [slug], [product_name], [category], [rating], [summary], [verdict], [pros], [cons], [specifications], [affiliate_link], [affiliate_retailer], [hero_image_url], [author], [status], [scheduled_for], [published_at], [created_at], [updated_at])
    VALUES (N'rev-002', N'tokyo-ramen-box-express-delivery', N'Tokyo Craft Ramen Express Kit (10-Bowl Artisanal Box)', N'food_lifestyle', 4.9, N'A flash-frozen Michelin-grade artisanal ramen delivery kit direct from Tokyo master kitchens, featuring 24-hour simmered Tonkotsu & Black Garlic broths, handmade alkaline noodles, and melt-in-your-mouth Chashu pork belly.', N'This is not instant ramen—it is bona fide restaurant broth delivered right to your doorstep. The freshness and depth of umami will ruin takeout ramen forever.', N'["Gel-pack frozen rich broth pouches preserved without preservatives","Incredible springy texture in the freshly extruded wavy noodles","Includes authentic marinated ajitsuke tamago eggs & wood ear mushrooms","Ready in under 8 minutes from freezer to table"]', N'["Requires significant freezer storage space","Higher shipping cost outside metropolitan delivery zones"]', N'{"Portion Count":"10 Complete Bowls (5 Tonkotsu, 5 Spicy Miso)","Shelf Life":"6 Months Frozen (-18°C)","Prep Time":"8 Minutes (Boil & Combine)","Included Toppings":"Torched Chashu, Seasoned Menma, Nori, Rayu Chili Oil","Delivery Speed":"Overnight Insulated Dry Ice Express","Price Per Bowl":"$12.90 ($129 Box Total)"}', N'https://example.com/affiliate/tokyo-ramen-box', N'Tokyo Gourmet Direct', N'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80', N'Chef Marco Bellini', N'published', NULL, N'2026-03-03T11:00:00Z', N'2026-03-03T11:00:00Z', GETUTCDATE());
GO

-- 3.7 Seed Sponsors
IF NOT EXISTS (SELECT 1 FROM [dbo].[sponsors] WHERE [id] = N'sp-001')
    INSERT INTO [dbo].[sponsors] ([id], [sponsor_name], [image_url], [destination_url], [slot_position], [impressions_tracked], [clicks_tracked], [is_active], [created_at], [updated_at])
    VALUES (N'sp-001', N'Razer Blade Pro Series', N'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80', N'https://example.com/sponsor/razer', N'header_banner', 48200, 2840, 1, N'2026-01-01T00:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[sponsors] WHERE [id] = N'sp-002')
    INSERT INTO [dbo].[sponsors] ([id], [sponsor_name], [image_url], [destination_url], [slot_position], [impressions_tracked], [clicks_tracked], [is_active], [created_at], [updated_at])
    VALUES (N'sp-002', N'Hestan NanoBond Master Cookware', N'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80', N'https://example.com/sponsor/hestan', N'sidebar', 31400, 1620, 1, N'2026-01-10T00:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[sponsors] WHERE [id] = N'sp-003')
    INSERT INTO [dbo].[sponsors] ([id], [sponsor_name], [image_url], [destination_url], [slot_position], [impressions_tracked], [clicks_tracked], [is_active], [created_at], [updated_at])
    VALUES (N'sp-003', N'Anker Prime GaN Fast Chargers', N'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80', N'https://example.com/sponsor/anker', N'in_content', 64100, 4290, 1, N'2026-01-15T00:00:00Z', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[sponsors] WHERE [id] = N'sp-004')
    INSERT INTO [dbo].[sponsors] ([id], [sponsor_name], [image_url], [destination_url], [slot_position], [impressions_tracked], [clicks_tracked], [is_active], [created_at], [updated_at])
    VALUES (N'sp-004', N'NordVPN Cyber Security', N'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80', N'https://example.com/sponsor/nordvpn', N'footer', 18900, 940, 1, N'2026-02-01T00:00:00Z', GETUTCDATE());
GO

-- 3.8 Seed Custom Pages
IF NOT EXISTS (SELECT 1 FROM [dbo].[pages] WHERE [id] = N'page-001')
    INSERT INTO [dbo].[pages] ([id], [slug], [title], [subtitle], [content], [meta_description], [show_in_nav], [show_in_footer], [enable_ads], [created_at], [updated_at])
    VALUES (N'page-001', N'summer-championship-2026', N'Ultimatum Summer Arcade Championship 2026', N'Compete for $10,000 in gear prizes, exclusive limited-edition gamer badges, and global bragging rights.', N'# Welcome to the Summer 2026 Arcade Championship!

Get ready for 6 weeks of intense high-score competition across **The Arcade**.

### Tournament Rules & Mechanics
1. **Weekly Leaderboard Resets**: Every Sunday at midnight UTC, the top 10 players on Neon Asteroid Blitz receive tournament bonus tokens.
2. **Double Engagement Points**: Earn 2x XP for every 1,000 points scored in canvas games during tournament hours.
3. **Anti-Cheat Verification**: All scores are monitored in real-time by our Admin Moderation engine. Fraudulent score spoofing will result in immediate disqualification.', N'Join the Ultimatum Summer 2026 Arcade Tournament! Play weekly retro games, score points, and win top tier sponsor gear.', 1, 1, 1, N'2026-02-15T00:00:00Z', GETUTCDATE());
GO

-- 3.9 Seed Shop Items
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'turbo_stove_v1')
    INSERT INTO [dbo].[shop_items] ([id], [name], [category], [description], [price], [effect_type], [effect_value], [icon_placeholder])
    VALUES (N'turbo_stove_v1', N'Turbo Induction Stove', N'appliance', N'Cuts patty grilling time by 35% with hyper-heat coils.', 250, N'cook_speed', 1.35, N'CANVA_AI_ASSET: High-contrast 16-bit retro pixel red electric induction stove with glowing blue flame');
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'speed_clogs')
    INSERT INTO [dbo].[shop_items] ([id], [name], [category], [description], [price], [effect_type], [effect_value], [icon_placeholder])
    VALUES (N'speed_clogs', N'Chef Nitro Clogs', N'speed', N'Increases player sprint and movement speed by 25%.', 180, N'move_speed', 1.25, N'CANVA_AI_ASSET: Pixel art yellow rubber chef clogs with comic speed lines');
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'golden_spatula')
    INSERT INTO [dbo].[shop_items] ([id], [name], [category], [description], [price], [effect_type], [effect_value], [icon_placeholder])
    VALUES (N'golden_spatula', N'Master Golden Spatula', N'booster', N'Yields +50% bonus coin tips on every 5-star order served.', 500, N'tip_multiplier', 1.5, N'CANVA_AI_ASSET: Shiny 24K gold pixel spatula with sparkling star gleams');
GO

-- 3.10 Seed Site Settings
IF NOT EXISTS (SELECT 1 FROM [dbo].[site_settings] WHERE [key] = 'main_config')
    INSERT INTO [dbo].[site_settings] ([key], [value], [updated_at])
    VALUES ('main_config', N'{"announcement":{"enabled":true,"text":"🔥 ULTIMATUM ARCADE TOURNAMENT: Double XP Weekend is LIVE! Play & Claim Badges","link":"/games"},"monetization":{"ads_enabled":true,"header_ad":true,"sidebar_ad":true,"in_content_ad":true,"sticky_footer_ad":true,"rewarded_ads":true},"maintenance_mode":false}', GETUTCDATE());
GO

-- 3.11 Seed User Comments
IF NOT EXISTS (SELECT 1 FROM [dbo].[user_comments] WHERE [user_id] = N'user-002' AND [content_id] = N'rec-001' AND [body] = N'Made this tonight in a 12-inch cast iron skillet. The truffle aioli recipe with garlic confit is pure culinary gold!')
    INSERT INTO [dbo].[user_comments] ([user_id], [content_type], [content_id], [content_slug], [body], [is_flagged], [created_at])
    VALUES (N'user-002', N'recipe', N'rec-001', N'wagyu-truffle-smash-burger', N'Made this tonight in a 12-inch cast iron skillet. The truffle aioli recipe with garlic confit is pure culinary gold!', 0, N'2026-08-20T14:30:00Z');
IF NOT EXISTS (SELECT 1 FROM [dbo].[user_comments] WHERE [user_id] = N'user-004' AND [content_id] = N'rec-001' AND [body] = N'Pro tip: smash with parchment paper between the press and patty so the caramelized crust never sticks to the metal.')
    INSERT INTO [dbo].[user_comments] ([user_id], [content_type], [content_id], [content_slug], [body], [is_flagged], [created_at])
    VALUES (N'user-004', N'recipe', N'rec-001', N'wagyu-truffle-smash-burger', N'Pro tip: smash with parchment paper between the press and patty so the caramelized crust never sticks to the metal.', 0, N'2026-08-21T18:15:00Z');
IF NOT EXISTS (SELECT 1 FROM [dbo].[user_comments] WHERE [user_id] = N'user-003' AND [content_id] = N'art-001' AND [body] = N'The magnetic Fidlock pocket integration on the AcroPulse shell is insane in wet weather. Completely waterproof so far.')
    INSERT INTO [dbo].[user_comments] ([user_id], [content_type], [content_id], [content_slug], [body], [is_flagged], [created_at])
    VALUES (N'user-003', N'article', N'art-001', N'cyberpunk-techwear-modular-shells-2026', N'The magnetic Fidlock pocket integration on the AcroPulse shell is insane in wet weather. Completely waterproof so far.', 0, N'2026-08-22T09:45:00Z');
IF NOT EXISTS (SELECT 1 FROM [dbo].[user_comments] WHERE [user_id] = N'user-001' AND [content_id] = N'rev-001' AND [body] = N'The copper heat-pipe upgrade alone drops APU temps by 6°C on Cyberpunk 2077 ultra presets. Huge win for handheld gaming.')
    INSERT INTO [dbo].[user_comments] ([user_id], [content_type], [content_id], [content_slug], [body], [is_flagged], [created_at])
    VALUES (N'user-001', N'review', N'rev-001', N'steam-deck-oled-2026-teardown', N'The copper heat-pipe upgrade alone drops APU temps by 6°C on Cyberpunk 2077 ultra presets. Huge win for handheld gaming.', 0, N'2026-08-23T11:20:00Z');
IF NOT EXISTS (SELECT 1 FROM [dbo].[user_comments] WHERE [user_id] = N'user-002' AND [content_id] = N'game-001' AND [body] = N'Hit 24,500 points on wave 12! The plasma bomb combo multiplier is the key to top leaderboard placement.')
    INSERT INTO [dbo].[user_comments] ([user_id], [content_type], [content_id], [content_slug], [body], [is_flagged], [created_at])
    VALUES (N'user-002', N'game', N'game-001', N'neon-asteroid-blitz', N'Hit 24,500 points on wave 12! The plasma bomb combo multiplier is the key to top leaderboard placement.', 0, N'2026-08-24T10:00:00Z');
GO
