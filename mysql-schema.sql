-- ==============================================================================
-- ULTIMATUM PLATFORM - HOSTGATOR / CPANEL MYSQL SCHEMA & SEED DATA
-- Fully compatible with MySQL 5.6, 5.7, 8.0 & MariaDB (phpMyAdmin Port 3306)
-- ==============================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS `profiles` (
    `id` VARCHAR(36) PRIMARY KEY,
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

-- 2. GAMES TABLE
CREATE TABLE IF NOT EXISTS `games` (
    `id` VARCHAR(36) PRIMARY KEY,
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

-- 3. LEADERBOARDS TABLE
CREATE TABLE IF NOT EXISTS `leaderboards` (
    `id` VARCHAR(36) PRIMARY KEY,
    `user_id` VARCHAR(36) NOT NULL,
    `game_id` VARCHAR(36) NOT NULL,
    `score` INT NOT NULL,
    `week_timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. RECIPES TABLE
CREATE TABLE IF NOT EXISTS `recipes` (
    `id` VARCHAR(36) PRIMARY KEY,
    `slug` VARCHAR(255) UNIQUE NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `hero_image_url` TEXT NOT NULL,
    `prep_time` INT NOT NULL,
    `cook_time` INT NOT NULL,
    `servings` INT DEFAULT 4 NOT NULL,
    `calories` INT NOT NULL,
    `category` VARCHAR(100) NOT NULL,
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

-- 5. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS `reviews` (
    `id` VARCHAR(36) PRIMARY KEY,
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

-- 6. ARTICLES TABLE
CREATE TABLE IF NOT EXISTS `articles` (
    `id` VARCHAR(36) PRIMARY KEY,
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

-- 7. SPONSORS TABLE
CREATE TABLE IF NOT EXISTS `sponsors` (
    `id` VARCHAR(36) PRIMARY KEY,
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

-- 8. CUSTOM PAGES TABLE
CREATE TABLE IF NOT EXISTS `pages` (
    `id` VARCHAR(36) PRIMARY KEY,
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

-- 9. USER BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS `bookmarks` (
    `id` VARCHAR(36) PRIMARY KEY,
    `user_id` VARCHAR(36) NOT NULL,
    `item_type` ENUM('recipe', 'review', 'article', 'game') NOT NULL,
    `item_id` VARCHAR(255) NOT NULL,
    `item_title` VARCHAR(255) NOT NULL,
    `item_slug` VARCHAR(255) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS `site_settings` (
    `key` VARCHAR(255) PRIMARY KEY,
    `value` JSON NOT NULL,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- INITIAL SEED DATA FOR HOSTGATOR MYSQL DATABASE
INSERT IGNORE INTO `profiles` (`id`, `username`, `email`, `role`, `points`, `daily_streak`, `badges`)
VALUES 
    ('e1010000-0000-0000-0000-000000000001', 'PixelNinja', 'admin@ultimatum.gg', 'admin', 8450, 14, '["Super Admin", "Arcade Legend", "Michelin Gourmet"]'),
    ('e1010000-0000-0000-0000-000000000002', 'CyberChef_X', 'player@ultimatum.gg', 'user', 1250, 5, '["Weekly Top 10", "Taste Explorer"]');

INSERT IGNORE INTO `games` (`id`, `slug`, `title`, `description`, `category`, `thumbnail_url`, `game_file_url`, `is_sponsored`, `play_count`)
VALUES
    ('g1010000-0000-0000-0000-000000000001', 'neon-asteroid-blitz', 'Neon Asteroid Blitz', 'High-octane space vector shooter. Destroy cosmic anomalies, trigger hyper-bombs, and dominate weekly leaderboards!', 'arcade', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80', '/canvas/neon-blitz', 1, 1420),
    ('g1010000-0000-0000-0000-000000000002', 'cyber-slicer', 'Cyber Slicer 2099', 'Precision sword slicing arcade game. Slash neon targets and avoid overload mines.', 'action', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80', '/canvas/cyber-slicer', 0, 980),
    ('g1010000-0000-0000-0000-000000000006', 'the-architect-and-the-rats', 'The Architect & The Rats', '1v4 Asymmetrical Maze Deception & Escape Arena. 1-2 Architects forge a deadly labyrinth of spikes, decoys, and trigger traps while Rats navigate through fog of war to find the True Gold Exit before time runs out.', 'retro', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80', '/canvas/the-architect-and-the-rats', 1, 31250);

INSERT IGNORE INTO `site_settings` (`key`, `value`)
VALUES ('main_settings', '{"announcement": {"enabled": true, "text": "🔥 WEEKLY ARCADE TOURNAMENT LIVE: Play Neon Asteroid Blitz & Win 5,000 XP!", "link": "/games/neon-asteroid-blitz"}, "monetization": {"ads_enabled": true, "header_ad": true, "sidebar_ad": true, "in_content_ad": true, "sticky_footer_ad": true, "rewarded_ads": true}}');
