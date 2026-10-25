# Debloat research: TCL, Hisense, Xiaomi / Redmi (Android TV / Google TV)

Researched 2026-10-25. Web research only; nothing was run on a TV. Method assumed: `pm disable-user --user 0 <pkg>` (undo with `pm enable`).

## How to read this

**Main source and its limits.** Most of the evidence comes from one open-source project, **CleanYourTV** (`Gathin23/cleanyourtv`, abbreviated **CYT** below). Its `examples/` folder holds one `debloat.txt` per TV model, written from real units and usually re-checked after a reboot: **62 TCL lists, 11 Hisense/Vidda lists (one of them a Fire OS set, which is ignored here) and 32 Xiaomi/Redmi lists**. I cloned the repo and counted how many lists disable each package. "CYT 40/62" means 40 of the 62 TCL lists disable it.

Different people contributed those lists, and many of them tested on hardware. But they all follow one project's conventions, so a high count is not the same as 40 independent confirmations. Several smaller repos used below (Uselessbott, skparidhi, Shulian4K, AlPeFe) say they are based on CYT or on Cobanov's guide. Where a source is truly independent (gists, Habr, Pikabu, TechPP, Toolkit, megarohas, rc0j, RamXcorp, rafimatchen), I say so by citing it separately.

**Sources I could not read.** XDA Developers threads returned HTTP 403, and Reddit threads did not show up in search. **No XDA or Reddit content is used as evidence here.** One XDA claim appears only second-hand, quoted inside a gist comment, and is marked that way.

**Verdicts**
- **bloat**: widely disabled without reported problems.
- **your call**: an optional feature some people use.
- **keep**: leave enabled unless you know why you are disabling it. Usually an updater, a package with several jobs, or one the sources disagree about.
- **never**: reported to break the TV, or documented as load-bearing.

"1 source" means only one place mentions the package. "1 project" means only CYT lists mention it.

Short source labels used in the tables (full URLs are in the list at the end):

| Label | URL |
|---|---|
| CYT | https://github.com/Gathin23/cleanyourtv/tree/main/examples (per-model folders; the folder name is given where it matters) |
| CYT-TS | https://github.com/Gathin23/cleanyourtv/blob/main/docs/TROUBLESHOOTING.md |
| Cobanov | https://tv.cobanov.dev/en/prompt.txt (and https://tv.cobanov.dev/en/) |
| Toolkit | https://github.com/seun-novodev/android-tv-debloat-toolkit (`run_toolkit.py`) |
| llaumgui | https://gist.github.com/llaumgui/e39fdbafc920edacf42fdff6d8ab3a0a (TCL 65C7K) |
| 0x4f53 | https://gist.github.com/0x4f53/27bee9a0069f7bd6a2aa9eb60bb10d1e (TCL BeyondTV; aggressive `pm uninstall` script, with comments) |
| chrissy | https://github.com/chrissy-dev/debloat-tlc-android-tv |
| gaesa | https://github.com/gaesa/TCLDebloater (China-market TCL) |
| TechPP | https://techpp.app/howto/debloat-android-tv-adb |
| rafimatchen | https://github.com/rafimatchen/tv (Hisense SmartTV 4K FFM, Google TV 12) |
| Shulian4K | https://gist.github.com/Shulian4K/0f1983cec54b3428116485624fd519a8 (Hisense songshan, Google TV/Android 11; based on CYT) |
| CYT-site | http://cleanyourtv.site/brand/hisense/ |
| Habr | https://habr.com/ru/articles/1044486/ (Xiaomi Mi TV "hermano", Android 11) |
| Pikabu | https://pikabu.ru/story/_14040546 (Xiaomi, model not stated, uses `pm uninstall`) |
| AlPeFe | https://github.com/AlPeFe/xiaomi-tv-debloat (MiTV-MSSP3, Android 9) |
| RamXcorp | https://github.com/RamXcorp/mi-tv-limpieza (Mi TV / Mi Box, used `pm uninstall`) |
| Uselessbott | https://github.com/Uselessbott/MiTVdebloat (MiTV-AXSO0, Android TV 9) |
| rc0j | https://github.com/rc0j/xiaomi-smarttv-debloat (Xiaomi TV A 43, "irobot", Google TV) |
| megarohas | https://github.com/megarohas/megarohas_android_tv_tweaks/tree/main/debloat-mitv-google-tv (MiTV-AFKR0 Mi Box S 2nd gen) |
| skparidhi | https://github.com/skparidhi/xiaomi-tvhack (MiTV4I, Android TV 9) |
| ravhirizaldi | https://github.com/ravhirizaldi/mitv-axso0-patchwall-fix (MiTV-AXSO0) |

### Applies to every brand below (generic Google/AOSP)

These come up in all three brands' lists. They are summarised once here.

| Package | What it is | Group | Verdict | Sources |
|---|---|---|---|---|
| `com.google.android.feedback` | Google feedback/crash uploader | telemetry | **bloat** | CYT (TCL 51/62, Hisense 6, Xiaomi 20), Toolkit, TechPP, 0x4f53, rafimatchen, AlPeFe, rc0j |
| `com.google.android.tv.bugreportsender` | Bug report uploader | telemetry | **bloat** | CYT, AlPeFe, rc0j, Uselessbott |
| `com.google.android.partnersetup` | Partner-app attribution / RLZ | telemetry | **bloat** | CYT, Toolkit, TechPP, 0x4f53, Uselessbott |
| `com.google.android.tvrecommendations` | Sponsored/recommendation rows | ads | **bloat** | CYT, Toolkit, TechPP, Habr, AlPeFe, 0x4f53 |
| `com.google.android.leanbacklauncher.recommendations` | "Shop"/recommendation row of the old launcher | ads | **bloat** | CYT, Toolkit, TechPP, 0x4f53, AlPeFe |
| `android.autoinstalls.config.google.gtvpai` | Silent partner-app auto-installer (Google TV) | updater | **bloat** | CYT, rafimatchen, Shulian4K |
| `com.google.android.videos` | Play Movies / Google TV app | streaming | **bloat** | CYT, Toolkit, TechPP, Habr, AlPeFe, rc0j, Pikabu |
| `com.google.android.play.games` | Play Games | other | **bloat** | CYT, Toolkit, TechPP, Habr, AlPeFe, rc0j |
| `com.google.android.youtube.tvmusic` | YouTube Music | streaming | **your call** | CYT, TechPP, rc0j, 0x4f53 |
| `com.google.android.onetimeinitializer` | One-off post-setup task | other | **bloat** | CYT, Toolkit, TechPP |
| `com.google.android.syncadapters.calendar` | Calendar sync | other | **bloat** | CYT, Toolkit, TechPP |
| `com.android.printspooler` | Print service | other | **bloat** | CYT, Toolkit, TechPP, AlPeFe, Pikabu |
| `com.android.adservices.api`, `com.android.ondevicepersonalization.services`, `com.android.federatedcompute.services` | Privacy Sandbox / ad services (newer OS builds only) | ads | **bloat** | CYT (Android 14 sets), TechPP |
| `com.google.android.backdrop`, `com.google.android.apps.tv.dreamx`, `com.android.dreams.basic` | Ambient/screensaver | feature | **your call** (set another screensaver first) | CYT, Toolkit, TechPP |
| `com.google.android.katniss` | Google Assistant / voice search | voice | **your call**. Disabling it kills the remote mic (Habr) and the search bar (CYT) | CYT, TechPP, Habr |
| `com.google.android.apps.mediashell` | Chromecast built-in | feature | **your call** | CYT, Toolkit, TechPP |
| `com.google.android.marvin.talkback` | Screen reader | other | **bloat** | CYT, Toolkit, AlPeFe |
| `com.google.android.tungsten.setupwraith` | Google TV setup wizard | other | **keep**. Disable only for a launcher swap, and only after checking Wi-Fi ownership (see Problems) | CYT, CYT-TS, Cobanov, rafimatchen, Shulian4K |
| `com.google.android.tv.remote.service` | Phone remote; on some TCL sets also carries the remote's mic | other | **keep** | Cobanov, TechPP, CYT (tcl-55c725, tcl-beyondtv-rt2851) |
| `com.android.location.fused` | Fused location | other | **never**. Boot loop | 0x4f53 (comment with reproduction), Cobanov, AlPeFe |
| `com.google.android.gms`, `com.google.android.gsf`, `com.android.vending` | Play Services / Play Store | other | **never** | Cobanov, TechPP, Toolkit ("Critical" for gms), CYT |
| `com.android.tv.settings`, `com.android.systemui`, `com.google.android.inputmethod.latin` | Settings, system UI, keyboard | other | **never** | TechPP, Toolkit (systemui "Critical"), CYT |
| `com.google.android.apps.tv.launcherx` / `com.google.android.tvlauncher` | Stock home | other | **never**, unless a replacement launcher is already installed and set as Home (otherwise black screen) | Cobanov, TechPP, 0x4f53 comment, CYT-TS |

