'use client';

import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';
import { useT } from '@/hooks/use-locale';

export default function NotFound() {
  const { t } = useT();
  return (
    <div className="page not-found">
      <Gamepad2 size={72} />
      <h1>{t('notFound.title')}</h1>
      <Link className="play-button" href="/">{t('play.back')}</Link>
    </div>
  );
}
