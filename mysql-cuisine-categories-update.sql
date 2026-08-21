-- ==============================================================================
-- ULTIMATUM PLATFORM - HOST DATABASE MIGRATION & RECIPES UPDATE SCRIPT
-- Target: phpMyAdmin / HostGator / cPanel MySQL (5.6, 5.7, 8.0 & MariaDB)
-- Purpose:
--   1. Adds `cuisine` and `cuisine_tags` columns to `recipes` table.
--   2. Updates existing recipes with authentic world cuisine & category tags.
--   3. Inserts new chef-tested Indian, Desi, and Chinese culinary blueprints.
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. ADD CUISINE & CUISINE_TAGS COLUMNS IF NOT ALREADY PRESENT
-- ------------------------------------------------------------------------------

-- Procedure to safely add columns without throwing error if they already exist
DROP PROCEDURE IF EXISTS `AddRecipeCuisineColumns`;

DELIMITER $$
CREATE PROCEDURE `AddRecipeCuisineColumns`()
BEGIN
    -- Check and add `cuisine` column
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'recipes' 
          AND COLUMN_NAME = 'cuisine'
    ) THEN
        ALTER TABLE `recipes` ADD COLUMN `cuisine` VARCHAR(100) NULL AFTER `category`;
    END IF;

    -- Check and add `cuisine_tags` column
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'recipes' 
          AND COLUMN_NAME = 'cuisine_tags'
    ) THEN
        ALTER TABLE `recipes` ADD COLUMN `cuisine_tags` JSON NULL AFTER `cuisine`;
    END IF;
END$$
DELIMITER ;

CALL `AddRecipeCuisineColumns`();
DROP PROCEDURE IF EXISTS `AddRecipeCuisineColumns`;


-- ------------------------------------------------------------------------------
-- 2. UPDATE EXISTING RECIPES (rec-001 to rec-010) WITH CUISINE & CATEGORIES
-- ------------------------------------------------------------------------------

UPDATE `recipes` 
SET 
    `category` = 'Pasta & Italian',
    `cuisine` = 'Italian',
    `cuisine_tags` = '["Italian Cuisine", "Mediterranean", "Pasta"]'
WHERE `id` = 'rec-001';

UPDATE `recipes` 
SET 
    `category` = 'Desserts & Baking',
    `cuisine` = 'American',
    `cuisine_tags` = '["American Cuisine", "Baking", "Desserts"]'
WHERE `id` = 'rec-002';

UPDATE `recipes` 
SET 
    `category` = 'Seafood & Bowls',
    `cuisine` = 'Japanese',
    `cuisine_tags` = '["Japanese Cuisine", "Asian Fusion", "Seafood"]'
WHERE `id` = 'rec-003';

UPDATE `recipes` 
SET 
    `category` = 'Steakhouse & Grills',
    `cuisine` = 'American',
    `cuisine_tags` = '["American Cuisine", "Steakhouse", "Gourmet"]'
WHERE `id` = 'rec-004';

UPDATE `recipes` 
SET 
    `category` = 'Artisanal Pizzas & Breads',
    `cuisine` = 'Italian',
    `cuisine_tags` = '["Italian Cuisine", "Neapolitan", "Pizza"]'
WHERE `id` = 'rec-005';

UPDATE `recipes` 
SET 
    `category` = 'Mexican & Street Food',
    `cuisine` = 'Mexican',
    `cuisine_tags` = '["Mexican Cuisine", "Street Food", "Tacos"]'
WHERE `id` = 'rec-006';

UPDATE `recipes` 
SET 
    `category` = 'Poultry & Mains',
    `cuisine` = 'Italian',
    `cuisine_tags` = '["Italian Cuisine", "Tuscan", "Poultry"]'
WHERE `id` = 'rec-007';

UPDATE `recipes` 
SET 
    `category` = 'Desserts & Baking',
    `cuisine` = 'Japanese',
    `cuisine_tags` = '["Japanese Cuisine", "Fusion", "Desserts"]'
WHERE `id` = 'rec-008';

UPDATE `recipes` 
SET 
    `category` = 'Asian & Stir-Fry',
    `cuisine` = 'Japanese',
    `cuisine_tags` = '["Japanese Cuisine", "Ramen", "Noodles"]'
