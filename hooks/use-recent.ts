'use client';

import { useSyncExternalStore } from 'react';

const KEY = 'ant-recent';
const EVENT = 'ant-recent-change';
const empty: string[] = [];
let cache: { raw: string | null; value: string[] } = { raw: null, value: empty };

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cache.raw) return cache.value;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const value = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : empty;
    cache = { raw, value };
    return value;
  } catch { return empty; }
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(EVENT, callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener(EVENT, callback); };
}

/** Danh sách slug game chơi gần đây (lưu trên trình duyệt, không cần tài khoản). */
export function useRecentGames() {
  return useSyncExternalStore(subscribe, read, () => empty);
}

export function addRecentGame(slug: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify([slug, ...read().filter((item) => item !== slug)].slice(0, 8)));
    window.dispatchEvent(new Event(EVENT));
  } catch { /* Storage có thể bị chặn; bỏ qua. */ }
}
