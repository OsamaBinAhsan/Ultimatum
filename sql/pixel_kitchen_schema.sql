-- ========================================================
-- Pixel Kitchen Rush - MySQL Schema & Persistent Economy
-- ========================================================

CREATE TABLE IF NOT EXISTS player_profiles (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  display_name VARCHAR(64),
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_id VARCHAR(64) NOT NULL UNIQUE,
  coin_balance INT NOT NULL DEFAULT 250,
  total_earned INT NOT NULL DEFAULT 250,
  total_spent INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES player_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shop_items (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category ENUM('appliance', 'speed', 'cosmetic', 'booster') NOT NULL,
  description TEXT NOT NULL,
  price INT NOT NULL,
  effect_type VARCHAR(64) NOT NULL,
  effect_value FLOAT NOT NULL DEFAULT 1.0,
  icon_placeholder VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_id VARCHAR(64) NOT NULL,
  item_id VARCHAR(64) NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  is_equipped BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_player_item (player_id, item_id),
  FOREIGN KEY (player_id) REFERENCES player_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kitchen_shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_code VARCHAR(8) NOT NULL,
  player_id VARCHAR(64) NOT NULL,
  shift_number INT NOT NULL DEFAULT 1,
  orders_served INT NOT NULL DEFAULT 0,
  orders_burned INT NOT NULL DEFAULT 0,
  orders_failed INT NOT NULL DEFAULT 0,
  star_rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  tips_earned INT NOT NULL DEFAULT 0,
  is_doubled BOOLEAN DEFAULT FALSE,
  customer_review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_player_shifts (player_id),
  INDEX idx_room (room_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Default Kitchen Upgrade Shop Items
INSERT INTO shop_items (id, name, category, description, price, effect_type, effect_value, icon_placeholder)
VALUES 
  ('turbo_stove_v1', 'Turbo Induction Stove', 'appliance', 'Cuts patty grilling time by 35% with hyper-heat coils.', 250, 'cook_speed', 1.35, 'CANVA_AI_ASSET: High-contrast 16-bit retro pixel red electric induction stove with glowing blue flame'),
  ('speed_clogs', 'Chef Nitro Clogs', 'speed', 'Increases player sprint and movement speed by 25%.', 180, 'move_speed', 1.25, 'CANVA_AI_ASSET: Pixel art yellow rubber chef clogs with comic speed lines'),
  ('golden_spatula', 'Master Golden Spatula', 'booster', 'Yields +50% bonus coin tips on every 5-star order served.', 500, 'tip_multiplier', 1.50, 'CANVA_AI_ASSET: Shiny 24K gold pixel spatula with sparkling star gleams'),
  ('auto_chopper', 'Laser Cutting Board', 'appliance', 'Chops lettuce and tomatoes instantly in 0.4 seconds.', 350, 'chop_speed', 2.00, 'CANVA_AI_ASSET: Futuristic neon cyan chopping board with glowing digital grid'),
  ('fire_extinguisher_deluxe', 'Titan Fire Blaster', 'booster', 'Auto-extinguishes burnt stoves instantly to salvage kitchen chaos.', 150, 'burn_salvage', 1.00, 'CANVA_AI_ASSET: Chunky red fire extinguisher with MS Paint comic label')
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price);