---

## 1. TCL

**Scope and confidence.** The findings cover TCL **Android TV 9** (BeyondTV, Realtek RT2851/R51 builds, for example 55C715, 55P635, 65EP640) and **Android TV 11** (BeyondTV2, MStar/MediaTek builds with `com.tvos`, for example 43P615, 50P615, 55EP640, 43P725). They also cover **Google TV on Android 11/12/14** (G03–G10 platforms such as C725, C735, C7K, C7L, C755, C845, QM6K, Q650G, 55S546, P7K, P8K). CYT has 62 TCL lists. Four independent sources add to it: Toolkit, llaumgui, 0x4f53 and chrissy. Cobanov and TechPP supply the main keep/never warnings.

Confidence is **high** for the ad, telemetry and demo packages and for the never list. Many units agree, and the failure reports are first-hand. It is **medium** for `com.tcl.ttvs`, `com.tcl.partnercustomizer`, `com.tcl.suspension` and `com.tcl.cyberui`, because their role depends on the firmware. A separate China-market TCL ecosystem (no Google services, `com.tcl.cyberui` as home) is covered briefly at the end.

| Package | What it is | Group | Verdict | Sources |
|---|---|---|---|---|
| `com.tcl.esticker` | Store-demo sticker | demo | **bloat** | CYT 52/62, Toolkit, TechPP, 0x4f53, chrissy ("Safe") |
| `com.tcl.exhibit` | Store demo | demo | **bloat** | CYT 18/62, llaumgui |
| `com.tcl.hotelmenu` | Hotel-mode portal | demo | **bloat** (1 project) | CYT 13/62 |
| `com.tcl.messagebox` | TCL message/notification box | ads | **bloat**. Two CYT lists keep it because it carries a `ttvs` receiver | CYT 44/62 (kept in tcl-32s5k, tcl-40s5400a), Toolkit, TechPP, 0x4f53 |
| `com.tcl.tv.tclhome_passive` | Pushes TCL content onto the home screen at boot | ads | **bloat** | CYT 36/62, llaumgui |
| `com.tcl.overseasappshow` | App-promo service ("App ads") | ads | **bloat** | CYT 15/62, Toolkit, TechPP, 0x4f53 |
| `com.tcl.bootadservice` | Full-screen ad at boot | ads | **bloat** | CYT 4/62, Toolkit, TechPP, 0x4f53, gaesa |
| `com.tcl.partnercustomizer` | Promo/recommendation rows on stock home; on some Android 11 builds it also holds the remote's TKey handling | ads | **your call**. Sources disagree (see Never list) | Disable: CYT 40/62, llaumgui, 0x4f53, chrissy. Keep: CYT tcl-beyondtv2-android-11, tcl-43p615, tcl-50p615, tcl-55ep640, tcl-65ep640, tcl-43p725 |
| `com.tcl.atomic.servicecenter` | Home-screen recommendation cards | ads | **bloat** (1 project) | CYT 2/62 |
| `com.tcl.bi` | TCL BI analytics (Firebase, network monitor) | telemetry | **bloat** | CYT 28/62, 0x4f53, gaesa |
| `com.tcl.logkit` | Log collection / remote diagnosis | telemetry | **bloat** (1 project) | CYT 26/62 |
| `com.tcl.guard` | "TGuard" cleaner with device-use tracking | telemetry | **bloat** | CYT 38/62, Toolkit, TechPP, llaumgui, 0x4f53 |
| `com.tcl.tvweishi` | "TV Guard" cleaner overlay | other | **bloat** | CYT 8/62, Toolkit, TechPP, 0x4f53 |
| `tv.samba.ssm.ui` | Samba TV ACR viewing tracking | telemetry | **bloat** (1 project) | CYT 3/62 |
| `com.tcl.profilemanager` | Audience/profile reporting | telemetry | **bloat** (1 project) | CYT 2/62 |
| `com.tcl.interactive` | TCL TIAS background service | telemetry | **bloat** (1 project) | CYT 14/62 |
| `com.tcl.repairguide` | Self-diagnosis | other | **bloat** (1 project) | CYT 21/62 |
| `com.tcl.waterfall.overseas` | "TCL Channel" content browser | streaming | **bloat**, with 1 boot-loop report (55P635) | CYT 40/62, llaumgui, chrissy ("Safe"). Boot loop: 0x4f53 comment |
| `com.tcl.channelplus` | "TCL Live" FAST channels with ads (its own TV input) | streaming | **bloat** (1 project) | CYT 27/62 |
| `com.tcl.tv.plus` | TCL TV+ content app | streaming | **bloat** (1 project) | CYT 5/62 |
| `tv.wuaki.apptv` | Rakuten TV (preload) | streaming | **your call** | CYT 9/62, 0x4f53 |
| `com.tcl.usercenter` | TCL account centre | other | **bloat**. Kept in tcl-beyondtv2-android-11 as a setup/account screen | CYT 38/62, Toolkit, TechPP, llaumgui, 0x4f53 |
| `com.tcl.useragreement` | EULA screens | other | **bloat** (kept in tcl-beyondtv2-android-11) | CYT 20/62, 0x4f53 |
| `com.tcl.ocean.instructions` | e-Manual | other | **bloat** | CYT 26/62, llaumgui |
| `com.tcl.notereminder` | Notes & reminder widget | feature | **bloat** (re-enabled at every boot on tcl-beyondtv-pl) | CYT 10/62, Toolkit, TechPP, 0x4f53, chrissy |
| `com.tcl.copydatatotv` | Copy-data utility | other | **bloat** (kept in tcl-beyondtv2 lists, "unclear role") | CYT 13/62, 0x4f53, chrissy |
| `com.tcl.appmarket2` | TCL app store (Play Store stays) | store | **bloat** | CYT 8/62, Toolkit, TechPP, 0x4f53, gaesa |
| `com.tcl.browser` | TCL browser | other | **bloat** | CYT 13/62, Toolkit, TechPP |
| `android.autoinstalls.config.tcl.device` | TCL partner-app auto-install config | updater | **bloat** | CYT 19/62, 0x4f53 |
| `com.tcl.smartalexa` | Alexa bridge | voice | **your call** | CYT 28/62, llaumgui, 0x4f53, chrissy |
| `com.tcl.assistant` | TCL assistant bridge | voice | **your call**. CYT tcl-55c725 keeps it for voice | CYT 20/62, chrissy ("Safe"), 0x4f53 |
| `com.tcl.eva` | TCL voice layer; on 65C735 also a remote accessibility helper | voice | **keep** (sources disagree) | Disabled: CYT 3/62. Keep: CYT tcl-65c735 |
| `com.tcl.dashboard` | "TCL HOME" tile / stock quick-settings panel | feature | **your call**. Kept in tcl-32s5k and tcl-40s5400a; the gear key needs a remap without it | CYT 22/62, Toolkit, TechPP, llaumgui, 0x4f53 |
| `com.tcl.ui_mediaCenter` | USB media player | feature | **your call** | CYT 30/62, llaumgui, 0x4f53 |
| `com.tcl.gallery` | Gallery / TCL screensaver | feature | **your call** | CYT 13/62, Toolkit, llaumgui, 0x4f53 |
| `com.tcl.MultiScreenInteraction_TV`, `com.tcl.magiconnectfree` | T-Cast / MagiConnect phone link | feature | **your call** | CYT 12/62 and 10/62, llaumgui, 0x4f53; Toolkit rates the first "Caution" |
| `com.tcl.miracast` | Screen mirroring | feature | **your call** | CYT 16/62 (kept in 10 more), 0x4f53 |
| `com.tcl.airplay2`, `com.mediatek.AirplayAPK`, `com.mediatek.airplaydaemon` | AirPlay | feature | **your call** (1 project) | CYT |
| `com.tcl.t_solo` | "Listen alone" (TV audio to Bluetooth headphones) | feature | **your call** | CYT 16/62, llaumgui, 0x4f53 |
| `com.tcl.gamebar` | Game-mode overlay | feature | **your call** (1 project) | CYT 16/62 |
| `com.tcl.UpdatePeripheral`, `com.tcl.rc.ota` | Soundbar / remote firmware updater | updater | **keep** | CYT (several lists keep them), 0x4f53 removes rc.ota |
| `com.tcl.versionUpdateApp` | TCL firmware (OTA) updater | updater | **keep** | Kept: CYT (9 lists, "kept by choice"). Disabled: CYT 8/62, 0x4f53. chrissy rates it "Caution" |
| `com.tcl.ttvs` | Several jobs: TCL BI/awareness, Samba ACR, Alexa core, T-Cast server, and on several builds the **system updater** | updater | **keep** (sources disagree) | Keep: Cobanov ("disabling it silently breaks every system update option"), TechPP, CYT tcl-40s5400a and tcl-43s5400a. Disabled: CYT 18/62, with tcl-65c735 noting "on AR2101 … disabling it stops OTA updates" |
| `com.tcl.keyhelp` | Remote-key help / virtual keys | other | **keep** | Keep: CYT tcl-55s546-us, tcl-65c735, tcl-43s5400a. Disabled: CYT 9/62, 0x4f53 |
| `com.tcl.micmanager` | Remote microphone manager | voice | **keep** | CYT tcl-55c725 keeps it; 0x4f53 comments it out ("Enables mic on TV remote"); CYT 12/62 disable it |
| `com.tcl.cyberui` | Android TV 9 international: unused TCL content service. China builds: **the stock launcher** | other | **bloat** on international Android TV 9; **never** on China builds | CYT 5/62 (tcl-55c715, tcl-beyondtv*); never: CYT tcl-tc8000-ay30a2, tcl-q10g-pro, tcl-ak30a5, tcl-mt9655-cn-android14 |

