import Image from 'next/image';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Image src="/brand/logo32.png" width={20} height={20} alt="" />
      <span>© {new Date().getFullYear()} ANT Play</span>
    </footer>
  );
}
