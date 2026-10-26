const configured = process.env.SITE_URL || 'http://localhost:3100';
export const siteUrl = new URL(configured).origin;
export const absoluteUrl = (pathname: string) => new URL(pathname, siteUrl).toString();
export const siteDescription = 'Discover action, racing, puzzle and multiplayer games on ANT Play. Find your next favorite game and play in your browser.';
