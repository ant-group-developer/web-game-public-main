/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, poweredByHeader: false, output: 'standalone',
  async redirects() { return [{ source: '/games/pool-9-ball', destination: '/games/chess-pro', permanent: true }]; },
  async rewrites() { return [{ source: '/embed/apple-worm', destination: '/apple-worm/index.html' }]; },
  async headers() {
    const embedHeaders = [
      { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
      { key: 'X-Robots-Tag', value: 'noindex, follow' },
      { key: 'Cache-Control', value: 'no-cache' },
    ];
    return [
      { source: '/:path*', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ] },
      // Chặn nhúng portal vào site khác, trừ bản Apple Worm đi kèm (có CSP riêng bên dưới — tránh gửi 2 header CSP).
      { source: '/((?!embed/apple-worm(?:/|$)|apple-worm/).*)', headers: [
        { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
      ] },
      { source: '/embed/apple-worm', headers: embedHeaders },
      { source: '/apple-worm/:path*', headers: embedHeaders },
    ];
  },
};
export default nextConfig;
