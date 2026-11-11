/**
 * Origin API ZOZO ID mà TRÌNH DUYỆT gọi (khác API_INTERNAL_URL là địa chỉ server Next.js gọi), không kèm /api/v1.
 * NEXT_PUBLIC_ → được nhúng vào JS lúc build: đổi thì phải build lại.
 */
export const ZOZO_API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.zozo.bio' : 'http://localhost:3000')
).replace(/\/+$/, '');
