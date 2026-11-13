'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Columns2, Maximize, Minimize, RectangleHorizontal, RotateCcw } from 'lucide-react';
import type { Game } from '@/types/game';
import { addRecentGame } from '@/hooks/use-recent';
import { readLocale, useT } from '@/hooks/use-locale';
import { usePlayTracking } from '@/hooks/use-play-tracking';
import { useZozoBridge } from '@/hooks/use-zozo-bridge';
import { createGameTracker } from '@/lib/analytics';
import type { Locale } from '@/constants/i18n';

/**
 * Khung chơi: iframe tải ngay khi vào trang. Desktop: thanh tên + nút dưới khung (tải lại, chế độ ngang, toàn màn hình).
 * Mobile: thanh gọn phía trên, không có chế độ ngang (khung game đã chiếm gần hết màn hình).
 */
export function GamePlayer({ game, theater, onToggleMode }: { game: Game; theater: boolean; onToggleMode: () => void }) {
  const { locale, t } = useT();
  const text = game.text[locale];
  const frame = useRef<HTMLDivElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // Ngôn ngữ ghi vào URL iframe lúc mở. Đổi ngôn ngữ sau đó thì gửi postMessage, không tải lại game.
  const [frameLocale, setFrameLocale] = useState<Locale>(readLocale);
  // GA4: game_open + sự kiện game gửi qua zozo:track, tính theo từng lần tải iframe.
  const [tracker, setTracker] = useState(() => createGameTracker(game.slug));
  const loadStart = useRef(0);

  // Build the URL on the client so games that verify postMessage get the portal's real origin.
  const origin = useSyncExternalStore(noopSubscribe, () => window.location.origin, () => null);
  // `?p=/su-kien/x` (thẻ sự kiện, thanh sự kiện): mở thẳng trang đó trong game. Chờ đọc xong mới tạo iframe (tránh tải 2 lần).
  const [inGame, setInGame] = useState<{ ready: boolean; path: string | null }>({ ready: false, path: null });
  const src = origin && inGame.ready ? embedSrc(game, origin, frameLocale, inGame.path) : null;
  const frameOrigin = src ? new URL(src).origin : null;

  useEffect(() => { addRecentGame(game.slug); }, [game.slug]);
  usePlayTracking(game.slug, loaded);
  // Game dùng ZOZO SDK xin token / mở đăng nhập qua postMessage.
  useZozoBridge(iframe, frameOrigin, tracker.fromGame);
  useEffect(() => { loadStart.current = performance.now(); }, [src, reloadKey]);

  // Game hỗ trợ đổi ngôn ngữ (bật trong admin) nghe { type: 'ant-play:locale' } và đổi ngay, không tải lại.
  useEffect(() => {
    if (game.supportsLocale && loaded && frameOrigin) iframe.current?.contentWindow?.postMessage({ type: 'ant-play:locale', locale }, frameOrigin);
  }, [game.supportsLocale, locale, loaded, frameOrigin]);

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
  function reload() { setLoaded(false); setFrameLocale(locale); setReloadKey((k) => k + 1); setTracker(createGameTracker(game.slug)); }
  function toggleMode() {
    onToggleMode();
    // Giữ bàn phím trong game sau khi bấm nút.
    window.requestAnimationFrame(() => iframe.current?.focus({ preventScroll: true }));
  }

  const fullscreenLabel = t(isFullscreen ? 'play.exitFullscreen' : 'play.fullscreen');
  const FullscreenIcon = isFullscreen ? Minimize : Maximize;
  const ModeIcon = theater ? Columns2 : RectangleHorizontal;

  return (
    <section className="player-wrap" aria-label={t('play.game', { title: text.title })}>
      <Suspense fallback={null}>
        <InGamePath onChange={(path) => setInGame((cur) => (cur.ready && cur.path === path ? cur : { ready: true, path }))} />
      </Suspense>
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
            allow={game.iframeAllow.length ? game.iframeAllow.join('; ') : undefined}
            sandbox={game.iframeSandbox ?? undefined}
            allowFullScreen
            onLoad={() => { setLoaded(true); tracker.frameLoaded(performance.now() - loadStart.current); iframe.current?.focus({ preventScroll: true }); }}
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
        <button type="button" className="mode-button" onClick={toggleMode} aria-pressed={theater} title={t('play.modeKey')}>
          <ModeIcon size={18} strokeWidth={2.4} aria-hidden="true" />
          <span>{t(theater ? 'play.default' : 'play.theater')}</span>
        </button>
        <button type="button" className="play-button play-button-sm" onClick={toggleFullscreen}><FullscreenIcon size={18} strokeWidth={2.4} aria-hidden="true" /><span>{fullscreenLabel}</span></button>
      </div>
    </section>
  );
}

const noopSubscribe = () => () => {};

/** Đường dẫn trong game hợp lệ: bắt đầu bằng một "/", không phải "//" hay URL đầy đủ. */
export const IN_GAME_PATH = /^\/(?!\/)[A-Za-z0-9\-._~!$&'()*+,;=:@/%]{0,299}$/;

/** Đọc `?p=` (cần Suspense vì trang game được dựng sẵn). */
function InGamePath({ onChange }: { onChange: (path: string | null) => void }) {
  const p = useSearchParams().get('p');
  const path = p && IN_GAME_PATH.test(p) ? p : null;
  useEffect(() => onChange(path), [path, onChange]);
  return null;
}

function embedSrc(game: Game, origin: string, locale: Locale, path: string | null = null) {
  const base = new URL(game.embedUrl, origin);
  // Chỉ thay đường dẫn (cùng origin với game), giữ tham số gốc của link nhúng.
  const url = path ? new URL(path, base.origin) : base;
  if (path) base.searchParams.forEach((v, k) => url.searchParams.set(k, v));
  if (game.supportsLocale) url.searchParams.set('lang', locale);
  if (game.passParentOrigin) url.searchParams.set('parentOrigin', origin);
  return url.toString();
}
