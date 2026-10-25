/* Android TV adapter. Replaces the Tizen adapter inside the Android shell (window.FoyerAndroid),
   or in the browser preview with ?device=android. No network address or credentials. */
(function () {
  'use strict';
  var bridge = window.FoyerAndroid, preview = !bridge && /[?&]device=android(?:&|$)/.test(location.search);
  if (!bridge && !preview) return;
  // Home's first apps, in this order, when installed. 'tv' is whichever app shows the TV's channels.
  var CANDIDATES = [
    { id: 'tv', name: 'Live TV', mark: true, appId: 'com.google.android.tv' },
    { id: 'youtube', name: 'YouTube', mark: true, appId: 'com.google.android.youtube.tv' },
    { id: 'netflix', name: 'Netflix', mark: true, appId: 'com.netflix.ninja' },
    { id: 'primevideo', name: 'Prime Video', mark: true, appId: 'com.amazon.amazonvideo.livingroom' },
    { id: 'disneyplus', name: 'Disney+', mark: true, appId: 'com.disney.disneyplus' },
    { id: 'kodi', name: 'Kodi', mark: true, appId: 'org.xbmc.kodi' },
    { id: 'vlc', name: 'VLC', mark: true, appId: 'org.videolan.vlc' }
  ];
  // Used when none of those is installed, so Home always has an app.
  var FALLBACK = { id: 'googleplay', name: 'Google Play Store', mark: true, appId: 'com.android.vending' };
  // Installed apps with a bundled mark. Other apps use their own Android icon.
  var BRANDS = {
    'com.netflix.ninja': 'netflix', 'com.amazon.amazonvideo.livingroom': 'primevideo', 'com.google.android.youtube.tv': 'youtube',
    'com.disney.disneyplus': 'disneyplus', 'org.xbmc.kodi': 'kodi', 'org.videolan.vlc': 'vlc',
    'com.sbs.ondemand.tv': 'sbs', 'au.net.abc.iview': 'abciview', 'com.stremio.one': 'stremio',
    'com.spotify.tv.android': 'spotify', 'com.apple.android.music': 'applemusic', 'com.tubitv': 'tubi',
    'com.android.vending': 'googleplay', 'com.google.android.youtube.tvmusic': 'youtubemusic'
  };
  // Apple TV ships as a different package for each TV maker.
  var APPLE_TV = /^com\.apple\.atve\.[a-z.]*appletv$/;
  // Marks made from your own TV's apps (scripts/marks-from-tv.mjs), added by android/build.sh.
  var LOCAL = window.FoyerLocalMarks || {};
  Object.keys(LOCAL).forEach(function (pkg) { if (/^local\/[a-z0-9-]+$/.test(LOCAL[pkg])) BRANDS[pkg] = LOCAL[pkg]; });
  // The browser preview shows a typical TV's apps; it cannot launch them.
  var PREVIEW_APPS = [
    ['com.google.android.tv', 'Live TV'], ['com.google.android.youtube.tv', 'YouTube'], ['com.netflix.ninja', 'Netflix'],
    ['com.amazon.amazonvideo.livingroom', 'Prime Video'], ['com.disney.disneyplus', 'Disney+'], ['org.xbmc.kodi', 'Kodi'],
    ['org.videolan.vlc', 'VLC'], ['com.apple.atve.androidtv.appletv', 'Apple TV'], ['com.spotify.tv.android', 'Spotify'],
    ['com.google.android.youtube.tvmusic', 'YouTube Music'], ['com.tubitv', 'Tubi'], ['com.android.vending', 'Google Play Store'],
    ['com.google.android.apps.tv.launcherx', 'Google TV']
  ];
  var PREVIEW_INPUTS = [{ id: 'hdmi1', name: 'HDMI 1' }, { id: 'hdmi2', name: 'HDMI 2' }, { id: 'hdmi3', name: 'HDMI 3' }, { id: 'hdmi4', name: 'HDMI 4/ARC' }];
  function about() {
    var reply;
    if (preview) return { platform: 'Google TV', tvApp: 'com.google.android.tv', installed: CANDIDATES.map(function (a) { return a.appId; }) };
    try { reply = JSON.parse(bridge.device(JSON.stringify(CANDIDATES.concat(FALLBACK).map(function (a) { return a.appId; })))); } catch (err) { reply = null; }
    return reply && reply.ok && reply.value || { platform: 'Android TV', tvApp: '', installed: [] };
  }
  var TV = about(), PLATFORM = TV.platform === 'Google TV' ? 'Google TV' : 'Android TV', PRIMARY = [];
  CANDIDATES.forEach(function (a) {
    var appId = a.id === 'tv' ? TV.tvApp : a.appId;
    if (appId && (a.id === 'tv' || (TV.installed || []).indexOf(appId) >= 0)) PRIMARY.push({ id: a.id, name: a.name, mark: true, appId: appId });
  });
  if (!PRIMARY.length) PRIMARY.push(FALLBACK);
  var LABELS = {
    art: 'Inputs', artIcon: 'input', platform: PLATFORM, platformValue: 'Home and TV settings',
    home: PLATFORM + ' home', homeDescription: 'Open ' + PLATFORM + '’s home screen',
    settingsDescription: 'Picture, sound and network settings', leaveLine: 'Open ' + PLATFORM + ' home?'
  };
  function unavailable(done) {
    done({ message: 'Open FoyerLauncher on the TV to use this control.', detail: 'The web preview cannot control the TV.' });
  }
  function failure(err) {
    return { message: 'The TV could not open this screen.', detail: err && (err.message || err.name) || 'Try again, or press the remote’s Home button to return to FoyerLauncher.' };
  }
  // Bridge methods answer synchronously with {"ok":true,"value":...} or {"ok":false,"error":"..."}.
  function call(method, args, done) {
    if (!bridge) { unavailable(done); return; }
    setTimeout(function () {
      var reply;
      try { reply = JSON.parse(bridge[method].apply(bridge, args)); }
      catch (err) { done(failure(err)); return; }
      if (reply && reply.ok) done(null, reply.value);
      else done(failure({ message: reply && reply.error }));
    }, 0);
  }
  function primaryOf(appId) {
    for (var i = 0; i < PRIMARY.length; i++) if (PRIMARY[i].appId === appId) return PRIMARY[i].id;
    return '';
  }
  function brandOf(appId) { return BRANDS[appId] || (APPLE_TV.test(appId) ? 'appletv' : ''); }
  function entry(appId, name, icon) {
    return { appId: appId, name: name, brand: primaryOf(appId) || brandOf(appId), icon: icon || '' };
  }
  function apps(done) {
    if (preview) {
      setTimeout(function () { done(null, PREVIEW_APPS.map(function (a) { return entry(a[0], a[1]); })); }, 0);
      return;
    }
    call('apps', [], function (err, list) {
      if (err) { done(err); return; }
      done(null, list.map(function (a) { return entry(a.appId, a.name, a.icon); }));
    });
  }
  function launchApp(id, done) { call('launch', [id], done); }
  function launch(brand, done) {
    var appId = '';
    PRIMARY.forEach(function (a) { if (a.id === brand) appId = a.appId; });
    if (!appId) { done({ message: 'This app has no launch target.' }); return; }
    launchApp(appId, done);
  }
  function inputs(done) {
    if (preview) { setTimeout(function () { done(null, PREVIEW_INPUTS.slice()); }, 0); return; }
    call('inputs', [], done);
  }
  function openInput(id, done) { call('openInput', [id], done); }
  // Weather needs the network, so the bridge answers later through FoyerAndroidReply(id, json).
  var replies = {}, nextReply = 1;
  window.FoyerAndroidReply = function (id, json) {
    var done = replies[id], reply;
    delete replies[id];
    if (!done) return;
    try { reply = JSON.parse(json); } catch (err) { done(failure(err)); return; }
    if (reply && reply.ok) done(null, reply.value);
    else done({ message: reply && reply.error || 'Weather isn’t available right now.' });
  };
  function getJson(url, done) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url); xhr.timeout = 10000;
    xhr.onload = function () {
      var value;
      try { value = JSON.parse(xhr.responseText); } catch (err) { done({ message: 'Unexpected reply.' }); return; }
      done(xhr.status === 200 ? null : { message: 'HTTP ' + xhr.status }, value);
    };
    xhr.onerror = xhr.ontimeout = function () { done({ message: 'No connection.' }); };
    xhr.send();
  }
  // Like the shell: the internet address first, then the city of this time zone (some DNS filters
  // block address lookups). Results must share the zone: Sydney, Nova Scotia is not Australia/Sydney.
  function previewLocate(done) {
    getJson('https://ipwho.is/?fields=success,city,latitude,longitude', function (err, here) {
      var zone = window.Intl && Intl.DateTimeFormat().resolvedOptions().timeZone || '', city = zone.split('/').pop().replace(/_/g, ' ');
      if (!err && here && here.success) { done(null, { latitude: here.latitude, longitude: here.longitude, place: here.city || '', source: 'address' }); return; }
      if (zone.indexOf('/') < 0 || zone.indexOf('Etc/') === 0) { done({ message: 'Location unavailable.' }); return; }
      getJson('https://geocoding-api.open-meteo.com/v1/search?count=20&language=en&format=json&name=' + encodeURIComponent(city), function (err2, found) {
        var match = (found && found.results || []).filter(function (r) { return r.timezone === zone; })[0];
        if (err2 || !match) { done(err2 || { message: 'Location unavailable.' }); return; }
        done(null, { latitude: match.latitude, longitude: match.longitude, place: match.name, source: 'timezone' });
      });
    });
  }
  function previewWeather(done) {
    previewLocate(function (err, here) {
      if (err) { done(err); return; }
      getJson('https://api.open-meteo.com/v1/forecast?latitude=' + here.latitude.toFixed(2) + '&longitude=' + here.longitude.toFixed(2)
        + '&current=temperature_2m,weather_code,is_day&timezone=auto', function (err2, forecast) {
        var now = forecast && forecast.current;
        if (err2 || !now) { done(err2 || { message: 'No weather reported.' }); return; }
        done(null, { temp: now.temperature_2m, code: now.weather_code, day: now.is_day === 1, place: here.place, source: here.source });
      });
    });
  }
  // Google's ambient "Featured photos", streamed at random and given FoyerLauncher's materials by the
  // shell (AmbientPhotos.java). Ink values become class names, so only known ones pass.
  var INKS = ['light', 'mist', 'dark'];
  function ambientWalls(list) {
    return (list || []).filter(function (p) { return p && /^g-[0-9a-f]{16}$/.test(p.id); }).map(function (p) {
      return { id: p.id, name: String(p.name || 'Google').slice(0, 60), collection: 'google', base: '/ambient/', tone: p.tone === 'dark' ? 'dark' : 'light',
        ut: { tr: INKS.indexOf(p.tr) >= 0 ? p.tr : 'light', br: INKS.indexOf(p.br) >= 0 ? p.br : 'light' }, frostVeil: .12 };
    });
  }
  function walls() {
    var reply;
    try { reply = JSON.parse(bridge.ambientList()); } catch (err) { return []; }
    return reply && reply.ok ? ambientWalls(reply.value) : [];
  }
  // A random photo to follow `current`, streamed and prepared by the shell: done(err, { photo, ready }).
  function ambient(current, done) {
    var id = nextReply++;
    replies[id] = function (err, value) {
      var photo = !err && value && ambientWalls([value.photo])[0];
      if (!photo) { done(err || { message: 'No photo.' }); return; }
      done(null, { photo: photo, ready: ambientWalls(value.ready) });
    };
    setTimeout(function () { if (replies[id]) { delete replies[id]; done({ message: 'Google’s photo took too long.' }); } }, 120000);
    try { bridge.ambient(id, current || ''); } catch (err) { delete replies[id]; done(failure(err)); }
  }
  function weather(done) {
    var id;
    if (preview) { previewWeather(done); return; }
    id = nextReply++; replies[id] = done;
    setTimeout(function () { if (replies[id]) { delete replies[id]; done({ message: 'The weather took too long.' }); } }, 30000);
    try { bridge.weather(id); } catch (err) { delete replies[id]; done(failure(err)); }
  }
  function home(done) { call('systemHome', [], done); }
  function settings(done) { call('settings', [], done); }
  var brands = [];
  Object.keys(BRANDS).forEach(function (pkg) { if (brands.indexOf(BRANDS[pkg]) < 0) brands.push(BRANDS[pkg]); });
  // Default apps saved on Home keep their marks even in a start where the TV doesn't report them.
  brands.push('appletv', 'tv');
  CANDIDATES.forEach(function (a) { if (brands.indexOf(a.id) < 0) brands.push(a.id); });
  window.FoyerDevice = {
    launch: launch, launchApp: launchApp, home: home, settings: settings, apps: apps,
    inputs: inputs, openInput: openInput, primary: PRIMARY, brands: brands, labels: LABELS, brandOf: brandOf,
    weather: preview || typeof bridge.weather === 'function' ? weather : null,
    walls: bridge && typeof bridge.ambientList === 'function' ? walls : null,
    ambient: bridge && typeof bridge.ambient === 'function' ? ambient : null
  };
}());
