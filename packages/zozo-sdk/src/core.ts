/**
 * ZOZO ID — lõi phiên đăng nhập dùng chung cho SDK game và portal.
 * Không phụ thuộc thư viện nào; chỉ chạy trên trình duyệt.
 *
 * - Access token (15 phút) giữ trong bộ nhớ; refresh token nằm trong cookie HttpOnly `zozo_rt` của API.
 * - Mọi lệnh gọi `/auth/*` kèm `credentials: 'include'`.
 * - Refresh chạy một lần tại một thời điểm (single-flight) và khoá giữa các tab cùng origin (Web Locks):
 *   API xoay refresh token mỗi lần dùng, hai request song song bằng cùng một cookie sẽ bị coi là dùng lại
 *   và cả phiên bị thu hồi.
 */

export interface ZozoPlayer {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isGuest: boolean;
  createdAt: string;
  /** Mã 6 ký tự (hiện cho người chơi, admin tìm theo mã). */
  code: string;
  email: string | null;
  emailVerified: boolean;
  hasPassword: boolean;
  hasGoogle: boolean;
}

export interface AuthResult {
  accessToken: string;
  /** Số giây token còn sống. */
  expiresIn: number;
  player: ZozoPlayer;
  /** Đăng nhập khi đang là khách khác: API đã tự gộp khách đó vào tài khoản. */
  mergedGuest?: { id: string; name: string };
}

/** Lỗi từ API (`{statusCode, errorCode, message}`) hoặc lỗi mạng (`status` 0, `code` `network`). */
export class ZozoError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ZozoError';
  }
}

/** Origin portal / game được tin cậy cho postMessage. */
export const ZOZO_ORIGIN = /^https:\/\/([a-z0-9-]+\.)?zozo\.bio$/;
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/** Trang hiện tại chạy trên máy dev (localhost) → chấp nhận thêm origin http://localhost:*. */
export const isLocalPage = () => typeof location !== 'undefined' && LOCAL_ORIGIN.test(location.origin);

export function isTrustedOrigin(origin: string, allowLocal = isLocalPage()): boolean {
  return ZOZO_ORIGIN.test(origin) || (allowLocal && LOCAL_ORIGIN.test(origin));
}

export type ZozoLocale = 'vi' | 'en';
export const isZozoLocale = (value: unknown): value is ZozoLocale => value === 'vi' || value === 'en';

export interface SessionState {
  player: ZozoPlayer | null;
  /** false cho tới khi lần kiểm tra phiên đầu tiên xong. */
  ready: boolean;
  /** Tăng sau mỗi lần đăng nhập / đăng ký / đăng xuất / gộp (để báo game tải lại dữ liệu). */
  rev: number;
}

export interface SessionOptions {
  /** Origin API, không kèm `/api/v1`. Ví dụ `https://api.zozo.bio`. */
  apiBase: string;
  /** Tự hẹn refresh trước khi access token hết hạn. Mặc định true. */
  autoRefresh?: boolean;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Gửi `Authorization: Bearer`. `'required'` = phải có phiên (tự refresh); `'optional'` = có thì gửi. */
  auth?: 'required' | 'optional';
}

/** Còn ít hơn ngần này thì coi như token sắp hết hạn và refresh trước. */
const MIN_VALIDITY_MS = 60_000;
const LOCK = 'zozo-auth-refresh';
const CHANNEL = 'zozo-auth';

export type Session = ReturnType<typeof createSession>;

