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
END
GO

-- Bookmarked Items
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
    CREATE INDEX [IX_comments_content] ON [dbo].[user_comments] ([content_id], [content_slug]);
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
-- 3. SEED INITIAL DATA (IDEMPOTENT)
-- --------------------------------------------------------

-- Initial Profiles
IF NOT EXISTS (SELECT 1 FROM [dbo].[profiles] WHERE [id] = 'user-001')
    INSERT INTO [dbo].[profiles] ([id], [username], [email], [role], [points], [daily_streak], [badges])
    VALUES ('user-001', 'PixelNinja', 'admin@ultimatum.gg', 'admin', 4850, 5, '["Grand Champion", "Arcade Master", "Founding Chef", "Super Admin"]');

IF NOT EXISTS (SELECT 1 FROM [dbo].[profiles] WHERE [id] = 'user-002')
    INSERT INTO [dbo].[profiles] ([id], [username], [email], [role], [points], [daily_streak], [badges])
    VALUES ('user-002', 'CyberGourmet', 'gamer@ultimatum.gg', 'user', 3420, 3, '["Top Gun", "Recipe Critic", "High Roller"]');

IF NOT EXISTS (SELECT 1 FROM [dbo].[profiles] WHERE [id] = 'user-003')
    INSERT INTO [dbo].[profiles] ([id], [username], [email], [role], [points], [daily_streak], [badges])
    VALUES ('user-003', 'AeroStrike', 'aerostrike@ultimatum.gg', 'user', 2980, 2, '["Sharpshooter", "Speed Demon"]');

IF NOT EXISTS (SELECT 1 FROM [dbo].[profiles] WHERE [id] = 'user-004')
    INSERT INTO [dbo].[profiles] ([id], [username], [email], [role], [points], [daily_streak], [badges])
    VALUES ('user-004', 'SpiceOverlord', 'spice@ultimatum.gg', 'user', 1840, 1, '["Taste Tester", "Kitchen Samurai"]');
GO

-- Initial Games
IF NOT EXISTS (SELECT 1 FROM [dbo].[games] WHERE [id] = 'game-001')
    INSERT INTO [dbo].[games] ([id], [slug], [title], [description], [category], [thumbnail_url], [game_file_url], [is_sponsored], [sponsor_name], [play_count])
    VALUES ('game-001', 'neon-asteroid-blitz', 'Neon Asteroid Blitz', 'High-octane retro arcade shooter. Pilot your neon starship through deep space debris, unleash laser blasts, collect powerup crystals, and dominate the weekly global leaderboard.', 'arcade', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80', 'canvas://neon-asteroid-blitz', 1, 'Razer Gaming Gear', 34820);

IF NOT EXISTS (SELECT 1 FROM [dbo].[games] WHERE [id] = 'game-002')
    INSERT INTO [dbo].[games] ([id], [slug], [title], [description], [category], [thumbnail_url], [game_file_url], [is_sponsored], [sponsor_name], [play_count])
    VALUES ('game-002', 'cyber-slicer-2099', 'Cyber Slicer 2099', 'Fast-paced rhythmic reflex slicer. Cut glowing energy nodes before they breach your firewall perimeter in this futuristic synthwave challenge.', 'action', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80', 'canvas://cyber-slicer', 0, NULL, 22150);

IF NOT EXISTS (SELECT 1 FROM [dbo].[games] WHERE [id] = 'game-003')
    INSERT INTO [dbo].[games] ([id], [slug], [title], [description], [category], [thumbnail_url], [game_file_url], [is_sponsored], [sponsor_name], [play_count])
    VALUES ('game-003', 'pixel-kitchen-rush', 'Pixel Kitchen Rush', 'Frenetic 2D culinary rush! Juggle gourmet orders, chop ingredients, flip steaks, and satisfy demanding VIP food critics before the timer expires.', 'puzzle', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', 'canvas://pixel-kitchen', 1, 'Hestan Masterware', 18940);
GO

-- Initial Shop Items
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = 'turbo_stove_v1')
    INSERT INTO [dbo].[shop_items] ([id], [name], [category], [description], [price], [effect_type], [effect_value], [icon_placeholder])
    VALUES ('turbo_stove_v1', 'Turbo Induction Stove', 'appliance', 'Cuts patty grilling time by 35% with hyper-heat coils.', 250, 'cook_speed', 1.35, 'CANVA_AI_ASSET: High-contrast 16-bit retro pixel red electric induction stove with glowing blue flame');

IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = 'speed_clogs')
    INSERT INTO [dbo].[shop_items] ([id], [name], [category], [description], [price], [effect_type], [effect_value], [icon_placeholder])
    VALUES ('speed_clogs', 'Chef Nitro Clogs', 'speed', 'Increases player sprint and movement speed by 25%.', 180, 'move_speed', 1.25, 'CANVA_AI_ASSET: Pixel art yellow rubber chef clogs with comic speed lines');

IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = 'golden_spatula')
    INSERT INTO [dbo].[shop_items] ([id], [name], [category], [description], [price], [effect_type], [effect_value], [icon_placeholder])
    VALUES ('golden_spatula', 'Master Golden Spatula', 'booster', 'Yields +50% bonus coin tips on every 5-star order served.', 500, 'tip_multiplier', 1.50, 'CANVA_AI_ASSET: Shiny 24K gold pixel spatula with sparkling star gleams');
GO
