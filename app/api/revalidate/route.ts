import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';

/**
 * Webhook từ API (admin CMS) sau khi game thay đổi:
 *   POST /api/revalidate  · header x-revalidate-secret: <REVALIDATE_SECRET>  · body { "tags": ["games", "game:<slug>"] }
 *   Danh mục đổi → tags "categories", "category:<slug>".
 *   Cấu hình web (tên, logo, favicon, SEO trang chủ) đổi → tag "site-config" (layout của mọi trang).
 * Hết hạn NGAY ({ expire: 0 }): request kế tiếp chờ lấy dữ liệu mới từ API rồi mới trả trang, nên sửa/publish
 * trong admin là F5 thấy luôn. Đánh đổi: nếu đúng lúc đó API lỗi thì trang đó lỗi (thay vì hiện bản cũ).
 * Mặc định vẫn cache 5 phút (REVALIDATE_SECONDS trong lib/api) để không gọi API mỗi request.
 */
export const dynamic = 'force-dynamic';

const TAG_PATTERN = /^(games|categories|site-config|(?:game|category):[a-z0-9]+(?:-[a-z0-9]+)*)$/;
const MAX_TAGS = 50;

function isAuthorized(header: string | null) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!isAuthorized(request.headers.get('x-revalidate-secret'))) {
    return Response.json({ revalidated: false, message: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const tags = (body as { tags?: unknown } | null)?.tags;
  if (!Array.isArray(tags) || tags.length === 0 || tags.length > MAX_TAGS || !tags.every((tag) => typeof tag === 'string' && TAG_PATTERN.test(tag))) {
    return Response.json({ revalidated: false, message: `Body must be { tags: string[] } (1–${MAX_TAGS} items matching ${TAG_PATTERN})` }, { status: 400 });
  }

  // Theo tag (không theo path): trang/sitemap đã cache, kể cả bản build lúc API chưa chạy, đều mang tag `games`.
  const unique = [...new Set(tags as string[])];
  for (const tag of unique) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: true, tags: unique });
}
