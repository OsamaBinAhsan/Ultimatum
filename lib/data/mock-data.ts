import { Game, Recipe, Review, Sponsor, CustomPage, SiteSettings, LeaderboardEntry, Profile, Article, Bookmark } from '@/lib/types';

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'user-001',
    username: 'PixelNinja',
    email: 'admin@ultimatum.gg',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    role: 'admin',
    points: 4850,
    daily_streak: 5,
    last_active_date: '2026-08-16',
    badges: ['Grand Champion', 'Arcade Master', 'Founding Chef', 'Super Admin'],
    created_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 'user-002',
    username: 'CyberGourmet',
    email: 'gamer@ultimatum.gg',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    role: 'user',
    points: 3420,
    daily_streak: 3,
    last_active_date: '2026-08-16',
    badges: ['Top Gun', 'Recipe Critic', 'High Roller'],
    created_at: '2026-02-01T10:30:00Z',
  },
  {
    id: 'user-003',
    username: 'AeroStrike',
    email: 'aerostrike@ultimatum.gg',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    role: 'user',
    points: 2980,
    daily_streak: 2,
    badges: ['Sharpshooter', 'Speed Demon'],
    created_at: '2026-02-10T14:15:00Z',
  },
  {
    id: 'user-004',
    username: 'SpiceOverlord',
    email: 'spice@ultimatum.gg',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    role: 'user',
    points: 1840,
    daily_streak: 1,
    badges: ['Taste Tester', 'Kitchen Samurai'],
    created_at: '2026-03-01T09:00:00Z',
  },
];

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-001',
    slug: 'cyberpunk-techwear-modular-shells-2026',
    title: 'Cyberpunk Techwear 2026: Rainproof Modular Shells, Magnetic Fidlock & Urban Stealth',
    subtitle: 'From 3-layer Gore-Tex Pro membranes to hot-swappable magnetic cargo systems, we test the best technical apparel for digital nomads and gamers.',
    category: 'beauty_fashion',
    hero_image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    ],
    content: `
# The Convergence of Streetwear and Functional Ergonomics

Modern lifestyle fashion has evolved far beyond superficial branding. In 2026, **Techwear** combines military-grade water repellency, magnetic quick-release fasteners, and breathable membranes engineered for maximum mobility.

### Key Materials & Thermal Profiling
- **Gore-Tex Pro 3-Layer Laminate**: Offers unmatched 28,000mm hydrostatic head water resistance while allowing vapor sweat perspiration to escape freely.
- **Fidlock V-Buckle Fasteners**: German-engineered neodymium magnetic closures that snap shut automatically under high tension.
- **Schoeller Dryskin 4-Way Stretch**: Abrasion-resistant ballistic nylon blend that repels street grime and rain splatters.

### Real-World Field Testing & Teardown
During our 30-day continuous urban monsoon test in Tokyo and Seattle, the modular magnetic jacket shell kept internal electronics (mechanical keyboard, portable power banks, camera lenses) 100% dry with zero condensation buildup.
    `,
    tags: ['Techwear', 'Modular Fashion', 'Streetwear', 'Apparel Teardown'],
    author: 'Elena Vance (Style & Materials Architect)',
    read_time: 6,
    shoppable_items: [
      {
        name: 'AcroPulse Modular Storm Shell J1',
        brand: 'AcroPulse Design Labs',
        price: '$480.00',
        affiliate_url: 'https://example.com/shop/acropulse-shell',
        image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Fidlock Magnetic Utility Rig V2',
        brand: 'Fidlock Hardware',
        price: '$120.00',
        affiliate_url: 'https://example.com/shop/fidlock-rig',
        image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Dryskin Tapered Cargo Pants',
        brand: 'Schoeller Urban',
        price: '$260.00',
        affiliate_url: 'https://example.com/shop/dryskin-cargo',
        image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=400&q=80',
      },
    ],
    published_at: '2026-03-01T12:00:00Z',
    created_at: '2026-03-01T12:00:00Z',
  },
  {
    id: 'art-002',
    slug: 'gamer-skincare-blue-light-barrier-science',
    title: 'Blue Light Barrier Science: Active Peptides, Ceramides & Skincare for High-Screen Demographics',
    subtitle: '10+ hours in front of OLED monitors causes oxidative barrier fatigue. Here is the scientific dermatological protocol to restore hydration and collagen integrity.',
    category: 'beauty_fashion',
    hero_image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    ],
    content: `
# Understanding High-Energy Visible (HEV) Blue Light Skin Stress

Prolonged exposure to 400-500nm high-energy visible light from monitors and mobile displays produces reactive oxygen species (ROS) that degrade skin elastin and barrier lipids.

### The 3-Step Evidence-Based Routine
1. **Copper Tripeptide-1 Serum (GHK-Cu)**: Stimulates dermal matrix synthesis and soothes inflammation caused by dry conditioned room air.
2. **5-Ceramide NP Complex Moisturizer**: Rebuilds the intercellular lipid mortar, locking in 98% of trans-epidermal water for 24 hours.
3. **Ectoin & Lutein Antioxidant Mist**: Shields cellular structures from screen oxidation without greasy residue.
    `,
    tags: ['Skincare Science', 'Dermatology', 'Blue Light Protection', 'Grooming'],
    author: 'Dr. Sarah Lin (Dermatological Chemistry)',
    read_time: 5,
    shoppable_items: [
      {
        name: 'GHK-Cu Pure Copper Peptide Serum',
        brand: 'BioCellular Labs',
        price: '$68.00',
        affiliate_url: 'https://example.com/shop/copper-peptide',
        image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Multi-Ceramide Barrier Recovery Balm',
        brand: 'DermaMatrix Pro',
        price: '$42.00',
        affiliate_url: 'https://example.com/shop/ceramide-balm',
        image_url: 'https://images.unsplash.com/photo-1608248597359-577742a03e1e?auto=format&fit=crop&w=400&q=80',
      },
    ],
    published_at: '2026-03-04T10:00:00Z',
    created_at: '2026-03-04T10:00:00Z',
  },
  {
    id: 'art-003',
    slug: 'next-gen-portable-handhelds-oled-showdown',
    title: 'Next-Gen Portable Handhelds: APU Thermal Benchmarks & 144Hz OLED Showdown',
    subtitle: 'We put the latest Zen 5 handheld compute blades through 200 hours of frame-time testing, battery curve profiling, and VRR latency benchmarks.',
    category: 'gaming_news',
    hero_image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=800&q=80',
    ],
    content: `
# The Handheld Renaissance: Zen 5 RDNA 3.5 Silicon Analyzed

Portable PC gaming has reached a historic inflection point. With 15W TDP envelopes now capable of sustained 1080p 60FPS gaming in AAA titles, the hardware engineering inside modern handhelds is astonishing.

### Thermal & Acoustic Benchmark Takeaways
- **Vapor Chamber Dissipation**: Liquid metal thermal interface material (TIM) dropped peak hot-spot temperatures from 88°C down to 69°C.
- **VRR OLED Panels**: 48Hz-144Hz Variable Refresh Rate eliminated tearing entirely in high-FPS retro canvas titles and emulation.
- **Battery Life Curves**: 80Wh battery cells yield 4.2 hours of heavy gameplay and up to 9 hours of retro arcade gaming.
    `,
    tags: ['Gaming News', 'Handhelds', 'Hardware Benchmarks', 'OLED'],
    author: 'Alex Mercer (Hardware Lead)',
    read_time: 7,
    is_breaking: true,
    published_at: '2026-03-06T15:00:00Z',
    created_at: '2026-03-06T15:00:00Z',
  },
  {
    id: 'art-004',
    slug: 'ultimatum-summer-championship-2026-announcement',
    title: 'Ultimatum Summer Arcade Championship 2026: $10,000 Prize Pool & Double XP Announced',
    subtitle: 'Six weeks of global weekly reset leaderboards, sponsored gear bounties from Razer and Anker, and limited-edition profile badges.',
    category: 'news_editorial',
    hero_image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
    content: `
# The Biggest Web Arcade Tournament in Platform History

Starting this weekend, **The Arcade** will host the official 2026 Summer Tournament.

### Tournament Highlights
- **Weekly Score Resets**: Resetting every Sunday midnight UTC.
- **Anti-Cheat Verification**: Real-time score validation via Supabase RPC procedures.
- **Engagement XP Multipliers**: Earn 2x XP for all high-score submissions and reading time!
    `,
    tags: ['Tournaments', 'Double XP', 'Esports', 'Community'],
    author: 'Devon Wright (Arcade Lead)',
    read_time: 4,
    is_breaking: true,
    published_at: '2026-03-07T09:00:00Z',
    created_at: '2026-03-07T09:00:00Z',
  },
];

