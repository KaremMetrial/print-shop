#!/usr/bin/env node
/**
 * يحوّل HTML المُصدَّر من الـpen إلى JSX بـTailwind (arbitrary values) مطابق للقيم حرفيًا.
 * node tools/ui-compare/pen2tsx.mjs <file.html> [--from "اسم العقدة"] [--name ComponentName] [--out path.tsx]
 * - الألوان المعروفة تُربط بـtokens (var(--…)).
 * - أيقونات lucide تُحوَّل إلى <Icon name="…"/> (resources/js/pen/icon.tsx).
 * الناتج نقطة بداية: تُستخرج منه المكونات وتُربط البيانات، ثم تُراجَع بـcompare.mjs.
 */
import fs from 'node:fs';
import { parse } from 'node-html-parser';

const A = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const file = process.argv[2]; const from = A('from'); const name = A('name', 'Generated'); const out = A('out');
const root = parse(fs.readFileSync(file, 'utf8')).querySelector('body');

const TOKENS = { '#2563eb': 'primary', '#0f172a': 'ink', '#64748b': 'muted-foreground', '#e2e8f0': 'border', '#cbd5e1': 'control-border', '#f8fafc': 'background', '#ffffff': 'surface', '#eff6ff': 'primary-soft', '#f1f5f9': 'surface-subtle', '#475569': 'text-secondary', '#fffbeb': 'warning-soft', '#92400e': 'warning-text', '#fef2f2': 'danger-soft', '#991b1b': 'danger-text', '#f0fdf4': 'success-soft', '#166534': 'success-text', '#dc2626': 'danger', '#16a34a': 'success', '#d97706': 'warning', '#1d4ed8': 'primary-hover' };
const col = (v) => v.replace(/#[0-9a-fA-F]{6}\b/g, (h) => (TOKENS[h.toLowerCase()] ? `var(--${TOKENS[h.toLowerCase()]})` : h));
const us = (v) => v.trim().replace(/\s+/g, '_');
const px = (v) => v.trim();

function classes(st) {
  const c = [];
  const flex = st.display === 'flex';
  if (flex) c.push('flex');
  if (st['flex-direction'] === 'column') c.push('flex-col');
  const ai = { center: 'items-center', 'flex-end': 'items-end', 'flex-start': '', stretch: 'items-stretch' }[st['align-items']];
  if (ai) c.push(ai);
  const jc = { center: 'justify-center', 'flex-end': 'justify-end', 'space-between': 'justify-between', 'flex-start': '' }[st['justify-content']];
  if (jc) c.push(jc);
  for (const [k, v] of Object.entries(st)) {
    switch (k) {
      case 'display': case 'flex-direction': case 'align-items': case 'justify-content': case 'box-sizing': case 'font-style': case 'font-family': break;
      case 'flex-shrink': if (v === '0') c.push('shrink-0'); break;
      case 'flex': c.push(v === '1 1 0' ? 'flex-1' : `[flex:${us(v)}]`); break;
      case 'gap': if (v !== '0px') c.push(`gap-[${px(v)}]`); break;
      case 'padding': if (v !== '0px') c.push(`p-[${us(v)}]`); break;
      case 'margin': if (v !== '0px') c.push(`[margin:${us(v)}]`); break;
      case 'width': c.push(v === '100%' ? 'w-full' : v === 'fit-content' ? 'w-fit' : `w-[${px(v)}]`); break;
      case 'height': if (v !== 'fit-content') c.push(v === '100%' ? 'h-full' : `h-[${px(v)}]`); break;
      case 'min-width': c.push(`min-w-[${px(v)}]`); break;
      case 'background-color': c.push(`bg-[${col(v)}]`); break;
      case 'border-radius': c.push(`rounded-[${us(v)}]`); break;
      case 'overflow': c.push(v === 'hidden' ? 'overflow-hidden' : `[overflow:${v}]`); break;
      case 'color': c.push(`text-[${col(v)}]`); break;
      case 'font-size': c.push(`text-[${px(v)}]`); break;
      case 'font-weight': c.push(`font-[${v}]`); break;
      case 'line-height': c.push(v === 'normal' ? 'leading-[normal]' : `leading-[${px(v)}]`); break;
      case 'letter-spacing': if (v !== '0px') c.push(`tracking-[${px(v)}]`); break;
      case 'text-align': c.push(`text-${v}`); break;
      case 'white-space': if (v === 'nowrap') c.push('whitespace-nowrap'); else c.push(`[white-space:${v}]`); break;
      case 'outline': c.push(`[outline:${us(col(v))}]`); break;
      case 'outline-offset': c.push(`[outline-offset:${px(v)}]`); break;
      case 'border-width': c.push(`[border-width:${us(v)}]`); break;
      case 'border-style': c.push(`[border-style:${v}]`); break;
      case 'border-color': c.push(`[border-color:${col(v)}]`); break;
      case 'opacity': c.push(`opacity-[${v}]`); break;
      case 'position': c.push(v); break;
      default: c.push(`[${k}:${us(col(v))}]`);
    }
  }
  return c.filter(Boolean).join(' ');
}
const parseStyle = (s = '') => Object.fromEntries(s.split(';').map((x) => x.trim()).filter(Boolean).map((x) => { const i = x.indexOf(':'); return [x.slice(0, i).trim(), x.slice(i + 1).trim()]; }));
const icons = new Set();
const esc = (t) => t.replace(/[{}<>]/g, (m) => `{'${m}'}`);

function jsx(n, d) {
  const pad = '  '.repeat(d);
  if (n.nodeType === 3) { const t = n.text.trim().replace(/\s+/g, ' '); return t ? `${pad}${esc(t)}\n` : ''; }
  const tag = n.rawTagName; if (!tag) return '';
  const st = parseStyle(n.getAttribute('style'));
  const pname = n.getAttribute('data-pencil-name') ?? '';
  const comment = pname ? ` /* ${pname.replace(/\*\//g, '')} */` : '';
  if (tag === 'svg') {
    const ic = n.getAttribute('data-icon-name');
    if (ic) { icons.add(ic); const fill = n.querySelector('path')?.getAttribute('fill') ?? ''; return `${pad}<Icon name="${ic}" className="${classes(st)}" color="${col(fill)}" />${comment ? '{' + comment + '}' : ''}\n`; }
    return `${pad}<svg className="${classes(st)}" />\n`;
  }
  const kids = n.childNodes.map((k) => jsx(k, d + 1)).join('');
  const cls = classes(st);
  if (!kids.trim()) return `${pad}<div className="${cls}" />${comment ? '{' + comment + '}' : ''}\n`;
  return `${pad}<div className="${cls}">${comment ? '{' + comment + '}' : ''}\n${kids}${pad}</div>\n`;
}
let start = root.querySelector('[data-pencil-name]');
if (from) start = root.querySelectorAll('[data-pencil-name]').find((e) => e.getAttribute('data-pencil-name') === from) ?? start;
const body = jsx(start, 2);
const code = `// مُولَّد بالأداة tools/ui-compare/pen2tsx.mjs من pendev/untitled.pen — نقطة بداية فقط، يُعاد تنظيمه وتُربط بياناته.\nimport { Icon } from '@/pen/icon';\n\nexport default function ${name}() {\n  return (\n${body}  );\n}\n`;
if (out) { fs.mkdirSync(out.replace(/\/[^/]+$/, ''), { recursive: true }); fs.writeFileSync(out, code); console.log('wrote', out, '— icons:', [...icons].join(', ')); } else console.log(code);
