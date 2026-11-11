/**
 * ZOZO SDK v1 — tài khoản người chơi ZOZO ID, ngôn ngữ và đo lường (GA4) cho game chạy trong portal (iframe) hoặc riêng.
 *
 *   ZOZO.init({ gameId: 'xiangqi' });
 *   const token = await ZOZO.getToken();   // gửi kèm Authorization: Bearer cho backend game
 *   ZOZO.onAuthChange((player) => …);
 *   ZOZO.onLocale((locale) => …);
 *   ZOZO.track('match_end', { mode: 'ranked', result: 'win', duration_s: 312, moves: 48 });
 *
 * Trong iframe của portal ZOZO, SDK xin token qua postMessage từ portal (portal là nơi duy nhất refresh
 * phiên — tránh hai bên cùng xoay refresh token). Ngoài iframe (hoặc portal không trả lời) SDK tự gọi API.
 * Sự kiện đo lường trong portal cũng đi qua portal (một gtag, một phiên GA); chạy riêng thì SDK tự tải gtag.
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
import {
  createGtag,
  isMeasurementId,
  loadGtagScript,
  MAX_ERRORS_PER_SESSION,
  readConsentCookie,
  sanitizeTrack,
  writeConsentCookie,
  type Consent,
  type TrackEvent,
  type TrackParams,
} from './analytics';

export { ZozoError };
export type { Consent, TrackEvent, TrackParams, ZozoLocale, ZozoPlayer };

export interface InitOptions {
  /** Key của game (trùng key trong admin "Game kết nối"), ví dụ `xiangqi`. */
  gameId: string;
  /** Origin API, mặc định `https://api.zozo.bio`. */
  apiBase?: string;
  /** Origin portal (trang đăng nhập khi game chạy riêng), mặc định `https://zozo.bio`. */
  portalUrl?: string;
  /**
   * Mã đo lường GA4 (`G-…`) dùng khi game chạy riêng. Không có → `track()` chỉ gửi được khi game nằm trong portal.
   * Trong portal luôn gửi qua gtag của portal, không dùng mã này.
   */
  ga4Id?: string;
  /** Tự gửi `game_open {load_ms}` và `game_error` (lỗi JS chưa bắt, tối đa 5 / phiên). Mặc định true. */
  autoTrack?: boolean;
  /** Ghi `track()` ra console; chạy riêng thì bật thêm `debug_mode` (GA4 DebugView). Hoặc thêm `?ga_debug=1` vào URL. */
  debug?: boolean;
}

interface Config {
  gameId: string;
  apiBase: string;
  portalUrl: string;
  ga4Id: string | null;
  debug: boolean;
}

const DEFAULT_API = 'https://api.zozo.bio';
const DEFAULT_PORTAL = 'https://zozo.bio';
/** Portal phải trả lời token trong ngần này, không thì SDK tự gọi API. */
const BRIDGE_TIMEOUT_MS = 4000;

let config: Config | null = null;
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
/** gtag của chính game (chỉ khi chạy riêng và có `ga4Id`). */
let gtag: ((...args: unknown[]) => void) | null = null;
let screen = '';
let lastLevel: string | number | undefined;
let errorCount = 0;
const ERROR_KEY = 'zozo-ga-errors';

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
  gtagUser();
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
  let query: URLSearchParams | null = null;
  try { query = new URLSearchParams(window.location.search); } catch { /* không có location */ }
  config = {
    gameId: options.gameId,
    apiBase: (options.apiBase || DEFAULT_API).replace(/\/+$/, ''),
    portalUrl: (options.portalUrl || DEFAULT_PORTAL).replace(/\/+$/, ''),
    ga4Id: isMeasurementId(options.ga4Id) ? options.ga4Id : null,
    debug: !!options.debug || query?.get('ga_debug') === '1',
  };
  parentOrigin = detectParent();
  // Trong portal: portal refresh thay cho game, SDK không tự hẹn giờ refresh.
  session = swapSession(!parentOrigin);
  lastSignature = authSignature(session.state);
  const lang = query?.get('lang');
  if (isZozoLocale(lang)) locale = lang;
  window.addEventListener('message', onMessage);
  if (options.autoTrack !== false) autoTrack();
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

/* ---------------------------------------------------------------- Đo lường (GA4) */

/**
 * Gửi một sự kiện chuẩn (bảng trong README). Tên ngoài bảng bị bỏ (console.warn); tham số ngoài bảng / sai kiểu bị bỏ.
 * Tự gắn `game_id`, `player_type` (guest | member), `locale`, `embed` (portal | direct); `user_id` = id người chơi.
 * Không bao giờ ném lỗi — đo lường không được làm hỏng game.
 */
