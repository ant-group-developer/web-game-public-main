const configured = process.env.SITE_URL || 'http://localhost:3100';
export const siteUrl = new URL(configured).origin;
export const absoluteUrl = (pathname: string) => new URL(pathname, siteUrl).toString();
export const siteDescription = 'Chơi City Bloxx, Apple Worm, Cờ Cá Ngựa, Cờ Tướng, Cờ Caro và Block Puzzle miễn phí ngay trên trình duyệt. Không cần tải, không cần đăng ký.';
