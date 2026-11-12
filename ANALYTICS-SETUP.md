# Cài Google Analytics 4 cho ZOZO

Portal và ZOZO SDK đã gửi sẵn sự kiện; chỉ cần tạo GA4, đặt mã đo lường rồi build lại. Chưa có mã thì portal
không tải gì của Google.

## 1. Tạo property GA4

1. Vào <https://analytics.google.com> → **Quản trị (Admin)** → **Tạo** → **Property**.
2. Tên: `ZOZO`; múi giờ **Việt Nam (GMT+7)**; tiền tệ **VND**. Mục doanh nghiệp / mục tiêu chọn tuỳ ý.
3. **Thu thập dữ liệu → Lưu giữ dữ liệu**: đổi thành **14 tháng**.

## 2. Web stream cho zozo.bio

1. **Luồng dữ liệu (Data streams)** → **Web** → URL `https://zozo.bio`, tên `zozo.bio` → **Tạo**.
2. Chép **Mã đo lường** (`G-XXXXXXXXXX`).
3. Trong stream → **Đo lường nâng cao (Enhanced measurement)** → bánh răng ở **Lượt xem trang** → **tắt**
   "Thay đổi trang dựa trên sự kiện lịch sử trình duyệt" (portal tự gửi `page_view`, để bật sẽ bị đếm đôi).
   Có thể tắt luôn "Tương tác với biểu mẫu".
4. Game trên `*.zozo.bio` dùng chung cookie GA của `.zozo.bio`, không cần cài thêm. Game chạy riêng trên domain khác
   (vd `*.antfootage.net`): thêm domain đó ở **Định cấu hình thẻ → Định cấu hình miền**.

## 3. Khai báo custom dimension / metric

**Quản trị → Định nghĩa tùy chỉnh (Custom definitions)** → **Tạo thứ nguyên tùy chỉnh**, phạm vi **Sự kiện**, tên
hiển thị = tên tham số:

| Thứ nguyên (event-scoped) | Chỉ số (event-scoped) | Đơn vị |
|---|---|---|
| `game_id`, `mode`, `level`, `result`, `reason`, `feature`, `error_type`, `player_type` | `duration_s` | Giây |
| Thêm nếu muốn: `embed`, `locale`, `screen`, `method` | `moves` | Tiêu chuẩn |
| | `load_ms` | Mili giây |
| | `wait_s` | Giây |

Chỉ cần cho báo cáo trong giao diện GA4; BigQuery luôn có đủ mọi tham số.

## 4. Bật mã trên portal

Trong `.env` của server portal:

```dotenv
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

Rồi build lại: `docker compose up -d --build` (mã được nhúng lúc build).

Kiểm tra: mở `https://zozo.bio/?ga_debug=1`, bấm **Đồng ý** trên banner, mở một game → GA4 **Quản trị → DebugView**
thấy `page_view`, `game_open` (có `game_id`, `load_ms`), sự kiện game. **Báo cáo → Thời gian thực** thấy người chơi theo game
(thêm thứ nguyên `game_id`).

Game chạy riêng (ngoài portal) muốn đo: `ZOZO.init({ gameId, ga4Id: 'G-XXXXXXXXXX' })` (xem `packages/zozo-sdk/README.md`).

## 5. Xuất BigQuery

1. Tạo (hoặc chọn) project ở <https://console.cloud.google.com>, bật **BigQuery API**. Nên gắn tài khoản thanh toán:
   không có thì là BigQuery sandbox — bảng tự xoá sau 60 ngày và không có xuất streaming. Xuất hằng ngày miễn phí,
   gói miễn phí 10 GB lưu trữ + 1 TB truy vấn / tháng là đủ ở quy mô này.
2. GA4 **Quản trị → Liên kết sản phẩm → Liên kết BigQuery → Liên kết** → chọn project → vị trí dữ liệu
   **asia-southeast1 (Singapore)** → chọn luồng `zozo.bio` → tần suất **Hằng ngày** (Streaming nếu muốn số trong ngày, có phí)
   → **Gửi**.
3. Sau ~24 giờ có dataset `analytics_<property id>` với bảng `events_YYYYMMDD`.
4. Câu SQL làm sẵn: `web-game-server-main/docs/analytics-queries.sql` — thay `PROJECT.analytics_PROPERTY` bằng
   project + dataset thật.

## 6. Looker Studio

1. <https://lookerstudio.google.com> → **Tạo → Nguồn dữ liệu → BigQuery → Truy vấn tùy chỉnh** → chọn project.
2. Dán một câu SQL trong file trên, tích **Bật tham số ngày** (câu SQL dùng `@DS_START_DATE` / `@DS_END_DATE`) → **Kết nối**.
   Mỗi câu là một nguồn dữ liệu.
3. **Tạo → Báo cáo**, thêm các nguồn và biểu đồ:
   - Người chơi theo game / ngày: biểu đồ chuỗi thời gian, thứ nguyên `day`, phân tách `game_id`, chỉ số `players`.
   - Thời gian trung bình mỗi ván / màn: bảng `game_id`, `event_name`, `mode`, `avg_duration_s`, `median_duration_s`.
   - Phễu màn: biểu đồ cột `level` → `players_started`, `players_finished`, `finish_rate`.
   - Khách → tài khoản: thẻ điểm `conversion_rate`.
   - Lỗi theo màn hình: bảng `game_id`, `screen`, `error_type`, `errors`, `players`.
   - Giữ chân D1 / D7: bảng `cohort_day`, `new_players`, `d1_rate`, `d7_rate`.
4. Thêm một nguồn **Google Analytics** (property ZOZO) nếu muốn số gần thời gian thực ngay trên cùng báo cáo.
5. Thêm bộ chọn khoảng ngày; **Chia sẻ** cho người cần xem.

## Ghi chú

- Người chơi **Từ chối** cookie: GA chỉ nhận ping ẩn danh (không `user_pseudo_id`), các câu SQL đếm người chơi bỏ qua những
  dòng này. Người chơi chưa chọn: sự kiện chờ trong trình duyệt, chưa gửi đi.
- `user_id` = id ZOZO ID (khách cũng có id) → cùng người trên nhiều tab / thiết bị là một người.
- Trong portal `game_id` là slug game trên portal; game chạy riêng thì là `gameId` truyền vào `ZOZO.init`.
- Nên nhắc việc dùng Google Analytics trong trang chính sách quyền riêng tư.
