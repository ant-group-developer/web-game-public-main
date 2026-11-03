export interface Game {
  slug: string;
  title: string;
  /** Câu ngắn (≤ 6 chữ) hiển thị trên thẻ game. */
  tagline: string;
  /** Ảnh vuông dùng cho thẻ game. */
  image: string;
  /** Ảnh chia sẻ 1200×630 (Open Graph). */
  ogImage?: string;
  /** Màu nền nhạt phía sau ảnh game trên banner trang chủ. */
  tint: string;
  /** Nhãn ngắn hiển thị trên banner. */
  tags: string[];
  /** Nhãn góc thẻ game. */
  badge?: 'MỚI' | 'HOT';
  /** Tỉ lệ khung (rộng / cao) cố định cho game chỉ hiện đủ giao diện ở một tỉ lệ, ví dụ 16 / 9. */
  aspectRatio?: number;
  /** URL iframe của game (route embed của từng game). */
  embedUrl: string;
  /** Game nhận thêm ?parentOrigin=... để xác thực postMessage (City Bloxx). */
  passParentOrigin?: boolean;
  author?: string;
  description: string;
  about: string[];
  instructions: string[];
}
