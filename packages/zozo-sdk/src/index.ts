/**
 * ZOZO SDK v1 — tài khoản người chơi ZOZO ID và ngôn ngữ cho game chạy trong portal (iframe) hoặc riêng.
 *
 *   ZOZO.init({ gameId: 'xiangqi' });
 *   const token = await ZOZO.getToken();   // gửi kèm Authorization: Bearer cho backend game
 *   ZOZO.onAuthChange((player) => …);
 *   ZOZO.onLocale((locale) => …);
 *
 * Trong iframe của portal ZOZO, SDK xin token qua postMessage từ portal (portal là nơi duy nhất refresh
 * phiên — tránh hai bên cùng xoay refresh token). Ngoài iframe (hoặc portal không trả lời) SDK tự gọi API.
 */
import {
  authSignature,
  createSession,
  isTrustedOrigin,
  isZozoLocale,
  ZozoError,
  type AuthResult,
  type Session,
  type ZozoLocale,
  type ZozoPlayer,
} from './core';

export { ZozoError };
export type { ZozoLocale, ZozoPlayer };

export interface InitOptions {
  /** Key của game (trùng key trong admin "Game kết nối"), ví dụ `xiangqi`. */
  gameId: string;
  /** Origin API, mặc định `https://api.zozo.bio`. */
  apiBase?: string;
  /** Origin portal (trang đăng nhập khi game chạy riêng), mặc định `https://zozo.bio`. */
  portalUrl?: string;
}

const DEFAULT_API = 'https://api.zozo.bio';
const DEFAULT_PORTAL = 'https://zozo.bio';
/** Portal phải trả lời token trong ngần này, không thì SDK tự gọi API. */
const BRIDGE_TIMEOUT_MS = 4000;

let config: Required<InitOptions> | null = null;
let session: Session | null = null;
/** Origin portal cha (đã kiểm tra) khi game nằm trong iframe; null = tự gọi API. */
let parentOrigin: string | null = null;
let seq = 0;
const pending = new Map<string, { resolve: (r: AuthResult) => void; reject: (e: unknown) => void; timer: ReturnType<typeof setTimeout> }>();
const authListeners = new Set<(player: ZozoPlayer | null) => void>();
const localeListeners = new Set<(locale: ZozoLocale) => void>();
let loginWaiters: Array<(changed: boolean) => void> = [];
let locale: ZozoLocale = 'vi';
let lastSignature = '';

function need(): Session {
  if (!session) throw new Error('ZOZO.init({ gameId }) must be called first');
  return session;
}

/** Origin của trang chứa iframe (Chrome/Safari: ancestorOrigins; Firefox: referrer). */
function detectParent(): string | null {
  if (typeof window === 'undefined' || window.parent === window) return null;
  let origin = '';
  try {
    origin = window.location.ancestorOrigins?.[0] ?? '';
    if (!origin && document.referrer) origin = new URL(document.referrer).origin;
  } catch { /* referrer lạ */ }
  return origin && isTrustedOrigin(origin) ? origin : null;
}

function post(message: Record<string, unknown>) {
  if (parentOrigin) window.parent.postMessage(message, parentOrigin);
}

/** Xin portal cha một access token (portal tự refresh / tạo khách nếu cần). */
function askParent(): Promise<AuthResult> {
  return new Promise((resolve, reject) => {
    const id = `${Date.now().toString(36)}-${++seq}`;
    const timer = setTimeout(() => { pending.delete(id); reject(new ZozoError(0, 'bridge_timeout', 'Portal did not answer')); }, BRIDGE_TIMEOUT_MS);
    pending.set(id, { resolve, reject, timer });
    post({ type: 'zozo:token-request', id, gameId: config?.gameId });
  });
}

function emitAuth() {
  const s = need().state;
  const signature = authSignature(s);
  if (signature === lastSignature) return;
  lastSignature = signature;
  authListeners.forEach((cb) => { try { cb(s.player); } catch (error) { console.error(error); } });
}

async function ensure(): Promise<AuthResult> {
  const s = need();
  const current = s.current();
  if (current && current.expiresIn > 60) return current;
  if (parentOrigin) {
    try {
      return s.apply(await askParent());
    } catch (error) {
      if (!(error instanceof ZozoError) || error.code !== 'bridge_timeout') throw error;
      // Portal cha không có cầu nối ZOZO: từ giờ tự gọi API.
      parentOrigin = null;
      session = swapSession(true);
    }
  }
  const result = await need().ensure({ guest: true });
  if (!result) throw new ZozoError(401, 'unauthorized', 'No session');
  return result;
}

function swapSession(autoRefresh: boolean): Session {
  const next = createSession({ apiBase: config!.apiBase, autoRefresh });
  next.subscribe(emitAuth);
  return next;
}

