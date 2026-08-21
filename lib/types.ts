export type UserRole = 'user' | 'moderator' | 'admin';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  email?: string;
  role: UserRole;
  points: number;
  daily_streak: number;
  last_active_date?: string;
  vip_ad_lite_until?: string;
  badges: string[];
  is_banned?: boolean;
  created_at: string;
  updated_at?: string;
}

export type GameCategory = 'arcade' | 'action' | 'puzzle' | 'retro' | 'strategy';

export interface Game {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: GameCategory;
  thumbnail_url: string;
  game_file_url: string;
  is_sponsored: boolean;
  sponsor_name?: string;
  play_count: number;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  game_id: string;
  score: number;
  week_timestamp?: string;
  created_at: string;
  player_name?: string;
  avatar_url?: string;
  rank?: number;
  profile?: {
    username: string;
    avatar_url: string;
    badges?: string[];
  };
}

export interface RecipeIngredient {
  item: string;
  amount: number;
  unit: string;
  notes?: string;
}

export interface RecipeInstruction {
  step: number;
  title?: string;
  instruction: string;
}

export interface RecipeNutrition {
  calories?: number;
  protein?: string;
  carbs?: string;
  fat?: string;
  fiber?: string;
}

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  description: string;
  hero_image_url: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  calories: number;
  category: string;
  cuisine?: string;
  cuisine_tags?: string[];
  dietary_tags: string[];
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  nutrition?: RecipeNutrition;
  rating: number;
  rating_count: number;
  author: string;
  created_at: string;
}

export type ReviewCategory = 'tech_hardware' | 'food_lifestyle';

export interface Review {
  id: string;
  slug: string;
  product_name: string;
  category: ReviewCategory;
  rating: number;
  summary: string;
  verdict: string;
  pros: string[];
  cons: string[];
  specifications: Record<string, string | number>;
  affiliate_link?: string;
  affiliate_retailer?: string;
  hero_image_url: string;
  author: string;
  created_at: string;
}

export type ArticleCategory = 'beauty_fashion' | 'news_editorial' | 'gaming_news';

export interface ShoppableItem {
  name: string;
  brand: string;
  price: string;
  affiliate_url: string;
  image_url: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  category: ArticleCategory;
  hero_image_url: string;
  gallery_images?: string[];
  content: string;
  tags: string[];
  author: string;
  read_time: number; // minutes
  is_breaking?: boolean;
  shoppable_items?: ShoppableItem[];
  published_at: string;
  created_at: string;
}

export type AdSlotPosition = 'header_banner' | 'sidebar' | 'in_content' | 'footer' | 'rewarded_video';

export interface Sponsor {
  id: string;
  sponsor_name: string;
  image_url: string;
  destination_url: string;
  slot_position: AdSlotPosition;
  impressions_tracked: number;
  clicks_tracked: number;
  is_active: boolean;
  created_at: string;
}

export interface CustomPage {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  content: string;
  meta_description?: string;
  show_in_nav: boolean;
  show_in_footer: boolean;
  enable_ads: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  item_type: 'recipe' | 'review' | 'article' | 'game';
  item_id: string;
  item_title: string;
  item_slug: string;
  created_at: string;
}

export interface SiteSettings {
  announcement: {
    enabled: boolean;
    text: string;
    link: string;
  };
  monetization: {
    ads_enabled: boolean;
    header_ad: boolean;
    sidebar_ad: boolean;
    in_content_ad: boolean;
    sticky_footer_ad: boolean;
    rewarded_ads: boolean;
  };
  maintenance_mode?: boolean;
}
