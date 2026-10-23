import { BASE, until, launch, login, step, sql, pickSelect, closeFlash, waitIdle, summary } from './e2e-lib.mjs';
const { b, page, errs } = await launch();
const portal = async () => { await page.context().clearCookies(); await page.goto(`${BASE}/portal/login`); await page.fill('input[inputmode=tel]:visible', '01023456789'); await page.fill('input[type=password]:visible', 'Fixture-0000'); await Promise.all([page.waitForURL((u) => !u.pathname.endsWith('/login')), page.click('button[type=submit]:visible')]); };
await portal();
const prod = sql("select name from products where is_active=1 and id not in (select product_id from product_option_groups where is_required=1) order by id limit 1");
for (const n of [1, 2]) {
  await step(`البوابة: إرسال طلب أوردر ${n}`, async () => {
    const before = Number(sql('select count(*) from order_requests'));
    await page.goto(`${BASE}/portal/requests/new`); await waitIdle(page);
    await pickSelect(page, 'المنتج', prod); await page.getByLabel('الكمية').fill('120'); await page.getByRole('button', { name: 'استلام من المطبعة' }).click();
    await page.getByRole('button', { name: 'إرسال الطلب' }).click(); await waitIdle(page, 1500); await closeFlash(page);
    return Number(sql('select count(*) from order_requests')) === before + 1;
  });
}
await step('البوابة: قائمة الطلبات تعرض الطلب وتفتح تفاصيله', async () => { await page.goto(`${BASE}/portal/requests`); await waitIdle(page); const id = sql('select max(id) from order_requests'); await page.locator(`a[href="/portal/requests/${id}"]:visible`).first().click(); await waitIdle(page); return page.url().endsWith(`/portal/requests/${id}`); });
await step('البوابة: رفع إثبات دفع من صفحة الأوردر', async () => {
  const o = sql("select id from orders where customer_id=104 and status='DESIGN_STAGE' order by id desc limit 1");
  await page.goto(`${BASE}/portal/orders/${o}`); await waitIdle(page);
  await page.getByRole('button', { name: 'إرسال إثبات دفع' }).first().click(); await page.waitForTimeout(400);
  await page.getByRole('dialog').locator('input[type=file]').setInputFiles('/tmp/claude-1000/e2e.png'); await page.getByRole('dialog').getByRole('button', { name: 'إرسال الإثبات' }).click(); await waitIdle(page, 1500);
  return sql("select count(*) from payment_proofs where submitted_by_type='customer'") === '1';
});
await step('البوابة: القائمة والملف الشخصي وتسجيل الخروج', async () => {
  await page.goto(`${BASE}/portal/account`); await waitIdle(page); const ok = (await page.getByText(/الملف|الحساب|البيانات/).count()) > 0;
  await page.getByRole('button', { name: /تسجيل الخروج/ }).first().click(); await waitIdle(page); return ok && page.url().includes('/portal/login');
});
await page.context().clearCookies(); await login(page, 'sara@pbms.test');
const RID = () => sql("select id from order_requests where customer_id=104 and status='PENDING' order by id");
page.on('response', (r) => { if (r.request().method() !== 'GET' && /order-requests/.test(r.url())) console.log('   ·', r.request().method(), r.status(), r.url().replace(BASE, '')); });
await step('الموظف: بدء مراجعة طلب ثم قبوله → ينشأ أوردر', async () => {
  const [first] = RID().split('\n'); const before = Number(sql('select count(*) from orders'));
  await page.goto(`${BASE}/order-requests/${first}`); await waitIdle(page);
  await page.getByRole('button', { name: 'بدء المراجعة' }).click(); await waitIdle(page, 900); await closeFlash(page);
  await page.getByRole('button', { name: 'قبول الطلب' }).click(); await waitIdle(page, 1500); await closeFlash(page);
  return until(() => Number(sql('select count(*) from orders')) === before + 1 && sql(`select status from order_requests where id=${first}`) === 'ACCEPTED');
});
await step('الموظف: رفض طلب بسبب إلزامي', async () => {
  const id = RID().split('\n')[0];
  await page.goto(`${BASE}/order-requests/${id}`); await waitIdle(page);
  await page.getByRole('button', { name: 'بدء المراجعة' }).click(); await waitIdle(page, 900); await closeFlash(page);
  await page.getByRole('button', { name: 'رفض الطلب' }).click(); await page.waitForTimeout(400);
  const confirm = page.getByRole('button', { name: 'تأكيد الرفض' }); const needReason = await confirm.isDisabled();
  await page.getByPlaceholder('سبب الرفض (إلزامي)').fill('رفض E2E'); await confirm.click(); await waitIdle(page, 1200); await closeFlash(page);
  return needReason && (await until(() => sql(`select status from order_requests where id=${id}`) === 'REJECTED'));
});
await step('مركز الإجراءات: استلام ثم إتمام إجراء', async () => {
  sql("insert into staff_actions (dedupe_key,type,title,status,created_at,updated_at) values ('e2e-1','OTHER','إجراء E2E','OPEN',now(),now())");
  await page.goto(`${BASE}/actions`); await waitIdle(page);
  await page.getByRole('button', { name: 'أخذ الإجراء' }).last().click(); await waitIdle(page, 900); await closeFlash(page);
  const claimed = sql("select status from staff_actions where dedupe_key='e2e-1'") === 'CLAIMED';
  await page.getByRole('button', { name: 'إتمام' }).last().click(); await page.waitForTimeout(400);
  const c = page.getByRole('dialog').getByRole('button', { name: /إتمام|تأكيد/ }); if (await c.count()) { const t = page.getByRole('dialog').locator('textarea'); if (await t.count()) await t.fill('تم E2E'); await c.last().click(); }
  await waitIdle(page, 900); await closeFlash(page);
  return claimed && (await until(() => sql("select status from staff_actions where dedupe_key='e2e-1'") === 'DONE'));
});
if (errs.length) console.log('أخطاء JS:', [...new Set(errs)].join(' | '));
const f = summary(); await b.close(); process.exit(f ? 1 : 0);
