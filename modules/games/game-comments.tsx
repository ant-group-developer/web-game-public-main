'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ChevronDown, Flag, Pencil, ThumbsUp, Trash2, X } from 'lucide-react';
import type { Game } from '@/types/game';
import type { Locale, MessageKey } from '@/constants/i18n';
import { PlayerAvatar } from '@/components/player-avatar';
import { useT } from '@/hooks/use-locale';
import { timeAgo } from '@/helpers/games';
import { COMMENT_MAX_LENGTH, CommentError, commentsApi, type CommentSort, type PublicComment, type ReportReason } from '@/lib/zozo/comments';
import { useZozo } from '@/lib/zozo/session';
import { openAuthDialog } from '@/lib/zozo/ui';

type T = (key: MessageKey, values?: Record<string, string>) => string;

/** "vừa xong" / "5 phút trước" / "3 giờ trước", rồi tới ngày / tuần… như phần còn lại của trang. */
function ago(iso: string, t: T) {
  const diff = Date.now() - Date.parse(iso);
  if (diff < 60_000) return t('time.justNow');
  if (diff < 3_600_000) return t('time.minutesAgo', { count: String(Math.floor(diff / 60_000)) });
  if (diff < 86_400_000) return t('time.hoursAgo', { count: String(Math.floor(diff / 3_600_000)) });
  return timeAgo(iso, t);
}

/** "14:15 12/11" (vi) · "12/11 14:15" (en) — giờ máy người xem. */
const timeFmt = (iso: string, locale: Locale) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  const time = `${p(d.getHours())}:${p(d.getMinutes())}`;
  return locale === 'vi' ? `${time} ${p(d.getDate())}/${p(d.getMonth() + 1)}` : `${p(d.getMonth() + 1)}/${p(d.getDate())} ${time}`;
};

/** Lỗi API → câu hiện cho người chơi (bị chặn: kèm thời gian còn lại). */
function errorText(e: unknown, t: T, locale: Locale) {
  if (!(e instanceof CommentError)) return t('cmt.errGeneric');
  switch (e.code) {
    case 'comment_blocked':
      return e.permanent || !e.until ? t('cmt.errBlockedForever') : t('cmt.errBlocked', { time: timeFmt(e.until, locale) });
    case 'comment_rejected':
      return e.until ? `${t('cmt.errRejected')}. ${t('cmt.errBlocked', { time: timeFmt(e.until, locale) })}` : e.permanent ? `${t('cmt.errRejected')}. ${t('cmt.errBlockedForever')}` : t('cmt.errRejected');
    case 'too_many_requests':
      return t('cmt.errTooFast', { minutes: String(Math.max(1, Math.ceil((e.retryAfter ?? 60) / 60))) });
    case 'duplicate_content':
      return t('cmt.errDuplicate');
    case 'player_banned':
      return t('cmt.errBanned');
    case 'edit_window_passed':
      return t('cmt.errEditWindow');
    default:
      return t('cmt.errGeneric');
  }
}

/** Cập nhật một bình luận (gốc hoặc trả lời) trong danh sách. */
const patchTree = (items: PublicComment[], id: string, fn: (c: PublicComment) => PublicComment | null): PublicComment[] =>
  items.flatMap((c) => {
    if (c.id === id) {
      const next = fn(c);
      return next ? [next] : [];
    }
    if (!c.replies?.some((r) => r.id === id)) return [c];
    const replies = patchTree(c.replies, id, fn);
    return [{ ...c, replies, replyCount: replies.filter((r) => !r.pending).length }];
  });