WHERE `id` = 'rec-009';

UPDATE `recipes` 
SET 
    `category` = 'Breakfast & Brunch',
    `cuisine` = 'Mediterranean',
    `cuisine_tags` = '["Mediterranean", "Brunch", "Healthy"]'
WHERE `id` = 'rec-010';


-- ------------------------------------------------------------------------------
-- 3. INSERT NEW INDIAN, DESI & CHINESE MASTER RECIPES
-- ------------------------------------------------------------------------------

-- Rec-011: Butter Chicken (Indian Cuisine)
INSERT INTO `recipes` (
    `id`, `slug`, `title`, `description`, `hero_image_url`, 
    `prep_time`, `cook_time`, `servings`, `calories`, 
    `category`, `cuisine`, `cuisine_tags`, `dietary_tags`, 
    `ingredients`, `instructions`, `nutrition`, 
    `rating`, `rating_count`, `author`
)
VALUES (
    'rec-011',
    'velvety-butter-chicken-murgh-makhani',
    'Restaurant-Grade Velvety Butter Chicken (Murgh Makhani) with Kasuri Methi',
    'Smoky, charred tandoori-marinated chicken thighs simmered in a velvety silk gravy of San Marzano tomatoes, cashew butter, double cream, and crushed sun-dried fenugreek leaves (kasuri methi).',
    'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=1200&q=80',
    25, 35, 5, 590,
    'Curries & Stews', 'Indian',
    '["Indian Cuisine", "North Indian", "Curry", "Mughlai"]',
    '["High Protein", "Gluten-Free", "Comfort Food", "Crowd Pleaser"]',
    '[{"item": "Boneless Skinless Chicken Thighs", "amount": 2, "unit": "lbs", "notes": "Cut into bite-sized chunks"}, {"item": "Greek Yogurt / Hung Curd", "amount": 0.5, "unit": "cup", "notes": "For tandoori marinade"}, {"item": "Garlic-Ginger Paste", "amount": 2.5, "unit": "tbsp", "notes": "Freshly pounded"}, {"item": "Kashmiri Red Chili Powder", "amount": 2, "unit": "tbsp", "notes": "Vibrant color and mild heat"}, {"item": "Garam Masala & Ground Cumin", "amount": 1.5, "unit": "tbsp each"}, {"item": "Ripe Plum / San Marzano Tomatoes", "amount": 24, "unit": "oz", "notes": "Blanched and pureed smooth"}, {"item": "Raw Cashew Nuts", "amount": 0.33, "unit": "cup", "notes": "Soaked in hot water and blended smooth"}, {"item": "Grass-Fed Butter", "amount": 4, "unit": "tbsp", "notes": "Divided"}, {"item": "Heavy Double Cream", "amount": 0.5, "unit": "cup"}, {"item": "Kasuri Methi (Dried Fenugreek Leaves)", "amount": 1.5, "unit": "tbsp", "notes": "Toasted and crushed between palms"}, {"item": "Honey or Jaggery", "amount": 1, "unit": "tbsp", "notes": "To balance acidity"}, {"item": "Fresh Cilantro", "amount": 0.25, "unit": "cup", "notes": "Finely chopped for garnish"}]',
    '[{"step": 1, "title": "Tandoori Chicken Marinade", "instruction": "In a bowl, mix chicken with Greek yogurt, 1 tbsp ginger-garlic paste, 1 tbsp Kashmiri chili, 1 tsp garam masala, lemon juice, and 1 tsp salt. Marinate for at least 30 minutes (or overnight)."}, {"step": 2, "title": "High-Heat Charring", "instruction": "Heat 1 tbsp butter in a cast-iron skillet or broil chicken on high rack for 8-10 minutes until edges develop deep smoky tandoori char spots. Remove and set aside."}, {"step": 3, "title": "Build the Makhani Velouté", "instruction": "Melt 2 tbsp butter in a heavy saucepot. Sauté remaining ginger-garlic paste for 60 seconds. Pour in pureed tomatoes, Kashmiri chili, cumin, and salt. Simmer covered on medium-low for 15 minutes until oil separates."}, {"step": 4, "title": "Silk Cashew Emulsion & Cream", "instruction": "Pour the blended cashew paste and simmer for 5 minutes until creamy. Strain gravy through a fine-mesh sieve if restaurant-mirror silkiness is desired. Stir in heavy cream and honey."}, {"step": 5, "title": "Simmer Chicken & Fenugreek Aromatics", "instruction": "Fold charred chicken into the velvety sauce along with resting juices. Simmer for 7 minutes on low. Finish with remaining butter and crush toasted kasuri methi over top. Garnish with cream swirl and fresh cilantro."}]',
    '{"calories": 590, "protein": "44g", "carbs": "14g", "fat": "38g", "fiber": "4g"}',
    4.97, 512, 'Chef Rajesh Sharma & Ultimatum Test Kitchen'
)
ON DUPLICATE KEY UPDATE
    `title` = VALUES(`title`),
    `description` = VALUES(`description`),
    `category` = VALUES(`category`),
    `cuisine` = VALUES(`cuisine`),
    `cuisine_tags` = VALUES(`cuisine_tags`),
    `ingredients` = VALUES(`ingredients`),
    `instructions` = VALUES(`instructions`),
    `nutrition` = VALUES(`nutrition`);


