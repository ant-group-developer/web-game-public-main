'use client';

import { useState, type FormEvent } from 'react';
import { ChevronDown, ThumbsUp } from 'lucide-react';
import type { Game } from '@/types/game';
import { avatarColor, initials, seedInteractions, type SeedReply } from '@/constants/seed-interactions';
import { useT } from '@/hooks/use-locale';
import { useStored } from '@/hooks/use-stored';
import { useNow } from '@/hooks/use-now';
import { useSite } from '@/components/site-provider';
import { timeAgo } from '@/helpers/games';

interface MyComment { id: string; text: string; at: number }
const NO_COMMENTS: MyComment[] = [];
const NO_LIKES: string[] = [];
const MAX_LENGTH = 500;
const DAY = 86_400_000;

type Row = { id: string; name: string; text: string; likes: number; age: number; mine: boolean; replies: SeedReply[] };

/**
 * Bình luận: TẠM dùng dữ liệu mẫu (constants/seed-interactions.ts); bình luận người dùng viết chỉ lưu trên trình duyệt.
 * TODO(review): nối API review/bình luận thật cho từng game.
 */
export function GameComments({ game }: { game: Game }) {
  const { t } = useT();
  const { siteName } = useSite();
  const seed = seedInteractions(game.slug);
  const [mine, setMine] = useStored<MyComment[]>(`ant-comments:${game.slug}`, NO_COMMENTS);
  const [liked, setLiked] = useStored<string[]>('ant-comment-likes', NO_LIKES);
  const [sort, setSort] = useState<'top' | 'newest'>('top');
  const [open, setOpen] = useState<Record<string, boolean>>({ [seed.comments[0]?.id ?? '']: true });
  const [draft, setDraft] = useState('');
  // Chỉ cần khoảng cách thời gian: server dùng mốc 0, client dùng lúc mở trang — chữ "x ngày trước" giống nhau.
  const ref = useNow() ?? 0;

  const rows: Row[] = [
    ...mine.map((c) => ({ id: c.id, name: t('cmt.you'), text: c.text, likes: 0, age: -c.at, mine: true, replies: [] })),
    ...seed.comments.map((c) => ({ id: c.id, name: c.name, text: c.text, likes: c.likes, age: c.daysAgo * DAY, mine: false, replies: c.replies })),
  ].map((r) => ({ ...r, likes: r.likes + (liked.includes(r.id) ? 1 : 0) }));
  // Bình luận của mình luôn ở đầu; phần còn lại theo kiểu sắp xếp.
  rows.sort((a, b) => Number(b.mine) - Number(a.mine) || (sort === 'top' ? b.likes - a.likes : a.age - b.age));

  function submit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim().slice(0, MAX_LENGTH);
    if (!text) return;
    setMine([{ id: `me-${Date.now()}`, text, at: Date.now() }, ...mine].slice(0, 50));
    setDraft('');
  }

  const when = (row: Row) => (row.mine ? t('time.justNow') : timeAgo(ref - row.age, t, ref));

  return (
    <section className="comments" aria-labelledby="comments-title">
      <div className="comments-head">
        <h2 id="comments-title" className="section-title section-title-sm">{t('cmt.title', { count: String(rows.length) })}</h2>
        <div className="pill-group" role="group" aria-label={t('cmt.sort')}>
          <button type="button" aria-pressed={sort === 'top'} onClick={() => setSort('top')}>{t('cmt.top')}</button>
          <button type="button" aria-pressed={sort === 'newest'} onClick={() => setSort('newest')}>{t('cmt.newest')}</button>
        </div>
      </div>

      <form className="comment-form" onSubmit={submit}>
        <span className="avatar avatar-me" aria-hidden="true">{initials(t('cmt.you'))}</span>
        <label className="comment-input">
          <span className="sr-only">{t('cmt.placeholder')}</span>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={MAX_LENGTH} placeholder={t('cmt.placeholder')} />
        </label>
        <button type="submit" className="action action-primary" disabled={!draft.trim()}>{t('cmt.send')}</button>
      </form>

      <ul className="comment-list">
        {rows.map((row) => {
          const isOpen = !!open[row.id];
          const hasLike = liked.includes(row.id);
          return (
            <li key={row.id} className="comment">
              <span className="avatar" style={{ background: avatarColor(row.name) }} aria-hidden="true">{initials(row.name)}</span>
              <div className="comment-body">
                <p className="comment-meta"><strong>{row.name}</strong> · <span suppressHydrationWarning>{when(row)}</span></p>
                <p className="comment-text">{row.text}</p>
                <div className="comment-actions">
                  <button type="button" aria-pressed={hasLike} aria-label={t('cmt.like')} onClick={() => setLiked(hasLike ? liked.filter((id) => id !== row.id) : [...liked, row.id].slice(-500))}>
                    <ThumbsUp size={15} strokeWidth={2.2} aria-hidden="true" />{row.likes > 0 && row.likes}
                  </button>
                  <button type="button" onClick={() => document.querySelector<HTMLInputElement>('.comment-input input')?.focus()}>{t('cmt.reply')}</button>
                </div>
                {row.replies.length > 0 && (
                  <button type="button" className="comment-toggle" aria-expanded={isOpen} onClick={() => setOpen({ ...open, [row.id]: !isOpen })}>
                    <ChevronDown size={16} strokeWidth={2.4} aria-hidden="true" />
                    {t(isOpen ? 'cmt.hideReplies' : 'cmt.replies', { count: String(row.replies.length) })}
                  </button>
                )}
                {isOpen && row.replies.length > 0 && (
                  <ul className="reply-list">
                    {row.replies.map((reply) => {
                      const name = reply.dev ? siteName : reply.name;
                      return (
                        <li key={reply.id} className="comment comment-reply">
                          <span className="avatar avatar-sm" style={{ background: avatarColor(name) }} aria-hidden="true">{initials(name)}</span>
                          <div className="comment-body">
                            <p className="comment-meta">
                              <strong>{name}</strong>
                              {reply.dev && <span className="dev-badge">{t('cmt.dev')}</span>}
                              {' · '}<span>{timeAgo(ref - reply.daysAgo * DAY, t, ref)}</span>
                            </p>
                            <p className="comment-text">{reply.text}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
