/** يفحص تجاوز العرض (أفقي) وأخطاء JS في صفحات العميل/الرابط على 390px: node tools/ui-compare/mobile-portal-overflow.mjs [base] */
import { chromium } from 'playwright-core';
const base = process.argv[2] ?? 'http://localhost:8000';
const phone = process.env.PORTAL_PHONE ?? '01023456789', pw = process.env.PORTAL_PW ?? 'Fixture-0000';
const b = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'ar' });
const p = await ctx.newPage(); const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
await p.goto(base + '/portal/login'); await p.fill('input[inputmode=tel]:visible', phone); await p.fill('input[type=password]:visible', pw);
await Promise.all([p.waitForURL((u) => !u.pathname.startsWith('/portal/login')), p.click('button[type=submit]:visible')]);
const links = await p.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="/portal"]')].map((a) => a.getAttribute('href')))]);
const urls = [...new Set(['/portal', '/portal/orders', '/portal/requests', '/portal/requests/new', '/portal/account', ...links])].filter((u) => !u.includes('/pdf') && !u.endsWith('/invoice'));
let bad = 0;
for (const u of urls) {
  await p.goto(base + u, { waitUntil: 'networkidle' });
  const w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  const over = w[0] > w[1] + 1; if (over) bad++;
  console.log(over ? 'BAD ' : 'ok  ', u, w.join('/'));
}
console.log(errs.length ? 'JS errors: ' + errs.join(' | ') : 'JS errors: 0'); await b.close(); process.exit(bad || errs.length ? 1 : 0);
