import { Metadata } from 'next';
import { querySQLServer } from '@/lib/db/sqlserver';
import type { GameItem } from '@/lib/types';
import { CosmeticsShopClient } from './CosmeticsShopClient';

export const metadata: Metadata = {
  title: 'Digital Cosmetics & Skins Shop | Ultimatum Arcade',
  description:
    'Unlock limited-edition laser trails, retro ship hulls, golden spatulas, and animated badges with weekly tournament coins on Ultimatum.',
};

const FALLBACK_SEED_ITEMS: GameItem[] = [
  {
    id: 'item-001',
    game_id: 'neon-asteroid-blitz',
    name: 'Hyperdrive Cyan Hull',
    slug: 'neon-ship-hyperdrive',
    item_type: 'skin',
    price_coins: 350,
    asset_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: 'item-002',
    game_id: 'neon-asteroid-blitz',
    name: 'Plasma Overcharge Shield',
    slug: 'blitz-plasma-shield',
    item_type: 'powerup',
    price_coins: 150,
    asset_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: 'item-003',
    game_id: 'pixel-kitchen-rush',
    name: '24K Golden Spatula',
    slug: 'flame-grill-spatula-gold',
    item_type: 'skin',
    price_coins: 750,
    asset_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: 'item-004',
    game_id: 'cyber-slicer',
    name: 'Katana Crimson Plasma Blade',
    slug: 'cyber-katana-crimson',
    item_type: 'cosmetic',
    price_coins: 500,
    asset_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: 'item-005',
    game_id: 'dungeon-loot-dash',
    name: 'Obsidian Coin Magnet Ring',
    slug: 'obsidian-coin-magnet',
    item_type: 'powerup',
    price_coins: 300,
    asset_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: 'item-006',
    game_id: null,
    name: 'Grand Champion Hologram Frame',
    slug: 'grand-champion-frame',
    item_type: 'avatar_frame',
    price_coins: 1000,
    asset_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
];

export default async function CosmeticsShopPage() {
  let items: GameItem[] = [];

  try {
    const rows = await querySQLServer(
      'SELECT [id], [game_id], [name], [slug], [item_type], [price_coins], [asset_url], [is_active], [created_at] FROM [dbo].[game_items] WHERE [is_active] = 1 ORDER BY [price_coins] ASC'
    );
    if (rows && rows.length > 0) {
      items = rows as GameItem[];
    } else {
      items = FALLBACK_SEED_ITEMS;
    }
  } catch (err) {
    console.warn('[Cosmetics Shop Server Component] SQL query fallback to seed items:', err);
    items = FALLBACK_SEED_ITEMS;
  }

  return <CosmeticsShopClient initialItems={items} />;
}
