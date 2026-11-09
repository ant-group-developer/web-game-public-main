# ANT Play

Portal game Next.js (App Router + TypeScript + Tailwind) cho 4 game của ANT: City Bloxx, Apple Worm, Cờ Cá Ngựa, Block Puzzle. Mỗi game chạy trong iframe từ domain riêng.

## Chạy project

Yêu cầu Node.js 20.9+ (khuyến nghị Node.js 22/24).

```bash
npm install
npm run dev
```

Mở **http://localhost:3100** (cổng 3000 trên máy đang được ứng dụng khác sử dụng).

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

## Deploy bằng Docker

Tạo file `.env` từ `.env.example` rồi chỉnh port:

```bash
cp .env.example .env
docker compose up -d --build
```

Trên PowerShell, dùng `Copy-Item .env.example .env` thay cho `cp` nếu cần.

```dotenv
APP_PORT=3100
PORT=3000
BIND_ADDRESS=0.0.0.0
APP_IMAGE=ant-play:latest
TZ=Asia/Ho_Chi_Minh
```

- `APP_PORT`: port truy cập trên server/host. Ví dụ `8080` → `http://IP-SERVER:8080`.
- `PORT`: port Next.js chạy bên trong container; Docker Compose tự map với `APP_PORT`.
- `BIND_ADDRESS`: `0.0.0.0` để truy cập qua IP server, hoặc `127.0.0.1` nếu Nginx/Caddy trên cùng host đứng phía trước.
- `APP_IMAGE`: tên/tag image được build và chạy.
- `TZ`: múi giờ container.

Đổi port trong `.env` rồi chạy `docker compose up -d` để tạo lại container, không cần build lại. Nếu host đang chạy `npm start` ở port 3100, hãy dừng process đó hoặc chọn `APP_PORT` khác.

```bash
docker compose ps
docker compose logs -f --tail=100 web
docker compose up -d --build   # Cập nhật code và deploy lại
docker compose down           # Dừng và gỡ container của project
```

Container có healthcheck tại `/api/health`, tự khởi động lại khi lỗi và chạy bằng user không phải root. Image production dùng Next.js standalone, kèm đầy đủ thumbnail, favicon và font local. `.env`, cache và `node_modules` trên máy host được loại khỏi build context.

Nếu có domain HTTPS, cấu hình reverse proxy trỏ về `127.0.0.1:APP_PORT`.

Có thể dùng file env riêng:

```bash
docker compose --env-file .env.production up -d --build
```

## Cấu trúc

```text
app/                     Trang chủ, /games/[slug], 404, sitemap, robots
components/              Header (chỉ logo), footer, thẻ game
modules/home/            Banner game nổi bật, "Chơi gần đây" (localStorage)
modules/games/           Trang chơi: iframe tự tải, thanh tên + toàn màn hình dưới khung, "Chơi thêm"
constants/games.ts       Danh sách 4 game + URL embed
public/games/            Ảnh bìa (vuông) của từng game
public/apple-worm/       Bản Apple Worm đi kèm (route /embed/apple-worm)
```

## Game

| Game | Trang | URL iframe mặc định | Env (đọc lúc build) |
|---|---|---|---|
| City Bloxx | /games/city-bloxx | https://citybloxx.antfootage.net/embed?screen=quick | NEXT_PUBLIC_CITY_BLOXX_EMBED_URL |
| Apple Worm | /games/apple-worm | https://apple-worm.antfootage.net/embed/apple-worm | NEXT_PUBLIC_APPLE_WORM_EMBED_URL |
| Cờ Cá Ngựa | /games/co-ca-ngua | https://ludo.antfootage.net/ | NEXT_PUBLIC_LUDO_EMBED_URL |
| Block Puzzle | /games/block-puzzle | https://block-puzzle.antfootage.net/play | NEXT_PUBLIC_BLOCK_PUZZLE_EMBED_URL |
| Cờ Caro (Infinite XO) | /games/co-caro | https://xo.antfootage.net/ | NEXT_PUBLIC_XO_EMBED_URL |
| Cờ Tướng (Xiangqi) | /games/co-tuong | https://co-tuong.antfootage.net/ | NEXT_PUBLIC_XIANGQI_EMBED_URL |
| Cờ Vua (Chess Pro) | /games/chess-pro | https://chess.antfootage.net/embed | NEXT_PUBLIC_CHESS_EMBED_URL |
| Khủng Long Chạy (Dinosaur Game) | /games/dinosaur-game | https://dino.antfootage.net/embed | NEXT_PUBLIC_DINO_EMBED_URL |

Vào trang game là iframe tải ngay (không cần bấm Play). City Bloxx nhận thêm `parentOrigin` để xác thực postMessage.

Chess Pro thay thế Pool; URL cũ `/games/pool-9-ball` chuyển hướng tới `/games/chess-pro`. Game Chess chạy Docker từ `D:\ANT_1\chess-online-main` ở port `11926`. Domain `chess.antfootage.net` cần trỏ DNS và reverse proxy về port này (Caddyfile mẫu nằm trong thư mục game).

Để xem portal cùng Chess trên máy, chạy PowerShell trong thư mục portal:

```powershell
$env:APP_PORT='11925'
docker compose -f compose.yaml -f compose.chess-local.yaml up -d --build
```

Mở `http://localhost:11925/games/chess-pro`. Bản local dùng iframe `http://localhost:11926/embed`; compose mặc định vẫn dùng domain chính thức.

## Đa ngôn ngữ (VI / EN)

- Nút **VI | EN** trên header. Lựa chọn lưu ở `localStorage` (`ant-lang`), mặc định tiếng Việt. Server luôn render tiếng Việt (SEO), trình duyệt đổi sang ngôn ngữ đã chọn sau khi tải.
- Chữ giao diện nằm ở `constants/i18n.ts`; chữ của từng game nằm trong `text.vi` / `text.en` ở `constants/games.ts`.
- Đồng bộ với game:
  - Khi mở game, portal thêm `?lang=vi|en` vào URL iframe. Không cần ghi `lang` trong env.
  - Đổi ngôn ngữ khi game đang mở thì portal gửi `postMessage({ type: 'ant-play:locale', locale })` xuống iframe, game đổi ngay mà không tải lại.
  - City Bloxx, Cờ Cá Ngựa, Block Puzzle, Cờ Caro và Cờ Tướng hỗ trợ cả hai cách trên. Apple Worm là bản Flash đóng gói sẵn, chữ nằm trong file game nên không đổi được.

Thêm game mới: thêm một mục vào `constants/games.ts` (kèm `text.vi` và `text.en`) + ảnh vuông vào `public/games/`. Site game phải cho phép nhúng: **không** gửi `X-Frame-Options: SAMEORIGIN/DENY`, và `Content-Security-Policy: frame-ancestors` phải chứa domain web game (Ludo và Block Puzzle dùng env `EMBED_FRAME_ANCESTORS`).

## Apple Worm và SEO
Xem [APPLE-WORM-DEPLOY.md](./APPLE-WORM-DEPLOY.md).
