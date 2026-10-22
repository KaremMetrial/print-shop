#!/usr/bin/env node
// يبحث عن أفضل إزاحة (dx,dy) لكل منطقة أفقية بين المرجع (بعد --skip-top) ولقطة التطبيق: node shift.mjs ref.png actual.png [skipTop]
import fs from 'node:fs'; import { PNG } from 'pngjs';
const [ref, act, skip = '0'] = process.argv.slice(2);
const R = PNG.sync.read(fs.readFileSync(ref)), A = PNG.sync.read(fs.readFileSync(act)); const W = A.width, H = A.height, s = Number(skip);
const g = (P, x, y, off) => { if (x < 0 || y < 0 || x >= P.width || y + off >= P.height) return 255; const i = ((y + off) * P.width + x) * 4; return (P.data[i] + P.data[i + 1] + P.data[i + 2]) / 3; };
const step = 60;
for (let y0 = 0; y0 < H; y0 += step) {
  const res = [];
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { let c = 0; for (let y = y0; y < Math.min(H, y0 + step); y++) for (let x = 0; x < W; x++) if (Math.abs(g(R, x, y, s) - g(A, x - dx, y - dy, 0)) > 40) c++; res.push([c, dx, dy]); }
  res.sort((a, b) => a[0] - b[0]); const zero = res.find((r) => r[1] === 0 && r[2] === 0);
  console.log(`y=${y0}: صفر=${zero[0]} أفضل=${res[0][0]} (dx=${res[0][1]}, dy=${res[0][2]})`);
}
