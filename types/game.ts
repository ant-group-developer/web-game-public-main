export interface Game {
  slug: string;
  title: string;
  image: string;
  categories: string[];
  featured: number;
  isNew: boolean;
  sourcePage: string;
  embedUrl?: string;
  tagline?: string;
  description?: string;
  about?: string[];
  instructions?: string[];
  tips?: string[];
  language?: string;
}
