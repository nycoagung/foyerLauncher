// Development only. Makes monochrome Home marks for Android TV apps that have no published mark, from
// the apps installed on your TV. Each APK is pulled over adb and its named icon resource converted:
// Android vector drawables become SVG paths; a bitmap layer keeps only its opaque ink.
//
// List the apps in .local/marks-from-tv.json, for example
//   [{ "id": "playgames", "title": "Play Games", "pkg": "com.google.android.play.games",
//      "res": "drawable/ic_google_play_games_monochrome_launcher_icon" }]
// then run   TV_IP=<TV_IP> node scripts/marks-from-tv.mjs   (or TV_SERIAL=<adb serial>).
// Marks go to app/assets/icons/local/, which Git ignores: they are your own TV's, keep their owners'
// rights and are never published. Review them, then run build-icon-metrics.mjs, which writes
// local/marks.js. android/build.sh adds them to your own build.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { chromium } from 'playwright';
import { root } from './browser.mjs';

// Resource names, not file names: shrunk apps rename their files between versions.
const CONFIG = root + '.local/marks-from-tv.json';
if (!existsSync(CONFIG)) throw Error('List the apps to make marks for in .local/marks-from-tv.json (see the top of this script).');
const MARKS = JSON.parse(readFileSync(CONFIG, 'utf8'));
for (const m of MARKS) if (!/^[a-z0-9-]+$/.test(m.id || '') || !m.pkg || !m.res) throw Error('Each mark needs a lower-case id, pkg and res: ' + JSON.stringify(m));
const TV = process.env.TV_SERIAL || (process.env.TV_IP ? (process.env.TV_IP.includes(':') ? process.env.TV_IP : process.env.TV_IP + ':5555') : '');
if (!TV) throw Error('Set TV_IP to the TV\'s address, or TV_SERIAL to an adb serial.');
const AAPT2 = (process.env.ANDROID_HOME || homedir() + '/Library/Android/sdk') + '/build-tools/' + (process.env.BUILD_TOOLS || '35.0.0') + '/aapt2';
const work = root + '.local/apks/', out = root + 'app/assets/icons/local/';
const CAPS = ['butt', 'round', 'square'], JOINS = ['miter', 'round', 'bevel'];
const run = (cmd, args, encoding = 'utf8') => execFileSync(cmd, args, { encoding, maxBuffer: 512 << 20 });
const xml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function pull(pkg) {
  const file = work + pkg + '.apk', remote = run('adb', ['-s', TV, 'shell', 'pm', 'path', pkg]).split('\n')[0].replace('package:', '').trim();
  if (!remote) throw Error(pkg + ' is not installed on ' + TV);
  run('adb', ['-s', TV, 'pull', remote, file]);
  return file;
}

// The vector if there is one, otherwise the densest bitmap.
function resourceFile(apk, name) {
  const lines = run(AAPT2, ['dump', 'resources', apk]).split('\n'), files = [];
  const start = lines.findIndex(l => /^\s+resource 0x[0-9a-f]+ /.test(l) && l.trim().split(/\s+/)[2] === name);
  if (start < 0) throw Error('No resource ' + name + ' in ' + apk);
  for (let i = start + 1; i < lines.length && !/^\s+(resource 0x|type )/.test(lines[i]); i++) {
    const m = lines[i].match(/\(file\) (\S+) type=(\w+)/);
    if (m) files.push({ path: m[1], type: m[2] });
  }
  return files.find(f => f.type === 'XML') || files.at(-1);
}

// aapt2's indented xmltree dump as { tag, attrs, kids }.
function xmlTree(apk, file) {
  const top = { kids: [] }, stack = [{ depth: -1, node: top }];
  for (const line of run(AAPT2, ['dump', 'xmltree', apk, '--file', file]).split('\n')) {
    const depth = line.search(/\S/), text = line.trim();
    let m;
    if ((m = text.match(/^E: (\S+)/))) {
      while (stack.at(-1).depth >= depth) stack.pop();
      const node = { tag: m[1], attrs: {}, kids: [] };
      stack.at(-1).node.kids.push(node); stack.push({ depth, node });
    } else if ((m = text.match(/^A: (?:[^=]*:)?([A-Za-z]+)(?:\(0x[0-9a-f]+\))?=(.*)$/))) {
      const quoted = m[2].match(/^"([^"]*)"/);
      stack.at(-1).node.attrs[m[1]] = quoted ? quoted[1] : m[2].split(' ')[0];
    }
  }
  return top.kids[0];
}

