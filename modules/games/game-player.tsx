'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { ArrowLeft, Maximize, Minimize, RotateCcw } from 'lucide-react';
import type { Game } from '@/types/game';
import { addRecentGame } from '@/hooks/use-recent';
import { readLocale, useT } from '@/hooks/use-locale';
import type { Locale } from '@/constants/i18n';

/** Khung chơi: iframe tải ngay khi vào trang. Desktop: thanh tên + nút dưới khung. Mobile: thanh gọn phía trên. */
export function GamePlayer({ game }: { game: Game }) {
  const { locale, t } = useT();
  const text = game.text[locale];
  const frame = useRef<HTMLDivElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // Ngôn ngữ ghi vào URL iframe lúc mở. Đổi ngôn ngữ sau đó thì gửi postMessage, không tải lại game.
  const [frameLocale, setFrameLocale] = useState<Locale>(readLocale);

  // Build the URL on the client so games that verify postMessage get the portal's real origin.
  const origin = useSyncExternalStore(noopSubscribe, () => window.location.origin, () => null);
  const src = origin ? embedSrc(game, origin, frameLocale) : null;
  const frameOrigin = src ? new URL(src).origin : null;

  useEffect(() => { addRecentGame(game.slug); }, [game.slug]);

  // Game hỗ trợ (City Bloxx, Cờ Cá Ngựa, Block Puzzle) nghe { type: 'ant-play:locale' } và đổi ngôn ngữ ngay.
  useEffect(() => {
    if (loaded && frameOrigin) iframe.current?.contentWindow?.postMessage({ type: 'ant-play:locale', locale }, frameOrigin);
  }, [locale, loaded, frameOrigin]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === frame.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) { void document.exitFullscreen().catch(() => {}); return; }
    const el = frame.current;
    if (el?.requestFullscreen) void el.requestFullscreen().then(() => iframe.current?.focus({ preventScroll: true })).catch(() => {});
    else if (src) window.open(src, '_blank', 'noopener'); // iPhone Safari: no element fullscreen
  }
  function reload() { setLoaded(false); setFrameLocale(locale); setReloadKey((k) => k + 1); }

  const fullscreenLabel = t(isFullscreen ? 'play.exitFullscreen' : 'play.fullscreen');
  const FullscreenIcon = isFullscreen ? Minimize : Maximize;

  return (
    <section className="player-wrap" aria-label={t('play.game', { title: text.title })}>
      <div className="player-bar-mobile">
        <Link href="/" className="icon-btn" aria-label={t('play.back')}><ArrowLeft size={22} /></Link>
        <Image src={game.image} alt="" width={34} height={34} unoptimized />
        <span className="player-bar-mobile-title">{text.title}</span>
        <button type="button" className="icon-btn icon-btn-play" onClick={toggleFullscreen} aria-label={fullscreenLabel}><FullscreenIcon size={20} /></button>
      </div>

      <div className={game.aspectRatio ? 'player has-ratio' : 'player'} ref={frame} style={game.aspectRatio ? ({ '--ratio': game.aspectRatio } as CSSProperties) : undefined}>
        {src && (
          <iframe
            key={reloadKey}
            ref={iframe}
            src={src}
            title={text.title}
            allow="autoplay; fullscreen; gamepad; clipboard-write; web-share"
            allowFullScreen
            onLoad={() => { setLoaded(true); iframe.current?.focus({ preventScroll: true }); }}
          />
        )}
        {!loaded && (
          <div className="player-loading" aria-live="polite">
            <Image src={game.image} alt="" width={112} height={112} unoptimized priority />
            <span className="spinner" aria-hidden="true" />
            <span className="sr-only">{t('play.loading', { title: text.title })}</span>
          </div>
        )}
      </div>

      <div className="player-bar">
        <Image src={game.image} alt="" width={42} height={42} unoptimized />
        <div className="player-bar-title">
          <strong>{text.title}</strong>
          <span>{text.tags.join(' · ')}</span>
        </div>
        <button type="button" className="icon-btn" onClick={reload} aria-label={t('play.reload')} title={t('play.reload')}><RotateCcw size={18} strokeWidth={2.4} /></button>
        <button type="button" className="play-button play-button-sm" onClick={toggleFullscreen}><FullscreenIcon size={18} strokeWidth={2.4} aria-hidden="true" /><span>{fullscreenLabel}</span></button>
      </div>
    </section>
  );
}

const noopSubscribe = () => () => {};

function embedSrc(game: Game, origin: string, locale: Locale) {
  const url = new URL(game.embedUrl, origin);
  url.searchParams.set('lang', locale);
  if (game.passParentOrigin) url.searchParams.set('parentOrigin', origin);
  return url.toString();
}
