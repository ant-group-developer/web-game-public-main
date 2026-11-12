'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { PlayerAvatar } from '@/components/player-avatar';
import { useT } from '@/hooks/use-locale';
import { goTo, resolveReturnTo } from '@/lib/zozo/return-to';
import { logout, useZozo } from '@/lib/zozo/session';
import type { AuthMode } from '@/lib/zozo/ui';
import { AuthForm } from './auth-form';

/** /dang-nhap (?tab=dang-ky, ?returnTo=) và /quen-mat-khau. Xong thì quay về returnTo (mặc định trang chủ). */
export function LoginPage({ mode = 'login' }: { mode?: AuthMode }) {
  const { t } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const { ready, player } = useZozo();
  // Đang đăng nhập trong form: không đổi sang thẻ "Đang đăng nhập" trước khi chuyển trang.
  const [authing, setAuthing] = useState(false);
  const initialMode: AuthMode = mode === 'login' && params.get('tab') === 'dang-ky' ? 'register' : mode;
  const done = () => goTo(resolveReturnTo(params.get('returnTo')), (href) => router.replace(href));

  let body;
  if (!ready) body = <span className="spinner" aria-hidden="true" />;
  else if (player && !player.isGuest && !authing && mode !== 'forgot') {
    body = (
      <div className="auth auth-signed">
        <PlayerAvatar player={player} size={56} />
        <p>{t('auth.signedInAs', { name: player.displayName })}</p>
        <button type="button" className="play-button auth-submit" onClick={done}><span>{t('auth.continue')}</span></button>
        <button type="button" className="auth-link" onClick={() => void logout()}>{t('auth.logout')}</button>
      </div>
    );
  } else body = <AuthForm initialMode={initialMode} onStart={() => setAuthing(true)} onSuccess={done} />;

  return <div className="page auth-page"><div className="auth-card">{body}</div></div>;
}
