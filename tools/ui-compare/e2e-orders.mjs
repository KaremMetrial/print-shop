import { BASE, newOrder, launch, login, step, sql, pickSelect, closeFlash, waitIdle, summary } from './e2e-lib.mjs';
const { b, page, errs } = await launch();
await login(page, 'superadmin@pbms.test');
const OID = newOrder();
const item = () => sql(`select id from order_items where order_id=${OID} and cancelled_at is null order by id limit 1`);
await page.goto(`${BASE}/orders/${OID}?tab=items`); await waitIdle(page);
const it = item();
await step('تعديل البند: تغيير الكمية والملاحظة يُحفظ', async () => {
  await page.getByRole('button', { name: 'تعديل البند' }).first().click();
  await page.getByLabel('الكمية').fill('7'); await page.getByLabel('ملاحظات البند').fill('ملاحظة E2E');
  await page.getByRole('button', { name: 'حفظ التعديل' }).click(); await waitIdle(page); await closeFlash(page);
  return sql(`select quantity from order_items where id=${it}`) === '7' && sql(`select notes from order_items where id=${it}`) === 'ملاحظة E2E';
});
await step('إضافة بند جديد', async () => {
  const before = Number(sql(`select count(*) from order_items where order_id=${OID}`));
  await page.getByRole('button', { name: 'إضافة بند' }).click();
  const prod = sql("select name from products where is_active=1 and id not in (select product_id from product_option_groups where is_required=1) limit 1");
  await pickSelect(page, 'المنتج', prod); await page.getByLabel(/الكمية/).fill('2');
  await page.getByRole('button', { name: 'إضافة البند' }).click(); await waitIdle(page); await closeFlash(page);
  return Number(sql(`select count(*) from order_items where order_id=${OID}`)) === before + 1;
});
await step('تغيير المصمم', async () => {
  await page.goto(`${BASE}/orders/${OID}?tab=items`); await waitIdle(page);
  const before = sql(`select coalesce(designer_id,0) from order_items where id=${it}`);
  sql(`insert ignore into designer_specialty_memberships (designer_id, specialty_id) select u.id, json_unquote(json_extract(i.product_snapshot,'$.required_specialty_id')) from users u join roles r on r.id=u.role_id and r.code='DESIGNER' join order_items i on i.id=${it} where json_extract(i.product_snapshot,'$.required_specialty_id') is not null`);
  const other = sql(`select name from users where id in (select u.id from users u join roles r on r.id=u.role_id where r.code='DESIGNER') and id<>${before} limit 1`);
  await page.getByRole('button', { name: 'تغيير المصمم' }).first().click(); await pickSelect(page, 'المصمم', other);
  await page.getByRole('button', { name: 'حفظ', exact: true }).click(); await waitIdle(page); await closeFlash(page);
  return sql(`select coalesce(designer_id,0) from order_items where id=${it}`) !== before;
});
await step('إلغاء بند بسبب', async () => {
  await page.goto(`${BASE}/orders/${OID}?tab=items`); await waitIdle(page);
  const last = sql(`select id from order_items where order_id=${OID} and cancelled_at is null order by id desc limit 1`);
  const n = await page.getByRole('button', { name: 'إلغاء البند' }).count(); await page.getByRole('button', { name: 'إلغاء البند' }).nth(n - 1).click();
  await page.getByLabel('سبب الإلغاء *').fill('اختبار E2E'); await page.getByRole('button', { name: 'تأكيد إلغاء البند' }).click(); await waitIdle(page); await closeFlash(page);
  return sql(`select cancelled_at is not null from order_items where id=${last}`) === '1';
});
await page.goto(`${BASE}/orders/${OID}/link`); await waitIdle(page);
await step('الرابط: إعادة إنشاء (مع تأكيد) تغيّر التوكن', async () => {
  const before = sql(`select token_hash from order_links where order_id=${OID}`);
  await page.getByRole('button', { name: 'إعادة إنشاء الرابط' }).click(); await page.getByRole('button', { name: 'إعادة الإنشاء' }).click(); await waitIdle(page); await closeFlash(page);
  return sql(`select token_hash from order_links where order_id=${OID}`) !== before;
});
await step('الرابط: إيقاف مؤقت ثم إعادة تفعيل', async () => {
  await page.getByRole('button', { name: 'إيقاف الرابط مؤقتًا' }).click(); await page.getByRole('button', { name: 'إيقاف الرابط' }).click(); await waitIdle(page); await closeFlash(page);
  const s1 = sql(`select status from order_links where order_id=${OID}`);
  await page.getByRole('button', { name: 'إعادة تفعيل الرابط' }).click(); await waitIdle(page); await closeFlash(page);
  return s1 === 'SUSPENDED' && sql(`select status from order_links where order_id=${OID}`) === 'ACTIVE';
});
await step('الرابط: نسخ الرابط يعطي تغذية راجعة', async () => { await page.getByRole('button', { name: 'نسخ الرابط' }).click(); await page.waitForTimeout(600); return (await page.getByRole('button', { name: /تم النسخ|تعذر النسخ/ }).count()) > 0; });
await page.goto(`${BASE}/orders/${OID}?tab=payments`); await waitIdle(page);
await step('تسجيل دفعة من صفحة الأوردر', async () => {
  const before = Number(sql('select count(*) from payments'));
  await page.getByRole('button', { name: 'تسجيل دفعة' }).click();
  await page.locator('input[inputmode=decimal],input[type=text]').first().fill('10'); 
  await page.getByRole('button', { name: /تسجيل|حفظ/ }).last().click(); await waitIdle(page); await closeFlash(page);
  return Number(sql('select count(*) from payments')) === before + 1;
});
await step('إلغاء الأوردر بسبب', async () => {
  await page.goto(`${BASE}/orders/${OID}`); await waitIdle(page);
  await page.getByRole('button', { name: 'المزيد' }).click(); await page.getByRole('menuitem', { name: 'إلغاء الأوردر' }).click();
  await pickSelect(page, 'سبب الإلغاء', 'طلب العميل'); await page.getByRole('button', { name: 'تأكيد الإلغاء' }).click(); await page.getByRole('button', { name: /تأكيد/ }).last().click(); await waitIdle(page); await closeFlash(page);
  return sql(`select status from orders where id=${OID}`) === 'CANCELLED';
});
if (errs.length) console.log('أخطاء JS:', [...new Set(errs)].join(' | '));
const f = summary(); await b.close(); process.exit(f ? 1 : 0);
