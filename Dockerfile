# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM base AS builder
ARG SITE_URL=http://localhost:3100
ENV SITE_URL=$SITE_URL
# API ZOZO ID mà trình duyệt gọi (đăng nhập), được nhúng vào JS lúc build. Trống → https://api.zozo.bio.
ARG NEXT_PUBLIC_API_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# Build dựng sẵn trang chủ / danh mục / trang game bằng dữ liệu API. Không truyền API_INTERNAL_URL (hoặc API không
# gọi được lúc build) thì build vẫn qua nhưng các trang đó dựng với 0 game + cấu hình mặc định, và mỗi lần deploy
# người dùng thấy trang trống cho tới khi Next làm mới (≤ 5 phút hoặc khi admin sửa). Vì vậy nên truyền URL API thật.
ARG API_INTERNAL_URL=
ENV API_INTERNAL_URL=$API_INTERNAL_URL
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN apk add --no-cache tzdata \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/scripts/healthcheck.mjs ./scripts/healthcheck.mjs
RUN mkdir -p .next/cache && chown nextjs:nodejs .next/cache

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["node", "scripts/healthcheck.mjs"]
CMD ["node", "server.js"]
