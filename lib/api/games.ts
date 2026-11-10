import 'server-only';
import type { Category, CategoryDetail } from '@/types/category';
import type { Game } from '@/types/game';
import { recall, remember } from './last-good';

/**
 * Dữ liệu game / danh mục lấy từ API (admin CMS), cache theo tag để API gọi webhook /api/revalidate là cập nhật ngay.
 * - Tag `games`: danh sách + mọi trang game. Tag `game:<slug>`: riêng một game.
 * - Tag `categories`: danh sách danh mục (số game). Tag `category:<slug>`: riêng một danh mục.
 * - REVALIDATE_SECONDS: lưới an toàn nếu webhook bị lỡ.
 * Lỗi mạng/5xx khi chạy thật thì ném lỗi để Next giữ lại trang đã cache gần nhất (ISR).
 * Lúc `next build` mà API chưa chạy thì trả rỗng để build vẫn qua; trang được tạo lại khi có request.
 */
const API_BASE = (process.env.API_INTERNAL_URL || 'http://localhost:3000').replace(/\/+$/, '');
const REVALIDATE_SECONDS = 300;
const TIMEOUT_MS = 8000;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface Envelope<T> { success: boolean; data: T }

const isBuildPhase = () => process.env.NEXT_PHASE === 'phase-production-build';
/** API_LOG=1: ghi log mọi lần gọi API (Next gọi API từ server nên tab Network của trình duyệt không thấy). */
const LOG_ALL = process.env.API_LOG === '1';

async function request<T>(path: string, tags: string[]): Promise<T | null> {
  const started = Date.now();
  try {
    const res = await fetch(`${API_BASE}/api/v1${path}`, {
      next: { tags, revalidate: REVALIDATE_SECONDS },
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // Rất nhanh (vài ms) thường là lấy từ cache dữ liệu của Next, không thật sự gọi API.
    if (LOG_ALL) console.log(`[api] GET ${API_BASE}/api/v1${path} → ${res.status} ${Date.now() - started}ms`);
    const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
    // 404 JSON của API = không có bản ghi. 404 HTML (nginx, sai domain API) là lỗi cấu hình, không phải "không có game".
    if (res.status === 404 && isJson) return null;
    if (!res.ok || !isJson) throw new Error(`API ${path} responded ${res.status}${isJson ? '' : ' (không phải JSON — kiểm tra API_INTERNAL_URL)'}`);
    const body = (await res.json()) as Envelope<T>;
    if (!body?.success) throw new Error(`API ${path} returned an unsuccessful envelope`);
    return remember(path, body.data);
  } catch (error) {
    const last = recall<T>(path);
    // Lỗi luôn được ghi log (không cần API_LOG) để `docker logs` cho biết vì sao gọi API thất bại.
    console.warn(`[api] GET ${API_BASE}/api/v1${path} lỗi sau ${Date.now() - started}ms: ${String(error)}${last !== undefined ? ' → dùng dữ liệu đọc được gần nhất' : ''}`);
    if (last !== undefined) return last;
    throw error;
  }
}

/** Như request() nhưng lúc build (API chưa chạy) trả về `fallback` thay vì ném lỗi. */
async function load<T>(path: string, tags: string[], fallback: T): Promise<T | null> {
  try {
    return await request<T>(path, tags);
  } catch (error) {
    if (isBuildPhase()) {
      console.warn(`[api] ${path} không truy cập được lúc build (${API_BASE}); dùng giá trị rỗng.`, String(error));
      return fallback;
    }
    throw error;
  }
}

/** Mọi game đã publish, theo thứ tự admin xếp. */
export async function getGames(): Promise<Game[]> {
  return (await load<Game[]>('/public/games', ['games'], [])) ?? [];
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  if (!SLUG.test(slug)) return null;
  return load<Game | null>(`/public/games/${slug}`, ['games', `game:${slug}`], null);
}

/** Game của một danh mục theo thứ tự "Đề xuất" (admin xếp); trang danh mục tự sắp lại phía client. */
export async function getCategoryGames(slug: string): Promise<Game[]> {
  if (!SLUG.test(slug)) return [];
  return (await load<Game[]>(`/public/games?category=${slug}&sort=manual`, ['games', `category:${slug}`], [])) ?? [];
}

export async function getCategories(): Promise<Category[]> {
  return (await load<Category[]>('/public/categories', ['categories'], [])) ?? [];
}

/** Dùng cho layout (thanh danh mục): API lỗi thì ẩn thanh danh mục thay vì làm hỏng mọi trang. */
export async function getNavCategories(): Promise<Category[]> {
  try {
    return (await getCategories()).filter((c) => c.showInNav && c.gameCount > 0);
  } catch (error) {
    console.warn('[categories] không lấy được thanh danh mục:', String(error));
    return [];
  }
}

export async function getCategory(slug: string): Promise<CategoryDetail | null> {
  if (!SLUG.test(slug)) return null;
  return load<CategoryDetail | null>(`/public/categories/${slug}`, ['categories', `category:${slug}`], null);
}

/** Slug cũ (đã đổi trong admin) → slug hiện tại, để trả 301. */
export async function resolveRedirect(entity: 'game' | 'category', slug: string): Promise<string | null> {
  if (!SLUG.test(slug)) return null;
  try {
    const found = await request<{ slug: string }>(`/public/redirects/${entity}/${slug}`, [entity === 'game' ? 'games' : 'categories']);
    return found?.slug ?? null;
  } catch {
    return null;
  }
}
