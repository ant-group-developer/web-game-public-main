# ANT Play

Base Next.js App Router + TypeScript + Tailwind CSS cho website game, tham khảo cấu trúc `ag-release-client` và giao diện Poki. Logo/favicons sử dụng các file gốc trong `assets`.

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

Nếu có domain HTTPS, cấu hình reverse proxy trỏ về `127.0.0.1:APP_PORT`. City Bloxx tự truyền origin thực của website vào `/embed`, nên không cần sửa origin trong source khi đổi domain.

Có thể dùng file env riêng:

```bash
docker compose --env-file .env.production up -d --build
```

## Cấu trúc

```text
app/                   App Router, metadata, trang chủ, trang game, 404
components/            Navigation, search, game card, categories, footer
modules/home/          Lưới game và lọc danh mục
modules/games/         Trang chi tiết và khung chơi game
constants/games.json   Danh sách game và đường dẫn thumbnail local
constants/games.ts     Điểm cấu hình dữ liệu game
constants/categories.ts Danh mục và icon Lucide
hooks/use-library.ts   Yêu thích và lịch sử xem bằng localStorage
helpers/tailwind.ts    cn(): clsx + tailwind-merge, theo source tham khảo
styles/               Tailwind, global styles, responsive mosaic
public/brand/          Logo và favicon được copy từ assets/
public/games/          Thumbnail local
public/fonts/          Font Nunito local
```

Giữ cách tổ chức `app`, `components`, `modules`, `constants`, `helpers`, `hooks`, `types`, `styles` và alias `@/*` của source tham khảo. Base dùng Next.js 16 / React 19, Tailwind 3 và Lucide; không kéo theo phần CMS, authentication hoặc cấu hình nội bộ của project nhạc.

## Chức năng

- Trang chủ mosaic: ô game lớn/nhỏ, hover title, badge và responsive.
- Search panel có tìm kiếm tức thời, trạng thái không có kết quả, thao tác Escape/Tab.
- Lọc danh mục qua URL `/?category=car`, `/?category=puzzle`, `/?category=new`.
- Trang `/games/[slug]`, danh sách liên quan và breadcrumb.
- Yêu thích và lịch sử xem lưu riêng trên trình duyệt; không cần backend.
- Logo, favicon nhiều kích thước, metadata từng game, trang 404.

## Gắn game thật hoặc API

**City Bloxx đã được tích hợp:** ô nổi bật đầu tiên trên trang chủ, trang `/games/city-bloxx`, cấu hình tại `constants/city-bloxx.ts`. Bấm **Chơi ngay** để tải `https://citybloxx.antfootage.net/embed?lang=vi&screen=quick`; iframe truyền thêm `parentOrigin` theo origin thực của website. Có chọn 7 chế độ, bật/tắt tiếng, fullscreen và nhận điểm qua bridge `city-bloxx:portal` v1. Tin nhắn được kiểm tra cả origin lẫn cửa sổ iframe. Game tự quản lý lưu tiến trình/tài khoản; portal không truyền token SSO.

Các game còn lại là dữ liệu giao diện tham khảo. Khi chưa cấu hình `embedUrl`, nút **Play on Poki** mở trang game gốc trong tab mới. Project không chứa engine hoặc source của các game đó.

Thêm URL game được phép nhúng vào `constants/games.ts` hoặc thay dữ liệu từ API:

```ts
export const games: Game[] = catalog.map((game) => ({
  ...game,
  embedUrl: game.slug === 'your-game' ? '/play/your-game/index.html' : undefined,
}));
```

Khi có `embedUrl`, trang game hiển thị nút **Play now**, tải iframe sau khi bấm và hỗ trợ fullscreen. Có thể đặt game HTML5 của bạn trong `public/play/`.

Đổi tên `ANT Play` trong `app/layout.tsx`, `components/site-footer.tsx` và nội dung trang chủ khi chốt tên thương hiệu.

Xem [SOURCE-CREDITS.md](SOURCE-CREDITS.md) để biết nguồn tài nguyên tham khảo.
