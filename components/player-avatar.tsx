import Image from 'next/image';
import type { ZozoPlayer } from '@/packages/zozo-sdk/src/core';

const COLORS = ['#e8fc77', '#f981ad', '#9d85d1', '#7fd8f0', '#ffb86b', '#8be0a4'];

/** Ảnh đại diện người chơi, không có ảnh thì hiện chữ cái đầu của tên trên nền màu theo id. */
export function PlayerAvatar({ player, size = 32 }: { player: Pick<ZozoPlayer, 'id' | 'displayName' | 'avatarUrl'>; size?: number }) {
  if (player.avatarUrl) {
    return <Image className="pavatar" src={player.avatarUrl} alt="" width={size} height={size} unoptimized referrerPolicy="no-referrer" />;
  }
  let hash = 0;
  for (const ch of player.id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const initial = Array.from(player.displayName.trim())[0]?.toUpperCase() ?? '?';
  return (
    <span className="pavatar" aria-hidden="true" style={{ width: size, height: size, fontSize: Math.round(size * 0.44), background: COLORS[Math.abs(hash) % COLORS.length] }}>
      {initial}
    </span>
  );
}
