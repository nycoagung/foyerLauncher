// Draws FoyerLauncher's app icons, Material style (flat geometric shapes on Material's 192 grid, one corner
// radius family), in the Windows-HQ colours shared with FlickrSyncr: a TV whose thick left and top bezels
// and a bar into the screen form a blue (#007EEE) letter F, the rest of the TV in light blue, on a white
// tile. The Android TV banner puts that tile on deep navy with the name.
//   npm run build:icons
// Writes app/icon.png (Samsung, 256 px), android/res/mipmap-*/ic_launcher.png and
// android/res/drawable-xhdpi/banner.png (the tile in the TV's apps row, 320 x 180).
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { root } from './browser.mjs';

const BLUE = '#007EEE', NAVY = '#162143', NAVY_LIGHT = '#202F5B', MIST = '#AEC6FF', WHITE = '#FCFDFD';
// On a 192 grid, one stroke weight (24): the TV body (light blue); the F (blue) as its top bezel, its left bezel
// running on below the TV, and an arm into the screen that stops short of the edge so it can't read as a P;
// the screen (white); and the stand, apart from the stem so the F doesn't become an E.
const MARK = `<rect x="24" y="36" width="144" height="106" rx="20" fill="${MIST}"/>
  <path d="M44 36H148a20 20 0 0 1 20 20v4H48v104H36a12 12 0 0 1-12-12V56a20 20 0 0 1 20-20z" fill="${BLUE}"/>
  <rect x="48" y="60" width="106" height="68" rx="6" fill="${WHITE}"/>
  <rect x="40" y="86" width="76" height="24" rx="12" fill="${BLUE}"/>
  <rect x="78" y="152" width="52" height="12" rx="6" fill="${MIST}"/>`;
const tile = (size, radius) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="${radius}" fill="${WHITE}"/>${MARK}</svg>`;
const font = readFileSync(root + 'app/assets/manrope.woff2').toString('base64');

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
async function draw(file, width, height, html) {
  await page.setViewportSize({ width, height });
  await page.setContent(`<style>@font-face{font-family:M;src:url(data:font/woff2;base64,${font})}html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:transparent}</style>${html}`);
  await page.evaluate(() => document.fonts.ready);
  mkdirSync(file.slice(0, file.lastIndexOf('/')), { recursive: true });
  await page.screenshot({ path: file, omitBackground: true });
}
// Samsung: a square tile; the TV rounds it. Android: the launcher icon at each density.
await draw(root + 'app/icon.png', 256, 256, tile(256, 0));
for (const [density, size] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
  await draw(root + `android/res/mipmap-${density}/ic_launcher.png`, size, size, tile(size, 36));
}
// The Android TV banner, like FlickrSyncr's store graphic: navy, the white tile, the name and a line.
await draw(root + 'android/res/drawable-xhdpi/banner.png', 320, 180, `<div style="width:320px;height:180px;display:flex;align-items:center;gap:16px;padding:0 20px;box-sizing:border-box;
  background:radial-gradient(circle at 85% 90%, ${NAVY_LIGHT}, ${NAVY} 70%)">${tile(84, 18)}<div style="font-family:M">
  <div style="font-weight:700;font-size:25px;line-height:30px;color:#fff;letter-spacing:-.4px">FoyerLauncher</div>
  <div style="font-weight:500;font-size:14px;line-height:20px;color:${MIST}">A calm home screen</div></div></div>`);
await browser.close();
console.log('Wrote app/icon.png, android/res/mipmap-*/ic_launcher.png and android/res/drawable-xhdpi/banner.png');
