import { BASE, newOrder, launch, login, step, sql, pickSelect, closeFlash, waitIdle, summary } from './e2e-lib.mjs';
const PNG = '/tmp/claude-1000/e2e.png';
const { b, page, errs } = await launch();
const admin = async () => { await page.context().clearCookies(); await login(page, 'superadmin@pbms.test'); };
const OID = newOrder();
const items = sql(`select id from order_items where order_id=${OID} order by id`).split('\n');
const mona = sql("select id from users where email='mona@pbms.test'");
sql(`insert ignore into designer_specialty_memberships (designer_id, specialty_id) select ${mona}, s.id from designer_specialties s`);
sql(`update order_items set designer_id=${mona}, design_state='NEW' where order_id=${OID}`);

await admin();
await page.context().clearCookies(); await login(page, 'mona@pbms.test');
for (const [n, it] of items.entries()) {
  await step(`المصمم: بند ${n + 1} — بدء التصميم`, async () => { await page.goto(`${BASE}/designer/tasks/${it}`); await waitIdle(page); await page.getByRole('button', { name: 'بدء التصميم' }).click(); await waitIdle(page, 900); await closeFlash(page); return sql(`select design_state from order_items where id=${it}`) === 'IN_DESIGN'; });
  await step(`المصمم: بند ${n + 1} — إضافة نسخة ورفع ملف`, async () => {
    await page.goto(`${BASE}/designer/tasks/${it}/versions/new`); await waitIdle(page);
    await page.locator('input[type=file]').first().setInputFiles([PNG, PNG].slice(0, 1)); await waitIdle(page, 1500);
    for (let i = 0; i < 20; i++) { if (Number(sql("select count(*) from files where category='design_preview'")) >= n + 1) return true; await page.waitForTimeout(300); }
    return false;
  });
  await step(`المصمم: بند ${n + 1} — إرسال للمراجعة`, async () => {
    const send = page.getByRole('button', { name: 'إرسال للمراجعة' }); if (!(await send.count())) { await page.goto(`${BASE}/designer/tasks/${it}`); await waitIdle(page); }
    await page.getByRole('button', { name: 'إرسال للمراجعة' }).first().click(); await waitIdle(page, 1200); await closeFlash(page);
    return sql(`select design_state from order_items where id=${it}`) === 'AWAITING_APPROVAL';
  });
}

const token = await (async () => { await admin(); await page.goto(`${BASE}/orders/${OID}/link`); await waitIdle(page); return null; })();
// رابط العميل (بدون حساب): نستخرج الرابط من نص "نسخ الرابط" عبر الصفحة نفسها
await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
let LINK = '';
await step('إدارة الرابط: الرابط ظاهر وقابل للنسخ', async () => { await page.getByRole('button', { name: 'نسخ الرابط' }).click(); await page.waitForTimeout(500); LINK = await page.evaluate(() => navigator.clipboard.readText().catch(() => '')); return LINK.includes('/l/'); });
const path = LINK.replace(/^https?:\/\/[^/]+/, '');
await page.context().clearCookies();
if (path) {
  await step('العميل عبر الرابط: فتح المعاينة وإرسال رسالة شات', async () => {
    await page.goto(`${BASE}${path}/items/${items[0]}`); await waitIdle(page);
    await page.getByText('المحادثة', { exact: true }).first().click(); await page.waitForTimeout(500);
    await page.getByPlaceholder('اكتب رسالتك…').fill('رسالة E2E'); await page.getByRole('button', { name: 'إرسال', exact: true }).click(); await waitIdle(page, 1200);
    return Number(sql(`select count(*) from item_chat_messages where order_item_id=${items[0]}`)) >= 1;
  });
  for (const [n, it] of items.entries()) {
    await step(`العميل عبر الرابط: اعتماد التصميم ${n + 1}`, async () => {
      await page.goto(`${BASE}${path}/items/${it}`); await waitIdle(page);
      await page.getByRole('button', { name: /اعتماد/ }).first().click(); await page.waitForTimeout(400);
      const c = page.getByRole('dialog').getByRole('button', { name: /اعتماد|تأكيد/ }); if (await c.count()) await c.last().click(); await waitIdle(page, 1200);
      return sql(`select design_state from order_items where id=${it}`) === 'APPROVED';
    });
  }
  await step('اعتماد آخر بند ينقل الأوردر إلى الطباعة', async () => sql(`select status from orders where id=${OID}`) === 'IN_PRINTING');
  await step('العميل عبر الرابط: رفع إثبات دفع', async () => {
    await page.goto(`${BASE}${path}`); await waitIdle(page);
    await page.getByRole('button', { name: 'إرسال إثبات دفع' }).first().click(); await page.waitForTimeout(400);
    await page.getByRole('dialog').locator('input[type=file]').setInputFiles(PNG); await page.getByRole('dialog').getByRole('button', { name: 'إرسال الإثبات' }).click(); await waitIdle(page, 1500);
    return sql("select count(*) from payment_proofs where status='PENDING'") === '1';
  });
}
await page.context().clearCookies(); await login(page, 'accountant@pbms.test');
await step('المحاسب: اعتماد إثبات الدفع يسجّل دفعة', async () => {
  await page.goto(`${BASE}/accounting/proofs`); await waitIdle(page);
  await page.getByRole('button', { name: 'مراجعة الإثبات' }).first().click(); await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'اعتماد وتسجيل الدفعة' }).click(); await waitIdle(page, 1200); await closeFlash(page);
  return sql("select status from payment_proofs order by id desc limit 1") === 'APPROVED' && Number(sql('select count(*) from payments')) >= 1;
});
await admin();
await step('الطباعة والتسليم: إتمام الطباعة → (خروج للتوصيل) → إتمام الأوردر', async () => {
  const st = () => sql(`select status from orders where id=${OID}`);
  for (let i = 0; i < 4 && st() !== 'COMPLETED'; i++) {
    await page.goto(`${BASE}/orders/${OID}`); await waitIdle(page);
    await page.getByRole('button', { name: 'المزيد' }).click();
    await page.getByRole('menuitem').filter({ hasText: /إتمام|خرج|تسليم|استلام/ }).first().click(); await waitIdle(page, 1200); await closeFlash(page);
  }
  return st() === 'COMPLETED';
});
if (errs.length) console.log('أخطاء JS:', [...new Set(errs)].join(' | '));
const f = summary(); await b.close(); process.exit(f ? 1 : 0);
