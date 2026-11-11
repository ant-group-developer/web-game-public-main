'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown, CloudUpload, LogIn, LogOut, UserRound } from 'lucide-react';
import { useT } from '@/hooks/use-locale';
import { logout, useZozo } from '@/lib/zozo/session';
import { openAuthDialog } from '@/lib/zozo/ui';
import { PlayerAvatar } from './player-avatar';

/** Góc phải header: chưa có phiên → "Đăng nhập"; khách → "Lưu tiến trình" + avatar; tài khoản → avatar + tên. */
export function AccountMenu() {
  const { t } = useT();
  const { ready, player } = useZozo();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onPointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); button.current?.focus(); } };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [open]);

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Tab') { setOpen(false); return; }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === 'ArrowDown' ? (current + 1) % items.length : (current - 1 + items.length) % items.length;
    items[next]?.focus();
  }

  const openDialog = (mode: 'login' | 'register') => { setOpen(false); void openAuthDialog(mode); };

  if (!ready) return <span className="account-skel" aria-hidden="true" />;

  if (!player) {
    return (
      <a href="/dang-nhap" className="account-login" onClick={(e) => { e.preventDefault(); openDialog('login'); }}>
        <LogIn size={17} strokeWidth={2.4} aria-hidden="true" />
        <span className="account-login-text">{t('auth.login')}</span>
      </a>
    );
  }

  return (
    <div className="account" ref={root}>
      {player.isGuest && (
        <button type="button" className="account-save" onClick={() => openDialog('register')} aria-label={t('auth.saveProgress')} title={t('auth.saveProgress')}>
          <CloudUpload size={17} strokeWidth={2.4} aria-hidden="true" />
          <span className="account-save-text">{t('auth.saveProgress')}</span>
        </button>
      )}
      <button
        ref={button}
        type="button"
        className="account-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t('auth.account')}: ${player.displayName}`}
        onClick={() => setOpen((v) => !v)}
      >
        <PlayerAvatar player={player} size={30} />
        <span className="account-name">{player.displayName}</span>
        <ChevronDown className="lang-chevron" size={16} strokeWidth={2.6} aria-hidden="true" />
      </button>
      {open && (
        <div className="lang-menu account-menu" role="menu" aria-label={t('auth.account')} onKeyDown={onMenuKeyDown}>
          <div className="account-head">
            <strong>{player.displayName}</strong>
            <span>{player.isGuest ? t('auth.guest') : player.email ?? ''} · {player.code}</span>
          </div>
          <Link role="menuitem" tabIndex={-1} href="/ho-so" onClick={() => setOpen(false)}><UserRound size={17} aria-hidden="true" />{t('auth.profile')}</Link>
          {player.isGuest ? (
            <button type="button" role="menuitem" tabIndex={-1} onClick={() => openDialog('login')}><LogIn size={17} aria-hidden="true" />{t('auth.login')}</button>
          ) : (
            <button type="button" role="menuitem" tabIndex={-1} onClick={() => { setOpen(false); void logout(); }}><LogOut size={17} aria-hidden="true" />{t('auth.logout')}</button>
          )}
        </div>
      )}
    </div>
  );
}
