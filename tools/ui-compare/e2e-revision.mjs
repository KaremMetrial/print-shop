import { BASE, until, newOrder, launch, login, step, sql, closeFlash, waitIdle, summary } from './e2e-lib.mjs';
const PNG = '/tmp/claude-1000/e2e.png';
const { b, page, errs } = await launch();
const OID = newOrder();
const [it] = sql(`select id from order_items where order_id=${OID} order by id`).split('\n');
const mona = sql("select id from users where email='mona@pbms.test'");
sql(`insert ignore into designer_specialty_memberships (designer_id, specialty_id) select ${mona}, s.id from designer_specialties s`);
sql(`update order_items set designer_id=${mona}, design_state='NEW' where order_id=${OID}`);
const as = async (e) => { await page.context().clearCookies(); await login(page, e); };
const submitVersion = async (label) => {
  await page.goto(`${BASE}/designer/tasks/${it}/versions/new`); await waitIdle(page);
  await page.locator('input[type=file]').first().setInputFiles(PNG); await waitIdle(page, 1500);
  await page.getByRole('button', { name: 'إرسال للمراجعة' }).first().click(); await waitIdle(page, 1500); await closeFlash(page);
  return until(() => sql(`select design_state from order_items where id=${it}`) === 'AWAITING_APPROVAL');
};
await as('mona@pbms.test');
await step('المصمم: بدء ثم إرسال النسخة 1', async () => { await page.goto(`${BASE}/designer/tasks/${it}`); await waitIdle(page); await page.getByRole('button', { name: 'بدء التصميم' }).click(); await waitIdle(page, 900); await closeFlash(page); return submitVersion('v1'); });
await as('superadmin@pbms.test'); await page.goto(`${BASE}/orders/${OID}/link`); await waitIdle(page); await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
await page.getByRole('button', { name: 'نسخ الرابط' }).click(); await page.waitForTimeout(500); const LINK = await page.evaluate(() => navigator.clipboard.readText()); const path = LINK.replace(/^https?:\/\/[^/]+/, '');
await page.context().clearCookies();
await step('العميل: رسالة تعديل أثناء الاعتماد → المهمة تعود «مطلوب تعديل»', async () => {
  await page.goto(`${BASE}${path}/items/${it}`); await waitIdle(page); await page.getByText('المحادثة', { exact: true }).first().click(); await page.waitForTimeout(400);
  await page.getByPlaceholder('اكتب رسالتك…').fill('من فضلكم غيّروا اللون إلى الأزرق'); await page.getByRole('button', { name: 'إرسال', exact: true }).click(); await waitIdle(page, 1200);
  return until(() => sql(`select design_state from order_items where id=${it}`) === 'REVISION_REQUESTED');
});
await as('mona@pbms.test');
await step('المصمم يرى التعديل ويرسل النسخة 2', async () => {
  await page.goto(`${BASE}/designer/tasks/${it}`); await waitIdle(page); const seen = (await page.getByText('إعداد نسخة جديدة').count()) > 0;
  return seen && (await submitVersion('v2')) && sql(`select count(*) from design_versions where order_item_id=${it}`) === '2';
});
await page.context().clearCookies();
await step('العميل يعتمد النسخة 2 ← يُغلق الشات ويدخل الأوردر الطباعة', async () => {
  await page.goto(`${BASE}${path}/items/${it}`); await waitIdle(page); await page.getByRole('button', { name: /اعتماد/ }).first().click(); await page.waitForTimeout(400);
  const c = page.getByRole('dialog').getByRole('button', { name: /اعتماد|تأكيد/ }); if (await c.count()) await c.last().click(); await waitIdle(page, 1500);
  const ok = await until(() => sql(`select design_state from order_items where id=${it}`) === 'APPROVED');
  await page.goto(`${BASE}${path}/items/${it}`); await waitIdle(page); await page.getByText('المحادثة', { exact: true }).first().click(); await page.waitForTimeout(400);
  return ok && (await page.getByText(/المحادثة مغلقة/).count()) > 0;
});
await as('superadmin@pbms.test');
await step('المدير: إعادة فتح التصميم المعتمد بسبب (قبل الطباعة)', async () => {
  sql(`update order_items set cancelled_at=now() where order_id=${OID} and id<>${it}`); sql(`update orders set status='DESIGN_STAGE' where id=${OID}`);
  await page.goto(`${BASE}/orders/${OID}/items/${it}`); await waitIdle(page);
  const btn = page.getByRole('button', { name: /إعادة فتح/ }); if (!(await btn.count())) return false;
  await btn.first().click(); await page.getByRole('dialog').locator('textarea').fill('تعديل E2E'); await page.getByRole('dialog').getByRole('button', { name: 'إعادة الفتح' }).click(); await waitIdle(page, 1200);
  return until(() => sql(`select design_state from order_items where id=${it}`) === 'REVISION_REQUESTED');
});
if (errs.length) console.log('أخطاء JS:', [...new Set(errs)].join(' | '));
const f = summary(); await b.close(); process.exit(f ? 1 : 0);
