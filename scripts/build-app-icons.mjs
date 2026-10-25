// Draws FoyerLauncher's app icons in the Windows-HQ colours shared with FlickrSyncr: a blue (#007EEE) open
// doorway on a white tile, and for the Android TV banner that tile on deep navy with the name.
//   npm run build:icons
// Writes app/icon.png (Samsung, 256 px), android/res/mipmap-*/ic_launcher.png and
// android/res/drawable-xhdpi/banner.png (the tile in the TV's apps row, 320 x 180).
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { root } from './browser.mjs';

const BLUE = '#007EEE', NAVY = '#162143', NAVY_LIGHT = '#202F5B', MIST = '#AEC6FF', WHITE = '#FCFDFD';
// An open doorway on a 192 grid: the frame, and the door swung open on its left hinge with a knob.
const MARK = `<path d="M50 156V36h92v120" fill="none" stroke="${BLUE}" stroke-width="22" stroke-linejoin="miter"/>
  <path d="M61 47l46 11v86l-46 12z" fill="${BLUE}"/><circle cx="96" cy="102" r="5" fill="${WHITE}"/>`;
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
