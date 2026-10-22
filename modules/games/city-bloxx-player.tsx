'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Play, Volume2, VolumeX } from 'lucide-react';
import { cityBloxx, cityBloxxModes, type CityBloxxScreen } from '@/constants/city-bloxx';

const origin = new URL(cityBloxx.embedUrl!).origin;

export function CityBloxxPlayer({ onPlay }: { onPlay: () => void }) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [screen, setScreen] = useState<CityBloxxScreen>('quick');
  const [score, setScore] = useState<{ population: number; personalBest: number } | null>(null);

  function send(type: string, payload: Record<string, unknown> = {}) {
    iframe.current?.contentWindow?.postMessage({ namespace: 'city-bloxx:portal', version: 1, type, payload }, origin);
  }

  function start(nextScreen: CityBloxxScreen = screen) {
    setScreen(nextScreen);
    if (ready && iframe.current) {
      send('navigate', { screen: nextScreen });
      iframe.current.focus();
    } else {
      const url = new URL(cityBloxx.embedUrl!);
      url.searchParams.set('screen', nextScreen);
      url.searchParams.set('parentOrigin', window.location.origin);
      url.searchParams.set('muted', muted ? '1' : '0');
      setReady(false);
      setSrc(url.toString());
      onPlay();
    }
  }

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== origin || !iframe.current || event.source !== iframe.current.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== 'object' || data.namespace !== 'city-bloxx:portal' || data.version !== 1) return;
      if (data.type === 'ready') setReady(true);
      if (data.type === 'audioChange' && typeof data.payload?.muted === 'boolean') setMuted(data.payload.muted);
      if (data.type === 'screenChange' && cityBloxxModes.some((mode) => mode.screen === data.payload?.screen)) setScreen(data.payload.screen);
      if (data.type === 'score') {
        const population = data.payload?.population, personalBest = data.payload?.personalBest;
        if (typeof population === 'number' && Number.isFinite(population) && population >= 0 && typeof personalBest === 'number' && Number.isFinite(personalBest) && personalBest >= 0) setScore({ population, personalBest });
      }
    }
    function onVisibilityChange() {
      iframe.current?.contentWindow?.postMessage({ namespace: 'city-bloxx:portal', version: 1, type: document.hidden ? 'pause' : 'resume', payload: {} }, origin);
    }
    window.addEventListener('message', onMessage);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('message', onMessage);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return <div className="city-bloxx-player" lang="vi">
    <div className="city-bloxx-canvas">
      {src ? <iframe ref={iframe} id="city-bloxx-iframe" src={src} title="City Bloxx — Xây dựng thành phố" allow="autoplay; fullscreen; clipboard-write; gamepad" allowFullScreen loading="lazy" onLoad={() => iframe.current?.focus()} /> : <>
        <Image src={cityBloxx.image} alt="" fill unoptimized sizes="(max-width: 990px) 100vw, 960px" className="player-background" />
        <div className="player-launch"><Image src={cityBloxx.image} alt="City Bloxx" width={180} height={180} unoptimized className="launch-image" /><h2>City Bloxx</h2><p className="city-bloxx-tagline">{cityBloxx.tagline}</p><button className="play-button" onClick={() => start()}><Play size={22} fill="currentColor" /> Chơi ngay</button><p>Chơi trực tiếp trên ANT Play · Tiếng Việt</p></div>
      </>}
    </div>
    <div className="city-bloxx-controls">
      <label className="city-bloxx-mode-label" htmlFor="city-bloxx-mode">Chế độ</label>
      <select id="city-bloxx-mode" value={screen} onChange={(event) => { const next = event.target.value as CityBloxxScreen; if (src) start(next); else setScreen(next); }}>{cityBloxxModes.map((mode) => <option key={mode.screen} value={mode.screen}>{mode.title}</option>)}</select>
      <button className="icon-button" disabled={!ready} aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'} aria-pressed={muted} onClick={() => { send('setAudio', { muted: !muted }); setMuted(!muted); }}>{muted ? <VolumeX size={21} /> : <Volume2 size={21} />}</button>
      <span className="city-bloxx-status" role="status">{ready ? '● Sẵn sàng' : src ? 'Đang tải game…' : 'Nhấn Chơi ngay để bắt đầu'}</span>
      <a className="icon-button" href={cityBloxx.embedUrl} target="_blank" rel="noopener noreferrer" aria-label="Mở City Bloxx trong tab mới" title="Mở trong tab mới"><ExternalLink size={18} /></a>
    </div>
    {score && <div className="city-bloxx-score" role="status">Ván vừa chơi: <strong>{score.population.toLocaleString('vi-VN')} dân</strong><span>Kỷ lục: <strong>{score.personalBest.toLocaleString('vi-VN')} dân</strong></span></div>}
  </div>;
}
