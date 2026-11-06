'use client';

import { useSyncExternalStore } from 'react';
import type { Game } from '@/types/game';

/** Từ khoá tìm game trên header — dùng chung giữa ô tìm kiếm và lưới game trang chủ. */
let query = '';
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => { listeners.delete(callback); };
}

export function setSearch(value: string) {
  query = value;
  listeners.forEach((callback) => callback());
}

export function useSearch() {
  return useSyncExternalStore(subscribe, () => query, () => '');
}

/** Bỏ dấu để gõ "co ca ngua" vẫn ra "Cờ Cá Ngựa". */
const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();

export function matchGame(game: Game, value: string) {
  const needle = normalize(value);
  if (!needle) return true;
  return Object.values(game.text).some(({ title, tagline, tags }) => normalize([title, tagline, ...tags].join(' ')).includes(needle));
}