export const INITIAL_GAMES: Game[] = [
  {
    id: 'game-001',
    slug: 'neon-asteroid-blitz',
    title: 'Neon Asteroid Blitz',
    description: 'High-octane retro arcade shooter. Pilot your neon starship through deep space debris, unleash laser blasts, collect powerup crystals, and dominate the weekly global leaderboard.',
    category: 'arcade',
    thumbnail_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    game_file_url: 'canvas://neon-asteroid-blitz',
    is_sponsored: true,
    sponsor_name: 'Razer Gaming Gear',
    play_count: 34820,
    created_at: '2026-01-20T10:00:00Z',
  },
  {
    id: 'game-002',
    slug: 'cyber-slicer-2099',
    title: 'Cyber Slicer 2099',
    description: 'Fast-paced rhythmic reflex slicer. Cut glowing energy nodes before they breach your firewall perimeter in this futuristic synthwave challenge.',
    category: 'action',
    thumbnail_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    game_file_url: 'canvas://cyber-slicer',
    is_sponsored: false,
    play_count: 22150,
    created_at: '2026-02-05T12:00:00Z',
  },
  {
    id: 'game-003',
    slug: 'pixel-kitchen-rush',
    title: 'Pixel Kitchen Rush',
    description: 'Frenetic 2D culinary rush! Juggle gourmet orders, chop ingredients, flip steaks, and satisfy demanding VIP food critics before the timer expires.',
    category: 'puzzle',
    thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    game_file_url: 'canvas://pixel-kitchen',
    is_sponsored: true,
    sponsor_name: 'Hestan Masterware',
    play_count: 18940,
    created_at: '2026-02-18T15:00:00Z',
  },
  {
    id: 'game-004',
    slug: 'dungeon-loot-dash',
    title: 'Dungeon Loot Dash',
    description: 'Classic 8-bit endless runner. Dodge lava traps, jump over spike barriers, and stack legendary gold chests to redeem exclusive profile badges.',
    category: 'retro',
    thumbnail_url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
    game_file_url: 'canvas://dungeon-loot',
    is_sponsored: false,
    play_count: 14780,
    created_at: '2026-03-02T18:00:00Z',
  },
  {
    id: 'game-005',
    slug: 'sabotage-circuit',
    title: 'Sabotage Circuit',
    description: '5-Player Asynchronous Deception & Crisis Management Simulator. 4 Engineers must maintain Core Integrity while 1 secretly assigned Saboteur triggers cascading failures across 6 interconnected power and logic sectors.',
    category: 'action',
    thumbnail_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    game_file_url: 'canvas://sabotage-circuit',
    is_sponsored: true,
    sponsor_name: 'CyberCore Industries',
    play_count: 28940,
    created_at: '2026-03-10T16:00:00Z',
  },
  {
    id: 'game-006',
    slug: 'the-architect-and-the-rats',
    title: 'The Architect & The Rats',
    description: '1v4 Asymmetrical Maze Deception & Escape Arena. 1-2 Architects forge a deadly labyrinth of spikes, decoys, and trigger traps while Rats navigate through fog of war to find the True Gold Exit before time runs out.',
    category: 'retro',
    thumbnail_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    game_file_url: 'canvas://the-architect-and-the-rats',
    is_sponsored: true,
    sponsor_name: 'RetroGrid Labs',
    play_count: 31250,
    created_at: '2026-03-15T10:00:00Z',
  },
];

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  // Game 001 - Neon Asteroid Blitz
  {
    id: 'lb-001',
    user_id: 'user-001',
    game_id: 'game-001',
    score: 18450,
    week_timestamp: '2026-08-11T00:00:00Z',
    created_at: '2026-08-15T12:30:00Z',
    profile: {
      username: 'PixelNinja',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      badges: ['Grand Champion', 'Arcade Master'],
    },
  },
  {
    id: 'lb-002',
    user_id: 'user-002',
    game_id: 'game-001',
    score: 15200,
    week_timestamp: '2026-08-11T00:00:00Z',
    created_at: '2026-08-14T19:45:00Z',
    profile: {
      username: 'CyberGourmet',
      avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
      badges: ['Top Gun', 'High Roller'],
    },
  },
  {
    id: 'lb-003',
    user_id: 'user-003',
    game_id: 'game-001',
    score: 12900,
    week_timestamp: '2026-08-11T00:00:00Z',
    created_at: '2026-08-15T09:10:00Z',
    profile: {
      username: 'AeroStrike',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      badges: ['Sharpshooter'],
    },
  },

  // Game 002 - Cyber Slicer 2099
  {
    id: 'lb-005',
    user_id: 'user-003',
    game_id: 'game-002',
    score: 24800,
    week_timestamp: '2026-08-11T00:00:00Z',
    created_at: '2026-08-15T10:00:00Z',
    profile: {
      username: 'AeroStrike',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      badges: ['Katana Grandmaster'],
    },
  },
  {
    id: 'lb-006',
    user_id: 'user-001',
    game_id: 'game-002',
    score: 19500,
    week_timestamp: '2026-08-11T00:00:00Z',
    created_at: '2026-08-14T11:00:00Z',
    profile: {
      username: 'PixelNinja',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      badges: ['Cyber Samurai'],
    },
  },

  // Game 003 - Pixel Kitchen Rush
  {
    id: 'lb-007',
    user_id: 'user-004',
    game_id: 'game-003',
    score: 9600,
    week_timestamp: '2026-08-11T00:00:00Z',
    created_at: '2026-08-15T14:30:00Z',
    profile: {
      username: 'SpiceOverlord',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      badges: ['Michelin 3-Star'],
    },
  },
  {
    id: 'lb-008',
    user_id: 'user-002',
    game_id: 'game-003',
    score: 7850,
    week_timestamp: '2026-08-11T00:00:00Z',
    created_at: '2026-08-14T16:00:00Z',
    profile: {
      username: 'CyberGourmet',
      avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
      badges: ['Head Chef'],
    },
  },

  // Game 004 - Dungeon Loot Dash
  {
    id: 'lb-009',
    user_id: 'user-001',
    game_id: 'game-004',
    score: 14200,
    week_timestamp: '2026-08-11T00:00:00Z',
    created_at: '2026-08-15T18:00:00Z',
    profile: {
      username: 'PixelNinja',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      badges: ['Dungeon Master'],
    },
  },
  {
    id: 'lb-010',
    user_id: 'user-003',
    game_id: 'game-004',
    score: 11900,
    week_timestamp: '2026-08-11T00:00:00Z',
    created_at: '2026-08-14T20:00:00Z',
    profile: {
      username: 'AeroStrike',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      badges: ['Treasure Raider'],
    },
  },
  // Game 005 - Sabotage Circuit
  {
    id: 'lb-013',
    user_id: 'user-001',
    game_id: 'game-005',
    score: 9800,
    week_timestamp: '2026-08-11T00:00:00Z',
    created_at: '2026-08-15T16:00:00Z',
    profile: {
      username: 'PixelNinja',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      badges: ['Grand Champion', 'Circuit Master'],
    },
  },
  {
    id: 'lb-014',
    user_id: 'user-003',
    game_id: 'game-005',
    score: 8450,
    week_timestamp: '2026-08-11T00:00:00Z',
    created_at: '2026-08-14T20:15:00Z',
    profile: {
      username: 'AeroStrike',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      badges: ['Master Engineer'],
    },
  },
  // Game 006 - The Architect & The Rats
  {
    id: 'lb-015',
    user_id: 'user-001',
    game_id: 'game-006',
    score: 15000,
    week_timestamp: '2026-08-11T00:00:00Z',
    created_at: '2026-08-15T18:30:00Z',
    profile: {
      username: 'PixelNinja',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      badges: ['Maze Master', 'Grand Champion'],
    },
  },
  {
    id: 'lb-016',
    user_id: 'user-002',
    game_id: 'game-006',
    score: 12500,
    week_timestamp: '2026-08-11T00:00:00Z',
    created_at: '2026-08-14T21:00:00Z',
    profile: {
      username: 'CyberGourmet',
      avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
      badges: ['Rat Escape Artist'],
    },
  },
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec-001',
    slug: 'signature-italian-baked-ziti',
    title: 'Signature Italian Baked Ziti with Crispy Basil & Whipped Ricotta',
    description: 'An irresistible comfort classic featuring al dente ziti folded into a slow-simmered San Marzano tomato-basil ragù, layered with creamy whipped whole-milk ricotta, and finished under the broiler with crispy golden mozzarella.',
    hero_image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80',
    prep_time: 25,
    cook_time: 40,
    servings: 6,
    calories: 580,
    category: 'Pasta & Italian',
    dietary_tags: ['Comfort Food', 'Vegetarian Optional', 'Crowd Pleaser'],
    rating: 4.9,
    rating_count: 342,
    author: 'Chef Marco Bellini',
    nutrition: {
      calories: 580,
      protein: '32g',
      carbs: '68g',
      fat: '21g',
      fiber: '5g',
    },
    ingredients: [
      { item: 'Ziti or Rigatoni Pasta', amount: 16, unit: 'oz', notes: 'Cooked 2 mins shy of al dente' },
      { item: 'San Marzano Crushed Tomatoes', amount: 28, unit: 'oz can', notes: 'D.O.P certified' },
      { item: 'Whole Milk Ricotta Cheese', amount: 15, unit: 'oz', notes: 'Whipped with lemon zest' },
      { item: 'Fresh Low-Moisture Mozzarella', amount: 12, unit: 'oz', notes: 'Grated coarsely' },
      { item: 'Aged Parmigiano-Reggiano', amount: 1, unit: 'cup', notes: 'Freshly microplaned' },
      { item: 'Extra Virgin Olive Oil', amount: 3, unit: 'tbsp' },
      { item: 'Garlic Cloves', amount: 5, unit: 'cloves', notes: 'Thinly slivered' },
      { item: 'Fresh Genovese Basil Leaves', amount: 1, unit: 'bunch', notes: 'Torn + fried for garnish' },
      { item: 'Crushed Red Pepper Flakes', amount: 0.5, unit: 'tsp' },
      { item: 'Kosher Salt & Fresh Black Pepper', amount: 1, unit: 'tsp', notes: 'To taste' },
    ],
    instructions: [
      {
        step: 1,
        title: 'Par-Cook the Pasta',
        instruction: 'Bring 4 quarts of heavily salted water to a rolling boil. Drop the ziti and cook for precisely 8 minutes (it should still have a firm center). Drain and toss with 1 tbsp olive oil to prevent sticking.',
      },
      {
        step: 2,
        title: 'Simmer the San Marzano Pomodoro',
        instruction: 'In a heavy Dutch oven, warm 2 tbsp olive oil over medium-low heat. Add slivered garlic and red pepper flakes. Sauté for 90 seconds until fragrant and golden (do not brown). Pour in crushed tomatoes, season with salt and pepper, and simmer for 15 minutes.',
      },
      {
        step: 3,
        title: 'Whip the Herb Ricotta',
        instruction: 'In a medium bowl, whisk together whole milk ricotta, half the grated Parmigiano-Reggiano, fresh cracked black pepper, a pinch of lemon zest, and half of the torn basil until light, fluffy, and cloud-like.',
      },
      {
        step: 4,
        title: 'Layer and Assemble',
        instruction: 'Toss the par-cooked ziti directly into the tomato sauce. Spread half of the pasta mixture into a 9x13-inch baking dish. Dollop generous spoonfuls of the whipped ricotta across the surface. Top with remaining pasta, then blanket completely with shredded mozzarella and remaining Parmigiano.',
      },
      {
        step: 5,
        title: 'Bake to Golden Perfection',
        instruction: 'Bake at 400°F (200°C) for 25 minutes until bubbling vigorously around the edges. Switch the oven to high broil for 3-4 minutes until deep golden brown blister spots form on top. Rest for 10 minutes, garnish with flash-fried basil leaves, and serve.',
      },
    ],
    created_at: '2026-02-14T11:00:00Z',
  },
  {
    id: 'rec-002',
    slug: 'triple-layer-chocolate-mocha-fudge-cake',
    title: 'Triple-Layer Chocolate Mocha Fudge Cake with Espresso Ganache',
    description: 'An ultra-decadent dessert featuring three tiers of dark cocoa sponge infused with freshly pulled espresso, layered with silky whipped dark chocolate fudge, and draped in a mirror-shine espresso ganache drip.',
    hero_image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80',
    prep_time: 45,
    cook_time: 35,
    servings: 12,
    calories: 620,
    category: 'Desserts & Baking',
    dietary_tags: ['Vegetarian', 'Indulgent', 'Celebration'],
    rating: 5.0,
    rating_count: 512,
    author: 'Pastry Chef Elena Vance',
    nutrition: {
      calories: 620,
      protein: '9g',
      carbs: '74g',
      fat: '34g',
      fiber: '7g',
    },
    ingredients: [
      { item: 'Dutch Processed Dark Cocoa Powder', amount: 1, unit: 'cup', notes: 'Sifted' },
      { item: 'Fresh Hot Espresso / Strong Coffee', amount: 1.5, unit: 'cups', notes: 'Freshly brewed' },
      { item: 'All-Purpose Flour', amount: 2.5, unit: 'cups' },
      { item: 'Granulated Sugar', amount: 2, unit: 'cups' },
      { item: 'Buttermilk', amount: 1, unit: 'cup', notes: 'Room temperature' },
      { item: 'Vegetable or Avocado Oil', amount: 0.75, unit: 'cup' },
      { item: 'Large Eggs', amount: 3, unit: 'whole', notes: 'Room temperature' },
      { item: 'Pure Vanilla Bean Paste', amount: 1.5, unit: 'tbsp' },
      { item: 'Baking Powder & Baking Soda', amount: 1.5, unit: 'tsp each' },
      { item: '70% Dark Bittersweet Chocolate', amount: 14, unit: 'oz', notes: 'Finely chopped for ganache' },
      { item: 'Heavy Whipping Cream', amount: 1.5, unit: 'cups', notes: 'For ganache & frosting' },
      { item: 'Flaky Maldon Sea Salt', amount: 1, unit: 'tsp', notes: 'For finishing' },
    ],
    instructions: [
      {
        step: 1,
        title: 'Bloom Cocoa in Hot Espresso',
        instruction: 'In a heatproof bowl, whisk the dark cocoa powder directly into the piping-hot freshly pulled espresso. Let bloom for 5 minutes to activate deep chocolate aromatics.',
      },
      {
        step: 2,
        title: 'Mix the Batter',
        instruction: 'Whisk dry ingredients in a large stand mixer bowl. In a separate pitcher, whisk buttermilk, oil, eggs, and vanilla. Pour wet mixture into dry, followed by the warm espresso-cocoa elixir on low speed until glossy.',
      },
      {
        step: 3,
        title: 'Bake Three Sponge Rounds',
        instruction: 'Divide batter evenly between three 8-inch cake pans. Bake at 350°F (175°C) for 30-35 minutes until a toothpick comes out clean. Cool completely on wire racks.',
      },
      {
        step: 4,
        title: 'Prepare Velvet Espresso Ganache',
        instruction: 'Heat heavy cream until simmering. Pour over chopped dark chocolate, let rest 3 minutes, then whisk from the center outward until smooth.',
      },
      {
        step: 5,
        title: 'Stack, Frost, and Chill',
        instruction: 'Stack layers with whipped fudge filling. Pour luscious espresso ganache over top, letting dramatic drips cascade down the sides.',
      },
    ],
    created_at: '2026-02-22T14:00:00Z',
  },
  {
    id: 'rec-003',
    slug: 'crispy-garlic-butter-salmon-bowls',
    title: 'Crispy Garlic Butter Salmon Bowls with Avocado & Sticky Rice',
    description: 'Crisp, caramelized pan-seared salmon cubes glazed in a soy-garlic honey butter, served over warm jasmine rice with sliced avocado, pickled cucumbers, and spicy sriracha mayo.',
    hero_image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
    prep_time: 15,
    cook_time: 15,
    servings: 4,
    calories: 520,
    category: 'Seafood & Bowls',
    dietary_tags: ['High Protein', 'Gluten-Free Optional', 'Quick Dinner'],
    rating: 4.8,
    rating_count: 215,
    author: 'Chef Marco Bellini',
    nutrition: {
      calories: 520,
      protein: '42g',
      carbs: '48g',
      fat: '18g',
      fiber: '4g',
    },
    ingredients: [
      { item: 'Fresh Atlantic Salmon Fillet', amount: 1.5, unit: 'lbs', notes: 'Cut into 1-inch bite-sized cubes' },
      { item: 'Unsalted Grass-Fed Butter', amount: 3, unit: 'tbsp' },
      { item: 'Garlic Cloves', amount: 4, unit: 'cloves', notes: 'Minced' },
      { item: 'Low-Sodium Tamari / Soy Sauce', amount: 2, unit: 'tbsp' },
      { item: 'Wild Blossom Honey', amount: 1.5, unit: 'tbsp' },
      { item: 'Cooked Jasmine Rice', amount: 3, unit: 'cups' },
      { item: 'Ripe Haas Avocados', amount: 2, unit: 'whole' },
      { item: 'Persian Cucumbers', amount: 2, unit: 'whole' },
      { item: 'Toasted Sesame Oil & Seeds', amount: 1, unit: 'tbsp' },
      { item: 'Sriracha Mayo Drizzle', amount: 2, unit: 'tbsp' },
    ],
    instructions: [
      {
        step: 1,
        title: 'Prep Salmon Cubes',
        instruction: 'Pat salmon cubes dry. Season with sea salt, black pepper, and garlic powder.',
      },
      {
        step: 2,
        title: 'Pan-Sear for Golden Crust',
        instruction: 'Sear salmon in a hot cast-iron skillet for 2-3 minutes per side until golden and crispy.',
      },
      {
        step: 3,
        title: 'Glaze with Garlic Butter',
        instruction: 'Add butter, garlic, soy sauce, and honey. Baste sizzling glaze over salmon for 60 seconds.',
      },
      {
        step: 4,
        title: 'Assemble Nourishing Bowls',
        instruction: 'Divide warm jasmine rice into bowls. Top with glazed salmon, avocado, pickled cucumbers, and sriracha mayo.',
      },
    ],
    created_at: '2026-03-01T16:00:00Z',
  },
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-001',
    slug: 'apex-chrono-v2-modular-smartwatch',
    product_name: 'Apex Chrono V2 Modular Smartwatch',
    category: 'tech_hardware',
    rating: 4.8,
    summary: 'A revolutionary titanium-chassis smartwatch featuring swappable sensor modules, 14-day battery life, and an ultra-bright 2000-nit AMOLED display engineered for extreme gamers and outdoor adventurers.',
    verdict: 'The Apex Chrono V2 is undeniably the most versatile and durable wearable we have tested this year. The modular magnetic sensor system solves the upgrade dilemma, offering unmatched build quality.',
    pros: [
      'Hot-swappable sensor modules (Heart rate, GPS, EMG muscle tracker)',
      'Astonishing 14-day real-world battery endurance',
      'Aircraft-grade Grade 5 Titanium bezel with sapphire crystal',
      'Ultra-responsive 120Hz 2000-nit AMOLED panel',
    ],
    cons: [
      'Proprietary charging puck required',
      'Heavier on smaller wrists (68g without strap)',
      'Companion app setup takes 15 minutes',
    ],
    specifications: {
      'Display': '1.43-inch AMOLED, 466x466 (2000 nits peak)',
      'Case Material': 'Grade 5 Brushed Titanium & Ceramic Back',
      'Battery Capacity': '620 mAh (Up to 14 Days Normal Usage)',
      'Water Resistance': '10 ATM (100m Submersion Certified)',
      'Connectivity': 'Bluetooth 5.4, Wi-Fi 6, Dual-Frequency Multi-GNSS',
      'Weight': '68 grams (Chassis only)',
      'OS Compatibility': 'iOS 16+ & Android 12+',
      'MSRP': '$449.00 USD',
    },
    affiliate_link: 'https://example.com/affiliate/apex-chrono-v2',
    affiliate_retailer: 'Apex Official Store / Amazon Prime',
    hero_image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
    author: 'Alex Mercer (Hardware Lead)',
    created_at: '2026-02-18T10:00:00Z',
  },
  {
    id: 'rev-002',
    slug: 'tokyo-ramen-box-express-delivery',
    product_name: 'Tokyo Craft Ramen Express Kit (10-Bowl Artisanal Box)',
    category: 'food_lifestyle',
    rating: 4.9,
    summary: 'A flash-frozen Michelin-grade artisanal ramen delivery kit direct from Tokyo master kitchens, featuring 24-hour simmered Tonkotsu & Black Garlic broths, handmade alkaline noodles, and melt-in-your-mouth Chashu pork belly.',
    verdict: 'This is not instant ramen—it is bona fide restaurant broth delivered right to your doorstep. The freshness and depth of umami will ruin takeout ramen forever.',
    pros: [
      'Gel-pack frozen rich broth pouches preserved without preservatives',
      'Incredible springy texture in the freshly extruded wavy noodles',
      'Includes authentic marinated ajitsuke tamago eggs & wood ear mushrooms',
      'Ready in under 8 minutes from freezer to table',
    ],
    cons: [
      'Requires significant freezer storage space',
      'Higher shipping cost outside metropolitan delivery zones',
    ],
    specifications: {
      'Portion Count': '10 Complete Bowls (5 Tonkotsu, 5 Spicy Miso)',
      'Shelf Life': '6 Months Frozen (-18°C)',
      'Prep Time': '8 Minutes (Boil & Combine)',
      'Included Toppings': 'Torched Chashu, Seasoned Menma, Nori, Rayu Chili Oil',
      'Delivery Speed': 'Overnight Insulated Dry Ice Express',
      'Price Per Bowl': '$12.90 ($129 Box Total)',
    },
    affiliate_link: 'https://example.com/affiliate/tokyo-ramen-box',
    affiliate_retailer: 'Tokyo Gourmet Direct',
    hero_image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80',
    author: 'Chef Marco Bellini',
    created_at: '2026-03-03T11:00:00Z',
  },
];

