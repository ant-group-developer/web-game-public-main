// E2E platform 07: dải "Sự kiện" trang chủ, /su-kien (đang diễn ra / đã kết thúc), thanh sự kiện trang game + `?p=` mở
// thẳng trang sự kiện trong iframe, danh hiệu ở /ho-so, mobile 360 px, CMS "Sự kiện trên portal" (ghim / ẩn).
// node e2e/events-portal.e2e.mjs <outDir> <coTuongServerDir>
// Cần: portal :3123 (API_INTERNAL_URL / NEXT_PUBLIC_API_URL → ZOZO :3010), CMS :5181, ZOZO ID :3010,
// co-tuong-server :3200 (ZOZO_ANNOUNCE=1), container `co-tuong-local-db-1` / `-redis-1`, `zozo-game-db-1`.
// Tự gắn client `xiangqi` với game `co-tuong` + quyền, TRẢ LẠI khi xong; xoá dữ liệu thử.
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const [out, serverDir] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const require = createRequire(`${serverDir}/../xiangqi-firebase/package.json`);
const { chromium } = require('playwright');
const P = 'http://localhost:3123';
const CMS = 'http://localhost:5181';
const C = 'http://localhost:3200/api/v1';
const Z = 'http://localhost:3010/api/v1';
const envText = fs.readFileSync(`${serverDir}/../../../WEB_GAME/web-game-server-main/.env`, 'utf8');
const env = (k) => (envText.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1] ?? '').trim().replace(/^["']|["']$/g, '');

let pass = 0;
let fail = 0;
const ok = (c, n, x = '') => {
  c ? pass++ : fail++;
  console.log(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ` — ${x}` : ''}`);
};
// caret: 'initial' — mặc định Playwright chèn style caret-color vào ô nhập → React báo lệch khi hydrate.
const shot = (p, n) => p.screenshot({ path: `${out}/${n}.png`, caret: 'initial' }).catch(() => {});
const step = async (name, p, fn) => {
  try {
    await fn();
    ok(true, name);
  } catch (e) {
    await shot(p, `fail-${pass + fail}`);
    ok(false, name, String(e.message).split('\n').slice(0, 3).join(' ').slice(0, 400));
  }
};
async function j(url, method = 'GET', body, token) {
  const r = await fetch(url, { method, headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const x = await r.json().catch(() => null);
  return { status: r.status, data: x && 'data' in x ? x.data : x };
}
const psql = (container, sql) =>
  execFileSync('docker', ['exec', '-i', container, 'sh', '-c', 'psql -q -t -A -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'], { input: sql, encoding: 'utf8' }).trim();
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------ dữ liệu
const adm = (await j(`${C}/admin/auth/login`, 'POST', { email: env('ADMIN_BOOTSTRAP_EMAIL'), password: env('ADMIN_BOOTSTRAP_PASSWORD') })).data;
const admin = (m, p, b) => j(`${C}${p}`, m, b, adm.accessToken);
const zadmin = (m, p, b) => j(`${Z}${p}`, m, b, adm.accessToken);
const xq = (await zadmin('GET', '/admin/game-clients')).data.find((c) => c.key === 'xiangqi');
const game = (await zadmin('GET', '/admin/games?pageSize=100')).data.items.find((g) => g.slug === 'co-tuong');
const origClient = { scopes: xq.scopes, gameId: xq.gameId };
await zadmin('PATCH', `/admin/game-clients/${xq.id}`, { scopes: [...new Set([...xq.scopes, 'announcements:write', 'badges:write'])], gameId: game.id });
await sleep(1000);

const email = `it-portal-ev-${Date.now()}@example.test`;
const password = `E2e-${randomUUID()}`;
const W = (await j(`${Z}/auth/register`, 'POST', { email, password, displayName: 'Nhà Vô Địch' })).data;
const seasonId = Number(psql('co-tuong-local-db-1', `SELECT id FROM seasons WHERE status = 'active' LIMIT 1`));
const ghost = randomUUID();
psql('co-tuong-local-db-1', `INSERT INTO player_ratings (player_id, season_id, rating, peak, placement_left, warmup_left, games) VALUES (${q(W.player.id)}, ${seasonId}, 1500, 1500, 0, 0, 10) ON CONFLICT DO NOTHING`);

const stamp = Date.now().toString(36);
const mk = async (title, slug) =>
  (
    await admin('POST', '/admin/events', {
      title,
      slug,
      summary: 'Sự kiện thử trên portal.',
      kind: 'points',
      scoring: { win: 3, draw: 1, loss: 0, tierMultiplier: false },
      rewards: [{ kind: 'rank', rankFrom: 1, rankTo: 1, badgeTitle: `Vô địch ${title}`.slice(0, 80), badgeTier: 'gold', prizeText: '' }],
      startsAt: new Date(Date.now() - 60_000).toISOString(),
      endsAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    })
  ).data;
const LIVE = `Tuần lễ portal ${stamp}`;
const DONE = `Giải tuần xong ${stamp}`;
const live = await mk(LIVE, `portal-live-${stamp}`);
const done = await mk(DONE, `portal-done-${stamp}`);
await admin('POST', `/admin/events/${live.id}/publish`);
await admin('POST', `/admin/events/${done.id}/publish`);
await j(`${C}/events/${done.id}/join`, 'POST', {}, W.accessToken);
const matchId = randomUUID();
execFileSync('docker', ['exec', 'co-tuong-local-redis-1', 'redis-cli', 'XADD', 'stream:match-finished', '*', 'data', JSON.stringify({ matchId, roomId: null, mode: 'ranked', rated: true, red: W.player.id, black: ghost, winner: 'red', reason: 'checkmate', plies: 40, endedAt: new Date().toISOString() })]);
await sleep(3000);
await admin('POST', `/admin/events/${done.id}/end-now`);
await sleep(1500);
const liveSlug = live.slug;

const b = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await b.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
const member = await (await b.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
const mobile = await (await b.newContext({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true })).newPage();
const cms = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errors = [];
for (const [n, p] of [['page', page], ['member', member], ['mobile', mobile], ['cms', cms]]) {
  p.on('pageerror', (e) => errors.push(`${n}: ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && !/favicon|status of 40[13]|Failed to load resource|co-tuong\.zozo\.bio|antfootage|api\.zozo\.bio|5190|frame-ancestors|Content Security Policy/.test(m.text()) && errors.push(`${n} ${p.url()}: ${/hydrat/i.test(m.text()) ? m.text().replace(/s+/g, ' ').slice(0, 2500) : m.text().slice(0, 160)}`));
}
const revalidate = () => fetch(`${P}/api/revalidate`, { method: 'POST' }).catch(() => {});

try {
  void revalidate;
  await step('trang chủ: dải "Sự kiện" có thẻ sự kiện, link mở thẳng trang sự kiện trong game', page, async () => {
    // Cache 60 s: tải lại tới khi có (API đã báo revalidate tag `announcements` nếu portal cấu hình webhook).
    let found = false;
    for (let i = 0; i < 12 && !found; i++) {
      await page.goto(`${P}/`);
      found = (await page.getByTestId('home-events').getByTestId('event-card').filter({ hasText: LIVE }).count()) > 0;
      if (!found) await sleep(5000);
    }
    if (!found) throw new Error('chưa thấy thẻ sự kiện');
    const href = await page.getByTestId('home-events').getByTestId('event-card').filter({ hasText: LIVE }).getAttribute('href');
    if (href !== `/games/co-tuong?p=${encodeURIComponent(`/su-kien/${liveSlug}`)}`) throw new Error(href ?? 'null');
    await page.getByTestId('home-events').scrollIntoViewIfNeeded();
    await shot(page, '01-home-events');
  });

  await step('/su-kien: tab Đang diễn ra + Đã kết thúc (vô địch)', page, async () => {
    // Dữ liệu cache tối đa 60 s (máy dev chưa cấu hình webhook revalidate) → tải lại tới khi có.
    for (let i = 0; i < 14; i++) {
      await page.goto(`${P}/su-kien`);
      if (await page.getByTestId('event-card').filter({ hasText: LIVE }).count()) break;
      await sleep(5000);
    }
    await page.getByTestId('event-card').filter({ hasText: LIVE }).waitFor({ timeout: 5000 });
    await shot(page, '02-events-live');
    await page.getByTestId('ev-tab-finished').click();
    const doneCard = page.getByTestId('event-card').filter({ hasText: DONE });
    await doneCard.waitFor({ timeout: 10_000 });
    if (!/Vô địch: Nhà Vô Địch/.test(await doneCard.innerText())) throw new Error(await doneCard.innerText());
    await shot(page, '03-events-finished');
  });

  await step('trang game: thanh sự kiện, bấm → ?p= và iframe mở /su-kien/<slug>', page, async () => {
    const bar = page.getByTestId('game-event-bar');
    for (let i = 0; i < 14; i++) {
      await page.goto(`${P}/games/co-tuong`);
      await page.locator('.player').waitFor({ timeout: 20_000 });
      if (await bar.filter({ hasText: LIVE }).count()) break;
      await sleep(5000);
    }
    await bar.waitFor({ timeout: 5000 });
    if (!(await bar.innerText()).includes(LIVE)) throw new Error(await bar.innerText());
    await shot(page, '04-game-bar');
    await bar.locator('.ev-bar-row').filter({ hasText: LIVE }).getByRole('link').click();
    await page.waitForURL(/\?p=/, { timeout: 10_000 });
    await page.waitForFunction((s) => document.querySelector('.player iframe')?.getAttribute('src')?.includes(`/su-kien/${s}`), liveSlug, { timeout: 10_000 });
  });

  await step('link trực tiếp /games/co-tuong?p=… → iframe đúng đường dẫn; ?p= lạ bị bỏ qua', page, async () => {
    await page.goto(`${P}/games/co-tuong?p=${encodeURIComponent(`/su-kien/${liveSlug}`)}`);
    await page.waitForFunction((s) => document.querySelector('.player iframe')?.getAttribute('src')?.includes(`/su-kien/${s}`), liveSlug, { timeout: 20_000 });
    await page.goto(`${P}/games/co-tuong?p=${encodeURIComponent('//evil.example/x')}`);
    await page.waitForFunction(() => !!document.querySelector('.player iframe')?.getAttribute('src'), null, { timeout: 20_000 });
    const src = await page.locator('.player iframe').getAttribute('src');
    if (src.includes('evil.example')) throw new Error(src);
  });

  await step('ẩn thanh sự kiện (✕) → không hiện lại khi tải lại', page, async () => {
    await page.goto(`${P}/games/co-tuong`);
    await page.getByTestId('game-event-bar').getByRole('button', { name: 'Ẩn thanh sự kiện' }).click();
    await page.getByTestId('game-event-bar').waitFor({ state: 'detached', timeout: 5000 });
    await page.reload();
    await page.locator('.player').waitFor({ timeout: 20_000 });
    await sleep(1500);
    if (await page.getByTestId('game-event-bar').count()) throw new Error('thanh hiện lại');
  });

  await step('/ho-so: danh hiệu của người vừa vô địch', member, async () => {
    await member.goto(`${P}/`);
    await member.evaluate(
      async ([z, e, p]) => {
        const r = await fetch(`${z}/auth/login`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: e, password: p }) });
        if (!r.ok) throw new Error(`login ${r.status}`);
      },
      [Z, email, password],
    );
    await member.goto(`${P}/ho-so`);
    const badges = member.getByTestId('profile-badges');
    await badges.waitFor({ timeout: 20_000 });
    if (!(await badges.innerText()).includes(`Vô địch ${DONE}`)) throw new Error(await badges.innerText());
    await shot(member, '05-profile-badges');
  });

  await step('mobile 360px: trang chủ + /su-kien không tràn ngang', mobile, async () => {
    for (const path of ['/', '/su-kien']) {
      await mobile.goto(`${P}${path}`);
      await mobile.waitForLoadState('networkidle').catch(() => {});
      const w = await mobile.evaluate(() => document.documentElement.scrollWidth);
      if (w > 362) throw new Error(`${path} scrollWidth ${w}`);
    }
    await mobile.goto(`${P}/`);
    await mobile.getByTestId('home-events').scrollIntoViewIfNeeded().catch(() => {});
    await shot(mobile, '06-home-mobile');
  });

  await step('CMS "Sự kiện trên portal": thấy thông báo, ghim được', cms, async () => {
    await cms.goto(`${CMS}/`);
    await cms.evaluate((tk) => {
      localStorage.setItem('zozo_admin_access_token', tk.accessToken);
      localStorage.setItem('zozo_admin_refresh_token', tk.refreshToken);
    }, adm);
    await cms.goto(`${CMS}/announcements`);
    const row = cms.locator('tr').filter({ hasText: LIVE });
    await row.waitFor({ timeout: 20_000 });
    await row.getByRole('button', { name: 'Ghim' }).click();
    await cms.locator('tr').filter({ hasText: LIVE }).getByRole('button', { name: 'Bỏ ghim' }).waitFor({ timeout: 10_000 });
    await shot(cms, '07-cms-announcements');
  });

  ok(errors.length === 0, 'không lỗi JS / console', errors.slice(0, 2).join(' | '));
} finally {
  await b.close();
  await zadmin('PATCH', `/admin/game-clients/${xq.id}`, origClient);
  const ids = (await admin('GET', '/admin/events')).data.filter((x) => x.slug.includes(stamp)).map((x) => x.id);
  if (ids.length) psql('co-tuong-local-db-1', `DELETE FROM events WHERE id = ANY(ARRAY[${ids.join(',')}]); DELETE FROM event_audit WHERE event_id = ANY(ARRAY[${ids.join(',')}]);`);
  psql('co-tuong-local-db-1', `DELETE FROM player_ratings WHERE player_id IN (${q(W.player.id)}, ${q(ghost)}); DELETE FROM rating_ledger WHERE match_id = ${q(matchId)};`);
  psql('zozo-game-db-1', `DELETE FROM game_announcements WHERE external_id = ANY(ARRAY[${ids.map((id) => q(`ev:${id}`)).join(',') || "''"}]); DELETE FROM player_badges WHERE player_id = ${q(W.player.id)};`);
  console.log(`\n${pass} pass, ${fail} fail`);
  process.exitCode = fail ? 1 : 0;
}
