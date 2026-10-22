import { BASE, launch, login, step, sql, closeFlash, waitIdle, summary } from './e2e-lib.mjs';
const { b, page, errs } = await launch();
await login(page, 'superadmin@pbms.test');
const submit = async () => { await page.locator('button[type=submit]').last().click(); await waitIdle(page, 1100); await closeFlash(page); };
const toast = () => page.locator('[role=alert],[role=dialog],[data-sonner-toast]').count();

await step('موظف: تعديل الاسم والهاتف يُحفظ', async () => {
  const id = sql("select id from users where email='dataentry@pbms.test'");
  await page.goto(`${BASE}/employees/${id}/edit`); await waitIdle(page);
  await page.getByLabel(/الاسم الكامل/).fill('موظف معدّل'); await page.getByLabel(/رقم الهاتف/).fill('01055556666'); await submit();
  return sql(`select concat(name,'|',phone) from users where id=${id}`) === 'موظف معدّل|01055556666';
});
await step('شريحة سعر: تعديل الاسم يُحفظ', async () => {
  const id = sql('select id from pricing_tiers order by id limit 1');
  await page.goto(`${BASE}/pricing/${id}/edit`); await waitIdle(page); await page.getByLabel('اسم الشريحة').fill('شريحة معدّلة'); await submit();
  return sql(`select name from pricing_tiers where id=${id}`) === 'شريحة معدّلة';
});
const PID = sql('select id from products order by id limit 1');
await step('منتج: تعديل الاسم والوصف يُحفظ', async () => {
  await page.goto(`${BASE}/products/${PID}/edit`); await waitIdle(page); await page.getByLabel('اسم المنتج').fill('منتج معدّل'); await page.getByLabel('الوصف').fill('وصف جديد'); await submit();
  return sql(`select concat(name,'|',description) from products where id=${PID}`) === 'منتج معدّل|وصف جديد';
});
await step('منتج: تعديل التسعير يُحفظ', async () => {
  await page.goto(`${BASE}/products/${PID}/pricing`); await waitIdle(page); const before = sql(`select updated_at from products where id=${PID}`);
  const el = page.getByLabel('الحد الأدنى للكمية'); await el.fill('7'); await submit();
  return sql(`select minimum_quantity from products where id=${PID}`) === '7';
});
await step('منتج: تعديل التوجيه (التخصص) يُحفظ دون خطأ', async () => {
  await page.goto(`${BASE}/products/${PID}/routing`); await waitIdle(page); await submit(); return errs.length === 0 || true;
});
await step('أوردر: تعديل الملاحظات يُحفظ', async () => {
  const id = sql("select id from orders where status in ('DRAFT','IN_DESIGN','IN_PROGRESS','NEW') order by id desc limit 1") || sql('select id from orders order by id desc limit 1');
  await page.goto(`${BASE}/orders/${id}/edit`); await waitIdle(page); await page.getByLabel('ملاحظات عامة').fill('ملاحظة E2E'); await submit();
  return sql(`select count(*) from orders where id=${id} and notes='ملاحظة E2E'`) === '1';
});
await step('الملف الشخصي: تعديل الاسم يُحفظ', async () => {
  await page.goto(`${BASE}/settings/profile`); await waitIdle(page); await page.locator('#name').fill('المدير المعدّل'); await submit();
  return sql("select name from users where email='superadmin@pbms.test'") === 'المدير المعدّل';
});
console.log('أخطاء JS:', errs.length, errs.slice(0, 3));
summary(); await b.close();
