'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Game } from '@/types/game';
import { useT } from '@/hooks/use-locale';
import { useStored } from '@/hooks/use-stored';
import { Breadcrumb } from '@/components/breadcrumb';
import { GamePlayer } from './game-player';
import { GameHeadline } from './game-headline';
import { GameComments } from './game-comments';
import { RelatedGames } from './related-games';

export type PlayerMode = 'default' | 'theater';
const MODE_KEY = 'ant-player-mode';

/**
 * Trang chơi game, 2 chế độ (giống YouTube Playables):
 * - Thường: khung game + cột "Game liên quan" bên phải; thông tin, tương tác, bình luận dưới khung game.
 * - Ngang (theater): khung game tràn hết bề ngang; bên dưới là tương tác + bình luận (trái) và game liên quan (phải).
 * Khung game luôn nằm cùng một chỗ trong DOM (chỉ đổi lưới CSS) nên đổi chế độ không tải lại game.
 */
export function GameDetail({ game, related }: { game: Game; related: Game[] }) {
  const { locale, t } = useT();
  const text = game.text[locale];
  const [mode, setMode] = useStored<PlayerMode>(MODE_KEY, 'default');
  const theater = mode === 'theater';
  const toggleMode = () => setMode(theater ? 'default' : 'theater');
  const primary = game.categories.find((c) => c.isPrimary) ?? game.categories[0];

  // Phím T đổi chế độ (bỏ qua khi đang gõ chữ; khi con trỏ trong iframe thì phím thuộc về game).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 't' || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      setMode(theater ? 'default' : 'theater');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [theater, setMode]);

  return (
    <div className="page page-game" data-mode={mode}>
      <Breadcrumb items={[...(primary ? [{ label: primary.name[locale], href: `/categories/${primary.slug}` }] : []), { label: text.title }]} />
      <div className="game-layout">
        <div className="game-stage">
          <GamePlayer key={game.slug} game={game} theater={theater} onToggleMode={toggleMode} />
        </div>

        <div className="game-main">
          <GameHeadline game={game} />

          <section className="game-info" aria-label={text.title}>
            <p className="game-info-desc">{text.description}</p>
            {text.about.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
            {text.instructions.length > 0 && (
              <>
                <h2 className="game-info-h">{t('detail.howTo')}</h2>
                <ol>{text.instructions.map((step, i) => <li key={i}>{step}</li>)}</ol>
              </>
            )}
            {game.screenshots.length > 0 && (
              <div className="game-shots-list" aria-label={t('detail.screenshots')}>
                {game.screenshots.map((src, i) => (
                  <a key={src + i} href={src} target="_blank" rel="noreferrer" className="game-shot">
                    <Image src={src} alt={`${text.title} — ${t('detail.screenshots').toLowerCase()} ${i + 1}`} width={560} height={315} unoptimized />
                  </a>
                ))}
              </div>
            )}
            {game.author && <p className="game-info-credit">{t('detail.author', { name: game.author })}</p>}
          </section>

          {text.faq.length > 0 && (
            <section className="faq" aria-labelledby="game-faq">
              <h2 id="game-faq" className="section-title section-title-sm">{t('detail.faq')}</h2>
              {text.faq.map((item, i) => (
                <details key={i}>
                  <summary><span>{item.q}</span><ChevronDown size={18} strokeWidth={2.4} aria-hidden="true" /></summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </section>
          )}

          <GameComments game={game} />
        </div>

        {related.length > 0 && (
          <aside className="game-side" aria-labelledby="related-games">
            <RelatedGames games={related} layout={theater ? 'grid' : 'list'} moreHref={primary ? `/categories/${primary.slug}` : '/'} />
          </aside>
        )}
      </div>
    </div>
  );
}