### TCL: never disable

| Package | Reason | Source |
|---|---|---|
| `com.tcl.tv` | Live TV app; plays HDMI; source picker on the Input key | CYT (nearly every list), Cobanov, 0x4f53 (left commented out: "Important TV elements (HDMI/AV switching)"). Toolkit rates it "Caution" |
| `com.tcl.tvinput` | HDMI/AV/tuner input services. Disabling it gives "No Signal" (tcl-43p725). **chrissy's table wrongly rates it "Safe"** | CYT, Cobanov, TechPP |
| `com.tcl.tvpassthrough`, `com.tcl.sourcemananger` (sic) | HDMI passthrough and the source/input menu (Android TV 9/11) | CYT tcl-43c645, tcl-55c715, tcl-beyondtv-rt2851, tcl-43ep660 |
| `com.tcl.suspension` | Quick Panel / Input key source panel. Disabled → Inputs button gone and no HDMI switching (Cobanov). CYT tcl-g05 says the Input key stops but HDMI still plays through a launcher | Cobanov, TechPP, CYT (kept in most lists; disabled only in tcl-g05 and tcl-50p735) |
| `com.tcl.providers.config`, `com.tcl.initsetup`, `com.tcl.factory.view` | Disabling them is reported to drop Wi-Fi (65C725 and others). Never launch `factory.view` either. 0x4f53 removes all three, and its comments report instability | CYT tcl-65c725, tcl-43c645, tcl-g03, Cobanov |
| `com.tcl.system.server` / `com.tcl.systemserver` | Remote-key plumbing | CYT (most lists); chrissy "Critical". An early tcl-32s5400a pass disabled it and then reverted |
| `com.tcl.tcl_bt_rcu_service`, `com.tcl.autopair` | Bluetooth remote service and pairing | CYT, Cobanov, chrissy |
| `com.tcl.settings` | Picture/sound settings | CYT |
| `com.tcl.keycustomfunctionservice`, `com.tcl.framework.custom`, `com.tcl.common.shortcutmenu` | Remote key handling, fallback home, volume UI. Toolkit rates `framework.custom` "Critical"; 0x4f53 says "Important UI (volume controls)" | CYT, Toolkit, 0x4f53 |
| `com.tcl.inputmethod.international` | Default keyboard (T_IME) | CYT |
| `com.tvos` | MStar tvos framework resources (Android 11 BeyondTV2/P615 family) | CYT; chrissy "Critical" |
| `com.tcl.showmode` | Sound modes (Dolby/DTS/night), not just a demo | CYT tcl-65ep640, tcl-beyondtv-rt2851 |
| `com.tcl.partnercustomizer` (Android 11 BeyondTV2, P615, EP640, P725 only) | Carries the remote's TKey activity / keycode handling on those builds | CYT tcl-beyondtv2-android-11, tcl-43p725 |
| `com.tcl.xian.StartandroidService`, `com.tcl.appstatecontroller`, `com.realtek.netflix.setting`, `com.android.WifiCountryService` | Device authentication / boot hooks / Netflix ESN. Purpose unclear, so CYT keeps them on Realtek builds | CYT tcl-55c715, tcl-beyondtv-rt2851 |
| `com.tcl.cyberui` (China builds) | The only HOME activity. Disabling it leaves the TV with no home and boot never finishes | CYT tcl-tc8000-ay30a2, tcl-q10g-pro |

