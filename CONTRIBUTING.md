# Contributing to FoyerLauncher

FoyerLauncher runs on Android TV / Google TV and on Samsung Tizen TVs. The Samsung side began on one Samsung The Frame, with very little work on portability. Use it at your own risk and treat it as a starting point for your own version. Forks and adaptations are encouraged. Contributions back to [this repo](https://github.com/nycoagung/foyerLauncher) should keep the remote experience simple and state what has actually been tested, and on which platform.

## Start in the browser

Use the README's public-font setup. Keep changes in `app/` and the maintained tools in `scripts/`. Use your browser to develop interface changes.

```sh
npm ci
npm run dev:public
npm run check
npx playwright install chromium
FOYER_PUBLIC_FONTS=1 npm run check:browser
npm run check:android
npm run check:public
```

Open `/home/?device=android` in the preview to see the Android TV adapter. `check:android` mocks the Android shell's bridge and never contacts a TV.

Keep runtime JavaScript ES5-compatible. Use existing focus, panel and preference logic. A new CSS/DOM API needs target-device evidence before it becomes a compatibility claim. Keep new dependencies in development tooling unless the runtime need is clear.

## Propose a change

For a bug, describe the trigger, expected result and actual result. Include browser/viewport, or the TV's platform, model and full firmware or Android version. For a new feature, explain the task it helps someone complete from the sofa. Open an issue before changing the app model or introducing a new service dependency.

A pull request should explain the resulting behaviour, the checks run and any untested device result. Include a public-font screenshot for visual changes. Check both List and Dock, single focus, panel Back behaviour and saved-preference recovery when relevant. The TV remote remains the final check for remote feel; browser throttling is only a comparison.

## Device work and privacy

On Android TV, `android/build.sh` makes its own signing key in ignored `android/.local/` on the first build; keep it for updates. `TV_IP=<TV_IP> android/install.sh` installs over adb and turns on the Home button service; `android/restore.sh` undoes it. Nothing on the TV is disabled.

On Samsung, use your own Samsung account, app identity, author certificate and distributor certificate. Follow the staged setup guide and keep native Home/startup experiments separate from UI work. Each TV owner decides whether and when to permit interruptions or settings changes.

Keep passwords, tokens, signing keys, serial numbers, DUIDs, addresses and original native settings out of issues, screenshots and PRs. Keep a private setup/recovery record. Report security issues through GitHub's private vulnerability reporting if enabled; do not attach credentials to a public issue.

## Assets and licences

FoyerLauncher is licensed under the GNU GPL, version 2 or later. Contributions use the same licence. Code that came from earlier MIT-licensed work keeps that notice; see `THIRD_PARTY_NOTICES.md`. Keep upstream asset licences and source records intact. Add only assets you have permission to redistribute, and explain any required attribution or separate terms. Personal paid fonts stay under `.local/`; the public app must work without them. Marks made from your own TV's apps by `scripts/marks-from-tv.mjs` stay in ignored `app/assets/icons/local/`. Review `THIRD_PARTY_NOTICES.md` before adding or replacing a logo, photograph or font.
