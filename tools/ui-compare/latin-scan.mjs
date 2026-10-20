#!/usr/bin/env node
/** يفحص النص الظاهر فعليًا في الصفحات بحثًا عن كلمات لاتينية غير معرّبة. node tools/ui-compare/latin-scan.mjs --as superadmin@pbms.test /orders /audit … */
import { chromium } from 'playwright-core';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const base = arg('base', 'http://localhost:8000'); const as = arg('as'); const pw = arg('pw', 'Pbms@12345');
const paths = process.argv.slice(2).filter((a) => a.startsWith('/'));
const ALLOW = /^(PBMS|CUS|ORD|REQ|PAY|REF|ITEM|PRF|ALLOC|EMP|PDF|PNG|JPEG|WebP|MB|AI|EGP|ID|http|https|com|pbms|test|id)$/i;
const b = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'ar' })).newPage();
if (as) { await p.goto(base + '/login'); await p.fill('input[type=email]', as); await p.fill('input[type=password]', pw); await Promise.all([p.waitForURL((u) => !u.pathname.startsWith('/login')), p.click('button[type=submit]')]); }
let bad = 0;
for (const u of paths) {
  await p.goto(base + u, { waitUntil: 'networkidle' });
  const found = await p.evaluate(() => { const out = new Set(); const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const el = n.parentElement; if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue; const t = n.textContent.trim(); if (t) out.add(t); } for (const e of document.querySelectorAll('[placeholder],[aria-label],[title]')) for (const a of ['placeholder', 'aria-label', 'title']) if (e.getAttribute(a)) out.add(e.getAttribute(a)); for (const o of document.querySelectorAll('option')) out.add(o.textContent.trim()); return [...out]; });
  const hits = found.filter((t) => (t.match(/[A-Za-z]{3,}/g) ?? []).some((w) => !ALLOW.test(w)) && !/^[\w@.\-+ #:/]+$/.test(t.replace(/[؀-ۿ]/g, '')) === false ? (t.match(/[A-Za-z]{3,}/g) ?? []).some((w) => !ALLOW.test(w)) : false);
  if (hits.length) { bad++; console.log('LATIN ' + u + '\n   ' + hits.slice(0, 6).map((h) => h.slice(0, 70)).join('\n   ')); } else console.log('ok    ' + u);
}
await b.close(); process.exit(bad ? 1 : 0);
