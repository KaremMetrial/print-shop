#!/usr/bin/env node
/** يقصّ منطقة من صورتي المرجع والفعلي ويكبّرها بجوار بعض: node crop.mjs --name dashboard --x 1180 --y 270 --w 260 --h 60 [--scale 4] */
import fs from 'node:fs';
import { PNG } from 'pngjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const ref = arg('ref'); const name = arg('name'); const [x, y, w, h, s] = ['x', 'y', 'w', 'h'].map((k) => Number(arg(k))).concat(Number(arg('scale', '4')));
const A = PNG.sync.read(fs.readFileSync(ref)); const B = PNG.sync.read(fs.readFileSync(`storage/ui-diff/${name}.actual.png`));
const out = new PNG({ width: w * s, height: h * s * 2 + 8, fill: true });
for (let i = 0; i < out.data.length; i += 4) { out.data[i] = 255; out.data[i + 1] = 0; out.data[i + 2] = 255; out.data[i + 3] = 255; }
const put = (img, oy) => { for (let yy = 0; yy < h * s; yy++) for (let xx = 0; xx < w * s; xx++) { const sx = x + Math.floor(xx / s); const sy = y + Math.floor(yy / s); if (sx >= img.width || sy >= img.height) continue; const si = (sy * img.width + sx) * 4; const di = ((oy + yy) * out.width + xx) * 4; out.data[di] = img.data[si]; out.data[di + 1] = img.data[si + 1]; out.data[di + 2] = img.data[si + 2]; out.data[di + 3] = 255; } };
put(A, 0); put(B, h * s + 8);
fs.writeFileSync(`storage/ui-diff/${name}.crop.png`, PNG.sync.write(out)); console.log('crop ok (فوق: المرجع، تحت: الفعلي)');
