'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/hooks/use-locale';
import { releaseGoogle, setupGoogle } from '@/lib/zozo/google';

/** Nút "Sign in with Google" chính thức + One Tap. Chỉ dùng ở trang / hộp thoại đăng nhập. */
export function GoogleButton({ clientId, onCredential, onError }: { clientId: string; onCredential: (credential: string) => void; onError: () => void }) {
  const { locale } = useT();
  const box = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onCredential, onError });
  useEffect(() => { callbacks.current = { onCredential, onError }; });
  // Một hàm cố định cho cả vòng đời component (GIS giữ một callback chung cho trang).
  const [handle] = useState(() => (credential: string) => callbacks.current.onCredential(credential));

  // Nút vẽ lại khi đổi ngôn ngữ.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let alive = true;
    setupGoogle(clientId, handle)
      .then((id) => {
        if (!alive) return;
        el.replaceChildren();
        id.renderButton(el, { type: 'standard', theme: 'filled_black', size: 'large', text: 'continue_with', shape: 'pill', logo_alignment: 'center', width: Math.min(400, Math.max(220, el.clientWidth)), locale });
      })
      .catch(() => { if (alive) callbacks.current.onError(); });
    return () => { alive = false; };
  }, [clientId, locale, handle]);

  // One Tap: hiện một lần khi mở trang / hộp thoại đăng nhập.
  useEffect(() => {
    let alive = true;
    setupGoogle(clientId, handle).then((id) => { if (alive) id.prompt(); }).catch(() => {});
    return () => { alive = false; releaseGoogle(handle); };
  }, [clientId, handle]);

  return <div className="gsi-box" ref={box} />;
}