export function createSession(options: SessionOptions) {
  const api = `${options.apiBase.replace(/\/+$/, '')}/api/v1`;
  const autoRefresh = options.autoRefresh !== false;
  let accessToken: string | null = null;
  let expiresAt = 0;
  let state: SessionState = { player: null, ready: false, rev: 0 };
  let inflight: Promise<AuthResult | null> | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<(state: SessionState) => void>();

  // Tab khác cùng origin đăng nhập / đăng xuất → tab này lấy lại phiên từ cookie.
  // Phiên do nơi khác quản lý (autoRefresh false, vd game trong portal) thì không tự refresh theo tab khác.
  const channel = autoRefresh && typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
  if (channel) channel.onmessage = () => { void refresh().then(() => setState({ rev: state.rev + 1 })).catch(() => {}); };

  if (typeof document !== 'undefined') {
    // Timer bị trình duyệt hoãn khi tab ẩn: quay lại tab mà token đã hết thì refresh ngay.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && autoRefresh && accessToken && !valid()) void refresh().catch(() => {});
    });
  }

  function setState(patch: Partial<SessionState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener(state));
  }

  const valid = () => !!accessToken && expiresAt - Date.now() > MIN_VALIDITY_MS;

  function schedule(ms: number) {
    clearTimeout(timer);
    if (autoRefresh) timer = setTimeout(() => { void refresh().catch(() => schedule(30_000)); }, ms);
  }

  /** Nhận kết quả đăng nhập / refresh (từ API hoặc từ portal qua postMessage). */
  function apply(result: AuthResult, bumpRev = false) {
    accessToken = result.accessToken;
    expiresAt = Date.now() + result.expiresIn * 1000;
    schedule(Math.max(5_000, result.expiresIn * 1000 - 90_000));
    setState({ player: result.player, ready: true, ...(bumpRev ? { rev: state.rev + 1 } : {}) });
    return result;
  }

  function clear() {
    accessToken = null;
    expiresAt = 0;
    clearTimeout(timer);
    setState({ player: null, ready: true });
  }

  async function call<T>(path: string, init: { method: string; body?: unknown; token?: string | null }): Promise<T> {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (init.body !== undefined) headers['content-type'] = 'application/json';
    if (init.token) headers.authorization = `Bearer ${init.token}`;
    let res: Response;
    try {
      res = await fetch(api + path, {
        method: init.method,
        headers,
        credentials: 'include',
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      });
    } catch {
      throw new ZozoError(0, 'network', 'Network error');
    }
    const body = (await res.json().catch(() => null)) as
      | { success?: boolean; data?: unknown; errorCode?: string; message?: string; details?: Record<string, string> }
      | null;
    if (!res.ok) {
      const code = body?.errorCode || (res.status === 429 ? 'too_many_requests' : `http_${res.status}`);
      throw new ZozoError(res.status, code, body?.message || res.statusText, body?.details);
    }
    return (body && 'data' in body ? body.data : body) as T;
  }

  /** Chạy fn trong khoá giữa các tab cùng origin (nếu trình duyệt hỗ trợ). */
  function locked<T>(fn: () => Promise<T>): Promise<T> {
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    return locks ? (locks.request(LOCK, fn) as Promise<T>) : fn();
  }

  /**
   * Lấy access token mới bằng cookie. Không có phiên → null (không tạo khách).
   * Một lần tại một thời điểm: gọi trùng thì dùng chung kết quả.
   */
  function refresh(): Promise<AuthResult | null> {
    if (inflight) return inflight;
    inflight = locked(() => call<AuthResult>('/auth/refresh', { method: 'POST' }))
      .then((r) => apply(r), (error: unknown) => {
        if (error instanceof ZozoError && (error.status === 401 || error.status === 403)) { clear(); return null; }
        if (!state.ready) setState({ ready: true });
        throw error;
      })
      .finally(() => { inflight = null; });
    return inflight;
  }

  /** Tạo khách mới (chỉ khi thực sự cần: game xin token mà chưa có phiên). */
  function guest(): Promise<AuthResult> {
    return locked(() => call<AuthResult>('/auth/guest', { method: 'POST' })).then((r) => apply(r));
  }

  /** Phiên hiện tại còn hạn, hoặc refresh; `guest: true` → chưa có phiên thì tạo khách. */
  async function ensure(opts: { guest?: boolean } = {}): Promise<AuthResult | null> {
    if (valid() && state.player) return current();
    const result = await refresh();
    if (result || !opts.guest) return result;
    if (inflight) return inflight;
    const created = guest();
    inflight = created.finally(() => { inflight = null; });
    return created;
  }

  function current(): AuthResult | null {
    if (!accessToken || !state.player) return null;
    return { accessToken, expiresIn: Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)), player: state.player };
  }

  async function getToken(opts: { guest?: boolean } = {}): Promise<string | null> {
    return (await ensure(opts))?.accessToken ?? null;
  }

  /** Gọi API ZOZO. `auth: 'required'` tự refresh token và thử lại một lần khi gặp 401. */
  async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const method = opts.method ?? 'GET';
    if (!opts.auth) return call<T>(path, { method, body: opts.body });
    let token = opts.auth === 'required' ? await getToken() : valid() ? accessToken : null;
    if (opts.auth === 'required' && !token) throw new ZozoError(401, 'unauthorized', 'Authentication required');
    try {
      return await call<T>(path, { method, body: opts.body, token });
    } catch (error) {
      if (!(error instanceof ZozoError) || error.status !== 401 || error.code === 'invalid_credentials' || opts.auth !== 'required') throw error;
      token = (await refresh())?.accessToken ?? null;
      if (!token) throw error;
      return call<T>(path, { method, body: opts.body, token });
    }
  }

  /** Đăng nhập / đăng ký / gộp / đăng xuất xong: báo các tab khác và game. */
  function changed() {
    setState({ rev: state.rev + 1 });
    channel?.postMessage('changed');
  }

  async function logout() {
    try { await call('/auth/logout', { method: 'POST' }); } catch { /* Vẫn xoá phiên phía client. */ }
    clear();
    changed();
  }

  return {
    get state() { return state; },
    subscribe(listener: (state: SessionState) => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    apply,
    clear,
    refresh,
    ensure,
    current,
    getToken,
    request,
    changed,
    logout,
    /** Cập nhật thông tin người chơi (sau PATCH /me, xác minh email…) mà không đổi token. */
    setPlayer(player: ZozoPlayer) { setState({ player }); },
  };
}

/** Chuỗi đại diện người chơi hiện tại — đổi thì báo `auth-changed`. */
export const authSignature = (s: SessionState) =>
  s.player ? `${s.player.id}|${s.player.isGuest}|${s.player.displayName}|${s.player.avatarUrl ?? ''}|${s.rev}` : `-|${s.rev}`;
