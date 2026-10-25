# Debloat research: other TV brands

Researched 25 October 2026, from public sources only. Nothing was run on any TV except read-only checks on one tested Sony, noted below. Every package in the detailed files comes from a page that was actually read, with its URL; packages mentioned by only one source are marked "1 source" or "1 project".

| File | Covers |
|---|---|
| [google-chromecast-onn-fire-tv.md](google-chromecast-onn-fire-tv.md) | Google's own packages on every Android TV / Google TV; Chromecast with Google TV, Google TV Streamer; Walmart onn.; Amazon Fire TV; a note on Samsung, LG and Roku |
| [tcl-hisense-xiaomi.md](tcl-hisense-xiaomi.md) | TCL, Hisense (Android / Google TV models), Xiaomi / Redmi / Mi Box |
| [philips-sharp-panasonic-toshiba-shield.md](philips-sharp-panasonic-toshiba-shield.md) | Philips, Sharp, Panasonic, Toshiba, Nvidia Shield |

Each file has, per brand: which models and OS versions it applies to and how confident the findings are; a table of packages with a verdict (**bloat**, **your call**, **keep**, **never**) and sources; a "never disable" list; problems people reported after debloating; and every URL used.

## How much to trust it

- **One project dominates.** Most per-model evidence comes from [CleanYourTV](https://github.com/Gathin23/cleanyourtv) (MIT, about 32,000 stars, updated 24 October 2026), which keeps one tested `debloat.txt` per TV model: 62 TCL, 11 Hisense/Vidda, 32 Xiaomi, 34 Sony and lists for every other brand here. A package disabled in 40 of its lists is one project's convention tested on 40 TVs, not 40 independent opinions. Other sources (gists, GitHub scripts, dumbtv, Shield Optimizer, AFTVnews, Habr, Universal Android Debloater) confirm or contradict it in places; the files say which.
- **XDA and Reddit couldn't be read** (HTTP 403, or threads didn't appear in search), so neither is used as evidence.
- **Spot-checked:** CleanYourTV exists and is MIT-licensed, and its TCL 50DP660 notes name `com.tcl.tvinput` as the tuner and `com.tcl.tv` as the Live TV app, matching the "never" verdicts.
- **Thin coverage:** Hisense outside CleanYourTV, Sharp (especially Japanese AQUOS), European Panasonic, Toshiba beyond one Vestel-built set, and onn.

## Never disable, on any brand

These are the cross-brand failures the sources report. Brand files list the vendor-specific ones.

| Package | What goes wrong |
|---|---|
| `com.google.android.apps.tv.launcherx` (Google TV home) | Chromecasts stuck restarting, needing a factory reset; even with another launcher, the YouTube/Free TV remote buttons, voice results and profiles stop working |
| `com.google.android.tvlauncher` (Android TV home), and any vendor home | No home screen; on some sets boot never finishes |
| `com.google.android.tungsten.setupwraith` (setup) | Deletes the Wi-Fi network saved during setup (TV goes offline, adb lost), breaks casting after reboot, and on the Google TV Streamer its recovery screen crash-loops; a reboot on that screen factory-reset one Xiaomi |
| `com.android.location.fused` | Boot loop (reproduced) |
| Play Services, Google Services Framework, Play Store, package installer, permission controller, core Android modules | Bricked a Mi TV Stick; apps stop installing or opening |
| Vendor tuner, input and TV service (`com.mediatek.*`, `com.tcl.tvinput`, `com.mitv.livetv`, `org.droidtv.eum`…) | HDMI shows "No Signal", the Input button or source list disappears |
| Remote, Bluetooth and CEC pairing (`com.tcl.tcl_bt_rcu_service`, `com.mi.bluetooth`, `com.nvidia.blakepairing`…) and `com.google.android.tv.remote.service` on some sets | Remote stops working, including its microphone |
| Amlogic `com.droidlogic.*` (onn., some Xiaomi) | HDMI, picture and remote buttons |

Commonly disabled without trouble on Google TV, across brands: Google feedback, Play Games, Google TV / Play Movies (`com.google.android.videos`), YouTube Music, `netoscope`, and the Privacy Sandbox / federated learning modules.

## Can't be debloated this way

- **Samsung Tizen:** no adb on retail firmware; removing built-in apps needs root.
- **LG webOS:** only by rooting through the Homebrew Channel, which nearly all firmware since mid-2022 / webOS 9 has patched. Otherwise use its Home Promotion and Content Recommendation switches and DNS blocking.
- **Roku:** no; only its privacy settings and DNS blocking.
- **Hisense VIDAA OS (global)** and **Fire TV Sticks on Vega OS** (the Fire TV Stick 4K Select, 2025, onward): not Android.
- **Fire OS (Android-based):** about ten Amazon telemetry packages refuse `pm disable-user` ("Cannot disable a protected package"); DNS blocking is the only option for those. Fire OS also won't let another app take the Home role.

## Practices the sources agree on

- Build an allow-list from **bloat** rows only, per model, and match devices by build fingerprint or board rather than model name (Philips alone runs four unrelated platforms).
- Disable in batches of 5–10 and test the remote, inputs, picture and Wi-Fi after each.
- Wait about 15 seconds before rebooting, or some firmware won't have saved the disabled state.
- Disable vendor updaters first where they reinstall what you hide (Xiaomi's `com.xiaomi.mitv.updateservice` brings PatchWall back within minutes).
- Never choose "Factory data reset" on an Android Recovery screen after a debloat; undo the last batch instead.

## A tested Sony against CleanYourTV's 34 Sony lists

The list tested on one Sony Google TV (`sony-tested.txt`) agrees with them: the packages they disable most (Google feedback 31/34, Sony Select 29, Sony diagnostics 28, store demo 26, Play Games 26, Samba TV 25, help 25) are all on it. They disable a few more Sony packages that were present on that TV and kept, mostly out of caution:

| Package | Their lists (of 34) | Tested Sony |
|---|---|---|
| `com.sony.dtv.customersupport` | 23 | safe to keep |
| `android.autoinstalls.config.sony.bravia` (installs partner apps) | 20 | safe to keep |
| `com.sony.dtv.sonybugreportsys` | 18 | never remove (Sony system service) |
| `com.sony.dtv.demosystemsupport` | 17 | never remove (Sony system service) |
| `com.sony.dtv.b2b.vendorprotocol`, `.rs232csupport`, `.hotelmode`, `.prosettings`, `.importexport` (pro and hotel mode) | 8–16 | never remove (B2B) |
| `com.sony.dtv.usercontext` | 10 | never remove (Sony system service) |

They also disable `setupwraith` (14) and `katniss`, the Google Assistant (12); the other research shows why not to: setupwraith holds the Wi-Fi and casting credentials, and katniss is the remote's voice search.

## From research to lists

`build-lists.py` (`npm run build:lists`) turns this research into `debloat/brands/*.txt`, which `debloat.sh` and `restore.sh` use. The Sony list combines the tested list (`sony-tested.txt`, with `sony-never.txt`) with CleanYourTV's 34 Sony lists: a package they disable in 15 or more is bloat, in 5 to 14 optional. That makes three of the Sony packages above bloat by default: `customersupport` (23), `autoinstalls.config.sony.bravia` (20) and `b2b.vendorprotocol` (16, which ships disabled in some regions). A package in `sony-never.txt` is never hidden by default whatever CleanYourTV does: `sonybugreportsys` (18) and `demosystemsupport` (17) are optional, as are the other pro and hotel-mode packages and `usercontext`; the rest of that list stays never.
