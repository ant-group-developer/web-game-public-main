import { isTrustedOrigin } from '@/packages/zozo-sdk/src/core';

/**
 * `?returnTo=` an toàn: cùng origin → đường dẫn tương đối; `https://*.zozo.bio` (và http://localhost:* khi chạy local)
 * → URL đầy đủ; còn lại → '/'. Chỉ gọi trên trình duyệt.
 */
export function resolveReturnTo(raw: string | null | undefined): string {
  if (!raw) return '/';
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin === window.location.origin) {
      const path = url.pathname + url.search + url.hash;
      return path.startsWith('//') ? '/' : path;
    }
    if (isTrustedOrigin(url.origin, process.env.NODE_ENV !== 'production' || isLocalHost())) return url.toString();
  } catch { /* URL lỗi */ }
  return '/';
}

const isLocalHost = () => /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

/** Dev hoặc portal đang chạy trên localhost → chấp nhận origin http://localhost:* (game chạy local). */
export const allowLocalOrigins = () => process.env.NODE_ENV !== 'production' || isLocalHost();

/** returnTo dạng URL đầy đủ (cho Google redirect). */
export const absoluteReturnTo = (target: string) => new URL(target, window.location.origin).toString();

/** Chuyển tới returnTo: cùng origin dùng router, khác origin tải trang mới. */
export function goTo(target: string, replace: (href: string) => void) {
  if (target.startsWith('/')) replace(target);
  else window.location.assign(target);
}
