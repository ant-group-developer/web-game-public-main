'use client';

import type { Game } from '@/types/game';
import { useT } from '@/hooks/use-locale';
import { cn } from '@/helpers/tailwind';

export function GameBadge({ badge, inline = false }: { badge: NonNullable<Game['badge']>; inline?: boolean }) {
  const { t } = useT();
  return <span className={cn('badge', inline && 'badge-inline', badge === 'hot' && 'badge-hot')}>{t(badge === 'hot' ? 'badge.hot' : 'badge.new')}</span>;
}
