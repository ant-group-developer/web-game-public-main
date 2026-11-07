'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { localeNames, locales, type Locale } from '@/constants/i18n';
import { setLocale, useT } from '@/hooks/use-locale';

/** Dropdown chọn ngôn ngữ trên header. Game đang mở trong iframe đổi theo (xem GamePlayer). */
export function LanguageSwitcher() {
  const { locale, t } = useT();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    const onPointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); button.current?.focus(); } };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [open]);

  function choose(item: Locale) {
    setLocale(item);
    setOpen(false);
    button.current?.focus();
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Tab') { setOpen(false); return; }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'));
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'ArrowDown' ? (current + 1) % items.length : (current - 1 + items.length) % items.length;
    items[next]?.focus();
  }

  return (
    <div className="lang" ref={root}>
      <button
        ref={button}
        type="button"
        className="lang-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t('lang.label')}: ${localeNames[locale]}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Globe size={17} strokeWidth={2.3} aria-hidden="true" />
        <span>{locale.toUpperCase()}</span>
        <ChevronDown className="lang-chevron" size={16} strokeWidth={2.6} aria-hidden="true" />
      </button>
      {open && (
        <div className="lang-menu" role="menu" aria-label={t('lang.label')} onKeyDown={onMenuKeyDown}>
          {locales.map((item) => (
            <button key={item} type="button" role="menuitemradio" aria-checked={item === locale} lang={item} tabIndex={-1} onClick={() => choose(item)}>
              <span className="lang-code">{item.toUpperCase()}</span>
              <span>{localeNames[item]}</span>
              {item === locale && <Check size={16} strokeWidth={3} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
