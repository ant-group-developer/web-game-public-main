import type { Game } from '@/types/game';
export const appleWormDetails: Partial<Game> = {
  embedUrl: process.env.NEXT_PUBLIC_APPLE_WORM_EMBED_URL || 'https://apple-worm.antfootage.net/embed/apple-worm',
  language: 'vi',
  tagline: 'Ăn táo, dài thêm và tìm lối thoát',
  description: 'Chơi Apple Worm online miễn phí. Điều khiển sâu ăn táo, tăng chiều dài và tìm đường đến cổng thoát qua 30 màn giải đố ngay trên trình duyệt.',
  about: ['Apple Worm là game giải đố do Gibton tạo ra. Điều khiển chú sâu xanh ăn táo và tìm đường đến cổng xoáy để vượt qua các màn chơi.', 'Mỗi quả táo giúp chú sâu dài thêm. Dùng chiều dài để bắc qua khoảng trống, nhưng hãy tính đường đi để không bị mắc kẹt hoặc rơi khỏi nền đất.'],
  instructions: ['Dùng phím mũi tên hoặc W, A, S, D để di chuyển. Trên điện thoại, dùng các nút điều hướng trong game.', 'Ăn táo để tăng chiều dài và di chuyển tới cổng xoáy để hoàn thành màn.', 'Nhấn vào khung game trước khi dùng bàn phím; có thể mở toàn màn hình để chơi thoải mái.', 'Bấm biểu tượng chơi lại để bắt đầu lại màn khi bị kẹt.'],
  tips: ['Quan sát táo và cổng thoát trước khi di chuyển.', 'Giữ một phần cơ thể trên nền đất khi bắc qua khoảng trống.', 'Tính cả chiều dài sau khi ăn táo để có thể quay đầu.'],
};
