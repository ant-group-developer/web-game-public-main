'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bookmark, BookmarkCheck, Flag, Share2, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { Game } from '@/types/game';
import type { MessageKey } from '@/constants/i18n';
import { seedInteractions } from '@/constants/seed-interactions';
import { useT } from '@/hooks/use-locale';
import { useStored } from '@/hooks/use-stored';
import { useNow } from '@/hooks/use-now';
import { formatCount, formatDate, PUBLIC_PLAYS_MIN, timeAgo } from '@/helpers/games';

type Vote = 'up' | 'down' | null;
const NO_SAVED: string[] = [];
const REPORT_REASONS: MessageKey[] = ['report.notLoading', 'report.controls', 'report.display', 'report.other'];

/**
 * Tên game, dòng thông tin (lượt chơi · ngày ra mắt · cập nhật), chip danh mục và các nút tương tác.
 * Thích/không thích, lưu, báo lỗi đang dùng dữ liệu mẫu + lưu trên trình duyệt (chưa có API review).
 */
export function GameHeadline({ game }: { game: Game }) {
  const { locale, t } = useT();
  const text = game.text[locale];
  const seed = seedInteractions(game.slug);
  const [vote, setVote] = useStored<Vote>(`ant-vote:${game.slug}`, null);
  const [saved, setSaved] = useStored<string[]>('ant-saved', NO_SAVED);
  const isSaved = saved.includes(game.slug);
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const now = useNow();
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!reportOpen) return;
    const onPointer = (event: PointerEvent) => { if (!reportRef.current?.contains(event.target as Node)) setReportOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setReportOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [reportOpen]);

  const likes = seed.likes + (vote === 'up' ? 1 : 0);
  const dislikes = seed.dislikes + (vote === 'down' ? 1 : 0);

  const meta = [
    game.plays.last30d >= PUBLIC_PLAYS_MIN ? t('meta.plays30', { count: formatCount(game.plays.last30d, locale) }) : null,
    game.releasedAt ? t('meta.released', { date: formatDate(game.releasedAt, locale) }) : null,
    // "x ngày trước" phụ thuộc thời điểm xem: chỉ hiện sau khi hydrate để server/client khớp nhau.
    now && game.updatedAt ? t('meta.updated', { ago: timeAgo(game.updatedAt, t, now) }) : null,
  ].filter(Boolean);

  async function share() {
    const url = window.location.href.split('?')[0];
    if (navigator.share) {
      try { await navigator.share({ title: text.title, text: text.description, url }); return; } catch { /* Người dùng huỷ: không làm gì. */ return; }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* Clipboard bị chặn. */ }
  }

  function toggleSave() {
    setSaved(isSaved ? saved.filter((s) => s !== game.slug) : [game.slug, ...saved].slice(0, 100));
  }

  return (
    <section className="game-head" aria-labelledby="game-title">
      <div className="game-head-text">
        <h1 id="game-title">{text.title}</h1>
        {meta.length > 0 && <p className="game-head-meta">{meta.join(' · ')}</p>}
        {game.categories.length > 0 && (
          <div className="game-head-cats">
            {game.categories.map((c) => <Link key={c.slug} href={`/categories/${c.slug}`} className="pill">{c.name[locale]}</Link>)}
          </div>
        )}
      </div>

      <div className="game-actions">
        <div className="vote">
          <button type="button" aria-pressed={vote === 'up'} onClick={() => setVote(vote === 'up' ? null : 'up')} aria-label={t('act.like')} title={t('act.like')}>
            <ThumbsUp size={18} strokeWidth={2.2} aria-hidden="true" />
            <span>{formatCount(likes, locale)}</span>
          </button>
          <span className="vote-sep" aria-hidden="true" />
          <button type="button" aria-pressed={vote === 'down'} onClick={() => setVote(vote === 'down' ? null : 'down')} aria-label={t('act.dislike')} title={t('act.dislike')}>
            <ThumbsDown size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
        <button type="button" className="action" aria-pressed={isSaved} onClick={toggleSave}>
          {isSaved ? <BookmarkCheck size={17} strokeWidth={2.2} aria-hidden="true" /> : <Bookmark size={17} strokeWidth={2.2} aria-hidden="true" />}
          {t(isSaved ? 'act.saved' : 'act.save')}
        </button>
        <button type="button" className="action" onClick={share}>
          <Share2 size={17} strokeWidth={2.2} aria-hidden="true" />
          {t(copied ? 'act.copied' : 'act.share')}
        </button>
        <div className="report" ref={reportRef}>
          <button type="button" className="action action-icon" aria-label={t('act.report')} title={t('act.report')} aria-expanded={reportOpen} onClick={() => { setReportOpen(!reportOpen); setReported(false); }}>
            <Flag size={17} strokeWidth={2.2} aria-hidden="true" />
          </button>
          {reportOpen && (
            <div className="report-pop" role="dialog" aria-label={t('report.title')}>
              {reported ? (
                <p className="report-thanks" role="status">{t('report.thanks')}</p>
              ) : (
                <form onSubmit={(event) => { event.preventDefault(); setReported(true); }}>
                  <p className="report-title">{t('report.title')}</p>
                  {REPORT_REASONS.map((key, i) => (
                    <label key={key}><input type="radio" name="reason" value={key} defaultChecked={i === 0} />{t(key)}</label>
                  ))}
                  <div className="report-actions">
                    <button type="button" className="action" onClick={() => setReportOpen(false)}>{t('report.cancel')}</button>
                    <button type="submit" className="action action-primary">{t('report.send')}</button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="game-rating">{t('detail.rating', { percent: String(Math.round((likes / Math.max(1, likes + dislikes)) * 100)), count: formatCount(likes + dislikes, locale) })}</p>
    </section>
  );
}
