/** ضغط وتزامن على نسخة e2e المعزولة (pbms_e2e): قراءة متوازية + سباقات الدفع والـIdempotency. node tools/ui-compare/load-test.mjs */
import { request } from 'playwright-core';
import { BASE, sql } from './e2e-lib.mjs';
const api = await request.newContext({ baseURL: BASE, extraHTTPHeaders: { Accept: 'application/json' } });
const xsrf = async () => decodeURIComponent((await api.storageState()).cookies.find((c) => c.name === 'XSRF-TOKEN')?.value ?? '');
await api.get('/login'); // يضبط كوكي XSRF
const lg = await api.post('/login', { data: { email: 'superadmin@pbms.test', password: 'Pbms@12345' }, headers: { 'X-XSRF-TOKEN': await xsrf() } });
if (lg.status() >= 400) throw new Error('login ' + lg.status());
const pct = (a, p) => a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))];

// A) قراءة: 40 طلبًا متوازيًا × 3 جولات على صفحات ثقيلة
const pages = ['/dashboard', '/orders', '/customers', '/products', '/order-requests'];
for (const conc of [10, 40]) {
  const lat = []; let bad = 0;
  await Promise.all(Array.from({ length: conc * 3 }, async (_, i) => { const t = Date.now(); const r = await api.get(pages[i % pages.length], { headers: { 'X-Inertia': 'true', 'X-Inertia-Version': '' } }).catch(() => null); lat.push(Date.now() - t); if (!r || r.status() >= 500) bad++; }));
  console.log(`قراءة ×${conc * 3} (تزامن ${conc}): p50=${pct(lat, 0.5)}ms p95=${pct(lat, 0.95)}ms max=${Math.max(...lat)}ms أخطاء5xx=${bad}`);
}

// B) سباق الدفع: نفس مفتاح Idempotency ×12 ⇒ دفعة واحدة فقط
const cust = sql("select customer_id from orders where status='DESIGN_STAGE' limit 1"), ord = sql(`select id from orders where customer_id=${cust} and status='DESIGN_STAGE' limit 1`);
const due = Number(sql(`select grand_total - coalesce((select sum(pa.amount) from payment_allocations pa join payments p on p.id=pa.payment_id where pa.order_id=${ord} and p.status='CONFIRMED'),0) from orders where id=${ord}`));
const before = Number(sql('select count(*) from payments'));
const pay = (key, amount) => api.post('/accounting/payments', { data: { customer_id: Number(cust), order_id: Number(ord), amount_minor: amount, method: 'CASH' }, headers: { 'Idempotency-Key': key, 'X-XSRF-TOKEN': '' } });
const tok = await xsrf();
const send = (key, amount) => api.post('/accounting/payments', { data: { customer_id: Number(cust), order_id: Number(ord), amount_minor: amount, method: 'CASH' }, headers: { 'Idempotency-Key': key, 'X-XSRF-TOKEN': tok } });
const same = await Promise.all(Array.from({ length: 12 }, () => send('race-same-key', Math.min(due, 10000))));
console.log('نفس المفتاح ×12: حالات', [...new Set(same.map((r) => r.status()))].join(','), '| دفعات جديدة =', Number(sql('select count(*) from payments')) - before, '(المتوقع 1)');
// C) مفاتيح مختلفة: 12 دفعة بقيمة المستحق كاملًا ⇒ لا يتجاوز مجموع المسدّد المستحق
const rest = due - Math.min(due, 10000);
const diff = await Promise.all(Array.from({ length: 12 }, (_, i) => send('race-diff-' + i, Math.max(rest, 100))));
const paid = Number(sql(`select coalesce(sum(pa.amount),0) from payment_allocations pa join payments p on p.id=pa.payment_id where pa.order_id=${ord} and p.status='CONFIRMED'`));
const total = Number(sql(`select grand_total from orders where id=${ord}`));
console.log(`مفاتيح مختلفة ×12: حالات ${[...new Set(diff.map((r) => r.status()))].join(',')} | المسدّد ${paid} من ${total} ${paid <= total ? '✓ لا تجاوز' : '✗ تجاوز المستحق!'}`);
await api.dispose(); process.exit(paid <= total ? 0 : 1);
