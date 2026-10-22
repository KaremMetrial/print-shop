import { BASE, until, newOrder, launch, login, step, sql, pickSelect, closeFlash, waitIdle, summary } from './e2e-lib.mjs';
const { b, page, errs } = await launch();
const as = async (email) => { await page.context().clearCookies(); await login(page, email); };
const OID = newOrder();
await as('accountant@pbms.test');
await step('المحاسب: رفض إثبات دفع بسبب إلزامي', async () => {
  sql("insert into files (storage_key,disk,original_filename,mime_type,size_bytes,category,uploaded_by_type,checksum,created_at) values ('e2e/x','local','x.png','image/png',10,'payment_proof','link','x',now())");
  sql(`insert into payment_proofs (order_id,customer_id,file_id,claimed_amount,method,status,submitted_by_type,created_at,updated_at) select ${OID},104,max(id),5000,'CASH','PENDING','link',now(),now() from files`);
  await page.goto(`${BASE}/accounting/proofs`); await waitIdle(page);
  await page.getByRole('button', { name: 'مراجعة الإثبات' }).first().click(); await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'رفض', exact: true }).click();
  const confirm = page.getByRole('button', { name: 'تأكيد الرفض' }); const disabled = await confirm.isDisabled();
  await page.getByPlaceholder(/السبب/).fill('الصورة غير واضحة'); await confirm.click(); await waitIdle(page, 1200); await closeFlash(page);
  return disabled && (await until(() => sql("select status from payment_proofs order by id desc limit 1") === 'REJECTED'));
});
await as('superadmin@pbms.test');
await step('تعديل الأوردر: حفظ ملاحظة ورسوم التوصيل', async () => {
  await page.goto(`${BASE}/orders/${OID}/edit`); await waitIdle(page);
  const notes = page.locator('textarea').first(); await notes.fill('ملاحظة تعديل E2E');
  await page.getByRole('button', { name: /حفظ/ }).last().click(); await waitIdle(page, 1500); await closeFlash(page);
  return until(() => sql(`select notes from orders where id=${OID}`) === 'ملاحظة تعديل E2E');
});
await step('المحاسبة: تسجيل دفعة ثم إلغاء الأوردر ثم صرف الاسترداد', async () => {
  await page.goto(`${BASE}/orders/${OID}?tab=payments`); await waitIdle(page);
  await page.getByRole('button', { name: 'تسجيل دفعة' }).click(); await page.getByLabel('المبلغ (ج.م)').fill('5'); await page.getByRole('button', { name: /^تسجيل/ }).last().click(); await waitIdle(page, 1200); await closeFlash(page);
  await page.goto(`${BASE}/orders/${OID}`); await waitIdle(page); await page.getByRole('button', { name: 'المزيد' }).click(); await page.getByRole('menuitem', { name: 'إلغاء الأوردر' }).click();
  await pickSelect(page, 'سبب الإلغاء', 'طلب العميل'); await page.getByRole('button', { name: 'تأكيد الإلغاء' }).click(); await page.getByRole('button', { name: /تأكيد/ }).last().click(); await waitIdle(page, 1500); await closeFlash(page);
  await page.goto(`${BASE}/accounting?tab=refunds`); await waitIdle(page);
  await page.getByRole('button', { name: /تسجيل رد/ }).first().click(); await page.waitForTimeout(400);
  await page.getByRole('button', { name: /^(تسجيل|حفظ|تأكيد)/ }).last().click(); await waitIdle(page, 1500); await closeFlash(page);
  return until(() => Number(sql('select count(*) from refund_payouts')) >= 1);
});
await step('الصلاحيات: تعديل صلاحية موظف وحفظها', async () => {
  const uid = sql("select id from users where email='sara@pbms.test'");
  await page.goto(`${BASE}/employees/${uid}/permissions`); await waitIdle(page);
  const before = sql(`select count(*) from user_permission_overrides where user_id=${uid}`);
  await page.getByRole('checkbox', { checked: false }).first().click();
  await page.getByRole('button', { name: /حفظ/ }).last().click(); await waitIdle(page, 1500); await closeFlash(page);
  return until(() => sql(`select count(*) from user_permission_overrides where user_id=${uid}`) !== before);
});
await step('المصممون: تغيير التوفر وفتح ملف المصمم', async () => {
  await page.goto(`${BASE}/design/designers`); await waitIdle(page);
  const id = sql("select id from users where email='mona@pbms.test'");
  await page.goto(`${BASE}/design/designers/${id}?tab=availability`); await waitIdle(page);
  await page.getByRole('button', { name: /مشغول|غير متاح/ }).first().click(); await waitIdle(page, 1200); await closeFlash(page);
  return until(() => sql(`select status from designer_availability where designer_id=${id}`) !== 'AVAILABLE');
});
await step('الإعدادات: تعطيل طريقة دفع تخفيها من نافذة الدفع', async () => {
  await page.goto(`${BASE}/settings/system`); await waitIdle(page);
  await page.getByLabel('بطاقة').uncheck().catch(() => {}); await page.getByLabel('محفظة إلكترونية').uncheck().catch(() => {});
  await page.getByRole('button', { name: 'حفظ التغييرات' }).click(); await waitIdle(page, 1200); await closeFlash(page);
  await page.goto(`${BASE}/accounting`); await waitIdle(page); await page.getByRole('button', { name: 'تسجيل دفعة' }).click(); await page.waitForTimeout(400);
  const txt = await page.getByRole('dialog').innerText(); return !txt.includes('محفظة') && txt.includes('نقدًا');
});
await step('الطباعة والتسليم: أزرار الصفحة تعمل', async () => {
  sql(`update orders set status='IN_PRINTING' where id=${OID}`); const o2 = newOrder(); sql(`update orders set status='IN_PRINTING', printing_started_at=now() where id=${o2}`);
  await page.goto(`${BASE}/delivery`); await waitIdle(page);
  await page.getByRole('button', { name: /إتمام الطباعة|إنهاء/ }).first().click(); await page.waitForTimeout(400);
  await page.getByRole('dialog').getByRole('button', { name: /تأكيد/ }).click(); await waitIdle(page, 1500); await closeFlash(page);
  return until(() => ['READY_FOR_PICKUP', 'READY_FOR_DELIVERY'].includes(sql(`select status from orders where id=${o2}`)) || ['READY_FOR_PICKUP', 'READY_FOR_DELIVERY'].includes(sql(`select status from orders where id=${OID}`)));
});
if (errs.length) console.log('أخطاء JS:', [...new Set(errs)].join(' | '));
const f = summary(); await b.close(); process.exit(f ? 1 : 0);
