/**
 * Proxy đếm lượt chơi: trình duyệt → /api/play (cùng domain, gửi được bằng sendBeacon) → API.
 *   { action: "start", slug, visitorId, seconds?, referrerHost?, device? } → { sessionId, counted }
 *   { action: "beat", sessionId, seconds }                                 → 204
 * Gửi kèm IP người chơi + REVALIDATE_SECRET để API throttle theo từng người thay vì theo IP máy chủ portal.
 */
export const dynamic = 'force-dynamic';

const API_BASE = (process.env.API_INTERNAL_URL || 'http://localhost:3000').replace(/\/+$/, '');
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VISITOR = /^[A-Za-z0-9_-]{8,64}$/;

function clientIp(request: Request) {
  const h = request.headers;
  return (h.get('cf-connecting-ip') || h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0] || '').trim().slice(0, 64);
}

const seconds = (value: unknown, max: number) => (typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(max, Math.round(value))) : 0);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    // sendBeacon gửi text/plain: đọc text rồi parse cho cả hai kiểu.
    body = JSON.parse(await request.text()) as Record<string, unknown>;
  } catch {
    return Response.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  let path: string;
  let payload: Record<string, unknown>;
  if (body.action === 'start' && typeof body.slug === 'string' && SLUG.test(body.slug) && typeof body.visitorId === 'string' && VISITOR.test(body.visitorId)) {
    path = `/public/games/${body.slug}/play`;
    payload = {
      visitorId: body.visitorId,
      seconds: seconds(body.seconds, 60),
      ...(typeof body.referrerHost === 'string' && body.referrerHost ? { referrerHost: body.referrerHost.slice(0, 255) } : {}),
      ...(body.device === 'mobile' || body.device === 'desktop' ? { device: body.device } : {}),
    };
  } else if (body.action === 'beat' && typeof body.sessionId === 'string' && UUID.test(body.sessionId)) {
    const value = seconds(body.seconds, 60);
    if (value < 1) return new Response(null, { status: 204 });
    path = `/public/plays/${body.sessionId}/beat`;
    payload = { seconds: value };
  } else {
    return Response.json({ message: 'Invalid body' }, { status: 400 });
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'user-agent': request.headers.get('user-agent') ?? '',
  };
  const secret = process.env.REVALIDATE_SECRET;
  const ip = clientIp(request);
  if (secret && ip) {
    headers['x-portal-secret'] = secret;
    headers['x-portal-client'] = ip;
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1${path}`, { method: 'POST', headers, body: JSON.stringify(payload), cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (res.status === 204) return new Response(null, { status: 204 });
    const data = (await res.json().catch(() => null)) as { data?: unknown } | null;
    return Response.json(data?.data ?? data ?? {}, { status: res.status });
  } catch {
    return Response.json({ message: 'API unavailable' }, { status: 502 });
  }
}