### TCL: problems reported after debloating
- **Lost HDMI/input switching**: `com.tcl.suspension` was disabled (Cobanov, first-hand). CYT tcl-g05: the Input key stops working.
- **"No Signal" on HDMI**: `com.tcl.tvinput` disabled (CYT tcl-43p725).
- **Boot loop on the Google TV logo**: `com.android.location.fused`, reproduced by the gist author with Location on (0x4f53 comments). `com.tcl.waterfall.overseas` caused a boot loop on one 55P635 (V8-R51AT01-LF1V107), reported by a gist commenter. The gist author says it disables fine on several models and cites an XDA thread for that, which I could not read.
- **Black / blank home**: launcherx was disabled with no replacement (0x4f53 comment, Cobanov). After a launcher swap on Google TV, the setup wizard's RecoveryActivity can take Home (CYT-TS).
- **Wi-Fi gone for good**: disabling `setupwraith` when the saved network belongs to it. Seen on a TCL G07 on Google TV 11, build AR17 (CYT-TS). Check first with `dumpsys wifi | grep -o 'cname=[^ ]*'`. Wi-Fi drop is also reported for `com.tcl.providers.config` (CYT tcl-65c725, Cobanov).
- **Firmware updates stop**: `com.tcl.ttvs` disabled (Cobanov; CYT tcl-65c735 on AR2101). On the G09, with ttvs disabled, TvSettings falls back to TCL's own app tracker and stays pinned in memory (CYT tcl-g09-google-tv README).
- **TV unstable, flashing black, firmware had to be reflashed**: after the aggressive `pm uninstall` script (0x4f53 comment by user jzazo). It used uninstall, not disable, and removed `com.google.android.gsf`, `com.tcl.initsetup`, `com.tcl.system.server` and others.
- **Cosmetic**: the red "TV" tile disappears from the Google TV Home row, probably because of `partnercustomizer` (CYT tcl-40s5400a). "Accounts & profiles" is empty once launcherx is disabled (TCL 75C845X2, CYT-TS).
- **Re-enabled by the firmware**: `com.tcl.notereminder` at every boot on tcl-beyondtv-pl (CYT). A firmware update can undo the cleanup (CYT-TS).

### TCL: differences by OS / platform
- **Android TV 9 (Realtek BeyondTV, R51/RT2851)**: `tvlauncher` home. `com.tcl.sourcemananger`, `tvpassthrough`, `keycustomfunctionservice` and `framework.custom` are load-bearing. `com.tcl.cyberui` is an unused content service (CYT tcl-55c715, tcl-beyondtv-rt2851).
- **Android TV 11 (BeyondTV2 / MStar-MediaTek with `com.tvos`: P615, EP640, P725)**: `partnercustomizer` carries remote key handling, so keep it. `setupwraith` may own the saved Wi-Fi (CYT tcl-43ep660, tcl-55ep640, tcl-43p725).
- **Google TV 11/12/14 (G03–G10, C7K/C7L/C755/C845/QM6K/Q650G)**: launcherx home. `com.tcl.suspension` is the Quick Panel and Input key. `com.tcl.ttvs` bundles BI, Samba ACR, Alexa core, T-Cast and (on some builds) the updater. Samba TV `tv.samba.ssm.ui` is present. Android 14 builds add the `com.android.adservices.api` family (CYT).
- **China market (no Google services)**: `com.tcl.cyberui` is home, so never disable it. Separate bloat set: `com.tcl.bi`, `com.tcl.bootadservice`, `com.tcl.tshop`, `com.iflytek.xiri*` (iFlytek voice), `com.tcl.wholenetsearch`, `com.tcl.c2dm.client`, `com.tcl.vod`, `com.tcl.tliveplay`, `com.tcl.ffkaraoke` (gaesa; overlapping CYT tcl-q10g-pro and tcl-tc8000). gaesa also lists the updaters `com.snm.upgrade`, `com.tcl.versionUpdateApp` and `com.tcl.update`; treat them as updater/keep.

---

## 2. Hisense

