import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordPage } from '@/modules/auth/reset-page';

export const metadata: Metadata = { title: 'Đặt lại mật khẩu', robots: { index: false, follow: false } };

export default function Page() {
  return <Suspense fallback={<div className="page auth-page" />}><ResetPasswordPage /></Suspense>;
}
