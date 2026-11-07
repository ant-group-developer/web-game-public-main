import Image from 'next/image';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span className="site-footer-brand">
        <Image src="/brand/logo32.png" width={18} height={18} alt="" />
        ANT Play
      </span>
      <span>© {new Date().getFullYear()}</span>
    </footer>
  );
}
