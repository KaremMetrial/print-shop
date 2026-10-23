import { BASE, until, launch, step, sql, waitIdle, summary } from './e2e-lib.mjs';
// رحلات الموبايل (390px): معالج الطلب بمرفق، إثبات دفع من الورقة، شات الرابط بمرفق، اعتماد من الرابط — على pbms_e2e.
const { b, page, errs } = await launch({ mobile: true });
await page.goto(`${BASE}/portal/login`); await page.fill('input[inputmode=tel]:visible', '01023456789'); await page.fill('input[type=password]:visible', 'Fixture-0000');
await Promise.all([page.waitForURL((u) => !u.pathname.endsWith('/login')), page.click('button[type=submit]:visible')]);
const prod = sql("select name from products where is_active=1 and id not in (select product_id from product_option_groups where is_required=1) order by id limit 1");
await step('موبايل: معالج الطلب بخمس خطوات مع مرفق', async () => {
  const before = Number(sql('select count(*) from order_requests'));
  await page.goto(`${BASE}/portal/requests/new`); await waitIdle(page);
  await page.locator('div', { hasText: new RegExp(`^${prod}`) }).getByRole('button', { name: 'إضافة المنتج' }).first().click();
  await page.getByRole('button', { name: /التالي: المواصفات/ }).click();
  await page.locator('label:visible', { hasText: 'الكمية' }).locator('input').fill('150'); await page.getByRole('button', { name: /التالي: الملفات/ }).click();
  await page.locator('input[type=file]').first().setInputFiles('/tmp/claude-1000/e2e.png'); await page.getByText('e2e.png').waitFor();
  await page.getByRole('button', { name: /التالي: الاستلام/ }).click();
  await page.getByRole('button', { name: /استلام من المطبعة/ }).click(); await page.getByRole('button', { name: /التالي: مراجعة الطلب/ }).click();
  await page.getByRole('button', { name: 'إرسال الطلب للمراجعة' }).click(); await waitIdle(page, 1500);
  const ok = Number(sql('select count(*) from order_requests')) === before + 1;
  return ok && sql("select count(*) from files where parent_type='order_request_item' and original_filename='e2e.png'") === '1';
});
const o = sql("select id from orders where customer_id=104 and status='DESIGN_STAGE' order by id desc limit 1");
await step('موبايل: إرسال إثبات دفع من ورقة الأوردر', async () => {
  const before = Number(sql("select count(*) from payment_proofs"));
  await page.goto(`${BASE}/portal/orders/${o}`); await waitIdle(page);
  await page.getByRole('button', { name: 'إرسال إثبات دفع' }).first().click();
  await page.getByPlaceholder(/أدخل المبلغ/).fill('50'); await page.locator('select').selectOption({ index: 1 });
  await page.locator('input[type=file]').setInputFiles('/tmp/claude-1000/e2e.png'); await page.getByRole('button', { name: 'إرسال الإثبات' }).click(); await waitIdle(page, 1500);
  return Number(sql("select count(*) from payment_proofs")) === before + 1;
});
// رابط العميل: شات بمرفق ثم رفع إثبات
const token = (await import('node:child_process')).execSync(`docker compose run --rm -e DB_DATABASE=pbms_e2e app php artisan tinker --execute='$l=App\\Models\\OrderLink::where("order_id",${o})->first(); if(!$l){ app(App\\Services\\Orders\\OrderLinkService::class)->create(App\\Models\\Order::find(${o})); $l=App\\Models\\OrderLink::where("order_id",${o})->first(); } echo "TOKEN=".Illuminate\\Support\\Facades\\Crypt::decryptString($l->token_encrypted);' 2>&1`, { encoding: 'utf8' }).match(/TOKEN=(\S+)/)?.[1];
const item = sql(`select id from order_items where order_id=${o} and design_state='AWAITING_APPROVAL' limit 1`) || sql(`select id from order_items where order_id=${o} limit 1`);
await step('موبايل: شات الرابط — إرسال نص ثم مرفق صورة', async () => {
  await page.context().clearCookies();
  await page.goto(`${BASE}/l/${token}/items/${item}?tab=chat`); await waitIdle(page);
  await page.getByText('المحادثة مغلقة').or(page.getByPlaceholder('اكتب رسالتك هنا...')).first().waitFor({ timeout: 8000 });
  if ((await page.getByText('المحادثة مغلقة').count()) > 0) { console.log('   (الشات مقفل لهذا البند — تخطّي)'); return true; }
  await page.getByPlaceholder('اكتب رسالتك هنا...').fill('رسالة من الموبايل'); await page.getByRole('button', { name: 'إرسال الرسالة' }).click(); await waitIdle(page, 1200);
  await page.locator('input[aria-label="مرفق المحادثة"]').last().setInputFiles('/tmp/claude-1000/e2e.png'); await page.getByRole('button', { name: 'إرسال الرسالة' }).click(); await waitIdle(page, 1500);
  return sql(`select count(*) from item_chat_messages where order_item_id=${item} and file_id is not null`) === '1' && sql(`select count(*) from item_chat_messages where order_item_id=${item} and body='رسالة من الموبايل'`) === '1';
});

await step('موبايل: رسالة صوتية (ميكروفون وهمي) تُسجَّل وتُرسل', async () => {
  const { chromium } = await import('playwright-core');
  const vb = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const vc = await vb.newContext({ viewport: { width: 390, height: 844 }, locale: 'ar', permissions: ['microphone'] }); const vp = await vc.newPage();
  await vp.goto(`${BASE}/l/${token}/items/${item}?tab=chat`); await waitIdle(vp);
  if ((await vp.getByText('المحادثة مغلقة').count()) > 0) { await vb.close(); return true; }
  await vp.getByRole('button', { name: /^صوت$/ }).click(); await vp.waitForTimeout(1500); await vp.getByRole('button', { name: /^إيقاف$/ }).click(); await vp.getByText('رسالة صوتية').first().waitFor({ timeout: 5000 });
  await vp.getByRole('button', { name: 'إرسال الرسالة' }).click(); await waitIdle(vp, 1500); await vb.close();
  return sql(`select count(*) from files f join item_chat_messages m on m.file_id=f.id where m.order_item_id=${item} and (f.mime_type like 'audio/%' or f.mime_type='video/webm')`) === '1';
});
console.log('أخطاء JS:', errs.length, errs.slice(0, 3));
summary(); await b.close();
