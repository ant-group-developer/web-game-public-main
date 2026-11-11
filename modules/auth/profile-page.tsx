'use client';

import { useState, type FormEvent } from 'react';
import { CloudUpload, LogIn, LogOut } from 'lucide-react';
import type { MessageKey } from '@/constants/i18n';
import { PlayerAvatar } from '@/components/player-avatar';
import { useT } from '@/hooks/use-locale';
import type { ZozoPlayer } from '@/packages/zozo-sdk/src/core';
import { errorKey } from '@/lib/zozo/errors';
import { logout, updateDisplayName, useZozo } from '@/lib/zozo/session';
import { openAuthDialog } from '@/lib/zozo/ui';
import { Field } from './auth-form';

/** /ho-so — tên hiển thị, email, mã người chơi. */
export function ProfilePage() {
  const { t } = useT();
  const { ready, player } = useZozo();

  let body;
  if (!ready) body = <span className="spinner" aria-hidden="true" />;
  else if (!player) {
    body = (
      <div className="auth auth-signed">
        <p>{t('profile.noSession')}</p>
        <button type="button" className="play-button auth-submit" onClick={() => void openAuthDialog('login')}><LogIn size={18} aria-hidden="true" /><span>{t('auth.login')}</span></button>
      </div>
    );
  } else body = <ProfileForm key={player.id} player={player} />;

  return <div className="page auth-page"><div className="auth-card">{body}</div></div>;
}

function ProfileForm({ player }: { player: ZozoPlayer }) {
  const { t } = useT();
  const [name, setName] = useState(player.displayName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ key: MessageKey; error: boolean } | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    const value = name.trim();
    if (busy || value === player.displayName) return;
    if (value.length < 2 || value.length > 24) { setMessage({ key: 'err.name', error: true }); return; }
    setBusy(true);
    setMessage(null);
    try {
      const next = await updateDisplayName(value);
      setName(next.displayName);
      setMessage({ key: 'profile.saved', error: false });
    } catch (err) {
      setMessage({ key: errorKey(err), error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="profile-head">
        <PlayerAvatar player={player} size={64} />
        <div>
          <h1 className="auth-title">{player.displayName}</h1>
          <p className="profile-meta">{player.isGuest ? t('auth.guest') : player.email}</p>
        </div>
      </div>

      <form className="auth-form" onSubmit={save} noValidate>
        <Field label={t('profile.name')}>
          <input type="text" name="nickname" autoComplete="nickname" value={name} onChange={(e) => { setName(e.target.value); setMessage(null); }} maxLength={24} required />
        </Field>
        {message && <p className={message.error ? 'auth-error' : 'auth-ok'} role={message.error ? 'alert' : 'status'}>{t(message.key)}</p>}
        <button type="submit" className="play-button auth-submit" disabled={busy || name.trim() === player.displayName}>
          {busy ? <span className="spinner spinner-sm" aria-hidden="true" /> : <span>{t('profile.save')}</span>}
        </button>
      </form>

      <dl className="profile-list">
        {player.email && <div><dt>{t('auth.email')}</dt><dd>{player.email}</dd></div>}
        <div><dt>{t('profile.code')}</dt><dd><code>{player.code}</code></dd></div>
      </dl>

      {player.isGuest ? (
        <>
          <p className="auth-note">{t('profile.guest')}</p>
          <button type="button" className="play-button auth-submit" onClick={() => void openAuthDialog('register')}><CloudUpload size={18} aria-hidden="true" /><span>{t('auth.saveProgress')}</span></button>
        </>
      ) : (
        <button type="button" className="auth-link auth-link-icon" onClick={() => void logout()}><LogOut size={16} aria-hidden="true" />{t('auth.logout')}</button>
      )}
    </div>
  );
}
