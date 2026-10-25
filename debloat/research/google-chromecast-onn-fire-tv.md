# Debloat research: Google packages, Google streamers, onn., Fire TV, and non-Android TVs

Researched 2026-10-25. Web research only; nothing was run on a device.

**How to read the source columns**

- Each `[key]` is a link (reference-style Markdown); the full URL list is at the end.
- **The `CYT-*` keys all come from one project**: Gathin23/cleanyourtv, read at commit `204143007f0b`, dated 2026-10-24. Each `CYT-*` file is one owner's tested list for one device. Several `CYT-*` files together still count as **one source**.
- `UAD` is the Universal Android Debloater (next generation) list. Its removal ratings are Recommended < Advanced < Expert < Unsafe. UAD is written mostly for phones; its TV entries are short.
- "1 source" means only one independent project or page mentions the package.
- The verdicts below are mine, built from the sources. When sources disagree, the row says so.

---

## 1. Google packages found on most Android TV / Google TV devices

**Applies to:** Google TV (Android 10–14, `launcherx` home) and classic Android TV (Android 8–12, `tvlauncher` home), whatever the brand.
- The per-device evidence is mostly Google TV 14 builds from 2025–2026: Chromecast with Google TV, Google TV Streamer, onn., TCL, Xiaomi.
- The UAD and tv-detox lists are generic.

**Confidence:**
- **High** for the "never" items. Several independent sources agree, and there are written failure reports.
- **Medium** for the telemetry and ads items. Usually only UAD plus cleanyourtv mention them, but those are tested lists.
- **Low** where a row says "1 source".

**"For you" recommendations, ads rows, Free TV and the voice-results page have no package of their own on Google TV.** They live inside `com.google.android.apps.tv.launcherx` [CYT-onn25][CYT-TS].
- The official switch is **Apps only mode** (Settings > Accounts & Sign In > profile) [GSUP-appsonly].
  - It turns off Search and the Assistant.
  - Sponsored content and teasers still appear.
  - On one onn. build, Apps only mode switched the Assistant off entirely [CYT-onn23].
- **Play Protect / package verifier:** I found no separate TV package for it in any source. It ships inside the Play Store and Play Services (`com.android.vending`, `com.google.android.gms`), which every source keeps. One report says Play Protect blocked a sideloaded launcher ("unsafe app blocked"). That is a setting to change, not a package to disable [CYT-TS].

