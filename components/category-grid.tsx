import Link from 'next/link';
import { ArrowRight, Grid2X2 } from 'lucide-react';
import { categories, extraCategories } from '@/constants/categories';

export function CategoryGrid() {
  return (
    <section aria-label="Game categories" className="category-section">
      <div className="category-grid">
        {categories.map(({ slug, title, icon: Icon, color }) => (
          <Link href={`/?category=${slug}`} className="category-tile" key={slug}>
            <span className="category-art" style={{ backgroundColor: color }}><Icon size={37} strokeWidth={2.5} /></span>
            <span>{title}</span><ArrowRight size={17} className="ml-auto opacity-40" />
          </Link>
        ))}
        {extraCategories.map(({ title, icon: Icon, href }) => <Link href={href} className="category-tile category-small" key={title}><Icon size={22} /><span>{title}</span></Link>)}
        <Link href="/?category=all" className="category-tile category-small"><Grid2X2 size={22} /><span>All Games</span></Link>
      </div>
    </section>
  );
}
