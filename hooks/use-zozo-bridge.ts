'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { authSignature, isTrustedOrigin, ZozoError } from '@/packages/zozo-sdk/src/core';
import { allowLocalOrigins } from '@/lib/zozo/return-to';
import { getSession, logout } from '@/lib/zozo/session';
import { openAuthDialog } from '@/lib/zozo/ui';

/**
 * Cầu nối ZOZO ID giữa portal và game trong iframe (SDK `packages/zozo-sdk`).
 * Chỉ nhận message từ đúng iframe này, origin `https://*.zozo.bio` (dev / portal chạy localhost: thêm http://localhost:*).
 *
 * Game → portal:
 *   { type: 'zozo:token-request', id }  → portal trả { type: 'zozo:token', id, accessToken, expiresIn, player }
 *                                          hoặc { type: 'zozo:token', id, error, status }. Chưa có phiên thì tạo khách.
 *   { type: 'zozo:login', mode? }       → mở hộp thoại đăng nhập trên game; đóng mà không đăng nhập → { type: 'zozo:login-cancel' }
 *   { type: 'zozo:logout' }             → portal đăng xuất
 *   { type: 'zozo:track', event, params } → sự kiện GA4, portal kiểm tra lại rồi gửi bằng gtag của portal (không trả lời)
 * Portal → game:
 *   { type: 'zozo:auth-changed' }       → người chơi đã đổi (đăng nhập, đăng ký, đăng xuất, đổi tên…): game xin token lại.
 *
 * Portal là nơi duy nhất refresh phiên khi game nằm trong portal (API xoay refresh token mỗi lần dùng,
 * hai bên cùng refresh một lúc sẽ làm mất phiên).
 */
export function useZozoBridge(
  iframe: RefObject<HTMLIFrameElement | null>,
  frameOrigin: string | null,
  /** `{type:'zozo:track', event, params}` từ game (đo lường GA4, không trả lời). */
  onTrack?: (event: unknown, params: unknown) => void,
) {
  const trackRef = useRef(onTrack);
  useEffect(() => { trackRef.current = onTrack; });

  useEffect(() => {
    const session = getSession();
    const allowLocal = allowLocalOrigins();
    // Origin thật của game: lấy từ message đã kiểm tra; trước đó dùng origin của src iframe.
    let origin = frameOrigin && isTrustedOrigin(frameOrigin, allowLocal) ? frameOrigin : null;
    // Phiên mà game đã biết (lần trả token gần nhất) — chỉ báo auth-changed khi khác.
    let delivered = authSignature(session.state);
    let queued = false;
    // Game chưa dùng SDK (chưa gửi message nào) thì không cần báo.
    let talked = false;

    const onMessage = (event: MessageEvent) => {
      const win = iframe.current?.contentWindow;
      if (!win || event.source !== win || !isTrustedOrigin(event.origin, allowLocal)) return;
      const data = event.data as { type?: unknown; id?: unknown; mode?: unknown; event?: unknown; params?: unknown } | null;
      if (!data || typeof data !== 'object' || typeof data.type !== 'string' || !data.type.startsWith('zozo:')) return;
      if (data.type === 'zozo:track') { trackRef.current?.(data.event, data.params); return; }
      origin = event.origin;
      talked = true;
      const reply = (message: Record<string, unknown>) => win.postMessage(message, event.origin);

      switch (data.type) {
        case 'zozo:token-request': {
          const id = typeof data.id === 'string' ? data.id.slice(0, 64) : '';
          session
            .ensure({ guest: true })
            .then((result) => {
              if (!result) throw new ZozoError(401, 'unauthorized', 'No session');
              delivered = authSignature(session.state);
              reply({ type: 'zozo:token', id, accessToken: result.accessToken, expiresIn: result.expiresIn, player: result.player });
            })
            .catch((error: unknown) => {
              const e = error instanceof ZozoError ? error : new ZozoError(0, 'error', String(error));
              reply({ type: 'zozo:token', id, error: e.code, status: e.status });
            });
          break;
        }
        case 'zozo:login':
          void openAuthDialog(data.mode === 'register' ? 'register' : 'login').then((changed) => {
            if (!changed) reply({ type: 'zozo:login-cancel' });
          });
          break;
        case 'zozo:logout':
          void logout();
          break;
      }
    };

    const unsubscribe = session.subscribe(() => {
      // Gộp các lần đổi liên tiếp (apply + changed) thành một message.
      if (queued) return;
      queued = true;
      setTimeout(() => {
        queued = false;
        const signature = authSignature(session.state);
        if (!talked || signature === delivered || !session.state.ready) return;
        delivered = signature;
        const win = iframe.current?.contentWindow;
        if (win && origin) win.postMessage({ type: 'zozo:auth-changed' }, origin);
      }, 0);
    });

    window.addEventListener('message', onMessage);
    return () => { window.removeEventListener('message', onMessage); unsubscribe(); };
  }, [iframe, frameOrigin]);
}
