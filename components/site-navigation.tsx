'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Heart, History, Search, UserRound, X } from 'lucide-react';
import { games, popularGames } from '@/constants/games';
import { quickCategories } from '@/constants/categories';
import { GameCard } from '@/components/game-card';
import { useLibrary } from '@/hooks/use-library';

export function SiteNavigation() {
  const [panel, setPanel] = useState<'search' | 'library' | null>(null);
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const pathname = usePathname();
  const { favorites, recent } = useLibrary();
  const result = query.trim() ? games.filter((game) => game.title.toLowerCase().includes(query.trim().toLowerCase())) : popularGames;

  useEffect(() => {
    if (!panel) return;
    opener.current = document.activeElement as HTMLElement;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (panel === 'search') input.current?.focus(); else closeButton.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanel(null);
      if (event.key === 'Tab') {
        const elements = dialog.current?.querySelectorAll<HTMLElement>('a[href],button,input');
        if (!elements?.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', handleKey); opener.current?.focus(); };
  }, [panel]);

  return (
    <>
      <nav aria-label="Main navigation" className={`site-nav ${pathname !== '/' ? 'site-nav-inner' : ''}`}>
        <Link href="/" aria-label="ANT Play home" className="nav-logo"><Image src="/brand/logo.png" alt="ANT Play" width={48} height={48} priority /></Link>
        <div className="nav-actions"><button aria-label="Your game library" title="Your game library" onClick={() => setPanel('library')}><UserRound size={21} strokeWidth={2.5} /></button><button aria-label="Search games" title="Search games" onClick={() => setPanel('search')}><Search size={23} strokeWidth={2.8} /></button></div>
      </nav>
      {panel && <div className="panel-layer">
        <button className="panel-backdrop" aria-label="Close panel" tabIndex={-1} onClick={() => setPanel(null)} />
        <div className="search-panel" role="dialog" aria-modal="true" aria-label={panel === 'search' ? 'Search games' : 'Your game library'} ref={dialog}>
          <div className="panel-header"><button className="icon-button shrink-0" aria-label="Close panel" ref={closeButton} onClick={() => setPanel(null)}><ArrowLeft size={25} /></button>
            {panel === 'search' ? <div className="search-field"><input ref={input} type="search" placeholder="What are you playing today?" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search game titles" /><Search size={22} className="shrink-0" /></div> : <h2 className="font-display text-2xl font-bold">Your playground</h2>}
          </div>
          <div className="panel-content" onClick={(event) => { if ((event.target as Element).closest('a')) setPanel(null); }}>
            {panel === 'search' ? <>
              <div className="search-categories">{quickCategories.map((category) => <Link href={`/?category=${category.slug}`} key={category.slug}>{category.title}</Link>)}</div>
              <h3 className="panel-heading">{query.trim() ? `${result.length} games found` : 'Popular this week'}</h3>
              <div className="search-results">{result.map((game) => <GameCard game={game} key={game.slug} />)}</div>
              {!result.length && <div className="empty-state"><Search size={42} /><h3>No games found</h3><p>Try another name or explore a category.</p><button className="primary-button" onClick={() => setQuery('')}>Explore popular games</button></div>}
            </> : <>
              <div className="library-intro"><span className="library-avatar"><UserRound size={36} /></span><h3>Good to see you!</h3><p>All your favorites, in one happy place.<br />Saved on this browser. No account needed.</p></div>
              <h3 className="panel-heading"><Heart size={19} /> Your favorites <span>{favorites.length}</span></h3>
              {favorites.length ? <div className="search-results">{favorites.flatMap((slug) => games.find((game) => game.slug === slug) ?? []).map((game) => <GameCard key={game.slug} game={game} />)}</div> : <p className="library-note">Tap the heart on a game page to save it here.</p>}
              <h3 className="panel-heading mt-8"><History size={19} /> Recently viewed</h3>
              {recent.length ? <div className="search-results">{recent.flatMap((slug) => games.find((game) => game.slug === slug) ?? []).map((game) => <GameCard key={game.slug} game={game} />)}</div> : <p className="library-note">Your next favorite is waiting. Pick a game to get started!</p>}
            </>}
          </div>
          <button className="panel-close icon-button" aria-label="Close dialog" onClick={() => setPanel(null)}><X size={23} /></button>
        </div>
      </div>}
    </>
  );
}
