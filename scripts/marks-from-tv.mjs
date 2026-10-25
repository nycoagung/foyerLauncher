// Makes monochrome Home marks, in the launcher's style, for the apps on a TV that have no bundled mark.
// Each APK is pulled over adb and its icon converted: Android vector drawables become SVG paths; a bitmap
// layer keeps only its opaque ink. Part of setup: docs/agent-android-setup-guide.md, stage 7.
//
//   TV_IP=<TV_IP> node scripts/marks-from-tv.mjs --auto     find the TV's apps without a mark and make one each
//   node scripts/marks-from-tv.mjs --remove id,id           drop marks the owner doesn't want
//   TV_IP=<TV_IP> node scripts/marks-from-tv.mjs            remake the marks listed in .local/marks-from-tv.json
//
// --auto takes each app's icon: its monochrome layer (Android 13 themed icons) if it has one, otherwise
// its adaptive-icon foreground. Apps whose icon can't become a clean shape (an old square bitmap icon)
// are skipped and keep their own icon. It adds what it made to .local/marks-from-tv.json, leaving entries
// already there alone, and draws .local/marks-preview.png for the owner to review.
// Marks go to app/assets/icons/local/, which Git ignores: they are that TV's, keep their owners' rights
// and are never published. Then run build-icon-metrics.mjs, which writes local/marks.js, and
// npm run build:android, which adds them to the build.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { chromium } from 'playwright';
import { root } from './browser.mjs';

const args = process.argv.slice(2), AUTO = args.includes('--auto');
const REMOVE = (args.find(a => a.startsWith('--remove')) === '--remove' ? args[args.indexOf('--remove') + 1] : (args.find(a => a.startsWith('--remove=')) || '').slice(9)) || '';
// Resource names, not file names: shrunk apps rename their files between versions.
const CONFIG = root + '.local/marks-from-tv.json';
const work = root + '.local/apks/', out = root + 'app/assets/icons/local/';
let MARKS = existsSync(CONFIG) ? JSON.parse(readFileSync(CONFIG, 'utf8')) : [];
for (const m of MARKS) if (!/^[a-z0-9-]+$/.test(m.id || '') || !m.pkg || !m.res) throw Error('Each mark needs a lower-case id, pkg and res: ' + JSON.stringify(m));
const save = () => { mkdirSync(root + '.local', { recursive: true }); writeFileSync(CONFIG, JSON.stringify(MARKS, null, 2) + '\n'); };

if (REMOVE) {
  for (const id of REMOVE.split(',').map(s => s.trim()).filter(Boolean)) {
    if (!/^[a-z0-9-]+$/.test(id)) { console.log('Not a mark id: ' + id); continue; }
    const before = MARKS.length;
    MARKS = MARKS.filter(m => m.id !== id);
    rmSync(out + id + '.svg', { force: true });
    console.log(before === MARKS.length ? 'No mark ' + id : 'Removed ' + id);
  }
  save();
  console.log('Now run: node scripts/build-icon-metrics.mjs');
  process.exit(0);
}
const stop = message => { console.error(message); process.exit(1); };
if (!AUTO && !MARKS.length) stop('Run with --auto to make marks for this TV\'s apps, or list them in .local/marks-from-tv.json.');
const TV = process.env.TV_SERIAL || (process.env.TV_IP ? (process.env.TV_IP.includes(':') ? process.env.TV_IP : process.env.TV_IP + ':5555') : '');
if (!TV) stop('Set TV_IP to the TV\'s address, or TV_SERIAL to an adb serial.');
const AAPT2 = (process.env.ANDROID_HOME || homedir() + '/Library/Android/sdk') + '/build-tools/' + (process.env.BUILD_TOOLS || '35.0.0') + '/aapt2';
if (!existsSync(AAPT2)) stop('aapt2 not found at ' + AAPT2 + '. Install Android build-tools 35.0.0 or set ANDROID_HOME.');
const CAPS = ['butt', 'round', 'square'], JOINS = ['miter', 'round', 'bevel'];
const run = (cmd, args, encoding = 'utf8') => execFileSync(cmd, args, { encoding, maxBuffer: 512 << 20 });
const xml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// pull <package>: its APKs, base first. Split APKs keep bitmaps in their density splits.
function pull(pkg) {
  const remotes = run('adb', ['-s', TV, 'shell', 'pm', 'path', pkg]).split('\n').map(l => l.replace('package:', '').trim()).filter(Boolean)
    .sort((a, b) => (b.endsWith('/base.apk') ? 1 : 0) - (a.endsWith('/base.apk') ? 1 : 0));
  if (!remotes.length) throw Error(pkg + ' is not installed on ' + TV);
  return remotes.map((remote, i) => {
    const file = work + pkg + (i ? '.' + i : '') + '.apk';
    execFileSync('adb', ['-s', TV, 'pull', remote, file], { stdio: 'ignore' });
    return file;
  });
}
// The bytes of a file in any of the APKs.
function unzipAny(apks, path) {
  for (const apk of apks) { try { return run('unzip', ['-p', apk, path], 'buffer'); } catch { /* next split */ } }
  throw Error('No ' + path + ' in the APKs');
}

