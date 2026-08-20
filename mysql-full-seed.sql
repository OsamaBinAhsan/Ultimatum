-- ==============================================================================
-- ULTIMATUM PLATFORM - PERFECT FULL MYSQL SEED DATA SET
-- Target: phpMyAdmin (HostGator, cPanel, MariaDB, MySQL 5.6 / 5.7 / 8.0)
-- Description: Clears placeholder rows and populates exact matching profiles,
--              games, recipes, reviews, articles, sponsors, pages, leaderboards.
-- ==============================================================================

-- 1. Disable Foreign Key Checks
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Clear Any Old Placeholder Records (Using DELETE FROM instead of TRUNCATE for MySQL FK safety)
DELETE FROM `bookmarks`;
DELETE FROM `leaderboards`;
DELETE FROM `profiles`;
DELETE FROM `games`;
DELETE FROM `recipes`;
DELETE FROM `reviews`;
DELETE FROM `articles`;
DELETE FROM `sponsors`;
DELETE FROM `pages`;
DELETE FROM `site_settings`;

-- 3. PROFILES
INSERT INTO `profiles` (`id`, `username`, `email`, `role`, `points`, `daily_streak`, `badges`)
VALUES 
    ('user-001', 'PixelNinja', 'admin@ultimatum.gg', 'admin', 4850, 5, '["Grand Champion", "Arcade Master", "Founding Chef", "Super Admin"]'),
    ('user-002', 'CyberGourmet', 'gamer@ultimatum.gg', 'user', 3420, 3, '["Top Gun", "Recipe Critic", "High Roller"]'),
    ('user-003', 'AeroStrike', 'aerostrike@ultimatum.gg', 'user', 2980, 2, '["Sharpshooter", "Speed Demon"]'),
    ('user-004', 'SpiceOverlord', 'spice@ultimatum.gg', 'user', 1840, 1, '["Taste Tester", "Kitchen Samurai"]');

