#!/usr/bin/env node
// يولّد docs/10-screen-inventory.md من storage/ui-ref/*.html (اسم الشاشة، المقاس، نوع الشاشة/الـshell)
import fs from 'node:fs';
import { parse } from 'node-html-parser';
const dir = 'storage/ui-ref'; const done = JSON.parse(fs.existsSync('tools/ui-compare/status.json') ? fs.readFileSync('tools/ui-compare/status.json', 'utf8') : '{}');
const rows = [];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html') && !x.startsWith('c-') && !/^s00/.test(x))) {
  const id = f.replace('.html', '');
  const root = parse(fs.readFileSync(`${dir}/${f}`, 'utf8'));
  const first = root.querySelector('body [data-pencil-name]'); const name = first?.getAttribute('data-pencil-name') ?? '';
  const st = first?.getAttribute('style') ?? '';
  const w = (st.match(/width:\s*([\d.]+)px/) ?? [])[1]; const h = (st.match(/height:\s*([\d.]+)px/) ?? [])[1];
  const els = root.querySelectorAll('[data-pencil-name]');
  const sb = els.find((e) => /sidebar/i.test(e.getAttribute('data-pencil-name')) && !/slot|navigation|brand/i.test(e.getAttribute('data-pencil-name')));
  const shell = sb ? `${sb.getAttribute('data-pencil-name')}` : (Number(w) === 390 ? 'موبايل' : 'بدون sidebar (بوابة/رابط/مصمم)');
  rows.push({ id, name, w, h, shell, st: done[id] ?? '⬜' });
}
rows.sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
const md = `# 10 — جرد شاشات التصميم (من pendev/untitled.pen)
يُولَّد بالأمر \`node tools/ui-compare/inventory.mjs\` من \`storage/ui-ref\`. الحالة تُحدَّث في \`tools/ui-compare/status.json\` (id → "✅ x.x%").
المعيار: اختلاف-المحتوى ≤ 4% عبر \`compare.mjs\` (خط الأساس لتصدير الـpen نفسه ≈ 2–5%).

| الحالة | id | الشاشة | المقاس | الغلاف (Shell) |
|---|---|---|---|---|
${rows.map((r) => `| ${r.st} | \`${r.id}\` | ${r.name} | ${r.w}×${r.h} | ${r.shell} |`).join('\n')}

الإجمالي: ${rows.length} شاشة مُصدَّرة (الشاشات الأخرى — الإعدادات S-068..076، S-010، S-016، S-038، S-058 وغيرها — تُصدَّر عند الوصول لوحداتها).
`;
fs.writeFileSync('docs/10-screen-inventory.md', md); console.log(rows.length, 'screens');
