import type { Game } from '@/types/game';

// Chỉ các game của ANT. Mỗi URL embed đọc từ env lúc build (NEXT_PUBLIC_*), có giá trị mặc định là domain production.
// Ngôn ngữ (?lang=vi|en) do portal tự thêm theo lựa chọn của người chơi, không cần ghi trong URL.
export const games: Game[] = [
  {
    slug: 'city-bloxx',
    image: '/games/wide/city-bloxx-thumbnail.webp',
    cover: '/games/wide/city-bloxx-thumbnail.webp',
    tint: '#CDEBFF',
    badge: 'new',
    embedUrl: process.env.NEXT_PUBLIC_CITY_BLOXX_EMBED_URL || 'https://citybloxx.antfootage.net/embed?screen=quick',
    passParentOrigin: true,
    text: {
      vi: {
        title: 'City Bloxx',
        tags: ['Xây tháp', 'PvP 1v1'],
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
      en: {
        title: 'City Bloxx',
        tags: ['Tower building', '1v1 PvP'],
        description: 'Play City Bloxx online for free: time every floor drop, stack a perfect tower and build a whole city. Includes a daily challenge and 1v1 Solo PvP.',
        about: [
          'City Bloxx is a reflex tower-building game. Floors swing from a crane; drop them at the right moment to stack them neatly and bring in more residents.',
          'Build a quick tower, grow your city, take on the daily challenge or face a rival in 1v1 Solo PvP, all inside the game frame.',
        ],
        instructions: [
          'Click, tap the screen or press Space to drop a floor.',
          'Drop when the floor lines up with the one below for a perfect drop.',
          'Open the in-game menu to switch modes, view stats and toggle sound.',
        ],
      },
    },
  },
  {
    slug: 'apple-worm',
    image: '/games/wide/apple-worm-thumbnail.webp',
    cover: '/games/wide/apple-worm-thumbnail.webp',
    ogImage: '/seo/apple-worm-og.jpg',
    tint: '#D6F2C8',
    badge: 'hot',
    embedUrl: process.env.NEXT_PUBLIC_APPLE_WORM_EMBED_URL || 'https://apple-worm.antfootage.net/embed/apple-worm',
    // Khung hẹp hơn 16:9 thì game cắt mất nút chơi lại, menu và số màn ở 2 bên.
    aspectRatio: 16 / 9,
    author: 'Gibton',
    text: {
      vi: {
        title: 'Apple Worm',
        tags: ['Giải đố', '30 màn'],
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
      en: {
        title: 'Apple Worm',
        tags: ['Puzzle', '30 levels'],
        description: 'Play Apple Worm online for free. Guide the worm to eat apples, grow longer and reach the exit portal across 30 puzzle levels, right in your browser.',
        about: [
          'Guide the little green worm to eat apples and find its way to the swirling portal to clear each level.',
          'Every apple makes the worm longer. Use that length to bridge gaps, but plan your path so you do not get stuck.',
        ],
        instructions: [
          'Use the arrow keys or W A S D to move; on phones use the in-game buttons.',
          'Eat apples to grow, then reach the portal to finish the level.',
          'Stuck? Press the restart icon to replay the level.',
        ],
      },
    },
  },
  {
    slug: 'co-ca-ngua',
    image: '/games/wide/co-ca-ngua-thumbnail.webp',
    cover: '/games/wide/co-ca-ngua-thumbnail.webp',
    ogImage: '/seo/ludo-og.png',
    tint: '#E6DEFC',
    badge: 'new',
    embedUrl: process.env.NEXT_PUBLIC_LUDO_EMBED_URL || 'https://ludo.antfootage.net/',
    text: {
      vi: {
        title: 'Cờ Cá Ngựa',
        tags: ['2–4 người', 'Online'],
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
      en: {
        title: 'Ludo',
        tags: ['2–4 players', 'Online'],
        description: 'Play Ludo online for free with 2–4 players. Battle bots, pass the device to friends or create an online room and share the invite link. No download, no sign-up.',
        about: [
          'The classic board game in your browser: roll the dice and race all 4 tokens home first to win.',
          'Play against bots, pass the device to friends, or create an online room for up to 4 players and share the room code.',
        ],
        instructions: [
          'Choose “Play on this device” or “Play online”.',
          'Roll the dice and pick a token to move. Land on a rival token to send it back to base.',
          'Online: create a room, then send the 6-character code to your friends.',
        ],
      },
    },
  },
  {
    slug: 'co-caro',
    image: '/games/wide/co-caro-thumbnail-5-in-row.webp',
    cover: '/games/wide/co-caro-thumbnail-5-in-row.webp',
    tint: '#F3DBFF',
    badge: 'new',
    embedUrl: process.env.NEXT_PUBLIC_XO_EMBED_URL || 'https://xo.antfootage.net/',
    text: {
      vi: {
        title: 'Cờ Caro',
        tags: ['Bàn cờ vô hạn', 'Online'],
        description: 'Chơi cờ caro (XO) online miễn phí trên bàn cờ không giới hạn. Xếp 5 quân liên tiếp để thắng, đấu với máy 3 mức độ, chơi 2 người trên một máy hoặc tạo phòng online.',
        about: [
          'Cờ caro trên bàn cờ không giới hạn: hai người lần lượt đặt X và O, ai xếp được 5 quân liên tiếp trước là thắng.',
          'Đấu với máy ở mức Dễ, Vừa hoặc Khó, chơi 2 người trên cùng một máy, hoặc tạo phòng online và gửi link mời cho bạn bè.',
        ],
        instructions: [
          'Chạm hoặc nhấp vào ô trống để đặt quân. X luôn đi trước.',
          'Xếp từ 5 quân liên tiếp theo hàng ngang, dọc hoặc chéo để thắng. Bị chặn cả hai đầu thì không tính.',
          'Kéo để di chuyển bàn cờ, cuộn chuột hoặc chụm 2 ngón để phóng to.',
        ],
      },
      en: {
        title: 'Infinite XO',
        tags: ['Endless board', 'Online'],
        description: 'Play Gomoku-style XO online for free on an endless board. Get 5 in a row to win, battle a bot on 3 levels, play 2 players on one device or create an online room.',
        about: [
          'Tic-tac-toe on an endless board: players take turns placing X and O, and the first to make 5 in a row wins.',
          'Play the bot on Easy, Medium or Hard, play 2 players on one device, or create an online room and share the invite link.',
        ],
        instructions: [
          'Tap or click an empty cell to place your mark. X always goes first.',
          'Make 5 or more in a row horizontally, vertically or diagonally to win. A line blocked at both ends does not count.',
          'Drag to move the board; scroll or pinch to zoom.',
        ],
      },
    },
  },
  {
    slug: 'co-tuong',
    image: '/games/wide/co-tuong-thumbnail.webp',
    cover: '/games/wide/co-tuong-thumbnail.webp',
    tint: '#FBE3C4',
    badge: 'new',
    embedUrl: process.env.NEXT_PUBLIC_XIANGQI_EMBED_URL || 'https://co-tuong.antfootage.net/',
    text: {
      vi: {
        title: 'Cờ Tướng',
        tags: ['Cờ trí tuệ', 'Online'],
        description: 'Chơi cờ tướng online miễn phí: đấu máy 6 mức độ từ Siêu dễ tới Bậc thầy, đấu xếp hạng Elo, tạo phòng chơi với bạn bè và xem trận trực tiếp.',
        about: [
          'Cờ tướng cho người Việt ngay trên trình duyệt. Máy có 6 mức độ từ Siêu dễ tới Bậc thầy, chạy ngay trên máy bạn, không cần mạng.',
          'Đấu xếp hạng với người chơi khác theo Elo, tạo phòng công khai hoặc riêng tư để chơi với bạn bè, hoặc vào xem các trận đang diễn ra.',
        ],
        instructions: [
          'Chọn “Chơi với máy”, “Đấu xếp hạng” hoặc “Chơi với bạn”.',
          'Bấm vào quân để xem nước đi hợp lệ, bấm vào ô đích để đi. Đỏ đi trước.',
          'Chiếu hết tướng đối phương hoặc khiến đối phương hết nước đi để thắng.',
        ],
      },
      en: {
        title: 'Xiangqi',
        tags: ['Strategy', 'Online'],
        description: 'Play Xiangqi (Chinese chess) online for free: 6 AI levels from Very easy to Master, Elo ranked matches, private rooms with friends and live spectating.',
        about: [
          'Xiangqi in your browser. The AI has 6 levels from Very easy to Master and runs on your device, no connection needed.',
          'Climb the Elo ladder in ranked matches, open a public or private room to play friends, or watch games that are live right now.',
        ],
        instructions: [
          'Choose “Play computer”, “Ranked game” or “Play a friend”.',
          'Tap a piece to see its legal moves, then tap a target point to move. Red moves first.',
          'Checkmate the enemy general or leave your opponent without a legal move to win.',
        ],
      },
    },
  },
  {
    slug: 'block-puzzle',
    image: '/games/wide/block-puzzle-thumbnail.webp',
    cover: '/games/wide/block-puzzle-thumbnail.webp',
    tint: '#FFE9C2',
    embedUrl: process.env.NEXT_PUBLIC_BLOCK_PUZZLE_EMBED_URL || 'https://block-puzzle.antfootage.net/play',
    text: {
      vi: {
        title: 'Block Puzzle',
        tags: ['Xếp khối', 'Thử thách ngày'],
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
      en: {
        title: 'Block Puzzle',
        tags: ['Block puzzle', 'Daily challenge'],
        description: 'Play 8×8 Block Puzzle online for free: drag blocks onto the board, fill rows or columns to clear them and chain combos for a high score. Includes a daily challenge, levels and 1v1 matches.',
        about: [
          'Drag 3 blocks onto the 8×8 board. Fill a whole row or column to clear it and score.',
          'Clear several lines at once or in a row to build combos. The game ends when no block fits.',
        ],
        instructions: [
          'Drag blocks from the tray onto the board.',
          'Fill a full row or column to clear it.',
          'Leave room for big blocks and keep your combo going to multiply points.',
        ],
      },
    },
  },
  {
    slug: 'chess-pro',
    image: '/games/chess-pro.png',
    cover: '/games/chess-pro.png',
    tint: '#E9DFC9',
    badge: 'new',
    embedUrl: process.env.NEXT_PUBLIC_CHESS_EMBED_URL || 'https://chess.antfootage.net/embed',
    text: {
      vi: {
        title: 'Cờ Vua',
        tags: ['Cờ trí tuệ', 'Giải thế cờ'],
        description: 'Chơi cờ vua Chess Pro miễn phí ngay trên trình duyệt: đấu máy, luyện giải thế cờ hoặc chơi cùng bạn bè.',
        about: ['Luyện chiến thuật với máy, giải các thế cờ và thử sức trong những ván cờ vua.'],
        instructions: ['Chọn chế độ chơi và mức độ phù hợp.', 'Chọn quân rồi chọn ô đích để đi.', 'Chiếu hết vua đối phương để thắng.'],
      },
      en: {
        title: 'Chess Pro',
        tags: ['Strategy', 'Chess puzzles'],
        description: 'Play Chess Pro for free in your browser: challenge the computer, solve chess puzzles or play with friends.',
        about: ['Practice against the computer, solve tactical puzzles and enjoy a game of chess.'],
        instructions: ['Choose a game mode and difficulty.', 'Select a piece, then select its destination square.', 'Checkmate the opposing king to win.'],
      },
    },
  },
  {
    slug: 'dinosaur-game',
    image: '/games/wide/dinosaur-game-thumbnail.webp',
    cover: '/games/wide/dinosaur-game-thumbnail.webp',
    tint: '#FFDDB8',
    badge: 'new',
    embedUrl: process.env.NEXT_PUBLIC_DINO_EMBED_URL || 'https://dino.antfootage.net/embed',
    text: {
      vi: {
        title: 'Khủng Long Chạy',
        tags: ['Chạy vô tận', 'Phản xạ'],
        description: 'Chơi game khủng long chạy online miễn phí: nhảy qua xương rồng, cúi né chim và chạy xa nhất có thể.',
        about: ['Khủng long chạy càng lúc càng nhanh. Nhảy qua xương rồng, né chim bay để giữ kỷ lục.'],
        instructions: ['Nhấn Space, mũi tên lên hoặc chạm màn hình để nhảy.', 'Nhấn mũi tên xuống để cúi người.'],
      },
      en: {
        title: 'Dinosaur Game',
        tags: ['Endless runner', 'Reflex'],
        description: 'Play the dinosaur runner online for free: jump over cacti, duck under birds and run as far as you can.',
        about: ['The dinosaur keeps getting faster. Jump over cacti and dodge birds to set a new record.'],
        instructions: ['Press Space, the up arrow or tap the screen to jump.', 'Press the down arrow to duck.'],
      },
    },
  },
];

export const getGame = (slug: string) => games.find((game) => game.slug === slug);
