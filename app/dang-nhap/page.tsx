import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginPage } from '@/modules/auth/login-page';

export const metadata: Metadata = { title: 'Đăng nhập', robots: { index: false, follow: false } };

// Form đọc ?returnTo / ?tab trên trình duyệt (Suspense) nên phần còn lại của trang vẫn dựng sẵn được.
export default function Page() {
  return <Suspense fallback={<div className="page auth-page" />}><LoginPage /></Suspense>;
}
