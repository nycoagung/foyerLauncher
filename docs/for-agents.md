# Working with a coding agent

FoyerLauncher runs on Android TV / Google TV and on Samsung Tizen TVs. The Samsung side was built for one TV, with very little work on portability. Treat the source and setup notes as a starting point to adapt, and explain that use is at the owner's risk. Inspect the actual scripts and hardware assumptions before proposing device commands.

Choose the scope before starting: a browser contribution, an Android TV installation, an independently signed Samsung app or a Samsung native Home experiment. Each needs a different level of local access and owner authority.

## Change the interface

Work in the browser preview only (`npm run dev:public`, with `?device=android` for the Android adapter); do not contact a TV. Read `AGENTS.md`, then the development and interaction docs. Run the public-font preview so the result is reproducible on a clean clone. Finish with source validation, relevant browser checks, a screenshot for visual changes and a clear statement of what needs physical TV observation.

The current app uses List and Dock, fifteen wallpapers and separate appearance settings. `app/main.js` handles interaction. `app/device.js` owns Samsung device calls and `app/device-android.js` owns Android ones; preview the latter with `?device=android` and test it with `npm run check:android`. The existing storage migration keeps older installations usable.

## Set up an Android TV, Google TV or Fire TV

Use a local agent with access to the owner's computer and adb, and follow [the TV setup guide](agent-android-setup-guide.md) stage by stage. It covers any brand: collect the TV's brand, model, platform, OS version and IP address from the owner; connect; show them the apps `debloat/debloat.sh --list` offers and hide only what they choose; make matching logos for the TV's apps with `scripts/marks-from-tv.mjs --auto` and let them review the preview; install FoyerLauncher with `android/install.sh`; and hand over the restore script the scripts write in `my-tvs/<model>-<serial>/`. Nothing on the TV is uninstalled, and apps the lists mark keep or never can't be hidden. Announce each change and confirm the visible result with the owner.

Debloat lists live in `debloat/brands/` and come from `debloat/research/`; change them by editing the research or `debloat/research/sony-tested.txt` and running `npm run build:lists`, and run `npm run check:debloat` after changing anything in `debloat/` or `android/*.sh`. Never loosen a keep or never verdict to get past a refusal on someone's TV.

## Install your own Samsung copy

Use a local agent with access to your computer. A cloud-only agent can edit the repo but cannot reach your TV through this source alone. Start with this prompt:

```text
Read AGENTS.md and docs/agent-tv-setup-guide.md. Help me install my own
copy of FoyerLauncher on my Samsung The Frame. My model/firmware is:
<supply it, or help me find it on the TV>.

First preview the public-font app locally. Then inspect the reference
signing/device scripts and make a plan for my OS, SDK and TV. Create
my own Samsung signing profile and app identity; use the installed-app
IDs from my TV. Keep credentials and device details in ignored local
configuration. I will complete account sign-in and verification myself.

Prepare one stage at a time. Ask before the first device connection
and announce installs, launches and restarts. Confirm visible results
with me. Stop before native Home/startup changes; installation alone
does not authorise those changes. Keep a private setup/recovery record.
```

The setup guide supplies the stage-by-stage instructions and completion criteria. A fork needs coordinated changes to the manifest, identity assertions in `scripts/check.py`, signing profile, device launch/self-filter logic and native helper target if used. The identity in `app/config.xml` belongs to an existing installation; it is not another user's signing setup.

## Samsung native Home and startup

This is an optional, undocumented firmware-specific experiment. Read the native section of the setup guide and `scripts/native-home/README.md`. Check the actual model, firmware, API capability, user permissions and original values. Query/inspect also stages temporary files, so it is a device operation. The helper has hard-coded guards for the reference TV and requires private compiled output and a recovery baseline.

Prepare exact-value apply and restore commands for the owner's own app ID before requesting authority to execute them. Test rollback, confirm the physical Home destination and keep unknown power-on/Art Mode behaviour marked unknown. The guide's native-stage prompt is the separate authorisation point. A successful launch callback or settings readback is insufficient proof.

## Public distribution

Run `npm run check:public` and `npm run export:public`. The latter is an offline unsigned export that always excludes proprietary fonts, even when they are present locally. Do not upload a personal signed widget or APK as the public release. Read the third-party notices and the [publication checklist](public-release.md). Repo visibility, release uploads and history changes need their own explicit instruction.
