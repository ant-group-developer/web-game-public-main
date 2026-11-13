'use client';

import type { PlayerBadge } from '@/types/announcement';
import { ZOZO_API_BASE } from './config';
import { getSession } from './session';

/** Danh hiệu của người đang đăng nhập (`/me/badges`). Không có phiên → rỗng. */
export async function myBadges(): Promise<PlayerBadge[]> {
  const s = getSession();
  if (!s.state.player) return [];
  const token = await s.getToken().catch(() => null);
  if (!token) return [];
  const res = await fetch(`${ZOZO_API_BASE}/api/v1/me/badges`, { headers: { accept: 'application/json', authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!res.ok) return [];
  const body = (await res.json().catch(() => null)) as { data?: PlayerBadge[] } | null;
  return Array.isArray(body?.data) ? body.data : [];
}
