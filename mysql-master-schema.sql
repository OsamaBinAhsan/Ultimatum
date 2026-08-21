-- ==============================================================================
-- ULTIMATUM PLATFORM - MASTER HOSTGATOR MYSQL DATABASE SCHEMA & SEED
-- Combines Core Platform (Auth, Games, Recipes, Reviews, Articles, Sponsors)
-- PLUS Collaborator Updates (Pixel Kitchen Rush Multiplayer Economy, Wallets, Shop, Shifts)
-- For phpMyAdmin (MySQL 5.6, 5.7, 8.0 & MariaDB Port 3306)
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 1. CORE PLATFORM TABLES
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `profiles` (
    `id` VARCHAR(64) PRIMARY KEY,
    `email` VARCHAR(255) UNIQUE,
    `password_hash` TEXT,
    `username` VARCHAR(150) UNIQUE NOT NULL,
    `avatar_url` TEXT,
    `role` ENUM('user', 'moderator', 'admin') DEFAULT 'user',
    `points` INT DEFAULT 250,
    `daily_streak` INT DEFAULT 1,
    `last_active_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `vip_ad_lite_until` DATETIME NULL,
    `badges` JSON NULL,
    `is_banned` TINYINT(1) DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `games` (
    `id` VARCHAR(64) PRIMARY KEY,
    `slug` VARCHAR(255) UNIQUE NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `category` ENUM('arcade', 'action', 'puzzle', 'retro', 'strategy') DEFAULT 'arcade',
    `thumbnail_url` TEXT NOT NULL,
    `game_file_url` TEXT NOT NULL,
    `is_sponsored` TINYINT(1) DEFAULT 0,
    `sponsor_name` VARCHAR(255) NULL,
    `play_count` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `leaderboards` (
    `id` VARCHAR(64) PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `game_id` VARCHAR(64) NOT NULL,
    `score` INT NOT NULL,
    `week_timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `recipes` (
    `id` VARCHAR(64) PRIMARY KEY,
    `slug` VARCHAR(255) UNIQUE NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `hero_image_url` TEXT NOT NULL,
    `prep_time` INT NOT NULL,
    `cook_time` INT NOT NULL,
    `servings` INT DEFAULT 4 NOT NULL,
    `calories` INT NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `cuisine` VARCHAR(100) NULL,
    `cuisine_tags` JSON NULL,
    `dietary_tags` JSON NULL,
    `ingredients` JSON NOT NULL,
    `instructions` JSON NOT NULL,
    `nutrition` JSON NULL,
    `rating` DECIMAL(2, 1) DEFAULT 4.9,
    `rating_count` INT DEFAULT 128,
    `author` VARCHAR(255) DEFAULT 'Chef Marco & Ultimatum Test Kitchen',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `reviews` (
    `id` VARCHAR(64) PRIMARY KEY,
    `slug` VARCHAR(255) UNIQUE NOT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `category` ENUM('tech_hardware', 'food_lifestyle') NOT NULL,
    `rating` DECIMAL(2, 1) NOT NULL,
    `summary` TEXT NOT NULL,
    `verdict` TEXT NOT NULL,
    `pros` JSON NULL,
    `cons` JSON NULL,
    `specifications` JSON NOT NULL,
    `affiliate_link` TEXT NULL,
    `affiliate_retailer` VARCHAR(255) DEFAULT 'Amazon / Direct Partner',
    `hero_image_url` TEXT NOT NULL,
    `author` VARCHAR(255) DEFAULT 'Ultimatum Lab Editorial Team',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `articles` (
    `id` VARCHAR(64) PRIMARY KEY,
    `slug` VARCHAR(255) UNIQUE NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `subtitle` TEXT NULL,
    `category` ENUM('beauty_fashion', 'news_editorial', 'gaming_news') NOT NULL,
    `hero_image_url` TEXT NOT NULL,
    `gallery_images` JSON NULL,
    `content` LONGTEXT NOT NULL,
    `tags` JSON NULL,
    `author` VARCHAR(255) NOT NULL,
    `read_time` INT DEFAULT 5,
    `is_breaking` TINYINT(1) DEFAULT 0,
    `shoppable_items` JSON NULL,
    `published_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sponsors` (
    `id` VARCHAR(64) PRIMARY KEY,
    `sponsor_name` VARCHAR(255) NOT NULL,
    `image_url` TEXT NOT NULL,
    `destination_url` TEXT NOT NULL,
    `slot_position` ENUM('header_banner', 'sidebar', 'in_content', 'footer') NOT NULL,
    `impressions_tracked` INT DEFAULT 0,
    `clicks_tracked` INT DEFAULT 0,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pages` (
    `id` VARCHAR(64) PRIMARY KEY,
    `slug` VARCHAR(255) UNIQUE NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `subtitle` TEXT NULL,
    `content` LONGTEXT NOT NULL,
    `meta_description` TEXT NULL,
    `show_in_nav` TINYINT(1) DEFAULT 0,
    `show_in_footer` TINYINT(1) DEFAULT 1,
    `enable_ads` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bookmarks` (
    `id` VARCHAR(64) PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `item_type` ENUM('recipe', 'review', 'article', 'game') NOT NULL,
    `item_id` VARCHAR(255) NOT NULL,
    `item_title` VARCHAR(255) NOT NULL,
    `item_slug` VARCHAR(255) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `site_settings` (
    `key` VARCHAR(255) PRIMARY KEY,
    `value` JSON NOT NULL,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 2. COLLABORATOR GAME ECONOMY TABLES (PIXEL KITCHEN RUSH)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `player_profiles` (
  `id` VARCHAR(64) PRIMARY KEY,
  `username` VARCHAR(64) NOT NULL UNIQUE,
  `display_name` VARCHAR(64),
  `avatar_url` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `wallets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `player_id` VARCHAR(64) NOT NULL UNIQUE,
  `coin_balance` INT NOT NULL DEFAULT 250,
  `total_earned` INT NOT NULL DEFAULT 250,
  `total_spent` INT NOT NULL DEFAULT 0,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`player_id`) REFERENCES `player_profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `shop_items` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `category` ENUM('appliance', 'speed', 'cosmetic', 'booster') NOT NULL,
  `description` TEXT NOT NULL,
  `price` INT NOT NULL,
  `effect_type` VARCHAR(64) NOT NULL,
  `effect_value` FLOAT NOT NULL DEFAULT 1.0,
  `icon_placeholder` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `inventory` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `player_id` VARCHAR(64) NOT NULL,
  `item_id` VARCHAR(64) NOT NULL,
  `item_name` VARCHAR(100) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `is_equipped` TINYINT(1) DEFAULT 0,
  `purchased_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_player_item` (`player_id`, `item_id`),
  FOREIGN KEY (`player_id`) REFERENCES `player_profiles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`item_id`) REFERENCES `shop_items`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `kitchen_shifts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_code` VARCHAR(8) NOT NULL,
  `player_id` VARCHAR(64) NOT NULL,
  `shift_number` INT NOT NULL DEFAULT 1,
  `orders_served` INT NOT NULL DEFAULT 0,
  `orders_burned` INT NOT NULL DEFAULT 0,
  `orders_failed` INT NOT NULL DEFAULT 0,
  `star_rating` DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  `tips_earned` INT NOT NULL DEFAULT 0,
  `is_doubled` TINYINT(1) DEFAULT 0,
  `customer_review` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_player_shifts` (`player_id`),
  INDEX `idx_room` (`room_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 3. SEED INITIAL DATA
-- --------------------------------------------------------

INSERT IGNORE INTO `profiles` (`id`, `username`, `email`, `role`, `points`, `daily_streak`, `badges`)
VALUES 
    ('user-001', 'PixelNinja', 'admin@ultimatum.gg', 'admin', 4850, 5, '["Grand Champion", "Arcade Master", "Founding Chef", "Super Admin"]'),
    ('user-002', 'CyberGourmet', 'gamer@ultimatum.gg', 'user', 3420, 3, '["Top Gun", "Recipe Critic", "High Roller"]'),
    ('user-003', 'AeroStrike', 'aerostrike@ultimatum.gg', 'user', 2980, 2, '["Sharpshooter", "Speed Demon"]'),
    ('user-004', 'SpiceOverlord', 'spice@ultimatum.gg', 'user', 1840, 1, '["Taste Tester", "Kitchen Samurai"]');

INSERT IGNORE INTO `games` (`id`, `slug`, `title`, `description`, `category`, `thumbnail_url`, `game_file_url`, `is_sponsored`, `sponsor_name`, `play_count`)
VALUES
    ('game-001', 'neon-asteroid-blitz', 'Neon Asteroid Blitz', 'High-octane retro arcade shooter. Pilot your neon starship through deep space debris, unleash laser blasts, collect powerup crystals, and dominate the weekly global leaderboard.', 'arcade', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80', 'canvas://neon-asteroid-blitz', 1, 'Razer Gaming Gear', 34820),
    ('game-002', 'cyber-slicer-2099', 'Cyber Slicer 2099', 'Fast-paced rhythmic reflex slicer. Cut glowing energy nodes before they breach your firewall perimeter in this futuristic synthwave challenge.', 'action', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80', 'canvas://cyber-slicer', 0, NULL, 22150),
    ('game-003', 'pixel-kitchen-rush', 'Pixel Kitchen Rush', 'Frenetic 2D culinary rush! Juggle gourmet orders, chop ingredients, flip steaks, and satisfy demanding VIP food critics before the timer expires.', 'puzzle', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', 'canvas://pixel-kitchen', 1, 'Hestan Masterware', 18940),
    ('game-004', 'dungeon-loot-dash', 'Dungeon Loot Dash', 'Classic 8-bit endless runner. Dodge lava traps, jump over spike barriers, and stack legendary gold chests to redeem exclusive profile badges.', 'retro', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80', 'canvas://dungeon-loot', 0, NULL, 14780),
    ('game-005', 'sabotage-circuit', 'Sabotage Circuit', '5-Player Asynchronous Deception & Crisis Management Simulator. 4 Engineers must maintain Core Integrity while 1 secretly assigned Saboteur triggers cascading failures across 6 interconnected power and logic sectors.', 'action', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', 'canvas://sabotage-circuit', 1, 'CyberCore Industries', 28940),
    ('game-006', 'the-architect-and-the-rats', 'The Architect & The Rats', '1v4 Asymmetrical Maze Deception & Escape Arena. 1-2 Architects forge a deadly labyrinth of spikes, decoys, and trigger traps while Rats navigate through fog of war to find the True Gold Exit before time runs out.', 'retro', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80', 'canvas://the-architect-and-the-rats', 1, 'RetroGrid Labs', 31250);

INSERT IGNORE INTO `player_profiles` (`id`, `username`, `display_name`)
VALUES 
    ('user-001', 'PixelNinja', 'PixelNinja'),
    ('user-002', 'CyberGourmet', 'CyberGourmet');

INSERT IGNORE INTO `wallets` (`player_id`, `coin_balance`, `total_earned`)
VALUES 
    ('user-001', 1250, 1250),
    ('user-002', 850, 850);

INSERT INTO `shop_items` (`id`, `name`, `category`, `description`, `price`, `effect_type`, `effect_value`, `icon_placeholder`)
VALUES 
  ('turbo_stove_v1', 'Turbo Induction Stove', 'appliance', 'Cuts patty grilling time by 35% with hyper-heat coils.', 250, 'cook_speed', 1.35, 'CANVA_AI_ASSET: High-contrast 16-bit retro pixel red electric induction stove with glowing blue flame'),
  ('speed_clogs', 'Chef Nitro Clogs', 'speed', 'Increases player sprint and movement speed by 25%.', 180, 'move_speed', 1.25, 'CANVA_AI_ASSET: Pixel art yellow rubber chef clogs with comic speed lines'),
  ('golden_spatula', 'Master Golden Spatula', 'booster', 'Yields +50% bonus coin tips on every 5-star order served.', 500, 'tip_multiplier', 1.50, 'CANVA_AI_ASSET: Shiny 24K gold pixel spatula with sparkling star gleams'),
  ('auto_chopper', 'Laser Cutting Board', 'appliance', 'Chops lettuce and tomatoes instantly in 0.4 seconds.', 350, 'chop_speed', 2.00, 'CANVA_AI_ASSET: Futuristic neon cyan chopping board with glowing digital grid'),
  ('fire_extinguisher_deluxe', 'Titan Fire Blaster', 'booster', 'Auto-extinguishes burnt stoves instantly to salvage kitchen chaos.', 150, 'burn_salvage', 1.00, 'CANVA_AI_ASSET: Chunky red fire extinguisher with MS Paint comic label')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `price`=VALUES(`price`);

SET FOREIGN_KEY_CHECKS = 1;
