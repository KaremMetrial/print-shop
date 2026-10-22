#!/usr/bin/env node
/**
 * مقارنة بكسل-ببكسل بين تصميم الـpen (PNG مُصدَّر) وصفحة التطبيق الفعلية.
 * الاستخدام:
 *   node tools/ui-compare/compare.mjs --ref storage/ui-ref/Xqpp0.png --path /dashboard --as admin@pbms.test --name dashboard
 * بدون --as: صفحة عامة (مثل /login).
 * المخرجات: storage/ui-diff/<name>.actual.png و <name>.diff.png ونسبة الاختلاف وأكثر الأشرطة اختلافًا.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const ref = arg('ref'); const route = arg('path') ?? ''; const fullUrl = arg('url'); const as = arg('as'); const name = arg('name', 'screen');
const base = arg('base', 'http://localhost:8000'); const threshold = Number(arg('threshold', '0.12'));
const pw = arg('password', 'Pbms@12345'); const action = arg('action');
if (!ref || (!route && !fullUrl)) { console.error('--ref و (--path أو --url) مطلوبان'); process.exit(2); }

let refPng = PNG.sync.read(fs.readFileSync(ref));
// --skip-top N: يقتطع N بكسل من أعلى المرجع (شريط حالة الهاتف المرسوم في إطارات M-* وهو من النظام لا من التطبيق).
const skipTop = Number(arg('skip-top', '0'));
if (skipTop > 0) { const c = new PNG({ width: refPng.width, height: refPng.height - skipTop }); PNG.bitblt(refPng, c, 0, skipTop, refPng.width, refPng.height - skipTop, 0, 0); refPng = c; }
const { width: W, height: H } = refPng;
const out = 'storage/ui-diff'; fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await (await browser.newContext({ viewport: { width: W, height: H }, locale: 'ar', deviceScaleFactor: 1, reducedMotion: 'reduce' })).newPage();
if (as && arg('portal')) {
  await page.goto(base + '/portal/login');
  await page.fill('input[inputmode=tel]:visible', as); await page.fill('input[type=password]:visible', pw);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/portal/login')), page.click('button[type=submit]:visible')]);
} else if (as) {
  await page.goto(base + '/login');
  await page.fill('input[type=email]', as); await page.fill('input[type=password]', pw);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login')), page.click('button[type=submit]')]);
}
const resp = await page.goto(fullUrl ?? base + route, { waitUntil: 'networkidle' });
const httpStatus = resp?.status() ?? 0;
await page.evaluate(() => document.fonts.ready);
if (action) { await page.evaluate(action); await page.waitForTimeout(300); }
await page.addStyleTag({ content: '*{caret-color:transparent!important;animation:none!important;transition:none!important}' });
const buf = await page.screenshot({ clip: { x: 0, y: 0, width: W, height: H }, fullPage: true });
await browser.close();

const act = PNG.sync.read(buf);
const norm = new PNG({ width: W, height: H, fill: true }); // خلفية بيضاء لو الصفحة أقصر
for (let i = 0; i < norm.data.length; i += 4) { norm.data[i] = norm.data[i + 1] = norm.data[i + 2] = 255; norm.data[i + 3] = 255; }
PNG.bitblt(act, norm, 0, 0, Math.min(W, act.width), Math.min(H, act.height), 0, 0);
const diff = new PNG({ width: W, height: H });
const bad = pixelmatch(refPng.data, norm.data, diff.data, W, H, { threshold, includeAA: false });
// المقياس الصارم (threshold=0.02) هو معيار القبول: يكشف الصفحات الفارغة/الخطأ (403/500) والإزاحات الصغيرة.
const scratch = new PNG({ width: W, height: H });
const badStrict = pixelmatch(refPng.data, norm.data, scratch.data, W, H, { threshold: 0.02, includeAA: false });
fs.writeFileSync(path.join(out, name + '.actual.png'), PNG.sync.write(norm));
fs.writeFileSync(path.join(out, name + '.diff.png'), PNG.sync.write(diff));

// أشرطة أفقية 40px الأكثر اختلافًا لتوجيه الإصلاح
const bands = [];
for (let y0 = 0; y0 < H; y0 += 40) {
  let c = 0;
  for (let y = y0; y < Math.min(H, y0 + 40); y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (diff.data[i] === 255 && diff.data[i + 1] === 0) c++; }
  bands.push([y0, c]);
}
bands.sort((a, b) => b[1] - a[1]);
// نسبة الاختلاف من «بكسلات المحتوى» فقط (غير لون الخلفية) حتى لا تُخفي الخلفية الفارغة الفروق.
const bg = [refPng.data[0], refPng.data[1], refPng.data[2]];
let content = 0;
for (let i = 0; i < refPng.data.length; i += 4) {
  const r = refPng.data[i] !== bg[0] || refPng.data[i + 1] !== bg[1] || refPng.data[i + 2] !== bg[2];
  const a = norm.data[i] !== bg[0] || norm.data[i + 1] !== bg[1] || norm.data[i + 2] !== bg[2];
  if (r || a) content++;
}
const pct = (bad / (W * H)) * 100;
const cpct = content ? (bad / content) * 100 : 0;
const spct = content ? (badStrict / content) * 100 : 0;
console.log(`${name}: ${W}x${H} (الفعلي ${act.width}x${act.height}) HTTP=${httpStatus} اختلاف-المحتوى=${cpct.toFixed(1)}% صارم=${spct.toFixed(1)}%`);
if (httpStatus >= 400) console.log('⚠️ الصفحة أعادت خطأ HTTP — الأرقام غير صالحة');
console.log('أكثر الأشرطة اختلافًا (y: بكسل):', bands.slice(0, 6).filter((b) => b[1] > 0).map((b) => `${b[0]}:${b[1]}`).join('  '));
process.exit(httpStatus >= 400 || spct > Number(arg('max', '100')) ? 1 : 0);