export function track(event: TrackEvent, params: TrackParams = {}): void {
  try {
    const c = config;
    if (!c) { console.warn('ZOZO.track: call ZOZO.init({ gameId }) first'); return; }
    const clean = sanitizeTrack(event, params);
    if (!clean) { console.warn(`ZOZO.track: unknown event "${String(event)}"`); return; }
    if (clean.dropped.length) console.warn(`ZOZO.track(${clean.event}): dropped params ${clean.dropped.join(', ')}`);
    if (clean.params.level !== undefined) lastLevel = clean.params.level;
    const player = session?.state.player;
    const full = {
      ...clean.params,
      game_id: c.gameId,
      player_type: player && !player.isGuest ? 'member' : 'guest',
      locale,
      embed: parentOrigin ? 'portal' : 'direct',
    };
    if (c.debug) console.debug('[ZOZO.track]', clean.event, full);
    if (parentOrigin) { post({ type: 'zozo:track', event: clean.event, params: full }); return; }
    standaloneGtag()?.('event', clean.event, full);
  } catch { /* bỏ qua */ }
}

/** Màn hình hiện tại (vd 'menu', 'lobby', 'match') — gắn vào `game_error` tự động. */
export function setScreen(name: string): void {
  screen = typeof name === 'string' ? name.slice(0, 100) : '';
}

/**
 * Lựa chọn cookie đo lường (dùng chung với portal qua cookie `zozo_consent` trên *.zozo.bio). null = chưa chọn.
 */
export function getConsent(): Consent | null {
  return readConsentCookie();
}

/**
 * Game chạy riêng có banner cookie của mình thì báo lựa chọn ở đây. Chưa chọn (cả ở portal) → SDK chưa tải gtag,
 * sự kiện chờ trong hàng đợi. Từ chối → vẫn gửi ping ẩn danh (Consent Mode, analytics_storage=denied).
 * Trong portal: không làm gì (portal hỏi và quyết định).
 */
export function setConsent(granted: boolean): void {
  if (parentOrigin) return;
  const value: Consent = granted ? 'granted' : 'denied';
  writeConsentCookie(value);
  const g = standaloneGtag();
  if (!g || !config?.ga4Id) return;
  g('consent', 'update', { analytics_storage: value });
  loadGtagScript(config.ga4Id);
}

function gaConfig(): Record<string, unknown> {
  const id = session?.state.player?.id;
  return { send_page_view: false, ...(config?.debug ? { debug_mode: true } : {}), ...(id ? { user_id: id } : {}) };
}

function standaloneGtag() {
  const c = config;
  if (gtag || !c?.ga4Id || parentOrigin) return gtag;
  const consent = readConsentCookie();
  gtag = createGtag(c.ga4Id, consent, gaConfig());
  if (consent) loadGtagScript(c.ga4Id);
  return gtag;
}

/** Người chơi đổi → cập nhật user_id cho gtag của game (trong portal thì portal lo). */
function gtagUser() {
  if (!gtag || !config?.ga4Id || parentOrigin) return;
  gtag('config', config.ga4Id, { ...gaConfig(), user_id: session?.state.player?.id ?? null });
}

function autoTrack() {
  const open = () => {
    let ms = performance.now();
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (nav && nav.loadEventStart > 0) ms = nav.loadEventStart;
    } catch { /* trình duyệt cũ */ }
    track('game_open', { load_ms: ms });
  };
  if (document.readyState === 'complete') setTimeout(open, 0);
  else window.addEventListener('load', open, { once: true });

  window.addEventListener('error', (event) => {
    if (!(event instanceof ErrorEvent)) return;
    const error = event.error as { name?: unknown; message?: unknown } | null;
    const type = typeof error?.name === 'string' ? error.name : event.message === 'Script error.' ? 'ScriptError' : 'Error';
    reportError(type, typeof error?.message === 'string' ? error.message : event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason as unknown;
    if (reason instanceof Error) reportError(`Rejection:${reason.name}`, reason.message);
    else reportError('Rejection', typeof reason === 'string' ? reason : '');
  });
}

/** Tối đa MAX_ERRORS_PER_SESSION lỗi mỗi phiên (tab), đếm trong sessionStorage. */
function reportError(type: string, message: string) {
  let n = errorCount;
  try { n = Math.max(n, Number(sessionStorage.getItem(ERROR_KEY)) || 0); } catch { /* storage bị chặn */ }
  if (n >= MAX_ERRORS_PER_SESSION) return;
  errorCount = n + 1;
  try { sessionStorage.setItem(ERROR_KEY, String(errorCount)); } catch { /* storage bị chặn */ }
  track('game_error', { error_type: type, error_message: message, screen: screen || undefined, level: lastLevel });
}

export const version = '1.1.0';
