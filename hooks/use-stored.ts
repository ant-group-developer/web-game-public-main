'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Giá trị JSON lưu trong localStorage, đồng bộ giữa các component và tab.
 * Storage bị chặn (chế độ riêng tư) thì giữ trong bộ nhớ của phiên hiện tại.
 */
const EVENT = 'ant-stored-change';
const memory = new Map<string, string>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function readRaw(key: string): string | null {
  try {
    const value = localStorage.getItem(key);
    if (value !== null) return value;
  } catch { /* Storage bị chặn. */ }
  return memory.get(key) ?? null;
}

export function writeStored<T>(key: string, value: T) {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try { localStorage.setItem(key, raw); } catch { /* Storage bị chặn: chỉ giữ trong bộ nhớ. */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(EVENT, callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener(EVENT, callback); };
}

export function useStored<T>(key: string, fallback: T): [T, (value: T) => void] {
  const read = () => {
    const raw = readRaw(key);
    const hit = cache.get(key);
    if (hit && hit.raw === raw) return hit.value as T;
    let value: T = fallback;
    if (raw !== null) {
      try { value = JSON.parse(raw) as T; } catch { value = fallback; }
    }
    cache.set(key, { raw, value });
    return value;
  };
  const value = useSyncExternalStore(subscribe, read, () => fallback);
  const set = useCallback((next: T) => writeStored(key, next), [key]);
  return [value, set];
}
