#!/usr/bin/env node
/**
 * يقيس مواضع عناصر الشيل المشتركة عبر مجموعة صفحات: يكشف اختلاف y/ارتفاع/عرض (قفزات التخطيط بين شاشات من نفس العائلة).
 * node tools/ui-compare/layout-probe.mjs --as superadmin@pbms.test --sel 'nav[aria-label="أقسام ملف العميل"]' /customers/104 /customers/104/orders ...
 */
import { chromium } from 'playwright-core';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const base = arg('base', 'http://localhost:8000'); const as = arg('as'); const pw = arg('pw', 'Pbms@12345');
const sels = process.argv.flatMap((a, i) => (process.argv[i - 1] === '--sel' ? [a] : []));
const paths = process.argv.slice(2).filter((a, i, all) => a.startsWith('/') && !['--sel', '--as', '--pw', '--base'].includes(all[all.indexOf(a) - 1] ?? ''));
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'ar', reducedMotion: 'reduce' })).newPage();
if (as) { await page.goto(base + '/login'); await page.fill('input[type=email]', as); await page.fill('input[type=password]', pw); await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login')), page.click('button[type=submit]')]); }
const all = ['h1', ...sels];
for (const p of paths) {
  await page.goto(base + p, { waitUntil: 'networkidle' });
  const row = await page.evaluate((ss) => ss.map((s) => { const e = document.querySelector(s); if (!e) return `${s}: —`; const r = e.getBoundingClientRect(); return `${s.slice(0, 18)}: x${Math.round(r.x)} y${Math.round(r.y + scrollY)} w${Math.round(r.width)} h${Math.round(r.height)}`; }), all);
  console.log(p.padEnd(34), row.join(' | '));
}
await browser.close();
