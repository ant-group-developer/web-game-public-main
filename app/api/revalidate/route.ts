import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';

/**
 * Webhook từ API (admin CMS) sau khi game thay đổi:
 *   POST /api/revalidate  · header x-revalidate-secret: <REVALIDATE_SECRET>  · body { "tags": ["games", "game:<slug>"] }
 * Đánh dấu cache cũ (stale-while-revalidate, profile "max"): request kế tiếp nhận bản cũ và kích hoạt tạo lại,
 * các request sau đó nhận bản mới. Nếu API lỗi lúc tạo lại thì Next tiếp tục phục vụ bản cũ.
 */
export const dynamic = 'force-dynamic';

const TAG_PATTERN = /^(games|game:[a-z0-9]+(?:-[a-z0-9]+)*)$/;
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

  // Chỉ dùng revalidateTag(…, 'max'): trang/sitemap đã cache (kể cả bản build lúc API chưa chạy) đều mang tag `games`.
  // Không dùng revalidatePath: nó hết hạn ngay, nếu lúc đó API lỗi thì người dùng nhận 500 thay vì bản cũ.
  const unique = [...new Set(tags as string[])];
  for (const tag of unique) revalidateTag(tag, 'max');
  return Response.json({ revalidated: true, tags: unique });
}
