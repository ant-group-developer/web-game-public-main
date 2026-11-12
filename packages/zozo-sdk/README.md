# ZOZO SDK v1

Tài khoản người chơi **ZOZO ID**, ngôn ngữ và đo lường **GA4** cho game, chạy trong portal (iframe) hoặc riêng. TypeScript thuần,
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

## Đo lường (Google Analytics 4)

```js
ZOZO.init({ gameId: 'xiangqi', ga4Id: 'G-XXXXXXX' });   // ga4Id chỉ dùng khi game chạy riêng
ZOZO.setScreen('lobby');
ZOZO.track('match_start', { mode: 'ranked', move_time_s: 60 });
ZOZO.track('match_end', { mode: 'ranked', result: 'win', reason: 'checkmate', duration_s: 312, moves: 48 });
```

| Hàm | |
|---|---|
| `track(event, params?)` | Gửi sự kiện chuẩn (bảng dưới). Tên ngoài bảng → bỏ + `console.warn`; tham số ngoài bảng / sai kiểu → bỏ + `console.warn`. Chuỗi cắt 100 ký tự, `bool` gửi `1`/`0`. Không bao giờ ném lỗi. |
| `setScreen(name)` | Màn hình hiện tại, gắn vào `game_error` tự động. |
| `getConsent()` | `'granted' \| 'denied' \| null` — lựa chọn cookie (cookie `zozo_consent`, portal ghi cho cả `.zozo.bio`). |
| `setConsent(granted)` | Chỉ cho game chạy riêng có banner cookie của mình. Trong portal không làm gì. |
| `init({ …, ga4Id?, autoTrack?, debug? })` | `autoTrack` (mặc định `true`): tự gửi `game_open {load_ms}` khi trang tải xong và `game_error` cho lỗi JS chưa bắt / promise bị reject không bắt (tối đa 5 / phiên tab). `debug`: ghi ra console + `debug_mode` (DebugView); hoặc thêm `?ga_debug=1` vào URL. |

SDK tự gắn vào mọi sự kiện: `game_id` (= `gameId`), `player_type` (`guest` \| `member`), `locale`, `embed` (`portal` \| `direct`);
`user_id` = id người chơi ZOZO ID. Game không tự đặt được các tham số này.

| Sự kiện | Tham số |
|---|---|
| `game_open` | `load_ms` (tự gửi) |
| `match_start` / `match_end` | `mode`, `bot_level`, `move_time_s`, `result`, `reason`, `duration_s`, `moves` |
| `level_start` / `level_end` / `level_fail` | `level`, `duration_s`, `attempts`, `fail_reason` |
| `mm_search` / `mm_matched` | `wait_s`, `vs_bot` (chỉ trong dữ liệu, không hiện ra UI), `mode` |
| `game_error` | `error_type`, `error_message`, `screen`, `level` (tự gửi; `level` = `level` của lần `track` gần nhất) |
| `feature_use` | `feature` |
| `sign_up` / `login` | `method` (portal tự gửi) |
| `event_join` | `event_id` |

Số: `load_ms`, `moves`, `attempts` làm tròn thành số nguyên; `duration_s`, `move_time_s`, `wait_s` là giây (số thực).
`level`, `bot_level`: số hoặc chuỗi.

- **Trong portal**: không tải gtag; gửi `{type:'zozo:track', event, params}` lên portal. Portal kiểm tra lại, thay
  `game_id` bằng **slug game trên portal**, gắn `player_type` / `locale` / `embed: 'portal'` / `user_id` theo phiên của portal và gửi bằng gtag
  của portal — một phiên GA cho cả trang. Mỗi lần tải iframe portal chỉ nhận một `game_open` (của portal khi iframe
  `load` hoặc của SDK, cái nào đến trước), tối đa 5 `game_error`, 200 sự kiện.
- **Chạy riêng** + `ga4Id`: SDK tự tạo gtag với Consent Mode v2 (mặc định denied). gtag.js chỉ được tải khi đã có
  lựa chọn (`zozo_consent` từ portal, hoặc `setConsent`); trước đó sự kiện chờ trong `dataLayer`. Không có `ga4Id` → không gửi gì.

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
| game → portal | `{type:'zozo:track', event, params}` (không trả lời) |
| portal → game | `{type:'zozo:auth-changed'}` → SDK xin token mới rồi gọi `onAuthChange` |
| portal → game | `{type:'ant-play:locale', locale}` → `onLocale` |

## Thử

```bash
npm run build:sdk
npm run sdk:serve      # http://localhost:3124/test.html?api=http://localhost:3010&portal=http://localhost:3123
```

`test.html` có nút cho từng hàm, `track` mẫu, lỗi thử, consent và xem `dataLayer`; log `onAuthChange` / `onLocale`.
Mở riêng để thử chế độ standalone (thêm `&ga4=G-TEST000000` để thử gtag riêng); nhúng vào portal chạy local (đổi URL
iframe của một game thành trang này) để thử cầu nối — sự kiện hiện trong `window.dataLayer` của portal.
