export const locales = ['vi', 'en'] as const;
export type Locale = (typeof locales)[number];
export const DEFAULT_LOCALE: Locale = 'vi';

export const localeNames: Record<Locale, string> = { vi: 'Tiếng Việt', en: 'English' };

export const isLocale = (value: unknown): value is Locale => locales.includes(value as Locale);

const vi = {
  'site.home': 'Trang chủ',
  'site.skip': 'Vào nội dung',
  'lang.label': 'Ngôn ngữ',
  'home.allGames': 'Tất cả game',
  'home.recent': 'Chơi gần đây',
  'home.count': '{count} game',
  'home.countOne': '{count} game',
  'home.empty': 'Không có game nào khớp “{query}”.',
  'search.label': 'Tìm game',
  'search.placeholder': 'Tìm game…',
  'search.clear': 'Xoá tìm kiếm',
  'hero.label': 'Game nổi bật',
  'hero.pick': 'Chọn game nổi bật',
  'play.cta': 'CHƠI',
  'play.ctaNow': ' NGAY',
  'play.game': 'Chơi {title}',
  'play.loading': 'Đang tải {title}…',
  'play.reload': 'Tải lại game',
  'play.fullscreen': 'Toàn màn hình',
  'play.exitFullscreen': 'Thoát toàn màn hình',
  'play.back': 'Về trang chủ',
  'detail.info': 'Giới thiệu & cách chơi',
  'detail.author': 'Tác giả: {name}',
  'detail.more': 'Chơi thêm',
  'detail.screenshots': 'Hình ảnh trong game',
  'detail.back': 'Tất cả game',
  'badge.new': 'MỚI',
  'badge.hot': 'HOT',
  'notFound.title': 'Không tìm thấy game',
};

export type MessageKey = keyof typeof vi;

const en: Record<MessageKey, string> = {
  'site.home': 'Home',
  'site.skip': 'Skip to content',
  'lang.label': 'Language',
  'home.allGames': 'All games',
  'home.recent': 'Recently played',
  'home.count': '{count} games',
  'home.countOne': '{count} game',
  'home.empty': 'No games match “{query}”.',
  'search.label': 'Search games',
  'search.placeholder': 'Search games…',
  'search.clear': 'Clear search',
  'hero.label': 'Featured games',
  'hero.pick': 'Choose a featured game',
  'play.cta': 'PLAY',
  'play.ctaNow': ' NOW',
  'play.game': 'Play {title}',
  'play.loading': 'Loading {title}…',
  'play.reload': 'Reload game',
  'play.fullscreen': 'Fullscreen',
  'play.exitFullscreen': 'Exit fullscreen',
  'play.back': 'Back to home',
  'detail.info': 'About & how to play',
  'detail.author': 'Author: {name}',
  'detail.more': 'More games',
  'detail.screenshots': 'Screenshots',
  'detail.back': 'All games',
  'badge.new': 'NEW',
  'badge.hot': 'HOT',
  'notFound.title': 'Game not found',
};

export const dictionary: Record<Locale, Record<MessageKey, string>> = { vi, en };
