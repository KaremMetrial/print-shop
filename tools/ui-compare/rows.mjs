#!/usr/bin/env node
// يطبع نطاقات الصفوف الأفقية غير الفارغة (نص/حدود) داخل شريط x: node rows.mjs img.png [skipTop] [x0] [x1]
import fs from 'node:fs'; import { PNG } from 'pngjs';
const [f, skip = '0', x0 = '30', x1 = '360'] = process.argv.slice(2); const P = PNG.sync.read(fs.readFileSync(f));
const rows = []; let start = -1;
for (let y = Number(skip); y < P.height; y++) {
  let dark = 0; for (let x = Number(x0); x < Number(x1); x++) { const i = (y * P.width + x) * 4; if (P.data[i] + P.data[i + 1] + P.data[i + 2] < 600) dark++; }
  if (dark > 0 && start < 0) start = y; if (dark === 0 && start >= 0) { rows.push(`${start - Number(skip)}-${y - 1 - Number(skip)}`); start = -1; }
}
console.log(rows.join(' '));
