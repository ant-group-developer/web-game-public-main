import 'server-only';
import type { SiteConfig } from '@/types/site';

/**
 * Tên web, logo, favicon, SEO trang chủ — lấy từ API, cache theo tag `site-config`
 * (admin lưu cấu hình → API gọi /api/revalidate với tag này → mọi trang cập nhật).
 * Khác với game: layout cần cấu hình cho MỌI trang, nên API lỗi thì dùng giá trị mặc định thay vì ném lỗi.
 */
const API_BASE = (process.env.API_INTERNAL_URL || 'http://localhost:3000').replace(/\/+$/, '');
const REVALIDATE_SECONDS = 300;
const TIMEOUT_MS = 5000;

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  general: {
    siteName: 'ANT Play',
    tagline: { vi: 'Chơi game online miễn phí', en: 'Free online games' },
    footerText: { vi: '', en: '' },
  },
  branding: {
    logoUrl: '/brand/logo128.png',
    faviconUrl: '/brand/logo128.png',
    appleTouchIconUrl: '',
    ogImageUrl: '/seo/ant-play-og.jpg',
    themeColor: '#111219',
  },
  seo: {
    homeTitle: { vi: 'ANT Play — Chơi game online miễn phí', en: 'ANT Play — Free online games' },
    homeDescription: {
      vi: 'Chơi game online miễn phí ngay trên trình duyệt. Không cần tải, không cần đăng ký.',
      en: 'Play free online games right in your browser. No download, no sign-up.',
    },
    keywords: [],
    gameTitleSuffix: { vi: ' — Chơi online miễn phí', en: ' — Play free online' },
  },
};

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/site-config`, {
      next: { tags: ['site-config'], revalidate: REVALIDATE_SECONDS },
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`site-config responded ${res.status}`);
    const body = (await res.json()) as { success: boolean; data: SiteConfig };
    if (!body?.success || !body.data?.general) throw new Error('site-config: unexpected body');
    return body.data;
  } catch (error) {
    console.warn('[site-config] dùng cấu hình mặc định:', String(error));
    return DEFAULT_SITE_CONFIG;
  }
}
