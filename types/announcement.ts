/** Thông báo sự kiện / giải đấu do backend từng game gửi lên ZOZO ID (platform phase 07). */
export type AnnouncementStatus = 'upcoming' | 'open' | 'live' | 'finished' | 'cancelled';
export type AnnouncementKind = 'event' | 'tournament' | 'news';

export interface AnnouncementHighlight {
  playerId?: string | null;
  name: string;
  avatarUrl?: string | null;
  value: string;
}

export interface Announcement {
  id: string;
  kind: AnnouncementKind;
  status: AnnouncementStatus;
  title: string;
  summary: string;
  bannerUrl: string | null;
  startsAt: string;
  endsAt: string;
  registrationEndsAt: string | null;
  highlights: AnnouncementHighlight[];
  participants: number | null;
  capacity: number | null;
  rewardText: string | null;
  metaText: string | null;
  pinned: boolean;
  game: { slug: string; title: { vi: string; en: string }; iconUrl: string | null; thumbnailUrl: string | null };
  /** `/games/<slug>?p=<đường dẫn trong game>` */
  href: string;
  path: string;
}

export interface PlayerBadge {
  id: string;
  title: string;
  tier: 'gold' | 'silver' | 'bronze' | 'special';
  imageUrl: string | null;
  detail: string | null;
  grantedAt: string;
  game: { slug: string; title: string } | null;
  href: string | null;
}
