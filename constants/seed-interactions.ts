/**
 * DỮ LIỆU MẪU cho phần tương tác ở trang game (thích/không thích, bình luận).
 * Chưa có API review nên tạm sinh từ slug (cố định cho mỗi game, server và client khớp nhau).
 * TODO(review): thay bằng dữ liệu thật từ API review khi làm phần review cho từng game.
 */

export interface SeedReply {
  id: string;
  name: string;
  /** Phản hồi từ nhà phát triển (hiện nhãn NHÀ PHÁT TRIỂN, tên = tên web). */
  dev?: boolean;
  daysAgo: number;
  text: string;
}

export interface SeedComment {
  id: string;
  name: string;
  daysAgo: number;
  text: string;
  likes: number;
  replies: SeedReply[];
}

const NAMES = ['Minh Anh', 'Tuấn Kiệt', 'Hoàng Long', 'Thu Trang', 'Quốc Bảo', 'Ngọc Hân', 'Đức Huy', 'Mai Phương', 'Gia Bảo', 'Khánh Linh'];

const TEXTS = [
  'Game chạy mượt trên điện thoại, chơi giờ nghỉ trưa rất hợp.',
  'Càng về sau càng khó, ai qua được màn khó chỉ mình với!',
  'Mong có thêm bảng xếp hạng để thi với bạn bè.',
  'Đồ hoạ dễ thương, nhạc nền vui tai. Cho 5 sao.',
  'Chơi trên máy tính bằng bàn phím tiện hơn hẳn.',
  'Lâu lắm mới thấy game nhẹ mà cuốn thế này, không cần cài gì.',
  'Có nút chơi lại nhanh thì tuyệt, nhiều lúc bấm nhầm.',
  'Con mình rất thích, chơi xong còn đòi chơi tiếp.',
];

const REPLIES = [
  'Mình cũng thấy vậy, chơi mãi không chán.',
  'Thử chậm lại một chút ở đoạn đầu là qua được đó bạn.',
  'Đồng ý, chơi chung với bạn bè vui hơn hẳn.',
];

const DEV_REPLIES = [
  'Cảm ơn bạn đã góp ý! Chúng tôi sẽ cân nhắc trong bản cập nhật tới.',
  'Cảm ơn bạn! Tính năng này đang nằm trong danh sách cải thiện.',
];

/** Số giả ngẫu nhiên cố định theo chuỗi (mulberry32 từ hash FNV-1a). */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let x = h;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedInteractions(slug: string) {
  const r = rng(slug);
  const pick = <T,>(list: T[]) => list[Math.floor(r() * list.length)];
  const likes = 200 + Math.floor(r() * 1800);
  const dislikes = Math.floor(likes * (0.04 + r() * 0.08));
  // Fisher–Yates với số giả ngẫu nhiên cố định (sort với comparator ngẫu nhiên cho kết quả khác nhau giữa các engine JS).
  const shuffle = <T,>(list: T[]) => {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  const texts = shuffle(TEXTS).slice(0, 5);
  const names = shuffle(NAMES);
  const comments: SeedComment[] = texts.map((text, i) => {
    const replies: SeedReply[] = [];
    if (i === 0) {
      replies.push({ id: `${slug}-r0`, name: names[6], daysAgo: 2, text: pick(REPLIES) });
      replies.push({ id: `${slug}-r1`, name: '', dev: true, daysAgo: 1, text: pick(DEV_REPLIES) });
    } else if (r() > 0.6) {
      replies.push({ id: `${slug}-r${i}`, name: names[(6 + i) % names.length], daysAgo: 1 + i, text: pick(REPLIES) });
    }
    return {
      id: `${slug}-c${i}`,
      name: names[i],
      daysAgo: [2, 5, 7, 14, 21][i] ?? 30,
      text,
      likes: Math.floor(r() * 40),
      replies,
    };
  });
  return { likes, dislikes, comments };
}

/** Màu avatar theo tên (chữ tối trên nền sáng, đủ tương phản). */
export const AVATAR_COLORS = ['#9d85d1', '#12b5dc', '#f981ad', '#e8fc77', '#7dd3a8', '#f5b16b'];
export const avatarColor = (name: string) => AVATAR_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]).join('').toUpperCase();