function onMessage(event: MessageEvent) {
  const data = event.data as { type?: unknown; [key: string]: unknown } | null;
  if (!data || typeof data !== 'object' || typeof data.type !== 'string') return;
  if (event.source !== window.parent || !isTrustedOrigin(event.origin)) return;

  if (data.type === 'ant-play:locale') {
    if (isZozoLocale(data.locale)) setLocale(data.locale);
    return;
  }
  if (!parentOrigin || event.origin !== parentOrigin || !session) return;

  if (data.type === 'zozo:token' && typeof data.id === 'string') {
    const waiter = pending.get(data.id);
    if (!waiter) return;
    pending.delete(data.id);
    clearTimeout(waiter.timer);
    if (typeof data.accessToken === 'string' && typeof data.expiresIn === 'number' && data.player && typeof data.player === 'object') {
      waiter.resolve({ accessToken: data.accessToken, expiresIn: data.expiresIn, player: data.player as ZozoPlayer });
    } else {
      waiter.reject(new ZozoError(typeof data.status === 'number' ? data.status : 0, typeof data.error === 'string' ? data.error : 'bridge_error', 'Portal could not provide a token'));
    }
    return;
  }
  if (data.type === 'zozo:auth-changed') {
    // Phiên trên portal đã đổi: xin token mới rồi báo game (một lần, không qua trạng thái "chưa đăng nhập").
    const s = session;
    void askParent()
      .then((result) => { s.apply(result, true); }, () => { s.clear(); })
      .finally(() => {
        const waiters = loginWaiters;
        loginWaiters = [];
        waiters.forEach((done) => done(true));
      });
    return;
  }
  if (data.type === 'zozo:login-cancel') {
    const waiters = loginWaiters;
    loginWaiters = [];
    waiters.forEach((done) => done(false));
  }
}

function setLocale(next: ZozoLocale) {
  if (next === locale) return;
  locale = next;
  localeListeners.forEach((cb) => { try { cb(locale); } catch (error) { console.error(error); } });
}

/** Khởi tạo SDK. Gọi một lần, trước mọi hàm khác. */
export function init(options: InitOptions): void {
  if (!options?.gameId) throw new Error('ZOZO.init: gameId is required');
  if (config) return;
  config = {
    gameId: options.gameId,
    apiBase: (options.apiBase || DEFAULT_API).replace(/\/+$/, ''),
    portalUrl: (options.portalUrl || DEFAULT_PORTAL).replace(/\/+$/, ''),
  };
  parentOrigin = detectParent();
  // Trong portal: portal refresh thay cho game, SDK không tự hẹn giờ refresh.
  session = swapSession(!parentOrigin);
  lastSignature = authSignature(session.state);
  try {
    const lang = new URLSearchParams(window.location.search).get('lang');
    if (isZozoLocale(lang)) locale = lang;
  } catch { /* không có location */ }
  window.addEventListener('message', onMessage);
}

/** Người chơi hiện tại (tự tạo khách nếu chưa có phiên). */
export async function getPlayer(): Promise<ZozoPlayer> {
  return (await ensure()).player;
}

/** Access token còn hạn (tự refresh, dùng chung một request khi gọi song song, tự tạo khách nếu cần). */
export async function getToken(): Promise<string> {
  return (await ensure()).accessToken;
}

/**
 * Mở đăng nhập / đăng ký.
 * - Trong portal: portal mở hộp thoại trên game; xong trả về người chơi mới (huỷ → người chơi cũ).
 * - Chạy riêng: chuyển tới trang đăng nhập của portal rồi quay lại trang hiện tại.
 */
export function login(options: { mode?: 'login' | 'register' } = {}): Promise<ZozoPlayer | null> {
  const c = config;
  if (!c) return Promise.reject(new Error('ZOZO.init({ gameId }) must be called first'));
  if (!parentOrigin) {
    const url = new URL('/dang-nhap', c.portalUrl);
    url.searchParams.set('returnTo', window.location.href);
    if (options.mode === 'register') url.searchParams.set('tab', 'dang-ky');
    window.location.assign(url.toString());
    return new Promise(() => {}); // Trang sắp chuyển đi.
  }
  return new Promise((resolve) => {
    loginWaiters.push(() => resolve(session?.state.player ?? null));
    post({ type: 'zozo:login', mode: options.mode === 'register' ? 'register' : 'login', gameId: c.gameId });
  });
}

/** Đăng xuất (trong portal: portal đăng xuất cho cả trang). */
export async function logout(): Promise<void> {
  const s = need();
  if (parentOrigin) {
    await new Promise<void>((resolve) => {
      loginWaiters.push(() => resolve());
      post({ type: 'zozo:logout' });
      setTimeout(resolve, BRIDGE_TIMEOUT_MS);
    });
    return;
  }
  await s.logout();
}

/** Gọi cb mỗi khi người chơi đổi (đăng nhập, đăng ký, đăng xuất, gộp khách, đổi tên). Trả hàm huỷ. */
export function onAuthChange(cb: (player: ZozoPlayer | null) => void): () => void {
  authListeners.add(cb);
  return () => { authListeners.delete(cb); };
}

/**
 * Ngôn ngữ game: `?lang=` lúc mở, sau đó theo message `ant-play:locale` của portal. Mặc định 'vi'
 * (không bao giờ theo ngôn ngữ trình duyệt). cb được gọi ngay với giá trị hiện tại. Trả hàm huỷ.
 */
export function onLocale(cb: (locale: ZozoLocale) => void): () => void {
  localeListeners.add(cb);
  try { cb(locale); } catch (error) { console.error(error); }
  return () => { localeListeners.delete(cb); };
}

/** Ngôn ngữ hiện tại. */
export function getLocale(): ZozoLocale {
  return locale;
}

export const version = '1.0.0';
