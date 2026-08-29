'use client';

import { useState, useEffect, useCallback } from 'react';
import { platformStore } from '@/lib/data/store';
import type { GameLoadout } from '@/lib/types';

export function useEquippedLoadout(userId?: string, gameSlug?: string): GameLoadout {
  const activeUser = platformStore.getCurrentUser();
  const targetUser = userId || activeUser?.id || 'user-001';

  const [loadout, setLoadout] = useState<GameLoadout>(() =>
    platformStore.getLoadout(targetUser, gameSlug)
  );

  const refreshLoadout = useCallback(() => {
    setLoadout(platformStore.getLoadout(targetUser, gameSlug));
  }, [targetUser, gameSlug]);

  useEffect(() => {
    refreshLoadout();

    const handleUpdate = () => refreshLoadout();
    window.addEventListener('loadout-updated', handleUpdate);
    window.addEventListener('inventory-updated', handleUpdate);
    window.addEventListener('balance-updated', handleUpdate);

    return () => {
      window.removeEventListener('loadout-updated', handleUpdate);
      window.removeEventListener('inventory-updated', handleUpdate);
      window.removeEventListener('balance-updated', handleUpdate);
    };
  }, [refreshLoadout]);

  return loadout;
}
