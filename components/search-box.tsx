'use client';

import { useEffect, useRef, type FormEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { setSearch, useSearch } from '@/hooks/use-search';
import { useT } from '@/hooks/use-locale';

/** Ô tìm game trên header. Icon, chữ gợi ý và phím tắt "/" cùng nằm trên một đường giữa. */
export function SearchBox() {
  const { t } = useT();
  const query = useSearch();
  const input = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';

  // Rời trang chủ (mở game) thì xoá từ khoá cũ.
  useEffect(() => { if (!isHome) setSearch(''); }, [isHome]);

  // Phím "/" để nhảy vào ô tìm kiếm (trừ khi đang gõ ở ô khác).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      event.preventDefault();
      input.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function showResults() {
    if (!isHome) router.push('/#catalog');
    else document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function onChange(value: string) {
    const startedTyping = !query.trim() && value.trim();
    setSearch(value);
    if (startedTyping) showResults();
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    showResults();
  }

  return (
    <form role="search" className="search" onSubmit={onSubmit}>
      <Search className="search-icon" size={18} strokeWidth={2.4} aria-hidden="true" />
      <input
        ref={input}
        type="search"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => { if (event.key === 'Escape' && query) { event.preventDefault(); setSearch(''); } }}
        placeholder={t('search.placeholder')}
        aria-label={t('search.label')}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
      />
      {query ? (
        <button type="button" className="search-clear" aria-label={t('search.clear')} onClick={() => { setSearch(''); input.current?.focus(); }}>
          <X size={16} strokeWidth={2.6} />
        </button>
      ) : (
        <kbd aria-hidden="true">/</kbd>
      )}
    </form>
  );
}
