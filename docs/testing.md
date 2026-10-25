# Validation

## Offline app changes

```sh
npm ci
npm run check
npx playwright install chromium
npm run check:browser
npm run check:android
npm run check:debloat
```

`check` validates JavaScript syntax, including both device adapters, package identity/version and bundled resources. It does not contact a TV. `check:browser` uses a fresh Playwright Chromium profile and its own loopback preview. It checks List and Dock navigation, single focus, Home controls, grouped Settings, explicit OK application, applied checkmarks, pending-load cancellation, retries, persistence, all fifteen wallpaper bundles, available fonts, 720p scaling, migrations, the Home editor and honest browser-only launch errors. Reports and screenshots are in ignored `.local/qa/`. A failed assertion exits with a nonzero status.

`check:android` runs the Android TV adapter in the same Chromium preview with a mocked `window.FoyerAndroid` bridge. It never contacts a TV, so it does not test the Android shell, the Home button service or a real TV's apps.

For public-source validation, set `FOYER_PUBLIC_FONTS=1` when running `check:browser`; the preview helper then excludes the local proprietary overlay. Run `npm run check:public` for the bounded source/history checks and `npm run export:public` for a widget that always excludes private fonts. The GitHub Actions workflow uses this public path. Browser/package checks do not clear third-party asset rights or validate TV behaviour.

If the default browser/cache location is unavailable, use a writable local path for both commands:

```sh
PLAYWRIGHT_BROWSERS_PATH="$PWD/.local/playwright" npx playwright install chromium
PLAYWRIGHT_BROWSERS_PATH="$PWD/.local/playwright" npm run check:browser
```

For manual review, use `npm run dev` and open `/home/`, or `/home/?device=android` for the Android adapter. Use the arrow keys, Enter and Escape. Check the changed flow in List and Dock, on Photo, Light and Dark backgrounds. Check a single app and all nine apps when changing app layout. In Settings, browse without applying, apply with OK, return with both Back routes, and cancel a pending resource load. Check editor placement/undo, wallpaper rotation pausing during panels/background time, and restored focus on return when those flows change. Browser preferences are separate from TV preferences.

## Physical TV checks

Run these only under a task that includes TV testing. Announce any installation or launch first, then follow `development.md`. SDK or adb success alone is not a visible result. Ask the TV's owner to confirm the normal remote behaviour. For the reference Samsung TV, record the version, firmware, result and any open checks in `tv-status.md`.

1. Move in both directions through each layout and Settings; check focus, response and readable labels from the sofa.
2. Launch Netflix/YouTube, press Home to return, and check the selected app. Treat streaming apps' own Back handling separately.
3. Check Art Mode, Other apps, TV settings and Settings → Samsung → Samsung Home; verify the actual visible destinations.
4. Check saved appearance/app order/wallpaper after relaunch. Check timed rotation pauses while a panel is open or the app is hidden.
5. Test normal power-on after a streaming app and the usual Art Mode routine only when that work is included. Preserve the native Home recovery baseline and restore it before any uninstall/identity change.

Steps 3 and 5 are Samsung-specific. On Android TV, instead check that Home returns to FoyerLauncher once `android/install.sh` has turned on the Home button service, that holding Home opens the TV's own home screen, the Settings → Google TV destinations, and that `android/restore.sh` gives Home back. Check weather and Google ambient photos when that work is included.

Pending results for the reference Samsung TV are listed in `tv-status.md`. Browser CPU throttling is a development comparison, not a TV performance measurement.
