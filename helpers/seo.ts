const configured = process.env.SITE_URL || 'http://localhost:3100';
export const siteUrl = new URL(configured).origin;
export const absoluteUrl = (pathname: string) => new URL(pathname, siteUrl).toString();
