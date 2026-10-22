'use client';

import { useSyncExternalStore } from 'react';

const empty: string[] = [];
const snapshots = new Map<string, { raw: string | null; value: string[] }>();

function read(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const cached = snapshots.get(key);
    if (cached?.raw === raw) return cached.value;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const value = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    snapshots.set(key, { raw, value });
    return value;
  } catch { return empty; }
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('ant-library', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('ant-library', callback);
  };
}

function write(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('ant-library'));
  } catch { /* Browsing remains available when storage is disabled. */ }
}

export function useLibrary() {
  const favorites = useSyncExternalStore(subscribe, () => read('ant-favorites'), () => empty);
  const recent = useSyncExternalStore(subscribe, () => read('ant-recent'), () => empty);
  return {
    favorites, recent,
    toggleFavorite: (slug: string) => {
      const current = read('ant-favorites');
      write('ant-favorites', current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]);
    },
    addRecent: (slug: string) => write('ant-recent', [slug, ...read('ant-recent').filter((item) => item !== slug)].slice(0, 20)),
  };
}
