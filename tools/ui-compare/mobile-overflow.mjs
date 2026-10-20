/** يفحص عناصر تتجاوز عرض الشاشة (390px) في صفحات موظف: node tools/ui-compare/mobile-overflow.mjs /orders /customers … (يتطلب تشغيل التطبيق والحساب superadmin) */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'ar' })).newPage();
await p.goto('http://localhost:8000/login'); await p.fill('input[type=email]', 'superadmin@pbms.test'); await p.fill('input[type=password]', 'Pbms@12345');
await Promise.all([p.waitForURL((u) => !u.pathname.startsWith('/login')), p.click('button[type=submit]')]);
for (const u of process.argv.slice(2)) {
  await p.goto('http://localhost:8000' + u, { waitUntil: 'networkidle' });
  const bad = await p.evaluate(() => { const W = innerWidth; const out = []; for (const e of document.querySelectorAll('main *')) { const r = e.getBoundingClientRect(); if (r.width && (r.right > W + 1 || r.left < -1)) { let a = e, scroll = false; while (a && a !== document.body) { const o = getComputedStyle(a).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') { scroll = true; break; } a = a.parentElement; } if (!scroll) out.push(`${e.tagName.toLowerCase()}.${String(e.className).slice(0, 40)} [${Math.round(r.left)}..${Math.round(r.right)}]`); } } return out.slice(0, 4); });
  console.log(bad.length ? 'BAD ' + u + '\n   ' + bad.join('\n   ') : 'ok  ' + u);
}
await b.close();
