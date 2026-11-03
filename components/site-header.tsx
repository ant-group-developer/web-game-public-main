import Image from 'next/image';
import Link from 'next/link';

/** Header tối giản: chỉ logo (theo pattern Poki / Lagged — không đặt danh sách game ở đây). */
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="ANT Play — Trang chủ">
          <Image src="/brand/logo64.png" alt="" width={38} height={38} priority />
          <span>ANT <b>Play</b></span>
        </Link>
      </div>
    </header>
  );
}
