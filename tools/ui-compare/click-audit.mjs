#!/usr/bin/env node
/**
 * يفحص أن كل زر/رابط في الصفحة "يفعل شيئًا" فعلًا. آمن: يمنع كل طلبات POST/PATCH/DELETE (abort) ويعتبر محاولة الإرسال أثرًا.
 * لكل عنصر قابل للنقر: يضغطه ثم يقيس (تغيّر الرابط | ظهور نافذة/قائمة | تغيّر DOM | محاولة طلب شبكة | تنزيل/تبويب جديد).
 * node tools/ui-compare/click-audit.mjs --as superadmin@pbms.test /orders /orders/152 …
 */
import { chromium } from 'playwright-core';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const base = arg('base', 'http://localhost:8000'); const as = arg('as'); const pw = arg('pw', 'Pbms@12345'); const mobile = process.argv.includes('--mobile'); const SEL = process.argv.includes('--body') ? 'body a[href], body button' : 'main a[href], main button, header button';
const paths = process.argv.slice(2).filter((a) => a.startsWith('/'));
const b = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, locale: 'ar', acceptDownloads: true });
const page = await ctx.newPage();
let attempted = 0; const jsErrors = new Set(); page.on('pageerror', (e) => jsErrors.add(String(e.message).slice(0, 110)));
const portal = process.argv.includes('--portal');
if (as && portal) { await page.goto(base + '/portal/login'); await page.fill('input[inputmode=tel]:visible', as); await page.fill('input[type=password]:visible', pw); await Promise.all([page.waitForURL((u) => !u.pathname.endsWith('/login')), page.click('button[type=submit]:visible')]); } else if (as) { await page.goto(base + '/login'); await page.fill('input[type=email]', as); await page.fill('input[type=password]:visible', pw); await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login')), page.click('button[type=submit]:visible')]); }
const WRITES = process.argv.includes('--writes'); const bad = [];
page.on('response', (r) => { if (WRITES && !['GET', 'HEAD', 'OPTIONS'].includes(r.request().method()) && r.status() >= 400 && !r.url().includes('broadcasting')) bad.push(`${r.status()} ${r.request().method()} ${r.url().replace(base, '')}`); });
await page.route('**/*', (r) => { if (WRITES) return r.continue(); const m = r.request().method(); if (!['GET', 'HEAD', 'OPTIONS'].includes(m) && !r.request().url().includes('broadcasting/auth')) { attempted++; return r.abort(); } return r.continue(); });
page.on('filechooser', (fc) => fc.setFiles([]).catch(() => {}));
const sig = () => page.evaluate(() => `${location.pathname}${location.search}|${document.querySelectorAll('[role=dialog],[role=menu],[role=listbox],[data-state=open]').length}|${(document.body?.innerText.length ?? 0)}|${document.querySelectorAll('*').length}`).catch(() => 'err');
let dead = 0, total = 0;
for (const path of paths) {
  try {
  await page.goto(base + path, { waitUntil: 'networkidle' }); await page.waitForTimeout(400);
  const n = await page.evaluate((sel) => document.querySelectorAll(sel).length, SEL);
  const labels = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((e, i) => `${e.tagName}|${(e.getAttribute('aria-label') || e.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 40)}|${e.getAttribute('href') || ''}|${e.disabled ? 'D' : ''}`), SEL);
  const results = [];
  for (let i = 0; i < labels.length; i++) {
    const [tag, text, href, dis] = labels[i].split('|');
    if (dis === 'D' || /^(#|javascript|mailto|tel)/.test(href) || (href && /\/(logout)$/.test(href)) || (href && href === path)) continue;
    await page.goto(base + path, { waitUntil: 'networkidle' }); await page.waitForTimeout(250);
    const el = page.locator(SEL).nth(i);
    if (!(await el.count()) || !(await el.isVisible().catch(() => false))) continue;
    const before = await sig(); const a0 = attempted; let popup = false, dl = false;
    page.once('popup', () => (popup = true)); page.once('download', () => (dl = true));
    total++;
    try { await el.click({ timeout: 2500, noWaitAfter: true, trial: false }); } catch (e) { results.push(`  ✗ غير قابل للنقر: [${tag}] "${text}" ${href}`); dead++; continue; }
    await page.waitForTimeout(500);
    const after = await sig();
    const status = await page.evaluate(() => (document.body?.innerText ?? '').slice(0, 120));
    if (/404|غير متوفر|خطأ في الإستضافة|Server Error/.test(status) && after.split('|')[0] !== before.split('|')[0]) { results.push(`  ✗ يفتح صفحة خطأ: [${tag}] "${text}" ${href} → ${after.split('|')[0]}`); dead++; continue; }
    if (before === after && attempted === a0 && !popup && !dl) { results.push(`  ✗ لا أثر: [${tag}] "${text}" ${href}`); dead++; }
    const items = await page.locator('[role=menu] [role=menuitem]').count();
    for (let j = 0; j < items; j++) {
      await page.goto(base + path, { waitUntil: 'networkidle' }); await page.waitForTimeout(250);
      await page.locator(SEL).nth(i).click({ noWaitAfter: true }); await page.waitForTimeout(300);
      const it = page.locator('[role=menu] [role=menuitem]').nth(j); const label = ((await it.innerText().catch(() => '')) || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      const b2 = await sig(); const a1 = attempted; total++;
      await it.click({ noWaitAfter: true }).catch(() => {}); await page.waitForTimeout(600);
      const af = await sig(); const st = await page.evaluate(() => (document.body?.innerText ?? '').slice(0, 120));
      if (/404|غير متوفر|خطأ في الإستضافة/.test(st) && af.split('|')[0] !== b2.split('|')[0]) { results.push(`  ✗ عنصر قائمة يفتح خطأ: "${text}" ← "${label}" → ${af.split('|')[0]}`); dead++; }
      else if (b2.split('|').slice(0, 1)[0] === af.split('|')[0] && attempted === a1 && (await page.locator('[role=dialog]').count()) === 0 && b2.split('|')[3] === af.split('|')[3]) { results.push(`  ✗ عنصر قائمة بلا أثر: "${text}" ← "${label}"`); dead++; }
    }
  }
  console.log(results.length ? `DEAD ${path} (${labels.length} عنصر)\n${results.join('\n')}` : `ok   ${path} (${labels.length} عنصر)`);
  } catch (e) { console.log(`ERR  ${path}: ${String(e.message).split('\n')[0].slice(0, 100)}`); dead++; }
}
if (bad.length) console.log('\nاستجابات خطأ من الخادم بعد الضغط:\n  ' + [...new Set(bad)].join('\n  '));
if (jsErrors.size) console.log('\nأخطاء JavaScript أثناء الفحص:\n  ' + [...jsErrors].join('\n  '));
console.log(`\nإجمالي ما ضُغط: ${total} — بلا أثر/معطوب: ${dead} — محاولات كتابة محجوبة: ${attempted}`);
await b.close(); process.exit(dead ? 1 : 0);
