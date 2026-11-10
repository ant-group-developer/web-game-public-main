'use client';

import { useEffect } from 'react';

/**
 * Đếm lượt chơi (định nghĩa trong docs/PLAN_CATEGORIES_SORT_STATS.md):
 * - 1 lượt = khung game đã tải và tab đang hiển thị ≥ 10 giây (cộng dồn, ẩn tab thì dừng đếm).
 * - Sau đó cứ 30 giây hiển thị gửi heartbeat; rời trang / ẩn tab thì gửi phần còn lại bằng sendBeacon.
 * - visitorId: chuỗi ngẫu nhiên trong localStorage (không phải dữ liệu cá nhân); API chỉ lưu dạng hash.
 * Mọi request đi qua /api/play (cùng domain). Lỗi mạng bỏ qua — không ảnh hưởng việc chơi.
 */
const START_AFTER_S = 10;
const BEAT_EVERY_S = 30;
const VISITOR_KEY = 'ant-visitor';

function visitorId() {
  try {
    const saved = localStorage.getItem(VISITOR_KEY);
    if (saved && /^[A-Za-z0-9_-]{8,64}$/.test(saved)) return saved;
    const id = crypto.randomUUID().replace(/-/g, '');
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID().replace(/-/g, ''); // Storage bị chặn: mỗi lần mở trang là một người mới.
  }
}

function referrerHost() {
  try {
    const host = document.referrer ? new URL(document.referrer).hostname : '';
    return host && host !== window.location.hostname ? host : '';
  } catch {
    return '';
  }
}

function post(body: object, beacon = false) {
  const json = JSON.stringify(body);
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon('/api/play', new Blob([json], { type: 'text/plain' }));
    return Promise.resolve(null);
  }
  return fetch('/api/play', { method: 'POST', headers: { 'content-type': 'application/json' }, body: json, keepalive: true })
    .then((res) => (res.ok && res.status !== 204 ? res.json() : null))
    .catch(() => null) as Promise<{ sessionId?: string | null } | null>;
}

export function usePlayTracking(slug: string, active: boolean) {
  useEffect(() => {
    if (!active) return;
    let visibleMs = 0; // thời gian hiển thị chưa gửi
    let since = document.visibilityState === 'visible' ? performance.now() : null;
    let sessionId: string | null = null;
    let starting = false;
    let stopped = false;

    const take = () => {
      if (since !== null) {
        const now = performance.now();
        visibleMs += now - since;
        since = now;
      }
      return visibleMs;
    };

    const flush = (beacon: boolean) => {
      const ms = take();
      if (!sessionId || ms < 1000) return;
      const seconds = Math.min(60, Math.round(ms / 1000));
      visibleMs = Math.max(0, ms - seconds * 1000);
      void post({ action: 'beat', sessionId, seconds }, beacon);
    };

    const tick = () => {
      if (stopped) return;
      const ms = take();
      if (!sessionId && !starting && ms >= START_AFTER_S * 1000) {
        starting = true;
        const seconds = Math.round(ms / 1000);
        visibleMs = 0;
        const device = window.matchMedia('(pointer: coarse)').matches ? 'mobile' : 'desktop';
        void post({ action: 'start', slug, visitorId: visitorId(), seconds, referrerHost: referrerHost(), device }).then((res) => {
          starting = false;
          if (res?.sessionId && !stopped) sessionId = res.sessionId;
        });
      } else if (sessionId && ms >= BEAT_EVERY_S * 1000) {
        flush(false);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        since = performance.now();
      } else {
        take();
        since = null;
        flush(true);
      }
    };
    const onPageHide = () => flush(true);

    const timer = window.setInterval(tick, 1000);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      flush(true); // rời game (chuyển trang trong portal)
    };
  }, [slug, active]);
}
