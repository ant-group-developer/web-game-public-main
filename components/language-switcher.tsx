'use client';

import { useEffect } from 'react';
import { locales } from '@/constants/i18n';
import { setLocale, useT } from '@/hooks/use-locale';

/** Nút VI | EN trên header. Game đang mở trong iframe đổi theo (xem GamePlayer). */
export function LanguageSwitcher() {
  const { locale, t } = useT();

  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

  return (
    <div className="lang-switch" role="group" aria-label={t('lang.label')}>
      {locales.map((item) => (
        <button key={item} type="button" lang={item} aria-pressed={item === locale} onClick={() => setLocale(item)}>
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
