import type { Game } from '@/types/game';

// Chỉ các game của ANT. Mỗi URL embed đọc từ env lúc build (NEXT_PUBLIC_*), có giá trị mặc định là domain production.
export const games: Game[] = [
  {
    slug: 'city-bloxx',
    title: 'City Bloxx',
    tagline: 'Thả chuẩn, xây cao',
    image: '/games/city-bloxx.svg',
    tint: '#CDEBFF',
    tags: ['Xây tháp', 'PvP 1v1'],
    badge: 'MỚI',
    embedUrl: process.env.NEXT_PUBLIC_CITY_BLOXX_EMBED_URL || 'https://citybloxx.antfootage.net/embed?lang=vi&screen=quick',
    passParentOrigin: true,
    description: 'Chơi City Bloxx online miễn phí: canh thời điểm thả từng tầng nhà, xếp tháp thật chính xác và xây cả thành phố. Có thử thách hằng ngày và Solo PvP 1v1.',
    about: [
      'City Bloxx là game xây tháp thử thách phản xạ. Khối nhà đung đưa trên cần cẩu, bạn thả đúng lúc để các tầng chồng ngay ngắn và đón thêm dân cư.',
      'Chơi nhanh một tòa tháp, phát triển thành phố, thử thách hằng ngày hoặc so tài Solo PvP 1v1 ngay trong khung game.',
    ],
    instructions: [
      'Nhấp chuột, chạm màn hình hoặc nhấn Space để thả tầng nhà.',
      'Thả khi khối nhà thẳng với tầng bên dưới để được cú thả hoàn hảo.',
      'Mở menu trong game để đổi chế độ, xem thống kê và bật/tắt âm thanh.',
    ],
  },
  {
    slug: 'apple-worm',
    title: 'Apple Worm',
    tagline: 'Ăn táo, tìm lối thoát',
    image: '/games/apple-worm.jpg',
    ogImage: '/seo/apple-worm-og.jpg',
    tint: '#D6F2C8',
    tags: ['Giải đố', '30 màn'],
    badge: 'HOT',
    embedUrl: process.env.NEXT_PUBLIC_APPLE_WORM_EMBED_URL || 'https://apple-worm.antfootage.net/embed/apple-worm',
    // Khung hẹp hơn 16:9 thì game cắt mất nút chơi lại, menu và số màn ở 2 bên.
    aspectRatio: 16 / 9,
    author: 'Gibton',
    description: 'Chơi Apple Worm online miễn phí. Điều khiển sâu ăn táo, tăng chiều dài và tìm đường đến cổng thoát qua 30 màn giải đố ngay trên trình duyệt.',
    about: [
      'Điều khiển chú sâu xanh ăn táo và tìm đường đến cổng xoáy để qua màn.',
      'Mỗi quả táo giúp sâu dài thêm. Dùng chiều dài để bắc qua khoảng trống, nhưng tính kỹ đường đi để không bị kẹt.',
    ],
    instructions: [
      'Phím mũi tên hoặc W A S D để di chuyển; trên điện thoại dùng nút trong game.',
      'Ăn táo để dài thêm, đi tới cổng xoáy để hoàn thành màn.',
      'Bị kẹt? Bấm biểu tượng chơi lại để làm lại màn.',
    ],
  },
  {
    slug: 'co-ca-ngua',
    title: 'Cờ Cá Ngựa',
    tagline: '2–4 người, chơi online',
    image: '/games/ludo.svg',
    ogImage: '/seo/ludo-og.png',
    tint: '#E6DEFC',
    tags: ['2–4 người', 'Online'],
    badge: 'MỚI',
    embedUrl: process.env.NEXT_PUBLIC_LUDO_EMBED_URL || 'https://ludo.antfootage.net/',
    description: 'Chơi cờ cá ngựa (Ludo) online miễn phí, 2–4 người. Đấu với máy, chuyền máy cho bạn bè hoặc tạo phòng online và gửi link mời. Không cần tải, không cần đăng ký.',
    about: [
      'Cờ cá ngựa quen thuộc trên trình duyệt: gieo xúc xắc, đưa cả 4 quân về chuồng trước để chiến thắng.',
      'Chơi trên máy với bot, chuyền máy cho bạn bè, hoặc tạo phòng online tối đa 4 người và gửi mã phòng cho bạn bè.',
    ],
    instructions: [
      'Chọn “Chơi trên máy” hoặc “Chơi online”.',
      'Gieo xúc xắc, chọn quân để đi. Đá quân đối thủ về chuồng khi đi trúng ô.',
      'Chơi online: tạo phòng rồi gửi mã 6 ký tự cho bạn bè.',
    ],
  },
  {
    slug: 'block-puzzle',
    title: 'Block Puzzle',
    tagline: 'Xếp khối, phá hàng',
    image: '/games/block-puzzle.svg',
    tint: '#FFE9C2',
    tags: ['Xếp khối', 'Thử thách ngày'],
    embedUrl: process.env.NEXT_PUBLIC_BLOCK_PUZZLE_EMBED_URL || 'https://block-puzzle.antfootage.net/play',
    description: 'Chơi Block Puzzle 8×8 online miễn phí: kéo khối vào bàn, lấp đầy hàng hoặc cột để phá, nối combo để lấy điểm cao. Có thử thách hằng ngày, màn chơi và đấu 1v1.',
    about: [
      'Kéo 3 khối vào bàn 8×8. Lấp đầy một hàng hoặc một cột để xoá và ghi điểm.',
      'Phá nhiều hàng cùng lúc hoặc liên tiếp để nối combo. Hết chỗ đặt khối là kết thúc ván.',
    ],
    instructions: [
      'Kéo thả khối từ khay xuống bàn chơi.',
      'Lấp kín hàng ngang hoặc cột dọc để phá khối.',
      'Để chừa chỗ cho khối lớn và giữ combo để nhân điểm.',
    ],
  },
];

export const getGame = (slug: string) => games.find((game) => game.slug === slug);
