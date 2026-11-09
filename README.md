# ANT Play

Portal game Next.js (App Router + TypeScript + Tailwind) cho các game của ANT. Mỗi game chạy trong iframe từ domain riêng.

Danh sách game, URL iframe, nội dung VI/EN và SEO từng game được quản lý trong **admin CMS** (`CMS_Blog_Fe_main`) và lấy qua API (`web-game-server`, `GET /api/v1/public/games`). Thêm/sửa/ẩn game không cần build lại portal.

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
SITE_URL=http://localhost:3100
API_INTERNAL_URL=http://host.docker.internal:3000
REVALIDATE_SECRET=<chuỗi bí mật dùng chung với API>
```

- `API_INTERNAL_URL` (runtime): địa chỉ API mà server Next.js gọi, không kèm `/api/v1`. Trong Docker phải là địa chỉ container truy cập được (`http://api:3000` nếu cùng network, `http://host.docker.internal:3000` nếu API chạy trên host) — `localhost` trong container là chính container web.
- `REVALIDATE_SECRET` (runtime): phải trùng với `REVALIDATE_SECRET` của API. API gọi `POST /api/revalidate` sau mỗi lần sửa game để portal cập nhật ngay.
- `SITE_URL` (build): origin công khai cho canonical/Open Graph/sitemap.
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
app/                     Trang chủ, /games/[slug], 404, sitemap, robots, /api/revalidate (webhook)
components/              Header (chỉ logo), footer, thẻ game
lib/api/games.ts         Lấy danh sách/chi tiết game từ API (cache theo tag `games`, `game:<slug>`)
modules/home/            Banner game nổi bật, "Chơi gần đây" (localStorage)
modules/games/           Trang chơi: iframe tự tải, thanh tên + toàn màn hình dưới khung, "Chơi thêm"
public/games/            Ảnh bìa có sẵn của các game ban đầu (CMS có thể trỏ tới hoặc dùng ảnh upload)
public/apple-worm/       Bản Apple Worm đi kèm (route /embed/apple-worm)
```

## Game

Game được quản lý trong admin CMS: URL iframe, ảnh, badge, nổi bật (banner trang chủ), thứ tự, tỉ lệ khung, thuộc tính `allow`/`sandbox` của iframe, có hỗ trợ đổi ngôn ngữ hay không, nội dung VI/EN và SEO (title, description, keywords, Open Graph, canonical, robots). Chỉ game ở trạng thái **Published** hiện trên portal.

Cập nhật dữ liệu:
- Sau mỗi thay đổi, API gọi `POST /api/revalidate` (header `x-revalidate-secret`, body `{ "tags": ["games", "game:<slug>"] }`). Request kế tiếp vào trang nhận bản cũ và kích hoạt tạo lại; các request sau nhận bản mới.
- Dữ liệu cũng tự làm mới tối đa 5 phút/lần nếu webhook bị lỡ.
- API lỗi khi đang chạy: portal tiếp tục phục vụ bản đã cache gần nhất.
- Build không cần API. Nếu lúc build không gọi được API, trang chủ/sitemap được build rỗng và trang game được tạo khi có request đầu tiên; webhook hoặc 5 phút sau sẽ làm mới.

SEO trang game (trường để trống trong CMS dùng giá trị mặc định): title `{tên game} — Chơi online miễn phí`, description = mô tả ngắn, canonical `/games/{slug}`, ảnh chia sẻ = OG image của SEO → OG image của game → ảnh bìa. Sitemap bỏ qua game đặt `noindex`.

Vào trang game là iframe tải ngay (không cần bấm Play). Game bật `passParentOrigin` (City Bloxx) nhận thêm `parentOrigin` để xác thực postMessage.

Chess Pro thay thế Pool; URL cũ `/games/pool-9-ball` chuyển hướng tới `/games/chess-pro`. Game Chess chạy Docker từ `D:\ANT_1\chess-online-main` ở port `11926`. Domain `chess.antfootage.net` cần trỏ DNS và reverse proxy về port này (Caddyfile mẫu nằm trong thư mục game).

Để xem portal cùng Chess trên máy, chạy PowerShell trong thư mục portal:

```powershell
$env:APP_PORT='11925'
docker compose -f compose.yaml -f compose.chess-local.yaml up -d --build
```

Mở `http://localhost:11925/games/chess-pro`. Muốn iframe trỏ vào bản local thì đổi URL iframe của Chess Pro trong admin CMS thành `http://localhost:11926/embed`.

## Đa ngôn ngữ (VI / EN)

- Nút **VI | EN** trên header. Lựa chọn lưu ở `localStorage` (`ant-lang`), mặc định tiếng Việt. Server luôn render tiếng Việt (SEO), trình duyệt đổi sang ngôn ngữ đã chọn sau khi tải.
- Chữ giao diện nằm ở `constants/i18n.ts`; chữ của từng game (VI/EN) nhập trong admin CMS.
- Đồng bộ với game (chỉ với game bật "hỗ trợ đổi ngôn ngữ" trong CMS):
  - Khi mở game, portal thêm `?lang=vi|en` vào URL iframe.
  - Đổi ngôn ngữ khi game đang mở thì portal gửi `postMessage({ type: 'ant-play:locale', locale })` xuống iframe, game đổi ngay mà không tải lại.
  - City Bloxx, Cờ Cá Ngựa, Block Puzzle, Cờ Caro và Cờ Tướng hỗ trợ cả hai cách trên. Apple Worm là bản Flash đóng gói sẵn, chữ nằm trong file game nên không đổi được.

## Thêm game

Thêm game trong admin CMS: dán URL iframe → API kiểm tra nhúng được không → nhập nội dung VI/EN, ảnh, SEO → Publish. Portal hiện game mới mà không cần build lại. Site game phải cho phép nhúng: **không** gửi `X-Frame-Options: SAMEORIGIN/DENY`, và `Content-Security-Policy: frame-ancestors` phải chứa domain web game (Ludo và Block Puzzle dùng env `EMBED_FRAME_ANCESTORS`).

## Apple Worm và SEO
Xem [APPLE-WORM-DEPLOY.md](./APPLE-WORM-DEPLOY.md).
