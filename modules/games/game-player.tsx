'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowLeft, Maximize, Minimize, RotateCcw } from 'lucide-react';
import type { Game } from '@/types/game';
import { addRecentGame } from '@/hooks/use-recent';

/** Khung chơi: iframe tải ngay khi vào trang. Desktop: thanh tên + nút dưới khung. Mobile: thanh gọn phía trên. */
export function GamePlayer({ game }: { game: Game }) {
  const frame = useRef<HTMLDivElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Build the URL on the client so games that verify postMessage get the portal's real origin.
  const origin = useSyncExternalStore(noopSubscribe, () => window.location.origin, () => null);
  const src = origin ? embedSrc(game, origin) : null;

  useEffect(() => { addRecentGame(game.slug); }, [game.slug]);

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
  function reload() { setLoaded(false); setReloadKey((k) => k + 1); }

  const fullscreenLabel = isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình';
  const FullscreenIcon = isFullscreen ? Minimize : Maximize;

  return (
    <section className="player-wrap" aria-label={`Chơi ${game.title}`}>
      <div className="player-bar-mobile">
        <Link href="/" className="icon-btn" aria-label="Về trang chủ"><ArrowLeft size={22} /></Link>
        <Image src={game.image} alt="" width={34} height={34} unoptimized />
        <span className="player-bar-mobile-title">{game.title}</span>
        <button type="button" className="icon-btn icon-btn-play" onClick={toggleFullscreen} aria-label={fullscreenLabel}><FullscreenIcon size={20} /></button>
      </div>

      <div className="player" ref={frame}>
        {src && (
          <iframe
            key={reloadKey}
            ref={iframe}
            src={src}
            title={game.title}
            allow="autoplay; fullscreen; gamepad; clipboard-write; web-share"
            allowFullScreen
            onLoad={() => { setLoaded(true); iframe.current?.focus({ preventScroll: true }); }}
          />
        )}
        {!loaded && (
          <div className="player-loading" aria-live="polite">
            <Image src={game.image} alt="" width={120} height={120} unoptimized priority />
            <span className="spinner" aria-hidden="true" />
            <span className="sr-only">Đang tải {game.title}…</span>
          </div>
        )}
      </div>

      <div className="player-bar">
        <Image src={game.image} alt="" width={48} height={48} unoptimized />
        <div className="player-bar-title">
          <strong>{game.title}</strong>
          <span>{game.tags.join(' · ')}</span>
        </div>
        <button type="button" className="icon-btn" onClick={reload} aria-label="Tải lại game" title="Tải lại game"><RotateCcw size={21} /></button>
        <button type="button" className="play-button play-button-sm" onClick={toggleFullscreen}><FullscreenIcon size={20} /> {fullscreenLabel}</button>
      </div>
    </section>
  );
}

const noopSubscribe = () => () => {};

function embedSrc(game: Game, origin: string) {
  const url = new URL(game.embedUrl, origin);
  if (game.passParentOrigin) url.searchParams.set('parentOrigin', origin);
  return url.toString();
}
