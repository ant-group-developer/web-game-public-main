# Apple Worm + SEO

Trang chơi: /games/apple-worm. Game mặc định nhúng từ https://apple-worm.antfootage.net/embed/apple-worm.
Route khung chơi độc lập cùng domain: /embed/apple-worm (không có navigation/footer), noindex và CSP frame-ancestors *.

Build production:

    docker compose up -d --build

Đặt SITE_URL trong .env thành origin công khai của WEBGAME trước khi build để canonical, Open Graph và sitemap đúng domain. NEXT_PUBLIC_APPLE_WORM_EMBED_URL mặc định là URL production ở trên. Nếu muốn phục vụ game ngay trong Docker webgame, đặt NEXT_PUBLIC_APPLE_WORM_EMBED_URL=/embed/apple-worm rồi build lại. Các giá trị này được đóng vào build; thay đổi cần rebuild.

SEO được render trong head: title/description, canonical, robots, Open Graph, Twitter large image. /robots.txt, /sitemap.xml, JSON-LD VideoGame. Apple Worm có hero trên header, ảnh chia sẻ /seo/apple-worm-og.jpg 1200x630; webgame dùng /seo/ant-play-og.jpg. Không gán rating hoặc số lượt chơi giả.

Mã nhúng production:

    <iframe src="https://apple-worm.antfootage.net/embed/apple-worm" title="Apple Worm" width="960" height="720" style="width:100%;aspect-ratio:4/3;height:auto;border:0" allow="autoplay;fullscreen;gamepad" allowfullscreen loading="lazy"></iframe>

Proxy/CDN không được thêm X-Frame-Options DENY/SAMEORIGIN hoặc CSP frame-ancestors 'self' vào route /embed/apple-worm và /apple-worm/*. Trang cha có CSP phải cho phép domain game trong frame-src. CORS không cần cho iframe.

Docker riêng cho Apple Worm nằm ở D:\VQD\apple-warm-main. Domain cần DNS và reverse proxy HTTPS trước khi iframe production hoạt động. Các file game production đã lưu cục bộ, không yêu cầu dịch vụ Poki. SDK quảng cáo được thay bằng adapter local; redirect kiểm tra hostname được bỏ trong bản production, giữ bản gốc tại www/js/Main.js của thư mục tải game.