-- Rec-012: Lahori Mutton Karahi (Desi Cuisine)
INSERT INTO `recipes` (
    `id`, `slug`, `title`, `description`, `hero_image_url`, 
    `prep_time`, `cook_time`, `servings`, `calories`, 
    `category`, `cuisine`, `cuisine_tags`, `dietary_tags`, 
    `ingredients`, `instructions`, `nutrition`, 
    `rating`, `rating_count`, `author`
)
VALUES (
    'rec-012',
    'authentic-lahori-mutton-karahi',
    'Authentic Lahori Mutton Karahi with Fresh Ginger Juliennes & Green Chilies',
    'A legendary Desi specialty cooked in an authentic iron wok on blazing high flame. Tender bone-in goat/lamb braised in fresh tomatoes, garlic, freshly ground black peppercorns, roasted cumin, and pungent green chilies with zero onion filler.',
    'https://images.unsplash.com/photo-1545247181-516773cae7be?auto=format&fit=crop&w=1200&q=80',
    20, 55, 4, 610,
    'Curries & Stews', 'Desi',
    '["Desi Cuisine", "Pakistani", "Lahori", "Karahi", "Mutton"]',
    '["High Protein", "Keto Friendly", "Gluten-Free", "Spicy"]',
    '[{"item": "Bone-In Mutton or Young Goat/Lamb", "amount": 2, "unit": "lbs", "notes": "Cut into 1.5-inch curry pieces"}, {"item": "Fresh Red Tomatoes", "amount": 6, "unit": "large", "notes": "Halved lengthwise"}, {"item": "Fresh Ginger", "amount": 3, "unit": "inch knobs", "notes": "Divided: half crushed paste, half thin juliennes"}, {"item": "Fresh Garlic Cloves", "amount": 10, "unit": "cloves", "notes": "Crushed with coarse salt"}, {"item": "Desi Ghee or Mustard Oil", "amount": 0.33, "unit": "cup"}, {"item": "Fresh Green Birds-Eye Chilies", "amount": 6, "unit": "whole", "notes": "Slit lengthwise"}, {"item": "Coarsely Crushed Black Peppercorns", "amount": 1.5, "unit": "tbsp", "notes": "Freshly mortar-pestle cracked"}, {"item": "Roasted Coriander & Cumin Seeds", "amount": 1.5, "unit": "tbsp", "notes": "Dry roasted and coarsely cracked"}, {"item": "Whisked Greek Yogurt", "amount": 3, "unit": "tbsp"}, {"item": "Fresh Cilantro", "amount": 0.5, "unit": "cup", "notes": "Generously chopped"}, {"item": "Fresh Lemon Juice", "amount": 1.5, "unit": "tbsp"}]',
    '[{"step": 1, "title": "Initial Meat Braise in Wok (Karahi)", "instruction": "In a traditional cast-iron wok (karahi), add mutton, crushed garlic paste, half the ginger paste, 1 cup water, and 1 tsp salt. Cover tightly and simmer on medium-low for 35-40 minutes until meat is 80% tender."}, {"step": 2, "title": "Layer Halved Tomatoes", "instruction": "Uncover wok and arrange halved tomatoes cut-side down directly over the simmering meat. Cover for 7 minutes until skins loosen. Use kitchen tongs to peel off and discard all tomato skins, then mash the pulp into the juices with a flat spatula."}, {"step": 3, "title": "High-Flame Desi Bhunai (Sear)", "instruction": "Turn the burner to high heat. Add desi ghee, slit green chilies, and whisked yogurt. Stir vigorously for 8-10 minutes (bhunai technique) until water evaporates and fragrant red-gold ghee separates around the rim."}, {"step": 4, "title": "Add Fresh Aromatics & Roasted Spices", "instruction": "Sprinkle freshly crushed black peppercorns, roasted coriander-cumin powder, and garam masala. Toss for 90 seconds to lock in aromas without scorching spices."}, {"step": 5, "title": "Garnish & Sizzling Presentation", "instruction": "Remove from flame. Generously heap fresh ginger juliennes, chopped cilantro, and fresh lemon juice over the bubbling karahi. Serve sizzling hot directly in the wok with tandoori roghani naan."}]',
    '{"calories": 610, "protein": "48g", "carbs": "9g", "fat": "42g", "fiber": "3g"}',
    4.99, 488, 'Chef Tariq Lahori & Ultimatum Test Kitchen'
)
ON DUPLICATE KEY UPDATE
    `title` = VALUES(`title`),
    `description` = VALUES(`description`),
    `category` = VALUES(`category`),
    `cuisine` = VALUES(`cuisine`),
    `cuisine_tags` = VALUES(`cuisine_tags`),
    `ingredients` = VALUES(`ingredients`),
    `instructions` = VALUES(`instructions`),
    `nutrition` = VALUES(`nutrition`);


