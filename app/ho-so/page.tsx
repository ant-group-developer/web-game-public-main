import type { Metadata } from 'next';
import { ProfilePage } from '@/modules/auth/profile-page';

export const metadata: Metadata = { title: 'Hồ sơ', robots: { index: false, follow: false } };

export default function Page() {
  return <ProfilePage />;
}
