#!/usr/bin/env node
/**
 * يحوّل HTML المُصدَّر من الـpen إلى شجرة مضغوطة (سطر لكل عنصر) تُستخدم كمواصفة دقيقة للبناء.
 * node tools/ui-compare/spec.mjs file.html [--from "اسم العقدة"] [--depth 8]
 * الرموز: row/col=اتجاه، g=gap، p=padding، w/h=الأبعاد، bg، br=radius، ol=outline(حد)، fs/fw/lh=الخط، ta=text-align، jc/ai=محاذاة
 */
import fs from 'node:fs';
import { parse } from 'node-html-parser';

const file = process.argv[2];
const from = process.argv.includes('--from') ? process.argv[process.argv.indexOf('--from') + 1] : null;
const maxDepth = process.argv.includes('--depth') ? Number(process.argv[process.argv.indexOf('--depth') + 1]) : 99;
const root = parse(fs.readFileSync(file, 'utf8'), { blockTextElements: {} });
const body = root.querySelector('body');

const parseStyle = (s = '') => Object.fromEntries(s.split(';').map((x) => x.trim()).filter(Boolean).map((x) => { const i = x.indexOf(':'); return [x.slice(0, i).trim(), x.slice(i + 1).trim()]; }));
const short = (st) => {
  const o = [];
  const dir = st['flex-direction']; if (st.display === 'flex') o.push(dir === 'column' ? 'col' : 'row');
  const m = { gap: 'g', padding: 'p', width: 'w', height: 'h', 'background-color': 'bg', 'border-radius': 'br', 'font-size': 'fs', 'font-weight': 'fw', 'line-height': 'lh', 'text-align': 'ta', color: 'c', 'justify-content': 'jc', 'align-items': 'ai', outline: 'ol', flex: 'flex', 'overflow': 'ov', 'box-shadow': 'sh', opacity: 'op', 'border-bottom': 'bb', 'border-top': 'bt', 'border-left': 'bl', 'border-right': 'brt', 'min-width': 'minw', 'font-family': 'ff', position: 'pos', left: 'left', top: 'top', right: 'right', bottom: 'bot', 'white-space': 'ws', 'border-width': 'bw', 'border-color': 'bc', margin: 'm', 'text-decoration': 'td', 'text-transform': 'tt', 'object-fit': 'fit', 'background-image': 'bgi', transform: 'tf', 'z-index': 'z' };
  for (const [k, v] of Object.entries(st)) {
    if (!m[k]) continue;
    if (['gap'].includes(k) && v === '0px') continue;
    if (k === 'align-items' && v === 'flex-start') continue;
    if (k === 'justify-content' && v === 'flex-start') continue;
    if (k === 'height' && v === 'fit-content') continue;
    if (k === 'border-width' && v === '0px') continue;
    if (k === 'margin' && v === '0px') continue;
    if (k === 'font-family') { o.push('ff=' + v.split(',')[0]); continue; }
    if (k === 'outline') { o.push('ol=' + v.replace('outline-offset', '')); continue; }
    o.push(`${m[k]}=${v.replace(/\s+/g, ' ')}`);
  }
  return o.join(' ');
};
const lines = [];
const walk = (n, d) => {
  if (d > maxDepth) return;
  if (n.nodeType === 3) return;
  const st = parseStyle(n.getAttribute?.('style'));
  const name = n.getAttribute?.('data-pencil-name');
  const tag = n.rawTagName;
  if (!tag || ['head', 'script', 'style'].includes(tag)) return;
  if (tag === 'path') return;
  const kids = n.childNodes.filter((c) => c.nodeType === 1);
  const text = kids.length === 0 ? n.text.trim().replace(/\s+/g, ' ') : '';
  const icon = n.getAttribute?.('data-icon-name');
  const fill = tag === 'svg' ? (n.querySelector('path')?.getAttribute('fill') ?? '') : '';
  lines.push(`${'  '.repeat(d)}${icon ? `ICON(${icon}${fill ? ' ' + fill : ''}) ${short(st)}` : `${tag === 'div' ? '' : tag + ' '}[${name ?? ''}] ${short(st)}`}${text ? '  ⟦' + text + '⟧' : ''}`);
  for (const c of kids) walk(c, d + 1);
};
let start = body;
if (from) { start = body.querySelectorAll('[data-pencil-name]').find((e) => e.getAttribute('data-pencil-name') === from) ?? body; }
walk(start, 0);
console.log(lines.join('\n'));
