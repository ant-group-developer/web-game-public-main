'use client';

import { useSyncExternalStore } from 'react';
import { DEFAULT_LOCALE, dictionary, isLocale, type Locale, type MessageKey } from '@/constants/i18n';

const KEY = 'ant-lang';
const EVENT = 'ant-lang-change';
// Dự phòng khi trình duyệt chặn localStorage: vẫn đổi được ngôn ngữ trong phiên hiện tại.
let memory: Locale | null = null;

/** Ngôn ngữ đang chọn (đọc trực tiếp, dùng được trong event handler / state khởi tạo). */
export function readLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const saved = localStorage.getItem(KEY);
    if (isLocale(saved)) return saved;
  } catch { /* Storage bị chặn. */ }
  return memory ?? DEFAULT_LOCALE;
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(EVENT, callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener(EVENT, callback); };
}

export function setLocale(locale: Locale) {
  memory = locale;
  try { localStorage.setItem(KEY, locale); } catch { /* Storage bị chặn. */ }
  window.dispatchEvent(new Event(EVENT));
}

/** Server render tiếng Việt (mặc định, tốt cho SEO); trình duyệt đổi sang ngôn ngữ đã lưu sau khi hydrate. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, readLocale, () => DEFAULT_LOCALE);
}

export function useT() {
  const locale = useLocale();
  const t = (key: MessageKey, values: Record<string, string> = {}) =>
    dictionary[locale][key].replace(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match);
  return { locale, t };
}
