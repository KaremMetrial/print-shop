#!/usr/bin/env node
/** يمر على كل الصفحات لكل دور ويسجّل: أخطاء JS، رسائل console.error، استجابات ≥400 (عدا المتوقعة)، وصفحات الخطأ. node tools/ui-compare/health-sweep.mjs (على pbms_e2e:8001) */
import { chromium } from 'playwright-core';
const BASE = process.env.E2E_BASE ?? 'http://localhost:8001';
const PW = 'Pbms@12345';
const staff = {
  'superadmin@pbms.test': ['/dashboard', '/orders', '/orders/create', '/orders/152', '/orders/152?tab=items', '/orders/152?tab=payments', '/orders/152?tab=delivery', '/orders/152?tab=files', '/orders/152?tab=activity', '/orders/152/edit', '/orders/152/link', '/orders/152/items/1', '/orders/152/items/1?tab=versions', '/orders/153', '/orders/161', '/order-requests', '/order-requests/186', '/order-requests/187', '/order-requests/188', '/order-requests/189', '/customers', '/customers/create', '/customers/104', '/customers/104/orders', '/customers/104/financial', '/customers/104/payments', '/customers/104/refunds', '/customers/104/access', '/customers/104/activity', '/customers/104/edit', '/products', '/products/create', '/products/1/edit', '/products/1/specs', '/products/1/pricing', '/products/1/routing', '/products/1/activity', '/categories', '/pricing', '/pricing/create', '/design', '/design/designers', '/delivery', '/delivery?tab=pickup', '/delivery?tab=done', '/accounting', '/accounting?tab=receivables', '/accounting?tab=refunds', '/accounting/proofs', '/accounting/dashboard', '/invoices', '/reports', '/notifications', '/actions', '/actions/log', '/audit', '/employees', '/employees/create', '/employees/2/edit', '/employees/2/permissions', '/settings/system', '/settings/profile', '/search?q=ORD', '/search/image'],
  'accountant@pbms.test': ['/accounting', '/accounting/dashboard', '/accounting/proofs', '/invoices', '/customers', '/customers/104/financial', '/reports', '/notifications', '/orders'],
  'dataentry@pbms.test': ['/dashboard', '/orders', '/orders/create', '/orders/152', '/order-requests', '/customers', '/customers/104', '/delivery', '/actions', '/notifications', '/search?q=ORD'],
  'mona@pbms.test': ['/designer/tasks', '/notifications', '/settings/profile'],
};
const b = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: ['--no-sandbox'] });
let problems = 0, pages = 0;
const run = async (who, paths, portal) => {
  const page = await (await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ar' })).newPage();
  const errs = []; const bad = [];
  page.on('pageerror', (e) => errs.push('JS: ' + String(e.message).slice(0, 110)));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 110)); });
  page.on('response', (r) => { if (r.status() >= 400 && !/broadcasting\/auth/.test(r.url())) bad.push(`${r.status()} ${r.url().replace(BASE, '')}`); });
  if (portal) { await page.goto(BASE + '/portal/login'); await page.fill('input[inputmode=tel]:visible', who); await page.fill('input[type=password]:visible', 'Fixture-0000'); await Promise.all([page.waitForURL((u) => !u.pathname.endsWith('/login')), page.click('button[type=submit]:visible')]); }
  else { await page.goto(BASE + '/login'); await page.fill('input[type=email]', who); await page.fill('input[type=password]', PW); await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login')), page.click('button[type=submit]')]); }
  for (const u of paths) {
    errs.length = 0; bad.length = 0; pages++;
    const r = await page.goto(BASE + u, { waitUntil: 'networkidle' }).catch((e) => ({ status: () => 0, e }));
    const title = await page.locator('h1').first().textContent({ timeout: 1500 }).catch(() => '');
    const isErr = /^(404|403|500)$/.test((await page.locator('div.text-\\[56px\\]').first().textContent({ timeout: 300 }).catch(() => '')) ?? '');
    if (errs.length || bad.length || isErr || (r && r.status() >= 400)) { problems++; console.log(`✗ [${who}] ${u} → HTTP ${r?.status?.()} ${isErr ? 'صفحة خطأ ' : ''}${errs.concat(bad).join(' | ')}`); } else console.log(`✓ [${who}] ${u} ${(title ?? '').trim().slice(0, 24)}`);
  }
};
for (const [who, paths] of Object.entries(staff)) await run(who, paths, false);
await run('01023456789', ['/portal', '/portal/orders', '/portal/orders/152', '/portal/orders/152/items/1', '/portal/requests', '/portal/requests/new', '/portal/account', '/portal/orders/152/invoice'], true);
await b.close(); console.log(`\n${pages} صفحة — مشاكل: ${problems}`); process.exit(problems ? 1 : 0);
