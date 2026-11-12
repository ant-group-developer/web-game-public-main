'use client';

import { useEffect, useId, useRef } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { PlayerAvatar } from '@/components/player-avatar';
import { useT } from '@/hooks/use-locale';
import { startSession } from '@/lib/zozo/session';
import { answerGuestChoice, closeAuthDialog, hideToast, useAuthDialog, useGuestChoice, useToast } from '@/lib/zozo/ui';
import { AuthForm } from './auth-form';

/** Gắn một lần trong layout: kiểm tra phiên khi trang chạy trên trình duyệt, hộp thoại đăng nhập, thông báo nhỏ. */
export function AuthRoot() {
  useEffect(() => { startSession(); }, []);
  return (
    <>
      <AuthDialog />
      <GuestChoiceDialog />
      <AuthToast />
    </>
  );
}

/** Hộp thoại đăng nhập (mở từ header hoặc từ game trong iframe qua `zozo:login`). */
function AuthDialog() {
  const { t } = useT();
  const request = useAuthDialog();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (request && !el.open) el.showModal();
    if (!request && el.open) el.close();
  }, [request]);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); closeAuthDialog(false); }}
      onClick={(event) => { if (event.target === event.currentTarget) closeAuthDialog(false); }}
    >
      {request && (
        <div className="modal-body">
          <button type="button" className="modal-close" onClick={() => closeAuthDialog(false)} aria-label={t('auth.close')}><X size={20} /></button>
          <AuthForm key={request.id} initialMode={request.mode} titleId={titleId} onSuccess={() => closeAuthDialog(true)} />
        </div>
      )}
    </dialog>
  );
}

/** Đang là khách mà đăng nhập / đăng ký: gộp tiến trình của khách vào tài khoản hay dùng riêng. */
function GuestChoiceDialog() {
  const { t } = useT();
  const request = useGuestChoice();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (request && !el.open) el.showModal();
    if (!request && el.open) el.close();
  }, [request]);

  const info = request?.info;
  const accountName = info?.account.displayName || '';
  return (
    <dialog
      ref={ref}
      className="modal modal-choice"
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); answerGuestChoice(null); }}
      onClick={(event) => { if (event.target === event.currentTarget) answerGuestChoice(null); }}
    >
      {info && (
        <div className="modal-body">
          <button type="button" className="modal-close" onClick={() => answerGuestChoice(null)} aria-label={t('auth.close')}><X size={20} /></button>
          <h2 className="auth-title" id={titleId}>{t('choice.title')}</h2>
          <div className="choice-pair">
            <div className="choice-who">
              <PlayerAvatar player={{ id: info.guest.id, displayName: info.guest.name, avatarUrl: null }} size={44} />
              <strong>{info.guest.name}</strong>
              <span>{t('auth.guest')} · {info.guest.code}</span>
            </div>
            <ArrowRight className="choice-arrow" size={20} strokeWidth={2.6} aria-hidden="true" />
            <div className="choice-who">
              <PlayerAvatar player={{ id: accountName || 'new', displayName: accountName || '+', avatarUrl: info.account.exists ? info.account.avatarUrl : null }} size={44} />
              <strong>{accountName || t(info.account.exists ? 'auth.account' : 'choice.newAccount')}</strong>
              {accountName && <span>{t(info.account.exists ? 'auth.account' : 'choice.newAccount')}</span>}
            </div>
          </div>
          <div className="choice-actions">
            <button type="button" className="play-button auth-submit" onClick={() => answerGuestChoice('merge')}><span>{t('choice.merge')}</span></button>
            <button type="button" className="choice-secondary" onClick={() => answerGuestChoice('separate')}>{t('choice.separate')}</button>
          </div>
        </div>
      )}
    </dialog>
  );
}

function AuthToast() {
  const { t } = useT();
  const toast = useToast();
  if (!toast) return null;
  return (
    <div className="toast" role="status" key={toast.id}>
      <span>{t(toast.key, toast.values)}</span>
      <button type="button" onClick={hideToast} aria-label={t('auth.close')}><X size={16} /></button>
    </div>
  );
}
