#!/usr/bin/env node
/** يشغّل compare على كل شاشة في manifest.json ويحدّث status.json: node tools/ui-compare/run-all.mjs [--only id1,id2] [--max 14] */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const only = arg('only')?.split(','); const max = Number(arg('max', '14'));
const manifest = JSON.parse(fs.readFileSync('tools/ui-compare/manifest.json', 'utf8'));
const statusFile = 'tools/ui-compare/status.json'; const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
let fail = 0;
for (const m of manifest.filter((x) => !only || only.includes(x.id))) {
  let out = '';
  try { out = execFileSync('node', ['tools/ui-compare/compare.mjs', '--ref', `storage/ui-ref/${m.id}.png`, '--path', m.path, '--name', m.id, ...(m.as ? ['--as', m.as] : []), '--max', String(max)], { encoding: 'utf8' }); } catch (e) { out = (e.stdout ?? '') + (e.stderr ?? ''); }
  const mm = out.match(/HTTP=(\d+) اختلاف-المحتوى=([\d.]+)% صارم=([\d.]+)%/);
  if (!mm) { console.log(`✗ ${m.id} ${m.name}: فشل التشغيل\n${out.slice(0, 200)}`); fail++; continue; }
  const [, http, loose, strict] = mm; const ok = Number(http) < 400 && Number(strict) <= max;
  status[m.id] = `${ok ? '✅' : '❌'} ${strict}%`;
  console.log(`${ok ? '✅' : '❌'} ${m.id} ${m.name.padEnd(28)} HTTP=${http} loose=${loose}% strict=${strict}%`);
  if (!ok) fail++;
}
fs.writeFileSync(statusFile, JSON.stringify(status, null, 0));
console.log(fail ? `\n${fail} شاشة غير مطابقة` : '\nكل الشاشات ضمن الحد');
process.exit(fail ? 1 : 0);
