import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginPage } from '@/modules/auth/login-page';

export const metadata: Metadata = { title: 'Quên mật khẩu', robots: { index: false, follow: false } };

export default function Page() {
  return <Suspense fallback={<div className="page auth-page" />}><LoginPage mode="forgot" /></Suspense>;
}