// The vector if there is one, otherwise the densest bitmap, for a resource by name (drawable/x) or id (@0x7f...).
const dumps = {};
function resourceFile(apk, name) {
  const lines = dumps[apk] = dumps[apk] || run(AAPT2, ['dump', 'resources', apk]).split('\n'), files = [];
  const id = name.startsWith('@0x') ? name.slice(1) : '';
  const start = lines.findIndex(l => /^\s+resource 0x[0-9a-f]+ /.test(l) && (id ? l.trim().split(/\s+/)[1] === id : l.trim().split(/\s+/)[2] === name));
  if (start < 0) throw Error('No resource ' + name + ' in ' + apk);
  files.name = lines[start].trim().split(/\s+/)[2];
  for (let i = start + 1; i < lines.length && !/^\s+(resource 0x|type )/.test(lines[i]); i++) {
    const m = lines[i].match(/\(file\) (\S+) type=(\w+)/);
    if (m) files.push({ path: m[1], type: m[2] });
  }
  const file = files.find(f => f.type === 'XML') || files.at(-1);
  if (!file) throw Error('No file for ' + name);
  return { ...file, name: files.name };
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
    if (a.scaleX || a.scaleY) t.push('scale(' + (+a.scaleX || 1) + ' ' + (+a.scaleY || 1) + ')');
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

// The resource name (mipmap/ic_launcher) whose files include an APK path (res/mipmap-anydpi-v26/ic_launcher.xml).
function resourceName(apk, path) {
  const lines = dumps[apk] = dumps[apk] || run(AAPT2, ['dump', 'resources', apk]).split('\n');
  const at = lines.findIndex(l => l.includes('(file) ' + path + ' '));
  if (at < 0) throw Error('No resource for ' + path);
  for (let i = at; i >= 0; i--) if (/^\s+resource 0x[0-9a-f]+ /.test(lines[i])) return lines[i].trim().split(/\s+/)[2];
  throw Error('No resource for ' + path);
}
// From an icon drawable to the layer to use: a vector or a bitmap, following adaptive-icon, inset and bitmap XML.
function layer(apk, res, depth = 0) {
  const file = resourceFile(apk, res);
  if (file.type !== 'XML') return { ...file, res: file.name };
  const tree = xmlTree(apk, file.path);
  if (tree.tag === 'vector') return { ...file, res: file.name, tree };
  if (depth > 4) throw Error('Icon nests too deeply');
  if (tree.tag === 'adaptive-icon') {
    const part = tree.kids.find(k => k.tag === 'monochrome') || tree.kids.find(k => k.tag === 'foreground');
    if (!part) throw Error('Adaptive icon without a foreground');
    // The layer's own drawable, or the first one inside it (an inline inset or layer-list).
    const find = n => n.attrs.drawable || n.attrs.src || n.kids.map(find).find(Boolean);
    const ref = find(part);
    if (ref) return { ...layer(apk, ref, depth + 1), from: part.tag };
    throw Error('Unsupported ' + part.tag + ' layer');
  }
  if ((tree.tag === 'inset' || tree.tag === 'bitmap' || tree.tag === 'layer-list') && (tree.attrs.drawable || tree.attrs.src || (tree.kids[0] && tree.kids[0].attrs.drawable)))
    return layer(apk, tree.attrs.drawable || tree.attrs.src || tree.kids[0].attrs.drawable, depth + 1);
  throw Error('Unsupported icon drawable ' + tree.tag);
}
async function markFor(apks, res, title) {
  const l = layer(apks[0], res);
  if (l.tree) return { svg: vectorSvg(l.tree, title), l };
  browser = browser || await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try { return { svg: await bitmapSvg(page, unzipAny(apks, l.path), title), l }; } finally { await page.close(); }
}
// A mark is usable when its ink is a shape, not a square tile filling the canvas (an old bitmap icon).
async function usable(svg) {
  browser = browser || await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const r = await page.evaluate(async src => {
    const img = new Image(); img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(src))); await img.decode();
    const n = 128, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'); g.drawImage(img, 0, 0, n, n);
    const p = g.getImageData(0, 0, n, n).data; let ink = 0, l = n, t = n, r = -1, b = -1;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const a = p[(y * n + x) * 4 + 3] / 255; ink += a; if (a > .15) { l = Math.min(l, x); t = Math.min(t, y); r = Math.max(r, x); b = Math.max(b, y); } }
    return { empty: r < 0, fill: r < 0 ? 0 : ink / ((r - l + 1) * (b - t + 1)), span: r < 0 ? 0 : Math.min(r - l + 1, b - t + 1) / n };
  }, svg);
  await page.close();
  return !r.empty && !(r.fill > .85 && r.span > .8);
}