/** Bình luận thật (ZOZO ID): đọc công khai, viết được cả khi là khách; lọc từ / chờ duyệt / chặn do API quyết định. */
export function GameComments({ game }: { game: Game }) {
  const { t, locale } = useT();
  const zozo = useZozo();
  const me = zozo.player;
  const [sort, setSort] = useState<CommentSort>('top');
  const [items, setItems] = useState<PublicComment[]>([]);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [more, setMore] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<{ rootId: string; name: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const meId = me?.id ?? null;

  const [reloadKey, setReloadKey] = useState(0);

  // Tải lại khi đổi kiểu sắp xếp hoặc đổi người (đăng nhập / ra) — để biết "của mình", đã thích.
  useEffect(() => {
    if (!zozo.ready && !meId) return;
    let alive = true;
    commentsApi
      .list(game.slug, sort)
      .then((page) => {
        if (!alive) return;
        setItems(page.items);
        setTotal(page.total);
        setCursor(page.nextCursor);
        setOpen((o) => (Object.keys(o).length || !page.items[0]?.replies?.length ? o : { [page.items[0].id]: true }));
        setState('ready');
      })
      .catch(() => alive && setState('error'));
    return () => {
      alive = false;
    };
  }, [game.slug, sort, meId, zozo.ready, reloadKey]);
  const load = () => {
    setState('loading');
    setReloadKey((k) => k + 1);
  };

  async function loadMore() {
    if (!cursor) return;
    setMore(true);
    try {
      const page = await commentsApi.list(game.slug, sort, cursor);
      const have = new Set(items.map((c) => c.id));
      setItems([...items, ...page.items.filter((c) => !have.has(c.id))]);
      setCursor(page.nextCursor);
    } catch {
      setNotice({ kind: 'error', text: t('cmt.loadError') });
    } finally {
      setMore(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setNotice(null);
    try {
      const c = await commentsApi.create(game.slug, text, replyTo?.rootId);
      if (c.parentId) {
        setItems((list) => list.map((r) => (r.id === c.parentId ? { ...r, replies: [...(r.replies ?? []), c], replyCount: r.replyCount + (c.pending ? 0 : 1) } : r)));
        setOpen((o) => ({ ...o, [c.parentId!]: true }));
      } else {
        setItems((list) => [{ ...c, replies: [] }, ...list]);
      }
      if (!c.pending) setTotal((n) => n + 1);
      else setNotice({ kind: 'info', text: t('cmt.pendingNote') });
      setDraft('');
      setReplyTo(null);
    } catch (e) {
      setNotice({ kind: 'error', text: errorText(e, t, locale) });
    } finally {
      setSending(false);
    }
  }

  function startReply(root: PublicComment, name: string) {
    setReplyTo({ rootId: root.parentId ?? root.id, name });
    inputRef.current?.focus();
  }

  const onChange = (id: string, fn: (c: PublicComment) => PublicComment | null) => setItems((list) => patchTree(list, id, fn));
  const left = COMMENT_MAX_LENGTH - [...draft].length;
  const isGuest = !me || me.isGuest;

  return (
    <section className="comments" aria-labelledby="comments-title">
      <div className="comments-head">
        <h2 id="comments-title" className="section-title section-title-sm">{t('cmt.title', { count: String(total) })}</h2>
        <div className="pill-group" role="group" aria-label={t('cmt.sort')}>
          <button type="button" aria-pressed={sort === 'top'} onClick={() => setSort('top')}>{t('cmt.top')}</button>
          <button type="button" aria-pressed={sort === 'new'} onClick={() => setSort('new')}>{t('cmt.newest')}</button>
        </div>
      </div>

      <form className="comment-form" onSubmit={submit} data-testid="comment-form">
        {me ? <PlayerAvatar player={me} size={40} /> : <span className="avatar avatar-me" aria-hidden="true">{t('cmt.you').slice(0, 1)}</span>}
        <label className="comment-input">
          <span className="sr-only">{t('cmt.placeholder')}</span>
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => event.key === 'Escape' && replyTo && setReplyTo(null)}
            maxLength={COMMENT_MAX_LENGTH}
            placeholder={replyTo ? t('cmt.replyTo', { name: replyTo.name }) : t('cmt.placeholder')}
            data-testid="comment-input"
          />
        </label>
        {replyTo && (
          <button type="button" className="comment-icon" aria-label={t('cmt.cancel')} onClick={() => setReplyTo(null)}>
            <X size={16} strokeWidth={2.4} aria-hidden="true" />
          </button>
        )}
        <button type="submit" className="action action-primary" disabled={!draft.trim() || sending} data-testid="comment-send">{t('cmt.send')}</button>
      </form>
      <div className="comment-form-foot">
        {isGuest && (
          <p className="comment-hint">
            {me && <>{t('cmt.asGuest', { name: me.displayName })} </>}
            <button type="button" className="link-button" onClick={() => void openAuthDialog('login')}>{t('cmt.keepName')}</button>
          </p>
        )}
        {draft.length > 0 && <span className={`comment-count${left < 50 ? ' comment-count-low' : ''}`} aria-live="polite">{left}</span>}
      </div>
      {notice && (
        <p className={`comment-notice comment-notice-${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'} data-testid="comment-notice">
          {notice.text}
        </p>
      )}

      {state === 'error' && (
        <p className="comment-empty">
          {t('cmt.loadError')} · <button type="button" className="link-button" onClick={load}>{t('cmt.retry')}</button>
        </p>
      )}
      {state === 'ready' && items.length === 0 && <p className="comment-empty">{t('cmt.empty')}</p>}

      <ul className="comment-list" aria-busy={state === 'loading'} data-testid="comment-list">
        {items.map((c) => {
          const isOpen = !!open[c.id];
          const replies = c.replies ?? [];
          return (
            <li key={c.id} className="comment" data-testid="comment">
              <PlayerAvatar player={c.author} size={40} />
              <div className="comment-body">
                <CommentView c={c} t={t} locale={locale} onReply={() => startReply(c, c.author.displayName)} onChange={onChange} onRemoved={() => setTotal((n) => Math.max(0, n - 1 - c.replyCount))} />
                {replies.length > 0 && (
                  <button type="button" className="comment-toggle" aria-expanded={isOpen} onClick={() => setOpen({ ...open, [c.id]: !isOpen })}>
                    <ChevronDown size={16} strokeWidth={2.4} aria-hidden="true" />
                    {t(isOpen ? 'cmt.hideReplies' : 'cmt.replies', { count: String(replies.length) })}
                  </button>
                )}
                {isOpen && replies.length > 0 && (
                  <ul className="reply-list">
                    {replies.map((r) => (
                      <li key={r.id} className="comment comment-reply" data-testid="comment-reply">
                        <PlayerAvatar player={r.author} size={28} />
                        <div className="comment-body">
                          <CommentView c={r} t={t} locale={locale} onReply={() => startReply(c, r.author.displayName)} onChange={onChange} onRemoved={() => setTotal((n) => Math.max(0, n - 1))} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {cursor && state === 'ready' && (
        <button type="button" className="comment-more" onClick={() => void loadMore()} disabled={more}>
          {t('cmt.more')}
        </button>
      )}
    </section>
  );
}

/** Một bình luận: tên, thời gian, nội dung, thích / trả lời; của mình: sửa (trong hạn) / xoá; của người khác: báo cáo. */
function CommentView({
  c,
  t,
  locale,
  onReply,
  onChange,
  onRemoved,
}: {
  c: PublicComment;
  t: T;
  locale: Locale;
  onReply: () => void;
  onChange: (id: string, fn: (c: PublicComment) => PublicComment | null) => void;
  onRemoved: () => void;
}) {
  const [mode, setMode] = useState<'view' | 'edit' | 'delete' | 'report' | 'reported'>('view');
  const [text, setText] = useState(c.body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Hạn sửa do API tính lúc tải; quá hạn thì API báo lỗi "đã quá thời gian sửa".
  const canEdit = c.mine && !!c.editableUntil;

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errorText(e, t, locale));
    } finally {
      setBusy(false);
    }
  }

  const like = () =>
    run(async () => {
      const r = await commentsApi.like(c.id, !c.liked);
      onChange(c.id, (x) => ({ ...x, liked: r.liked, likeCount: r.likeCount }));
    });
  const save = () =>
    run(async () => {
      const next = await commentsApi.update(c.id, text.trim());
      onChange(c.id, (x) => ({ ...next, replies: x.replies }));
      setMode('view');
    });
  const remove = () =>
    run(async () => {
      await commentsApi.remove(c.id);
      onChange(c.id, () => null);
      if (!c.pending) onRemoved();
    });
  const report = (reason: ReportReason) =>
    run(async () => {
      await commentsApi.report(c.id, reason);
      setMode('reported');
    });

  return (
    <>
      <p className="comment-meta">
        <strong>{c.author.displayName}</strong> · <span suppressHydrationWarning>{ago(c.createdAt, t)}</span>
        {c.editedAt && <span className="comment-edited"> · {t('cmt.edited')}</span>}
        {c.pending && <span className="comment-pending" data-testid="comment-pending">{t('cmt.pending')}</span>}
      </p>
      {mode === 'edit' ? (
        <form className="comment-edit" onSubmit={(e) => { e.preventDefault(); if (text.trim()) void save(); }}>
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={COMMENT_MAX_LENGTH} autoFocus aria-label={t('cmt.edit')} />
          <button type="submit" className="action action-primary" disabled={busy || !text.trim()}>{t('cmt.save')}</button>
          <button type="button" className="action" onClick={() => { setMode('view'); setText(c.body); }}>{t('cmt.cancel')}</button>
        </form>
      ) : (
        <p className="comment-text">{c.body}</p>
      )}
      {mode !== 'edit' && (
        <div className="comment-actions">
          <button type="button" aria-pressed={c.liked} aria-label={t('cmt.like')} onClick={() => void like()} disabled={busy || c.mine || c.pending}>
            <ThumbsUp size={15} strokeWidth={2.2} aria-hidden="true" />{c.likeCount > 0 && c.likeCount}
          </button>
          {!c.pending && <button type="button" onClick={onReply}>{t('cmt.reply')}</button>}
          {canEdit && (
            <button type="button" aria-label={t('cmt.edit')} title={t('cmt.edit')} onClick={() => setMode('edit')}>
              <Pencil size={14} strokeWidth={2.2} aria-hidden="true" />
            </button>
          )}
          {c.mine && mode !== 'delete' && (
            <button type="button" aria-label={t('cmt.delete')} title={t('cmt.delete')} onClick={() => setMode('delete')}>
              <Trash2 size={14} strokeWidth={2.2} aria-hidden="true" />
            </button>
          )}
          {!c.mine && mode === 'view' && (
            <button type="button" aria-label={t('cmt.report')} title={t('cmt.report')} onClick={() => setMode('report')}>
              <Flag size={14} strokeWidth={2.2} aria-hidden="true" />
            </button>
          )}
          {mode === 'reported' && <span className="comment-done">{t('cmt.reported')}</span>}
        </div>
      )}
      {mode === 'delete' && (
        <div className="comment-confirm" role="group" aria-label={t('cmt.deleteConfirm')}>
          <span>{t('cmt.deleteConfirm')}</span>
          <button type="button" className="action action-danger" onClick={() => void remove()} disabled={busy}>{t('cmt.delete')}</button>
          <button type="button" className="action" onClick={() => setMode('view')}>{t('cmt.cancel')}</button>
        </div>
      )}
      {mode === 'report' && (
        <div className="comment-confirm" role="group" aria-label={t('cmt.report')}>
          {(['spam', 'offensive', 'other'] as const).map((r) => (
            <button key={r} type="button" className="action" onClick={() => void report(r)} disabled={busy}>
              {t(r === 'spam' ? 'cmt.reasonSpam' : r === 'offensive' ? 'cmt.reasonOffensive' : 'cmt.reasonOther')}
            </button>
          ))}
          <button type="button" className="comment-icon" aria-label={t('cmt.cancel')} onClick={() => setMode('view')}>
            <X size={16} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
      )}
      {error && <p className="comment-notice comment-notice-error" role="alert">{error}</p>}
    </>
  );
}
