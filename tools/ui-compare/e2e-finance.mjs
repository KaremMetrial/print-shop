import { BASE, newOrder, launch, login, step, sql, pickSelect, closeFlash, waitIdle, summary } from './e2e-lib.mjs';
import fs from 'node:fs';
const { b, page, errs } = await launch();
await login(page, 'accountant@pbms.test');
const OID = newOrder();
await page.goto(`${BASE}/accounting`); await waitIdle(page);
await step('المحاسبة: تسجيل دفعة جديدة من النافذة', async () => {
  const before = Number(sql('select count(*) from payments'));
  await page.getByRole('button', { name: 'تسجيل دفعة' }).click();
  await pickSelect(page, 'العميل', 'شركة النور'); await page.locator('input[inputmode=decimal]').first().fill('50');
  await page.getByRole('button', { name: /^تسجيل/ }).last().click(); await waitIdle(page); await closeFlash(page);
  return Number(sql('select count(*) from payments')) === before + 1 && sql('select amount from payments order by id desc limit 1') === '5000';
});
const PID = () => sql('select id from payments order by id desc limit 1');
await step('تفاصيل الدفعة تفتح من الرقم', async () => { await page.goto(`${BASE}/accounting`); await waitIdle(page); await page.getByRole('link', { name: /PAY-/ }).first().click(); await waitIdle(page); return page.url().includes('/accounting/payments/') && (await page.getByText('تفاصيل الدفعة').count()) > 0; });
await step('إيصال الدفعة: صفحة + PDF', async () => { await page.goto(`${BASE}/accounting/payments/${PID()}/receipt`); await waitIdle(page); const pdf = await page.request.get(`${BASE}/accounting/payments/${PID()}/receipt/pdf`); return (await page.getByText('إيصال دفع').count()) > 0 && pdf.ok() && (await pdf.body()).slice(0, 4).toString() === '%PDF'; });
await step('تصحيح مبلغ الدفعة بسبب', async () => {
  await page.goto(`${BASE}/accounting`); await waitIdle(page);
  await page.getByRole('button', { name: 'تصحيح' }).first().click(); await page.locator('input[inputmode=decimal]').first().fill('40'); await page.getByRole('dialog').locator('textarea,input[type=text]').last().fill('تصحيح E2E');
  await page.getByRole('button', { name: 'حفظ التصحيح' }).click(); await waitIdle(page); await closeFlash(page);
  return sql(`select amount from payments where id=${PID()}`) === '4000';
});
await step('إلغاء الدفعة بسبب', async () => {
  await page.goto(`${BASE}/accounting`); await waitIdle(page);
  await page.getByRole('button', { name: 'إلغاء الدفعة' }).first().click(); await page.getByRole('dialog').locator('textarea,input[type=text]').last().fill('إلغاء E2E');
  await page.getByRole('button', { name: 'تأكيد الإلغاء' }).click(); await waitIdle(page); await closeFlash(page);
  return sql(`select status from payments where id=${PID()}`) === 'VOIDED';
});
await step('تبويب المديونيات والمستردات تُفتح', async () => { await page.goto(`${BASE}/accounting?tab=receivables`); await waitIdle(page); const a = (await page.getByText('إجمالي المديونيات').count()) > 0; await page.goto(`${BASE}/accounting?tab=refunds`); await waitIdle(page); return a; });
if (errs.length) console.log('أخطاء JS:', [...new Set(errs)].join(' | '));
const f = summary(); await b.close(); process.exit(f ? 1 : 0);