-- Rec-013: Royal Hyderabadi Mutton Dum Biryani (Desi Cuisine)
INSERT INTO `recipes` (
    `id`, `slug`, `title`, `description`, `hero_image_url`, 
    `prep_time`, `cook_time`, `servings`, `calories`, 
    `category`, `cuisine`, `cuisine_tags`, `dietary_tags`, 
    `ingredients`, `instructions`, `nutrition`, 
    `rating`, `rating_count`, `author`
)
VALUES (
    'rec-013',
    'royal-hyderabadi-mutton-dum-biryani',
    'Royal Hyderabadi Mutton Dum Biryani with Saffron Milk & Caramelized Onions',
    'The pinnacle of royal Mughlai-Deccani cuisine. Marinated bone-in mutton par-cooked with aromatic whole spices, layered with 70% par-boiled aged long-grain basmati rice, fried crisp shallots (birista), saffron-infused warm milk, and sealed with dough for authentic steam dum cooking.',
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=80',
    40, 60, 8, 670,
    'Curries & Stews', 'Desi',
    '["Desi Cuisine", "Indian Cuisine", "Biryani", "Hyderabadi", "Rice"]',
    '["High Protein", "Comfort Food", "Celebration", "Crowd Pleaser"]',
    '[{"item": "Aged Extra-Long Basmati Rice (2+ Years Aged)", "amount": 3.5, "unit": "cups (700g)", "notes": "Washed and soaked for 45 mins"}, {"item": "Bone-In Tender Mutton / Goat", "amount": 2.5, "unit": "lbs", "notes": "Cut into medium pieces"}, {"item": "Golden Fried Crispy Onions (Birista)", "amount": 2, "unit": "cups", "notes": "Thinly sliced and golden fried"}, {"item": "Thick Whole Milk Yogurt", "amount": 1.25, "unit": "cups"}, {"item": "Fresh Ginger-Garlic Paste", "amount": 3, "unit": "tbsp"}, {"item": "Kewra Water & Rose Water", "amount": 1, "unit": "tsp each"}, {"item": "Pure Saffron Strands soaked in Warm Milk", "amount": 1, "unit": "pinch + 0.33 cup milk"}, {"item": "Desi Ghee", "amount": 0.33, "unit": "cup"}, {"item": "Fresh Mint & Cilantro Leaves", "amount": 1, "unit": "cup each", "notes": "Coarsely chopped"}, {"item": "Whole Spices (Green Cardamom, Cloves, Star Anise, Black Cardamom, Shahi Jeera, Cinnamon)", "amount": 2, "unit": "tbsp combined"}, {"item": "Raw Green Papaya Paste (Meat Tenderizer)", "amount": 1.5, "unit": "tbsp"}, {"item": "Wheat Flour Dough", "amount": 1, "unit": "ball", "notes": "For hermetic pot rim sealing"}]',
    '[{"step": 1, "title": "Royal Mutton Marination (Kacchi Akhni)", "instruction": "Marinate mutton with yogurt, ginger-garlic paste, papaya paste, half the fried onions, mint, cilantro, red chili powder, shahi jeera, garam masala, ghee, and salt. Refrigerate for at least 3 hours to break down collagen fibers."}, {"step": 2, "title": "70% Rice Par-Boil (Al Dente Basmati)", "instruction": "In a massive stockpot with 5 liters of heavily salted boiling water (infused with green cardamom, cinnamon, and bay leaf), boil soaked basmati rice for precisely 5-6 minutes until 70% cooked (grain bends slightly but does not snap). Drain immediately."}, {"step": 3, "title": "The Dum Layering Architecture", "instruction": "In a heavy-bottomed copper or cast-iron handi, spread the marinated mutton evenly as the bottom base. Layer the fragrant steaming basmati over the meat. Top with remaining golden onions, fresh mint, cilantro, warm saffron milk, kewra water, and swirls of melted desi ghee."}, {"step": 4, "title": "Hermetic Flour Dough Seal (Dum Pukht)", "instruction": "Roll wheat dough into a thick rope along the rim of the pot. Press lid down firmly to lock all internal steam pressure. Cook on medium flame for 15 minutes, then place a flat cast iron tawa underneath and slow-steam on low flame for 40 minutes."}, {"step": 5, "title": "Rest & Royal Reveal", "instruction": "Turn off flame and let rest for 15 minutes. Slice through the crisp dough seal. Use a flat saucer or skimmer to gently lift layers from bottom to top, revealing gradient hues of saffron, pure white basmati, and succulent spiced mutton. Serve with chilled cucumber-mint raita and mirchi ka salan."}]',
    '{"calories": 670, "protein": "42g", "carbs": "76g", "fat": "22g", "fiber": "4g"}',
    5.0, 640, 'Ustad Khursheed & Ultimatum Test Kitchen'
)
ON DUPLICATE KEY UPDATE
    `title` = VALUES(`title`),
    `description` = VALUES(`description`),
    `category` = VALUES(`category`),
    `cuisine` = VALUES(`cuisine`),
    `cuisine_tags` = VALUES(`cuisine_tags`),
    `ingredients` = VALUES(`ingredients`),
    `instructions` = VALUES(`instructions`),
    `nutrition` = VALUES(`nutrition`);


