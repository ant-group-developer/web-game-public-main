import type { Game } from '@/types/game';

export const cityBloxx: Game = {
  slug: 'city-bloxx',
  title: 'City Bloxx',
  tagline: 'Canh chuẩn từng tầng. Xây cả thành phố.',
  image: '/games/city-bloxx.svg',
  categories: ['skill', 'simulation', 'puzzle'],
  featured: 0,
  isNew: true,
  sourcePage: 'https://citybloxx.antfootage.net/',
  embedUrl: 'https://citybloxx.antfootage.net/embed?lang=vi&screen=quick',
  language: 'vi',
  description: 'Chơi City Bloxx trực tuyến: canh thời điểm thả từng tầng nhà, xếp tháp thật chính xác và phát triển thành phố của bạn. Khám phá xây tháp nhanh, thử thách hằng ngày và Solo PvP 1v1 ngay trên ANT Play.',
  about: [
    'City Bloxx là game xây tháp kết hợp phản xạ và khả năng căn thời điểm. Từng khối nhà đung đưa trên cần cẩu; nhiệm vụ của bạn là thả chúng đúng lúc để các tầng chồng lên nhau thật ngay ngắn. Một cú thả chuẩn giúp bạn giữ nhịp xây dựng, còn những lần đặt lệch khiến việc chinh phục tầng tiếp theo khó hơn.',
    'Bạn có thể bắt đầu bằng một ván xây tháp nhanh, chuyển sang phát triển thành phố hoặc thử sức trong các chế độ giới hạn thời gian. Muốn so tài? Mở sảnh Solo PvP 1v1 ngay trong khung game. Giao diện hỗ trợ tiếng Việt và tiếng Anh, chơi bằng chuột, bàn phím hoặc thao tác chạm.',
  ],
  instructions: [
    'Chọn chế độ và bắt đầu ván chơi trong khung game.',
    'Quan sát khối nhà đang di chuyển, chờ nó thẳng với tầng bên dưới.',
    'Nhấp chuột hoặc chạm vào vùng chơi để thả một tầng. Trên máy tính, bạn cũng có thể dùng Space hoặc Enter sau khi chọn khung game.',
    'Tiếp tục xếp các tầng thật chính xác để xây cao hơn và cải thiện thành tích của mình.',
  ],
  tips: [
    'Quan sát nhịp đung đưa trước khi thả; đừng vội bấm liên tục.',
    'Ưu tiên căn giữa các tầng và giữ nhịp ổn định khi tháp cao dần.',
    'Bật toàn màn hình để có vùng quan sát rộng hơn, đặc biệt khi chơi trên điện thoại.',
  ],
};

export const cityBloxxModes = [
  { screen: 'quick', title: 'Xây tháp nhanh', description: 'Vào ngay một ván chơi, căn từng cú thả và chinh phục kỷ lục của bạn.' },
  { screen: 'city', title: 'Xây thành phố', description: 'Phát triển khu phố và biến những tòa tháp thành một thành phố của riêng bạn.' },
  { screen: 'daily', title: 'Thử thách hằng ngày', description: 'Đổi gió với thử thách Daily Tower.' },
  { screen: 'pvp', title: 'Solo PvP 1v1', description: 'Mở sảnh PvP và so tài cùng người chơi khác.' },
  { screen: 'one-drop', title: 'One Drop', description: 'Chỉ một lần thả: đặt khối nhà lên tháp đang lắc với độ lệch nhỏ nhất.' },
  { screen: 'perfect-rush', title: 'Perfect Rush', description: '60 giây, 3 mạng: cố gắng đạt nhiều cú thả Hoàn hảo nhất có thể.' },
  { screen: 'skyline-sprint', title: 'Skyline Sprint', description: 'Chạy đua xây đủ 20 tầng; mỗi lần trượt cộng thêm 5 giây.' },
] as const;

export type CityBloxxScreen = typeof cityBloxxModes[number]['screen'];
