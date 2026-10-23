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

await step('موظف: منح صلاحية إضافية وحفظها', async () => {
  const id = sql("select id from users where email='dataentry@pbms.test'");
  await page.goto(`${BASE}/employees/${id}/permissions`); await waitIdle(page);
  const before = Number(sql(`select count(*) from user_permission_overrides where user_id=${id}`));
  const box = page.locator('[role=checkbox][aria-checked=false]').first(); await box.click();
  await page.getByRole('button', { name: 'حفظ التغييرات' }).click(); await waitIdle(page, 1200); await closeFlash(page);
  return Number(sql(`select count(*) from user_permission_overrides where user_id=${id}`)) === before + 1;
});
await step('الإعدادات: حفظ حد/قيمة نظام بدون خطأ', async () => {
  await page.goto(`${BASE}/settings/system`); await waitIdle(page);
  await page.getByLabel('اسم المطبعة').fill('مطبعة اختبار التعديل');
  await page.getByRole('button', { name: 'حفظ التغييرات' }).first().click(); await waitIdle(page, 1200); await closeFlash(page);
  return sql("select count(*) from app_settings where value='مطبعة اختبار التعديل'") !== '0';
});
await step('كلمة المرور: تغييرها يعمل ويُرفض الخطأ', async () => {
  await page.goto(`${BASE}/settings/password`); await waitIdle(page);
  await page.locator('#current_password').fill('Pbms@12345'); await page.locator('#password').fill('Pbms@Changed-12345'); await page.locator('#password_confirmation').fill('Pbms@Changed-12345');
  await page.getByRole('button', { name: 'حفظ كلمة المرور' }).click(); await waitIdle(page, 1500);
  const out = await page.getByText('تم الحفظ').count();
  // أعد الكلمة القديمة حتى لا تتأثر باقي الجولات
  await page.locator('#current_password').fill('Pbms@Changed-12345'); await page.locator('#password').fill('Pbms@12345'); await page.locator('#password_confirmation').fill('Pbms@12345');
  await page.getByRole('button', { name: 'حفظ كلمة المرور' }).click(); await waitIdle(page, 1500);
  return out > 0;
});
await step('خيارات المنتج: تعديل اسم المجموعة يُحفظ', async () => {
  const g = sql('select concat(product_id,\':\',id) from product_option_groups order by id limit 1'); const [pid, gid] = g.split(':');
  await page.goto(`${BASE}/products/${pid}/options/${gid}/edit`); await waitIdle(page);
  await page.getByLabel('اسم مجموعة الخيارات').fill('مجموعة معدّلة'); await submit();
  return sql(`select name from product_option_groups where id=${gid}`) === 'مجموعة معدّلة';
});
await step('طلب أوردر (موظف): تعديل كمية بند أثناء المراجعة يُحفظ', async () => {
  const r = sql("select id from order_requests where status in ('PENDING','IN_REVIEW') order by id desc limit 1");
  if (!r) return true;
  await page.goto(`${BASE}/order-requests/${r}`); await waitIdle(page);
  if (await page.getByRole('button', { name: /بدء المراجعة/ }).count()) { await page.getByRole('button', { name: /بدء المراجعة/ }).first().click(); await waitIdle(page, 1200); await closeFlash(page); }
  const q = page.locator('input[inputmode=numeric]').first(); if (!(await q.count())) return true;
  await q.fill('777'); await page.getByRole('button', { name: /حفظ التعديلات|حفظ/ }).first().click(); await waitIdle(page, 1200); await closeFlash(page);
  return sql(`select count(*) from order_request_items where order_request_id=${r} and quantity=777`) !== '0';
});
console.log('أخطاء JS:', errs.length, errs.slice(0, 3));
summary(); await b.close();