| Package | What it is | Group | Verdict | Sources |
|---|---|---|---|---|
| `com.google.android.apps.tv.launcherx` | Google TV home screen. It also hosts the "For you" recommendations, Free TV/Freeplay, the voice-search results page, the Accounts & profiles page, and the YouTube and Star remote buttons. | other | **never** | [TVD][TVD-cand][CYT-TS][CYT-cc4k][CYT-onn23][UAD] (Expert: "there's no replace probably"), [FLA][LEM] |
| `com.google.android.tungsten.setupwraith` | First-run setup wizard. Its `RecoveryActivity` is a fallback HOME that brings `launcherx` back. It holds the Cast receiver's device credentials, and it owns any Wi-Fi network joined during setup. | other | **never** (for a hide-only list) | [CYT-TS][CYT-cc4k][CYT-cchd][CYT-kirk][UAD] (Expert: "breaks volume control on Sony Bravia TV"), [TVD-cand] (never), [FLA][LEM] |
| `com.google.android.tvlauncher` | Android TV Home, the classic pre-Google-TV launcher | other | **never** (where it is the Home app) | [UAD] (Expert: "on some devices, removing this causes the device to restore default settings on the next power on"), [TVD-doc] (re-enabling it is the recovery step after a black screen) |
| `com.google.android.tvrecommendations` | "Android TV Core Services": home-screen channels and recommendations on classic Android TV. Ships *already disabled* on Chromecast with Google TV and Google TV Streamer, where `pm disable-user` fails with "Shell cannot change component state". | ads | **bloat** (sources disagree) | Safe: [TVD-cand][TVD-doc][SEUN] (removes it). Caution: [UAD] (Expert: "on some TV's has a lot frameworks"). Ships disabled: [CYT-cc4k][CYT-kirk] |
| `com.google.android.apps.tv.dreamx` | Google TV Ambient Mode screensaver (about 200 MB) | feature | **your call** | [UAD] (Recommended), [TVD] (keep it on OLED TVs for burn-in), [CYT-cc4k][CYT-onn25]. If you disable it, `screensaver_components` is left pointing at nothing [CYT-onn25]. |
| `com.google.android.backdrop` | Backdrop/Ambient screensaver (Android TV) | feature | **your call** | [UAD] ("Needed for screensaver", rated Recommended), [TVD-cand] (safe), [CYT-cc4k] (disabled together with dreamx); [CYT-cc4k-keep] keeps it |
| `com.google.android.katniss` | Google app for Android TV: Assistant and voice search | voice | **your call** | [UAD] (Advanced), [TVD-cand] (keep), [TVD-doc] (depends on use), [CYT-TS] (needed for the mic button) |
| `com.google.android.tv.assistant` | Google Assistant for TV (some builds only) | voice | **your call** | [TVD-cand][TVD-doc]. 1 source. |
| `com.google.android.tv.remote.service` | Android TV Remote Service: phone-remote pairing and the phone keyboard (`ImeBridgeService`). On some boxes it also carries the Bluetooth remote's microphone. | voice | **keep** (sources disagree) | [CYT-TS] (mic dead without it on Xiaomi Box S 3 and TCL G10), [CYT-onn25] (mic dead on the onn. 4K Plus), [TVD] (optional; `undo.sh` does not re-enable it). Bloat: [UAD] (Recommended) |
| `com.google.android.apps.mediashell` | Chromecast built-in (Cast receiver) | feature | **your call** | [UAD] (Expert), [TVD-doc] ("never" if you cast), [CYT-cc4k] (kept), [CYT-onn25] (disabled by choice) |
| `com.google.android.videos` | "Google TV" app (formerly Play Movies & TV) | streaming | **bloat** | [UAD] (Recommended), [TVD-cand] (safe), [CYT-cc4k][CYT-cchd] (re-enable it for purchased titles) |
| `com.google.android.play.games` | Google Play Games | store | **bloat** | [UAD][TVD-cand][CYT-cc4k][CYT-onn25] |
| `com.google.android.youtube.tvmusic` | YouTube Music for TV | streaming | **bloat** | [UAD] (Recommended), [TVD-cand] (safe), [CYT-onn25] |
| `com.google.android.youtube.tv` | YouTube for TV | streaming | **your call** | [UAD] (Recommended), [CYT-onn25] (off by choice) |
| `com.google.android.feedback` | Google feedback and crash-report sender | telemetry | **bloat** | [UAD] (Recommended), [TVD-cand] (safe), [CYT-cc4k][CYT-onn23] |
| `com.android.tv.feedbackconsent` | TV feedback consent screen | telemetry | **bloat** | [CYT-cc4k][CYT-onn23]. 1 source. |
| `com.google.android.tv.remotecontrol.logging` | Remote-control usage logging | telemetry | **bloat** (sources disagree) | [CYT-cc4k][CYT-kirk] (disabled with no problems). [UAD] (Expert: "Needed for logging?") |
| `com.google.android.apps.tv.netoscope` | Connectivity diagnostics | telemetry | **bloat** | [UAD] (Recommended: "not needed"), [CYT-cc4k] |
| `com.google.android.tv.bugreportsender` | Bug-report app | telemetry | **bloat** | [UAD] (Recommended). 1 source. |
| `com.google.android.adservices.api` | Privacy Sandbox ad services (Android 13+) | ads | **bloat** | [UAD] (Recommended), [CYT-cc4k] ("re-enable if the Play Store or Assistant misbehave") |
| `com.google.android.ext.adservices.api` | Privacy Sandbox ad services (ext module) | ads | **bloat** | [CYT-cc4k][CYT-kirk]. 1 source. |
| `com.google.android.federatedcompute` | Federated learning (Android 13+) | telemetry | **bloat** | [UAD] (Recommended), [CYT-cc4k] |
| `com.google.android.ondevicepersonalization.services` | On-device personalisation (Privacy Sandbox) | ads | **bloat** | [UAD] (Recommended), [CYT-cc4k] |
| `com.android.adservices.api`, `com.android.ondevicepersonalization.services`, `com.android.federatedcompute.services` | The same modules under AOSP names (onn. builds) | ads | **bloat** | [CYT-onn25][CYT-onn23]. 1 source. |
| `android.autoinstalls.config.google.gtvpai` | Play Auto Installs config stub, read only during setup | other | **bloat** | [CYT-cchd]. 1 source. |
| `com.google.android.marvin.talkback` | Android Accessibility Suite (TalkBack) | feature | **your call** | [UAD] (Advanced), [TVD-cand] (keep), [CYT-cc4k] (disabled) |
| `com.google.android.tts` | Google text-to-speech | feature | **your call** | [UAD] (Advanced), [TVD-cand] (keep) |
| `com.android.printspooler` | Print spooler (AOSP) | other | **bloat** (one warning) | [TVD-cand] (safe), [CYT-cc4k][CYT-onn25]. [UAD] (Expert) says disabling breaks a connection-preferences submenu on most devices; that is a phone-oriented note. |
| `com.google.android.apps.education.cast2class` | Ships disabled on Chromecast and Streamer; `pm` refuses to change it | other | **keep** (leave as shipped) | [CYT-cc4k][CYT-kirk]. 1 source. |
| `com.google.android.tv.dfuservice` | Firmware updates for the remote control | updater | **keep** | [UAD] (Expert), [CYT-cc4k][CYT-onn23] (kept on purpose) |
| `com.google.android.tv.axel` | Android TV IR/remote service: volume setup and remote audio routing | other | **keep** | [UAD] (Expert: "Needed for volume setup"), [CYT-cchd][CYT-onn25] (kept) |
| `com.google.android.inputmethod.latin` | Gboard (the TV keyboard) | other | **keep** | [UAD] (Advanced: may lock you out without another keyboard), [TVD-cand] (never), [CYT-cc4k] (kept) |
| `com.google.android.leanback.ime` | Leanback keyboard (older Android TV) | other | **keep** | [TVD-cand] (never). 1 source. |
| `com.google.android.partnersetup` | Google Partner Setup | other | **keep** (sources disagree) | [TVD-cand] (never). [UAD] (Advanced: "Probably safe to disable") |
| `com.google.android.onetimeinitializer` | One-time initialiser for first setup | other | **keep** (sources disagree) | [TVD-cand] (never). [UAD] (Recommended, phone-oriented) |
| `com.google.android.webview` | Android System WebView | other | **keep** | [UAD] (Expert), [TVD-cand] (keep) |
| `com.google.android.tv` | Live Channels (tuner app) on some sets | feature | **your call** | [UAD] (Expert). 1 source. |
| `com.google.android.tv.frameworkpackagestubs` | Activity stubs (browser provider) | other | **keep** | [UAD] (Expert). 1 source. |
| `com.google.android.chromecast.chromecastservice` | Cast support service (some builds) | feature | **keep** | [UAD] (Expert: "Needed for broadcast support?"). 1 source. |
| `com.google.android.gms` | Google Play Services | store | **never** | [TVD][TVD-cand][UAD] (Expert) |
| `com.google.android.gsf` | Google Services Framework | store | **never** | [TVD-cand][UAD] (Expert) |
| `com.android.vending` | Play Store, which also contains Play Protect | store | **never** | [TVD-cand][UAD] (Expert), [CYT-cc4k] (kept) |
| `com.google.android.packageinstaller` | Package installer and permissions UI | other | **never** | [UAD] (Unsafe: "could bootloop"), [TVD-cand][CYT-TS] (#884) |
| `com.google.android.permissioncontroller` | Permission controller (Mainline) | other | **never** | [UAD] (Unsafe), [TVD-cand][CYT-TS] (#884) |
| `com.google.android.ext.services` | ExtServices Mainline module | other | **never** | [UAD] (Unsafe), [CYT-TS] (#884) |
| `com.google.android.ext.shared`, `com.google.android.modulemetadata`, `com.google.android.overlay.modules.*` | Android Mainline and core module packages | other | **never** | [CYT-TS] (#884). 1 source. |
| `com.android.tv.settings`, `com.android.providers.tv` | TV Settings app; TV listings provider | other | **never** | [UAD] (Unsafe), [TVD-cand] (never) |

### Never disable (Google, all brands)

- **`com.google.android.apps.tv.launcherx`**: the Google TV home screen.
  - tv-detox says turning it off left "some Google TVs (like Chromecast) stuck restarting, and the only fix was a factory reset" [TVD].
  - Disabling it before a replacement launcher is installed and set leaves Home on a factory or test app, or on a black screen [CYT-TS][TVD-doc].
  - Even with a working replacement, you lose the following [CYT-TS][CYT-cc4k][CYT-onn23][LEM][FLA]:
    - the YouTube, Star and Free TV remote buttons
    - voice-search results for titles
    - the Accounts & profiles page
- **`com.google.android.tungsten.setupwraith`**:
  - It deletes the Wi-Fi network saved during setup, so the TV goes offline and ADB is lost [CYT-TS].
  - It kills phone casting after the next reboot ("Untrusted device") [CYT-TS].
  - When it wins HOME, it causes a system_server crash loop [CYT-TS][CYT-kirk].
  - On a Xiaomi set, a reboot on its recovery screen factory-reset the TV [CYT-TS].
  - UAD reports broken volume control on Sony BRAVIA [UAD].
  - It is the one package that replacing the launcher requires you to disable [FLA][LEM][CYT-TS], so a hide-only list should leave it alone.
- **`com.google.android.tvlauncher`** (where it is Home): on some devices, removing it triggers a reset to default settings at the next power-on [UAD].
- **`com.google.android.gms`, `com.google.android.gsf`, `com.android.vending`**: the Play stack. Every source keeps these [TVD-cand][UAD].
- **`com.google.android.packageinstaller`, `com.google.android.permissioncontroller`, `com.google.android.ext.services`, `com.google.android.ext.shared`, `com.google.android.modulemetadata`, `com.google.android.overlay.modules.*`**: disabling these together (plus launcherx and setupwraith) left an original Mi TV Stick unable to boot [CYT-TS] (issue #884). UAD rates them Unsafe [UAD].
- **`com.android.tv.settings`, `com.android.providers.tv`**: rated Unsafe by UAD [UAD] and "never" by tv-detox [TVD-cand].

### Known problems after debloating (Google packages)

- **Home lost or stuck**:
  - launcherx disabled before a new launcher is ready leaves Home on a factory app, a black screen or a restart loop [TVD][CYT-TS].
  - On Acer R4G and Panasonic MOKA boards, firmware re-enables setupwraith at every cold boot, so Home went black after a power cut [CYT-TS].
- **The setupwraith Wi-Fi trap**: a network joined during setup belongs to setupwraith, and disabling setupwraith deletes it. Seen on Sony BRAVIA 9 II, Philips, Skyworth, Xiaomi, TCL, onn. and Chromecast HD [CYT-TS][CYT-cchd].
  - Check with `dumpsys wifi | grep -o 'cname=[^ ]*'`.
  - Forget the network and re-join it first.
- **Voice**:
  - The mic button goes dead if `com.google.android.tv.remote.service` is disabled, even when `katniss` is enabled [CYT-TS].
  - Voice search for titles fails ("Google Assistant is having trouble processing your request") once launcherx is disabled [CYT-TS].
- **The tvrecommendations ads saga (classic Android TV, 2019)**: sponsored rows came from an Android TV Core Services update. Users reported the ads returned after a restart even when it was disabled [search summary of Android Police / Android Central coverage; the articles themselves would not load, so this is not verified].
- **Updates undo the cleanup**: a firmware update re-enables the listed packages and puts back the stock Home [CYT-TS].
- **Timing**: rebooting less than about 10 seconds after `pm disable-user` can lose the change, because package state is written lazily. Wait about 15 seconds [CYT-TS].
- **Unverified**: one blog says disabling launcherx breaks the input switcher on physical Google TV sets but not on streamers. I only saw this in a search snippet; the page returned 403 [FREYA].

---

## 2. Chromecast with Google TV (4K `sabrina`, HD `boreal`) and Google TV Streamer (`kirkwood`)

**Applies to:**
- Chromecast with Google TV 4K (2020) and HD (2022), both on Google TV 14 build `UTTC.250917.004`.
- Google TV Streamer (2024) on `UTTK.260317.003`.

**Confidence:**
- Medium-high for the Chromecasts. They have two independent sources for the launcher swap, and cleanyourtv's lists were tested over days on two units each.
- Medium for the Streamer: one source, one unit.

The Section 1 table applies. Everything in the table below was disabled on these devices with no problems unless a note says otherwise.

**Device facts:**
- `tvrecommendations` and `cast2class` already ship disabled on all three devices [CYT-cc4k][CYT-kirk].
- The HD has no `netoscope` [CYT-cchd].
- Port 5555 stays closed until you pair once through Wireless debugging, then run `adb tcpip 5555`. Port 5555 closes again on every reboot on the HD [CYT-cc4k][CYT-cchd].

| Package | What it is | Group | Verdict | Sources |
|---|---|---|---|---|
| `com.google.android.feedback`, `com.android.tv.feedbackconsent`, `com.google.android.tv.remotecontrol.logging` | Feedback and remote logging | telemetry | **bloat** | [CYT-cc4k][CYT-cchd][CYT-kirk] (1 project), [UAD] (feedback) |
| `com.google.android.apps.tv.netoscope` | Network diagnostics (4K only) | telemetry | **bloat** | [CYT-cc4k][UAD] |
| `com.google.android.federatedcompute`, `com.google.android.ondevicepersonalization.services`, `com.google.android.adservices.api`, `com.google.android.ext.adservices.api` | Privacy Sandbox and federated learning | ads | **bloat** | [CYT-cc4k][CYT-kirk][UAD] (except ext.adservices) |
| `android.autoinstalls.config.google.gtvpai` | Play Auto Installs stub (HD) | other | **bloat** | [CYT-cchd]. 1 source. |
| `com.google.android.play.games`, `com.google.android.videos` | Play Games; Google TV / Play Movies app | store / streaming | **bloat** | [CYT-cc4k][UAD][TVD-cand] |
| `com.google.android.marvin.talkback` | Screen reader | feature | **your call** | [CYT-cc4k][UAD] |
| `com.google.android.apps.tv.dreamx`, `com.google.android.backdrop` | Ambient screensaver | feature | **your call** | [CYT-cc4k] (disable only if another screensaver is set); [CYT-cc4k-keep] keeps them |
| `com.google.android.katniss`, `com.google.android.apps.mediashell`, `com.google.android.tv.remote.service` | Assistant; Cast receiver; phone remote | voice / feature | **keep** (cleanyourtv kept all three on purpose) | [CYT-cc4k][CYT-cchd][CYT-kirk] |
| `com.google.android.tv.dfuservice`, `com.google.android.tv.overlay.dfuservice` | Remote firmware updates (overlay on the Streamer) | updater | **keep** | [CYT-kirk][UAD] (dfuservice) |
| `com.google.android.tv.axel` | Remote pairing and TV-control setup (HD) | other | **keep** | [CYT-cchd][UAD] |
| `com.netflix.tokenmanager` | Netflix partner token service (only serves Netflix) | streaming | **your call** | kept on the HD [CYT-cchd]; disabled on the onn. 4K Plus [CYT-onn25]. 1 source. |
| `com.google.android.apps.tv.launcherx` | Google TV home | other | **never** | [TVD][CYT-cc4k][FLA][LEM] |
| `com.google.android.tungsten.setupwraith` | Setup wizard, Cast credentials, fallback HOME | other | **never** (for a hide-only list) | [CYT-cc4k][CYT-cchd][CYT-kirk][CYT-TS] |

### Never disable (Chromecast and Streamer)

- **`com.google.android.apps.tv.launcherx`**: on a Chromecast, turning it off "left them stuck restarting… the only fix was a factory reset" [TVD].
- **`com.google.android.tungsten.setupwraith`**: the Cast receiver (`mediashell`) loads its factory device credentials from `CastInfoProvider` inside setupwraith [CYT-cc4k][CYT-cchd][CYT-kirk][CYT-TS].
  - After the next reboot, phone casting fails with "Untrusted device… couldn't be verified".
  - The workaround is to re-enable setupwraith after every boot, wait for `ClientAuthSigner` in the log, then disable it again. A third-party "Cast Fix" app automates this.
  - On the HD, setupwraith also owns the Wi-Fi network joined during setup, and the HD has no Ethernet [CYT-cchd].
  - On the Streamer, when setupwraith wins HOME, system_server crash-loops about every 47 s [CYT-kirk].
  - `pm hide` and component-level disables are refused (SecurityException) [CYT-kirk].
- **`com.google.android.gms`, `com.android.vending`, Gboard (`com.google.android.inputmethod.latin`)**: kept on purpose [CYT-cc4k].

### Replacing the launcher on these devices (what actually happens)

- The documented recipe is `pm disable-user --user 0 com.google.android.apps.tv.launcherx`, then the same for `com.google.android.tungsten.setupwraith`. Without the second step, setupwraith acts as a fallback and re-enables launcherx [FLA][LEM]. FLauncher tested this only on the Chromecast with Google TV.
- `cmd package set-home-activity` prints `Success` but changes nothing. On the Streamer, the replacement launcher's `android:priority` and the HOME role are both ignored [CYT-cc4k][CYT-kirk].
- What you lose [LEM][FLA][CYT-cc4k][CYT-kirk]:
  - The YouTube button (BUTTON_3 / keycode 190) stops working. The Netflix button keeps working on the Chromecast but stops on the Streamer.
  - The Star button stops working.
  - Key Mapper or Button Mapper can bring them back, but an accessibility helper can stop held-key repeat on volume.
- Projectivy's built-in home "override" stopped working after a 2025 Google TV update [search summary of Android Authority; the article returned 403, so this is not verified].

### Known problems (Chromecast and Streamer)

- Casting breaks after the next reboot once setupwraith is disabled [CYT-TS][CYT-cchd][CYT-kirk].
- Wi-Fi is lost when setupwraith is disabled while it owns the saved network [CYT-cchd].
- The remote buttons listed above die with launcherx disabled [LEM][CYT-cc4k].
- The HD has only 1.4 GB RAM and a /data partition 82% full out of the box [CYT-cchd].
- A Chromecast HD stuck on boot could not be factory reset. That report is unrelated to debloating, but it shows recovery is not guaranteed [TECHENCLAVE] (search summary only).

---

## 3. Walmart onn. Google TV boxes

**Applies to:**
- onn. 4K Streaming Box (2023, device `YOC`), Google TV 14 build `URO4.260304.011.B1.15051976`, tested on two units (US and Vietnam).
- onn. 4K Plus (2025, device `coffey`), same build.

**Confidence:** medium. The only package-level source I could read is cleanyourtv. A Reddit onn. debloat thread is referenced on Lemmy, but I could not open it. I found no onn. stick list.

**What differs from the Chromecast:**
- Port 5555 opens as soon as USB debugging is on.
- Amlogic `com.droidlogic.*` vendor packages and onn.'s `com.gretzky.*` and `com.onn.*` packages are present.
- `com.google.android.videos` is not preinstalled [CYT-onn23][CYT-onn25].

| Package | What it is | Group | Verdict | Sources |
|---|---|---|---|---|
| `com.google.android.feedback`, `com.android.tv.feedbackconsent` | Feedback | telemetry | **bloat** | [CYT-onn23][CYT-onn25][UAD] (feedback) |
| `com.android.adservices.api`, `com.android.ondevicepersonalization.services`, `com.android.federatedcompute.services` | Privacy Sandbox APEX modules | ads | **bloat** | [CYT-onn23][CYT-onn25]. 1 source. |
| `com.google.android.play.games`, `com.android.printspooler` | Play Games; printing | store / other | **bloat** | [CYT-onn25][UAD][TVD-cand] |
| `com.google.android.marvin.talkback` | Screen reader | feature | **your call** | [CYT-onn25] |
| `com.google.android.apps.tv.dreamx` | Ambient screensaver | feature | **your call** | [CYT-onn25] (disabled); [CYT-onn23] (kept, because the Google Photos slideshow needs it) |
| `com.google.android.youtube.tv`, `com.google.android.youtube.tvmusic`, `com.netflix.ninja`, `com.netflix.tokenmanager`, `com.google.android.apps.mediashell` | Preloaded streaming apps; Netflix token service; Cast receiver | streaming / feature | **your call** | [CYT-onn25] (off by owner's choice). 1 source. |
| `com.google.android.tv.remote.service` | Phone remote, and the onn. 4K Plus Bluetooth remote's **microphone** | voice | **keep** | [CYT-onn25] ("with it disabled the mic button does nothing at all"), [CYT-TS] |
| `com.google.android.katniss` | Voice / Gemini | voice | **your call** (kept by the tester) | [CYT-onn25][CYT-onn23] |
| `com.onn.updatenotification` | onn. update prompts | updater | **keep** | [CYT-onn23][CYT-onn25]. 1 source. |
| `com.gretzky.GlobalKey` | onn. remote app buttons | other | **keep** | [CYT-onn23][CYT-onn25]. 1 source. |
| `com.gretzky.hwinfo` | onn. hardware info | other | **keep** | [CYT-onn23]. 1 source. |
| `com.onn.bluetoothconnect` | Bluetooth remote setup | other | **keep** | [CYT-onn23][CYT-onn25]. 1 source. |
| `com.droidlogic.*` | Amlogic vendor packages: HDMI, picture, remote buttons and pairing | other | **never** | [CYT-onn23][CYT-onn25]. 1 source. |
| `com.google.android.tv.dfuservice`, `com.google.android.tv.axel` | Remote firmware updates; remote audio routing | updater / other | **keep** | [CYT-onn25][UAD] |
| `com.google.android.apps.tv.launcherx` | Google TV home | other | **never** | [CYT-onn23][CYT-onn25][TVD] |
| `com.google.android.tungsten.setupwraith` | Setup wizard and fallback HOME; owns setup Wi-Fi | other | **never** (for a hide-only list) | [CYT-onn23][CYT-onn25] |

### Never disable (onn.)

- **`com.droidlogic.*`**: Amlogic vendor packages for HDMI, picture and remote buttons [CYT-onn23][CYT-onn25]. 1 source.
- **`com.google.android.apps.tv.launcherx`, `com.google.android.tungsten.setupwraith`**: same reasons as Section 1.
  - On the onn. 4K box, *every* network saved during setup was owned by setupwraith, including one out of range, and all of them were deleted when it was disabled [CYT-onn23].
- **`com.google.android.tv.remote.service`**: on the 4K Plus, the remote's mic dies without it [CYT-onn25]. This is "keep" rather than "never", since the box keeps working.

### Known problems (onn.)

- With launcherx disabled [CYT-onn23][CYT-onn25]:
  - On the 2025 4K Plus, the YouTube and Free TV buttons die (Netflix, Disney+ and Paramount+ still work through `com.droidlogic`'s GlobalKeyReceiver).
  - On the second 2023 unit, the YouTube, profile and Settings buttons die.
  - Voice search for titles fails [CYT-onn23].
- Casting with setupwraith disabled was not tested on onn.; the Chromecast behaviour may apply [CYT-onn23].

---

## 4. Amazon Fire TV (Fire OS 5–8) and Fire TV Edition TVs

**Applies to:**
- Fire TV sticks and boxes on Fire OS 6.7 (Android 7.1), Fire OS 7.6–7.7 (Android 9) and Fire OS 8.0–8.1.8 (Android 11).
- Fire TV Edition TVs from Amazon (Omni/4-series), Toshiba, Hisense and TCL.

**Does not apply to:**
- **Vega OS devices.** Amazon says all Fire TV Sticks from the Fire TV Stick 4K Select (2025) onward run Vega OS, which is Linux-based, not Android, so there is no `pm` and no Android packages [AFTV-vega1][AFTV-vega2][AFTV-vega3].
- **Fire OS 5.** On a 2015 Fire TV box, `pm disable-user`, `pm uninstall --user 0` and `pm hide` were all refused or did nothing [CYT-TS].

**Confidence:**
- Medium-high for ads and telemetry. Three independent projects (dumbtv, cleanyourtv, firestrip) agree on most of them.
- Medium for Alexa. The sources disagree on whether voice survives.
- The "protected" list is consistent across many cleanyourtv units.
- Descriptions of several Amazon packages *conflict* between sources; this is flagged per row.

**Key platform facts:**
- **Amazon blocks `pm disable-user` on a set of "protected" packages**: `Cannot disable a protected package` [CYT-firestick23][CYT-lite20][CYT-stick18][CYT-afteu014][DUMB].
- **The home screen cannot be replaced.**
  - `com.amazon.tv.launcher` and `com.amazon.firehomestarter` are protected.
  - `set-home-activity` prints Success and is ignored.
  - A third-party launcher's HOME priority is ignored, and Amazon's own sits at 950 [CYT-TS][CYT-toshiba][CYT-afteu014].
  - firestrip says devices with "recent security patches (December 2025+)" refuse to disable the launcher [FS-readme].
  - Amazon has fought alternate launchers for a long time: a 2016 blacklist [AFTV-2016], the "Not In My House" (`com.amazon.tv.nimh`) blocklist app in 2016 [AFTV-nimh], and 2022 updates that blocked custom launchers [XDA-2022].
  - Since Fire OS 7.6.6.9 / 8.1.0.3, *apps* on the device can no longer open local ADB connections. ADB from a PC still works [CHAN].
- **The sponsored rows and hero banner are fetched by the launcher itself**, so no package list removes them. DNS blocking such as `amazon-adsystem.com` helps partly [CYT-stick18][CYT-firestick23][CYT-afteu014].

| Package | What it is | Group | Verdict | Sources |
|---|---|---|---|---|
| `com.amazon.tv.acr` | Automatic Content Recognition (fingerprints screen and HDMI content; TVs only) | telemetry | **bloat** | [DUMB][CYT-afttiff43][CYT-firestick23][FS] |
| `com.amazon.hybridadidservice` | Advertising ID service | ads | **bloat** | [DUMB][CYT-firestick23][CYT-lite20][FS] |
| `com.amazon.privacypassservice` | Privacy Pass tokens for Amazon's ad system | ads | **bloat** | [DUMB][CYT-firestick23] |
| `com.amazon.sneakpeek` | Sponsored autoplay "Sneak Peek" previews | ads | **bloat** | [DUMB][CYT-firestick23][FS] |
| `com.amazon.media.recommendations` | Recommended and sponsored home rows | ads | **bloat** | [DUMB][CYT-firestick23][CYT-hisense] |
| `com.amazon.kso.blackbird` | Launcher ad sync and bidding | ads | **bloat** | [CYT-firestick23][CYT-lite20][FS] |
| `com.amazon.shoptv.client`, `com.amazon.shoptv.firetv.client` | Amazon Shopping / Live Shopping on TV | ads | **bloat** | [DUMB][CYT-firestick23][FS] |
| `com.amazon.systemnotices`, `com.amazon.uxnotification` | Promotional notices and pop-ups | ads | **bloat** | [DUMB][CYT-firestick23] |
| `com.amazon.tv.easyupgrade` | "Upgrade your Fire TV" promos | ads | **bloat** | [DUMB][CYT-firestick23] |
| `com.amazon.device.sale.service` | Sale notifications | ads | **bloat** | [CYT-stick18][CYT-afteu014][FS] |
| `com.amazon.tv.releasenotes`, `com.amazon.tv.earlyaccess` | "What's new" notes; early-access stub | demo | **bloat** | [DUMB][CYT-firestick23] |
| `com.amazon.tv.website_launcher` | Opens promo or web pages in Silk | ads | **your call** | [DUMB] (promo pages), [CYT-firestick23] (owner's choice); kept on [CYT-4kmax21] |
| `com.amazon.hedwig` | Descriptions conflict: "records watch time and engagement" [DUMB]; "Fire TV Channels" [CYT-firestick23]; "Amazon News app" [FS] | telemetry | **bloat** (description disputed; all three disable it) | [DUMB][CYT-firestick23][FS] |
| `com.amazon.tv.fw.metrics`, `com.amazon.wirelessmetrics.service`, `com.amazon.perfc`, `com.amazon.perfcollection` | UI, Wi-Fi and performance metrics | telemetry | **bloat** | [DUMB][CYT-lite20][CYT-afttiff43][FS] |
| `com.amazon.neo.minerva`, `com.amazon.neo.minerva.logcat` | Metrics pipeline and system logs | telemetry | **bloat** | [DUMB] (logcat), [CYT-lite20][CYT-afttiff43] |
| `com.amazon.dp.logger` | Device-platform logging | telemetry | **bloat** (sources disagree) | [DUMB][CYT-lite20][CYT-firestick23]. [FS] marks it risky ("REMOTE-APP") |
| `com.amazon.ceviche` | Analytics pipeline ([DUMB][CYT-firestick23]) or "Live TV guide aggregator" ([ROY]) | telemetry | **bloat** (description disputed) | [DUMB][CYT-firestick23][ROY][FS] |
| `com.amazon.client.metrics.api`, `com.amazon.metrics.api` | Client metrics API | telemetry | **bloat** (one warning) | [CYT-firestick23][CYT-stick18]. [FS] marks them risky: "SETTINGS-UI on FireOS 5.2.6.3" |
| `com.amazon.tv.developer.dataservice` | Personalisation data for third-party apps | telemetry | **bloat** | [DUMB][CYT-firestick23] |
| `com.amazon.livedeviceservice` | Device presence service | telemetry | **bloat** | [CYT-firestick23][CYT-lite20]. 1 source. |
| `com.amazon.wifilocker` | Uploads saved Wi-Fi passwords to Amazon | telemetry | **bloat** | [CYT-firestick23][FS] |
| `com.amazon.device.telemetry.emitter` | Fire OS 8 telemetry emitter (its native emitter keeps running anyway) | telemetry | **bloat** | [CYT-firestick23][CYT-tcl-fire]. 1 source. |
| `com.amazon.ftvspatial` | Presence and indoor-location sensing | telemetry | **bloat** | [CYT-firestick23]. 1 source. |
| `com.amazon.spiderpork` | "carries metrics to Amazon" | telemetry | **bloat** | [DUMB][CYT-tcl-fire] |
| `com.amazon.connectivitydiag` | Network diagnostics reporting | telemetry | **your call** | [DUMB] (disables it), [FS] (safe); cleanyourtv left it alone because its role is unclear [CYT-afteu014] |
| `com.amazon.ale`, `com.amazon.katoch`, `com.amazon.device_remote_config_sync_service` | Experiments, feature flags, remote config | telemetry | **your call** | [DUMB]; cleanyourtv left `katoch` alone [CYT-afteu014]; [FS] (`ale` described as "Alexa Language Engine") |
| `com.amazon.tv.democontent.provider` | Store-demo content | demo | **bloat** | [DUMB][CYT-afttiff43][CYT-toshiba] |
| `com.amazon.storm.lightning.tutorial`, `com.amazon.tmm.tutorial` | Built-in tutorials | demo | **bloat** | [DUMB][CYT-firestick23] |
| `com.amazon.dummy.alarmclock`, `.calendar`, `.contacts`, `.gallery`, `.music`, `.settings` | Empty placeholder apps | demo | **bloat** | [DUMB]. 1 source. |
| `com.amazon.naatyam`, `com.amazon.minitv.android.app` | India content stub; Amazon miniTV | streaming | **bloat** | [DUMB] (miniTV), [CYT-afttiff43][FS] |
| `com.amazon.gamehub` | Games / Luna hub | streaming | **bloat** | [DUMB][CYT-firestick23] |
| `com.amazon.bueller.music`, `com.amazon.bueller.photos` | Amazon Music; Amazon Photos | streaming | **your call** | [DUMB][CYT-firestick23][ROY] (keep Photos if it is your screensaver) |
| `com.amazon.imdb.tv.android.app`, `com.imdb.livingroom.firetv` | Freevee; IMDb | streaming | **your call** | [DUMB][CYT-stick18] |
| `com.amazon.cloud9` | Silk browser | feature | **your call** | [DUMB][CYT-firestick23]; kept on [CYT-4kmax21] |
| `com.amazon.tahoe` | Described as Amazon Kids (FreeTime) [CYT-firestick23][FS], but "paints ad and content tiles on the home screen" [DUMB] | feature | **your call** (description disputed) | [CYT-firestick23][FS][DUMB] |
| `com.amazon.tv.localgallery` | USB photos and videos | feature | **your call** | [DUMB][CYT-afttiff43] |
| `com.amazon.tv.ftvambient` | Ambient Experience screensaver | feature | **your call** | [CYT-firestick23][CYT-hisense] (on Fire OS 8 a third-party screensaver never shows) |
| `com.amazon.ftv.screensaver` | Plain screensaver | feature | **your call** | [DUMB] ("without it, nothing covers a still picture"), [CYT-afttiff43]; [FS] marks it risky ("RISKY-UI") |
| `com.amazon.whisperjoin.middleware.np`, `com.amazon.whisperjoin.middleware.v2.np`, `com.amazon.tv.ffsprovisioneeclient` | Frustration-free setup of other Amazon devices | feature | **your call** | [CYT-firestick23][CYT-lite20]. [DUMB] lists `whisperjoin.middleware.np` as *never* ("device setup and pairing"), so sources disagree. |
| `com.amazon.ods.kindleconnect` | "Show on Fire TV" from Echo or tablets | feature | **bloat** | [CYT-firestick23][ROY] |
| `com.amazon.tv.mattercohost` | Matter smart-home controller (Matter casting `com.amazon.tv.matter` stays) | feature | **your call** | [CYT-firestick23]. 1 source. |
| `com.amazon.cast.sink`, `com.apple.airplay.amazon.airplay` | Miracast receiver; AirPlay | feature | **your call** | [CYT-toshiba][CYT-hisense][CYT-aftdec] |
| `com.amazon.tv.alexaalerts`, `com.amazon.tv.alexanotifications`, `com.amazon.alexamediaplayer.runtime.ftv`, `com.amazon.alexa.externalmediaplayer.fireos`, `com.amazon.aiondec`, `com.amazon.audiohome`, `com.amazon.whad`, `com.amazon.whasettings`, `com.amazon.wha.mediabrowserservice`, `com.amazon.spotify.mediabrowserservice`, `com.amazon.aca`, `com.amazon.rtcsessioncontroller`, `com.amazon.smarthomemapviewapp`, `com.amazon.firetv.androidskillconnectioncapability` | Alexa extras: alerts, music, multi-room, calling, smart home, skills | voice | **your call** (sources disagree) | [CYT-lite20][CYT-firestick23]: "voice search on the remote mic keeps working with all of these off". [DUMB] keeps them: disabling "removes the voice button and Alexa on the TV". [CYT-4kmax21]: with vizzini kept, these "come back enabled at every boot". |
| `com.amazon.tv.forcedotaupdater.v2` | Forced-update prompts | updater | **your call** | [DUMB] (disabled; updates blocked by DNS instead), [CYT-afteu014] (disabled); kept on [CYT-firestick23] |
| `com.amazon.device.software.ota`, `com.amazon.device.software.ota.override` | OTA updater (it can re-enable disabled packages) | updater | **keep** (often protected) | protected on [CYT-afteu014]; [DUMB] ("cut off at the network"); [FS] (risky) |
| `com.amazon.providers.contentsupport` | Content-support provider; also switches the TTS engine | other | **your call** (sources disagree) | disabled on [CYT-firestick23][CYT-lite20]; kept on [CYT-afteu014] (TTS); [FS] (safe) |
| `com.amazon.tv.livetv`, `com.amazon.franktvinput` | Live tab and guide; live TV input | feature | **your call** on sticks, **never** on Fire TV Edition TVs | disabled on sticks [CYT-firestick23][CYT-lite20]; never on TVs [DUMB][FS-pkg] |
| `com.amazon.firebat` | Prime Video (Fire OS 6–7 package) | streaming | **keep** (sources disagree) | [DUMB] (never), [CYT-firestick23] (kept); disabled with no problems on [CYT-tcl-fire]; [FS] ("safe", described as a stub) |
| `com.amazon.tv.support` | Help app; Prime Video depends on it | other | **keep** (sources disagree) | [CYT-firestick23][CYT-stick18] (kept "Prime Video"). [DUMB] (safe to disable: "Help"). [FS] (safe) |
| `com.amazon.logan` | VoiceView accessibility screen reader [CYT-firestick23][FS], or "device log collection" [DUMB] | other | **keep** (description disputed) | [CYT-firestick23][CYT-afteu014][FS][DUMB] |
| `com.amazon.tigris` | Appstore UI [CYT-stick18], or "reports through the Ceviche pipeline" [DUMB] | store | **keep** (description disputed) | [CYT-firestick23][CYT-stick18][DUMB] |
| `com.amazon.tv.ime` | Fire TV keyboard | other | **keep** | [CYT-firestick23][FS] ("may break Settings") |
| `com.amazon.dialservice`, `com.amazon.awvflingreceiver`, `com.amazon.whisperplay.service.install`, `com.amazon.whisperlink.core.android` | DIAL/whisperplay casting (Netflix and YouTube from a phone) | feature | **keep** | [CYT-firestick23][CYT-stick18] (`whisperlink.core` protected on one unit); [DUMB] (`whisperplay` never). [FS] calls whisperlink "Amazon Sidewalk", which disagrees. |
| `com.amazon.tv.ottssocompanionapp`, `com.amazon.tv.matter`, `com.amazon.prism.android.service` | TV-provider sign-in; Matter casting; profiles | other | **keep** | [CYT-firestick23][CYT-lite20]. [DUMB] (sign-in is optional) |
| Protected on Fire OS 6–8 (`pm disable-user` refused): `com.amazon.device.metrics`, `com.amazon.device.logmanager`, `com.amazon.device.crashmanager`, `com.amazon.diode`, `com.fireos.usagestats.proxy`, `com.amazon.ftvads.deeplinking`, `com.amazon.tv.csapp`, `com.amazon.minerva.client.api`, `com.amazon.client.metrics` (Fire OS 6), `com.amazon.securitysyncclient` (one Fire OS 6 unit) | Telemetry, crash, ad deep links and support services | telemetry | **bloat**, but cannot be disabled without root; block their servers with DNS instead | [CYT-firestick23][CYT-lite20][CYT-stick18][CYT-afteu014][CYT-hisense][DUMB] |
| `com.amazon.tcomm` | Amazon communication service (protected on one Fire OS 6 unit; used by the remote app) | other | **keep** | [CYT-stick18][FS] ("REMOTE-APP") |
| `com.amazon.imp` | Account and app-list service | other | **never** | [CYT-firestick23] (black Home on Fire OS 8.1.8.5), [FS] ("breaks Apps list and account sign-in") |
| `com.amazon.device.messaging` | Amazon Device Messaging (push) | other | **never** (sources disagree) | [DUMB] (hung a 2025 Fire TV at the boot animation; Prime Video needs it). [FS] lists it as "safe". |
| `com.amazon.vizzini` | Alexa voice and remote service | voice | **never** (pointless and risky) | [DUMB] ("Disabling it doesn't stop it… covers the screen with 'Unable to Detect Your Remote'"), [CYT-stick18][CYT-hisense][CYT-afteu014] (re-enabled at every boot). [FS] lists it as "safe". |
| `com.amazon.tv.launcher`, `com.amazon.firehomestarter` | Home screen; boot-time home starter | other | **never** (protected anyway) | [DUMB][FS-pkg][CYT-TS][CYT-toshiba] |
| `com.amazon.tv.settings.v2`, `com.amazon.tv.settings.core`, `com.amazon.tv.settings` | Settings | other | **never** | [DUMB][FS] ("removal breaks Settings entirely") |
| `com.amazon.venezia` | Amazon Appstore | store | **never** | [UAD] ("breakage of app drawer on Amazon Fire TV devices"), [DUMB][FS] (risky) |
| `com.amazon.tv.oobe`, `com.amazon.tv.ooberesource` | First-run setup; needed for a factory reset | other | **never** | [DUMB][CYT-lite20] ("must stay enabled for a factory reset") |
| `com.amazon.webview.chromium` | Amazon WebView | other | **never** | [DUMB] ("many apps break without it"). 1 source. |
| `com.amazon.tv.inputpreference.service`, `com.amazon.tv.routing`, `com.amazon.tv.devicecontrol`, `com.amazon.tv.devicecontrolsettings`, `com.amazon.tv.keypolicymanager` | HDMI and input switching, routing, CEC, remote keys | other | **never** | [DUMB]; [FS] (risky for devicecontrol). [FS] lists `tv.routing` as safe, which disagrees. |
| `com.amazon.fireinputdevices`, `com.amazon.autopairservice`, `com.amazon.device.bluetoothpa`, `com.amazon.device.blepa` | Remote, Bluetooth and pairing | other | **never** | [DUMB][FS] (fireinputdevices risky); [CYT-afteu014] (kept) |
| `com.amazon.tifobserver`, `com.amazon.tv.channelscan`, `com.amazon.tv.conditionalaccess`, `com.amazon.mediatek.livetv`, `com.amazon.tv.settings.mediatek`, `com.mediatek.tis`, `com.mediatek.tvinput*`, `com.mediatek.dtv.tvinput.atsctuner` | TV-set tuner, inputs and MediaTek services (Fire TV Edition) | other | **never** | [DUMB][FS-pkg][CYT-afteu014] |

### Never disable (Fire OS)

- **`com.amazon.tv.launcher`, `com.amazon.firehomestarter`**: Home. They are protected on Fire OS 6–8, and Fire OS will not hand Home to anything else [DUMB][FS-pkg][CYT-TS].
- **`com.amazon.imp`**: disabling it together with 7 ad packages gave a black, unpainted Home on Fire OS 8.1.8.5; re-enabling fixed it [CYT-firestick23]. firestrip says it "breaks Apps list and account sign-in" [FS].
- **`com.amazon.device.messaging`**: it hung a 2025 Fire TV at the boot animation [DUMB].
- **`com.amazon.vizzini`**: it comes back at every boot anyway, and on some TVs disabling it causes an "Unable to Detect Your Remote" overlay [DUMB][CYT-hisense].
- **`com.amazon.tv.oobe` (+ `ooberesource`)**: needed for a factory reset [DUMB][CYT-lite20].
- **`com.amazon.venezia`**: breaks the app drawer [UAD][DUMB].
- **`com.amazon.webview.chromium`**: many apps break [DUMB].
- **The Settings packages**: Settings stops working [DUMB][FS].
- **Input, tuner and remote packages** (`tv.inputpreference.service`, `tv.routing`, `tv.devicecontrol*`, `tv.keypolicymanager`, `fireinputdevices`, `autopairservice`, `device.bluetoothpa`, `device.blepa`, `tv.livetv` on TVs, `mediatek.*`): you lose HDMI switching, the tuner or the remote [DUMB][FS-pkg].
- **Core Android** (`com.android.systemui`, `com.android.packageinstaller`, `com.android.permissioncontroller`, `com.android.providers.*`): [DUMB][FS-pkg].

### Known problems (Fire OS)

- A black Home after disabling `com.amazon.imp` plus ad packages [CYT-firestick23].
- Animation scales at 0.5x break the ☰ side menu on Fire OS 8 (every entry returns to Home) [CYT-firestick23][CYT-hisense].
- `com.amazon.vizzini` re-enables itself at every boot on Fire OS 6–8 [CYT-stick18][CYT-hisense][CYT-afteu014].
- With vizzini kept, the Alexa extras re-enable at every boot on Fire OS 7.7.1.3 [CYT-4kmax21].
- OTA updates may re-enable packages, and a reboot resets the favourites bar [CYT-stick18].
- `com.amazon.device.software.ota` "can switch disabled packages back on" [DUMB].
- With parental controls on, any non-Amazon app started over Home triggers the Prime Video PIN prompt [CYT-stick18].
- On Fire OS 8 TVs, input switching is reserved to Amazon (`TUNE_INPUT` / `LAUNCH_INPUTS` permissions are signature-level) [CYT-hisense][CYT-afteu014].
- On Fire OS 5 (2015 box), every disable method is refused, and `pm hide` lies about success [CYT-TS].
- **Sources contradict each other on several Amazon packages** (`hedwig`, `tahoe`, `logan`, `tigris`, `ceviche`, `tv.support`, `firebat`, `device.messaging`, `vizzini`, `tv.routing`, `whisperlink`). firestrip's "safe" tier includes packages that dumbtv calls never-disable (`device.messaging`, `vizzini`, `tv.routing`, `firebat`) [FS][DUMB]. Treat firestrip's tiers with caution.

---

## 5. Samsung Tizen, LG webOS, Roku: can they be debloated?

**Samsung (Tizen): no package-level debloat on retail firmware.**
- There is no ADB. Port 5555 is closed, and `sdb` (26101) is closed unless Developer Mode is on, so there is no `pm disable-user` [CYT-tizen].
- Developer Mode does not remove the preinstalled "basic set" apps. The official SamyGO developer says it is possible "Only when root. If you don't find root = no way" [SAMYGO]. SamyGO covers 2015–2023 Tizen.
- What is left [CYT-tizen][TVD]:
  - the TV's own menus: interest-based ads, viewing-information services, Smart Hub autorun
  - scripting those menus through the remote websocket on port 8002
  - DNS blocking at the router

**LG (webOS): only with root, and root is mostly patched.**
- Without root, turn off Home Promotion and Content Recommendation in the home settings [TVD].
- With root:
  - The webOS Homebrew Channel offers "(root) Disable some telemetry" [WEBOSBREW].
  - A Level1Techs guide for a rooted OLED65G5 on webOS 10.2.1 does the following [L1T]:
    - blocks LG update, telemetry, ad (`lgsmartad.com`) and ThinQ domains with hosts and DNS
    - rewrites consent files
    - warns that a factory reset wipes everything
    - warns never to accept an OS update once rooted
    - warns that blocking `.lge.com` wholesale kills the Content Store
- Root availability:
  - RootMyTV "is unlikely to work on firmware released since mid-2022" [ROOTMYTV].
  - With DejaVuln, "2024 models have been patched from the start" [DEJAVULN].
  - faultmanager-autoroot says the latest webOS 5–9 firmware is almost all patched; only factory webOS 10.0 on 2025 models was vulnerable [FAULTMGR].
  - Check cani.rootmy.tv for your firmware.

**Roku: no.**
- Roku OS is not Android, and nothing can connect to it to turn things off [TVD].
- Developer Mode only lets you sideload one dev channel at a time [HTG-roku]. Some built-in apps (The Roku Channel) cannot be deleted [search summary; source quality low].
- What is left:
  - Settings > Privacy > Smart TV Experience > untick "Use info from TV inputs" (ACR, Roku TVs only). This also turns off auto notifications [TOMS][GADGETHACKS].
  - Settings > Privacy > Advertising > untick "Personalize ads". You see the same number of ads, just not personalised [GADGETHACKS].
  - DNS blocking (Pi-hole). One user found blocking `*.logs.roku.com` also broke the live TV schedule, and needed a factory reset [PIHOLE-roku].

---

## All URLs used

[UAD]: https://github.com/Universal-Debloater-Alliance/universal-android-debloater-next-generation/blob/main/resources/assets/uad_lists.json
[TVD]: https://github.com/Ansub/tv-detox
[TVD-cand]: https://github.com/Ansub/tv-detox/blob/main/candidates.sh
[TVD-doc]: https://github.com/Ansub/tv-detox/blob/main/docs/debloat.md
[CYT-TS]: https://github.com/Gathin23/cleanyourtv/blob/main/docs/TROUBLESHOOTING.md
[CYT-cc4k]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/google-chromecast-gtv-4k/debloat.txt
[CYT-cc4k-keep]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/google-chromecast-gtv-4k/debloat-keep-cast.txt
[CYT-cchd]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/google-chromecast-gtv-hd/debloat.txt
[CYT-kirk]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/google-tv-streamer-4k-kirkwood/debloat.txt
[CYT-onn25]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/onn-4k-plus-2025/debloat.txt
[CYT-onn23]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/onn-4k-streaming-box-2023/debloat.txt
[CYT-firestick23]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/amazon-fire-tv-stick-4k-2023/debloat.txt
[CYT-lite20]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/amazon-fire-tv-stick-lite-2020/debloat.txt
[CYT-4kmax21]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/amazon-fire-tv-stick-4k-max-2021/debloat.txt
[CYT-stick18]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/amazon-fire-tv-stick-4k-2018/debloat.txt
[CYT-afttiff43]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/amazon-fire-tv-afttiff43/debloat.txt
[CYT-aftdec]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/amazon-fire-tv-aftdec012e/debloat.txt
[CYT-afteu014]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/amazon-fire-tv-afteu014/debloat.txt
[CYT-hisense]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/hisense-fire-tv-aftcibfbd1/debloat.txt
[CYT-tcl-fire]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/tcl-58s571f-fire-tv/debloat.txt
[CYT-toshiba]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/toshiba-fire-tv-aftha004/debloat.txt
[CYT-tizen]: https://github.com/Gathin23/cleanyourtv/blob/main/docs/devices/samsung-tizen.md
[FLA]: https://github.com/svrooij/flauncher
[LEM]: https://lemmy.imagisphe.re/post/352035/1134462
[GSUP-appsonly]: https://support.google.com/googletv/answer/10070784
[SEUN]: https://github.com/seun-novodev/android-tv-debloat-toolkit/blob/main/scripts/debloat_safe.sh
[FREYA]: https://g.freya.cat/website/tree/src/assets/blog/2025-03-11.md
[TECHENCLAVE]: https://techenclave.com/t/chromecast-hd-with-google-tv-stuck-on-boot-screen-reset-not-possible/390517
[DUMB]: https://dumbtv.org/blocked
[DUMB-wiki]: https://github.com/humblemuzzu/dumbtv/wiki
[FS]: https://github.com/WB2024/firestrip/blob/main/firestrip/data/packages/common.toml
[FS-pkg]: https://github.com/WB2024/firestrip/blob/main/firestrip/core/packages.py
[FS-readme]: https://github.com/WB2024/firestrip
[ROY]: https://github.com/roy9611/firetv-safe-debloat/blob/master/scripts/1_debloat_packages.sh
[AFTV-2016]: https://www.aftvnews.com/?p=13811
[AFTV-nimh]: https://www.aftvnews.com/?p=16720
[XDA-2022]: https://www.xda-developers.com/fire-tv-software-update-reportedly-blocks-custom-launchers/
[CHAN]: https://community.getchannels.com/t/firetv-update-to-disable-local-adb/39301
[AFTV-vega1]: https://www.aftvnews.com/amazon-announces-fire-tv-stick-4k-select-the-first-non-android-based-fire-tv-running-vega-os/
[AFTV-vega2]: https://www.aftvnews.com/sideloading-is-truly-dead-on-the-fire-tv-stick-4k-select-with-vega-os/
[AFTV-vega3]: https://www.aftvnews.com/tag/vega-os/page/2/
[SAMYGO]: https://forum.samygo.tv/viewtopic.php?p=80053
[WEBOSBREW]: https://github.com/webosbrew/webos-homebrew-channel
[L1T]: https://forum.level1techs.com/t/lg-tv-block-mini-how-to/255178
[ROOTMYTV]: https://github.com/RootMyTV/RootMyTV.github.io
[DEJAVULN]: https://github.com/clickandbarber/lg-webostv-dejavuln-autoroot
[FAULTMGR]: https://github.com/throwaway96/faultmanager-autoroot
[HTG-roku]: https://www.howtogeek.com/290787/how-to-enable-developer-mode-and-sideload-roku-apps/
[TOMS]: https://www.tomsguide.com/tvs/your-tv-is-watching-you-how-to-turn-off-data-collection-on-lg-samsung-roku-and-more
[GADGETHACKS]: https://cord-cutters.gadgethacks.com/how-to/how-to-stop-roku-from-tracking-what-you-watch-3-settings/
[PIHOLE-roku]: https://discourse.pi-hole.net/t/what-domain-to-whitelist-to-unblock-roku-tv-schedule/86284

**Read in full:**
- UAD JSON (downloaded)
- tv-detox README, candidates.sh and docs/debloat.md
- the cleanyourtv files listed above (local clone at commit 204143007f0b)
- dumbtv.org/blocked and the dumbtv wiki
- firestrip common.toml, packages.py and README
- roy9611's script
- the seun-novodev scripts
- FLauncher README
- the Lemmy thread
- AFTVnews 13811 and 16720
- XDA 2022
- the Channels community thread
- the AFTVnews Vega OS tag page
- the SamyGO thread
- the webosbrew, RootMyTV, DejaVuln and faultmanager-autoroot READMEs
- the Level1Techs guide

**Seen only as search-result summaries** (the page could not be fetched, so the claims are flagged where used):
- Google TV Apps only mode support page, plus How-To Geek, Tom's Guide and Gadget Hacks (the Roku privacy settings)
- Android Authority (Projectivy override blocked: 403)
- freya.cat (403)
- Android Police and Android Central (tvrecommendations ads, 2019)
- TechEnclave (Chromecast HD reset)
- Pi-hole discourse (Roku)
