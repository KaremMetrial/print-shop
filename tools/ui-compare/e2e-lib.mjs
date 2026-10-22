import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
export const BASE = process.env.E2E_BASE ?? 'http://localhost:8001';
export const sql = (q) => execSync(`docker compose exec -T mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 pbms_e2e -N -B 2>/dev/null'`, { encoding: 'utf8', input: q + ';' }).trim();
export const results = [];
export async function launch(opts = {}) { const b = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: ['--no-sandbox'] }); const ctx = await b.newContext({ viewport: opts.mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, locale: 'ar' }); const page = await ctx.newPage(); PAGE = page; page.on('dialog', (d) => d.accept()); const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 120))); return { b, page, errs }; }
export async function login(page, email, pw = 'Pbms@12345') { await page.goto(BASE + '/login'); await page.fill('input[type=email]', email); await page.fill('input[type=password]', pw); await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login')), page.click('button[type=submit]')]); }
export let PAGE = null;
export async function step(name, fn) { try { const r = await fn(); if (r === false) throw new Error('الأثر المتوقع لم يحدث'); results.push([true, name]); console.log('✓', name); } catch (e) { results.push([false, name, String(e.message).split('\n')[0].slice(0, 160)]); if (PAGE) { try { const f = `/tmp/claude-1000/e2e/${name.replace(/[^\w\u0600-\u06FF]+/g, '_').slice(0, 40)}.png`; await PAGE.screenshot({ path: f }); console.log('   لقطة:', f, '| نص ظاهر:', (await PAGE.locator('[role=dialog]').allInnerTexts()).join(' / ').replace(/\s+/g, ' ').slice(0, 160)); } catch {} }
    console.log('✗', name, '—', String(e.message).split('\n')[0].slice(0, 160)); } }
export async function pickSelect(page, label, optionText) {
  // PenSelect: <div><label>التسمية</label><div class=relative><button aria-haspopup=listbox/>…</div></div>
  const byLabel = page.locator('label', { hasText: label }).first().locator("xpath=../descendant::button[@aria-haspopup='listbox'][1]");
  const trigger = (await byLabel.count()) ? byLabel : page.locator('[aria-haspopup=listbox]').filter({ hasText: new RegExp(label) }).first();
  await trigger.click();
  await page.locator('[role=listbox] button', { hasText: optionText }).first().click();
}
export async function closeFlash(page) { for (let i = 0; i < 3; i++) { const d = page.locator('[role=dialog]').first(); if (!(await d.isVisible().catch(() => false))) break; await page.keyboard.press('Escape'); await page.waitForTimeout(250); } }
export async function waitIdle(page, ms = 700) { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); }
export function summary() { const f = results.filter((r) => !r[0]); console.log(`\nالنتيجة: ${results.length - f.length}/${results.length} نجحت${f.length ? '\nالفاشلة:\n' + f.map((r) => `  - ${r[1]}: ${r[2]}`).join('\n') : ''}`); return f.length; }

import fs from 'node:fs';
/** ينشئ أوردرًا جديدًا في مرحلة التصميم داخل pbms_e2e ويرجع رقمه (لا يلمس قاعدة التطوير). */
export function newOrder() {
  const code = fs.readFileSync(new URL('./e2e-seed-order.php', import.meta.url), 'utf8').split('\n').filter((l, i) => i > 0 && !l.startsWith('//')).join('\n');
  const out = execSync(`docker compose run --rm -e DB_DATABASE=pbms_e2e app php artisan tinker --execute='${code.replace(/'/g, "'\\''")}' 2>&1`, { encoding: 'utf8', timeout: 120000 });
  return out.match(/ORDER_ID=(\d+)/)[1];
}

/** ينتظر حتى تتحقق الدالة (حتى ~6 ثوانٍ) — لفحص أثر قاعدة البيانات بعد إجراء غير متزامن. */
export async function until(fn, ms = 6000) { const t = Date.now(); while (Date.now() - t < ms) { if (await fn()) return true; await new Promise((r) => setTimeout(r, 250)); } return false; }
