import 'server-only';
import type { Announcement, AnnouncementStatus } from '@/types/announcement';

/**
 * Sự kiện / giải đấu các game gửi lên (platform 07). Cache theo tag `announcements` — API gọi /api/revalidate
 * mỗi khi game cập nhật hoặc CMS ghim / ẩn; 60 s là lưới an toàn (đếm ngược, top 3 đổi liên tục).
 * Lỗi API → trả rỗng (dải sự kiện chỉ là phần phụ, không được làm hỏng trang chủ / trang game).
 */
const API_BASE = (process.env.API_INTERNAL_URL || 'http://localhost:3000').replace(/\/+$/, '');
const REVALIDATE_SECONDS = 60;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function getAnnouncements(opts: { status?: AnnouncementStatus[]; game?: string; limit?: number } = {}): Promise<Announcement[]> {
  const q = new URLSearchParams();
  if (opts.status?.length) q.set('status', opts.status.join(','));
  if (opts.game && SLUG.test(opts.game)) q.set('game', opts.game);
  if (opts.limit) q.set('limit', String(opts.limit));
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/announcements?${q}`, {
      next: { tags: ['announcements'], revalidate: REVALIDATE_SECONDS },
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { success?: boolean; data?: Announcement[] };
    return Array.isArray(body?.data) ? body.data : [];
  } catch (error) {
    if (process.env.NEXT_PHASE !== 'phase-production-build') console.warn(`[api] announcements lỗi: ${String(error)}`);
    return [];
  }
}
