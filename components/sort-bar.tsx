'use client';

import { ArrowDownUp } from 'lucide-react';
import type { MessageKey } from '@/constants/i18n';
import type { GameSort } from '@/types/game';
import { useT } from '@/hooks/use-locale';

/** Nhóm nút sắp xếp (segmented). `options` quyết định có nút "Đề xuất" hay không. */
export function SortBar({ value, options, onChange }: { value: GameSort; options: readonly GameSort[]; onChange: (sort: GameSort) => void }) {
  const { t } = useT();
  return (
    <div className="sort-bar" role="group" aria-label={t('sort.label')}>
      <ArrowDownUp size={16} strokeWidth={2.2} aria-hidden="true" />
      {options.map((sort) => (
        <button key={sort} type="button" aria-pressed={sort === value} onClick={() => onChange(sort)}>
          {t(`sort.${sort}` as MessageKey)}
        </button>
      ))}
    </div>
  );
}