**Scope and confidence.** This covers Hisense **Android TV 9** (HiSmartTV A4 "xiaoyushan" India; HG9 / A4FFM), **Android TV 10/11** (SmartTV 4K FFM "huangshan" Latin America and US U9DG; "songshan" Android 11; A4 after its Android 11 update) and **Google TV 12** (FFM "lushan"; U75 / 75U75N / 55U7N "hengshan"; rafimatchen's FFM). It also covers **China VIDAA_TV / JuUI sets**: 65D62QH, E5Q Pro and the Vidda sub-brand. These run Android 11 under a VIDAA-branded UI with `com.jamdeo.tv.vod` as home, and they *can* be debloated over ADB.

**Global VIDAA OS models cannot be debloated this way.** VIDAA is not Android: it cannot run APKs, and its developer options do not enable APK install (TechJunctions). CleanYourTV states that "VIDAA models are a different system and are not covered" (CYT-site). The Hisense Fire TV list (Fire OS) is out of scope.

Confidence is **medium**. There are 10 relevant CYT lists plus rafimatchen (independent) and Shulian4K (CYT-based). Package namespaces change completely between generations: `com.hisense.*` on Android 9/10, `com.vt.*` on Google TV 12, and `com.jamdeo.*` on China JuUI. So few packages have many confirmations.

| Package | What it is | Group | Verdict | Sources |
|---|---|---|---|---|
| `com.hisense.evservice` / `com.vt.tv.evservice` | ACR viewing-data collector (also watches HDMI) | telemetry | **bloat** | CYT (hisense-hismarttv-a4-android11, -smarttv-4k-ffm, -lushan, -u75-hengshan, -hg9), rafimatchen, CYT-site |
| `com.hisense.app.logreport` | Persistent log/usage reporter | telemetry | **bloat** (1 project) | CYT hisense-hg9, hisense-hismarttv-a4 |
| `com.hisense.platformreport`, `com.hisense.logupload`, `com.hisense.hitv.das` | Usage/telemetry reporting, log upload (China JuUI) | telemetry | **bloat** (1 project) | CYT hisense-65d62qh, hisense-e5q-pro, vidda-mt9653 |
| `com.hisense.service.message` | HiMsgService vendor push channel | ads | **bloat** (1 project) | CYT 6 lists, CYT-site |
| `com.hisense.business.ad`, `com.hisense.service.ad` | Ad SDK / ad service (China JuUI) | ads | **bloat** (1 project). Also `settings put global com.hisense.service.ad_block 1` | CYT hisense-e5q-pro, hisense-65d62qh, vidda-mt9653 |
| `com.hisense.widget.pro`, `com.hisense.tv.weather` | Operator widget rows / weather content feed (China) | ads | **bloat** (1 project) | CYT hisense-65d62qh, vidda-mt9653 |
| `net.vidaatv.hisense.android.tv` | "Hisense Channels" / VIDAA FAST channels | streaming | **bloat** | CYT (3 lists), rafimatchen, CYT-site |
| `com.vidaa.oemtabcontentprovider` | Feeds the VIDAA content tab | ads | **bloat** | CYT hisense-u75-hengshan, rafimatchen |
| `com.vt.hishow` | "Family Moment" screensaver/photo content | ads | **bloat** | CYT -lushan, -u75-hengshan, rafimatchen |
| `com.hisense.storemode` / `com.vt.storemode` | Retail store demo mode | demo | **bloat** | CYT (6 lists), rafimatchen, Shulian4K, CYT-site |
| `fusion.android.tv.demo`, `com.hisense.demonstrate`, `com.demo` | Demo reels | demo | **bloat** | CYT, Shulian4K |
| `com.mstar.android.tv.disclaimercustomization` | Store disclaimer screen | demo | **bloat** | CYT (3 lists), Shulian4K, CYT-site |
| `com.hisense.tv.b2b` / `com.vt.tv.b2b`, `com.hisense.hotelmode`, `com.hisense.hotelmenu`, `com.meetingroom` | Hotel / business / meeting-room modes | demo | **bloat** (1 project) | CYT |
| `com.hisense.fte` / `com.vt.fte` / `com.jamdeo.tv.fte` | First-time experience walkthrough (setup done) | other | **bloat** | CYT, Shulian4K |
| `android.autoinstalls.config.hisense.xiaoyushan` / `.huangshan` / `.laohushan` | Silent partner-app auto-installs (board-specific name) | updater | **bloat** (1 project) | CYT, CYT-site |
| `com.hisense.alexa` / `com.vt.alexa` | Hisense Alexa | voice | **your call** | CYT, rafimatchen |
| `com.hisense.hibrowser`, `com.hisense.odinbrowser`, `com.seraphic.browser` | Hisense browsers | other | **bloat** | CYT, rafimatchen, Shulian4K |
| `com.hisense.electronictutorial` | e-Manual | other | **bloat** (1 project) | CYT |
| `com.hisense.tv.videoconference`, `.fitmirror`, `.foodmanage`, `com.vision.aibook`, `com.hisense.ar.baike`, `com.hisense.tv.videochat.social`, `com.jamdeo.calendar` | Preloaded lifestyle apps (China) | other | **bloat** (1 project) | CYT hisense-65d62qh, hisense-e5q-pro, vidda-mt9653 |
| `com.jamdeo.tv.mediacenter` / `com.vt.tv.mediacenter` | DLNA/USB media player | feature | **your call** | CYT, rafimatchen |
| `com.hisense.tv.hisremotenow` (+ `hisremotenowserver`) | RemoteNOW phone remote | feature | **your call** (1 project) | CYT |
| `com.mediatek.androidbox` / `com.vt.miracast` | Miracast receiver | feature | **your call** | CYT, Shulian4K, rafimatchen (Miracast "Extras") |
| `com.vt.tv.dlna` | DLNA renderer | feature | **your call** (1 source) | rafimatchen |
| `tv.mopa.ginga` | Ginga, the Brazilian interactive-broadcast stack | feature | **your call** | CYT hisense-u75-hengshan, rafimatchen |
| `com.hisense.tv.ota`, `com.hisense.remoteupgrade`, `com.vt.tv.usbota`, `com.hisense.usbupgrade`, `com.jamdeo.updateservice` | Firmware updaters | updater | **keep** (Android 9/10 lists disable them; Google TV and China lists keep them) | CYT, Shulian4K disables `remoteupgrade` |
| `com.hisense.tv.protector` / `com.vt.tv.protector` | "DeviceAssistant" cleaner with a boot receiver | other | **your call** (sources disagree) | Disabled: CYT -lushan, -u75, -hg9, rafimatchen. Kept: CYT hisense-smarttv-4k-ffm and -ffm-android11 ("look tied to the system") |
| `com.hisense.tv.customerlauncher` / `com.vt.tv.customerlauncher` | CustomerLauncher home-screen tweaks/content | ads | **keep** (sources disagree) | Disabled: rafimatchen, CYT hisense-hg9. Kept: CYT hisense-hismarttv-a4, hisense-smarttv-4k-ffm, -android11 |
| `com.hisense.tv.smartservice` / `com.vt.tv.smartservice` | Smartsense background / log reporting | telemetry | **keep** (sources disagree) | Disabled: rafimatchen, CYT hisense-hg9. Kept: CYT hisense-smarttv-4k-ffm, -android11, hisense-u75-hengshan |
| `com.mstar.netflixobserver` | Netflix measurement service; also the remote's Netflix key on the A4 | other | **keep** (sources disagree) | Kept: CYT hisense-hismarttv-a4. Disabled: CYT hisense-hg9 |
| `com.hisense.hitv.hicloud.account` | HiCloud account | other | **your call** (1 project) | CYT hisense-hg9 |

### Hisense: never disable

| Package | Reason | Source |
|---|---|---|
| `com.hisense.tv.smartsense`, `com.vt.tv.smartsense`, `com.vt.tv.smartsense.ui`, `com.vt.tv.ai_sense`, `com.vt.tv.aiot`, `com.vt.tv.aiotprotocolapp`, `com.vt.tv.aiotsystemservice` | Disabling this family on huangshan firmware sent the TV to **Android Recovery** ("Can't load Android system"). rafimatchen says `com.vt.tv.smartsense` "handles the remote and input switching". **Sources disagree**: the HG9 list disables smartsense/smartservice/smartsense.ui, and rafimatchen disables `com.vt.tv.aiot`, both without problems. Never put these on a generic allow-list | CYT hisense-smarttv-4k-ffm, -u75-hengshan, -lushan; Shulian4K; rafimatchen |
| `com.hisense.tv.hitvinput`, `com.mediatek.tv.service`, `com.mediatek.wwtv.tvcenter`, all `com.mediatek.*` (Android 9–11) | Serve TvInputService / TV_INPUT_HARDWARE; Live TV and HDMI app | CYT hisense-smarttv-4k-ffm(-android11), hisense-hismarttv-a4; Shulian4K |
| `com.vt.tv.input`, `com.vt.tv.tvcenter`, `com.vt.source.external`, `com.vt.source.tuner`, `com.mediatek.dtv.tvinput.framework.server` (Google TV 12) | Inputs/source menu, Live TV, HDMI and tuner inputs, TV input framework | CYT hisense-u75-hengshan; Shulian4K |
| `com.vt.tv.commonui`, `com.vt.tvservice`, `com.vt.avmiddleware`, `com.vt.tvplayer`, `com.vt.edv.drmp` | TV middleware / DRM | CYT hisense-u75-hengshan |
| `com.mediatek.autopair`, `com.mediatek.android.tv.globalkeyoverlay`, `com.hisense.kpad`, `com.hisense.favkey` | Remote pairing, remote keys, menu key | CYT hisense-u75-hengshan, hisense-hismarttv-a4, hisense-smarttv-4k-ffm |
| `com.hisense.tv.tiletransition` (Vidda / China JuUI) | Hosts TileAnimationService. Disabled, the source panel opens but **picking HDMI silently does nothing** | CYT vidda-mt9653 |
| `com.jamdeo.tv.vod` (China JuUI home), `com.jamdeo.tv.livetv` | Stock home. Disabled → **no Home at boot**, and the remote's Home key stops working too | CYT hisense-65d62qh, hisense-e5q-pro |
| `com.vt.tv.aipq`, `com.vt.tv.videocolor`, `com.hisense.tv.videocolor`, `com.dolby.android.audio.service` | Picture quality / Dolby audio | CYT hisense-u75-hengshan, hisense-smarttv-4k-ffm |
| `com.vt.eula` | Wired to the OTA EULA message; keep while OTA is kept | CYT hisense-u75-hengshan |
| `com.vt.udpserver` | LAN discovery for casting / phone remote | CYT hisense-u75-hengshan |
| `com.vidaa.persistent.service`, `com.hisense.uifac`, `com.hisense.audio_update_service` | Kept as system-tied | CYT hisense-smarttv-4k-ffm, hisense-hismarttv-a4 |

### Hisense: problems reported after debloating
- **Android Recovery on the next boot** after disabling the smartsense/aiot family (huangshan, Android TV 10). "Try again" booted normally and restore undid it. **Never choose "Factory data reset" on that screen** (CYT hisense-smarttv-4k-ffm, hisense-u75-hengshan; repeated by Shulian4K).
- **HDMI switching silently fails**: `com.hisense.tv.tiletransition` disabled (CYT vidda-mt9653).
- **No Home at boot** after disabling `com.jamdeo.tv.vod` (CYT hisense-65d62qh).
- **Black screen on Home** after a launcher swap on Google TV 12. `setupwraith`'s RecoveryActivity claims HOME once launcherx is off, so it has to be disabled too (rafimatchen, CYT -lushan). It may also own the saved Wi-Fi (CYT -lushan, -ffm-android11). rafimatchen's recovery without a computer: Input → TV → Settings → Apps → enable Google TV.
- **Input button dead** once `tvlauncher` is disabled: only the stock launcher answered `VIEW_INPUTS` (CYT hisense-smarttv-4k-ffm, hisense-hismarttv-a4-android11).
- **"Packages re-enabled after reboot"** on the A4 turned out to be rebooting less than ~10 s after `pm`. Android writes package state lazily, so **wait about 15 s before rebooting** (CYT-TS).
- A USB HID freeze was seen once on the 65D62QH with a second accessibility service enabled (CYT examples/README).

### Hisense: differences by OS / generation
- **Android TV 9 (A4 xiaoyushan, HG9)**: `com.hisense.*` names; `tvlauncher`; MStar/MediaTek `com.mediatek.*` stack; updaters disabled without issue there.
- **Android TV 10/11 (FFM huangshan / songshan, A4 after its update)**: still mostly `com.hisense.*` (evservice, storemode, fte, b2b). The smartsense Recovery warning comes from this family.
- **Google TV 12 (lushan, hengshan U75/U7N, rafimatchen FFM)**: the vendor layer moves to `com.vt.*` (evservice, storemode, fte, alexa, hishow, protector, input, tvcenter); launcherx; `setupwraith` claims HOME.
- **China VIDAA_TV / JuUI (Android 11)**: `com.jamdeo.*` home and Live TV, plus `com.hisense.business.ad` / `service.ad` and the telemetry trio.
- **Global VIDAA OS (non-Android)**: no ADB package manager, so it is not debloatable this way (TechJunctions, CYT-site).

---

## 3. Xiaomi / Redmi / Mi TV / Mi Box / TV Stick

**Scope and confidence.** This covers international PatchWall TVs on **Android TV 9** (Mi TV 4A/4C Pro/AXSO*, MSSP0–3, MiTV4I), **Android TV 10/11** (MOOQ*, AXFR*, MSSP3 on Android 11, Habr's "hermano") and **Google TV 11/14** (MOOR2/MOOR4, MOSR4, MOEU0, MZTU0 TV A Pro 2026). For streamers it covers the **Mi Box 3, Mi Box S, Mi Box S 2nd gen, TV Box S 3rd gen, TV Stick 4K (1st and 2nd gen) and the AESP0 stick**. It also covers **China-firmware** sets (no Google apps; PatchWall `com.mitv.tvhome` is the home; HyperOS TV 2/3).

There are 32 CYT lists plus 10 other sources, most of them independent: Habr, Pikabu, AlPeFe, RamXcorp, rc0j, megarohas, Uselessbott, skparidhi, ravhirizaldi and TechPP. Confidence is **high** for the analytics/ad/PatchWall-row packages and the never list. It is **medium** for `tvmanager`, `updateservice`, `tvqs.overseas` and `tvsetup.partnercustomizer`, which have firmware-dependent roles.

| Package | What it is | Group | Verdict | Sources |
|---|---|---|---|---|
| `com.miui.tv.analytics` | Xiaomi usage analytics | telemetry | **bloat** | CYT 31/32, AlPeFe, rc0j, megarohas, Uselessbott, ravhirizaldi, Pikabu, RamXcorp, skparidhi |
| `com.xiaomi.statistic` | MiTVStat statistics upload | telemetry | **bloat** | CYT 25/32, AlPeFe, megarohas, Uselessbott, ravhirizaldi |
| `tv.alphonso.alphonso_eula` | Alphonso ad tracking (reads app-usage stats) | telemetry | **bloat** | CYT 3/32 (mi-box-3, mi-box-s), RamXcorp |
| `co.sensara.tv.mitv` | Sensara sponsored TV-guide recommendations | ads | **bloat** (1 project; skparidhi mentions "Sensara" by name only) | CYT 2/32 |
| `com.xiaomi.tvqs` | "Quality system": crash/perf/dropbox uploads (China) | telemetry | **bloat** (1 project) | CYT 7/32 |
| `com.xiaomi.tvqs.overseas` / `.overseas.y24` | Quality-stats uploader on some builds; **quick-settings panel** on others | telemetry | **keep** (sources disagree) | Disabled: CYT xiaomi-mitv-moor2, -mosr4, -afmu0, -afmu1, xiaomi-tv-a-pro-2026. Kept as the quick panel: CYT xiaomi-mitv-moeu0, -mooq2, -ayfr0, mi-box-s-2nd-gen; megarohas ("TvQS") |
| `com.xm.webcontent` | WebView container for promos; fetches screensaver ads | ads | **bloat** | CYT 32/32, AlPeFe, Uselessbott |
| `com.mitv.tvhome.atv` | PatchWall on international builds (not the HOME on Android TV/Google TV) | ads | **bloat**, but see Problems (re-installed by the updater; Home-button hijack) | CYT 22/32, Habr, TechPP, AlPeFe, rc0j, megarohas, Uselessbott, skparidhi, ravhirizaldi, RamXcorp, Pikabu |
| `com.mitv.tvhome.michannel` | Mi Channel rows | ads | **bloat** | CYT 17/32, Habr, TechPP, megarohas, rc0j, RamXcorp, Pikabu |
| `com.mitv.tvhome.mitvplus` | Xiaomi TV+ (FAST channels with ads) | streaming | **bloat**. On AXSO0, PatchWall nags "install Xiaomi TV+?" if it is missing | CYT 14/32, Habr, TechPP, AlPeFe, megarohas, rc0j, ravhirizaldi |
| `com.mitv.tvhome.oemtab` | "Xiaomi" promo tab/row in the Google TV launcher | ads | **bloat** | CYT 7/32, megarohas |
| `com.xiaomi.floatingframe` | Floating promo overlay | ads | **bloat** | CYT 8/32, AlPeFe, Uselessbott |
| `com.xiaomi.mitv.tvpush.tvpushservice` | Push ads/notifications | ads | **bloat** (1 project) | CYT 6/32 |
| `com.mitv.cloudcontrol` | Cloud control; remotely pushes apps (China) | updater | **bloat** (1 project) | CYT 7/32 |
| `com.duokan.videodaily`, `com.gitvdemo.video` | Promo video reels (China) | ads | **bloat** (1 project) | CYT |
| `com.xiaomi.mitv.hyper.screensaver` | HyperOS standby-ad carousel (China) | ads | **bloat** (1 project) | CYT xiaomi-mitv-astr0, -mftr0 |
| `com.mitv.shoplugin`, `com.xiaomi.mitv.shop` | TV Taobao plugin / Xiaomi TV store (China) | store | **bloat** (1 project) | CYT |
| `com.miui.systemAdSolution`, `com.xiaomi.mitv.advertise`, `com.xiaomi.mitv.store` | System ad component / PatchWall ads / Xiaomi store | ads / store | **bloat (1 source, unverified elsewhere)** | Pikabu |
| `android.autoinstalls.config.xiaomi.amelie`, `…xioami.mibox3`, `…xioami.dangal`, `…xiaomi.mibox3`, `…soc.amlogic` (spelling "xioami" is the real package name) | Play auto-install of partner apps | updater | **bloat** | CYT, rc0j, RamXcorp, Uselessbott |
| `com.xiaomo.tv.milegal` (sic "xiaomo") | Privacy-policy screen | other | **bloat** | CYT 9/32, AlPeFe, rc0j, Uselessbott |
| `com.xiaomi.mitv.handbook`, `com.xiaomi.mitv.manualhelp` | User manual | other | **bloat** | CYT, Uselessbott, ravhirizaldi |
| `com.xiaomi.mimusic2` | Mi Music | feature | **bloat** | CYT 20/32, AlPeFe, rc0j, megarohas, Uselessbott, skparidhi, ravhirizaldi |
| `com.mitv.gallery`, `com.xiaomi.tv.gallery` | Mi photo album | feature | **bloat** | CYT 17/32, AlPeFe, rc0j, megarohas, Uselessbott, skparidhi |
| `com.xiaomi.gamecenter.sdk.service.mibox` | Game-centre SDK | other | **bloat** (1 project) | CYT 9/32 |
| `com.xiaomi.tweather` | Weather | other | **bloat** | CYT 5/32, Pikabu |
| `com.mitv.screensaver`, `com.mitv.dream` | Xiaomi screensavers | feature | **your call** | CYT, Pikabu |
| `com.xiaomi.mitv.tvmanager` | "TV Manager" cleaner; also power/standby and XiaoAI glue on some firmware | other | **your call** (sources disagree) | Disabled: CYT 21/32, Uselessbott, ravhirizaldi, skparidhi. Re-enabled: AlPeFe (standby wake problem), CYT xiaomi-mitv-mffu0 (XiaoAI "open app" breaks) |
| `com.xiaomi.mitv.updateservice` | Firmware **and PatchWall** updater; installs apps | updater | **your call**. It stops updates, but it must be off for PatchWall to stay disabled | Disabled: CYT 11/32, Habr, Uselessbott, skparidhi, ravhirizaldi, RamXcorp. Re-enabled: AlPeFe (suspected cause of a reboot loop; unconfirmed). Kept: megarohas |
| `com.xiaomi.mitv.upgrade`, `com.mitv.upgrader` | Firmware updater | updater | **keep** | CYT ("kept on so updates arrive", #322); Pikabu disables it as optional |
| `com.mitv.milinkservice` | Mi Cast (MiLink) | feature | **your call** | CYT 7/32, Uselessbott, skparidhi, RamXcorp |
| `com.xiaomi.mitv.smartshare`, `com.xiaomi.wfdsinkhelperservice`, `com.xiaomi.miplay` | Xiaomi screen share / Miracast sink | feature | **your call** (megarohas keeps them for casting from Xiaomi phones) | CYT, rc0j, Uselessbott, megarohas |
| `com.mitv.videoplayer`, `com.xiaomi.mitv.mediaexplorer` | Mi video player / USB media explorer | feature | **your call** | CYT, AlPeFe, rc0j, Uselessbott, megarohas (keeps mediaexplorer) |
| `com.mitv.tvlock` | Parental lock | feature | **your call** | CYT, AlPeFe, Uselessbott; kept by skparidhi |
| `com.xiaomi.smarthome.tv`, `com.xiaomi.mitv.smartpanel`, `com.xiaomi.voicecontrol`, `com.xiaomi.wakeupservice`, `com.xiaomi.mico.mqtt.service.application.tv` | Mi Home / XiaoAI voice (China) | voice | **your call**. Disabling all five cut voice control from an external XiaoAI speaker | CYT xiaomi-mitv-ansp0 |
| `com.xiaomi.amazon.alexa` | Alexa bridge | voice | **your call** (1 project) | CYT 3/32 |
| `com.xiaomi.android.tvsetup.partnercustomizer` | Seeds partner apps at setup; on Mi Box S / MiTV4I it also receives the remote's shortcut buttons and runs remote pairing | other | **keep** (sources disagree) | Disabled/removed: megarohas, rc0j, RamXcorp ("with problems"). Kept: CYT xiaomi-mi-box-s, skparidhi |
| `com.mediatek.androidbox` | MediaTek WFD sink / demo box | feature | **your call** | AlPeFe |

### Xiaomi: never disable

| Package | Reason | Source |
|---|---|---|
| `mitv.service` | Persistent TvServer / TvSettingService / remote-key handling; picture and sound. RamXcorp *uninstalled* it, among others, and lost the Options button and the motion-smoothing toggle | CYT xiaomi-mitv-moor2, -mosr4, -moeu0, -mteq0, mi-box-s; megarohas; Uselessbott; AlPeFe; RamXcorp |
| `com.mitv.overseaservice` | Persistent; Netflix key service and Bluetooth remote service ("nothing here is telemetry") | CYT xiaomi-mitv-mosr4, -moor2, -moeu0, -mooq2 |
| `com.mi.bluetooth` | Remote and Bluetooth pairing | CYT xiaomi-mitv-moor2, -moeu0; megarohas |
| `com.mitv.livetv` | Live TV **and the HDMI/source switcher** (`.input.SelectInputActivity`). Habr disabled it on a set without an antenna; on TVs with HDMI devices, keep it | CYT xiaomi-mitv-moor2, -mosr4, -moeu0. Disabled: Habr |
| `com.mediatek.tvinput`, `com.mediatek.tv.service`, `com.mediatek.tv.agent`, `com.mediatek.extservice`, `com.mediatek.network`, `com.mediatek.hotkey.dispatcher`, `com.mediatek.tvinputservice.arbitratorservice` | MediaTek TVs: input framework, core TV service, power/timers/hotkeys, picture/CEC/audio, persistent network monitor | CYT xiaomi-mitv-moor2, -mosr4, -moeu0, -mteq0; AlPeFe |
| `com.mediatek.wwtv.tvcenter` | MediaTek TV centre; handles power/standby. Disabled, the TV woke itself from standby | AlPeFe (first-hand; re-enabled) |
| `com.droidlogic*` (`com.droidlogic.tvinput`, `.droidlivetv`, `.tv.settings`, `.tv.soundeffectsettings`, `.ble`), `com.xiaomi.android.TV.audio` | Amlogic boxes/TVs: inputs, Live TV, settings, sound, BLE remote | Uselessbott keep list; megarohas; CYT xiaomi-mi-box-s |
| `com.google.android.tungsten.setupwraith` (Mi Box S) | Handles remote pairing on the Mi Box S. Elsewhere it is keep-unless-swapping-launcher | CYT xiaomi-mi-box-s; Uselessbott keep list |
| `com.mitv.tvhome` (China firmware PatchWall) | It is the HOME. Disabling it lands on FallbackHome's black screen | CYT xiaomi-mitv-ansp0, redmi-mitv-mftp0, xiaomi-mitv-astr0 |
| `com.xiaomi.mitv.tvplayer`, `com.xiaomi.mitv.settings`, `com.xiaomi.mitv.systemui`, `com.xiaomi.mitv.providers.settings` (China) | HDMI/AV player, the only full settings UI, volume/recents | CYT xiaomi-mitv-mteq0 |
| `com.xiaomi.mitv.tvmanager` (China HyperOS) | XiaoAI's "open <app>" runs through its provider | CYT xiaomi-mitv-mffu0 |

### Xiaomi: problems reported after debloating
- **PatchWall comes back**: `com.xiaomi.mitv.updateservice`'s LifeKeeper reinstalls `com.mitv.tvhome.atv` about 3 minutes after you disable it. Disable the updater first; then it stayed off for 37 days (CYT xiaomi-mi-box-s, third unit).
- **Home button hard-wired to PatchWall** on MiTV-MSSP3: you have to disable both `com.google.android.tvlauncher` and `com.mitv.tvhome.atv` after installing a replacement (AlPeFe). Disabling a package that also claims HOME (PatchWall) can make Android drop the default home ("Select a Home app") (CYT-TS).
- **TV woke itself from standby** after disabling `com.mediatek.wwtv.tvcenter` and `com.xiaomi.mitv.tvmanager`; fixed by re-enabling them. Later, a **reboot loop** led to re-enabling `updateservice`; the author suspects Chromecast's daily reboot may also be involved (AlPeFe DEBLOAT-LOG, MSSP3).
- **setupwraith**: Wi-Fi was lost when it owned the saved network (Mi TV Box S 3rd gen AFMU0, MOSR4). **A reboot on its RecoveryActivity factory-reset a MOSR4**. On Google TV 14 (MZTU0), its RecoveryActivity took Home and system_server crash-looped, and the TV dropped Wi-Fi every minute. Recover with `pm enable --user 0 com.google.android.apps.tv.launcherx`. Disable setupwraith *before* launcherx (CYT-TS).
- **Options button and motion-smoothing toggle lost** after `pm uninstall` of a list that included `mitv.service`. The author recommends disabling one package at a time instead (RamXcorp).
- **"Install Xiaomi TV+?" popup** from PatchWall when `mitvplus` is missing (AXSO0; ravhirizaldi works around it with a dummy package).
- **Voice/Mi Home**: disabling all five XiaoAI packages cut voice control from an external speaker (CYT xiaomi-mitv-ansp0). Disabling `katniss` stops the remote's microphone (Habr).
- **Re-enabled at boot**: the voice assistant on MSSP3 Android 9 (rescan of an updated system app) and Ambient on the Mi Box 3 (CYT examples/README).
- **Grey "ghost" ad rows** stay after disabling Play Movies; clear the launcher's data to remove them (Habr).
- **China firmware rejects third-party HOME** (package-name allow-list on MiTV-AETP0, Android 9). Disabling the stock launcher then falls back to FallbackHome (CYT-TS).
- **Side effect of ADB, not of debloating**: USB debugging cuts power to the USB port on the Mi Box S and TV Box S 3rd gen (CYT xiaomi-mi-box-s, CYT-TS).

### Xiaomi: differences by OS / product
- **Android TV 9/10/11 TVs and Mi Box 3 / Mi Box S (international)**: Google `tvlauncher` is home. PatchWall (`com.mitv.tvhome.atv`) is a separate app that can hijack the Home key. MediaTek TVs use `com.mediatek.*` (keep); Amlogic boxes and TVs use `com.droidlogic*` (keep).
- **Google TV 11/14 (Mi Box S 2nd gen, TV Box S 3rd gen, TV Stick 4K 2nd gen, MOOR2/MOSR4, MOEU0, MZTU0)**: launcherx is home, with PatchWall as a "Mi Home"/oemtab content tab (`com.mitv.tvhome.oemtab`, `com.mitv.tvhome.atv`). `setupwraith` claims HOME during a launcher swap. `com.xiaomi.tvqs.overseas(.y24)` may be the quick-settings panel (CYT).
- **China firmware (no Google apps; HyperOS TV 2/3)**: `com.mitv.tvhome` is the home, so never disable it. Extra ad/telemetry layer: `com.xiaomi.tvqs`, `com.mitv.cloudcontrol`, `com.mitv.shoplugin`, `com.xiaomi.mitv.hyper.screensaver`. ADB often closes on every reboot (CYT).
- **Redmi MiTV-ANTL0 (Android 5.1.1, not Android TV)**: needs `pm hide` instead of `pm disable-user` (CYT examples/README).

---

## What I could not find / caveats
- **XDA threads** (for example "[Ask] remove TCL TV bloatware", "TCL 55P8M … BeyondTV", "Xiaomi TV to AndroidTV style and remove ads", the Mi Box MDZ-16/22-AB firmware thread) returned **HTTP 403** and were not read. **Reddit** threads did not show up in search. None of their content is used.
- **Universal Android Debloater**: I found no TV-specific coverage for these brands.
- **Hisense**: no independent source beyond rafimatchen. The Android TV 9/10 `com.hisense.*` names rest mostly on CYT.
- **Package roles change with firmware.** The same name can be bloat on one build and load-bearing on another: `com.tcl.partnercustomizer`, `com.tcl.ttvs`, `com.tcl.cyberui`, `com.xiaomi.tvqs.overseas`, `com.xiaomi.android.tvsetup.partnercustomizer`, `com.hisense.tv.smartservice`. A per-brand allow-list should only include **bloat** rows. Even those should run in batches of 5–10 with a test after each (Cobanov, TechPP) and a ~15 s wait before any reboot (CYT-TS).
- Several sources used `pm uninstall --user 0` (0x4f53, chrissy, Pikabu, RamXcorp, rc0j). Their reported breakage is worse than what `disable-user` would cause, but they still show which packages matter.

## Every URL used
- https://github.com/Gathin23/cleanyourtv
- https://github.com/Gathin23/cleanyourtv/tree/main/examples (and its `README.md` table; per-model folders `tcl-*`, `hisense-*`, `vidda-mt9653`, `xiaomi-*`, `redmi-*`)
- https://github.com/Gathin23/cleanyourtv/blob/main/docs/TROUBLESHOOTING.md
- https://pasqualepillitteri.it/en/news/25807/cleanyourtv-strip-ads-smart-tv-claude-code
- https://tv.cobanov.dev/en/
- https://tv.cobanov.dev/en/prompt.txt
- https://github.com/seun-novodev/android-tv-debloat-toolkit (raw `run_toolkit.py`)
- https://gist.github.com/llaumgui/e39fdbafc920edacf42fdff6d8ab3a0a
- https://gist.github.com/0x4f53/27bee9a0069f7bd6a2aa9eb60bb10d1e (script and comments)
- https://github.com/chrissy-dev/debloat-tlc-android-tv
- https://github.com/gaesa/TCLDebloater
- https://techpp.app/howto/debloat-android-tv-adb
- https://github.com/rafimatchen/tv
- https://gist.github.com/Shulian4K/0f1983cec54b3428116485624fd519a8
- http://cleanyourtv.site/brand/hisense/
- https://techjunctions.com/how-to-allow-unknown-sources-on-hisense-tv/
- https://habr.com/ru/articles/1044486/
- https://pikabu.ru/story/_14040546
- https://github.com/AlPeFe/xiaomi-tv-debloat (README, DEBLOAT-LOG.md, disabled-packages.txt)
- https://github.com/RamXcorp/mi-tv-limpieza
- https://github.com/Uselessbott/MiTVdebloat (packages/*.txt)
- https://github.com/rc0j/xiaomi-smarttv-debloat
- https://github.com/megarohas/megarohas_android_tv_tweaks/tree/main/debloat-mitv-google-tv
- https://github.com/skparidhi/xiaomi-tvhack (examples/xiaomi-mitv4i/debloat.txt)
- https://github.com/ravhirizaldi/mitv-axso0-patchwall-fix
- Attempted but not readable (HTTP 403): https://xdaforums.com/t/ask-remove-tcl-tv-bloatware.4193499/ , https://xdaforums.com/t/tcl-android-tv-model-55p8m-android-recovery-tcl-beyondtv-beyondtv.4025755/page-64
