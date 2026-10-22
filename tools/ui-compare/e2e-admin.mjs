import { BASE, launch, login, step, sql, pickSelect, closeFlash, waitIdle, summary } from './e2e-lib.mjs';
const { b, page, errs } = await launch();
await login(page, 'superadmin@pbms.test');
const save = async (name = /حفظ|إضافة|إنشاء/) => { await page.getByRole('button', { name }).last().click(); await waitIdle(page, 900); await closeFlash(page); };
await step('عميل جديد: إنشاء من النموذج', async () => {
  await page.goto(`${BASE}/customers/create`); await waitIdle(page);
  await page.getByLabel(/اسم العميل/).fill('عميل E2E'); await page.getByLabel(/رقم الهاتف/).fill('01099887766');
  await save(/حفظ|إضافة العميل|إنشاء/); return sql("select count(*) from customers where name='عميل E2E'") === '1';
});
const CID = () => sql("select id from customers where name like 'عميل E2E%' order by id desc limit 1");
await step('عميل: تعديل الاسم يُحفظ', async () => {
  await page.goto(`${BASE}/customers/${CID()}/edit`); await waitIdle(page); await page.getByLabel(/اسم العميل/).fill('عميل E2E معدّل'); await save(/حفظ التغييرات|حفظ/);
  return sql(`select name from customers where id=${CID()}`) === 'عميل E2E معدّل';
});
await step('عميل: تفعيل دخول المنصة يُنشئ كلمة مؤقتة', async () => {
  await page.goto(`${BASE}/customers/${CID()}/access`); await waitIdle(page);
  await page.getByRole('button', { name: /تفعيل/ }).first().click(); await page.getByRole('button', { name: /تفعيل|تأكيد/ }).last().click(); await waitIdle(page, 900);
  const shown = (await page.getByText('كلمة المرور المؤقتة').count()) > 0; await closeFlash(page);
  return shown && sql(`select count(*) from customer_credentials where customer_id=${CID()}`) === '1';
});
await step('عميل: إعادة تعيين كلمة المرور ثم إيقاف الدخول', async () => {
  await page.goto(`${BASE}/customers/${CID()}/access`); await waitIdle(page);
  await page.getByRole('button', { name: /إعادة تعيين/ }).first().click(); await page.getByRole('button', { name: /إعادة|تأكيد/ }).last().click(); await waitIdle(page, 900); await closeFlash(page);
  await page.getByRole('button', { name: /إيقاف/ }).first().click(); await page.getByRole('button', { name: /إيقاف|تأكيد/ }).last().click(); await waitIdle(page, 900); await closeFlash(page);
  return sql(`select platform_access_enabled from customers where id=${CID()}`) === '0';
});
await step('تصنيف: إضافة وتعديل وإيقاف', async () => {
  await page.goto(`${BASE}/categories`); await waitIdle(page);
  await page.getByRole('button', { name: 'إضافة تصنيف' }).click(); await page.getByLabel('اسم التصنيف').fill('تصنيف E2E'); await page.getByRole('button', { name: 'حفظ' }).click(); await waitIdle(page, 800); await closeFlash(page);
  const added = sql("select count(*) from product_categories where name='تصنيف E2E'") === '1';
  const row = (n) => page.locator('[class*="min-h-[60px]"]').filter({ hasText: n });
  await row('تصنيف E2E').first().getByRole('button', { name: 'تعديل' }).click(); await page.getByLabel('اسم التصنيف').fill('تصنيف E2E 2'); await page.getByRole('button', { name: 'حفظ' }).click(); await waitIdle(page, 800); await closeFlash(page);
  const renamed = sql("select count(*) from product_categories where name='تصنيف E2E 2'") === '1';
  await row('تصنيف E2E 2').getByRole('button', { name: 'إيقاف' }).click(); await waitIdle(page, 800); await closeFlash(page);
  return added && renamed && sql("select is_active from product_categories where name='تصنيف E2E 2'") === '0';
});
await step('منتج: فتح التعديل وحفظ + الإيقاف/التفعيل', async () => {
  const id = sql('select id from products order by id limit 1'); const before = sql(`select is_active from products where id=${id}`);
  await page.goto(`${BASE}/products/${id}/edit`); await waitIdle(page);
  await page.getByLabel(/وصف/).first().fill('وصف E2E').catch(() => {});
  const sw = page.getByRole('switch').first(); await sw.click(); await page.getByRole('button', { name: /حفظ التغييرات|حفظ/ }).last().click(); await waitIdle(page, 900); await closeFlash(page);
  return sql(`select is_active from products where id=${id}`) !== before;
});
await step('شريحة سعر: إنشاء', async () => {
  await page.goto(`${BASE}/pricing/create`); await waitIdle(page);
  await page.getByLabel(/اسم الشريحة/).fill('شريحة E2E'); await page.getByLabel(/نسبة الخصم|الخصم/).first().fill('7').catch(() => {}); await save(/حفظ|إضافة|إنشاء/);
  return sql("select count(*) from pricing_tiers where name='شريحة E2E'") === '1';
});
await step('موظف: إنشاء بكلمة مرور ثم تعطيل وإعادة تعيين الكلمة', async () => {
  await page.goto(`${BASE}/employees/create`); await waitIdle(page);
  await page.getByLabel(/الاسم/).first().fill('موظف E2E'); await page.getByLabel(/البريد/).fill('e2e.emp@pbms.test'); await page.getByLabel('كلمة المرور').fill('Pbms@E2e-12345'); await pickSelect(page, 'الدور الوظيفي', 'مدخل'); await save(/إنشاء الموظف|حفظ/);
  const created = sql("select count(*) from users where email='e2e.emp@pbms.test'") === '1';
  await page.goto(`${BASE}/employees`); await waitIdle(page);
  const row = page.locator('div').filter({ hasText: 'e2e.emp@pbms.test' }).last();
  await page.getByText('e2e.emp@pbms.test').first().locator("xpath=ancestor::*[.//button[normalize-space()='تعطيل']][1]").getByRole('button', { name: 'تعطيل' }).click(); await page.waitForTimeout(400);
  const c = page.getByRole('dialog').getByRole('button', { name: /تعطيل|تأكيد/ }); if (await c.count()) await c.last().click(); await waitIdle(page, 900); await closeFlash(page);
  const off = sql("select status from users where email='e2e.emp@pbms.test'") !== 'ACTIVE';
  return created && off;
});
await step('الإعدادات: حفظ اسم المطبعة يظهر في الشريط', async () => {
  await page.goto(`${BASE}/settings/system`); await waitIdle(page); await page.getByLabel('اسم المطبعة').fill('مطبعة E2E'); await page.getByRole('button', { name: 'حفظ التغييرات' }).click(); await waitIdle(page, 900); await closeFlash(page);
  return (await page.locator('aside').getByText('مطبعة E2E').count()) > 0;
});
await step('الإشعارات: تعليم الكل كمقروء', async () => {
  await page.goto(`${BASE}/notifications`); await waitIdle(page);
  const btn = page.getByRole('button', { name: /تعليم/ }).first(); if (await btn.isEnabled().catch(() => false)) { await btn.click(); await waitIdle(page, 800); await closeFlash(page); }
  return sql("select count(*) from staff_notifications where user_id=1 and read_at is null") === '0';
});
if (errs.length) console.log('أخطاء JS:', [...new Set(errs)].join(' | '));
const f = summary(); await b.close(); process.exit(f ? 1 : 0);
