'use client';

import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import type { MessageKey } from '@/constants/i18n';
import { useT } from '@/hooks/use-locale';
import { errorKey } from '@/lib/zozo/errors';
import { ZozoError } from '@/packages/zozo-sdk/src/core';
import { forgotPassword, getAuthConfig, loginWithGoogle, loginWithPassword, register } from '@/lib/zozo/session';
import type { AuthMode } from '@/lib/zozo/ui';
import { GoogleButton } from './google-button';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Đăng nhập: Google là chính (nút chính thức + One Tap); email/mật khẩu nằm gọn dưới "Hoặc dùng email".
 * Chưa bật Google (API trả googleClientId null) → chỉ hiện form email.
 */
export function AuthForm({ initialMode = 'login', onSuccess, onStart, titleId }: { initialMode?: AuthMode; onSuccess: () => void; onStart?: () => void; titleId?: string }) {
  const { t } = useT();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [clientId, setClientId] = useState<string | null | undefined>(undefined);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [sent, setSent] = useState(false);
  const ids = useId();

  useEffect(() => {
    let alive = true;
    void getAuthConfig().then((config) => { if (alive) setClientId(config.googleClientId); });
    return () => { alive = false; };
  }, []);

  const emailOpen = showEmail || clientId === null;

  async function run(task: () => Promise<unknown>, done: () => void = onSuccess) {
    setBusy(true);
    setError(null);
    onStart?.();
    try {
      await task();
      done();
    } catch (err) {
      // Đóng hộp thoại "Gộp tiến trình?" = huỷ, không báo lỗi.
      if (!(err instanceof ZozoError && err.code === 'cancelled')) setError(errorKey(err));
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
    setSent(false);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const mail = email.trim();
    if (!EMAIL.test(mail)) { setError('err.email'); return; }
    if (mode === 'forgot') { void run(() => forgotPassword(mail), () => setSent(true)); return; }
    if (mode === 'register') {
      if (password.length < 8) { setError('err.passwordShort'); return; }
      const display = name.trim();
      if (display && (display.length < 2 || display.length > 24)) { setError('err.name'); return; }
      void run(() => register(mail, password, display || undefined));
      return;
    }
    if (!password) { setError('err.invalidCredentials'); return; }
    void run(() => loginWithPassword(mail, password));
  }

  const title = mode === 'forgot' ? t('auth.forgotTitle') : initialMode === 'register' ? t('auth.saveProgress') : t('auth.login');
  const errorLine = error && <p className="auth-error" role="alert">{t(error)}</p>;
  const emailField = (
    <Field label={t('auth.email')}>
      <input type="email" name="email" autoComplete={mode === 'login' ? 'username' : 'email'} inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} required />
    </Field>
  );

  if (mode === 'forgot') {
    return (
      <div className="auth">
        <h1 className="auth-title" id={titleId}>{title}</h1>
        {sent ? (
          <p className="auth-note" role="status">{t('auth.forgotSent')}</p>
        ) : (
          <form className="auth-form" onSubmit={submit} noValidate>
            {emailField}
            {errorLine}
            <button type="submit" className="play-button auth-submit" disabled={busy}>{busy ? <span className="spinner spinner-sm" aria-hidden="true" /> : <span>{t('auth.forgotSend')}</span>}</button>
          </form>
        )}
        <button type="button" className="auth-link" onClick={() => switchMode('login')}>{t('auth.back')}</button>
      </div>
    );
  }

  return (
    <div className="auth">
      <h1 className="auth-title" id={titleId}>{title}</h1>
      {clientId === undefined && <div className="gsi-box" aria-hidden="true" />}
      {clientId && <GoogleButton clientId={clientId} onCredential={(credential) => void run(() => loginWithGoogle(credential))} onError={() => setError('err.googleOff')} />}
      {!emailOpen && errorLine}
      {clientId && (
        <button type="button" className="auth-more" aria-expanded={emailOpen} aria-controls={`${ids}-email`} onClick={() => setShowEmail((v) => !v)}>
          <span>{t('auth.useEmail')}</span>
          <ChevronDown size={16} strokeWidth={2.6} aria-hidden="true" />
        </button>
      )}
      {emailOpen && (
        <form className="auth-form" id={`${ids}-email`} onSubmit={submit} noValidate>
          <div className="auth-tabs" role="tablist">
            {(['login', 'register'] as const).map((tab) => (
              <button key={tab} type="button" role="tab" aria-selected={mode === tab} onClick={() => switchMode(tab)}>{t(tab === 'login' ? 'auth.login' : 'auth.register')}</button>
            ))}
          </div>
          {emailField}
          <Field
            label={t('auth.password')}
            after={(
              <button type="button" className="field-eye" onClick={() => setReveal((v) => !v)} aria-label={t(reveal ? 'auth.hidePassword' : 'auth.showPassword')} aria-pressed={reveal}>
                {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
          >
            <input type={reveal ? 'text' : 'password'} name="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'register' ? t('auth.passwordHint') : undefined} maxLength={200} required />
          </Field>
          {mode === 'register' && (
            <Field label={t('auth.name')}>
              <input type="text" name="nickname" autoComplete="nickname" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} />
            </Field>
          )}
          {errorLine}
          <button type="submit" className="play-button auth-submit" disabled={busy}>
            {busy ? <span className="spinner spinner-sm" aria-hidden="true" /> : <span>{t(mode === 'login' ? 'auth.login' : 'auth.register')}</span>}
          </button>
          {mode === 'login' && <button type="button" className="auth-link" onClick={() => switchMode('forgot')}>{t('auth.forgot')}</button>}
        </form>
      )}
    </div>
  );
}

/** Ô nhập có nhãn. `after` (vd nút hiện mật khẩu) nằm ngoài <label> để không lẫn vào tên của ô. */
export function Field({ label, children, after }: { label: string; children: ReactNode; after?: ReactNode }) {
  return (
    <div className="field">
      <label className="field-wrap">
        <span className="field-label">{label}</span>
        <span className="field-box">{children}</span>
      </label>
      {after}
    </div>
  );
}
