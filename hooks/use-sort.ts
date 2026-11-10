'use client';

import { useSyncExternalStore } from 'react';
import type { GameSort } from '@/types/game';
import { isGameSort } from '@/helpers/games';

/**
 * Kiểu sắp xếp lưu trên URL (`?sort=newest`) để chia sẻ link được.
 * Không dùng useSearchParams: server vẫn render sẵn lưới game theo thứ tự mặc định (tốt cho SEO),
 * trình duyệt đọc `?sort=` sau khi hydrate. Trang có `?sort=` vẫn canonical về URL gốc.
 */
const EVENT = 'ant-sort-change';

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback);
  window.addEventListener(EVENT, callback);
  return () => { window.removeEventListener('popstate', callback); window.removeEventListener(EVENT, callback); };
}

const readParam = () => new URLSearchParams(window.location.search).get('sort');

export function useSort(defaultSort: GameSort): [GameSort, (sort: GameSort) => void] {
  const raw = useSyncExternalStore(subscribe, readParam, () => null);
  const sort = isGameSort(raw) ? raw : defaultSort;
  const set = (next: GameSort) => {
    const url = new URL(window.location.href);
    if (next === defaultSort) url.searchParams.delete('sort');
    else url.searchParams.set('sort', next);
    window.history.replaceState(window.history.state, '', url);
    window.dispatchEvent(new Event(EVENT));
  };
  return [sort, set];
}
