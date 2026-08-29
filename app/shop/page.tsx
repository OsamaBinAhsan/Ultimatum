import { Metadata } from 'next';
import { querySQLServer } from '@/lib/db/sqlserver';
import { platformStore } from '@/lib/data/store';
import type { ShopItem } from '@/lib/types';
import { ShopClient } from './ShopClient';

export const metadata: Metadata = {
  title: 'Shop & Rewards Vault — Digital Cosmetics, Hardware Perks & Vouchers | Ultimatum',
  description:
    'Redeem tournament reward coins for in-game loadout gear, sponsored hardware discounts, single-use vouchers, and digital master guides on Ultimatum.',
};

export default async function ShopPage() {
  let items: ShopItem[] = [];

  try {
    const rows = await querySQLServer(
      'SELECT [id], [name], [slug], [description], [category], [target_game_id], [slot_type], [tier], [price_coins], [metadata_json], [stock_remaining], [is_active], [is_public], [created_at] FROM [dbo].[shop_items] WHERE [is_active] = 1 AND [is_public] = 1 ORDER BY [price_coins] ASC'
    );
    if (rows && rows.length > 0) {
      items = rows as ShopItem[];
    } else {
      items = platformStore.getShopItems({ isPublicOnly: true });
    }
  } catch (err) {
    items = platformStore.getShopItems({ isPublicOnly: true });
  }

  return <ShopClient initialItems={items} />;
}
