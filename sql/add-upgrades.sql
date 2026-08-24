-- ==============================================================================
-- ULTIMATUM PLATFORM - UPGRADE MIGRATIONS
-- Run once via phpMyAdmin on your HostGator MySQL database
-- All statements are safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- PHASE 0: POST SCHEDULER COLUMNS
-- --------------------------------------------------------

ALTER TABLE `recipes`
  ADD COLUMN IF NOT EXISTS `status` ENUM('draft','scheduled','published') NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS `scheduled_for` DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `published_at` DATETIME NULL;

ALTER TABLE `reviews`
  ADD COLUMN IF NOT EXISTS `status` ENUM('draft','scheduled','published') NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS `scheduled_for` DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `published_at` DATETIME NULL;

-- articles already has published_at — only add the two new columns
ALTER TABLE `articles`
  ADD COLUMN IF NOT EXISTS `status` ENUM('draft','scheduled','published') NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS `scheduled_for` DATETIME NULL;

-- Scheduler audit log
CREATE TABLE IF NOT EXISTS `scheduler_log` (
  `id`                 INT AUTO_INCREMENT PRIMARY KEY,
  `run_at`             DATETIME DEFAULT CURRENT_TIMESTAMP,
  `recipes_published`  INT DEFAULT 0,
  `reviews_published`  INT DEFAULT 0,
  `articles_published` INT DEFAULT 0,
  `total_published`    INT DEFAULT 0,
  `duration_ms`        INT DEFAULT 0,
  `notes`              TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- PHASE 3: USER ACTIVITY TABLES
-- --------------------------------------------------------

-- Saved recipes: user bookmarks for recipes
CREATE TABLE IF NOT EXISTS `saved_recipes` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`      VARCHAR(64) NOT NULL,
  `recipe_id`    VARCHAR(64) NOT NULL,
  `recipe_slug`  VARCHAR(255) NOT NULL,
  `recipe_title` VARCHAR(255) NOT NULL,
  `saved_at`     DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_recipe` (`user_id`, `recipe_id`),
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Game stats: per-user, per-game tracking
CREATE TABLE IF NOT EXISTS `game_stats` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`        VARCHAR(64) NOT NULL,
  `game_id`        VARCHAR(64) NOT NULL,
  `game_slug`      VARCHAR(255) NOT NULL,
  `game_title`     VARCHAR(255) NOT NULL,
  `high_score`     INT DEFAULT 0,
  `total_plays`    INT DEFAULT 0,
  `best_rank`      INT NULL,
  `last_played_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_game` (`user_id`, `game_id`),
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User comments: cross-content commenting
CREATE TABLE IF NOT EXISTS `user_comments` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`      VARCHAR(64) NOT NULL,
  `content_type` ENUM('recipe','review','article','game') NOT NULL,
  `content_id`   VARCHAR(64) NOT NULL,
  `content_slug` VARCHAR(255) NOT NULL,
  `body`         TEXT NOT NULL,
  `is_flagged`   TINYINT(1) DEFAULT 0,
  `created_at`   DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_comments_content` (`content_type`, `content_id`),
  INDEX `idx_comments_user` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
