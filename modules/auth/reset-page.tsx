'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { MessageKey } from '@/constants/i18n';
import { useT } from '@/hooks/use-locale';
import { errorKey } from '@/lib/zozo/errors';
import { resetPassword } from '@/lib/zozo/session';
import { Field } from './auth-form';

/** /dat-lai-mat-khau?token= — link trong email "Quên mật khẩu". */
export function ResetPasswordPage() {
  const { t } = useT();
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(token.length < 20 ? 'err.invalidLink' : null);
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || token.length < 20) return;
    if (password.length < 8) { setError('err.passwordShort'); return; }
    if (password !== again) { setError('err.passwordMismatch'); return; }
    setBusy(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(errorKey(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <div className="auth">
          <h1 className="auth-title">{t('reset.title')}</h1>
          {done ? (
            <>
              <p className="auth-note" role="status">{t('reset.ok')}</p>
              <Link className="play-button auth-submit" href="/dang-nhap"><span>{t('auth.login')}</span></Link>
            </>
          ) : (
            <form className="auth-form" onSubmit={submit} noValidate>
              <input type="text" name="username" autoComplete="username" hidden readOnly value="" />
              <Field label={t('auth.passwordNew')}>
                <input type="password" name="new-password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordHint')} maxLength={200} disabled={token.length < 20} required />
              </Field>
              <Field label={t('auth.passwordAgain')}>
                <input type="password" name="confirm-password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} maxLength={200} disabled={token.length < 20} required />
              </Field>
              {error && <p className="auth-error" role="alert">{t(error)}</p>}
              <button type="submit" className="play-button auth-submit" disabled={busy || token.length < 20}>
                {busy ? <span className="spinner spinner-sm" aria-hidden="true" /> : <span>{t('reset.submit')}</span>}
              </button>
              {error === 'err.invalidLink' && <Link className="auth-link" href="/quen-mat-khau">{t('auth.forgot')}</Link>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
