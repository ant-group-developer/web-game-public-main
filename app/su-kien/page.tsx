import type { Metadata } from 'next';
import { getAnnouncements } from '@/lib/api/announcements';
import { getSiteConfig } from '@/lib/api/site';
import { EventsIndex } from '@/modules/events/events-index';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  const title = 'Sự kiện & giải đấu';
  const description = `Giải đấu và sự kiện đua điểm của các game trên ${site.general.siteName}: đăng ký, theo dõi bảng xếp hạng và kết quả.`;
  return {
    title,
    description,
    alternates: { canonical: '/su-kien' },
    openGraph: { type: 'website', siteName: site.general.siteName, locale: 'vi_VN', title, description, url: '/su-kien' },
  };
}

/** /su-kien — mọi sự kiện các game gửi lên (đang diễn ra, sắp tới, đã kết thúc 30 ngày). */
export default async function EventsPage() {
  const [active, finished] = await Promise.all([
    getAnnouncements({ status: ['live', 'open', 'upcoming'], limit: 60 }),
    getAnnouncements({ status: ['finished', 'cancelled'], limit: 30 }),
  ]);
  return <EventsIndex active={active} finished={finished} />;
}