const visible = color => !!color && !/^#00[0-9a-f]{6}$/i.test(color);
function svgNode(n) {
  const a = n.attrs;
  if (n.tag === 'group') {
    const px = +a.pivotX || 0, py = +a.pivotY || 0, t = [];
    if (a.translateX || a.translateY || px || py) t.push('translate(' + ((+a.translateX || 0) + px) + ' ' + ((+a.translateY || 0) + py) + ')');
    if (a.rotation) t.push('rotate(' + +a.rotation + ')');
    if (a.scaleX || a.scaleY) t.push('scale(' + (a.scaleX || 1) + ' ' + (a.scaleY || 1) + ')');
    if (px || py) t.push('translate(' + -px + ' ' + -py + ')');
    return '<g' + (t.length ? ' transform="' + t.join(' ') + '"' : '') + '>' + n.kids.map(svgNode).join('') + '</g>';
  }
  if (n.tag !== 'path' || !a.pathData) return ''; // clip-paths here only cover the whole viewport
  let s = '';
  if (visible(a.fillColor)) s += '<path d="' + xml(a.pathData) + '"' + (a.fillType === '1' ? ' fill-rule="evenodd"' : '') + '/>';
  if (visible(a.strokeColor) && +a.strokeWidth > 0) s += '<path d="' + xml(a.pathData) + '" fill="none" stroke="#ffffff" stroke-width="' + a.strokeWidth
    + '" stroke-linecap="' + (CAPS[+a.strokeLineCap] || 'butt') + '" stroke-linejoin="' + (JOINS[+a.strokeLineJoin] || 'miter') + '"/>';
  return s;
}
function vectorSvg(tree, title) {
  if (tree.tag !== 'vector') throw Error('Expected a vector drawable, found ' + tree.tag);
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + +tree.attrs.viewportWidth + ' ' + +tree.attrs.viewportHeight + '" fill="#ffffff"><title>' + xml(title) + '</title>'
    + tree.kids.map(svgNode).join('') + '</svg>\n';
}

// Keep the near-opaque ink of a bitmap layer, cropped; soft shadows and glows drop out.
async function bitmapSvg(page, png, title) {
  const r = await page.evaluate(async src => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
    let left = c.width, top = c.height, right = -1, bottom = -1;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4, k = Math.max(0, Math.min(1, (p[i + 3] / 255 - .55) / .4));
      p[i] = p[i + 1] = p[i + 2] = 255; p[i + 3] = Math.round(k * 255);
      if (k > .1) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
    }
    if (right < 0) throw Error('No opaque ink');
    g.putImageData(d, 0, 0);
    const w = right - left + 1, h = bottom - top + 1, o = document.createElement('canvas');
    o.width = w; o.height = h; o.getContext('2d').drawImage(c, left, top, w, h, 0, 0, w, h);
    return { w, h, src: o.toDataURL('image/png') };
  }, 'data:image/png;base64,' + png.toString('base64'));
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + r.w + ' ' + r.h + '"><title>' + xml(title) + '</title><image width="' + r.w + '" height="' + r.h + '" href="' + r.src + '"/></svg>\n';
}

mkdirSync(work, { recursive: true });
mkdirSync(out, { recursive: true });
let browser;
try {
  for (const mark of MARKS) {
    const apk = pull(mark.pkg), file = resourceFile(apk, mark.res);
    let svg;
    if (file.type === 'XML') svg = vectorSvg(xmlTree(apk, file.path), mark.title);
    else {
      browser = browser || await chromium.launch({ headless: true });
      svg = await bitmapSvg(await browser.newPage(), run('unzip', ['-p', apk, file.path], 'buffer'), mark.title);
    }
    writeFileSync(out + mark.id + '.svg', svg);
    console.log('local/' + mark.id + '.svg from ' + mark.pkg + ' ' + mark.res + ' (' + file.path + ', ' + file.type + ')');
  }
} finally { if (browser) await browser.close(); }
