import fs from 'node:fs';
import { parse } from 'node-html-parser';
const dir = 'storage/ui-ref'; const stat = {}; const per = [];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html'))) {
  const root = parse(fs.readFileSync(`${dir}/${f}`, 'utf8'));
  const first = root.querySelector('body [data-pencil-name]'); const name = first?.getAttribute('data-pencil-name');
  const els = root.querySelectorAll('[data-pencil-name]');
  const sb = els.find((e) => /sidebar/i.test(e.getAttribute('data-pencil-name')) && !/slot|navigation|brand/i.test(e.getAttribute('data-pencil-name')));
  const tb = els.find((e) => /topbar/i.test(e.getAttribute('data-pencil-name')) && !/slot/i.test(e.getAttribute('data-pencil-name')));
  const w = (e) => (e?.getAttribute('style')?.match(/(?:^|;\s*)width:\s*([\d.]+)px/) ?? [])[1];
  const rw = w(first);
  const key = `root=${rw} sidebar=${sb ? sb.getAttribute('data-pencil-name') + ':' + w(sb) : '-'} topbar=${tb ? tb.getAttribute('data-pencil-name') + ':' + w(tb) : '-'}`;
  stat[key] = (stat[key] ?? []).concat(`${f.replace('.html', '')}:${(name ?? '').slice(0, 14)}`);
}
for (const [k, v] of Object.entries(stat)) console.log(v.length, k, '\n   ', v.slice(0, 6).join(' , '));