-- 4. GAMES
INSERT INTO `games` (`id`, `slug`, `title`, `description`, `category`, `thumbnail_url`, `game_file_url`, `is_sponsored`, `sponsor_name`, `play_count`)
VALUES
    ('game-001', 'neon-asteroid-blitz', 'Neon Asteroid Blitz', 'High-octane retro arcade shooter. Pilot your neon starship through deep space debris, unleash laser blasts, collect powerup crystals, and dominate the weekly global leaderboard.', 'arcade', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80', 'canvas://neon-asteroid-blitz', 1, 'Razer Gaming Gear', 34820),
    ('game-002', 'cyber-slicer-2099', 'Cyber Slicer 2099', 'Fast-paced rhythmic reflex slicer. Cut glowing energy nodes before they breach your firewall perimeter in this futuristic synthwave challenge.', 'action', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80', 'canvas://cyber-slicer', 0, NULL, 22150),
    ('game-003', 'pixel-kitchen-rush', 'Pixel Kitchen Rush', 'Frenetic 2D culinary rush! Juggle gourmet orders, chop ingredients, flip steaks, and satisfy demanding VIP food critics before the timer expires.', 'puzzle', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', 'canvas://pixel-kitchen', 1, 'Hestan Masterware', 18940),
    ('game-004', 'dungeon-loot-dash', 'Dungeon Loot Dash', 'Classic 8-bit endless runner. Dodge lava traps, jump over spike barriers, and stack legendary gold chests to redeem exclusive profile badges.', 'retro', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80', 'canvas://dungeon-loot', 0, NULL, 14780),
    ('game-005', 'sabotage-circuit', 'Sabotage Circuit', '5-Player Asynchronous Deception & Crisis Management Simulator. 4 Engineers must maintain Core Integrity while 1 secretly assigned Saboteur triggers cascading failures across 6 interconnected power and logic sectors.', 'action', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', 'canvas://sabotage-circuit', 1, 'CyberCore Industries', 28940),
    ('game-006', 'the-architect-and-the-rats', 'The Architect & The Rats', '1v4 Asymmetrical Maze Deception & Escape Arena. 1-2 Architects forge a deadly labyrinth of spikes, decoys, and trigger traps while Rats navigate through fog of war to find the True Gold Exit before time runs out.', 'retro', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80', 'canvas://the-architect-and-the-rats', 1, 'RetroGrid Labs', 31250);

-- 5. RECIPES
INSERT INTO `recipes` (`id`, `slug`, `title`, `description`, `hero_image_url`, `prep_time`, `cook_time`, `servings`, `calories`, `category`, `dietary_tags`, `ingredients`, `instructions`, `nutrition`, `rating`, `rating_count`, `author`)
VALUES
    ('rec-001', 'signature-italian-baked-ziti', 'Signature Italian Baked Ziti with Crispy Basil & Whipped Ricotta', 'An irresistible comfort classic featuring al dente ziti folded into a slow-simmered San Marzano tomato-basil ragù, layered with creamy whipped whole-milk ricotta, and finished under the broiler with crispy golden mozzarella.', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80', 25, 40, 6, 580, 'Pasta & Italian', '["Comfort Food", "Vegetarian Optional", "Crowd Pleaser"]',
    '[{"item": "Ziti or Rigatoni Pasta", "amount": 16, "unit": "oz", "notes": "Cooked 2 mins shy of al dente"}, {"item": "San Marzano Crushed Tomatoes", "amount": 28, "unit": "oz can", "notes": "D.O.P certified"}, {"item": "Whole Milk Ricotta Cheese", "amount": 15, "unit": "oz", "notes": "Whipped with lemon zest"}, {"item": "Fresh Low-Moisture Mozzarella", "amount": 12, "unit": "oz", "notes": "Grated coarsely"}, {"item": "Aged Parmigiano-Reggiano", "amount": 1, "unit": "cup", "notes": "Freshly microplaned"}, {"item": "Extra Virgin Olive Oil", "amount": 3, "unit": "tbsp"}, {"item": "Garlic Cloves", "amount": 5, "unit": "cloves", "notes": "Thinly slivered"}, {"item": "Fresh Genovese Basil Leaves", "amount": 1, "unit": "bunch", "notes": "Torn + fried for garnish"}, {"item": "Crushed Red Pepper Flakes", "amount": 0.5, "unit": "tsp"}, {"item": "Kosher Salt & Fresh Black Pepper", "amount": 1, "unit": "tsp", "notes": "To taste"}]',
    '[{"step": 1, "title": "Par-Cook the Pasta", "instruction": "Bring 4 quarts of heavily salted water to a rolling boil. Drop the ziti and cook for precisely 8 minutes (it should still have a firm center). Drain and toss with 1 tbsp olive oil to prevent sticking."}, {"step": 2, "title": "Simmer the San Marzano Pomodoro", "instruction": "In a heavy Dutch oven, warm 2 tbsp olive oil over medium-low heat. Add slivered garlic and red pepper flakes. Sauté for 90 seconds until fragrant and golden (do not brown). Pour in crushed tomatoes, season with salt and pepper, and simmer for 15 minutes."}, {"step": 3, "title": "Whip the Herb Ricotta", "instruction": "In a medium bowl, whisk together whole milk ricotta, half the grated Parmigiano-Reggiano, fresh cracked black pepper, a pinch of lemon zest, and half of the torn basil until light, fluffy, and cloud-like."}, {"step": 4, "title": "Layer and Assemble", "instruction": "Toss the par-cooked ziti directly into the tomato sauce. Spread half of the pasta mixture into a 9x13-inch baking dish. Dollop generous spoonfuls of the whipped ricotta across the surface. Top with remaining pasta, then blanket completely with shredded mozzarella and remaining Parmigiano."}, {"step": 5, "title": "Bake to Golden Perfection", "instruction": "Bake at 400°F (200°C) for 25 minutes until bubbling vigorously around the edges. Switch the oven to high broil for 3-4 minutes until deep golden brown blister spots form on top. Rest for 10 minutes, garnish with flash-fried basil leaves, and serve."}]',
    '{"calories": 580, "protein": "32g", "carbs": "68g", "fat": "21g", "fiber": "5g"}', 4.9, 342, 'Chef Marco Bellini'),

    ('rec-002', 'triple-layer-chocolate-mocha-fudge-cake', 'Triple-Layer Chocolate Mocha Fudge Cake with Espresso Ganache', 'An ultra-decadent dessert featuring three tiers of dark cocoa sponge infused with freshly pulled espresso, layered with silky whipped dark chocolate fudge, and draped in a mirror-shine espresso ganache drip.', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80', 45, 35, 12, 620, 'Desserts & Baking', '["Vegetarian", "Indulgent", "Celebration"]',
    '[{"item": "Dutch Processed Dark Cocoa Powder", "amount": 1, "unit": "cup", "notes": "Sifted"}, {"item": "Fresh Hot Espresso / Strong Coffee", "amount": 1.5, "unit": "cups", "notes": "Freshly brewed"}, {"item": "All-Purpose Flour", "amount": 2.5, "unit": "cups"}, {"item": "Granulated Sugar", "amount": 2, "unit": "cups"}, {"item": "Buttermilk", "amount": 1, "unit": "cup", "notes": "Room temperature"}, {"item": "Vegetable or Avocado Oil", "amount": 0.75, "unit": "cup"}, {"item": "Large Eggs", "amount": 3, "unit": "whole", "notes": "Room temperature"}, {"item": "Pure Vanilla Bean Paste", "amount": 1.5, "unit": "tbsp"}, {"item": "Baking Powder & Baking Soda", "amount": 1.5, "unit": "tsp each"}, {"item": "70% Dark Bittersweet Chocolate", "amount": 14, "unit": "oz", "notes": "Finely chopped for ganache"}, {"item": "Heavy Whipping Cream", "amount": 1.5, "unit": "cups", "notes": "For ganache & frosting"}, {"item": "Flaky Maldon Sea Salt", "amount": 1, "unit": "tsp", "notes": "For finishing"}]',
    '[{"step": 1, "title": "Bloom Cocoa in Hot Espresso", "instruction": "In a heatproof bowl, whisk the dark cocoa powder directly into the piping-hot freshly pulled espresso. Let bloom for 5 minutes to activate deep chocolate aromatics."}, {"step": 2, "title": "Mix the Batter", "instruction": "Whisk dry ingredients in a large stand mixer bowl. In a separate pitcher, whisk buttermilk, oil, eggs, and vanilla. Pour wet mixture into dry, followed by the warm espresso-cocoa elixir on low speed until glossy."}, {"step": 3, "title": "Bake Three Sponge Rounds", "instruction": "Divide batter evenly between three 8-inch cake pans. Bake at 350°F (175°C) for 30-35 minutes until a toothpick comes out clean. Cool completely on wire racks."}, {"step": 4, "title": "Prepare Velvet Espresso Ganache", "instruction": "Heat heavy cream until simmering. Pour over chopped dark chocolate, let rest 3 minutes, then whisk from the center outward until smooth."}, {"step": 5, "title": "Stack, Frost, and Chill", "instruction": "Stack layers with whipped fudge filling. Pour luscious espresso ganache over top, letting dramatic drips cascade down the sides."}]',
    '{"calories": 620, "protein": "9g", "carbs": "74g", "fat": "34g", "fiber": "7g"}', 5.0, 512, 'Pastry Chef Elena Vance'),

    ('rec-003', 'crispy-garlic-butter-salmon-bowls', 'Crispy Garlic Butter Salmon Bowls with Avocado & Sticky Rice', 'Crisp, caramelized pan-seared salmon cubes glazed in a soy-garlic honey butter, served over warm jasmine rice with sliced avocado, pickled cucumbers, and spicy sriracha mayo.', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80', 15, 15, 4, 520, 'Seafood & Bowls', '["High Protein", "Gluten-Free Optional", "Quick Dinner"]',
    '[{"item": "Fresh Atlantic Salmon Fillet", "amount": 1.5, "unit": "lbs", "notes": "Cut into 1-inch bite-sized cubes"}, {"item": "Unsalted Grass-Fed Butter", "amount": 3, "unit": "tbsp"}, {"item": "Garlic Cloves", "amount": 4, "unit": "cloves", "notes": "Minced"}, {"item": "Low-Sodium Tamari / Soy Sauce", "amount": 2, "unit": "tbsp"}, {"item": "Wild Blossom Honey", "amount": 1.5, "unit": "tbsp"}, {"item": "Cooked Jasmine Rice", "amount": 3, "unit": "cups"}, {"item": "Ripe Haas Avocados", "amount": 2, "unit": "whole"}, {"item": "Persian Cucumbers", "amount": 2, "unit": "whole"}, {"item": "Toasted Sesame Oil & Seeds", "amount": 1, "unit": "tbsp"}, {"item": "Sriracha Mayo Drizzle", "amount": 2, "unit": "tbsp"}]',
    '[{"step": 1, "title": "Prep Salmon Cubes", "instruction": "Pat salmon cubes dry. Season with sea salt, black pepper, and garlic powder."}, {"step": 2, "title": "Pan-Sear for Golden Crust", "instruction": "Sear salmon in a hot cast-iron skillet for 2-3 minutes per side until golden and crispy."}, {"step": 3, "title": "Glaze with Garlic Butter", "instruction": "Add butter, garlic, soy sauce, and honey. Baste sizzling glaze over salmon for 60 seconds."}, {"step": 4, "title": "Assemble Nourishing Bowls", "instruction": "Divide warm jasmine rice into bowls. Top with glazed salmon, avocado, pickled cucumbers, and sriracha mayo."}]',
    '{"calories": 520, "protein": "42g", "carbs": "48g", "fat": "18g", "fiber": "4g"}', 4.8, 215, 'Chef Marco Bellini');

-- 6. REVIEWS
INSERT INTO `reviews` (`id`, `slug`, `product_name`, `category`, `rating`, `summary`, `verdict`, `pros`, `cons`, `specifications`, `affiliate_link`, `affiliate_retailer`, `hero_image_url`, `author`)
VALUES
    ('rev-001', 'apex-chrono-v2-modular-smartwatch', 'Apex Chrono V2 Modular Smartwatch', 'tech_hardware', 4.8, 'A revolutionary titanium-chassis smartwatch featuring swappable sensor modules, 14-day battery life, and an ultra-bright 2000-nit AMOLED display engineered for extreme gamers and outdoor adventurers.', 'The Apex Chrono V2 is undeniably the most versatile and durable wearable we have tested this year. The modular magnetic sensor system solves the upgrade dilemma, offering unmatched build quality.',
    '["Hot-swappable sensor modules (Heart rate, GPS, EMG muscle tracker)", "Astonishing 14-day real-world battery endurance", "Aircraft-grade Grade 5 Titanium bezel with sapphire crystal", "Ultra-responsive 120Hz 2000-nit AMOLED panel"]',
    '["Proprietary charging puck required", "Heavier on smaller wrists (68g without strap)", "Companion app setup takes 15 minutes"]',
    '{"Display": "1.43-inch AMOLED, 466x466 (2000 nits peak)", "Case Material": "Grade 5 Brushed Titanium & Ceramic Back", "Battery Capacity": "620 mAh (Up to 14 Days Normal Usage)", "Water Resistance": "10 ATM (100m Submersion Certified)", "Connectivity": "Bluetooth 5.4, Wi-Fi 6, Dual-Frequency Multi-GNSS", "Weight": "68 grams (Chassis only)", "OS Compatibility": "iOS 16+ & Android 12+", "MSRP": "$449.00 USD"}',
    'https://example.com/affiliate/apex-chrono-v2', 'Apex Official Store / Amazon Prime', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80', 'Alex Mercer (Hardware Lead)'),

    ('rev-002', 'tokyo-ramen-box-express-delivery', 'Tokyo Craft Ramen Express Kit (10-Bowl Artisanal Box)', 'food_lifestyle', 4.9, 'A flash-frozen Michelin-grade artisanal ramen delivery kit direct from Tokyo master kitchens, featuring 24-hour simmered Tonkotsu & Black Garlic broths, handmade alkaline noodles, and melt-in-your-mouth Chashu pork belly.', 'This is not instant ramen—it is bona fide restaurant broth delivered right to your doorstep. The freshness and depth of umami will ruin takeout ramen forever.',
    '["Gel-pack frozen rich broth pouches preserved without preservatives", "Incredible springy texture in the freshly extruded wavy noodles", "Includes authentic marinated ajitsuke tamago eggs & wood ear mushrooms", "Ready in under 8 minutes from freezer to table"]',
    '["Requires significant freezer storage space", "Higher shipping cost outside metropolitan delivery zones"]',
    '{"Portion Count": "10 Complete Bowls (5 Tonkotsu, 5 Spicy Miso)", "Shelf Life": "6 Months Frozen (-18°C)", "Prep Time": "8 Minutes (Boil & Combine)", "Included Toppings": "Torched Chashu, Seasoned Menma, Nori, Rayu Chili Oil", "Delivery Speed": "Overnight Insulated Dry Ice Express", "Price Per Bowl": "$12.90 ($129 Box Total)"}',
    'https://example.com/affiliate/tokyo-ramen-box', 'Tokyo Gourmet Direct', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80', 'Chef Marco Bellini');

-- 7. ARTICLES
INSERT INTO `articles` (`id`, `slug`, `title`, `subtitle`, `category`, `hero_image_url`, `gallery_images`, `content`, `tags`, `author`, `read_time`, `is_breaking`, `shoppable_items`)
VALUES
    ('art-001', 'cyberpunk-techwear-modular-shells-2026', 'Cyberpunk Techwear 2026: Rainproof Modular Shells, Magnetic Fidlock & Urban Stealth', 'From 3-layer Gore-Tex Pro membranes to hot-swappable magnetic cargo systems, we test the best technical apparel for digital nomads and gamers.', 'beauty_fashion', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80"]',
    '# The Convergence of Streetwear and Functional Ergonomics\n\nModern lifestyle fashion has evolved far beyond superficial branding. In 2026, Techwear combines military-grade water repellency, magnetic quick-release fasteners, and breathable membranes engineered for maximum mobility.\n\n### Key Materials & Thermal Profiling\n- Gore-Tex Pro 3-Layer Laminate: Offers unmatched 28,000mm hydrostatic head water resistance while allowing vapor sweat perspiration to escape freely.\n- Fidlock V-Buckle Fasteners: German-engineered neodymium magnetic closures that snap shut automatically under high tension.\n- Schoeller Dryskin 4-Way Stretch: Abrasion-resistant ballistic nylon blend that repels street grime and rain splatters.',
    '["Techwear", "Modular Fashion", "Streetwear", "Apparel Teardown"]', 'Elena Vance (Style & Materials Architect)', 6, 0,
    '[{"name": "AcroPulse Modular Storm Shell J1", "brand": "AcroPulse Design Labs", "price": "$480.00", "affiliate_url": "https://example.com/shop/acropulse-shell", "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80"}, {"name": "Fidlock Magnetic Utility Rig V2", "brand": "Fidlock Hardware", "price": "$120.00", "affiliate_url": "https://example.com/shop/fidlock-rig", "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80"}]'),

    ('art-002', 'gamer-skincare-blue-light-barrier-science', 'Blue Light Barrier Science: Active Peptides, Ceramides & Skincare for High-Screen Demographics', '10+ hours in front of OLED monitors causes oxidative barrier fatigue. Here is the scientific dermatological protocol to restore hydration and collagen integrity.', 'beauty_fashion', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80"]',
    '# Understanding High-Energy Visible (HEV) Blue Light Skin Stress\n\nProlonged exposure to 400-500nm high-energy visible light from monitors and mobile displays produces reactive oxygen species (ROS) that degrade skin elastin and barrier lipids.\n\n### The 3-Step Evidence-Based Routine\n1. Copper Tripeptide-1 Serum (GHK-Cu): Stimulates dermal matrix synthesis and soothes inflammation.\n2. 5-Ceramide NP Complex Moisturizer: Rebuilds intercellular lipid mortar, locking in 98% of trans-epidermal water.\n3. Ectoin & Lutein Antioxidant Mist: Shields cellular structures from screen oxidation.',
    '["Skincare Science", "Dermatology", "Blue Light Protection", "Grooming"]', 'Dr. Sarah Lin (Dermatological Chemistry)', 5, 0,
    '[{"name": "GHK-Cu Pure Copper Peptide Serum", "brand": "BioCellular Labs", "price": "$68.00", "affiliate_url": "https://example.com/shop/copper-peptide", "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80"}]'),

    ('art-003', 'next-gen-portable-handhelds-oled-showdown', 'Next-Gen Portable Handhelds: APU Thermal Benchmarks & 144Hz OLED Showdown', 'We put the latest Zen 5 handheld compute blades through 200 hours of frame-time testing, battery curve profiling, and VRR latency benchmarks.', 'gaming_news', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=800&q=80"]',
    '# The Handheld Renaissance: Zen 5 RDNA 3.5 Silicon Analyzed\n\nPortable PC gaming has reached a historic inflection point. With 15W TDP envelopes now capable of sustained 1080p 60FPS gaming in AAA titles, the hardware engineering inside modern handhelds is astonishing.',
    '["Gaming News", "Handhelds", "Hardware Benchmarks", "OLED"]', 'Alex Mercer (Hardware Lead)', 7, 1, '[]'),

    ('art-004', 'ultimatum-summer-championship-2026-announcement', 'Ultimatum Summer Arcade Championship 2026: $10,000 Prize Pool & Double XP Announced', 'Six weeks of global weekly reset leaderboards, sponsored gear bounties from Razer and Anker, and limited-edition profile badges.', 'news_editorial', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
    '[]',
    '# The Biggest Web Arcade Tournament in Platform History\n\nStarting this weekend, The Arcade will host the official 2026 Summer Tournament.\n\n### Tournament Highlights\n- Weekly Score Resets: Resetting every Sunday midnight UTC.\n- Anti-Cheat Verification: Real-time score validation.\n- Engagement XP Multipliers: Earn 2x XP for all high-score submissions!',
    '["Tournaments", "Double XP", "Esports", "Community"]', 'Devon Wright (Arcade Lead)', 4, 1, '[]');

-- 8. SPONSORS
INSERT INTO `sponsors` (`id`, `sponsor_name`, `image_url`, `destination_url`, `slot_position`, `impressions_tracked`, `clicks_tracked`, `is_active`)
VALUES
    ('sp-001', 'Razer Blade Pro Series', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80', 'https://example.com/sponsor/razer', 'header_banner', 48200, 2840, 1),
    ('sp-002', 'Hestan NanoBond Master Cookware', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80', 'https://example.com/sponsor/hestan', 'sidebar', 31400, 1620, 1),
    ('sp-003', 'Anker Prime GaN Fast Chargers', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80', 'https://example.com/sponsor/anker', 'in_content', 64100, 4290, 1),
    ('sp-004', 'NordVPN Cyber Security', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80', 'https://example.com/sponsor/nordvpn', 'footer', 18900, 940, 1);

-- 9. CUSTOM PAGES
INSERT INTO `pages` (`id`, `slug`, `title`, `subtitle`, `content`, `meta_description`, `show_in_nav`, `show_in_footer`, `enable_ads`)
VALUES
    ('page-001', 'summer-championship-2026', 'Ultimatum Summer Arcade Championship 2026', 'Compete for $10,000 in gear prizes, exclusive limited-edition gamer badges, and global bragging rights.',
    '# Welcome to the Summer 2026 Arcade Championship!\n\nGet ready for 6 weeks of intense high-score competition across The Arcade.\n\n### Tournament Rules & Mechanics\n1. Weekly Leaderboard Resets: Every Sunday at midnight UTC, the top 10 players on Neon Asteroid Blitz receive tournament bonus tokens.\n2. Double Engagement Points: Earn 2x XP for every 1,000 points scored in canvas games during tournament hours.\n3. Anti-Cheat Verification: All scores are monitored in real-time by our Admin Moderation engine.',
    'Join the Ultimatum Summer 2026 Arcade Tournament! Play weekly retro games, score points, and win top tier sponsor gear.', 1, 1, 1);

-- 10. LEADERBOARDS
INSERT INTO `leaderboards` (`id`, `user_id`, `game_id`, `score`)
VALUES
    ('lb-001', 'user-001', 'game-001', 18450),
    ('lb-002', 'user-002', 'game-001', 15200),
    ('lb-003', 'user-003', 'game-001', 12900),
    ('lb-005', 'user-003', 'game-002', 24800),
    ('lb-006', 'user-001', 'game-002', 19500),
    ('lb-007', 'user-004', 'game-003', 9600),
    ('lb-008', 'user-002', 'game-003', 7850),
    ('lb-009', 'user-001', 'game-004', 14200),
    ('lb-010', 'user-003', 'game-004', 11900);

-- 11. SITE SETTINGS
INSERT INTO `site_settings` (`key`, `value`)
VALUES ('main_settings', '{"announcement": {"enabled": true, "text": "🔥 ULTIMATUM ARCADE TOURNAMENT: Double XP Weekend is LIVE! Play & Claim Badges", "link": "/games"}, "monetization": {"ads_enabled": true, "header_ad": true, "sidebar_ad": true, "in_content_ad": true, "sticky_footer_ad": true, "rewarded_ads": true}, "maintenance_mode": false}');

-- 12. Re-enable Foreign Key Checks
SET FOREIGN_KEY_CHECKS = 1;
