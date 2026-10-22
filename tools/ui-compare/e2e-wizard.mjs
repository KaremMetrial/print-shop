import { BASE, launch, login, step, sql, pickSelect, closeFlash, waitIdle, summary } from './e2e-lib.mjs';
const { b, page, errs } = await launch();
await login(page, 'sara@pbms.test'); // مدخل بيانات (ليس مديرًا) — يتأكد أن مسار الإنشاء يعمل بصلاحياته
const next = () => page.getByRole('button', { name: 'التالي' }).click().then(() => page.waitForTimeout(500));
await step('إنشاء أوردر من المعالج (عميل ← بند ← تسعير ← تسليم ← مراجعة ← إنشاء)', async () => {
  const before = Number(sql('select count(*) from orders'));
  await page.goto(`${BASE}/orders/create`); await waitIdle(page);
  await page.getByPlaceholder('ابحث باسم العميل أو رقم الهاتف').fill('النور'); await page.waitForTimeout(900); await page.getByRole('button', { name: /شركة النور/ }).click(); await next();
  const prod = sql("select name from products where is_active=1 and id not in (select product_id from product_option_groups where is_required=1) order by id limit 1");
  await pickSelect(page, 'المنتج', prod); const qty = page.getByLabel(/الكمية/); await qty.fill('150'); await next();
  await next(); // التسعير
  await next(); // التسليم (استلام افتراضي)
  await page.getByRole('button', { name: /إنشاء الأوردر|تأكيد|إنشاء/ }).last().click(); await waitIdle(page, 2000); await closeFlash(page);
  return Number(sql('select count(*) from orders')) === before + 1;
});
await step('الأوردر المُنشأ يظهر في القائمة وتفتح تفاصيله', async () => {
  await page.goto(`${BASE}/orders`); await waitIdle(page);
  const id = sql('select max(id) from orders'); await page.locator(`a[href="/orders/${id}"]`).first().click(); await waitIdle(page);
  return page.url().endsWith(`/orders/${id}`);
});
await step('الفلاتر والبحث في قائمة الأوردرات تعمل', async () => {
  await page.goto(`${BASE}/orders`); await waitIdle(page);
  await page.getByPlaceholder(/ابحث/).first().fill('ORD-0'); await page.keyboard.press('Enter'); await waitIdle(page, 900);
  return page.url().includes('q=');
});
if (errs.length) console.log('أخطاء JS:', [...new Set(errs)].join(' | '));
const f = summary(); await b.close(); process.exit(f ? 1 : 0);