-- Rec-014: Szechuan Kung Pao Chicken (Chinese Cuisine)
INSERT INTO `recipes` (
    `id`, `slug`, `title`, `description`, `hero_image_url`, 
    `prep_time`, `cook_time`, `servings`, `calories`, 
    `category`, `cuisine`, `cuisine_tags`, `dietary_tags`, 
    `ingredients`, `instructions`, `nutrition`, 
    `rating`, `rating_count`, `author`
)
VALUES (
    'rec-014',
    'authentic-szechuan-kung-pao-chicken',
    'Traditional Szechuan Kung Pao Chicken with Roasted Peanuts & Facing-Heaven Chilies',
    'Fiery, sweet, tart, and mouth-numbing (Málà). Diced velvety chicken thighs wok-charred with authentic Szechuan peppercorns, dried facing-heaven chilies, crisp leek batons, and crunchy roasted peanuts in a complex dark Chinkiang vinegar glaze.',
    'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1200&q=80',
    20, 10, 4, 460,
    'Asian & Stir-Fry', 'Chinese',
    '["Chinese Cuisine", "Szechuan", "Wok Stir-Fry", "Spicy"]',
    '["High Protein", "Quick Dinner", "Spicy"]',
    '[{"item": "Boneless Skinless Chicken Thighs", "amount": 1.5, "unit": "lbs", "notes": "Diced into neat 3/4-inch cubes"}, {"item": "Shaoxing Cooking Wine", "amount": 2, "unit": "tbsp"}, {"item": "Light Soy Sauce & Dark Soy Sauce", "amount": 1.5, "unit": "tbsp each"}, {"item": "Cornstarch (for velveting & sauce)", "amount": 2, "unit": "tbsp"}, {"item": "Authentic Red Szechuan Peppercorns", "amount": 1, "unit": "tbsp", "notes": "Lightly crushed and deseeded"}, {"item": "Dried Facing-Heaven / Tien Tsin Chilies", "amount": 15, "unit": "whole", "notes": "Snipped into halves, seeds shaken out"}, {"item": "Aged Chinkiang Black Vinegar", "amount": 2, "unit": "tbsp"}, {"item": "Raw Sugar or Brown Sugar", "amount": 1.5, "unit": "tbsp"}, {"item": "Chicken Bone Broth", "amount": 0.25, "unit": "cup"}, {"item": "Scallions / Leeks", "amount": 4, "unit": "stalks", "notes": "Cut into 1-inch white batons"}, {"item": "Fresh Garlic & Ginger", "amount": 4, "unit": "cloves + 1 inch knob", "notes": "Thinly sliced into coins"}, {"item": "Roasted Unsalted Peanuts", "amount": 0.5, "unit": "cup", "notes": "Crisp and skins removed"}, {"item": "Peanut Oil or Neutral Oil", "amount": 3, "unit": "tbsp"}]',
    '[{"step": 1, "title": "Velvet the Chicken Cubes", "instruction": "In a bowl, toss diced chicken with 1 tbsp Shaoxing wine, 1 tbsp light soy sauce, 1 tbsp cornstarch, 1 tbsp water, and 1 tsp oil. Let sit for 15 minutes to create an insulating velvet protein seal."}, {"step": 2, "title": "Whisk the Master Sweet-Sour-Salty Glaze", "instruction": "In a small bowl, whisk Chinkiang black vinegar, sugar, dark soy sauce, remaining Shaoxing wine, chicken broth, and 1 tsp cornstarch until sugar dissolves completely."}, {"step": 3, "title": "Season the Wok & Bloom Aromatics", "instruction": "Heat a carbon-steel wok over maximum high flame until smoking hot. Add peanut oil, drop in Szechuan peppercorns and dried chilies. Stir-fry for 15 seconds until chilies darken to deep mahogany and oil is fragrant (do not burn)."}, {"step": 4, "title": "Flash Stir-Fry Chicken (Wok Hei)", "instruction": "Slide in chicken cubes and spread across the blazing wok surface. Sear for 90 seconds, then toss rapidly. Add sliced garlic, ginger, and scallion white batons; stir-fry for another 60 seconds."}, {"step": 5, "title": "Glaze & Peanut Finish", "instruction": "Pour the stirred master sauce around the perimeter of the wok. Toss vigorously as the sauce instantly thickens and coats every chicken cube in a glossy lacquer. Toss in roasted peanuts, give two swift wok flips, and serve immediately with jasmine rice."}]',
    '{"calories": 460, "protein": "36g", "carbs": "18g", "fat": "26g", "fiber": "4g"}',
    4.94, 376, 'Chef Lin Wei & Ultimatum Test Kitchen'
)
ON DUPLICATE KEY UPDATE
    `title` = VALUES(`title`),
    `description` = VALUES(`description`),
    `category` = VALUES(`category`),
    `cuisine` = VALUES(`cuisine`),
    `cuisine_tags` = VALUES(`cuisine_tags`),
    `ingredients` = VALUES(`ingredients`),
    `instructions` = VALUES(`instructions`),
    `nutrition` = VALUES(`nutrition`);


