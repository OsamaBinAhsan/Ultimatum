-- ==============================================================================
-- ULTIMATUM PLATFORM - DATABASE SCHEMA MIGRATION 001
-- Tables: [game_items], [leaderboard_payout_logs], [content_tags], [post_tag_relations]
-- Compatible with Microsoft SQL Server 2016+ and Azure SQL Database
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table: [dbo].[game_items]
-- Inventory & shop items across Arcade & collaborator games
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'game_items' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[game_items] (
        [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
        [game_id] NVARCHAR(64) NULL,
        [name] NVARCHAR(255) NOT NULL,
        [slug] NVARCHAR(255) NOT NULL UNIQUE,
        [item_type] NVARCHAR(50) NOT NULL, -- 'skin', 'powerup', 'badge', 'consumable', 'avatar_frame', 'cosmetic'
        [price_coins] INT NOT NULL DEFAULT 0,
        [asset_url] NVARCHAR(MAX) NULL,
        [is_active] BIT NOT NULL DEFAULT 1,
        [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [FK_game_items_games] FOREIGN KEY ([game_id]) REFERENCES [dbo].[games]([id]) ON DELETE SET NULL
    );

    CREATE INDEX [IX_game_items_game_id] ON [dbo].[game_items] ([game_id]);
    CREATE INDEX [IX_game_items_item_type] ON [dbo].[game_items] ([item_type]);
    CREATE INDEX [IX_game_items_is_active] ON [dbo].[game_items] ([is_active]);
    CREATE INDEX [IX_game_items_slug] ON [dbo].[game_items] ([slug]);
    
    PRINT 'Created table [dbo].[game_items] and associated indexes.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[game_items] already exists. Skipping creation.';
END
GO

-- -----------------------------------------------------------------------------
-- 2. Table: [dbo].[leaderboard_payout_logs]
-- Audit log of weekly tournament rank placements and coin reward distributions
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'leaderboard_payout_logs' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[leaderboard_payout_logs] (
        [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [week_identifier] NVARCHAR(64) NOT NULL, -- e.g. '2026-W35'
        [game_id] NVARCHAR(64) NOT NULL,
        [user_id] NVARCHAR(64) NOT NULL,
        [rank_position] INT NOT NULL,
        [score] INT NOT NULL,
        [coins_awarded] INT NOT NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [FK_leaderboard_payout_logs_games] FOREIGN KEY ([game_id]) REFERENCES [dbo].[games]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_leaderboard_payout_logs_profiles] FOREIGN KEY ([user_id]) REFERENCES [dbo].[profiles]([id]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_leaderboard_payout_logs_week_game] ON [dbo].[leaderboard_payout_logs] ([week_identifier], [game_id]);
    CREATE INDEX [IX_leaderboard_payout_logs_user] ON [dbo].[leaderboard_payout_logs] ([user_id]);
    CREATE INDEX [IX_leaderboard_payout_logs_created] ON [dbo].[leaderboard_payout_logs] ([created_at] DESC);

    PRINT 'Created table [dbo].[leaderboard_payout_logs] and associated indexes.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[leaderboard_payout_logs] already exists. Skipping creation.';
END
GO

-- -----------------------------------------------------------------------------
-- 3. Table: [dbo].[content_tags]
-- Master cross-niche taxonomy for Gaming, Lifestyle, News, and Recipes
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'content_tags' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[content_tags] (
        [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [name] NVARCHAR(100) NOT NULL,
        [slug] NVARCHAR(150) NOT NULL UNIQUE,
        [niche] NVARCHAR(50) NOT NULL, -- 'gaming', 'lifestyle', 'news', 'recipes', 'tech', 'cross_niche'
        [description] NVARCHAR(500) NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX [IX_content_tags_niche] ON [dbo].[content_tags] ([niche]);
    CREATE INDEX [IX_content_tags_slug] ON [dbo].[content_tags] ([slug]);

    PRINT 'Created table [dbo].[content_tags] and associated indexes.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[content_tags] already exists. Skipping creation.';
END
GO

-- -----------------------------------------------------------------------------
-- 4. Table: [dbo].[post_tag_relations]
-- Relational bridge linking content (articles, recipes, reviews, games) to taxonomy tags
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'post_tag_relations' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[post_tag_relations] (
        [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [tag_id] BIGINT NOT NULL,
        [post_id] NVARCHAR(64) NOT NULL,
        [post_type] NVARCHAR(50) NOT NULL, -- 'article', 'recipe', 'review', 'game'
        [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [UK_post_tag_relations] UNIQUE ([tag_id], [post_id], [post_type]),
        CONSTRAINT [FK_post_tag_relations_tag] FOREIGN KEY ([tag_id]) REFERENCES [dbo].[content_tags]([id]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_post_tag_relations_post] ON [dbo].[post_tag_relations] ([post_id], [post_type]);
    CREATE INDEX [IX_post_tag_relations_tag] ON [dbo].[post_tag_relations] ([tag_id]);

    PRINT 'Created table [dbo].[post_tag_relations] and associated indexes.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[post_tag_relations] already exists. Skipping creation.';
END
GO

-- -----------------------------------------------------------------------------
-- 5. Idempotent Seed Data
-- -----------------------------------------------------------------------------

-- Seed Cross-Niche Content Tags
IF NOT EXISTS (SELECT 1 FROM [dbo].[content_tags] WHERE [slug] = N'arcade-classics')
    INSERT INTO [dbo].[content_tags] ([name], [slug], [niche], [description])
    VALUES (N'Arcade Classics', N'arcade-classics', N'gaming', N'Retro canvas action and high-score arcade games');

IF NOT EXISTS (SELECT 1 FROM [dbo].[content_tags] WHERE [slug] = N'esports-tournament')
    INSERT INTO [dbo].[content_tags] ([name], [slug], [niche], [description])
    VALUES (N'Esports Tournament', N'esports-tournament', N'gaming', N'Weekly competitive tournaments, prize pools, and leaderboard showdowns');

IF NOT EXISTS (SELECT 1 FROM [dbo].[content_tags] WHERE [slug] = N'michelin-techniques')
    INSERT INTO [dbo].[content_tags] ([name], [slug], [niche], [description])
    VALUES (N'Michelin Techniques', N'michelin-techniques', N'recipes', N'Culinary science, sous-vide precision, and artisanal gastronomy');

IF NOT EXISTS (SELECT 1 FROM [dbo].[content_tags] WHERE [slug] = N'skincare-science')
    INSERT INTO [dbo].[content_tags] ([name], [slug], [niche], [description])
    VALUES (N'Skincare Science', N'skincare-science', N'lifestyle', N'Dermatologist-evaluated actives, barrier repair, and clinical skincare');

IF NOT EXISTS (SELECT 1 FROM [dbo].[content_tags] WHERE [slug] = N'hardware-teardowns')
    INSERT INTO [dbo].[content_tags] ([name], [slug], [niche], [description])
    VALUES (N'Hardware Teardowns', N'hardware-teardowns', N'news', N'Deep-dive silicon architecture, benchmarks, and thermal analyses');

IF NOT EXISTS (SELECT 1 FROM [dbo].[content_tags] WHERE [slug] = N'quick-weeknight')
    INSERT INTO [dbo].[content_tags] ([name], [slug], [niche], [description])
    VALUES (N'Quick Weeknight', N'quick-weeknight', N'recipes', N'Fast 30-minute culinary masterclasses');

-- Seed Game Items
IF NOT EXISTS (SELECT 1 FROM [dbo].[game_items] WHERE [slug] = N'neon-ship-hyperdrive')
    INSERT INTO [dbo].[game_items] ([id], [game_id], [name], [slug], [item_type], [price_coins], [asset_url], [is_active])
    VALUES (N'item-001', N'neon-asteroid-blitz', N'Hyperdrive Cyan Hull', N'neon-ship-hyperdrive', N'skin', 350, N'/images/shop/neon-ship-cyan.png', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[game_items] WHERE [slug] = N'blitz-plasma-shield')
    INSERT INTO [dbo].[game_items] ([id], [game_id], [name], [slug], [item_type], [price_coins], [asset_url], [is_active])
    VALUES (N'item-002', N'neon-asteroid-blitz', N'Plasma Overcharge Shield', N'blitz-plasma-shield', N'powerup', 150, N'/images/shop/plasma-shield.png', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[game_items] WHERE [slug] = N'flame-grill-spatula-gold')
    INSERT INTO [dbo].[game_items] ([id], [game_id], [name], [slug], [item_type], [price_coins], [asset_url], [is_active])
    VALUES (N'item-003', N'pixel-kitchen-rush', N'24K Golden Spatula', N'flame-grill-spatula-gold', N'skin', 750, N'/images/shop/gold-spatula.png', 1);

PRINT 'Migration 001 completed successfully.';
GO
