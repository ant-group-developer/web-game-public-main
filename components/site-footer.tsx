import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="flex items-center gap-3"><Image src="/brand/logo64.png" width={36} height={36} alt="" /><span className="font-display text-2xl font-bold">ANT Play</span></div>
      <p>A little break. A lot of fun.</p>
      <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-3"><Link href="/">Home</Link><Link href="/?category=all">All games</Link><Link href="/?category=new">New games</Link><Link href="/?category=favorites">Favorites</Link><Link href="/#about">About ANT Play</Link></nav>
      <span className="mt-7 flex items-center gap-1.5 text-xs opacity-60">Made for the love of play <Heart size={12} /> · © {new Date().getFullYear()} ANT Play</span>
    </footer>
  );
}
