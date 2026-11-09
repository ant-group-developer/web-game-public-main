import 'server-only';
import type { Game } from '@/types/game';

/**
 * Dữ liệu game lấy từ API (admin CMS), cache theo tag để API gọi webhook /api/revalidate là cập nhật ngay.
 * - Tag `games`: danh sách + mọi trang game. Tag `game:<slug>`: riêng một game.
 * - REVALIDATE_SECONDS: lưới an toàn nếu webhook bị lỡ.
 * Lỗi mạng/5xx khi chạy thật thì ném lỗi để Next giữ lại trang đã cache gần nhất (ISR).
 * Lúc `next build` mà API chưa chạy thì trả rỗng để build vẫn qua; trang được tạo lại khi có request.
 */
const API_BASE = (process.env.API_INTERNAL_URL || 'http://localhost:3000').replace(/\/+$/, '');
const REVALIDATE_SECONDS = 300;
const TIMEOUT_MS = 8000;

interface Envelope<T> { success: boolean; data: T }

const isBuildPhase = () => process.env.NEXT_PHASE === 'phase-production-build';

async function request<T>(path: string, tags: string[]): Promise<T | null> {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    next: { tags, revalidate: REVALIDATE_SECONDS },
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${path} responded ${res.status}`);
  const body = (await res.json()) as Envelope<T>;
  if (!body?.success) throw new Error(`API ${path} returned an unsuccessful envelope`);
  return body.data;
}

export async function getGames(): Promise<Game[]> {
  try {
    return (await request<Game[]>('/public/games', ['games'])) ?? [];
  } catch (error) {
    if (isBuildPhase()) {
      console.warn(`[games] API không truy cập được lúc build (${API_BASE}); dùng danh sách rỗng.`, String(error));
      return [];
    }
    throw error;
  }
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  try {
    return await request<Game>(`/public/games/${slug}`, ['games', `game:${slug}`]);
  } catch (error) {
    if (isBuildPhase()) return null;
    throw error;
  }
}
