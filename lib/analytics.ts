'use client';

import { useSyncExternalStore } from 'react';
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
} from '@/packages/zozo-sdk/src/analytics';
import { readLocale } from '@/hooks/use-locale';

/**
 * Google Analytics 4 của portal — một gtag, một phiên GA cho cả trang và game trong iframe (game gửi qua
 * `zozo:track`, xem use-zozo-bridge).
 *
 * - Chỉ chạy khi có NEXT_PUBLIC_GA4_MEASUREMENT_ID (nhúng lúc build). Không có → mọi hàm không làm gì.
 * - Consent Mode v2: mặc định denied. Script gtag.js chỉ được tải sau khi người chơi chọn trên banner;
 *   Đồng ý → analytics_storage=granted; Từ chối → denied (GA chỉ nhận ping ẩn danh, không cookie).
 *   Trước khi chọn, sự kiện nằm chờ trong dataLayer.
 * - user_id = id người chơi ZOZO ID. Sự kiện chờ tới khi biết phiên (tối đa 3 giây) để có user_id đúng.
 * - Dev: NEXT_PUBLIC_GA4_DEBUG=1 ghi mọi sự kiện ra console (cả khi không có mã). `?ga_debug=1` → debug_mode (DebugView).
 */
const RAW_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() ?? '';
const MEASUREMENT_ID = isMeasurementId(RAW_ID) ? RAW_ID : '';
const CONSOLE = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_GA4_DEBUG === '1';
const CONSENT_KEY = 'zozo-consent';
const READY_TIMEOUT_MS = 3000;

export const analyticsEnabled = MEASUREMENT_ID !== '';

type Gtag = (...args: unknown[]) => void;
let gtag: Gtag | null = null;
let ready = false;
let queue: Array<[string, Record<string, unknown>]> = [];
let player: { id: string; isGuest: boolean } | null = null;
let consent: Consent | null = null;
const baseConfig: Record<string, unknown> = {};
const listeners = new Set<() => void>();

function readConsent(): Consent | null {
  try {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (saved === 'granted' || saved === 'denied') return saved;
  } catch { /* Storage bị chặn. */ }
  return readConsentCookie();
}

function debugMode() {
  try {
    if (new URLSearchParams(window.location.search).get('ga_debug') === '1') sessionStorage.setItem('zozo-ga-debug', '1');
    return sessionStorage.getItem('zozo-ga-debug') === '1';
  } catch {
    return false;
  }
}

/** Gọi một lần trên trình duyệt (AnalyticsRoot). */
export function startAnalytics() {
  if (!analyticsEnabled || gtag) return;
  consent = readConsent();
  if (debugMode()) baseConfig.debug_mode = true;
  gtag = createGtag(MEASUREMENT_ID, consent, baseConfig);
  if (consent) loadGtagScript(MEASUREMENT_ID);
  setTimeout(markReady, READY_TIMEOUT_MS);
  listeners.forEach((cb) => cb());
}

/** Người chơi hiện tại (đổi → cập nhật user_id). `ready` = đã biết phiên lần đầu. */
export function setAnalyticsPlayer(next: { id: string; isGuest: boolean } | null, sessionReady: boolean) {
  const changed = (next?.id ?? null) !== (player?.id ?? null);
  player = next ? { id: next.id, isGuest: next.isGuest } : null;
  if (gtag && changed) gtag('config', MEASUREMENT_ID, { ...baseConfig, send_page_view: false, user_id: player?.id ?? null });
  if (sessionReady) markReady();
}

function markReady() {
  if (ready) return;
  ready = true;
  const pending = queue;
  queue = [];
  pending.forEach(([event, params]) => send(event, params));
}

function common(gameId?: string) {
  return {
    ...(gameId ? { game_id: gameId } : {}),
    player_type: player && !player.isGuest ? 'member' : 'guest',
    locale: readLocale(),
    embed: 'portal',
  };
}

function send(event: string, params: Record<string, unknown>) {
  const full = { ...params, ...common(typeof params.game_id === 'string' ? params.game_id : undefined) };
  if (CONSOLE) console.debug('[ga]', event, full);
  gtag?.('event', event, full);
}

function enqueue(event: string, params: Record<string, unknown>) {
  if (!analyticsEnabled) { if (CONSOLE) console.debug('[ga] (no NEXT_PUBLIC_GA4_MEASUREMENT_ID)', event, { ...params, ...common() }); return; }
  if (!ready) { queue.push([event, params]); return; }
  send(event, params);
}

/** Sự kiện chuẩn từ portal (`sign_up`, `login`, `game_open`…). `gameId` = slug game trên portal. */
export function track(event: TrackEvent, params: TrackParams = {}, gameId?: string) {
  const clean = sanitizeTrack(event, params);
  if (clean) enqueue(clean.event, gameId ? { ...clean.params, game_id: gameId } : clean.params);
}

export function trackPageView() {
  enqueue('page_view', { page_location: window.location.href, page_title: document.title, page_referrer: document.referrer || undefined });
}

/**
 * Sự kiện game trong iframe gửi lên (`{type:'zozo:track', event, params}`), đã kiểm tra nguồn ở cầu nối.
 * Kiểm tra lại tên / tham số; game_id = slug game trên portal; player_type / locale / embed do portal gắn.
 * Mỗi lần tải iframe: tối đa 200 sự kiện, 5 `game_error`; `game_open` chỉ một lần (portal hoặc game, cái nào trước).
 */
export function createGameTracker(slug: string) {
  let opened = false;
  let count = 0;
  let errors = 0;
  return {
    /** iframe tải xong (onLoad). */
    frameLoaded(loadMs: number) {
      if (opened) return;
      opened = true;
      track('game_open', { load_ms: loadMs }, slug);
    },
    fromGame(event: unknown, params: unknown) {
      const clean = sanitizeTrack(event, params);
      if (!clean || ++count > 200) return;
      if (clean.event === 'game_open') { if (opened) return; opened = true; }
      if (clean.event === 'game_error' && ++errors > MAX_ERRORS_PER_SESSION) return;
      enqueue(clean.event, { ...clean.params, game_id: slug });
    },
  };
}

/* ---------------------------------------------------------------- Banner cookie */

/** Người chơi chọn trên banner. Lưu localStorage + cookie `zozo_consent` (dùng chung với game trên *.zozo.bio). */
export function setConsent(value: Consent) {
  consent = value;
  try { localStorage.setItem(CONSENT_KEY, value); } catch { /* Storage bị chặn. */ }
  writeConsentCookie(value);
  if (gtag) {
    gtag('consent', 'update', { analytics_storage: value });
    loadGtagScript(MEASUREMENT_ID);
  }
  listeners.forEach((cb) => cb());
}

/** Mở lại banner (link "Cookie" ở footer). */
export function reopenConsent() {
  consent = null;
  listeners.forEach((cb) => cb());
}

const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
/** true = cần hiện banner (có mã GA, đã khởi động, chưa chọn). */
export const useConsentPending = () => useSyncExternalStore(subscribe, () => analyticsEnabled && !!gtag && consent === null, () => false);
