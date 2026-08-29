-- ==============================================================================
-- ULTIMATUM MASTER T-SQL MIGRATION: 4-SLOT IN-GAME LOADOUT & CUSTOMIZATION ENGINE
-- Compatible with Microsoft SQL Server 2016, 2019, 2022 and Azure SQL Database
-- ==============================================================================

-- 1. Create/Update [dbo].[shop_items]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'shop_items' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[shop_items] (
        [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
        [game_id] NVARCHAR(64) NULL,
        [slot_type] NVARCHAR(32) NOT NULL, -- 'VISUAL_SKIN' | 'ACTION_JUICE' | 'GAME_GEAR' | 'AUDIO_THEME' | 'AVATAR_FRAME' | 'PROFILE_TITLE'
        [name] NVARCHAR(100) NOT NULL,
        [slug] NVARCHAR(100) NOT NULL UNIQUE,
        [tier] NVARCHAR(20) NOT NULL, -- 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
        [price_coins] INT NOT NULL,
        [metadata_json] NVARCHAR(MAX) NOT NULL,
        [is_active] BIT NOT NULL DEFAULT 1,
        [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE INDEX [IX_shop_items_game_id] ON [dbo].[shop_items] ([game_id]);
    CREATE INDEX [IX_shop_items_slot_type] ON [dbo].[shop_items] ([slot_type]);
    CREATE INDEX [IX_shop_items_tier] ON [dbo].[shop_items] ([tier]);
    CREATE INDEX [IX_shop_items_is_active] ON [dbo].[shop_items] ([is_active]);
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[shop_items]') AND name = 'slot_type')
        ALTER TABLE [dbo].[shop_items] ADD [slot_type] NVARCHAR(32) NOT NULL DEFAULT 'GAME_GEAR';

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[shop_items]') AND name = 'tier')
        ALTER TABLE [dbo].[shop_items] ADD [tier] NVARCHAR(20) NOT NULL DEFAULT 'RARE';

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[shop_items]') AND name = 'metadata_json')
        ALTER TABLE [dbo].[shop_items] ADD [metadata_json] NVARCHAR(MAX) NOT NULL DEFAULT '{}';

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[shop_items]') AND name = 'price_coins')
        ALTER TABLE [dbo].[shop_items] ADD [price_coins] INT NOT NULL DEFAULT 250;
END
GO

-- 2. Create/Update [dbo].[player_inventory]
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'player_inventory' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[player_inventory] (
        [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [player_id] NVARCHAR(64) NOT NULL,
        [item_id] NVARCHAR(64) NOT NULL,
        [is_equipped] BIT NOT NULL DEFAULT 0,
        [purchased_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [UK_player_inventory_player_item] UNIQUE ([player_id], [item_id]),
        CONSTRAINT [FK_player_inventory_profiles] FOREIGN KEY ([player_id]) REFERENCES [dbo].[profiles]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_player_inventory_shop_items] FOREIGN KEY ([item_id]) REFERENCES [dbo].[shop_items]([id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_player_inventory_player_id] ON [dbo].[player_inventory] ([player_id]);
    CREATE INDEX [IX_player_inventory_item_id] ON [dbo].[player_inventory] ([item_id]);
    CREATE INDEX [IX_player_inventory_equipped] ON [dbo].[player_inventory] ([player_id], [is_equipped]);
END
GO

-- 3. Universal Seeding Across All 7 Games & Profiles
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'frame-neon-overcharge')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'frame-neon-overcharge', NULL, N'AVATAR_FRAME', N'Neon Overcharge Avatar Frame', N'frame-neon-overcharge', N'RARE', 350, N'{"borderClass":"ring-2 ring-cyan-400 shadow-[0_0_15px_#00f0ff]","glowHex":"#00f0ff"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Neon Overcharge Avatar Frame',
        [slot_type] = N'AVATAR_FRAME',
        [tier] = N'RARE',
        [price_coins] = 350,
        [metadata_json] = N'{"borderClass":"ring-2 ring-cyan-400 shadow-[0_0_15px_#00f0ff]","glowHex":"#00f0ff"}',
        [is_active] = 1
    WHERE [id] = N'frame-neon-overcharge';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'title-grand-champ')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'title-grand-champ', NULL, N'PROFILE_TITLE', N'Grand Champion Profile Title', N'title-grand-champ', N'EPIC', 1200, N'{"titleText":"Grand Champion","color":"#ffd700","badgeIcon":"👑"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Grand Champion Profile Title',
        [slot_type] = N'PROFILE_TITLE',
        [tier] = N'EPIC',
        [price_coins] = 1200,
        [metadata_json] = N'{"titleText":"Grand Champion","color":"#ffd700","badgeIcon":"👑"}',
        [is_active] = 1
    WHERE [id] = N'title-grand-champ';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'skin-pkr-cyber-chef')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'skin-pkr-cyber-chef', N'pixel-kitchen-rush', N'VISUAL_SKIN', N'Cybernetic Head Chef', N'skin-pkr-cyber-chef', N'EPIC', 900, N'{"gameId":"pixel-kitchen-rush","chefSprite":"cyber_blue","tossParticle":"#00f0ff"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Cybernetic Head Chef',
        [slot_type] = N'VISUAL_SKIN',
        [tier] = N'EPIC',
        [price_coins] = 900,
        [metadata_json] = N'{"gameId":"pixel-kitchen-rush","chefSprite":"cyber_blue","tossParticle":"#00f0ff"}',
        [is_active] = 1
    WHERE [id] = N'skin-pkr-cyber-chef';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'juice-pkr-nitro-trail')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'juice-pkr-nitro-trail', N'pixel-kitchen-rush', N'ACTION_JUICE', N'Nitro Dash Particles', N'juice-pkr-nitro-trail', N'RARE', 450, N'{"gameId":"pixel-kitchen-rush","dashParticleColor":"#00f0ff","trailType":"nitro"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Nitro Dash Particles',
        [slot_type] = N'ACTION_JUICE',
        [tier] = N'RARE',
        [price_coins] = 450,
        [metadata_json] = N'{"gameId":"pixel-kitchen-rush","dashParticleColor":"#00f0ff","trailType":"nitro"}',
        [is_active] = 1
    WHERE [id] = N'juice-pkr-nitro-trail';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'gear-pkr-turbo-stove')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'gear-pkr-turbo-stove', N'pixel-kitchen-rush', N'GAME_GEAR', N'Hyper-Induction Turbo Stove', N'gear-pkr-turbo-stove', N'EPIC', 1000, N'{"gameId":"pixel-kitchen-rush","stat":"cook_speed_multiplier","value":1.35}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Hyper-Induction Turbo Stove',
        [slot_type] = N'GAME_GEAR',
        [tier] = N'EPIC',
        [price_coins] = 1000,
        [metadata_json] = N'{"gameId":"pixel-kitchen-rush","stat":"cook_speed_multiplier","value":1.35}',
        [is_active] = 1
    WHERE [id] = N'gear-pkr-turbo-stove';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'gear-pkr-rapid-ext')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'gear-pkr-rapid-ext', N'pixel-kitchen-rush', N'GAME_GEAR', N'Instant Halon Extinguisher', N'gear-pkr-rapid-ext', N'RARE', 500, N'{"gameId":"pixel-kitchen-rush","stat":"extinguish_speed_multiplier","value":2}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Instant Halon Extinguisher',
        [slot_type] = N'GAME_GEAR',
        [tier] = N'RARE',
        [price_coins] = 500,
        [metadata_json] = N'{"gameId":"pixel-kitchen-rush","stat":"extinguish_speed_multiplier","value":2}',
        [is_active] = 1
    WHERE [id] = N'gear-pkr-rapid-ext';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'audio-pkr-8bit')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'audio-pkr-8bit', N'pixel-kitchen-rush', N'AUDIO_THEME', N'8-Bit Chiptune Kitchen', N'audio-pkr-8bit', N'COMMON', 150, N'{"gameId":"pixel-kitchen-rush","synthPreset":"8bit_chiptune"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'8-Bit Chiptune Kitchen',
        [slot_type] = N'AUDIO_THEME',
        [tier] = N'COMMON',
        [price_coins] = 150,
        [metadata_json] = N'{"gameId":"pixel-kitchen-rush","synthPreset":"8bit_chiptune"}',
        [is_active] = 1
    WHERE [id] = N'audio-pkr-8bit';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'skin-hc-synthwave')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'skin-hc-synthwave', N'hyper-chess', N'VISUAL_SKIN', N'Outrun Synthwave Grid', N'skin-hc-synthwave', N'EPIC', 1000, N'{"gameId":"hyper-chess","boardDark":"#150a26","boardLight":"#2c124a","coreColor":"#ff0077"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Outrun Synthwave Grid',
        [slot_type] = N'VISUAL_SKIN',
        [tier] = N'EPIC',
        [price_coins] = 1000,
        [metadata_json] = N'{"gameId":"hyper-chess","boardDark":"#150a26","boardLight":"#2c124a","coreColor":"#ff0077"}',
        [is_active] = 1
    WHERE [id] = N'skin-hc-synthwave';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'skin-hc-crimson-knight')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'skin-hc-crimson-knight', N'hyper-chess', N'VISUAL_SKIN', N'Crimson Plasma Knight', N'skin-hc-crimson-knight', N'RARE', 450, N'{"gameId":"hyper-chess","piece":"KNIGHT","spriteColor":"#ff0055","trailColor":"rgba(255,0,85,0.4)"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Crimson Plasma Knight',
        [slot_type] = N'VISUAL_SKIN',
        [tier] = N'RARE',
        [price_coins] = 450,
        [metadata_json] = N'{"gameId":"hyper-chess","piece":"KNIGHT","spriteColor":"#ff0055","trailColor":"rgba(255,0,85,0.4)"}',
        [is_active] = 1
    WHERE [id] = N'skin-hc-crimson-knight';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'juice-hc-supernova')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'juice-hc-supernova', N'hyper-chess', N'ACTION_JUICE', N'Supernova Checkmate FX', N'juice-hc-supernova', N'EPIC', 850, N'{"gameId":"hyper-chess","checkmateVFX":"SUPERNOVA","particleCount":80,"shakeIntensity":18}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Supernova Checkmate FX',
        [slot_type] = N'ACTION_JUICE',
        [tier] = N'EPIC',
        [price_coins] = 850,
        [metadata_json] = N'{"gameId":"hyper-chess","checkmateVFX":"SUPERNOVA","particleCount":80,"shakeIntensity":18}',
        [is_active] = 1
    WHERE [id] = N'juice-hc-supernova';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'gear-hc-core-capacitor')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'gear-hc-core-capacitor', N'hyper-chess', N'GAME_GEAR', N'Core Mana Capacitor', N'gear-hc-core-capacitor', N'EPIC', 1100, N'{"gameId":"hyper-chess","stat":"core_mana_bonus","value":2}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Core Mana Capacitor',
        [slot_type] = N'GAME_GEAR',
        [tier] = N'EPIC',
        [price_coins] = 1100,
        [metadata_json] = N'{"gameId":"hyper-chess","stat":"core_mana_bonus","value":2}',
        [is_active] = 1
    WHERE [id] = N'gear-hc-core-capacitor';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'audio-hc-subbass')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'audio-hc-subbass', N'hyper-chess', N'AUDIO_THEME', N'Heavy Sub-Bass Impact', N'audio-hc-subbass', N'COMMON', 200, N'{"gameId":"hyper-chess","synthPreset":"heavy_subbass"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Heavy Sub-Bass Impact',
        [slot_type] = N'AUDIO_THEME',
        [tier] = N'COMMON',
        [price_coins] = 200,
        [metadata_json] = N'{"gameId":"hyper-chess","synthPreset":"heavy_subbass"}',
        [is_active] = 1
    WHERE [id] = N'audio-hc-subbass';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'skin-ar-shadow-rat')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'skin-ar-shadow-rat', N'the-architect-and-the-rats', N'VISUAL_SKIN', N'Shadow Stalker Swarm', N'skin-ar-shadow-rat', N'COMMON', 200, N'{"gameId":"the-architect-and-the-rats","ratColor":"#2a2a38"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Shadow Stalker Swarm',
        [slot_type] = N'VISUAL_SKIN',
        [tier] = N'COMMON',
        [price_coins] = 200,
        [metadata_json] = N'{"gameId":"the-architect-and-the-rats","ratColor":"#2a2a38"}',
        [is_active] = 1
    WHERE [id] = N'skin-ar-shadow-rat';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'juice-ar-infrared-cone')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'juice-ar-infrared-cone', N'the-architect-and-the-rats', N'ACTION_JUICE', N'Infrared Sonar Cone', N'juice-ar-infrared-cone', N'RARE', 500, N'{"gameId":"the-architect-and-the-rats","fogLightColor":"#ff0055","fogRadiusBoost":20}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Infrared Sonar Cone',
        [slot_type] = N'ACTION_JUICE',
        [tier] = N'RARE',
        [price_coins] = 500,
        [metadata_json] = N'{"gameId":"the-architect-and-the-rats","fogLightColor":"#ff0055","fogRadiusBoost":20}',
        [is_active] = 1
    WHERE [id] = N'juice-ar-infrared-cone';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'gear-ar-dash-boots')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'gear-ar-dash-boots', N'the-architect-and-the-rats', N'GAME_GEAR', N'Kinetic Dash Striders', N'gear-ar-dash-boots', N'RARE', 600, N'{"gameId":"the-architect-and-the-rats","stat":"dash_cooldown_reduction","value":1}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Kinetic Dash Striders',
        [slot_type] = N'GAME_GEAR',
        [tier] = N'RARE',
        [price_coins] = 600,
        [metadata_json] = N'{"gameId":"the-architect-and-the-rats","stat":"dash_cooldown_reduction","value":1}',
        [is_active] = 1
    WHERE [id] = N'gear-ar-dash-boots';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'audio-ar-tension')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'audio-ar-tension', N'the-architect-and-the-rats', N'AUDIO_THEME', N'Dark Ambience & Tension Drone', N'audio-ar-tension', N'COMMON', 150, N'{"gameId":"the-architect-and-the-rats","synthPreset":"tension_drone"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Dark Ambience & Tension Drone',
        [slot_type] = N'AUDIO_THEME',
        [tier] = N'COMMON',
        [price_coins] = 150,
        [metadata_json] = N'{"gameId":"the-architect-and-the-rats","synthPreset":"tension_drone"}',
        [is_active] = 1
    WHERE [id] = N'audio-ar-tension';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'skin-sc-cyberpunk-panel')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'skin-sc-cyberpunk-panel', N'sabotage-circuit', N'VISUAL_SKIN', N'Cyberpunk Neon Console', N'skin-sc-cyberpunk-panel', N'RARE', 450, N'{"gameId":"sabotage-circuit","panelTheme":"cyberpunk_dark","accentColor":"#00ff66"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Cyberpunk Neon Console',
        [slot_type] = N'VISUAL_SKIN',
        [tier] = N'RARE',
        [price_coins] = 450,
        [metadata_json] = N'{"gameId":"sabotage-circuit","panelTheme":"cyberpunk_dark","accentColor":"#00ff66"}',
        [is_active] = 1
    WHERE [id] = N'skin-sc-cyberpunk-panel';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'juice-sc-reactor-strobe')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'juice-sc-reactor-strobe', N'sabotage-circuit', N'ACTION_JUICE', N'Reactor Core CRT Strobe', N'juice-sc-reactor-strobe', N'RARE', 400, N'{"gameId":"sabotage-circuit","strobeAlert":true,"crtDistortion":0.3}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Reactor Core CRT Strobe',
        [slot_type] = N'ACTION_JUICE',
        [tier] = N'RARE',
        [price_coins] = 400,
        [metadata_json] = N'{"gameId":"sabotage-circuit","strobeAlert":true,"crtDistortion":0.3}',
        [is_active] = 1
    WHERE [id] = N'juice-sc-reactor-strobe';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'gear-sc-breaker-bypass')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'gear-sc-breaker-bypass', N'sabotage-circuit', N'GAME_GEAR', N'Quantum Breaker Bypass', N'gear-sc-breaker-bypass', N'EPIC', 950, N'{"gameId":"sabotage-circuit","stat":"free_breaker_resets","value":1}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Quantum Breaker Bypass',
        [slot_type] = N'GAME_GEAR',
        [tier] = N'EPIC',
        [price_coins] = 950,
        [metadata_json] = N'{"gameId":"sabotage-circuit","stat":"free_breaker_resets","value":1}',
        [is_active] = 1
    WHERE [id] = N'gear-sc-breaker-bypass';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'audio-sc-relay-clicks')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'audio-sc-relay-clicks', N'sabotage-circuit', N'AUDIO_THEME', N'Industrial Relay Audio', N'audio-sc-relay-clicks', N'COMMON', 150, N'{"gameId":"sabotage-circuit","synthPreset":"mechanical_relays"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Industrial Relay Audio',
        [slot_type] = N'AUDIO_THEME',
        [tier] = N'COMMON',
        [price_coins] = 150,
        [metadata_json] = N'{"gameId":"sabotage-circuit","synthPreset":"mechanical_relays"}',
        [is_active] = 1
    WHERE [id] = N'audio-sc-relay-clicks';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'skin-nab-gold-interceptor')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'skin-nab-gold-interceptor', N'neon-asteroid-blitz', N'VISUAL_SKIN', N'Golden Interceptor Hull', N'skin-nab-gold-interceptor', N'RARE', 450, N'{"gameId":"neon-asteroid-blitz","shipColor":"#ffd700","laserColor":"#ffaa00"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Golden Interceptor Hull',
        [slot_type] = N'VISUAL_SKIN',
        [tier] = N'RARE',
        [price_coins] = 450,
        [metadata_json] = N'{"gameId":"neon-asteroid-blitz","shipColor":"#ffd700","laserColor":"#ffaa00"}',
        [is_active] = 1
    WHERE [id] = N'skin-nab-gold-interceptor';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'juice-nab-supernova-shatter')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'juice-nab-supernova-shatter', N'neon-asteroid-blitz', N'ACTION_JUICE', N'Supernova Asteroid Shatter', N'juice-nab-supernova-shatter', N'RARE', 500, N'{"gameId":"neon-asteroid-blitz","shatterParticleCount":40,"glowHex":"#ff00ea"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Supernova Asteroid Shatter',
        [slot_type] = N'ACTION_JUICE',
        [tier] = N'RARE',
        [price_coins] = 500,
        [metadata_json] = N'{"gameId":"neon-asteroid-blitz","shatterParticleCount":40,"glowHex":"#ff00ea"}',
        [is_active] = 1
    WHERE [id] = N'juice-nab-supernova-shatter';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'gear-nab-ion-magnet')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'gear-nab-ion-magnet', N'neon-asteroid-blitz', N'GAME_GEAR', N'Ionized Mineral Magnet', N'gear-nab-ion-magnet', N'COMMON', 250, N'{"gameId":"neon-asteroid-blitz","stat":"magnetRadius","value":1.25}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Ionized Mineral Magnet',
        [slot_type] = N'GAME_GEAR',
        [tier] = N'COMMON',
        [price_coins] = 250,
        [metadata_json] = N'{"gameId":"neon-asteroid-blitz","stat":"magnetRadius","value":1.25}',
        [is_active] = 1
    WHERE [id] = N'gear-nab-ion-magnet';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'gear-nab-kinetic-refractor')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'gear-nab-kinetic-refractor', N'neon-asteroid-blitz', N'GAME_GEAR', N'Kinetic Shield Refractor', N'gear-nab-kinetic-refractor', N'EPIC', 1250, N'{"gameId":"neon-asteroid-blitz","stat":"shield_revives","value":1}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Kinetic Shield Refractor',
        [slot_type] = N'GAME_GEAR',
        [tier] = N'EPIC',
        [price_coins] = 1250,
        [metadata_json] = N'{"gameId":"neon-asteroid-blitz","stat":"shield_revives","value":1}',
        [is_active] = 1
    WHERE [id] = N'gear-nab-kinetic-refractor';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'skin-cs-plasma-claws')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'skin-cs-plasma-claws', N'cyber-slicer-2099', N'VISUAL_SKIN', N'Dual Cyan Plasma Claws', N'skin-cs-plasma-claws', N'RARE', 500, N'{"gameId":"cyber-slicer-2099","bladeStyle":"plasma_claws","bladeColor":"#00f0ff"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Dual Cyan Plasma Claws',
        [slot_type] = N'VISUAL_SKIN',
        [tier] = N'RARE',
        [price_coins] = 500,
        [metadata_json] = N'{"gameId":"cyber-slicer-2099","bladeStyle":"plasma_claws","bladeColor":"#00f0ff"}',
        [is_active] = 1
    WHERE [id] = N'skin-cs-plasma-claws';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'juice-cs-glitch-dissolve')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'juice-cs-glitch-dissolve', N'cyber-slicer-2099', N'ACTION_JUICE', N'Binary Glitch Dissolve', N'juice-cs-glitch-dissolve', N'RARE', 450, N'{"gameId":"cyber-slicer-2099","sliceVFX":"glitch_binary"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Binary Glitch Dissolve',
        [slot_type] = N'ACTION_JUICE',
        [tier] = N'RARE',
        [price_coins] = 450,
        [metadata_json] = N'{"gameId":"cyber-slicer-2099","sliceVFX":"glitch_binary"}',
        [is_active] = 1
    WHERE [id] = N'juice-cs-glitch-dissolve';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'gear-cs-hitbox-matrix')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'gear-cs-hitbox-matrix', N'cyber-slicer-2099', N'GAME_GEAR', N'Holographic Hitbox Extender', N'gear-cs-hitbox-matrix', N'RARE', 650, N'{"gameId":"cyber-slicer-2099","stat":"hitboxMultiplier","value":1.15}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Holographic Hitbox Extender',
        [slot_type] = N'GAME_GEAR',
        [tier] = N'RARE',
        [price_coins] = 650,
        [metadata_json] = N'{"gameId":"cyber-slicer-2099","stat":"hitboxMultiplier","value":1.15}',
        [is_active] = 1
    WHERE [id] = N'gear-cs-hitbox-matrix';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'audio-cs-darksynth')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'audio-cs-darksynth', N'cyber-slicer-2099', N'AUDIO_THEME', N'Darksynth Distortion Beat', N'audio-cs-darksynth', N'RARE', 450, N'{"gameId":"cyber-slicer-2099","synthPreset":"darksynth_distort"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Darksynth Distortion Beat',
        [slot_type] = N'AUDIO_THEME',
        [tier] = N'RARE',
        [price_coins] = 450,
        [metadata_json] = N'{"gameId":"cyber-slicer-2099","synthPreset":"darksynth_distort"}',
        [is_active] = 1
    WHERE [id] = N'audio-cs-darksynth';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'skin-dld-paladin')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'skin-dld-paladin', N'dungeon-loot-dash', N'VISUAL_SKIN', N'Golden Paladin Armor', N'skin-dld-paladin', N'RARE', 450, N'{"gameId":"dungeon-loot-dash","characterSprite":"paladin_gold"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Golden Paladin Armor',
        [slot_type] = N'VISUAL_SKIN',
        [tier] = N'RARE',
        [price_coins] = 450,
        [metadata_json] = N'{"gameId":"dungeon-loot-dash","characterSprite":"paladin_gold"}',
        [is_active] = 1
    WHERE [id] = N'skin-dld-paladin';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'juice-dld-vacuum-sparkle')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'juice-dld-vacuum-sparkle', N'dungeon-loot-dash', N'ACTION_JUICE', N'Golden Vacuum Sparkles', N'juice-dld-vacuum-sparkle', N'RARE', 500, N'{"gameId":"dungeon-loot-dash","coinCollectVFX":"golden_burst"}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Golden Vacuum Sparkles',
        [slot_type] = N'ACTION_JUICE',
        [tier] = N'RARE',
        [price_coins] = 500,
        [metadata_json] = N'{"gameId":"dungeon-loot-dash","coinCollectVFX":"golden_burst"}',
        [is_active] = 1
    WHERE [id] = N'juice-dld-vacuum-sparkle';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'gear-dld-feather-boots')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'gear-dld-feather-boots', N'dungeon-loot-dash', N'GAME_GEAR', N'Featherfall Apex Boots', N'gear-dld-feather-boots', N'COMMON', 250, N'{"gameId":"dungeon-loot-dash","stat":"jumpApexBoost","value":1.1}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Featherfall Apex Boots',
        [slot_type] = N'GAME_GEAR',
        [tier] = N'COMMON',
        [price_coins] = 250,
        [metadata_json] = N'{"gameId":"dungeon-loot-dash","stat":"jumpApexBoost","value":1.1}',
        [is_active] = 1
    WHERE [id] = N'gear-dld-feather-boots';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'gear-dld-greedy-pouch')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [game_id], [slot_type], [name], [slug], [tier], [price_coins], [metadata_json], [is_active], [created_at])
    VALUES (N'gear-dld-greedy-pouch', N'dungeon-loot-dash', N'GAME_GEAR', N'Greedy Goblin Coin Pouch', N'gear-dld-greedy-pouch', N'RARE', 600, N'{"gameId":"dungeon-loot-dash","stat":"coinDropMultiplier","value":1.25}', 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Greedy Goblin Coin Pouch',
        [slot_type] = N'GAME_GEAR',
        [tier] = N'RARE',
        [price_coins] = 600,
        [metadata_json] = N'{"gameId":"dungeon-loot-dash","stat":"coinDropMultiplier","value":1.25}',
        [is_active] = 1
    WHERE [id] = N'gear-dld-greedy-pouch';
END
GO
