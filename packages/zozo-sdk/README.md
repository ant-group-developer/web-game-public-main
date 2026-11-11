# ZOZO SDK v1

Tài khoản người chơi **ZOZO ID** và ngôn ngữ cho game, chạy trong portal (iframe) hoặc riêng. TypeScript thuần,
không phụ thuộc thư viện. API: `web-game-server` → `docs/zozo-id-api.md`.

## Build

```bash
npm run build:sdk      # ở thư mục gốc portal
```

Ra `dist/`:

| File | Dùng |
|---|---|
| `zozo-sdk.js` / `zozo-sdk.min.js` | `<script>` → `window.ZOZO` (IIFE) |
| `zozo-sdk.mjs` / `zozo-sdk.min.mjs` | `import * as ZOZO from '…/zozo-sdk.min.mjs'` (ESM) |

Sẽ được đưa lên `https://assets.zozo.bio/sdk/v1/` (chưa upload).

## Dùng

```html
<script src="https://assets.zozo.bio/sdk/v1/zozo-sdk.min.js"></script>
<script>
  ZOZO.init({ gameId: 'xiangqi' });            // apiBase mặc định https://api.zozo.bio, portalUrl https://zozo.bio

  ZOZO.onLocale((locale) => setLanguage(locale));   // 'vi' | 'en', gọi ngay với giá trị hiện tại
  ZOZO.onAuthChange((player) => reloadProfile(player));

  const player = await ZOZO.getPlayer();        // tự tạo khách nếu chưa có phiên
  const token = await ZOZO.getToken();          // Authorization: Bearer <token> cho backend game
  // Backend game tự xác minh token bằng JWKS: GET https://api.zozo.bio/api/.well-known/jwks.json

  loginButton.onclick = () => ZOZO.login();     // hoặc ZOZO.login({ mode: 'register' })
</script>
```

| Hàm | |
|---|---|
| `init({ gameId, apiBase?, portalUrl? })` | Gọi một lần, trước mọi hàm khác. |
| `getPlayer(): Promise<Player>` | Người chơi hiện tại (`id`, `displayName`, `avatarUrl`, `isGuest`, `code`, `email`…). |
| `getToken(): Promise<string>` | Access token còn hạn. Tự refresh, gọi song song chỉ ra một request, chưa có phiên thì tạo khách. |
| `login({ mode? }): Promise<Player \| null>` | Trong portal: mở hộp thoại đăng nhập của portal trên game, xong trả người chơi mới (đóng → người chơi cũ). Chạy riêng: chuyển tới `<portal>/dang-nhap?returnTo=<trang hiện tại>`. |
| `logout(): Promise<void>` | Đăng xuất (trong portal: portal đăng xuất cho cả trang). |
| `onAuthChange(cb): () => void` | Người chơi đổi: đăng nhập, đăng ký, đăng xuất, gộp khách, đổi tên. Trả hàm huỷ. |
| `onLocale(cb): () => void` | `?lang=` lúc mở, sau đó message `{type:'ant-play:locale', locale}` của portal. Mặc định `vi`, **không** theo ngôn ngữ trình duyệt. |
| `getLocale()` | Ngôn ngữ hiện tại. |

Lỗi là `ZOZO.ZozoError` (`status`, `code` = `errorCode` của API, hoặc `network`).

## Cách hoạt động

- **Chạy riêng** (vd `https://co-tuong.zozo.bio`): gọi thẳng `POST /auth/refresh` với `credentials: 'include'`
  (cookie `zozo_rt` dùng chung `.zozo.bio`), 401 → `POST /auth/guest`, hẹn refresh trước khi `expiresIn` hết.
  Refresh chạy một lần tại một thời điểm và khoá giữa các tab cùng origin (Web Locks).
- **Trong iframe portal**: SDK không tự refresh mà xin token qua postMessage — portal là nơi duy nhất xoay
  refresh token (hai bên cùng refresh bằng một cookie sẽ bị API coi là dùng lại và thu hồi phiên).
  Portal không trả lời trong 4 giây → SDK chuyển sang tự gọi API.
- Chỉ nhận / gửi message với origin khớp `^https://([a-z0-9-]+\.)?zozo\.bio$` (game chạy trên localhost: thêm `http://localhost:*`).
- Nút Google chỉ có trên portal (Google không cho wildcard origin), nên `login()` khi chạy riêng chuyển sang portal.

| Hướng | Message |
|---|---|
| game → portal | `{type:'zozo:token-request', id, gameId}` → `{type:'zozo:token', id, accessToken, expiresIn, player}` hoặc `{…, error, status}` |
| game → portal | `{type:'zozo:login', mode, gameId}` → portal mở hộp thoại; đóng không đăng nhập → `{type:'zozo:login-cancel'}` |
| game → portal | `{type:'zozo:logout'}` |
| portal → game | `{type:'zozo:auth-changed'}` → SDK xin token mới rồi gọi `onAuthChange` |
| portal → game | `{type:'ant-play:locale', locale}` → `onLocale` |

## Thử

```bash
npm run build:sdk
npm run sdk:serve      # http://localhost:3124/test.html?api=http://localhost:3010&portal=http://localhost:3123
```

`test.html` có nút cho từng hàm và log `onAuthChange` / `onLocale`. Mở riêng để thử chế độ standalone; nhúng vào
portal chạy local (đổi URL iframe của một game thành trang này) để thử cầu nối.
