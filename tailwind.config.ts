import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './modules/**/*.{ts,tsx}', './layouts/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { background: 'var(--background)', foreground: 'var(--foreground)', brand: '#12b5dc' },
      fontFamily: { sans: ['var(--font-body)', 'Arial', 'sans-serif'], display: ['var(--font-display)', 'Arial', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config;
