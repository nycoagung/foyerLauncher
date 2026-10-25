// Android TV adapter checks. Mock only the shell's window.FoyerAndroid bridge; never contact a TV.
import { mkdirSync, writeFileSync } from 'node:fs';
import { openPreview, root } from './browser.mjs';

const KEY = 'foyer.home.v1';
// Installed here: Live TV, YouTube, Netflix, Kodi and VLC, so Home starts with those, in the adapter's order.
const PRIMARY = ['tv', 'youtube', 'netflix', 'kodi', 'vlc'];
const PREVIEW_PRIMARY = ['tv', 'youtube', 'netflix', 'primevideo', 'disneyplus', 'kodi', 'vlc'];
const LIVE_TV = 'com.example.livetv';
const UNSAFE = 'Console <img src=x onerror="window.__inputXss=1">';
const CATALOG = [
  { appId: LIVE_TV, name: 'TV', icon: '' },
  { appId: 'com.google.android.youtube.tv', name: 'YouTube', icon: '' },
  { appId: 'org.xbmc.kodi', name: 'Kodi', icon: '' },
  { appId: 'org.videolan.vlc', name: 'VLC', icon: '' },
  { appId: 'com.netflix.ninja', name: 'Netflix', icon: '' },
  { appId: 'com.example.family', name: 'Family TV', icon: '/home/assets/icons/sbs.svg' }
];
// Other apps with a bundled mark. Apple TV has a package for each TV maker; any of them gets the mark.
const MARKED = { 'com.android.vending': 'googleplay', 'com.google.android.youtube.tvmusic': 'youtubemusic', 'com.spotify.tv.android': 'spotify',
  'com.apple.atve.example.appletv': 'appletv' };
CATALOG.push(...Object.keys(MARKED).map(appId => ({ appId, name: MARKED[appId], icon: '' })));
const WEATHER = { ok: true, value: { temp: 18.4, code: 2, day: true, place: 'Sydney' } };
// Three prepared Google ambient photos, served from bundled wallpapers in place of the TV's files.
const G = ['g-00000000000000a1', 'g-00000000000000a2', 'g-00000000000000a3'];
const AMBIENT = { ok: true, value: [{ id: G[0], name: 'Ansel A', tone: 'light', tr: 'mist', br: 'light' }, { id: G[1], name: 'Berenice B', tone: 'dark', tr: 'light', br: 'dark' }, { id: G[2], name: 'Cindy C', tone: 'light', tr: 'nonsense', br: 'mist' }] };
const AMBIENT_FILES = { [G[0]]: 'cove', [G[1]]: 'forest', [G[2]]: 'valley' };
const INPUTS = [{ id: 'pkg/.Service/HW2', name: 'HDMI 1' }, { id: 'pkg/.Service/HW3', name: UNSAFE }];
const out = root + '.local/qa/';
mkdirSync(out, { recursive: true });
const report = { scope: 'Production UI in Chromium; mock Android bridge only; no TV contacted.', checks: [], failures: [], pageErrors: [] };
let preview, current, section = '';

function check(name, pass, detail) {
  const result = { section, name, passed: !!pass, ...(pass ? {} : { detail }) };
  report.checks.push(result);
  if (!pass) { report.failures.push(result); throw Error(name + (detail ? ': ' + JSON.stringify(detail).slice(0, 500) : '')); }
}
async function run(name, fn) {
  section = name;
  try { await fn(); console.log(name + ': passed'); }
  catch (error) { if (!report.failures.some(f => f.section === name)) report.failures.push({ section: name, error: error.stack }); console.error(name + ': ' + error.message); }
  finally { await closePage(); }
}
async function closePage() { if (current) { await current.close(); current = null; } }

