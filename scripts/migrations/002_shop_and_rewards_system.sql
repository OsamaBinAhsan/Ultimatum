-- ==============================================================================
-- ULTIMATUM MASTER T-SQL MIGRATION: COMPLETE SHOP & REWARDS SYSTEM
-- Compatible with Microsoft SQL Server 2016, 2019, 2022 and Azure SQL Database
-- ==============================================================================

-- 1. Master Shop Catalog (Cosmetics, In-Game Gear & Sponsored Perks)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[shop_items]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[shop_items] (
        [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
        [name] NVARCHAR(150) NOT NULL,
        [slug] NVARCHAR(150) NOT NULL UNIQUE,
        [description] NVARCHAR(MAX) NOT NULL,
        [category] NVARCHAR(50) NOT NULL, -- 'GAME_LOADOUT' | 'PROFILE_COSMETIC' | 'SPONSORED_PERK' | 'AFFILIATE_VOUCHER' | 'DIGITAL_DOWNLOAD'
        [target_game_id] NVARCHAR(64) NULL, -- 'pixel-kitchen-rush', 'hyper-chess', etc. (NULL for universal/sponsored)
        [slot_type] NVARCHAR(32) NULL, -- 'VISUAL_SKIN' | 'ACTION_JUICE' | 'GAME_GEAR' | 'AUDIO_THEME' | 'AVATAR_FRAME' | 'PROFILE_TITLE'
        [tier] NVARCHAR(20) NOT NULL DEFAULT 'COMMON', -- 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
        [price_coins] INT NOT NULL DEFAULT 100,
        [metadata_json] NVARCHAR(MAX) NOT NULL, -- Stores dynamic configs (stat buffs, CSS classes, promo codes, URLs)
        [stock_remaining] INT NOT NULL DEFAULT -1, -- -1 = unlimited digital distribution
        [is_active] BIT NOT NULL DEFAULT 1,
        [is_public] BIT NOT NULL DEFAULT 1, -- Published live
        [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE INDEX [IX_shop_items_category] ON [dbo].[shop_items] ([category]);
    CREATE INDEX [IX_shop_items_game] ON [dbo].[shop_items] ([target_game_id]);
    CREATE INDEX [IX_shop_items_slot] ON [dbo].[shop_items] ([slot_type]);
    CREATE INDEX [IX_shop_items_tier] ON [dbo].[shop_items] ([tier]);
    CREATE INDEX [IX_shop_items_public] ON [dbo].[shop_items] ([is_public], [is_active]);
END;
ELSE
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[shop_items]') AND name = 'category')
        ALTER TABLE [dbo].[shop_items] ADD [category] NVARCHAR(50) NOT NULL DEFAULT 'GAME_LOADOUT';
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[shop_items]') AND name = 'target_game_id')
        ALTER TABLE [dbo].[shop_items] ADD [target_game_id] NVARCHAR(64) NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[shop_items]') AND name = 'stock_remaining')
        ALTER TABLE [dbo].[shop_items] ADD [stock_remaining] INT NOT NULL DEFAULT -1;
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[shop_items]') AND name = 'is_public')
        ALTER TABLE [dbo].[shop_items] ADD [is_public] BIT NOT NULL DEFAULT 1;
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[shop_items]') AND name = 'description')
        ALTER TABLE [dbo].[shop_items] ADD [description] NVARCHAR(MAX) NOT NULL DEFAULT 'Premium Ultimatum reward item.';
END
GO

-- 2. Single-Use Unique Coupon / Serial Pool
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[reward_serials_pool]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[reward_serials_pool] (
        [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [item_id] NVARCHAR(64) NOT NULL,
        [serial_code] NVARCHAR(100) NOT NULL,
        [is_redeemed] BIT NOT NULL DEFAULT 0,
        [redeemed_by_user_id] NVARCHAR(64) NULL,
        [redeemed_at] DATETIME2 NULL,
        CONSTRAINT [FK_serials_items] FOREIGN KEY ([item_id]) REFERENCES [dbo].[shop_items]([id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_serials_item_available] ON [dbo].[reward_serials_pool] ([item_id], [is_redeemed]);
END;
GO

-- 3. Player Inventory & Redemptions Vault
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[player_inventory]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[player_inventory] (
        [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [player_id] NVARCHAR(64) NOT NULL,
        [item_id] NVARCHAR(64) NOT NULL,
        [is_equipped] BIT NOT NULL DEFAULT 0,
        [purchased_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [FK_inv_profiles] FOREIGN KEY ([player_id]) REFERENCES [dbo].[profiles]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_inv_items] FOREIGN KEY ([item_id]) REFERENCES [dbo].[shop_items]([id]) ON DELETE CASCADE,
        CONSTRAINT [UQ_player_item] UNIQUE ([player_id], [item_id])
    );
    CREATE INDEX [IX_inv_player] ON [dbo].[player_inventory] ([player_id]);
    CREATE INDEX [IX_inv_equipped] ON [dbo].[player_inventory] ([player_id], [is_equipped]);
END;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[player_redemptions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[player_redemptions] (
        [id] NVARCHAR(64) NOT NULL PRIMARY KEY,
        [player_id] NVARCHAR(64) NOT NULL,
        [item_id] NVARCHAR(64) NOT NULL,
        [coins_spent] INT NOT NULL,
        [delivered_content] NVARCHAR(MAX) NOT NULL,
        [redeemed_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [FK_rdm_profiles] FOREIGN KEY ([player_id]) REFERENCES [dbo].[profiles]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_rdm_items] FOREIGN KEY ([item_id]) REFERENCES [dbo].[shop_items]([id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_rdm_player] ON [dbo].[player_redemptions] ([player_id]);
END;
GO

-- 4. Seed Catalog Items
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'frame-neon-overcharge')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'frame-neon-overcharge', N'Neon Overcharge Avatar Frame', N'frame-neon-overcharge', N'Electrified cyan holographic particle ring surrounding your player profile in leaderboards and comment sections.', N'PROFILE_COSMETIC', NULL, N'AVATAR_FRAME', N'RARE', 350, N'{"borderClass":"ring-2 ring-cyan-400 shadow-[0_0_15px_#00f0ff]","glowHex":"#00f0ff"}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Neon Overcharge Avatar Frame',
        [description] = N'Electrified cyan holographic particle ring surrounding your player profile in leaderboards and comment sections.',
        [category] = N'PROFILE_COSMETIC',
        [target_game_id] = NULL,
        [slot_type] = N'AVATAR_FRAME',
        [tier] = N'RARE',
        [price_coins] = 350,
        [metadata_json] = N'{"borderClass":"ring-2 ring-cyan-400 shadow-[0_0_15px_#00f0ff]","glowHex":"#00f0ff"}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'frame-neon-overcharge';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'title-grand-champ')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'title-grand-champ', N'Grand Champion Profile Title', N'title-grand-champ', N'Golden animated crown insignia and exclusive VIP prestige moniker displayed across tournaments and community forums.', N'PROFILE_COSMETIC', NULL, N'PROFILE_TITLE', N'EPIC', 1200, N'{"titleText":"Grand Champion","color":"#ffd700","badgeIcon":"👑"}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Grand Champion Profile Title',
        [description] = N'Golden animated crown insignia and exclusive VIP prestige moniker displayed across tournaments and community forums.',
        [category] = N'PROFILE_COSMETIC',
        [target_game_id] = NULL,
        [slot_type] = N'PROFILE_TITLE',
        [tier] = N'EPIC',
        [price_coins] = 1200,
        [metadata_json] = N'{"titleText":"Grand Champion","color":"#ffd700","badgeIcon":"👑"}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'title-grand-champ';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'perk-razer-headset-discount')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'perk-razer-headset-discount', N'Razer BlackShark V2 Pro — 25% Off VIP Code', N'perk-razer-headset-discount', N'Exclusive 25% discount promo code for the Razer BlackShark V2 Pro Wireless Esports Headset with Razer Synapse 4 spatial calibration.', N'SPONSORED_PERK', NULL, NULL, N'EPIC', 1500, N'{"sponsorName":"Razer Pro Gaming","discountPercentage":25,"redeemUrl":"https://www.razer.com","instructions":"Apply code at official Razer checkout.","expiryDate":"2026-12-31"}', 15, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Razer BlackShark V2 Pro — 25% Off VIP Code',
        [description] = N'Exclusive 25% discount promo code for the Razer BlackShark V2 Pro Wireless Esports Headset with Razer Synapse 4 spatial calibration.',
        [category] = N'SPONSORED_PERK',
        [target_game_id] = NULL,
        [slot_type] = NULL,
        [tier] = N'EPIC',
        [price_coins] = 1500,
        [metadata_json] = N'{"sponsorName":"Razer Pro Gaming","discountPercentage":25,"redeemUrl":"https://www.razer.com","instructions":"Apply code at official Razer checkout.","expiryDate":"2026-12-31"}',
        [stock_remaining] = 15,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'perk-razer-headset-discount';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'perk-hestan-cookware-voucher')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'perk-hestan-cookware-voucher', N'Hestan NanoBond Master Cookware $50 Voucher', N'perk-hestan-cookware-voucher', N'$50 instant gift code applicable on Titanium NanoBond skillet sets and professional culinary tools tested in our test kitchen.', N'SPONSORED_PERK', NULL, NULL, N'LEGENDARY', 2000, N'{"sponsorName":"Hestan Culinary","voucherValue":"$50 USD","redeemUrl":"https://hestan.com","instructions":"Enter single-use code during checkout at Hestan.com.","expiryDate":"2026-11-30"}', 10, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Hestan NanoBond Master Cookware $50 Voucher',
        [description] = N'$50 instant gift code applicable on Titanium NanoBond skillet sets and professional culinary tools tested in our test kitchen.',
        [category] = N'SPONSORED_PERK',
        [target_game_id] = NULL,
        [slot_type] = NULL,
        [tier] = N'LEGENDARY',
        [price_coins] = 2000,
        [metadata_json] = N'{"sponsorName":"Hestan Culinary","voucherValue":"$50 USD","redeemUrl":"https://hestan.com","instructions":"Enter single-use code during checkout at Hestan.com.","expiryDate":"2026-11-30"}',
        [stock_remaining] = 10,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'perk-hestan-cookware-voucher';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'perk-anker-prime-gan')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'perk-anker-prime-gan', N'Anker Prime 100W GaN Fast Charger 30% Off Code', N'perk-anker-prime-gan', N'30% discount code on ultra-compact Multi-Port GaN chargers for fast charging handhelds, laptops, and mobile gaming setups.', N'SPONSORED_PERK', NULL, NULL, N'RARE', 800, N'{"sponsorName":"Anker Prime","discountPercentage":30,"redeemUrl":"https://www.anker.com","instructions":"Redeemable on Anker.com Prime series hardware.","expiryDate":"2026-10-31"}', 25, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Anker Prime 100W GaN Fast Charger 30% Off Code',
        [description] = N'30% discount code on ultra-compact Multi-Port GaN chargers for fast charging handhelds, laptops, and mobile gaming setups.',
        [category] = N'SPONSORED_PERK',
        [target_game_id] = NULL,
        [slot_type] = NULL,
        [tier] = N'RARE',
        [price_coins] = 800,
        [metadata_json] = N'{"sponsorName":"Anker Prime","discountPercentage":30,"redeemUrl":"https://www.anker.com","instructions":"Redeemable on Anker.com Prime series hardware.","expiryDate":"2026-10-31"}',
        [stock_remaining] = 25,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'perk-anker-prime-gan';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'perk-nordvpn-2yr')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'perk-nordvpn-2yr', N'NordVPN 2-Year Ultimate Security Pass (70% Off)', N'perk-nordvpn-2yr', N'Claim a 70% discount link plus 3 extra months of NordVPN Threat Protection Pro and dedicated gaming IP addresses.', N'SPONSORED_PERK', NULL, NULL, N'COMMON', 600, N'{"sponsorName":"Nord Security","discountPercentage":70,"redeemUrl":"https://nordvpn.com/ultimatum","instructions":"Click the redemption link to auto-activate the discount voucher on your account.","expiryDate":"2026-12-31"}', 50, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'NordVPN 2-Year Ultimate Security Pass (70% Off)',
        [description] = N'Claim a 70% discount link plus 3 extra months of NordVPN Threat Protection Pro and dedicated gaming IP addresses.',
        [category] = N'SPONSORED_PERK',
        [target_game_id] = NULL,
        [slot_type] = NULL,
        [tier] = N'COMMON',
        [price_coins] = 600,
        [metadata_json] = N'{"sponsorName":"Nord Security","discountPercentage":70,"redeemUrl":"https://nordvpn.com/ultimatum","instructions":"Click the redemption link to auto-activate the discount voucher on your account.","expiryDate":"2026-12-31"}',
        [stock_remaining] = 50,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'perk-nordvpn-2yr';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'voucher-steam-gift')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'voucher-steam-gift', N'$10 Steam Digital Wallet Code', N'voucher-steam-gift', N'Instant $10 USD digital gift code redeemable on the Steam Store for games, expansions, and community items.', N'AFFILIATE_VOUCHER', NULL, NULL, N'LEGENDARY', 2500, N'{"provider":"Valve Steam","value":"$10 USD","instructions":"Open Steam client -> Games -> Redeem a Steam Wallet Code."}', 8, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'$10 Steam Digital Wallet Code',
        [description] = N'Instant $10 USD digital gift code redeemable on the Steam Store for games, expansions, and community items.',
        [category] = N'AFFILIATE_VOUCHER',
        [target_game_id] = NULL,
        [slot_type] = NULL,
        [tier] = N'LEGENDARY',
        [price_coins] = 2500,
        [metadata_json] = N'{"provider":"Valve Steam","value":"$10 USD","instructions":"Open Steam client -> Games -> Redeem a Steam Wallet Code."}',
        [stock_remaining] = 8,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'voucher-steam-gift';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'voucher-doordash')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'voucher-doordash', N'$15 Gourmet Food Night Voucher', N'voucher-doordash', N'$15 credits for late-night delivery meals, artisanal burger cravings, or fresh ingredients on DoorDash / UberEats.', N'AFFILIATE_VOUCHER', NULL, NULL, N'EPIC', 1800, N'{"provider":"DoorDash Food","value":"$15 USD","instructions":"Enter code in Payment -> Gift Card on DoorDash App."}', 12, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'$15 Gourmet Food Night Voucher',
        [description] = N'$15 credits for late-night delivery meals, artisanal burger cravings, or fresh ingredients on DoorDash / UberEats.',
        [category] = N'AFFILIATE_VOUCHER',
        [target_game_id] = NULL,
        [slot_type] = NULL,
        [tier] = N'EPIC',
        [price_coins] = 1800,
        [metadata_json] = N'{"provider":"DoorDash Food","value":"$15 USD","instructions":"Enter code in Payment -> Gift Card on DoorDash App."}',
        [stock_remaining] = 12,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'voucher-doordash';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'dl-michelin-secret-recipes')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'dl-michelin-secret-recipes', N'Ultimatum Michelin Test Kitchen Master E-Book Vol. 1', N'dl-michelin-secret-recipes', N'Full 140-page high-definition digital compendium featuring all 15 signature recipes, thermal breakdown charts, and pan-sauce secrets.', N'DIGITAL_DOWNLOAD', NULL, NULL, N'RARE', 400, N'{"downloadUrl":"/downloads/ultimatum_michelin_cookbook_v1.pdf","fileSize":"48.5 MB","fileFormat":"PDF (Interactive Hyperlinks)","decryptionPass":"ULTIMATUM-CHEF-2026"}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Ultimatum Michelin Test Kitchen Master E-Book Vol. 1',
        [description] = N'Full 140-page high-definition digital compendium featuring all 15 signature recipes, thermal breakdown charts, and pan-sauce secrets.',
        [category] = N'DIGITAL_DOWNLOAD',
        [target_game_id] = NULL,
        [slot_type] = NULL,
        [tier] = N'RARE',
        [price_coins] = 400,
        [metadata_json] = N'{"downloadUrl":"/downloads/ultimatum_michelin_cookbook_v1.pdf","fileSize":"48.5 MB","fileFormat":"PDF (Interactive Hyperlinks)","decryptionPass":"ULTIMATUM-CHEF-2026"}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'dl-michelin-secret-recipes';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'dl-arcade-speedrun-guide')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'dl-arcade-speedrun-guide', N'Hyper-Chess & Arcade Metagame Tactical Strategy Bible', N'dl-arcade-speedrun-guide', N'Grandmaster tactics, center mana optimization routes, and EMP shockwave timing spreadsheets compiled by top tournament contenders.', N'DIGITAL_DOWNLOAD', NULL, NULL, N'COMMON', 250, N'{"downloadUrl":"/downloads/arcade_grandmaster_bible_2026.pdf","fileSize":"24.2 MB","fileFormat":"PDF","decryptionPass":"CHECKMATE-MANA-2026"}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Hyper-Chess & Arcade Metagame Tactical Strategy Bible',
        [description] = N'Grandmaster tactics, center mana optimization routes, and EMP shockwave timing spreadsheets compiled by top tournament contenders.',
        [category] = N'DIGITAL_DOWNLOAD',
        [target_game_id] = NULL,
        [slot_type] = NULL,
        [tier] = N'COMMON',
        [price_coins] = 250,
        [metadata_json] = N'{"downloadUrl":"/downloads/arcade_grandmaster_bible_2026.pdf","fileSize":"24.2 MB","fileFormat":"PDF","decryptionPass":"CHECKMATE-MANA-2026"}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'dl-arcade-speedrun-guide';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'skin-pkr-cyber-chef')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'skin-pkr-cyber-chef', N'Cybernetic Head Chef', N'skin-pkr-cyber-chef', N'High-tech cyber suit chef hull with glowing cyan neon apron and instant toss spark effects.', N'GAME_LOADOUT', N'pixel-kitchen-rush', N'VISUAL_SKIN', N'EPIC', 900, N'{"gameId":"pixel-kitchen-rush","chefSprite":"cyber_blue","tossParticle":"#00f0ff"}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Cybernetic Head Chef',
        [description] = N'High-tech cyber suit chef hull with glowing cyan neon apron and instant toss spark effects.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'pixel-kitchen-rush',
        [slot_type] = N'VISUAL_SKIN',
        [tier] = N'EPIC',
        [price_coins] = 900,
        [metadata_json] = N'{"gameId":"pixel-kitchen-rush","chefSprite":"cyber_blue","tossParticle":"#00f0ff"}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'skin-pkr-cyber-chef';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'juice-pkr-nitro-trail')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'juice-pkr-nitro-trail', N'Nitro Dash Particles', N'juice-pkr-nitro-trail', N'Sprint leaving behind glowing cyan thermal footprints and blazing speed lines.', N'GAME_LOADOUT', N'pixel-kitchen-rush', N'ACTION_JUICE', N'RARE', 450, N'{"gameId":"pixel-kitchen-rush","dashParticleColor":"#00f0ff","trailType":"nitro"}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Nitro Dash Particles',
        [description] = N'Sprint leaving behind glowing cyan thermal footprints and blazing speed lines.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'pixel-kitchen-rush',
        [slot_type] = N'ACTION_JUICE',
        [tier] = N'RARE',
        [price_coins] = 450,
        [metadata_json] = N'{"gameId":"pixel-kitchen-rush","dashParticleColor":"#00f0ff","trailType":"nitro"}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'juice-pkr-nitro-trail';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'gear-pkr-turbo-stove')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'gear-pkr-turbo-stove', N'Hyper-Induction Turbo Stove', N'gear-pkr-turbo-stove', N'Cuts patty grilling and simmer duration by 35% with hyper-heat induction coils.', N'GAME_LOADOUT', N'pixel-kitchen-rush', N'GAME_GEAR', N'EPIC', 1000, N'{"gameId":"pixel-kitchen-rush","stat":"cook_speed_multiplier","value":1.35}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Hyper-Induction Turbo Stove',
        [description] = N'Cuts patty grilling and simmer duration by 35% with hyper-heat induction coils.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'pixel-kitchen-rush',
        [slot_type] = N'GAME_GEAR',
        [tier] = N'EPIC',
        [price_coins] = 1000,
        [metadata_json] = N'{"gameId":"pixel-kitchen-rush","stat":"cook_speed_multiplier","value":1.35}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'gear-pkr-turbo-stove';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'gear-pkr-rapid-ext')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'gear-pkr-rapid-ext', N'Instant Halon Extinguisher', N'gear-pkr-rapid-ext', N'Extinguishes stove flare-ups and grease fires with 2x rapid discharge speed.', N'GAME_LOADOUT', N'pixel-kitchen-rush', N'GAME_GEAR', N'RARE', 500, N'{"gameId":"pixel-kitchen-rush","stat":"extinguish_speed_multiplier","value":2}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Instant Halon Extinguisher',
        [description] = N'Extinguishes stove flare-ups and grease fires with 2x rapid discharge speed.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'pixel-kitchen-rush',
        [slot_type] = N'GAME_GEAR',
        [tier] = N'RARE',
        [price_coins] = 500,
        [metadata_json] = N'{"gameId":"pixel-kitchen-rush","stat":"extinguish_speed_multiplier","value":2}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'gear-pkr-rapid-ext';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'audio-pkr-8bit')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'audio-pkr-8bit', N'8-Bit Chiptune Kitchen', N'audio-pkr-8bit', N'Vintage 1989 arcade FM sound synthesizer and upbeat chiptune cooking music.', N'GAME_LOADOUT', N'pixel-kitchen-rush', N'AUDIO_THEME', N'COMMON', 150, N'{"gameId":"pixel-kitchen-rush","synthPreset":"8bit_chiptune"}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'8-Bit Chiptune Kitchen',
        [description] = N'Vintage 1989 arcade FM sound synthesizer and upbeat chiptune cooking music.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'pixel-kitchen-rush',
        [slot_type] = N'AUDIO_THEME',
        [tier] = N'COMMON',
        [price_coins] = 150,
        [metadata_json] = N'{"gameId":"pixel-kitchen-rush","synthPreset":"8bit_chiptune"}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'audio-pkr-8bit';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'skin-hc-synthwave')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'skin-hc-synthwave', N'Outrun Synthwave Grid', N'skin-hc-synthwave', N'Neon purple and retro magenta glowing grid board with chromatic aberration core squares.', N'GAME_LOADOUT', N'hyper-chess', N'VISUAL_SKIN', N'EPIC', 1000, N'{"gameId":"hyper-chess","boardDark":"#150a26","boardLight":"#2c124a","coreColor":"#ff0077"}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Outrun Synthwave Grid',
        [description] = N'Neon purple and retro magenta glowing grid board with chromatic aberration core squares.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'hyper-chess',
        [slot_type] = N'VISUAL_SKIN',
        [tier] = N'EPIC',
        [price_coins] = 1000,
        [metadata_json] = N'{"gameId":"hyper-chess","boardDark":"#150a26","boardLight":"#2c124a","coreColor":"#ff0077"}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'skin-hc-synthwave';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'skin-hc-crimson-knight')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'skin-hc-crimson-knight', N'Crimson Plasma Knight', N'skin-hc-crimson-knight', N'Fierce crimson energy knight piece leaving particle trails across the board upon jumping.', N'GAME_LOADOUT', N'hyper-chess', N'VISUAL_SKIN', N'RARE', 450, N'{"gameId":"hyper-chess","piece":"KNIGHT","spriteColor":"#ff0055","trailColor":"rgba(255,0,85,0.4)"}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Crimson Plasma Knight',
        [description] = N'Fierce crimson energy knight piece leaving particle trails across the board upon jumping.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'hyper-chess',
        [slot_type] = N'VISUAL_SKIN',
        [tier] = N'RARE',
        [price_coins] = 450,
        [metadata_json] = N'{"gameId":"hyper-chess","piece":"KNIGHT","spriteColor":"#ff0055","trailColor":"rgba(255,0,85,0.4)"}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'skin-hc-crimson-knight';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'juice-hc-supernova')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'juice-hc-supernova', N'Supernova Checkmate FX', N'juice-hc-supernova', N'Explosive orbital shockwave particle burst on checkmate with screen shake.', N'GAME_LOADOUT', N'hyper-chess', N'ACTION_JUICE', N'EPIC', 850, N'{"gameId":"hyper-chess","checkmateVFX":"SUPERNOVA","particleCount":80,"shakeIntensity":18}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Supernova Checkmate FX',
        [description] = N'Explosive orbital shockwave particle burst on checkmate with screen shake.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'hyper-chess',
        [slot_type] = N'ACTION_JUICE',
        [tier] = N'EPIC',
        [price_coins] = 850,
        [metadata_json] = N'{"gameId":"hyper-chess","checkmateVFX":"SUPERNOVA","particleCount":80,"shakeIntensity":18}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'juice-hc-supernova';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'gear-hc-core-capacitor')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'gear-hc-core-capacitor', N'Core Mana Capacitor', N'gear-hc-core-capacitor', N'Generates +2 extra mana per second for every occupied center control square.', N'GAME_LOADOUT', N'hyper-chess', N'GAME_GEAR', N'EPIC', 1100, N'{"gameId":"hyper-chess","stat":"core_mana_bonus","value":2}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Core Mana Capacitor',
        [description] = N'Generates +2 extra mana per second for every occupied center control square.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'hyper-chess',
        [slot_type] = N'GAME_GEAR',
        [tier] = N'EPIC',
        [price_coins] = 1100,
        [metadata_json] = N'{"gameId":"hyper-chess","stat":"core_mana_bonus","value":2}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'gear-hc-core-capacitor';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'audio-hc-subbass')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'audio-hc-subbass', N'Heavy Sub-Bass Impact', N'audio-hc-subbass', N'Low-frequency sub-bass reverberation upon piece capture and EMP shockwave detonator.', N'GAME_LOADOUT', N'hyper-chess', N'AUDIO_THEME', N'COMMON', 200, N'{"gameId":"hyper-chess","synthPreset":"heavy_subbass"}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Heavy Sub-Bass Impact',
        [description] = N'Low-frequency sub-bass reverberation upon piece capture and EMP shockwave detonator.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'hyper-chess',
        [slot_type] = N'AUDIO_THEME',
        [tier] = N'COMMON',
        [price_coins] = 200,
        [metadata_json] = N'{"gameId":"hyper-chess","synthPreset":"heavy_subbass"}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'audio-hc-subbass';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'skin-nab-gold-interceptor')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'skin-nab-gold-interceptor', N'Golden Interceptor Hull', N'skin-nab-gold-interceptor', N'Gleaming 24K gold ship chassis firing amber plasma lasers with dual engine trails.', N'GAME_LOADOUT', N'neon-asteroid-blitz', N'VISUAL_SKIN', N'RARE', 450, N'{"gameId":"neon-asteroid-blitz","shipColor":"#ffd700","laserColor":"#ffaa00"}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Golden Interceptor Hull',
        [description] = N'Gleaming 24K gold ship chassis firing amber plasma lasers with dual engine trails.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'neon-asteroid-blitz',
        [slot_type] = N'VISUAL_SKIN',
        [tier] = N'RARE',
        [price_coins] = 450,
        [metadata_json] = N'{"gameId":"neon-asteroid-blitz","shipColor":"#ffd700","laserColor":"#ffaa00"}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'skin-nab-gold-interceptor';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'juice-nab-supernova-shatter')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'juice-nab-supernova-shatter', N'Supernova Asteroid Shatter', N'juice-nab-supernova-shatter', N'Asteroid fractures explode into 40 vibrant neon shards with magenta glow rings.', N'GAME_LOADOUT', N'neon-asteroid-blitz', N'ACTION_JUICE', N'RARE', 500, N'{"gameId":"neon-asteroid-blitz","shatterParticleCount":40,"glowHex":"#ff00ea"}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Supernova Asteroid Shatter',
        [description] = N'Asteroid fractures explode into 40 vibrant neon shards with magenta glow rings.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'neon-asteroid-blitz',
        [slot_type] = N'ACTION_JUICE',
        [tier] = N'RARE',
        [price_coins] = 500,
        [metadata_json] = N'{"gameId":"neon-asteroid-blitz","shatterParticleCount":40,"glowHex":"#ff00ea"}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'juice-nab-supernova-shatter';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'gear-nab-ion-magnet')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'gear-nab-ion-magnet', N'Ionized Mineral Magnet', N'gear-nab-ion-magnet', N'Extends coin and power-up vacuum pull radius by +25%.', N'GAME_LOADOUT', N'neon-asteroid-blitz', N'GAME_GEAR', N'COMMON', 250, N'{"gameId":"neon-asteroid-blitz","stat":"magnetRadius","value":1.25}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Ionized Mineral Magnet',
        [description] = N'Extends coin and power-up vacuum pull radius by +25%.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'neon-asteroid-blitz',
        [slot_type] = N'GAME_GEAR',
        [tier] = N'COMMON',
        [price_coins] = 250,
        [metadata_json] = N'{"gameId":"neon-asteroid-blitz","stat":"magnetRadius","value":1.25}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'gear-nab-ion-magnet';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'gear-nab-kinetic-refractor')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'gear-nab-kinetic-refractor', N'Kinetic Shield Refractor', N'gear-nab-kinetic-refractor', N'Provides 1 emergency automatic shield revive per tournament run.', N'GAME_LOADOUT', N'neon-asteroid-blitz', N'GAME_GEAR', N'EPIC', 1250, N'{"gameId":"neon-asteroid-blitz","stat":"shield_revives","value":1}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Kinetic Shield Refractor',
        [description] = N'Provides 1 emergency automatic shield revive per tournament run.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'neon-asteroid-blitz',
        [slot_type] = N'GAME_GEAR',
        [tier] = N'EPIC',
        [price_coins] = 1250,
        [metadata_json] = N'{"gameId":"neon-asteroid-blitz","stat":"shield_revives","value":1}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'gear-nab-kinetic-refractor';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'skin-cs-plasma-claws')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'skin-cs-plasma-claws', N'Dual Cyan Plasma Claws', N'skin-cs-plasma-claws', N'High-frequency electric blue energy blade trails slicing through cyber enemies.', N'GAME_LOADOUT', N'cyber-slicer-2099', N'VISUAL_SKIN', N'RARE', 500, N'{"gameId":"cyber-slicer-2099","bladeStyle":"plasma_claws","bladeColor":"#00f0ff"}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Dual Cyan Plasma Claws',
        [description] = N'High-frequency electric blue energy blade trails slicing through cyber enemies.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'cyber-slicer-2099',
        [slot_type] = N'VISUAL_SKIN',
        [tier] = N'RARE',
        [price_coins] = 500,
        [metadata_json] = N'{"gameId":"cyber-slicer-2099","bladeStyle":"plasma_claws","bladeColor":"#00f0ff"}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'skin-cs-plasma-claws';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'juice-cs-glitch-dissolve')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'juice-cs-glitch-dissolve', N'Binary Glitch Dissolve', N'juice-cs-glitch-dissolve', N'Sliced targets disintegrate into matrix-style hexadecimal code bursts.', N'GAME_LOADOUT', N'cyber-slicer-2099', N'ACTION_JUICE', N'RARE', 450, N'{"gameId":"cyber-slicer-2099","sliceVFX":"glitch_binary"}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Binary Glitch Dissolve',
        [description] = N'Sliced targets disintegrate into matrix-style hexadecimal code bursts.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'cyber-slicer-2099',
        [slot_type] = N'ACTION_JUICE',
        [tier] = N'RARE',
        [price_coins] = 450,
        [metadata_json] = N'{"gameId":"cyber-slicer-2099","sliceVFX":"glitch_binary"}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'juice-cs-glitch-dissolve';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'gear-cs-hitbox-matrix')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'gear-cs-hitbox-matrix', N'Holographic Hitbox Extender', N'gear-cs-hitbox-matrix', N'Increases blade contact collision hitbox by +15% for easier multi-slice combos.', N'GAME_LOADOUT', N'cyber-slicer-2099', N'GAME_GEAR', N'RARE', 650, N'{"gameId":"cyber-slicer-2099","stat":"hitboxMultiplier","value":1.15}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Holographic Hitbox Extender',
        [description] = N'Increases blade contact collision hitbox by +15% for easier multi-slice combos.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'cyber-slicer-2099',
        [slot_type] = N'GAME_GEAR',
        [tier] = N'RARE',
        [price_coins] = 650,
        [metadata_json] = N'{"gameId":"cyber-slicer-2099","stat":"hitboxMultiplier","value":1.15}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'gear-cs-hitbox-matrix';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'audio-cs-darksynth')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'audio-cs-darksynth', N'Darksynth Distortion Beat', N'audio-cs-darksynth', N'Heavy bassline overdrive and cyberpunk synth beats synced to slicing speed.', N'GAME_LOADOUT', N'cyber-slicer-2099', N'AUDIO_THEME', N'RARE', 450, N'{"gameId":"cyber-slicer-2099","synthPreset":"darksynth_distort"}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Darksynth Distortion Beat',
        [description] = N'Heavy bassline overdrive and cyberpunk synth beats synced to slicing speed.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'cyber-slicer-2099',
        [slot_type] = N'AUDIO_THEME',
        [tier] = N'RARE',
        [price_coins] = 450,
        [metadata_json] = N'{"gameId":"cyber-slicer-2099","synthPreset":"darksynth_distort"}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'audio-cs-darksynth';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'skin-dld-paladin')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'skin-dld-paladin', N'Golden Paladin Armor', N'skin-dld-paladin', N'Radiant holy golden armor with cape physics and gleaming sword strikes.', N'GAME_LOADOUT', N'dungeon-loot-dash', N'VISUAL_SKIN', N'RARE', 450, N'{"gameId":"dungeon-loot-dash","characterSprite":"paladin_gold"}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Golden Paladin Armor',
        [description] = N'Radiant holy golden armor with cape physics and gleaming sword strikes.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'dungeon-loot-dash',
        [slot_type] = N'VISUAL_SKIN',
        [tier] = N'RARE',
        [price_coins] = 450,
        [metadata_json] = N'{"gameId":"dungeon-loot-dash","characterSprite":"paladin_gold"}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'skin-dld-paladin';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'juice-dld-vacuum-sparkle')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'juice-dld-vacuum-sparkle', N'Golden Vacuum Sparkles', N'juice-dld-vacuum-sparkle', N'Sparkling particle bursts whenever golden chests and gems are collected.', N'GAME_LOADOUT', N'dungeon-loot-dash', N'ACTION_JUICE', N'RARE', 500, N'{"gameId":"dungeon-loot-dash","coinCollectVFX":"golden_burst"}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Golden Vacuum Sparkles',
        [description] = N'Sparkling particle bursts whenever golden chests and gems are collected.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'dungeon-loot-dash',
        [slot_type] = N'ACTION_JUICE',
        [tier] = N'RARE',
        [price_coins] = 500,
        [metadata_json] = N'{"gameId":"dungeon-loot-dash","coinCollectVFX":"golden_burst"}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'juice-dld-vacuum-sparkle';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'gear-dld-feather-boots')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'gear-dld-feather-boots', N'Featherfall Apex Boots', N'gear-dld-feather-boots', N'Grants +10% hang-time and jump height at the apex to clear lava pits easily.', N'GAME_LOADOUT', N'dungeon-loot-dash', N'GAME_GEAR', N'COMMON', 250, N'{"gameId":"dungeon-loot-dash","stat":"jumpApexBoost","value":1.1}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Featherfall Apex Boots',
        [description] = N'Grants +10% hang-time and jump height at the apex to clear lava pits easily.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'dungeon-loot-dash',
        [slot_type] = N'GAME_GEAR',
        [tier] = N'COMMON',
        [price_coins] = 250,
        [metadata_json] = N'{"gameId":"dungeon-loot-dash","stat":"jumpApexBoost","value":1.1}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'gear-dld-feather-boots';
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[shop_items] WHERE [id] = N'gear-dld-greedy-pouch')
BEGIN
    INSERT INTO [dbo].[shop_items] ([id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at])
    VALUES (N'gear-dld-greedy-pouch', N'Greedy Goblin Coin Pouch', N'gear-dld-greedy-pouch', N'Multiplies all dungeon coin chest drops by +25% upon stage clear.', N'GAME_LOADOUT', N'dungeon-loot-dash', N'GAME_GEAR', N'RARE', 600, N'{"gameId":"dungeon-loot-dash","stat":"coinDropMultiplier","value":1.25}', -1, 1, 1, GETUTCDATE());
END
ELSE
BEGIN
    UPDATE [dbo].[shop_items]
    SET [name] = N'Greedy Goblin Coin Pouch',
        [description] = N'Multiplies all dungeon coin chest drops by +25% upon stage clear.',
        [category] = N'GAME_LOADOUT',
        [target_game_id] = N'dungeon-loot-dash',
        [slot_type] = N'GAME_GEAR',
        [tier] = N'RARE',
        [price_coins] = 600,
        [metadata_json] = N'{"gameId":"dungeon-loot-dash","stat":"coinDropMultiplier","value":1.25}',
        [stock_remaining] = -1,
        [is_active] = 1,
        [is_public] = 1
    WHERE [id] = N'gear-dld-greedy-pouch';
END
GO

-- 5. Seed Single-Use Serial Pool
IF NOT EXISTS (SELECT 1 FROM [dbo].[reward_serials_pool] WHERE [serial_code] = N'RAZER-ULT-7721')
BEGIN
    INSERT INTO [dbo].[reward_serials_pool] ([item_id], [serial_code], [is_redeemed])
    VALUES (N'perk-razer-headset-discount', N'RAZER-ULT-7721', 0);
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[reward_serials_pool] WHERE [serial_code] = N'RAZER-ULT-9042')
BEGIN
    INSERT INTO [dbo].[reward_serials_pool] ([item_id], [serial_code], [is_redeemed])
    VALUES (N'perk-razer-headset-discount', N'RAZER-ULT-9042', 0);
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[reward_serials_pool] WHERE [serial_code] = N'RAZER-ULT-3318')
BEGIN
    INSERT INTO [dbo].[reward_serials_pool] ([item_id], [serial_code], [is_redeemed])
    VALUES (N'perk-razer-headset-discount', N'RAZER-ULT-3318', 0);
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[reward_serials_pool] WHERE [serial_code] = N'RAZER-ULT-5589')
BEGIN
    INSERT INTO [dbo].[reward_serials_pool] ([item_id], [serial_code], [is_redeemed])
    VALUES (N'perk-razer-headset-discount', N'RAZER-ULT-5589', 0);
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[reward_serials_pool] WHERE [serial_code] = N'HESTAN-CHEF-50-A')
BEGIN
    INSERT INTO [dbo].[reward_serials_pool] ([item_id], [serial_code], [is_redeemed])
    VALUES (N'perk-hestan-cookware-voucher', N'HESTAN-CHEF-50-A', 0);
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[reward_serials_pool] WHERE [serial_code] = N'HESTAN-CHEF-50-B')
BEGIN
    INSERT INTO [dbo].[reward_serials_pool] ([item_id], [serial_code], [is_redeemed])
    VALUES (N'perk-hestan-cookware-voucher', N'HESTAN-CHEF-50-B', 0);
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[reward_serials_pool] WHERE [serial_code] = N'HESTAN-CHEF-50-C')
BEGIN
    INSERT INTO [dbo].[reward_serials_pool] ([item_id], [serial_code], [is_redeemed])
    VALUES (N'perk-hestan-cookware-voucher', N'HESTAN-CHEF-50-C', 0);
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[reward_serials_pool] WHERE [serial_code] = N'ANKER-POWER-30-X1')
BEGIN
    INSERT INTO [dbo].[reward_serials_pool] ([item_id], [serial_code], [is_redeemed])
    VALUES (N'perk-anker-prime-gan', N'ANKER-POWER-30-X1', 0);
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[reward_serials_pool] WHERE [serial_code] = N'ANKER-POWER-30-X2')
BEGIN
    INSERT INTO [dbo].[reward_serials_pool] ([item_id], [serial_code], [is_redeemed])
    VALUES (N'perk-anker-prime-gan', N'ANKER-POWER-30-X2', 0);
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[reward_serials_pool] WHERE [serial_code] = N'ANKER-POWER-30-X3')
BEGIN
    INSERT INTO [dbo].[reward_serials_pool] ([item_id], [serial_code], [is_redeemed])
    VALUES (N'perk-anker-prime-gan', N'ANKER-POWER-30-X3', 0);
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[reward_serials_pool] WHERE [serial_code] = N'NORD-SECURE-70-01')
BEGIN
    INSERT INTO [dbo].[reward_serials_pool] ([item_id], [serial_code], [is_redeemed])
    VALUES (N'perk-nordvpn-2yr', N'NORD-SECURE-70-01', 0);
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[reward_serials_pool] WHERE [serial_code] = N'NORD-SECURE-70-02')
BEGIN
    INSERT INTO [dbo].[reward_serials_pool] ([item_id], [serial_code], [is_redeemed])
    VALUES (N'perk-nordvpn-2yr', N'NORD-SECURE-70-02', 0);
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[reward_serials_pool] WHERE [serial_code] = N'STEAM-GIFT-9912-A')
BEGIN
    INSERT INTO [dbo].[reward_serials_pool] ([item_id], [serial_code], [is_redeemed])
    VALUES (N'voucher-steam-gift', N'STEAM-GIFT-9912-A', 0);
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[reward_serials_pool] WHERE [serial_code] = N'STEAM-GIFT-9912-B')
BEGIN
    INSERT INTO [dbo].[reward_serials_pool] ([item_id], [serial_code], [is_redeemed])
    VALUES (N'voucher-steam-gift', N'STEAM-GIFT-9912-B', 0);
END
IF NOT EXISTS (SELECT 1 FROM [dbo].[reward_serials_pool] WHERE [serial_code] = N'DASH-FEAST-15-77')
BEGIN
    INSERT INTO [dbo].[reward_serials_pool] ([item_id], [serial_code], [is_redeemed])
    VALUES (N'voucher-doordash', N'DASH-FEAST-15-77', 0);
END
GO
