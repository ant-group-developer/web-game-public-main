/**
 * Bộ sự kiện chuẩn cho Google Analytics 4 — dùng chung cho SDK game và portal (portal kiểm tra lại sự kiện
 * game gửi qua postMessage bằng chính hàm này). Không phụ thuộc thư viện.
 */

type Kind = 'num' | 'int' | 'str' | 'bool' | 'id';

/** Kiểu từng tham số: `id` = số hoặc chuỗi (vd level 12 / 'boss'); `bool` gửi thành 1 / 0. */
const PARAMS = {
  load_ms: 'int',
  mode: 'str',
  bot_level: 'id',
  move_time_s: 'num',
  result: 'str',
  reason: 'str',
  duration_s: 'num',
  moves: 'int',
  level: 'id',
  attempts: 'int',
  fail_reason: 'str',
  wait_s: 'num',
  vs_bot: 'bool',
  error_type: 'str',
  error_message: 'str',
  screen: 'str',
  feature: 'str',
  method: 'str',
  event_id: 'str',
} as const satisfies Record<string, Kind>;

export type TrackParam = keyof typeof PARAMS;

const MATCH = ['mode', 'bot_level', 'move_time_s', 'result', 'reason', 'duration_s', 'moves'] as const;
const LEVEL = ['level', 'duration_s', 'attempts', 'fail_reason'] as const;
const MM = ['wait_s', 'vs_bot', 'mode'] as const;

/** Tên sự kiện → tham số được phép. Tham số khác bị bỏ. */
export const TRACK_EVENTS = {
  game_open: ['load_ms'],
  match_start: MATCH,
  match_end: MATCH,
  level_start: LEVEL,
  level_end: LEVEL,
  level_fail: LEVEL,
  mm_search: MM,
  mm_matched: MM,
  game_error: ['error_type', 'error_message', 'screen', 'level'],
  feature_use: ['feature'],
  sign_up: ['method'],
  login: ['method'],
  event_join: ['event_id'],
} as const satisfies Record<string, readonly TrackParam[]>;

export type TrackEvent = keyof typeof TRACK_EVENTS;
export type TrackParams = Partial<Record<TrackParam, string | number | boolean>>;
/** Tham số sau khi kiểm tra (bool đã thành 1 / 0). */
export type CleanParams = Partial<Record<TrackParam, string | number>>;
export type PlayerType = 'guest' | 'member';
export type Embed = 'portal' | 'direct';

/** Tham số SDK / portal tự gắn vào mọi sự kiện (game không tự đặt được). */
export interface CommonParams {
  game_id: string;
  player_type: PlayerType;
  locale: string;
  embed: Embed;
}

export const isTrackEvent = (name: unknown): name is TrackEvent =>
  typeof name === 'string' && Object.prototype.hasOwnProperty.call(TRACK_EVENTS, name);

/** GA4 cắt giá trị chuỗi ở 100 ký tự. */
const MAX_STR = 100;

/** Số tối đa sự kiện `game_error` gửi trong một phiên (tab). */
export const MAX_ERRORS_PER_SESSION = 5;

/**
 * Kiểm tra sự kiện: tên ngoài bảng → null; tham số ngoài bảng / sai kiểu → bỏ (ghi vào `dropped`).
 * Trả tham số đã chuẩn hoá (chuỗi cắt 100 ký tự, số nguyên làm tròn, bool → 1/0).
 */
export function sanitizeTrack(event: unknown, params: unknown): { event: TrackEvent; params: CleanParams; dropped: string[] } | null {
  if (!isTrackEvent(event)) return null;
  const allowed = TRACK_EVENTS[event] as readonly TrackParam[];
  const out: CleanParams = {};
  const dropped: string[] = [];
  if (params && typeof params === 'object') {
    for (const [key, raw] of Object.entries(params as Record<string, unknown>)) {
      if (raw === undefined || raw === null) continue;
      const value = allowed.includes(key as TrackParam) ? coerce(PARAMS[key as TrackParam], raw) : undefined;
      if (value === undefined) dropped.push(key);
      else out[key as TrackParam] = value;
    }
  }
  return { event, params: out, dropped };
}

function coerce(kind: Kind, raw: unknown): string | number | undefined {
  switch (kind) {
    case 'bool':
      return typeof raw === 'boolean' ? (raw ? 1 : 0) : raw === 0 || raw === 1 ? raw : undefined;
    case 'int':
    case 'num': {
      const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
      if (!Number.isFinite(n)) return undefined;
      return kind === 'int' ? Math.round(n) : Math.round(n * 1000) / 1000;
    }
    case 'id':
      if (typeof raw === 'number') return Number.isFinite(raw) ? raw : undefined;
      return str(raw);
    case 'str':
      return str(raw);
  }
}

function str(raw: unknown): string | undefined {
  if (typeof raw !== 'string' && typeof raw !== 'number') return undefined;
  const s = String(raw).trim().slice(0, MAX_STR);
  return s || undefined;
}

/** Lựa chọn cookie của người chơi, lưu ở portal và dùng chung cho game trên `*.zozo.bio` (cookie `zozo_consent`). */
export type Consent = 'granted' | 'denied';
export const CONSENT_COOKIE = 'zozo_consent';

export function readConsentCookie(): Consent | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)zozo_consent=(granted|denied)(?:;|$)/);
  return match ? (match[1] as Consent) : null;
}

/** Ghi cookie lựa chọn (1 năm); trên `*.zozo.bio` ghi cho cả domain để game chạy riêng đọc được. */
export function writeConsentCookie(value: Consent) {
  if (typeof document === 'undefined') return;
  const host = location.hostname;
  const domain = host === 'zozo.bio' || host.endsWith('.zozo.bio') ? '; domain=.zozo.bio' : '';
  const secure = location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${value}; max-age=31536000; path=/; samesite=lax${domain}${secure}`;
}

/** Mã đo lường GA4 hợp lệ (`G-XXXXXXX`). */
export const isMeasurementId = (id: unknown): id is string => typeof id === 'string' && /^G-[A-Z0-9]{4,20}$/.test(id);

type Gtag = (...args: unknown[]) => void;
interface GtagWindow { dataLayer?: unknown[]; gtag?: Gtag }

/**
 * Tạo `window.gtag` + `dataLayer` và lệnh consent mặc định (đều denied, trừ analytics_storage nếu đã đồng ý).
 * Chưa tải script: lệnh nằm trong `dataLayer`, gtag.js chạy lại hết khi được tải (`loadGtagScript`).
 */
export function createGtag(measurementId: string, consent: Consent | null, config: Record<string, unknown>): Gtag {
  const w = window as unknown as GtagWindow;
  w.dataLayer = w.dataLayer || [];
  if (!w.gtag) {
    // gtag.js chỉ hiểu đối tượng `arguments`, không phải mảng.
    w.gtag = function gtag() { (w.dataLayer as unknown[]).push(arguments); } as Gtag; // eslint-disable-line prefer-rest-params
  }
  const gtag = w.gtag;
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: consent === 'granted' ? 'granted' : 'denied',
  });
  gtag('js', new Date());
  gtag('config', measurementId, { send_page_view: false, ...config });
  return gtag;
}

export function loadGtagScript(measurementId: string) {
  const src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  if (document.querySelector(`script[src="${src}"]`)) return;
  const el = document.createElement('script');
  el.async = true;
  el.src = src;
  document.head.appendChild(el);
}
