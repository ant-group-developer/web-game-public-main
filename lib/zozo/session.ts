'use client';

import { useSyncExternalStore } from 'react';
import { createSession, ZozoError, type AuthResult, type Session, type SessionState, type ZozoPlayer } from '@/packages/zozo-sdk/src/core';
import { readLocale } from '@/hooks/use-locale';
import { ZOZO_API_BASE } from './config';
import { askGuestChoice, showToast, type GuestChoiceInfo } from './ui';

/**
 * Phiên ZOZO ID của portal (chỉ chạy trên trình duyệt). Vào trang chỉ refresh phiên có sẵn — KHÔNG tạo khách;
 * khách chỉ được tạo khi game trong iframe xin token (xem use-zozo-bridge).
 */
let instance: Session | null = null;
export function getSession(): Session {
  if (!instance) instance = createSession({ apiBase: ZOZO_API_BASE });
  return instance;
}

const SERVER_STATE: SessionState = { player: null, ready: false, rev: 0 };
const subscribe = (cb: () => void) => getSession().subscribe(cb);

export function useZozo(): SessionState {
  return useSyncExternalStore(subscribe, () => getSession().state, () => SERVER_STATE);
}

let started = false;
/** Gọi một lần khi app chạy trên trình duyệt. */
export function startSession() {
  if (started) return;
  started = true;
  void getSession().refresh().catch(() => {});
}

/** Đăng nhập khi đang là khách: API hỏi trước gộp khách vào tài khoản hay dùng riêng (chưa đăng nhập, chưa đặt cookie). */
type LoginResult = AuthResult | { choiceRequired: GuestChoiceInfo };
const isChoice = (r: LoginResult): r is { choiceRequired: GuestChoiceInfo } => !!r && typeof r === 'object' && 'choiceRequired' in r && !!r.choiceRequired;

function signedIn(result: AuthResult) {
  const s = getSession();
  s.apply(result);
  s.changed();
  if (result.mergedGuest?.name) showToast('auth.merged', { name: result.mergedGuest.name });
  return result;
}

/**
 * register / login / google-credential. API trả `choiceRequired` → hỏi người chơi rồi gửi lại đúng request đó
 * kèm `guestChoice`. Đóng hộp thoại → ZozoError `cancelled` (không đăng nhập).
 */
async function authenticate(path: string, body: Record<string, unknown>): Promise<AuthResult> {
  const s = getSession();
  const first = await s.request<LoginResult>(path, { method: 'POST', body, auth: 'optional' });
  if (!isChoice(first)) return signedIn(first);
  const guestChoice = await askGuestChoice(first.choiceRequired);
  if (!guestChoice) throw new ZozoError(0, 'cancelled', 'Cancelled');
  const second = await s.request<LoginResult>(path, { method: 'POST', body: { ...body, guestChoice }, auth: 'optional' });
  if (isChoice(second)) throw new ZozoError(0, 'error', 'Unexpected choiceRequired');
  return signedIn(second);
}

export const loginWithPassword = (email: string, password: string) => authenticate('/auth/login', { email, password });

export function register(email: string, password: string, displayName?: string) {
  return authenticate('/auth/register', { email, password, lang: readLocale(), ...(displayName ? { displayName } : {}) });
}

/** ID token từ Google Identity Services → phiên ZOZO. Cùng `credential` được gửi lại khi phải hỏi gộp khách. */
export const loginWithGoogle = (credential: string) => authenticate('/auth/google/credential', { credential });
export const logout = () => getSession().logout();

export const forgotPassword = (email: string) =>
  getSession().request('/auth/forgot', { method: 'POST', body: { email, lang: readLocale() } });

export async function resetPassword(token: string, password: string) {
  await getSession().request('/auth/reset', { method: 'POST', body: { token, password } });
  // API thu hồi mọi phiên của người chơi → phiên trong trình duyệt này cũng hết.
  const s = getSession();
  if (s.state.player) { s.clear(); s.changed(); }
}

export async function updateDisplayName(displayName: string) {
  const player = await getSession().request<ZozoPlayer>('/me', { method: 'PATCH', body: { displayName }, auth: 'required' });
  getSession().setPlayer(player);
  return player;
}

let configPromise: Promise<{ googleClientId: string | null }> | null = null;
/** Cấu hình đăng nhập công khai (`googleClientId` null = chưa bật Google). */
export function getAuthConfig() {
  configPromise ??= getSession()
    .request<{ googleClientId?: string | null }>('/auth/config')
    .then((c) => ({ googleClientId: c?.googleClientId || null }))
    .catch(() => { configPromise = null; return { googleClientId: null }; });
  return configPromise;
}