function installBridge({ catalog, inputs, weather, ambient, ambientDelay, platform, tvApp, localMarks }) {
  const reply = value => JSON.stringify({ ok: true, value });
  window.__android = { calls: [], fail: false, weather, ambient, ambientCalls: [] };
  const record = (method, arg) => {
    window.__android.calls.push({ method, arg });
    return window.__android.fail ? JSON.stringify({ ok: false, error: 'Unavailable for QA' }) : reply(null);
  };
  // Set by android/build.sh's local/marks.js when the owner made marks from their own TV's apps.
  if (localMarks) window.FoyerLocalMarks = localMarks;
  window.FoyerAndroid = {
    device: packages => reply({ platform, tvApp, installed: JSON.parse(packages).filter(p => catalog.some(a => a.appId === p)) }),
    apps: () => reply(catalog),
    inputs: () => reply(inputs),
    launch: id => record('launch', id),
    openInput: id => record('openInput', id),
    systemHome: () => record('systemHome'),
    settings: () => record('settings'),
    // Like the shell: answer later, through the page's reply hook.
    weather: id => setTimeout(() => window.FoyerAndroidReply(id, JSON.stringify(window.__android.weather)), 0),
    // Like the shell's stream: the photo after `current` (cycling, for repeatable checks), keeping only
    // the current and new photos, which survive reloads of this page like the TV's cache.
    ambientList: () => reply(JSON.parse(sessionStorage.getItem('__ambient') || '[]')),
    ambient: (id, current) => {
      window.__android.ambientCalls.push(current);
      setTimeout(() => {
        const a = window.__android.ambient;
        if (!a.ok) { window.FoyerAndroidReply(id, JSON.stringify(a)); return; }
        const i = a.value.findIndex(p => p.id === current), photo = a.value[(i + 1) % a.value.length];
        const ready = a.value.filter(p => p.id === current).concat([photo]);
        sessionStorage.setItem('__ambient', JSON.stringify(ready));
        window.FoyerAndroidReply(id, JSON.stringify({ ok: true, value: { photo, ready } }));
      }, ambientDelay);
    }
  };
}
async function page({ bridge = true, query = '', weather = WEATHER, addressBlocked = false, seed = null, ambient = AMBIENT, ambientDelay = 50,
  catalog = CATALOG, platform = 'Google TV', tvApp = LIVE_TV, localMarks = null } = {}) {
  current = await preview.browser.newPage({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Australia/Sydney' });
  current.setDefaultTimeout(10000);
  current.__forecasts = [];
  if (seed) await current.addInitScript(([key, value]) => {
    if (!sessionStorage.getItem('__seeded')) { localStorage.setItem(key, value); sessionStorage.setItem('__seeded', '1'); }
  }, [KEY, JSON.stringify(seed)]);
  current.on('pageerror', error => report.pageErrors.push({ section, error: error.message }));
  current.on('response', response => { if (response.status() >= 400) report.pageErrors.push({ section, status: response.status(), url: response.url() }); });
  // The browser preview asks these services itself; answer locally so checks never leave this Mac.
  await current.route('https://ipwho.is/**', route => addressBlocked ? route.abort('namenotresolved')
    : route.fulfill({ json: { success: true, city: 'Preview City', latitude: -33.87, longitude: 151.21 } }));
  await current.route('https://geocoding-api.open-meteo.com/**', route => route.fulfill({ json: { results: [
    { name: 'Sydney', latitude: 46.14, longitude: -60.18, timezone: 'America/Glace_Bay' },
    { name: 'Sydney', latitude: -33.87, longitude: 151.21, timezone: 'Australia/Sydney' }] } }));
  const owner = current;
  await current.route('https://api.open-meteo.com/**', route => { owner.__forecasts.push(route.request().url()); route.fulfill({ json: { current: { temperature_2m: 21.6, weather_code: 0, is_day: 1 } } }); });
  await current.route(/\/ambient\/g-[0-9a-f]{16}/, route => {
    const m = new URL(route.request().url()).pathname.match(/(g-[0-9a-f]{16})(.*)$/), name = AMBIENT_FILES[m[1]], suffix = m[2];
    route.fulfill({ path: root + 'app/assets/' + (/^(\.jpg|-thumb\.jpg|-panel\.jpg)$/.test(suffix) ? 'wallpapers/' : 'materials/') + name + suffix });
  });
  await current.route(/\/home\/assets\/icons\/local\/[a-z0-9-]+\.svg$/, route => route.fulfill({ path: root + 'app/assets/icons/tubi.svg' }));
  if (bridge) await current.addInitScript(installBridge, { catalog, inputs: INPUTS, weather, ambient, ambientDelay, platform, tvApp, localMarks });
  await current.goto(preview.baseURL + '/home/' + query);
  await current.waitForFunction(() => window.FoyerQA && FoyerQA.ready && FoyerQA.ready(), null, { timeout: 15000 });
}
const state = () => current.evaluate(() => FoyerQA.state());
const call = (method, ...args) => current.evaluate(([m, a]) => FoyerQA[m](...a), [method, args]);
const nav = (...keys) => call('nav', keys);
async function act(action) { if (!(await call('activate', action))) throw Error('Action unavailable: ' + action); }
const calls = () => current.evaluate(() => window.__android.calls);
const lastCall = () => current.evaluate(() => window.__android.calls.at(-1));
const text = () => current.locator('#stage').innerText();
async function settled(view) { await current.waitForFunction(v => FoyerQA.where().view === v, view); }
async function library() { await call('scene', 'home'); await act('util.apps'); await current.waitForFunction(() => !FoyerQA.state().catalog.loading); }

try {
  preview = await openPreview({ publicFonts: true });
  await run('Defaults and controls', async () => {
    await page();
    check('Home holds the installed Live TV, YouTube, Netflix, Kodi and VLC', JSON.stringify((await state()).dock) === JSON.stringify(PRIMARY), (await state()).dock);
    const marks = await current.evaluate(() => [...document.querySelectorAll('#dock [data-mark]')].map(e => e.getAttribute('data-mark')));
    check('Default apps use bundled marks', PRIMARY.every(id => marks.includes(id)), marks);
    const labels = await current.evaluate(() => [...document.querySelectorAll('#utils .u')].map(b => b.getAttribute('aria-label')));
    check('Controls are Inputs, All apps and Settings', JSON.stringify(labels) === JSON.stringify(['Inputs', 'All apps', 'Settings']), labels);
  });
  await run('Home starts with what this TV has', async () => {
    await page({ catalog: CATALOG.filter(a => a.appId !== 'org.xbmc.kodi'), tvApp: '' });
    check('Missing apps and a TV without a Live TV app are left out', JSON.stringify((await state()).dock) === JSON.stringify(['youtube', 'netflix', 'vlc']), (await state()).dock);
    await act('home.app.youtube'); await current.waitForFunction(() => window.__android.calls.length === 1);
    check('YouTube launches its package', (await lastCall()).arg === 'com.google.android.youtube.tv', await lastCall());
    await closePage();
    await page({ catalog: [{ appId: 'com.example.family', name: 'Family TV', icon: '' }], tvApp: '' });
    check('With none of them, Home still has the Play Store', JSON.stringify((await state()).dock) === JSON.stringify(['googleplay']), (await state()).dock);
    await closePage();
    await page();
    await act('home.app.tv'); await current.waitForFunction(() => window.__android.calls.length === 1);
    check('Live TV opens whichever app shows the TV\'s channels', (await lastCall()).arg === LIVE_TV, await lastCall());
  });
  await run('Home keeps its apps through a start that misses them', async () => {
    const saved = async () => JSON.parse(await current.evaluate(k => localStorage.getItem(k), KEY));
    await page();
    const before = await saved();
    await closePage();
    // Kodi mid-update and a second channel app (no single Live TV app) for one start.
    await page({ seed: before, catalog: CATALOG.filter(a => a.appId !== 'org.xbmc.kodi'), tvApp: '' });
    check('Live TV and Kodi stay on Home', JSON.stringify((await state()).dock) === JSON.stringify(PRIMARY), (await state()).dock);
    const marks = await current.evaluate(() => [...document.querySelectorAll('#dock [data-mark]')].map(e => e.getAttribute('data-mark')));
    check('They keep their marks', ['tv', 'kodi'].every(m => marks.includes(m)), marks);
    await act('home.app.tv'); await current.waitForFunction(() => window.__android.calls.length === 1);
    check('Live TV still opens its saved app', (await lastCall()).arg === LIVE_TV, await lastCall());
    const during = await saved();
    await closePage();
    await page({ seed: during });
    await library();
    check('Back to normal, Kodi is one app, not two', await current.locator('[data-action="apps.open.kodi"]').count() === 1
      && await current.locator('[data-action="apps.open.org.xbmc.kodi"]').count() === 0);
    check('Home is unchanged', JSON.stringify((await state()).dock) === JSON.stringify(PRIMARY), (await state()).dock);
  });
  await run('Launching apps through the bridge', async () => {
    await page();
    await act('home.app.kodi'); await current.waitForFunction(() => window.__android.calls.length === 1);
    check('Home app launches its package', JSON.stringify(await lastCall()) === JSON.stringify({ method: 'launch', arg: 'org.xbmc.kodi' }), await lastCall());
    await current.evaluate(() => window.dispatchEvent(new Event('focus')));
    await library();
    const names = await current.locator('[data-action^="apps.open."] .label').allTextContents();
    check('All apps lists the bridge catalogue', names.length === CATALOG.length && names.includes('Family TV'), names);
    check('Known brand gets its bundled mark', await current.locator('[data-action="apps.open.com.spotify.tv.android"] [data-mark="spotify"]').count() === 1);
    await current.waitForFunction(() => { const img = document.querySelector('[data-action="apps.open.com.example.family"] img'); return img && img.complete && img.naturalWidth > 0; });
    check('Other apps use their Android icon', await current.locator('[data-action="apps.open.com.example.family"] .has-native-icon').count() === 1);
    await act('apps.open.com.spotify.tv.android'); await current.waitForFunction(() => window.__android.calls.length === 2);
    check('All apps launches the package', (await lastCall()).arg === 'com.spotify.tv.android', await lastCall());
    await current.evaluate(() => { window.dispatchEvent(new Event('focus')); window.__android.fail = true; });
    await call('scene', 'home'); await act('home.app.vlc'); await settled('message');
    check('Bridge failure is shown, not hidden', /could not|unavailable/i.test(await text()));
  });
  await run('Inputs sheet', async () => {
    await page();
    await act('util.art'); await settled('message');
    const actions = await call('actions');
    check('Every input is offered', actions.includes('message.input.0') && actions.includes('message.input.1'), actions);
    check('Input names stay text', (await text()).includes('Console <img') && !(await current.evaluate(() => window.__inputXss)));
    await nav('right', 'ok'); await current.waitForFunction(() => window.__android.calls.length === 1);
    check('OK switches to the focused input', JSON.stringify(await lastCall()) === JSON.stringify({ method: 'openInput', arg: INPUTS[1].id }), await lastCall());
    check('Sheet closes after switching', (await state()).view === 'home');
  });
  await run('Android TV names its own home', async () => {
    await page({ platform: 'Android TV' });
    await call('scene', 'settings'); await act('settings.group.samsung');
    check('Group is named for Android TV', /Android TV home/.test(await text()) && !/Google TV|Samsung/.test(await text()));
    await call('scene', 'home'); await nav('back'); await settled('message');
    check('Back from Home offers Android TV home', /Open Android TV home\?/.test(await text()));
  });
  await run('Google TV escape and settings', async () => {
    await page();
    await call('scene', 'settings'); await act('settings.group.samsung');
    check('Group is named for Google TV', /Google TV home/.test(await text()) && !/Samsung/.test(await text()));
    await act('samsung.home'); await current.waitForFunction(() => window.__android.calls.length === 1);
    check('Google TV home goes through the bridge', (await lastCall()).method === 'systemHome');
    await current.evaluate(() => window.dispatchEvent(new Event('focus')));
    await call('scene', 'settings'); await act('settings.group.samsung'); await act('samsung.settings');
    await current.waitForFunction(() => window.__android.calls.length === 2);
    check('TV settings goes through the bridge', (await lastCall()).method === 'settings');
    await current.evaluate(() => window.dispatchEvent(new Event('focus')));
    await call('scene', 'home'); await nav('back'); await settled('message');
    check('Back from Home offers Google TV home', /Open Google TV home\?/.test(await text()));
    await act('message.samsung'); await current.waitForFunction(() => window.__android.calls.length === 3);
    check('Leaving opens Google TV home', (await lastCall()).method === 'systemHome');
  });
  await run('Added brand app survives a restart', async () => {
    await page();
    await call('scene', 'settings'); await act('settings.editor');
    await current.waitForFunction(() => !FoyerQA.state().catalog.loading && document.querySelector('[data-action="editor.add.com.spotify.tv.android"]'));
    await act('editor.add.com.spotify.tv.android');
    check('Spotify is saved on Home', (await current.evaluate(k => JSON.parse(localStorage.getItem(k)).dock, KEY)).includes('com.spotify.tv.android'));
    await current.reload(); await current.waitForFunction(() => FoyerQA.ready());
    check('Saved Spotify keeps its mark after restart', await current.locator('#dock [data-mark="spotify"]').count() === 1);
  });
  await run('Browser preview honesty', async () => {
    await page({ bridge: false, query: '?device=android' });
    check('Preview shows a typical TV\'s defaults', JSON.stringify((await state()).dock) === JSON.stringify(PREVIEW_PRIMARY), (await state()).dock);
    await act('home.app.youtube'); await settled('message');
    check('Preview launch says it needs the TV', /on the TV/.test(await text()));
    await nav('back'); await library();
    check('Preview All apps shows a typical TV\'s apps', (await current.locator('[data-action^="apps.open."]').count()) > PREVIEW_PRIMARY.length);
    await call('scene', 'home'); await current.waitForSelector('#caption .weather-line');
    check('Preview weather comes from the same services', /22°\s*·\s*Sunny/.test(await current.locator('#caption .weather-line').innerText()));
    await closePage();
    await page({ bridge: false, query: '?device=android', addressBlocked: true });
    await current.waitForSelector('#caption .weather-line');
    check('A blocked address lookup falls back to the time zone city', current.__forecasts.some(u => u.includes('latitude=-33.87&longitude=151.21')), current.__forecasts);
    await call('scene', 'settings'); await act('settings.group.weather');
    check('Settings says the place came from the time zone', /Near Sydney, from the TV’s time zone/.test(await text()));
  });
  await run('Bundled marks for other apps', async () => {
    await page(); await library();
    const marks = await current.evaluate(marked => Object.keys(marked).map(pkg => {
      const el = document.querySelector('[data-action="apps.open.' + pkg + '"] [data-mark]');
      return { pkg, mark: el && el.getAttribute('data-mark'), bad: !el || el.classList.contains('is-bad') };
    }), MARKED);
    check('Every app with a bundled mark shows it', marks.every(m => m.mark === MARKED[m.pkg] && !m.bad), marks);
    await current.waitForFunction(() => [...document.querySelectorAll('[data-mark]')].every(e => !e.classList.contains('is-bad')));
  });
  await run('Your own TV\'s marks', async () => {
    await page({ localMarks: { 'com.example.family': 'local/family', 'com.netflix.ninja': '../netflix', 'com.example.other': 'local/x y' } });
    await library();
    check('A local mark is used for its app', await current.locator('[data-action="apps.open.com.example.family"] [data-mark="local/family"]').count() === 1);
    check('Malformed local marks are ignored', await current.locator('[data-mark="../netflix"], [data-mark="local/x y"]').count() === 0
      && await current.locator('[data-action="apps.open.netflix"] [data-mark="netflix"]').count() === 1);
  });
  await run('Saved apps pick up new marks at once', async () => {
    const spotify = 'com.spotify.tv.android';
    await page({ seed: { version: 2, home: ['tv', spotify], dock: ['tv', spotify], appRecords: [{ id: spotify, appId: spotify, name: 'Spotify', brand: '', icon: '/appicon/' + spotify + '.png' }] } });
    check('A Spotify saved before its mark existed shows the mark without opening All apps', await current.locator('#dock [data-mark="spotify"]').count() === 1 && !(await state()).catalog.loaded);
  });
  await run('About', async () => {
    await page();
    await call('scene', 'settings');
    const fit = await current.evaluate(() => {
      const rows = [...document.querySelectorAll('.settings-group')], hint = document.querySelector('.settings-overview-hint').getBoundingClientRect();
      return { count: rows.length, last: rows.at(-1).getAttribute('data-id'), clear: rows.every(r => r.getBoundingClientRect().bottom <= hint.top) };
    });
    check('About is the last Settings group and every group fits above the hint', fit.count === 8 && fit.last === 'about' && fit.clear, fit);
    await act('settings.group.about');
    check('About lists the version, privacy policy and links', JSON.stringify(await call('actions')) === JSON.stringify(['settings.back', 'about.whatsnew', 'about.privacy', 'about.coffee', 'about.website', 'about.source']), await call('actions'));
    check('The version comes from package.json', /Version 1\.0\.0/.test(await text()));
    check('No diagnostics', !/diagnostic/i.test(await text()));
    await nav('ok');
    check('OK on the version opens What’s New', (await state()).view === 'reader' && /What’s New/.test(await text()) && /Meet FoyerLauncher/.test(await text()));
    await nav('back'); await nav('down'); await nav('ok');
    const body = () => current.evaluate(() => { const b = document.querySelector('.reader-body'); return { top: b.scrollTop, max: b.scrollHeight - b.clientHeight }; });
    check('The privacy policy is longer than the screen', (await body()).max > 0 && /Privacy Policy/.test(await text()));
    await nav('down'); await nav('down');
    check('Down scrolls the policy', (await body()).top > 0, await body());
    for (let i = 0; i < 40; i++) await nav('down');
    check('Scrolling stops at the end', (await body()).top === (await body()).max && /7\. Contact/.test(await text()), await body());
    for (let i = 0; i < 40; i++) await nav('up');
    check('Up past the top focuses Back', (await body()).top === 0 && (await state()).focusAction === 'reader.back');
    await nav('ok');
    check('Back returns to About with the policy still focused', (await state()).view === 'appearance' && (await state()).focusAction === 'about.privacy');
    await act('about.source');
    await current.waitForFunction(() => { const img = document.querySelector('.reader-code img'); return img && img.complete && img.naturalWidth > 0; });
    const code = await current.evaluate(() => { const img = document.querySelector('.reader-code img'); return img && img.complete && img.naturalWidth > 0 && img.getAttribute('src'); });
    check('A link shows its QR code and address', code === 'assets/about/source.svg' && /github\.com\/nycoagung\/foyerLauncher/.test(await text()), code);
    await nav('back');
    check('Back from a link returns to About', (await state()).view === 'appearance' && (await state()).settingsGroup === 'about');
  });
  await run('Google ambient photos streamed in Background', async () => {
    await page();
    const stage = () => current.evaluate(() => document.getElementById('stage').className);
    await call('scene', 'settings'); await act('settings.group.background'); await act('background.photos');
    check('Background → Photos offers Google’s ambient photos', (await call('actions')).includes('choice.photos.google') && (await state()).settingsGroup === 'photos');
    await act('choice.photos.google');
    await current.waitForFunction(first => FoyerQA.state().look.wall === first && FoyerQA.ready(), G[0]);
    check('Choosing Google streams a photo onto Home', (await state()).look.photos === 'google' && (await current.evaluate(() => document.getElementById('photo').src)).includes('/ambient/' + G[0] + '.jpg'));
    check('Photos says they are streamed, not collected', /streamed each time it changes. The TV keeps only three: this photo, the one before and the next/.test(await text()));
    check('Prepared ink choices reach the page', /tr-mist/.test(await stage()) && /br-light/.test(await stage()), await stage());
    await nav('back');
    const actions = await call('actions');
    check('Background names the source and offers another photo instead of a picker', /From Google ambient/.test(await text()) && /Ansel A/.test(await text()) && actions.includes('background.another') && !actions.includes('background.wallpaper'), actions);
    await act('background.another');
    await current.waitForFunction(id => FoyerQA.state().look.wall === id && FoyerQA.ready(), G[1]);
    check('Another photo streams a new one after the current', (await current.evaluate(() => __android.ambientCalls)).at(-1) === G[0] && /tr-light/.test(await stage()) && /br-dark/.test(await stage()));
    await act('background.rotation');
    check('Rotation offers every minute', (await call('actions')).includes('rotation.1'));
    await act('rotation.1');
    await current.evaluate(() => { FoyerQA.minuteMs = 300; });
    await call('scene', 'home');
    await current.waitForFunction(id => FoyerQA.state().look.wall === id && FoyerQA.ready(), G[2]);
    check('Each rotation streams a new random photo', (await state()).mode === '1');
    check('An unknown ink falls back to light', /tr-light/.test(await stage()) && /br-mist/.test(await stage()));
    await current.evaluate(() => { FoyerQA.minuteMs = 60000; FoyerQA.scene('home'); });
    const shown = (await state()).look.wall;
    await current.reload(); await current.waitForFunction(() => FoyerQA.ready());
    check('The photo on screen survives a restart', (await state()).look.wall === shown && (await state()).look.photos === 'google', (await state()).look);
    await call('scene', 'settings'); await act('settings.group.background'); await act('background.photos'); await act('choice.photos.builtin');
    await current.waitForFunction(() => !FoyerQA.state().look.wall.startsWith('g-') && FoyerQA.ready());
    check('Back to FoyerLauncher returns to its bundled photos', (await state()).ambient.gallery.every(id => !id.startsWith('g-')) && (await call('actions')).length > 0);
    await closePage();
    await page({ seed: { version: 2, home: ['tv'], look: { bg: 'photo', wall: 'night', photos: 'google', font: 'manrope' } } });
    await current.evaluate(list => sessionStorage.setItem('__ambient', JSON.stringify(list)), [AMBIENT.value[0]]);
    await current.reload(); await current.waitForFunction(() => FoyerQA.ready());
    check('Starting with Google chosen shows the photo already on the TV', (await state()).look.wall === G[0], (await state()).look);
    await closePage();
    await page({ ambient: { ok: false, error: 'No connection for QA' } });
    await call('scene', 'settings'); await act('settings.group.background'); await act('background.photos'); await act('choice.photos.google');
    await current.waitForFunction(() => FoyerQA.state().ambient.error);
    check('Without a photo, Google keeps the current wallpaper and says why', !(await state()).look.wall.startsWith('g-') && /aren’t available right now/.test(await text()));
  });
  await run('Rotation keeps going after a failed stream', async () => {
    await page({ seed: { version: 2, home: ['tv'], mode: '1', look: { bg: 'photo', wall: 'night', photos: 'google', font: 'manrope' } } });
    await current.waitForFunction(first => FoyerQA.state().look.wall === first && FoyerQA.ready(), G[0]);
    await current.evaluate(() => { __android.ambient = { ok: false, error: 'Feed down for QA' }; FoyerQA.minuteMs = 300; FoyerQA.scene('home'); });
    const calls = await current.evaluate(() => __android.ambientCalls.length);
    await current.waitForFunction(n => __android.ambientCalls.length >= n + 2, calls);
    check('Failed streams are retried at the next interval, keeping the photo on screen', (await state()).look.wall === G[0]);
    await current.evaluate(ok => { __android.ambient = ok; }, AMBIENT);
    await current.waitForFunction(id => FoyerQA.state().look.wall === id && FoyerQA.ready(), G[1]);
    check('Rotation resumes once the feed is back', !(await state()).ambient.error);
  });
  await run('Weather under the clock', async () => {
    await page(); await current.waitForSelector('#caption .weather-line');
    const line = () => current.locator('#caption .weather-line').innerText();
    check('Temperature and condition follow the clock', /^18°\s*·\s*Partly cloudy$/.test((await line()).trim()), await line());
    check('Clock shows AM or PM', /\d:\d\d(AM|PM)$/.test((await current.locator('#caption .clock').innerText()).trim()));
    await call('scene', 'settings');
    check('Settings overview shows the place and units', /Weather\s*Sydney, °C/.test(await text()));
    await act('settings.group.weather');
    check('Weather group says where the location came from', /Near Sydney, found from your internet connection/.test(await text()));
    await act('choice.units.f'); await call('scene', 'home');
    check('Fahrenheit converts the same reading', /^65°/.test((await line()).trim()) && (await state()).look.units === 'f', await line());
    await call('scene', 'settings'); await act('settings.group.weather'); await act('choice.weather.off');
    check('Units are inactive while weather is off', await current.locator('[data-action^="choice.units."][aria-disabled="true"]').count() === 2);
    await call('scene', 'home');
    check('Weather off hides the line', await current.locator('#caption .weather-line').count() === 0 && (await state()).look.weather === 'off');
    await closePage();
    await page({ weather: { ok: false, error: 'No connection for QA' } });
    await current.waitForFunction(() => FoyerQA.state().weatherState.error);
    check('A failed reading shows nothing under the clock', await current.locator('#caption .weather-line').count() === 0);
    await call('scene', 'settings'); await act('settings.group.weather');
    check('Settings explains the failure', /isn’t available right now/.test(await text()));
  });
  await run('Text size scales names around their centre', async () => {
    await page();
    const label = sel => current.evaluate(s => { const e = document.querySelector(s), r = e.getBoundingClientRect(), k = document.getElementById('stage').getBoundingClientRect().width / 1920;
      return { size: parseFloat(getComputedStyle(e).fontSize), centre: (r.top + r.height / 2) / k }; }, sel);
    const dockLabel = '#track .tile .label';
    const medium = await label(dockLabel);
    await call('look', { size: 'large' }); await current.waitForFunction(() => FoyerQA.ready());
    const large = await label(dockLabel);
    check('Large Dock names are 15% bigger', Math.abs(large.size - medium.size * 1.15) < .05, { medium, large });
    check('Dock names keep their centre', Math.abs(large.centre - medium.centre) < .6, { medium, large });
    check('Text size is saved', (await current.evaluate(k => JSON.parse(localStorage.getItem(k)).look.size, KEY)) === 'large');
    await call('look', { layout: 'list', size: 'medium' }); await current.waitForFunction(() => FoyerQA.ready());
    const listMedium = await label('#phRows .ph-row .ph-name');
    await call('look', { size: 'small' }); await current.waitForFunction(() => FoyerQA.ready());
    const listSmall = await label('#phRows .ph-row .ph-name');
    check('Small List names are 15% smaller', Math.abs(listSmall.size - listMedium.size * .85) < .05, { listMedium, listSmall });
    check('List names keep their centre', Math.abs(listSmall.centre - listMedium.centre) < .6, { listMedium, listSmall });
    await call('scene', 'settings'); await act('settings.group.typography');
    check('Typography offers the three name sizes', (await call('actions')).filter(a => a.startsWith('choice.size.')).length === 3);
  });
  await run('Roboto is offered and applied', async () => {
    await page();
    check('Roboto is in the font catalogue', (await state()).fonts.available.includes('roboto'));
    await call('look', { font: 'roboto' }); await current.waitForFunction(() => FoyerQA.ready() && FoyerQA.state().shown.font === 'roboto');
    const clock = await current.evaluate(() => ({ family: getComputedStyle(document.querySelector('#caption .clock')).fontFamily, loaded: document.fonts.check('300 48px "Study Roboto"') }));
    check('The clock uses Roboto once it has loaded', clock.family.includes('Study Roboto') && clock.loaded, clock);
  });
  section = 'Run integrity';
  check('No unexpected browser/resource failures', report.pageErrors.length === 0, report.pageErrors);
} catch (error) { report.failures.push({ section, error: error.stack }); }
finally {
  if (current) await current.close();
  if (preview) await preview.close();
  writeFileSync(out + 'android-checks.json', JSON.stringify(report, null, 2) + '\n');
}
console.log(report.checks.filter(c => c.passed).length + ' checks passed; ' + report.failures.length + ' failure(s). Report: .local/qa/android-checks.json');
if (report.failures.length) process.exitCode = 1;
