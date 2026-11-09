/** Văn bản theo ngôn ngữ. `en` trống thì dùng `vi`. */
export interface LocalizedText {
  vi: string;
  en: string;
}

/** Cấu hình web do admin CMS quản lý (`GET /api/v1/public/site-config`). */
export interface SiteConfig {
  general: {
    siteName: string;
    tagline: LocalizedText;
    footerText: LocalizedText;
  };
  branding: {
    logoUrl: string;
    faviconUrl: string;
    /** Trống = dùng favicon. */
    appleTouchIconUrl: string;
    /** Ảnh chia sẻ mặc định 1200×630. */
    ogImageUrl: string;
    themeColor: string;
  };
  seo: {
    homeTitle: LocalizedText;
    homeDescription: LocalizedText;
    keywords: string[];
    /** Thêm sau tên game khi game chưa có tiêu đề SEO riêng, vd " — Chơi online miễn phí". */
    gameTitleSuffix: LocalizedText;
  };
}

export const pickText = (text: LocalizedText, locale: 'vi' | 'en') => (locale === 'en' && text.en.trim() ? text.en : text.vi);