// The apps a home screen shows: TV apps, and other launchable apps that aren't part of the system.
function homeApps() {
  const q = cat => run('adb', ['-s', TV, 'shell', 'cmd', 'package', 'query-activities', '--brief', '-a', 'android.intent.action.MAIN', '-c', cat])
    .split('\n').map(l => l.trim()).filter(l => /^[\w.]+\/[\w.$]+$/.test(l)).map(l => l.split('/')[0]);
  const third = new Set(run('adb', ['-s', TV, 'shell', 'pm', 'list', 'packages', '-3']).split('\n').map(l => l.replace('package:', '').trim()));
  return [...new Set(q('android.intent.category.LEANBACK_LAUNCHER').concat(q('android.intent.category.LAUNCHER').filter(p => third.has(p))))];
}
// Packages the launcher already has a mark for: the Android adapter's table, its Apple TV pattern and
// whichever app shows the TV's channels (the bundled Live TV mark).
function bundled() {
  const src = readFileSync(root + 'app/device-android.js', 'utf8');
  const pkgs = new Set([...src.matchAll(/'([a-z][\w]*(?:\.[\w]+)+)':\s*'[a-z]+'/g)].map(m => m[1]).concat([...src.matchAll(/appId:\s*'([^']+)'/g)].map(m => m[1])));
  const tv = run('adb', ['-s', TV, 'shell', 'cmd', 'package', 'resolve-activity', '--brief', '-a', 'android.intent.action.VIEW', '-t', 'vnd.android.cursor.item/channel']).trim().split('\n').pop();
  if (/^[\w.]+\//.test(tv)) pkgs.add(tv.split('/')[0]);
  return p => pkgs.has(p) || /^com\.apple\.atve\.[a-z.]*appletv$/.test(p) || p === 'io.github.nycoagung.foyerlauncher';
}
// Logo resources an app ships besides its launcher icon, most likely first; splash-screen logos last.
function logos(apk) {
  const lines = dumps[apk] = dumps[apk] || run(AAPT2, ['dump', 'resources', apk]).split('\n');
  const names = lines.map(l => (l.match(/^\s+resource 0x[0-9a-f]+ ((?:drawable|mipmap)\/[a-z0-9_]*logo[a-z0-9_]*)$/) || [])[1]).filter(Boolean);
  const score = n => (/\/app_logo$/.test(n) ? 0 : /\/logo$/.test(n) ? 1 : /splash/.test(n) ? 9 : 5) * 100 + n.length;
  return [...new Set(names)].sort((a, b) => score(a) - score(b)).slice(0, 6);
}
function idFor(pkg, taken) {
  let id = pkg.toLowerCase().replace(/^(com|org|net|tv|au\.com|uk\.co|de|io)\./, '').replace(/^(google\.android\.|android\.)/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  for (let i = 2; taken.has(id); i++) id = id.replace(/-\d+$/, '') + '-' + i;
  taken.add(id);
  return id;
}

async function preview(marks) {
  browser = browser || await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 960, height: 120 + Math.ceil(marks.length / 6) * 150 } });
  const cells = marks.map(m => `<div style="width:140px;text-align:center;font:13px/1.3 sans-serif;color:#AEC6FF"><div style="width:96px;height:96px;margin:0 auto 8px;border-radius:20px;background:#202F5B;display:flex;align-items:center;justify-content:center"><img src="data:image/svg+xml;base64,${Buffer.from(readFileSync(out + m.id + '.svg')).toString('base64')}" style="max-width:60px;max-height:60px"></div><b style="color:#fff">${xml(m.title)}</b><br>${m.id}</div>`).join('');
  await page.setContent(`<body style="margin:0;padding:24px;background:#162143;font-family:sans-serif"><div style="color:#fff;font-size:18px;margin-bottom:16px">Marks made from this TV's apps (${marks.length})</div><div style="display:flex;flex-wrap:wrap;gap:16px">${cells}</div></body>`);
  await page.screenshot({ path: root + '.local/marks-preview.png', fullPage: true });
}

mkdirSync(work, { recursive: true });
mkdirSync(out, { recursive: true });
let browser;
try {
  if (AUTO) {
    const has = bundled(), listed = new Set(MARKS.map(m => m.pkg)), taken = new Set(MARKS.map(m => m.id)), made = [], skipped = [];
    for (const pkg of homeApps().filter(p => !has(p) && !listed.has(p)).sort()) {
      try {
        const apks = pull(pkg), badging = run(AAPT2, ['dump', 'badging', apks[0]]);
        const icon = (badging.match(/^application: .*?icon='([^']+)'/m) || [])[1];
        const title = ((badging.match(/^application-label:'([^']*)'/m) || badging.match(/^application: label='([^']*)'/m) || [])[1] || pkg).slice(0, 60);
        if (!icon) throw Error('no icon');
        // The launcher icon first; if that is a solid tile, a logo the app ships (app_logo, logo...).
        let found = null, why = 'no usable icon';
        for (const [i, res] of [resourceName(apks[0], icon)].concat(logos(apks[0])).entries()) {
          try {
            const tried = await markFor(apks, res, title);
            if (!i) tried.l.from = tried.l.from || 'icon'; else tried.l.from = 'logo (' + res + ')';
            if (await usable(tried.svg)) { found = tried; break; }
            why = 'its icon is a solid tile, so it keeps its own icon';
          } catch (e) { why = e.message.split('\n')[0]; }
        }
        if (!found) throw Error(why);
        const { svg, l } = found;
        const m = { id: idFor(pkg, taken), title, pkg, res: l.res, source: 'auto, ' + (l.from || 'icon') };
        writeFileSync(out + m.id + '.svg', svg);
        MARKS.push(m); made.push(m);
        console.log('  ok ' + title + ' (' + pkg + '): local/' + m.id + '.svg from its ' + (l.from || 'icon'));
      } catch (e) { skipped.push(pkg); console.log('  -  ' + pkg + ': ' + e.message.split('\n')[0]); }
      // The packages can be large; only the marks are kept.
      finally { for (const f of readdirSync(work)) if (f.startsWith(pkg + '.')) rmSync(work + f, { force: true }); }
    }
    save();
    if (MARKS.length) await preview(MARKS);
    console.log('Made ' + made.length + ', skipped ' + skipped.length + '. Review .local/marks-preview.png; drop any with --remove <id,id>.');
    console.log('Then run: node scripts/build-icon-metrics.mjs && npm run build:android');
  } else {
    for (const mark of MARKS) {
      const apks = pull(mark.pkg), { svg, l } = await markFor(apks, mark.res, mark.title);
      for (const f of apks) rmSync(f, { force: true });
      writeFileSync(out + mark.id + '.svg', svg);
      console.log('local/' + mark.id + '.svg from ' + mark.pkg + ' ' + mark.res + ' (' + l.path + ', ' + l.type + ')');
    }
    await preview(MARKS);
  }
} finally { if (browser) await browser.close(); }
