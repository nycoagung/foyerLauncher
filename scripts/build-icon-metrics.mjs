import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { openPreview, root } from './browser.mjs';
const svgs = dir => existsSync(root + dir) ? readdirSync(root + dir).filter(n => n.endsWith('.svg')).map(n => n.slice(0, -4)) : [];
// Published marks, then your own TV's marks from scripts/marks-from-tv.mjs (ignored by Git) as local/<id>.
const ids = svgs('app/assets/icons'), local = svgs('app/assets/icons/local').map(id => 'local/' + id);
const preview = await openPreview();
try {
  const page = await preview.browser.newPage();
  await page.goto(preview.baseURL + '/build/dock.html');
  const metrics = await page.evaluate(async ids => {
    const result = {}, size = 240;
    for (const id of ids) {
      const source = await (await fetch('/home/assets/icons/' + id + '.svg')).text();
      const svg = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
      svg.setAttribute('width', size); svg.setAttribute('height', size);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const pixels = context.getImageData(0, 0, size, size).data;
      let left = size, top = size, right = -1, bottom = -1, ink = 0;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const alpha = pixels[(y * size + x) * 4 + 3];
          ink += alpha / 255;
          if (alpha > 40) {
            left = Math.min(left, x); top = Math.min(top, y);
            right = Math.max(right, x); bottom = Math.max(bottom, y);
          }
        }
      }
      if (right < left || bottom < top) throw Error('Empty icon: ' + id);
      const width = right - left + 1, height = bottom - top + 1;
      result[id] = { n: size, x: left, y: top, w: width, h: height, fill: ink / (width * height) };
    }
    return result;
  }, ids.concat(local));
  const published = {}, own = {};
  for (const id of Object.keys(metrics)) (id.startsWith('local/') ? own : published)[id] = metrics[id];
  mkdirSync(root + '.local/materials', { recursive: true });
  writeFileSync(root + '.local/materials/metrics.js', '/* Visible SVG ink measured at build time. */\nwindow.FoyerIconMetrics = ' + JSON.stringify(published) + ';\n');
  console.log('Measured ' + ids.length + ' icons. Output: .local/materials/metrics.js');
  if (local.length) {
    const config = root + '.local/marks-from-tv.json', apps = {};
    for (const m of existsSync(config) ? JSON.parse(readFileSync(config, 'utf8')) : []) if (own['local/' + m.id]) apps[m.pkg] = 'local/' + m.id;
    writeFileSync(root + 'app/assets/icons/local/marks.js', '/* Marks made from this TV\'s apps by scripts/marks-from-tv.mjs. Local only; never published. */\n'
      + 'window.FoyerLocalMarks = ' + JSON.stringify(apps) + ';\n'
      + '(function (m) { var k; for (k in m) window.FoyerIconMetrics[k] = m[k]; }(' + JSON.stringify(own) + '));\n');
    console.log('Measured ' + local.length + ' of your own marks. Output: app/assets/icons/local/marks.js');
  }
} finally { await preview.close(); }