export const INITIAL_SPONSORS: Sponsor[] = [
  {
    id: 'sp-001',
    sponsor_name: 'Razer Blade Pro Series',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    destination_url: 'https://example.com/sponsor/razer',
    slot_position: 'header_banner',
    impressions_tracked: 48200,
    clicks_tracked: 2840,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'sp-002',
    sponsor_name: 'Hestan NanoBond Master Cookware',
    image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80',
    destination_url: 'https://example.com/sponsor/hestan',
    slot_position: 'sidebar',
    impressions_tracked: 31400,
    clicks_tracked: 1620,
    is_active: true,
    created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'sp-003',
    sponsor_name: 'Anker Prime GaN Fast Chargers',
    image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
    destination_url: 'https://example.com/sponsor/anker',
    slot_position: 'in_content',
    impressions_tracked: 64100,
    clicks_tracked: 4290,
    is_active: true,
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'sp-004',
    sponsor_name: 'NordVPN Cyber Security',
    image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    destination_url: 'https://example.com/sponsor/nordvpn',
    slot_position: 'footer',
    impressions_tracked: 18900,
    clicks_tracked: 940,
    is_active: true,
    created_at: '2026-02-01T00:00:00Z',
  },
];

export const INITIAL_PAGES: CustomPage[] = [
  {
    id: 'page-001',
    slug: 'summer-championship-2026',
    title: 'Ultimatum Summer Arcade Championship 2026',
    subtitle: 'Compete for $10,000 in gear prizes, exclusive limited-edition gamer badges, and global bragging rights.',
    meta_description: 'Join the Ultimatum Summer 2026 Arcade Tournament! Play weekly retro games, score points, and win top tier sponsor gear.',
    show_in_nav: true,
    show_in_footer: true,
    enable_ads: true,
    content: `
# Welcome to the Summer 2026 Arcade Championship!

Get ready for 6 weeks of intense high-score competition across **The Arcade**.

### Tournament Rules & Mechanics
1. **Weekly Leaderboard Resets**: Every Sunday at midnight UTC, the top 10 players on Neon Asteroid Blitz receive tournament bonus tokens.
2. **Double Engagement Points**: Earn 2x XP for every 1,000 points scored in canvas games during tournament hours.
3. **Anti-Cheat Verification**: All scores are monitored in real-time by our Admin Moderation engine. Fraudulent score spoofing will result in immediate disqualification.
    `,
    created_at: '2026-02-15T00:00:00Z',
  },
];

export const INITIAL_SETTINGS: SiteSettings = {
  announcement: {
    enabled: true,
    text: '🔥 ULTIMATUM ARCADE TOURNAMENT: Double XP Weekend is LIVE! Play & Claim Badges',
    link: '/games',
  },
  monetization: {
    ads_enabled: true,
    header_ad: true,
    sidebar_ad: true,
    in_content_ad: true,
    sticky_footer_ad: true,
    rewarded_ads: true,
  },
  maintenance_mode: false,
};
