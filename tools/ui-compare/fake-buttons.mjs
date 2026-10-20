#!/usr/bin/env node
/** يكشف عناصر "تبدو كزر" (حواف مستديرة + خلفية/إطار + نص قصير) لكنها غير قابلة للنقر (ليست a/button ولا داخلهما ولا لها handler). node tools/ui-compare/fake-buttons.mjs --as <email> <paths…> */
import { chromium } from 'playwright-core';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const base = arg('base', 'http://localhost:8000'); const as = arg('as'); const pw = arg('pw', 'Pbms@12345');
const paths = process.argv.slice(2).filter((a) => a.startsWith('/'));
const b = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'ar' })).newPage();
const portal = process.argv.includes('--portal');
if (as && portal) { await p.goto(base + '/portal/login'); await p.fill('input[inputmode=tel]', as); await p.fill('input[type=password]', pw); await Promise.all([p.waitForURL((u) => !u.pathname.endsWith('/login')), p.click('button[type=submit]')]); } else if (as) { await p.goto(base + '/login'); await p.fill('input[type=email]', as); await p.fill('input[type=password]', pw); await Promise.all([p.waitForURL((u) => !u.pathname.startsWith('/login')), p.click('button[type=submit]')]); }
let bad = 0;
for (const u of paths) {
  await p.goto(base + u, { waitUntil: 'networkidle' });
  const found = await p.evaluate(() => {
    const out = [];
    for (const e of document.querySelectorAll('main div, main span')) {
      if (e.closest('a,button,[role=button],[role=tab],label,[role=switch],[role=option],[role=menuitem],nav,select,[onclick]')) continue;
      const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
      const text = (e.innerText || '').trim(); if (!text || text.length > 28 || e.children.length > 2) continue;
      const h = r.height; const radius = parseFloat(cs.borderTopLeftRadius); const hasBg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)'; const hasOutline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
      const hasBorder = parseFloat(cs.borderTopWidth) > 0;
      const centered = cs.justifyContent === 'center' && cs.alignItems === 'center';
      if (h >= 30 && h <= 50 && radius >= 6 && (hasOutline || hasBorder || (hasBg && cs.backgroundColor !== 'rgb(255, 255, 255)')) && centered && r.width < 420) out.push(`${text} [${Math.round(r.width)}x${Math.round(h)}]`);
    }
    return [...new Set(out)];
  });
  if (found.length) { bad += found.length; console.log('FAKE? ' + u + '\n   ' + found.join('\n   ')); } else console.log('ok    ' + u);
}
await b.close(); process.exit(bad ? 1 : 0);
