# Pre-publication checklist

Work through this before publishing source, a release or a download. It records what to check, not that any check has been done. Automated checks are bounded: they cannot prove the absence of every secret or establish third-party rights.

## Checks

Run these from a clean clone:

```sh
npm ci
npm run check
npx playwright install chromium
FOYER_PUBLIC_FONTS=1 npm run check:browser
npm run check:android
npm run check:debloat
npm run check:public
npm run export:public
```

`export:public` writes the unsigned public-font widget, `dist/FoyerLauncher-public-unsigned.wgt`. It is the only Samsung package to offer publicly. Do not publish a personal signed widget or APK; either can contain paid fonts or your own app marks.

Also check the GitHub Actions result for the revision being published. Local success and hosted success are separate results. None of these checks validates behaviour on a TV.

## Keep out of the repo

- Paid fonts, including the Pangram files in `.local/`.
- Signing keys, certificates and their passwords, including the Android key in `android/.local/`.
- `.local/` and `android/.local/`: device addresses, identifiers, settings baselines, SDKs and recovery state.
- `dist/` and `android/out/`: generated packages.
- Any TV's IP address, in docs, scripts, examples or screenshots. Use the `<TV_IP>` placeholder; `npm run check:public` fails on a private network address in a tracked file.
- `my-tvs/`: each TV's model, serial number, address, records and restore script.
- `app/assets/icons/local/`: marks made from your own TV's apps by `scripts/marks-from-tv.mjs`. They belong to that TV's apps and are never published.

All of these are ignored by Git. Check that nothing has been force-added, and that screenshots and logs show no addresses, serial numbers or DUIDs.

## Assets and notices

Review [third-party notices](../THIRD_PARTY_NOTICES.md) against the bundled assets. Keep the wallpaper credits in [asset sources](asset-sources.md), the font licence texts and the icon `SOURCES.json` records with the source. A new logo, photograph or font needs its source and licence recorded before release.

## History and visibility

Deleting a file does not remove it from Git history. If anything private was ever committed, deal with the history before making the repository public; [GitHub notes](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) that rewritten commits can stay reachable through cached views or references. Visibility changes, release uploads and history rewrites each need their own explicit instruction.