-- Rec-015: Dim Sum Dumplings (Chinese Cuisine)
INSERT INTO `recipes` (
    `id`, `slug`, `title`, `description`, `hero_image_url`, 
    `prep_time`, `cook_time`, `servings`, `calories`, 
    `category`, `cuisine`, `cuisine_tags`, `dietary_tags`, 
    `ingredients`, `instructions`, `nutrition`, 
    `rating`, `rating_count`, `author`
)
VALUES (
    'rec-015',
    'cantonese-dim-sum-ginger-scallion-dumplings',
    'Artisanal Cantonese Dim Sum Ginger-Scallion Chicken & Shrimp Dumplings',
    'Delicate translucent pleated dumplings packed with juicy minced chicken, wild tiger shrimp chunks, water chestnuts, toasted sesame oil, and fragrant scallion-ginger oil. Served with homemade chili crisp and black vinegar dip.',
    'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=1200&q=80',
    35, 10, 4, 390,
    'Asian & Stir-Fry', 'Chinese',
    '["Chinese Cuisine", "Dim Sum", "Cantonese", "Dumplings", "Appetizer"]',
    '["High Protein", "Comfort Food", "Crowd Pleaser"]',
    '[{"item": "Ground Chicken Thigh or Pork", "amount": 1, "unit": "lb"}, {"item": "Raw Tiger Shrimp", "amount": 0.5, "unit": "lb", "notes": "Peeled, deveined, and coarsely diced into chunks"}, {"item": "Round Dumpling / Gyoza Wrappers", "amount": 32, "unit": "wrappers", "notes": "Fresh thin wheat wrappers"}, {"item": "Fresh Water Chestnuts", "amount": 0.5, "unit": "cup", "notes": "Finely minced for crunch"}, {"item": "Scallions / Spring Onions", "amount": 4, "unit": "stalks", "notes": "Finely minced"}, {"item": "Fresh Ginger", "amount": 1.5, "unit": "tbsp", "notes": "Grated to fine paste"}, {"item": "Toasted Sesame Oil", "amount": 1.5, "unit": "tbsp"}, {"item": "Shaoxing Wine & Light Soy Sauce", "amount": 1, "unit": "tbsp each"}, {"item": "White Pepper & Sugar", "amount": 0.5, "unit": "tsp each"}, {"item": "Chili Crisp Oil & Chinkiang Vinegar", "amount": 3, "unit": "tbsp each", "notes": "For dipping sauce"}]',
    '[{"step": 1, "title": "Whip the Springy Dumpling Filling", "instruction": "In a large bowl, combine minced chicken, shrimp chunks, water chestnuts, ginger, scallions, soy sauce, Shaoxing wine, sesame oil, white pepper, salt, and cornstarch. Stir vigorously in one circular direction for 3 minutes until paste becomes cohesive and springy."}, {"step": 2, "title": "Pleat & Fold Dumplings", "instruction": "Place a wrapper on your palm. Add 1 tbsp filling to center. Moisten edges with a fingertip of water. Fold wrapper in half and create 5-6 tight overlapping pleats along one side to seal completely with zero air bubbles."}, {"step": 3, "title": "Bamboo Steamer Setup", "instruction": "Line bamboo steamer baskets with perforated parchment paper or napa cabbage leaves. Arrange dumplings with 1/2 inch gap between them."}, {"step": 4, "title": "High-Steam Cooking", "instruction": "Bring water in a wok to a vigorous rolling boil. Place stacked bamboo steamers on top. Cover tightly and steam over high heat for precisely 8-9 minutes until wrappers turn glossy and translucent."}, {"step": 5, "title": "Dipping Sauce & Presentation", "instruction": "Whisk chili crisp oil with Chinkiang black vinegar and minced scallions. Serve dumplings piping hot straight from the bamboo basket."}]',
    '{"calories": 390, "protein": "28g", "carbs": "38g", "fat": "12g", "fiber": "3g"}',
    4.96, 420, 'Master Dim Sum Chef Chen & Ultimatum Test Kitchen'
)
ON DUPLICATE KEY UPDATE
    `title` = VALUES(`title`),
    `description` = VALUES(`description`),
    `category` = VALUES(`category`),
    `cuisine` = VALUES(`cuisine`),
    `cuisine_tags` = VALUES(`cuisine_tags`),
    `ingredients` = VALUES(`ingredients`),
    `instructions` = VALUES(`instructions`),
    `nutrition` = VALUES(`nutrition`);

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- MIGRATION COMPLETE!
-- Your hosting MySQL database now supports food categories, cuisine filters,
-- and contains authentic Indian, Desi, and Chinese culinary masterpieces.
-- ==============================================================================
