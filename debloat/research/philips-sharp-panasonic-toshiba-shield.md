# ADB debloat research: Philips, Sharp, Panasonic, Toshiba, Nvidia Shield

Researched 2026-10-25. Web research only. No TV or adb device was touched.

## How to read this

- **Verdicts:** **bloat** means widely disabled without problems. **your call** means an optional feature some people use. **keep** means leave it alone unless you know why, because disabling it costs a feature or is disputed. **never** means disabling it breaks the TV: no inputs, no remote, no Home, no network, or a soft-brick.
- **Sources** use reference-style links. Each label resolves to a full URL in the "Every URL used" list at the end. A row marked "1 source" has only one report behind it. Several labels starting `CYT-` are separate owner-tested lists in one project, so they are separate units but not separate projects.
- **Where the sources come from.** Most package-level evidence is from three GitHub projects, all active in Sept-Oct 2026. Each holds per-model lists that owners tested on real TVs:
  - **CleanYourTV** (Gathin23/cleanyourtv) is by far the richest.
  - **dumbtv** (humblemuzzu/dumbtv).
  - **Shield Optimizer** (bryanroscoe/shield_optimizer). Its Shield data cites CleanYourTV for one finding, so the two are **not fully independent**.
- **Other sources.** For the Shield there are also independent gists and blogs. For the other brands there is very little outside those repos.
- **Gaps in access.** XDA forum pages returned HTTP 403 and AVForums returned 403, so neither could be read. Nothing from them is used.
- **Disable vs uninstall.** All of these projects use `pm disable-user --user 0`, except where a row says "uninstall". A few older guides use `pm uninstall -k --user 0`, which is a different risk profile.

### Cross-brand rules that recur in every source (read first)

1. **Stock launcher.** Only disable it *after* a replacement launcher is installed and confirmed as Home. The stock launcher is `com.google.android.tvlauncher` on Android TV and `com.google.android.apps.tv.launcherx` on Google TV. Check with `cmd package query-activities ... -c android.intent.category.HOME` and `dumpsys activity activities | grep mFocusedApp`. A firmware without `FallbackHome` gives a black screen at boot. ([CYT-TROUBLE])
2. **`com.google.android.tungsten.setupwraith` (the setup wizard).**
   - **Wi-Fi.** If the Wi-Fi network was joined during first setup, the network *belongs to* setupwraith, and disabling the wizard **deletes it**. The TV drops off Wi-Fi and ADB is lost. Seen on a Philips R8G, Sharp 2T-C32GH3000I, Sharp TVE23A, Panasonic 4KTV-0SU and Panasonic kowloon. Check `dumpsys wifi | grep -o 'cname=[^ ]*'` first. ([CYT-TROUBLE], [CYT-P-R8G], [CYT-S-GH3000I], [CYT-S-TVE23A], [CYT-PA-0SU], [CYT-PA-KOWLOON])
   - **Home.** On Google TV its `.RecoveryActivity` claims Home at priority 1. Some firmwares re-enable it at every cold boot, which leaves Home black. Seen on the Panasonic 4KTV-3MUP. ([CYT-ACER-R4G])
   - **Casting.** It also holds the Cast credentials on some builds, so casting can fail with "Untrusted device". ([CYT-TROUBLE])
3. **Partner customizers.** `com.google.android.leanbacklauncher.partnercustomizer` and `com.mediatek.android.leanbacklauncher.partnercustomizer` are **disputed**. Several lists disable them without problems. Two reports from other MediaTek TVs say the Input key and hotkeys died, with `com.mediatek.tv.service` crash-looping, *after the next reboot*. Always test with a reboot. ([CYT-CHIQ], [CYT-JVC-MENLO], [CYT-P-TA7])
4. **`com.google.android.tv.remote.service`.** Keep it. It is the phone remote and IME bridge, and on some sets the remote's mic button. Disabling it killed the mic button on a TCL G10. ([CYT-TROUBLE], [SO-SAFETY], [DTV-NEVER])
5. **Wait before rebooting.** Package state is written to disk with a delay of about 10 s. Wait before power-cycling, or the change is silently lost. ([CYT-P-8517])
6. **Never disable:**
   - Google Play Services and framework (`com.google.android.gms`, `com.google.android.gsf`) and the Play Store (`com.android.vending`).
   - `com.android.keychain`, `com.android.se`, `com.android.location.fused` (reported boot loop) and `com.android.shell` (ADB itself).
   - The active keyboard or IME, `com.android.tv.settings`, `com.android.systemui` and `com.android.providers.tv`.

   ([SO-SAFETY], [BH-GIST], [CYT-SH-PRO], [L1T])

---

## 1. Philips (TP Vision and other licensees)

**Scope and confidence.** Philips Android/Google TV is not one platform. Match on the board (`ro.product.device`) and the build fingerprint, never on the model number. ([CYT-P-8517], [CYT-P-7406])

| Platform | Boards and models | Notes | Sources |
|---|---|---|---|
| **A. TP Vision "xtv" platform**, `org.droidtv.*` vendor layer, Live TV `org.droidtv.playtv` | TPM171E `PH7M_EU_5596`, Android TV 8 (2017-18: 55PUS7503, 65PUS8102)<br>TPM191E `PH9M_EA_5599`, Android 9, later updated to Android TV 12 (2020: 50/75PUS8505, 65PUS9435, 55OLED705, 43PUS7304)<br>`PH1M_EA_9970A`, Android TV 11 (2021-22: 50PUS8517, 55/48OLED707, 65/55OLED706, 65OLED907, 65PML9506)<br>`PH1M_WW_9972`, **Google TV 12** (2023: 55OLED708) | Many independent owner units. **High** confidence for TP Vision telemetry and promo packages and for the "never" list. | [CYT-P-8517], [CYT-P-707], [CYT-P-706], [CYT-P-907], [CYT-P-9506], [CYT-P-8505], [CYT-P-TPM191E], [CYT-P-9435], [CYT-P-7503], [CYT-P-8102], [CYT-P-708], [DTV-P-TPM191E] |
| **B. TPV PH0M_EA_T32**, MediaTek turnkey (Live TV `com.mediatek.wwtv.tvcenter`, thin `org.droidtv` layer) | Android TV 11, 2020-21 (50PUD7406, 55PUS7906, 65PUG7406) | **Medium** confidence: three units. | [CYT-P-7406], [CYT-P-PUG7406] |
| **C. TPV Google TV TA7** | Brazil, Google TV 14, `PH3M_AL_T32`, `org.droidtv` on MediaTek | **Low** confidence: one unit. | [CYT-P-TA7] |
| **D. Other licensees** | US Philips R8G by **MOKA**, Realtek, Google TV 14<br>India Philips "Smart 4K" and 24NA 4K by **Skyworth**, Google TV 14 | Use the vendor's own packages (`com.realtek.*` / `com.smartdevice.*`). Nothing from A applies to them. **Low-medium** confidence. | [CYT-P-R8G], [CYT-P-SKY], [DTV-P-24NA] |

- **Model years.** On Android TV 8 (TPM171E), the Google rows are `com.google.android.tvtutorials` and `com.google.android.leanbacklauncher.recommendations`, and the owners were more cautious there. Platforms A-11 and A-12 behave alike. On Google TV 12 (PH1M_WW_9972), Samba TV ACR (`tv.samba.ssm`) and a Philips launcher tab provider appear and `usagelogger` is absent. The **remote's gear and Apps buttons are hard-coded to `launcherx`** through `org.droidtv.GlobalKey`. ([CYT-P-708])
- **Gaps.** I found no material for pre-2023 US Philips Android TVs, which were made by a different licensee.

### Package table

| Package | What it is | Group | Verdict | Sources |
|---|---|---|---|---|
| `org.droidtv.candeebug` | "DAC" analytics uploader: channels watched, HDMI-CEC devices, viewing times; uploads to AWS. Disable together with `gel` | telemetry | **bloat** | [CYT-P-8517], [CYT-P-707], [CYT-P-907], [CYT-P-8505], [CYT-P-708], [CYT-P-7406], [CYT-P-TA7], [CYT-P-50PUH8215], [DTV-P-TPM191E] |
| `org.droidtv.gel` | Metrics collector that runs inside candeebug's process | telemetry | **bloat** | same as candeebug |
| `org.droidtv.usagelogger` | Boot stats, remote keypress logging, panel telemetry | telemetry | **bloat** (caveats) | [CYT-P-8517], [CYT-P-8505], [CYT-P-706], [DTV-P-TPM191E]. On some builds it requests TV_INPUT_HARDWARE, and it **re-enabled itself at boot** on a 65PUS9435 ([CYT-P-9435]). Left enabled on a 50PUH8215 ([CYT-P-50PUH8215]) |
| `org.droidtv.tv.frameworklogger` | Hands reboot reasons and firmware-install records to the Philips logger | telemetry | **bloat** | [CYT-P-9506], [CYT-P-708], [CYT-P-7406], [CYT-P-8102]. dumbtv left it enabled ([DTV-P-TPM191E]) |
| `com.tpv.xmic.ots.cms.client` | TPV "CMS client" (Internet access, boot receiver) | telemetry | **bloat** | [CYT-P-7406] (1 source) |
| `tv.samba.ssm` | Samba TV ACR (recognises what is on screen) | telemetry | **bloat** | [CYT-P-708] (1 source) |
| `tv.inscape.tvclient.inscapeacr` | Inscape ACR client. Its `inscape_fp` daemon keeps running without root but collects nothing | telemetry | **bloat** | [CYT-P-8102] (1 source) |
| `tv.anoki.acr.anokiacroptin` | Anoki ACR on the MOKA R8G | telemetry | **bloat** | [CYT-P-R8G] (1 source for Philips; also on Sharp) |
| `org.droidtv.nettvrecommender` | "Top Picks" promotion row | ads | **bloat** | [CYT-P-8517], [CYT-P-707], [CYT-P-8505], [CYT-P-7503], [CYT-P-TPM191E], [DTV-P-TPM191E] |
| `org.droidtv.recommendation` | Backend for Top Picks. Disable it after the row | ads | **bloat** | [CYT-P-8517], [CYT-P-8505], [CYT-P-907], [DTV-P-TPM191E] |
| `org.droidtv.oemtabprovider` | "Philips" promo tab on the Google TV home | ads | **bloat** | [CYT-P-708] (1 source) |
| `org.droidtv.nettv.market` | "Smart TV Collection" app storefront | store | **bloat** | [CYT-P-8517], [CYT-P-8505], [CYT-P-907], [CYT-P-7406], [CYT-P-TPM191E], [CYT-P-50PUH8215] |
| `org.droidtv.nettvapps` | Silent preload installer for the app gallery. On one TV it **re-installed about 26 apps at every screen-on** | store | **bloat** | [CYT-P-9506], [CYT-P-707], [CYT-P-907], [CYT-P-8102] |
| `org.droidtv.nettvappNNNN`, for example `nettvapp1814` (ARTE), `4546` (MEGOGO), `4655` (Deezer), `4932` (PlayWorks), `5326` (Toon Goggles), `5512` (Fishing TV), `5527` (Flix Premiere), `20004410` (Couchplay) | Preinstalled web-app tiles. Labels were read from each APK | store | **bloat** (keep the ones you use) | [CYT-P-8517], [CYT-P-8102], [CYT-P-9506], [DTV-P-TPM191E] |
| `org.droidtv.nettv_launcherapp` | NetTV app launcher entry (Android 8) | store | **bloat** | [CYT-P-8102] (1 source) |
| `android.autoinstalls.config.tpv.device` | Play auto-install of TPV partner apps | ads | **bloat** | [CYT-P-907], [CYT-P-TA7], [CYT-P-706] |
| `org.droidtv.demome` | "Demo me" retail demo loop | demo | **bloat** (caveats) | [CYT-P-8517], [CYT-P-8505], [DTV-P-TPM191E]. Requests TV_INPUT_HARDWARE and was kept on the 55OLED708. **Re-enables at boot** on a 65PUS9435 ([CYT-P-708], [CYT-P-9435]) |
| `org.droidtv.sticker` | e-sticker and shop banners | demo | **bloat** | [CYT-P-8505], [CYT-P-50PUH8215], [DTV-P-TPM191E] |
| `fusion.android.tv.demo` | Retail demo on the PH0M and TA7 platforms | demo | **bloat** | [CYT-P-7406]; owner already had it off on the TA7 ([CYT-P-TA7]) |
| `com.apps.esticker3` | Store-demo sticker overlay on the MOKA R8G | demo | **bloat** | [CYT-P-R8G] (1 source) |
| `com.google.android.tvtutorials` | Android TV first-run tutorials (Android 8) | demo | **bloat** | [CYT-P-7503], [CYT-P-8102] |
| `com.mstar.android.tv.disclaimercustomization` | Disclaimer popup | other | **bloat** | [CYT-P-7406], [CYT-P-TA7] |
| `org.droidtv.consentcmpapp` | TP Vision ad-consent (CMP) screen | ads | **bloat** | [CYT-P-TA7] (1 source) |
| `com.google.android.feedback` | Market Feedback Agent | telemetry | **bloat** | almost every Philips list, plus [DTV-P-TPM191E] |
| `com.google.android.partnersetup` | Partner referrer and attribution | telemetry | **bloat** | [CYT-P-8517], [CYT-P-907], [CYT-P-8505], [CYT-P-TA7] |
| `com.google.android.onetimeinitializer` | Runs once at first setup | other | **bloat** | [CYT-P-8517], [CYT-P-8505], [CYT-P-TA7] |
| `com.google.android.sss.authbridge` | Set-up-from-phone helper | other | **bloat** | [CYT-P-8517], [CYT-P-907], [CYT-P-9506] |
| `com.google.android.syncadapters.calendar` | Calendar sync (no calendar app on the TV) | other | **bloat** | [CYT-P-8517], [CYT-P-8505], [CYT-P-TA7] |
| `com.google.android.leanbacklauncher.recommendations` | Recommendation rows of the old launcher (Android 8) | ads | **bloat** | [CYT-P-7503], [CYT-P-8102] |
| `org.droidtv.android.fitness` | "Fitness Buddy" preload | other | **bloat** | [CYT-P-8517], [CYT-P-8505], [CYT-P-707] |
| `com.zeasn.whalelive` | WhaleLive ad-supported FAST channels | ads | **bloat** | [CYT-P-8517], [CYT-P-707], [CYT-P-9506], [CYT-P-9435] |
| `com.tpv.nftgallery` | "NFT Collection" art gallery | other | **bloat** | [CYT-P-708] (1 source) |
| `com.opera.sdk.example` | Opera TV SDK sample app (Android 8) | other | **bloat** | [CYT-P-8102] (1 source) |
| `com.mediatek.android.leanbacklauncher.partnercustomizer` | Partner rows for the stock launcher (MediaTek turnkey) | ads | **your call** (disputed) | Disabled on the PH0M ([CYT-P-7406]). **Kept** on the TA7 because it crash-looped `tv.service` on another MediaTek TV ([CYT-P-TA7], [CYT-JVC-MENLO]) |
| `com.realtek.leanbacklauncher.partnercustomizer` | Realtek partner rows (R8G) | ads | **bloat** | [CYT-P-R8G] (1 source) |
| `com.smartdevice.recommendation`, `com.smartdevice.leanbacklauncher.customizer`, `com.smartdevice.aftersale`, `com.smartdevice.recordactivation`, `com.smartdevice.dailymanage`, `com.smartdevice.myapp`, `com.Smartdevice.emanual` | Skyworth-built Philips (India): recommendation rows, after-sale and activation trackers, cleaner, e-manual | ads / telemetry | **bloat** | [CYT-P-SKY], [DTV-P-24NA] (these were *uninstalled* in dumbtv) |
| `org.droidtv.amazonalexa` | Alexa bridge. Live TV binds into it, but zapping and the guide still worked without it | voice | **your call** | [CYT-P-8517], [CYT-P-707], [CYT-P-8505]. Kept on the TPM191E for "Alexa power on" ([CYT-P-TPM191E]) |
| `com.google.android.katniss` | Google Assistant and voice search. The mic button stops working | voice | **your call** | [CYT-P-8517], [CYT-P-8505], [CYT-P-907] |
| `com.android.hotwordenrollment.okgoogle`, `.xgoogle` | Hotword enrollment (Skyworth Philips) | voice | **your call** | [CYT-P-SKY] (1 source) |
| `org.droidtv.m7opapp`, `org.droidtv.astrahdplus`, `com.mediatek.opapp` | Satellite operator apps (M7 / Canal Digitaal, HD+). Keep if you subscribe | streaming | **your call** | [CYT-P-8517], [CYT-P-706], [CYT-P-708], [CYT-P-TA7] |
| `org.droidtv.dlna` | DLNA/UPnP server and renderer | feature | **your call** | Disabled cleanly on the PH1M ([CYT-P-8517]). **Keep on TPM191E**: the Media app (`contentexplorer`) binds it ([CYT-P-8505], [CYT-P-TPM191E]) |
| `org.droidtv.ipcontrol` | LAN control of volume and Ambilight. It is *not* the JointSpace API, which `xtv` serves | feature | **your call** (keep for Home Assistant) | [CYT-P-8517], [CYT-P-907] |
| `com.phorus.playfi.tv` | DTS Play-Fi multi-room audio. **Re-enables itself at every boot** on 55OLED707, TPM191E, 75PUS8505 and 65PUS9435, but stayed off on the 55OLED708 | feature | **your call** (pointless to list on most) | [CYT-P-707], [CYT-P-8505], [CYT-P-9435], [CYT-P-708] |
| `com.phorus.playfi.softap` | Play-Fi soft access point helper; stays disabled | feature | **your call** | [CYT-P-8505], [CYT-P-707], [CYT-P-708] |
| `io.mimi.tvapp`, `io.mimi.sdk.service` | Mimi hearing-personalised sound; sound menus still open | feature | **your call** | [CYT-P-706], [CYT-P-708] |
| `org.droidtv.dropboxprovider` | Dropbox source in Media | feature | **your call** | [CYT-P-706] (1 source) |
| `org.droidtv.control4app`, `control4adapterservice`, `control4sddp`, `control4UcService`, `org.droidtv.matter` | Control4 and Matter smart-home integration (Google TV 12) | feature | **your call** | [CYT-P-708] (1 source) |
| `com.tm.replica` | "Replica" iPhone screen mirroring | feature | **your call** | [CYT-P-708] (1 source) |
| `com.mediatek.dialservice` | DIAL, which Netflix and YouTube phone apps use to find the TV | feature | **your call** | [CYT-P-708], [CYT-P-SKY] |
| `com.google.android.apps.mediashell` | Chromecast built-in. **Can't stay disabled** on PH1M Android 11: back about 35 s after boot. Disabling it fixed YouTube auto-closing on a huge shared network | feature | **your call** | [CYT-P-8517], [CYT-P-706], [CYT-P-7406] |
| `com.google.android.tvrecommendations` | "Android TV Core Services": rows **and the system notification panel**, which goes device-wide. Disable the launcher *first*, or the stock launcher is killed. Re-enabled at boot on one TPM191E | ads | **your call** (only with a replacement launcher) | [CYT-P-8517], [CYT-P-8505], [CYT-P-TPM191E], [DTV-P-TPM191E] |
| `com.google.android.backdrop` / `com.google.android.apps.tv.dreamx` | Ambient screensaver. Point `screensaver_components` elsewhere first | feature | **your call** | [CYT-P-7406], [CYT-P-R8G] |
| `com.google.android.youtube.tv` | YouTube. The remote's YouTube key is bound to it | streaming | **your call** | [CYT-P-8517] |
| `com.netflix.ninja`, `com.amazon.amazonvideo.livingroom`, `com.disney.disneyplus`, `com.apple.atve.androidtv.appletv`, `com.google.android.videos`, `com.google.android.youtube.tvmusic`, `com.google.android.play.games`, `tv.wuaki.apptv`, `com.mgmedia.androidApp`, `tv.pluto.android`, `com.boosteroidtv.streaming`, `com.ted.android.tv`, `com.singa.client`, `com.blacknut.client` | Preinstalled streaming and game apps | streaming | **your call** | [CYT-P-8517], [CYT-P-707], [CYT-P-9506], [CYT-P-9435], [CYT-P-8102] |
| `com.google.android.marvin.talkback` | TalkBack screen reader | other | **your call** | [CYT-P-8517], [CYT-P-TPM191E] |
| `org.droidtv.philipstvdrawer` | Philips side menu with shortcuts (not ads) | feature | **keep** (safe but useful) | [CYT-P-8517] (1 source) |
| `org.droidtv.nettvregistration` | Smart TV registration | store | **keep** (disputed) | DO-NOT list "for firmware updates" in [CYT-P-8517], kept in [CYT-P-7406]. Disabled on Android 8 in [CYT-P-8102] |
| `org.droidtv.aurora` | Ambient-screen service. Disabled, it leaves `xtv` retrying every 201 ms forever; nothing visible breaks. Factory-disabled on some French and Polish units with no loop | other | **keep** | [CYT-P-8517], [CYT-P-706] |
| `org.droidtv.tv.playFiAudioService` | Bound by Settings, `audiocalibration` and `tpvaudiomanager` | feature | **keep** | [CYT-P-708] (1 source) |
| `com.google.android.tungsten.setupwraith` | Setup wizard. Wi-Fi deletion risk; claims Home on Google TV | other | **keep** (disable only on Ethernet or after re-joining Wi-Fi) | [CYT-P-707], [CYT-P-907], [CYT-P-708], [CYT-P-R8G], [CYT-TROUBLE] |
| `com.google.android.tvlauncher` / `com.google.android.apps.tv.launcherx` | Stock home | other | **keep** (until a replacement is Home) | all Philips lists; [DTV-NEVER] |

### Never disable (Philips)

All of these come from the "DO NOT DISABLE" blocks, which were "checked by walking every intent resolver table and every service binding" on platform A ([CYT-P-8517]), plus later units.

- **Contextual help.** Disabling `org.droidtv.eum` kills the SOURCES drawer: it opens and vanishes within a second, so HDMI inputs can't be reached from the remote. It looks like a plain e-manual but `xtv` binds it. ([CYT-P-8517], [CYT-P-8505], [DTV-P-TPM191E])
  - **Possible match:** AndroidPlanet says that on a recent Philips the apps "TV-gids", "Zo kunt u..." and "TV" must stay enabled, or the remote's source button stops working ([ANDROIDPLANET]). The article names no packages. Matching "Zo kunt u..." to `eum` and "TV" to `playtv` is my inference.
- **SOURCES key on TPM191E Android 12:** `org.droidtv.fastip`. It looks like a FAST-channels promo, but the sources drawer checks for it and vanishes without it. ([CYT-P-8505])
- **TV engine, tuner and inputs:**
  - `org.droidtv.xtv` also serves the JointSpace API on ports 1925/1926.
  - `xtvsystem`, `playtv`, `channels`, `epgdata`, `dvbi`, `teletext`, `ci`, `hdmiservice`, `euinstallertc`, `euinstallersat`, `hbbtvopapp`, `tv.tptvservice`, `icp`, `sunrise`.
  - `com.mediatek.tvinput`, `com.mediatek.tvinputservice.arbitratorservice`, `tv.agent`, `com.android.providers.tv`.
  - On Android 8: `com.mediatek.tunerservice`.
  - On Google TV 12: `com.mediatek.tis` (HDMI inputs), `com.mediatek.dtv.tvinput.dvbtuner` and `com.mediatek.browservice`.

  ([CYT-P-8517], [CYT-P-7503], [CYT-P-708])
- **Shell, power, remote and keys:** `org.droidtv.tvsystemui`, `tvpowermanagerservice`, `org.droidtv.GlobalKey`, `lkb` (front keypad), `org.droidtv.settings`, `menudataapp`, `homeintentresolver`, `com.google.android.tv.remote.service`. ([CYT-P-8517])
- **Firmware update:** `org.droidtv.oad`, `com.easy.oad` (remote firmware), `devicesetup`, `networkwizard`, `nettvregistration`. On Google TV 12 also `org.droidtv.upgradeapp` and `com.mediatek.tv.systemupdater`. ([CYT-P-8517], [CYT-P-708])
- **HbbTV and browser engine:** `com.vewd.core.browserui` and `org.droidtv.nettvbrowser`. Disabling `nettvbrowser` breaks the red button, and ITVX hung on a UK TV without it. ([CYT-P-707], [CYT-P-8102])
- **Ambilight, picture and sound calibration:** `org.droidtv.ambiair`, `ambihuecommon`, `alhuewizard`, `audiocalibration`, `calmancalibrator`, `bluetoothaudiosink`, plus `org.droidtv.ambisvc` on the TA7. ([CYT-P-8517], [CYT-P-9435], [CYT-P-TA7])
- **USB media:** `org.droidtv.contentexplorer` ("Media"), `org.droidtv.exoplayerservice` (its player), `org.droidtv.usbbreakin`. `com.mediatek.backgrounddetection` holds the USB debugging service. ([CYT-P-8505])
- **Platform B (PH0M):** `com.mediatek.wwtv.tvcenter`, `com.mediatek.tvinput`, `com.mediatek.tv.service`, `org.droidtv`, `org.droidtv.icp`, `com.android.tv.ota`. Do not even open `com.mediatek.tv.factory` or `mediatek.factorymenu.ui`. ([CYT-P-7406])
- **MOKA R8G:**
  - Live TV and inputs: `com.realtek.tv`, `com.realtek.tv.passthrough`, `com.realtek.tv.atsc`, `com.realtek.tv.atv`, `com.realtek.systemservice`, `com.realtek.menu`.
  - Phone remote, remote firmware and find-my-remote: `com.google.android.tv.dfuservice`.
  - Firmware updates: `com.realsil.ota`.

  ([CYT-P-R8G])
- **Skyworth (India):**
  - Remote over BLE and hot keys: `com.smartdevice.bleconnectservice` and `com.smartdevice.global.service`.
  - Bluetooth audio: `com.smartdevice.duplebluetooth`.
  - Panel calibration: `com.smartdevice.factory`.
  - Quick menu: `com.smartdevice.dailyshortcut`.
  - Live TV: `com.cltv.hybrid` and `com.cltv.mal`.
  - Power and keys: `com.mediatek.tv.agent`.
  - Firmware updates: `com.mediatek.tv.systemupdater`.

  ([CYT-P-SKY])

### Known problems reported after debloating (Philips)

- **`eum` or `aurora` disabled.** The persistent `xtv` retries forever at about 5 per second. With `eum` the SOURCES drawer dies. `pm enable` fixes it immediately. ([CYT-P-8517])
- **`fastip` disabled on TPM191E Android 12.** The SOURCES drawer vanishes on every press. ([CYT-P-8505])
- **`tvrecommendations` disabled before the stock launcher.** The live launcher is force-killed and the notification panel is gone device-wide. ([CYT-P-8517], [CYT-P-707])
- **Google TV 12 with `launcherx` disabled.** The remote's gear and Apps buttons do nothing, because `GlobalKey` hard-codes them to `launcherx`. An accessibility key helper is needed. ([CYT-P-708], [CYT-P-TA7])
- **setupwraith disabled on the R8G.** The saved Wi-Fi was deleted and the TV went offline; it took a USB keyboard to rejoin. ([CYT-P-R8G])
- **Packages that re-enable themselves at boot:** Play-Fi, `mediashell` on PH1M, and `usagelogger` and `demome` on one 65PUS9435. ([CYT-P-707], [CYT-P-8517], [CYT-P-9435])
- **Untested on Philips.** An XDA user is quoted in search snippets warning that `adb reboot bootloader` soft-bricks Philips TVs. I could not read XDA (HTTP 403).

---

## 2. Sharp (AQUOS Android TV / Google TV)

**Scope and confidence.** Little public material. Everything package-level comes from three CleanYourTV lists, one CleanYourTV device note and one undated blog. The note covers two units of the 32FI4EA.

| Platform | Models | Sources |
|---|---|---|
| **CVTE/MediaTek "AQUOS" builds**, European UMC licensee | TVE21F: **Android TV 14**, UK, `banqiao`<br>TVE23A: **Google TV 14**, Denmark, `sandiego`<br>32FI4EA / AQUOS-TVE19G: Android TV 11 (device note only) | [CYT-S-TVE21F], [CYT-S-TVE23A], [CYT-S-32FI4EA] |
| **Skyworth-built Google TV 14** | 2T-C32GH3000I, Indonesia, 1 GB RAM | [CYT-S-GH3000I] |

- **Shared packages.** The Skyworth Sharp shares its `com.smartdevice.*` package set with Skyworth-built Philips (India) and Panasonic sets, which gives those rows some corroboration.
- **Old Sharp blog** ([MINHAZ]). It uses `pm uninstall` on an unnamed Sharp model, and its list **includes the Live TV app `com.mediatek.wwtv.tvcenter`**, which every other source says to keep.
- **Gaps.** I found **nothing** for Japanese-market AQUOS Android TVs (`jp.co.sharp.*` builds). **Confidence: low to medium.**

### Package table

| Package | What it is | Group | Verdict | Sources |
|---|---|---|---|---|
| `tv.anoki.acr.anokiacroptin` | Anoki ACR (recognises what is on screen) | telemetry | **bloat** | [CYT-S-TVE21F], [CYT-S-TVE23A] |
| `tv.anoki.acr.controller` | ACR controller (present on one set only) | telemetry | **bloat** | [CYT-S-32FI4EA] (1 source) |
| `com.google.android.feedback` | Google feedback | telemetry | **bloat** | [CYT-S-TVE21F], [CYT-S-TVE23A], [CYT-S-GH3000I], [CYT-S-32FI4EA] |
| `com.android.tv.feedbackconsent` | Feedback consent dialog | telemetry | **bloat** | [CYT-S-TVE21F], [CYT-S-TVE23A], [CYT-S-GH3000I] |
| `com.android.adservices.api`, `com.android.ondevicepersonalization.services`, `com.android.federatedcompute.services` | Android ad and personalisation services (Android 14) | ads | **bloat** | [CYT-S-TVE23A], [CYT-S-GH3000I] |
| `fusion.android.tv.demo` | Retail and shop demo (`/system/app/UMCShopMode`) | demo | **bloat** | [CYT-S-TVE21F], [CYT-S-TVE23A], [CYT-S-32FI4EA], [MINHAZ] (uninstall) |
| `jp.co.sharp.av.android.epopdemo` | Sharp e-POP demo | demo | **bloat** | [MINHAZ] (uninstall); factory-disabled on the TVE23A ([CYT-S-TVE23A]) |
| `jp.co.sharp.av.android.storedemoapplication` | Store demo | demo | **bloat** | factory-disabled on the TVE23A ([CYT-S-TVE23A]) (1 source) |
| `android.autoinstalls.config.sharp`, `android.autoinstalls.config.hkc` | Play auto-install stubs | ads | **bloat** | [CYT-S-TVE21F] (1 source) |
| `com.google.android.partnersetup` | Play partner customisations | ads | **bloat** | [CYT-S-TVE21F], [CYT-S-TVE23A], [CYT-S-GH3000I] |
| `com.mediatek.android.leanbacklauncher.partnercustomizer` | Sharp partner rows on the stock launcher | ads | **your call** (disputed) | Disabled on the TVE21F and TVE23A ([CYT-S-TVE21F], [CYT-S-TVE23A]). Reported to crash-loop `tv.service` after a reboot on other MediaTek TVs ([CYT-JVC-MENLO], [CYT-CHIQ]) |
| `umc.com.emanual` | On-screen manual | other | **bloat** | [CYT-S-TVE23A] (1 source) |
| `jp.co.sharp.av.android.emanual` | e-manual | other | **bloat** | [MINHAZ] (1 source, uninstall) |
| `com.cvte.tv.fac.menu`, `com.cvte.tv.fac.aging`, `com.cvte.tv.at`, `com.at.factory.factorymanager`, `com.at.factory.androidtvaidlservice` | CVTE factory and test tools (checked with `dumpsys` only, never launched) | other | **bloat** | [CYT-S-TVE21F]; the last three also in [CYT-S-TVE23A] |
| `com.android.healthconnect.controller`, `com.android.health.connect.backuprestore` | Health Connect | other | **bloat** | [CYT-S-TVE23A], [CYT-S-GH3000I] |
| `com.google.android.syncadapters.calendar` | Calendar sync | other | **bloat** | [CYT-S-TVE21F], [CYT-S-TVE23A] |
| `com.android.dynsystem`, `com.android.wallpaperbackup`, `com.android.settings.intelligence` | Idle system extras (memory pass) | other | **bloat** | [CYT-S-TVE23A], [CYT-S-GH3000I] |
| `com.android.providers.calendar` | Calendar storage | other | **your call** (disputed) | Disabled on the TVE23A ([CYT-S-TVE23A]). Shield Optimizer lists it as never-disable ([SO-SAFETY]) |
| `com.smartdevice.recordactivation`, `com.smartdevice.aftersale` | Skyworth activation and after-sale trackers. aftersale has boot and network receivers and can install APKs | telemetry | **bloat** | [CYT-S-GH3000I]; same packages on [CYT-P-SKY], [CYT-PA-0SU] |
| `com.smartdevice.recommendation`, `com.smartdevice.leanbacklauncher.customizer` | Skyworth/Coocaa recommendation rows and injected home rows | ads | **bloat** | [CYT-S-GH3000I], [CYT-P-SKY], [CYT-PA-0SU] |
| `com.Smartdevice.emanual`, `com.smartdevice.dailymanage` (TV Guard cleaner), `com.smartdevice.myapp` | Skyworth preloads | other | **bloat** | [CYT-S-GH3000I], [CYT-P-SKY] |
| `com.smartdevice.dtv.icast` | Coocaa iCast (AirPlay mirror and DLNA) | feature | **your call** | [CYT-S-GH3000I], [CYT-P-SKY], [CYT-PA-0SU] |
| `jp.co.sharp.av.android.sharpcocoroalbum.renderasia` | COCORO Album render service | feature | **your call** | [CYT-S-TVE23A] (1 source) |
| `rcota.android.av.sharp.co.jp.rcota` | Name suggests remote-control OTA; no source describes it | updater | **your call** | [MINHAZ] (uninstall); factory-disabled on the TVE23A ([CYT-S-TVE23A]) |
| `azan.android.av.sharp.co.jp` | Not described by any source | other | **your call** | [MINHAZ] (uninstall); factory-disabled on the TVE23A ([CYT-S-TVE23A]) |
| `com.mstar.android.tv.disclaimercustomization` | Disclaimer screen | other | **keep** (disputed) | Uninstalled by [MINHAZ]; kept on purpose in [CYT-S-TVE21F] and [CYT-S-TVE23A] |
| `com.google.android.katniss` | Assistant and voice search | voice | **your call** | [CYT-S-TVE21F] (off); kept on [CYT-S-TVE23A] and [CYT-S-GH3000I] |
| `com.google.android.tts` | Google TTS | voice | **keep** (disputed) | Disabled on the TVE23A ("voice typing does not use it") ([CYT-S-TVE23A]). Others say in-app speech or accessibility need it ([CYT-P-SKY], [SO-SAFETY]) |
| `com.google.android.tv.remote.service` | Phone remote and the mic-button bridge | other | **keep** | Disabled on the TVE21F, but [CYT-TROUBLE] lists the TVE21F among the lists that may lose the mic button. Kept on the TVE23A for voice typing |
| `com.google.android.apps.mediashell`, `com.google.android.backdrop`, `com.google.android.apps.tv.dreamx` | Chromecast; ambient screensaver | feature | **your call** | [CYT-S-TVE21F], [CYT-S-TVE23A], [CYT-S-GH3000I] |
| `com.tcl.browser` (BrowseHere), `com.cxinventor.file.explorer` | Preloaded browser and file manager | other | **your call** | [CYT-S-TVE21F] |
| `com.amazon.amazonvideo.livingroom`, `com.disney.disneyplus`, `com.spotify.tv.android`, `tv.arte.plus7`, `fr.francetv.pluzz`, `com.megogo.application`, `com.google.android.youtube.tv`, `com.google.android.youtube.tvmusic`, `com.google.android.play.games` | Streaming and preloads | streaming | **your call** | [CYT-S-TVE21F], [CYT-S-TVE23A], [CYT-S-GH3000I], [MINHAZ] |
| `com.google.android.tungsten.setupwraith` | Setup wizard. **Owned the setup Wi-Fi** on the TVE23A and GH3000I; on the TVE21F it did not | other | **keep** (re-join Wi-Fi first) | [CYT-S-TVE23A], [CYT-S-GH3000I], [CYT-S-TVE21F] |
| `com.google.android.apps.tv.launcherx` / `com.google.android.tvlauncher` | Stock home. With launcherx off, Google TV voice *content* search fails (`provider.OPEN ... UNKNOWN_ERROR`); app commands still work | other | **keep** (until replaced) | [CYT-S-GH3000I], [CYT-S-32FI4EA] |

### Never disable (Sharp)

- **Live TV and inputs:**
  - `com.mediatek.wwtv.tvcenter`, `com.mediatek.tvinput`, `com.mediatek.tv.service`, `com.google.android.tv.inputplayer`.
  - Channel scan: `com.mediatek.wwtv.setupwizard`.
  - UK: `com.mediatek.tv.freeviewplay`.

  ([CYT-S-TVE21F], [CYT-S-TVE23A], [CYT-S-32FI4EA])
  - **Conflict:** [MINHAZ] *uninstalls* `com.mediatek.wwtv.tvcenter`. That is almost certainly wrong for anyone who uses a tuner or HDMI, because it is the Live TV app the Inputs menu opens.
- **Remote:**
  - Pairing and the Bluetooth remote: `com.mediatek.autopair`, `jp.co.sharp.av.android.asia.tvbtremoteapp`.
  - Hotkeys: `com.cvte.hotkey.dispatcher`.
  - Remote firmware: `com.cvte.tv.sharp_rc_ota`.

  ([CYT-S-TVE23A])
- **Picture:** `com.cvte.tv.kmode` (picture mode), `com.cvte.automaticbrightnesscontrol`, `com.cvte.tv.infoprovider`, `com.cvte.tv.applist`, all `com.cvte.overlay.*` and `com.mediatek.*` overlays. ([CYT-S-TVE21F], [CYT-S-TVE23A])
- **USB media:** `com.mediatek.wwtv.mediaplayer`. ([CYT-S-TVE21F], [CYT-S-TVE23A])
- **Skyworth Sharp:**
  - Global keys, BLE remote and find-my-remote: `com.smartdevice.global.service`.
  - GLOBAL_BUTTON receiver: `com.smartdevice.dailyshortcut`.
  - USB media: `com.tianci.localmedia`.
  - Remote pairing: `com.google.android.tv.googletvremotepairer`.
  - Live TV: `com.cltv.hybrid`.

  ([CYT-S-GH3000I])
- **Factory menus, left alone and never launched:** `com.mediatek.tv.factory` and `mediatek.factorymenu.ui`. ([CYT-S-TVE23A])

### Known problems (Sharp)

- **No breakage reported** with the published lists. The 32FI4EA note reports no faults ([CYT-S-32FI4EA]).
- **Remote keys after the stock launcher is disabled.** On the TVE23A the gear button (KEYCODE_STAR) only reached the notification panel through launcherx. It needs an accessibility key helper. ([CYT-S-TVE23A])
- **Held volume key.** With a key helper bound, a held volume key steps once instead of ramping. ([CYT-S-TVE23A])

---

## 3. Panasonic (Android TV / Google TV models only)

**Scope and confidence.** Panasonic's own platform history matters:

- **Europe.** Panasonic sold Android TV in the upper mid-range (2022 LXW/JXW series) and used **My Home Screen** on its best sets ([HIFI-DE]). From 2024 most of the range moved to **Fire TV**. The What Hi-Fi headline confirms Fire OS on the 2024 flagship Z95A ([WHATHIFI]). The "most of the range" part comes from search-result summaries only. Fire TV and My Home Screen models are out of scope here: Fire OS will not let a launcher take Home, and its protected packages refuse `pm disable-user` ([CYT-TOSHIBA-FIRE]).
- **What I found is Asia, Gulf and India builds by other makers, not Panasonic's European LXW/JXW Android sets:**

| Platform | Model | OS | Sources |
|---|---|---|---|
| Skyworth-built | 4KTV-0SU, Gulf | Android TV 10 | [CYT-PA-0SU] |
| Skyworth-built | TH-40HS550K, `shibuya` | Android TV 11 | [CYT-PA-HS550K] |
| MediaTek "Jupiter_PA" | 4KTV-JUP | Android TV 11 | [CYT-PA-JUP] |
| `kowloon` / OZUM | Panasonic Google TV LCD | Google TV 14 | [CYT-PA-KOWLOON] |
| MOKA `R4_GTV` | 4KTV-3MUP | Google TV 14 | [CYT-ACER-R4G] |

- **Gaps.** I found **no package-level material for European Panasonic Android TVs** (LXW/JXW).
- **Confidence: low.** Each list is one TV with hours or about a day of use.

### Package table

| Package | What it is | Group | Verdict | Sources |
|---|---|---|---|---|
| `com.panasonic.ehelp` | Panasonic help | other | **bloat** | [CYT-PA-JUP] (1 source) |
| `com.panasonic.demomode` | Demo mode | demo | **bloat** | [CYT-PA-JUP] (1 source) |
| `com.panasonic.hotelmode` | Hotel mode | other | **bloat** | [CYT-PA-JUP] (1 source) |
| `com.mediatek.wwtv.tvrecommendation` | MediaTek TV recommendation rows | ads | **bloat** | [CYT-PA-JUP] (1 source) |
| `com.smartdevice.recommendation` | "Daily Play" sponsored row | ads | **bloat** | [CYT-PA-0SU]; same package on [CYT-S-GH3000I], [CYT-P-SKY] |
| `com.smartdevice.acr.recommendation` | ACR (recognises what is on screen) | telemetry | **bloat** | [CYT-PA-0SU] (1 source) |
| `com.smartdevice.leanbacklauncher.customizer` | Partner rows and "Shop" tab | ads | **bloat** | [CYT-PA-0SU], [CYT-S-GH3000I] |
| `android.autoinstalls.config.SW` / `android.autoinstalls.config.skyworth` | Play auto-install configs | ads | **bloat** | [CYT-PA-0SU], [CYT-PA-HS550K] |
| `fusion.android.tv.demo` | Skyworth retail demo service | demo | **bloat** | [CYT-PA-0SU], [CYT-PA-HS550K] |
| `com.smartdevice.epopplayer` | e-POP shop-floor promo player | demo | **bloat** | [CYT-PA-0SU] (1 source) |
| `com.smartdevice.common.demonow` | "Demo Now" store demo | demo | **bloat** | [CYT-PA-HS550K] (1 source) |
| `com.mstar.android.tv.disclaimercustomization` | Disclaimer screen used only in first-run setup | other | **bloat** | [CYT-PA-0SU], [CYT-PA-HS550K] |
| `com.Smartdevice.emanual` | E-Manual | other | **bloat** | [CYT-PA-0SU], [CYT-PA-HS550K] |
| `com.google.android.feedback`, `com.google.android.partnersetup`, `com.google.android.onetimeinitializer` | Google telemetry and setup leftovers | telemetry | **bloat** | [CYT-PA-0SU], [CYT-PA-JUP], [CYT-PA-HS550K] |
| `com.google.android.apps.nbu.smartconnect.tv` | Google background data service; registers a VpnService | other | **bloat** | [CYT-PA-HS550K] (1 source for Panasonic) |
| `com.mediatek.testpq` | MediaTek picture-quality test tool that starts at boot | other | **bloat** | [CYT-PA-HS550K] (1 source; the same file also says "never disable any `com.mediatek.*`", so treat it with care) |
| `com.android.printspooler`, `com.android.htmlviewer`, `com.android.backupconfirm`, `com.android.sharedstoragebackup`, `com.android.wallpaperbackup`, `com.google.android.syncadapters.calendar` | Unused background services | other | **bloat** | [CYT-PA-0SU], [CYT-PA-JUP] |
| `com.android.providers.calendar` | Calendar storage | other | **your call** (disputed) | Disabled in [CYT-PA-0SU] and [CYT-PA-JUP]; never-disable in [SO-SAFETY] |
| `com.FDGEntertainment.redball4.gp`, `com.joxdev.orbia`, `com.pomelogames.MarsGame`, `com.rkgames.basisgame`, `com.qjy.browser` | Preloaded games and browser | other | **bloat** | [CYT-PA-0SU] (1 source) |
| `com.google.android.tvrecommendations` | Recommendation rows | ads | **bloat** | [CYT-PA-0SU], [CYT-PA-JUP], [CYT-PA-HS550K] |
| `com.google.android.leanbacklauncher.partnercustomizer` | Partner config. On the HS550K it removes the Inputs and Wi-Fi icons from the stock launcher's top bar | ads | **your call** (disputed) | Disabled in [CYT-PA-JUP] and [CYT-PA-HS550K]. On another MediaTek TV, `tv.service` crash-loops and the Input key dies after a reboot ([CYT-CHIQ]) |
| `com.smartdevice.firewall` | Skyworth service with camera, mic and contacts permissions; not running | other | **your call** | [CYT-PA-0SU] (1 source) |
| `com.smartdevice.dtv.icast` | "CastPlay" mirroring, 4 services at boot | feature | **your call** | [CYT-PA-0SU] |
| `com.airoha.ble.ota` | "RC Upgrade", the Bluetooth remote's firmware updater; pairing still works | updater | **your call** | [CYT-PA-HS550K] (1 source) |
| `com.mediatek.wwtv.mediaplayer` / `com.tianci.localmedia` | USB media player ("Media" tile) | feature | **your call** | [CYT-PA-HS550K], [CYT-PA-0SU] |
| `com.google.android.backdrop` | Ambient screensaver | feature | **your call** | [CYT-PA-0SU], [CYT-PA-JUP] |
| `com.google.android.katniss`, `com.google.android.apps.mediashell`, `com.google.android.apps.tachyon` | Assistant, Chromecast, Meet/Duo | voice / feature | **your call** | [CYT-PA-0SU], [CYT-PA-HS550K] |
| `com.netflix.ninja`, `com.amazon.amazonvideo.livingroom`, `com.disney.disneyplus`, `com.viaplay.android`, `com.google.android.videos`, `com.google.android.youtube.tvmusic`, `com.google.android.play.games` | Streaming and preloads | streaming | **your call** | [CYT-PA-KOWLOON], [CYT-PA-0SU], [CYT-PA-JUP] |
| `com.google.android.tungsten.setupwraith` | Setup wizard | other | **keep** | Owns the saved Wi-Fi on the 0SU and kowloon. On the MOKA 4KTV-3MUP the firmware re-enables it at every cold boot, which leaves Home black ([CYT-PA-0SU], [CYT-PA-KOWLOON], [CYT-ACER-R4G]). Disabled without problems on the JUP ([CYT-PA-JUP]) |
| `com.google.android.tvlauncher` / `com.google.android.apps.tv.launcherx` | Stock home | other | **keep** (until replaced; on the MOKA 3MUP keep it permanently) | [CYT-ACER-R4G] |

### Never disable (Panasonic)

- **Every `com.mediatek.*` package** (tuner, inputs, HDMI), stated in three of the four lists. The exceptions are the test and USB player packages above. ([CYT-PA-JUP], [CYT-PA-HS550K], [CYT-PA-KOWLOON])
- **Live TV and input OSD:** `com.mediatek.wwtv.tvcenter`. On the Skyworth 0SU it is `com.smartdevice.livetv`, which the Inputs menu opens. ([CYT-PA-0SU])
- **Kept on purpose:** `com.mediatek.tv.agent`, `com.mediatek.network`, `com.mediatek.hotkey.dispatcher`, `com.mediatek.OledFuctionService` (panel).
- **Netflix remote button:** `com.mediatek.partner.netflix` and `com.mstar.netflixobserver`.
- **Bluetooth remote pairing:** `com.smartdevice.duplebluetooth`.
- **Factory services:** `com.smartdevice.factory` and `com.coocaa.factory`.
- **Other:** `com.google.android.tv.remote.service`, TalkBack and TTS. ([CYT-PA-0SU], [CYT-PA-HS550K])
- **MOKA R4_GTV (4KTV-3MUP):** a modified `com.android.tv.settings` re-enables a hard-coded list of 60 packages at every cold boot. Keep `launcherx` and `setupwraith` enabled. ([CYT-ACER-R4G])

### Known problems (Panasonic)

- **Black Home after a power cut** (4KTV-3MUP, MOKA R4_GTV, Google TV 14). setupwraith comes back at cold boot and its `.RecoveryActivity` loops while launcherx is disabled. ([CYT-TROUBLE], [CYT-ACER-R4G])
- **Stock launcher icons.** The Inputs and Wi-Fi icons vanish from the stock launcher after `partnercustomizer` is disabled (HS550K). This is cosmetic once a new launcher is in use. ([CYT-PA-HS550K])

---

## 4. Toshiba (Android TV models only)

**Scope and confidence.** "Toshiba" covers several unrelated platforms:

- **Europe: Vestel-built Android TV.** One list exists: Cosmos170, `yeoksam`, Android TV 11, Spain ([CYT-T-COSMOS]). Vestel ships the same firmware under several badge brands (Toshiba, JVC, Hitachi, Telefunken), so the JVC and Cecotec Vestel lists add some corroboration ([CYT-JVC-MENLO], [CYT-PR-TOSHIBA]). Match on the Vestel fingerprint, not the badge. **Confidence: low to medium.**
- **US: Fire TV Edition** ([ENGADGET]). Different platform, out of scope, and debloat only. ([CYT-TOSHIBA-FIRE])
- **Europe: VIDAA.** Vestel and VIDAA signed a deal for Toshiba-branded TVs ([DISPLAYDAILY]). Not Android, so out of scope.
- **China: Hisense-firmware Toshiba** (55Z500QF). No Google services; the packages were *uninstalled*, not disabled. A separate table below covers it. ([CYT-T-CN])

### Package table (Vestel Android TV)

| Package | What it is | Group | Verdict | Sources |
|---|---|---|---|---|
| `com.vestel.vestelreporter` | Vestel analytics uploader (Internet access, boot receiver, no UI) | telemetry | **bloat** | [CYT-T-COSMOS], [CYT-JVC-MENLO] |
| `com.vestel.smartcenter` | No UI; holds GET_TASKS (sees running apps) and Internet access, about 75 MB | telemetry | **bloat** | [CYT-JVC-MENLO], [CYT-PR-TOSHIBA] (Cecotec Vestel). Not on the Toshiba list |
| `com.vestel.tv.speedup` | "Speed up" cleaner | other | **bloat** | [CYT-JVC-MENLO] (1 source) |
| `android.autoinstalls.config.vestel.cosmos` (`.coma` on the JVC) | Partner auto-preinstall config | ads | **bloat** | [CYT-T-COSMOS], [CYT-JVC-MENLO] |
| `com.google.android.feedback`, `com.google.android.syncadapters.calendar`, `com.google.android.apps.nbu.smartconnect.tv` | Google telemetry and background extras | telemetry | **bloat** | [CYT-T-COSMOS], [CYT-JVC-MENLO] |
| `com.mstar.android.tv.disclaimercustomization` | First-run disclaimer | other | **bloat** | [CYT-JVC-MENLO] (1 source) |
| `com.google.android.tvrecommendations` | Home recommendation rows | ads | **bloat** | [CYT-T-COSMOS], [CYT-JVC-MENLO] |
| `fusion.android.tv.demo` | Retail and shop demo loops | demo | **your call** (test the Input key) | Disabled on the Toshiba Cosmos ([CYT-T-COSMOS]). On JVC `menlo` and Hitachi Vestel builds it is **the only receiver of the remote's Input key** (`com.mstar.android.intent.action.TV_INPUT_BUTTON`), so it must stay there ([CYT-JVC-MENLO], [CYT-PR-JVC752]) |
| `com.google.android.leanbacklauncher.partnercustomizer` | Partner rows on the stock launcher | ads | **your call** (disputed) | Disabled on the Toshiba ([CYT-T-COSMOS]). The JVC list keeps the MediaTek variant ([CYT-JVC-MENLO]). Crash-loop and dead Input key after a reboot on another MediaTek TV ([CYT-CHIQ]) |
| `com.mediatek.tv.freeviewplay` | Freeview Play (UK) integration | streaming | **your call** (keep in the UK) | [CYT-T-COSMOS] (1 source) |
| `com.mediatek.wwtv.mediaplayer` | USB media player | feature | **your call** | [CYT-T-COSMOS] |
| `com.google.android.backdrop` | Ambient screensaver | feature | **your call** | [CYT-T-COSMOS], [CYT-JVC-MENLO] |
| `com.google.android.katniss` | Assistant. The Cosmos has no mic, but "Hey Google" from a phone or Nest needs it; it was re-enabled after a day | voice | **your call** | [CYT-T-COSMOS] |
| `com.google.android.youtube.tv`, `com.amazon.amazonvideo.livingroom`, `com.google.android.youtube.tvmusic`, `com.google.android.videos`, `com.google.android.play.games` | Streaming and preloads. **The remote's YouTube and Prime keys are handled below Android**: with the apps disabled the keys just die, and they cannot be remapped | streaming | **your call** | [CYT-T-COSMOS] |
| `com.android.printspooler`, `com.android.backupconfirm`, `com.android.sharedstoragebackup`, `com.android.wallpaperbackup`, `com.android.dynsystem`, `com.android.cts.ctsshim`, `com.android.cts.priv.ctsshim` | Unused system stubs | other | **bloat** | [CYT-JVC-MENLO] (Vestel sibling, 1 source) |
| `com.google.android.tvlauncher` | Stock home; disable last | other | **keep** (until replaced) | [CYT-T-COSMOS] |

### China Hisense-firmware Toshiba (55Z500QF, Android 11, no GMS). Not a Google Android TV

Evidence is an owner's record of `pm uninstall --user 0` on one unit. Disabling was never tested. ([CYT-T-CN])

| Package | What it is | Group | Verdict | Sources |
|---|---|---|---|---|
| `com.hisense.hitv.das`, `com.hisense.platformreport`, `com.hisense.logupload` | Telemetry | telemetry | **bloat** (uninstall-only evidence) | [CYT-T-CN] (1 source) |
| `com.hisense.service.ad`, `com.hisense.service.message` | Ads and vendor push | ads | **bloat** (uninstall-only evidence) | [CYT-T-CN] (1 source) |
| `com.hisense.demonstrate`, `com.hisense.hotelmenu`, `com.hisense.electronictutorial` | Demo, hotel menu, e-manual | demo | **bloat** (uninstall-only evidence) | [CYT-T-CN] (1 source) |
| `com.vt.toshibaassistant`, `com.aispeech.dui.dds.tvassistant`, `com.hisense.msvoicetome`, `com.hisense.tv.aivirtualassistant`, `com.hispeech.ai.area`, `com.intelligent.speech`, `com.speech.enchatroom`, `com.keylab.speech.core.vidaa`, `com.keylab.speech.view.vidaa`, `com.vt.mic.service` | Non-Google voice assistants and mic | voice | **your call** | [CYT-T-CN] (1 source) |
| `com.jamdeo.updateservice` | OTA | updater | **keep** | [CYT-T-CN] (1 source) |
| `com.meetingroom` | Commercial home screen. Came back after every reboot whether disabled or uninstalled | other | **your call** (does not stick) | [CYT-T-CN] (1 source) |

### Never disable (Toshiba / Vestel)

- **Live TV:** `com.mediatek.wwtv.tvcenter` (`.nav.TurnkeyUiMainActivity`). `com.cltv.fast` is **not** the Live TV app: it is a decoy whose activities ship disabled. ([CYT-T-COSMOS])
- **Hardware and updates:**
  - `com.vestel.tv.service`, `com.vestel.tv.backlight`, `com.vestel.tv.keycontroller`.
  - Firmware and remote updates: `com.vestel.tv.servicepatch`, `com.vestel.tv.rcupdater`.

  ([CYT-T-COSMOS])
- **Tuner and HDMI plumbing:** `com.mediatek.tvinput`, `com.mediatek.tv.service`, `com.mediatek.tvinputservice.arbitratorservice`. ([CYT-T-COSMOS])
- **From the Vestel sibling:** `com.vestel.tv.eib`, `com.vestel.tv.websocketservice`, `com.vestel.overlay.*`, `com.dolby.android.audio.service`, `mediatek.factorymenu.ui`, every `com.mediatek.*`. ([CYT-JVC-MENLO])

### Known problems (Toshiba)

- **Remote YouTube and Prime keys** do nothing once their apps are disabled. The firmware drops the scancodes below Android. ([CYT-T-COSMOS])
- **Voice from a phone.** "Hey Google" from a phone stopped working with katniss disabled; it was re-enabled. ([CYT-T-COSMOS])
- **Input key on Vestel siblings** dies if `fusion.android.tv.demo` is disabled. This is not seen on the Toshiba Cosmos, so check yours. ([CYT-JVC-MENLO])
- **Volume.** Volume keys are applied by the firmware before any accessibility filter, so the volume slider cannot be replaced. ([CYT-T-COSMOS])

---

## 5. Nvidia Shield TV

**Scope and confidence.** The best-covered device. There are several independent write-ups and gists plus two curated tools.

- **Models:** 2015 `foster`/`foster_e`, 2017 `darcy`, 2019 tube `sif` and 2019 Pro `mdarcy`.
- **Software:** they all run the same SHIELD Experience 9.x (Android TV 11). Two older guides ([FLO], [L1T]) target **8.2.3** (Android 9) or 9.2 and *uninstall* packages.
- **Not ad-funded vendor bloat.** NVIDIA's own packages are mostly telemetry, factory and test leftovers, and dead GameStream pieces. The home-screen "ads" come from Google's launcher, not from NVIDIA. Disabling `tvrecommendations` does **not** remove them; only replacing `com.google.android.tvlauncher` does. ([SHS], [BH-GIST])
- **Confidence: high** for the telemetry rows and the keep/never list.
- **Model differences:** the 2019 tube lacks several packages: `nvgamecast`, `osc`, `katniss`, `play.games` and `printspooler`. ([CYT-SH-TUBE])

### Package table

| Package | What it is | Group | Verdict | Sources |
|---|---|---|---|---|
| `com.nvidia.stats` | NVIDIA anonymous usage statistics, about 101 MB on a 2015 box | telemetry | **bloat** | [CYT-SH-PRO], [CYT-SH-TUBE], [SO-SHIELD], [BH-GIST], [SHS], [FLO] |
| `com.nvidia.feedback` | Crash reports and "send feedback" | telemetry | **bloat** | [CYT-SH-PRO], [SO-SHIELD], [BH-GIST], [FLO] |
| `com.nvidia.diagtools` | Log collector. Re-enable it if NVIDIA support asks for logs | telemetry | **bloat** | [CYT-SH-PRO], [SO-SHIELD], [BH-GIST], [FLO] |
| `com.google.android.feedback` | Google feedback | telemetry | **bloat** | [CYT-SH-PRO], [SO-COMMON], [BH-GIST], [FLO] |
| `com.nvidia.shield.registration` | Product registration | telemetry | **bloat** | [CYT-SH-TUBE], [BH-GIST], [FLO] |
| `android.autoinstalls.config.nvidia` | Play auto-installs of partner apps | ads | **bloat** | [CYT-SH-PRO], [CYT-SH-TUBE], [BH-GIST], [FLO] |
| `com.nvidia.factorybundling` | Accessory bundle offers | ads | **bloat** | [CYT-SH-TUBE], [BH-GIST], [FLO] |
| `com.nvidia.app.messaging` | NVIDIA promotions | ads | **bloat** | [BH-GIST] (1 source) |
| `com.nvidia.shield.welcome` | First-run promo and tour | demo | **bloat** | [CYT-SH-TUBE], [BH-GIST] |
| `com.nvidia.shieldbeta`, `com.nvidia.shield.beta` | Beta programme enrolment | updater | **bloat** | [CYT-SH-TUBE], [BH-GIST], [FLO] |
| `com.nvidia.factory`, `com.nvidia.factorysyschecker` | Factory test mode and checks | other | **bloat** | [CYT-SH-TUBE], [BH-GIST] |
| `com.nvidia.developerwidget`, `com.nvidia.tegraprofiler.security` | Developer widget; Tegra profiler | other | **bloat** | [CYT-SH-TUBE], [BH-GIST]; developerwidget also [FLO] |
| `com.nvidia.inputviewer` | Input test viewer. Launching it traps you; leave with KEYCODE_HOME over adb | other | **bloat** | [CYT-SH-TUBE], [BH-GIST] |
| `com.nvidia.benchmarkblocker` | Benchmark blocker; disabled from the factory on the 2019 tube | other | **bloat** | [CYT-SH-TUBE], [FLO], [ROB] |
| `com.nvidia.tegrazone3` | "NVIDIA Games" app and row | store | **bloat** | [CYT-SH-PRO], [SO-SHIELD], [BH-GIST] |
| `com.nvidia.nvgamecast` | GameStream receiver (service shut down in 2023); Moonlight is unaffected | feature | **bloat** | [CYT-SH-PRO], [SO-SHIELD], [BH-GIST], [SHS] |
| `com.google.android.music` | Play Music, a dead service | streaming | **bloat** | [BH-GIST], [SO-COMMON] |
| `com.google.android.videos` | Play Movies; feeds the "top selling" row | streaming | **bloat** | [SO-COMMON], [BH-GIST], [SHS], [FLO] |
| `com.android.gallery3d` | Legacy photo viewer | other | **bloat** | [CYT-SH-PRO], [CYT-SH-TUBE], [SO-COMMON], [BH-GIST], [FLO] |
| `com.google.android.partnersetup`, `com.google.android.onetimeinitializer` | Partner attribution; runs once | other | **bloat** | [CYT-SH-TUBE], [BH-GIST], [FLO] |
| `com.google.android.apps.nbu.smartconnect.tv` | Google data-saver VPN | other | **bloat** | [CYT-SH-TUBE], [ROB] |
| `com.android.cts.ctsshim`, `com.android.cts.priv.ctsshim` | CTS test shims | other | **bloat** | [CYT-SH-TUBE], [BH-GIST], [FLO] |
| `com.android.printspooler` | Print spooler | other | **bloat** | [CYT-SH-PRO], [FLO], [SO-COMMON] |
| `com.android.dynsystem`, `com.android.hotspot2.osulogin`, `com.android.wallpaperbackup` | Idle stubs; nothing broke across a reboot | other | **bloat** | [CYT-SH-TUBE]; hotspot2 also [ROB] |
| `com.nvidia.hotwordsetup` | Hotword setup | voice | **your call** | [CYT-SH-PRO] (advanced), [FLO], [ROB] |
| `com.nvidia.shield.ask` | Alexa / Google Home control of the Shield | voice | **your call** | Kept in [CYT-SH-TUBE]; removed in [FLO]; disabled in [ROB] |
| `com.google.android.katniss` | Assistant and search. The remote's mic button dies, as does in-app voice search (SmartTube) | voice | **your call** | [SO-SAFETY], [CYT-SH-PRO], [BH-GIST], [SHS] |
| `com.nvidia.osc` | In-game overlay for NVIDIA Games and GameStream | feature | **your call** | [SO-SHIELD], [CYT-SH-PRO] |
| `com.nvidia.shieldtech.hooks` | Maps the Xbox controller Guide button to Home. Disabling it fixes Guide conflicts in Steam Link and Moonlight | feature | **your call** | [SO-SHIELD] (medium), [CYT-SH-PRO] (advanced; removed, nothing broke), [FLO]. **[BH-GIST] puts it on its keep list** |
| `com.nvidia.shieldtech.proxy`, `com.nvidia.shield.nvcustomize` | Not described by the sources | other | **your call** (disputed) | Removed with "nothing broke" in [CYT-SH-PRO] (advanced) and [FLO]. [BH-GIST] keeps `shieldtech.proxy` with the remote packages |
| `com.nvidia.shield.smbserver`, `com.nvidia.shield.smbauth`, `com.nvidia.shield.nas` | "Transfer files over local network" SMB share and NAS | feature | **your call** | [CYT-SH-TUBE], [CYT-SH-PRO], [ROB] |
| `com.plexapp.mediaserver.smb` | Built-in Plex Media **Server**, not the client | feature | **your call** (keep if the Shield is your Plex server) | [SO-SHIELD], [BH-GIST], [SHS], [FLO] |
| `com.google.android.backdrop` | Ambient Mode screensaver, the **default** screensaver on the Pro. Switch screensavers first | feature | **your call** | [CYT-SH-PRO], [CYT-SH-TUBE], [SO-COMMON], [BH-GIST] |
| `com.google.android.tv` | Live Channels; its TunerTvInputService is needed for HDHomeRun network tuners | feature | **your call** | [CYT-SH-PRO], [CYT-SH-TUBE], [BH-GIST], [SHS] (disabled, then restored) |
| `com.google.android.apps.mediashell` | Chromecast built-in | feature | **your call** (most keep it) | [SO-SAFETY], [CYT-SH-TUBE], [HN] ("leave alone"), [BH-GIST] |
| `com.google.android.play.games` | Play Games: sign-in and cloud saves | other | **your call** | [SO-COMMON], [CYT-SH-PRO], [FLO] |
| `com.netflix.ninja`, `com.amazon.amazonvideo.livingroom.nvidia` (system copy, can only be disabled), `com.amazon.amazonvideo.livingroom`, `com.google.android.youtube.tv`, `com.google.android.youtube.tvmusic` | Preinstalled streaming. The remote's Netflix button is handled in firmware, so disabling Netflix does not free it | streaming | **your call** | [CYT-SH-PRO], [CYT-SH-TUBE], [SO-COMMON], [BH-GIST] |
| `com.google.android.tvlauncher` | Stock launcher and the real source of home-screen ads. The Shield falls back to `com.android.tv.settings/.system.FallbackHome` | other | **your call** (only after a replacement is Home) | [CYT-SH-PRO], [SO-SHIELD], [BH-GIST], [SHS], [FLAUNCHER-42] |
| `com.nvidia.ota` | System updater | updater | **keep** (your call only to freeze firmware deliberately) | High risk and default-off in [SO-SHIELD]; [HN] says "leave alone, always"; [BH-GIST] keeps it; optional in [CYT-SH-PRO]; off by choice in [CYT-SH-TUBE]; removed in [FLO] |
| `com.nvidia.NvCPLUpdater`, `com.nvidia.KeyComboOta` | Update path | updater | **keep** | [BH-GIST], [CYT-SH-PRO] (keeps KeyComboOta); off with OTA in [CYT-SH-TUBE] |
| `com.google.android.tvrecommendations` | Recommendation engine. **Disabled, it stops the SHIELD TV phone app's keys working after every reboot.** The rows stay, just emptier | ads | **keep** | [CYT-TROUBLE] (bisected on darcy and foster_e), [CYT-SH-PRO], [SO-SHIELD] (high risk), [SO-TVREC]. Disabled in [BH-GIST] and [SHS] with no phone-remote test reported |
| `com.nvidia.shield.remote.server` | Backend for the SHIELD TV phone remote app | feature | **keep** | [CYT-SH-TUBE], [BH-GIST]; removed in [FLO] |
| `com.nvidia.remotelocator` | Remote locator ("find my remote") | feature | **keep** (disputed) | Leave alone in [CYT-SH-PRO]; disabled in [BH-GIST] |
| `com.google.android.speech.pumpkin` | On-device speech recognition. Disabling it breaks dictation and in-app mic buttons | voice | **keep** | [SO-SHIELD] (high), [SO-SAFETY], [CYT-SH-TUBE]; removed in [FLO] |
| `com.google.android.tungsten.setupwraith` | Setup wizard. On the Shield it is not a Home candidate after setup, so disabling it gains nothing | other | **keep** | [CYT-SH-PRO], [CYT-SH-TUBE]; disabled with no problem in [BH-GIST] |
| `com.android.bluetoothmidiservice` | Bluetooth MIDI | other | **keep** (disputed) | Disabled in [CYT-SH-TUBE] with "nothing broke"; [SO-SAFETY] says "Bluetooth helper required by remotes on some builds" |
| `com.google.android.tts` | Text-to-speech for TalkBack and read-aloud | voice | **keep** | [SO-SAFETY], [SO-COMMON]; removed in [FLO] |

### Never disable (Shield)

- **Remote, controllers and Bluetooth:** `com.nvidia.blakepairing`, `com.nvidia.bluetooth.*` (for example `com.nvidia.bluetooth.ShieldBluetoothManager`), `com.nvidia.shieldtech.accessoryui`, `com.nvidia.ControllerMapper`, `com.nvidia.irtuner`, `com.android.bluetooth`, `com.google.android.tv.remote.service`. The stated reason is that you can end up with no way to control the device. ([CYT-SH-PRO], [BH-GIST], [SO-SAFETY])
- **AI upscaling, display and audio:** `com.nvidia.NvCPLSvc`, `com.nvidia.nvaudiosvc`, `com.nvidia.avsync`, `com.dolby.android.audio.service`, `com.nvidia.overscancomp`. ([CYT-SH-PRO], [BH-GIST])
- **System services:**
  - `com.nvidia.shieldservice`: the LED controller. One guide accidentally broke the sleep LED and tells readers to restore it.
  - `com.nvidia.packagemanagerservice`.

  ([CYT-SH-PRO], [FLO])
- **Android and Google core:**
  - `com.android.tv.settings`, the Home fallback. ([SHS], [SO-SAFETY])
  - `com.android.providers.tv`: the EPG and Watch Next database. ([BH-GIST], [SO-SAFETY])
  - `com.android.systemui`, `com.android.shell`. ([SO-SAFETY], [BH-GIST])
  - `com.android.location.fused`: boot loop on some devices. ([BH-GIST])
  - The active IME: `com.google.android.leanback.ime` or `com.google.android.inputmethod.latin`. Check `settings get secure default_input_method`. ([BH-GIST], [SO-SAFETY])
- **Play Store and Services, keychain and secure element:** `com.google.android.gms`, `com.google.android.gsf`, `com.android.vending`, `com.android.keychain`, `com.android.se`, `com.android.providers.contacts`. Two guides remove these ([FLO], [L1T]), and readers reported **soft-bricked Shields** and **bricked boxes on restart** that a factory reset and the recovery image did not fix. ([L1T], [CYT-SH-PRO], [SO-SAFETY])

### Known problems (Shield)

- **Soft-bricks.** After the uninstall list in [L1T] (identical to [FLO]), one reader reported a Shield, a Google TV Streamer, an onn box and a TV bricked on restart. Another reported a soft-bricked new Shield: hard freezes of about 5 minutes and crashes in the Play Store. A factory reset, the NVIDIA recovery image and a downgrade did not fix it. The author replied that removing those services breaks Play Store-dependent apps. ([L1T])
- **Phone remote.** The SHIELD TV phone app connects, but every key fails after a reboot if `com.google.android.tvrecommendations` is disabled. The fix is `pm enable com.google.android.tvrecommendations`, then wait about 20 s before rebooting. ([CYT-TROUBLE])
- **Updates re-enable packages.** A SHIELD Experience update can re-enable disabled packages, so re-run the list afterwards. ([CYT-SH-PRO])
- **Live Channels.** Disabling `com.google.android.tv` broke HDHomeRun network-tuner support. ([SHS])
- **Launcher.** `cmd package set-home-activity` prints Success and does nothing while the stock launcher is enabled. Disabling the stock launcher is what hands over Home. ([CYT-SH-TUBE], [HN])

---

## Every URL used

Labels are as used above.

**CleanYourTV (Gathin23/cleanyourtv)**

- [CYT-TROUBLE]: https://github.com/Gathin23/cleanyourtv/blob/main/docs/TROUBLESHOOTING.md
- [CYT-ACER-R4G]: https://github.com/Gathin23/cleanyourtv/blob/main/docs/devices/acer-r4g.md (covers the Panasonic 4KTV-3MUP)
- [CYT-CHIQ]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/chiq-ai-pont/debloat.txt
- [CYT-JVC-MENLO]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/jvc-android-tv-menlo/debloat.txt
- [CYT-PR-TOSHIBA]: https://github.com/Gathin23/cleanyourtv/pull/460 (search-result summary only, plus the Cecotec list https://github.com/Gathin23/cleanyourtv/pull/418)
- [CYT-PR-JVC752]: https://github.com/Gathin23/cleanyourtv/pull/752
- [CYT-PR-SHARP465]: https://github.com/Gathin23/cleanyourtv/pull/465 (search-result summary only; same list as CYT-S-TVE21F)

Philips:

- [CYT-P-8517]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-50pus8517/debloat.txt
- [CYT-P-707]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-55oled707/debloat.txt
- [CYT-P-706]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-65oled706/debloat.txt
- [CYT-P-907]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-65oled907/debloat.txt
- [CYT-P-9506]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-65pml9506/debloat.txt
- [CYT-P-8505]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-75pus8505/debloat.txt
- [CYT-P-TPM191E]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-tpm191e/debloat.txt (and its README.md)
- [CYT-P-9435]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-65pus9435/debloat.txt
- [CYT-P-7503]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-55pus7503/debloat.txt
- [CYT-P-8102]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-65pus8102/debloat.txt
- [CYT-P-708]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-55oled708/debloat.txt
- [CYT-P-7406]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-50pud7406/debloat.txt
- [CYT-P-PUG7406]: https://github.com/Gathin23/cleanyourtv/blob/main/docs/devices/philips-65pug7406-78.md
- [CYT-P-50PUH8215]: https://github.com/Gathin23/cleanyourtv/blob/main/docs/devices/philips-50puh8215-96.md
- [CYT-P-TA7]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-google-tv-ta7/debloat.txt (and its README.md)
- [CYT-P-R8G]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-r8g-google-tv/debloat.txt (and https://github.com/Gathin23/cleanyourtv/blob/main/docs/devices/philips-r8g.md)
- [CYT-P-SKY]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-smart-4k-google-tv/debloat.txt

Sharp:

- [CYT-S-TVE21F]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/sharp-aquos-tve21f/debloat.txt
- [CYT-S-TVE23A]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/sharp-aquos-tve23a/debloat.txt
- [CYT-S-GH3000I]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/sharp-2t-c32gh3000i/debloat.txt
- [CYT-S-32FI4EA]: https://github.com/Gathin23/cleanyourtv/blob/main/docs/devices/sharp-32fi4ea.md

Panasonic:

- [CYT-PA-0SU]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/panasonic-4ktv-0su/debloat.txt
- [CYT-PA-JUP]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/panasonic-4ktv-jup/debloat.txt
- [CYT-PA-KOWLOON]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/panasonic-kowloon/debloat.txt
- [CYT-PA-HS550K]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/panasonic-th-40hs550k/debloat.txt

Toshiba:

- [CYT-T-COSMOS]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/toshiba-cosmos-android-tv/debloat.txt
- [CYT-TOSHIBA-FIRE]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/toshiba-fire-tv-aftha004/debloat.txt
- [CYT-T-CN]: https://github.com/Gathin23/cleanyourtv/blob/main/docs/devices/toshiba-55z500qf-cn.md

Nvidia Shield:

- [CYT-SH-PRO]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/nvidia-shield-tv-pro-2019/debloat.txt
- [CYT-SH-TUBE]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/nvidia-shield-tv-2019/debloat.txt (and its README.md)

**Shield Optimizer (bryanroscoe/shield_optimizer)**

- Repo: https://github.com/bryanroscoe/shield_optimizer
- [SO-SHIELD]: https://github.com/bryanroscoe/shield_optimizer/blob/main/v2/crates/core/data/app-lists/shield.json
- [SO-COMMON]: https://github.com/bryanroscoe/shield_optimizer/blob/main/v2/crates/core/data/app-lists/common.json
- Google TV list: https://github.com/bryanroscoe/shield_optimizer/blob/main/v2/crates/core/data/app-lists/googletv.json
- [SO-SAFETY]: https://github.com/bryanroscoe/shield_optimizer/blob/main/v2/crates/core/src/engine/safety.rs
- [SO-TVREC]: https://github.com/bryanroscoe/shield_optimizer/blob/main/docs/evidence/v1-tvrecommendations-safety/README.md

**dumbtv (humblemuzzu/dumbtv)**

- Wiki: https://github.com/humblemuzzu/dumbtv/wiki
- [DTV-P-TPM191E]: https://github.com/humblemuzzu/dumbtv/blob/main/catalog/devices/androidtv-philips-tpm191e.yaml
- [DTV-P-24NA]: https://github.com/humblemuzzu/dumbtv/blob/main/catalog/devices/androidtv-philips-24na-4k.yaml
- Philips TA6 LT: https://github.com/humblemuzzu/dumbtv/blob/main/catalog/devices/androidtv-philips-ta6-lt.yaml
- [DTV-NEVER]: https://github.com/humblemuzzu/dumbtv/blob/main/data/androidtv/never-disable.txt
- Protected list: https://github.com/humblemuzzu/dumbtv/blob/main/data/androidtv/protected.txt
- Package list: https://github.com/humblemuzzu/dumbtv/blob/main/data/androidtv/packages.txt

**Nvidia Shield guides and threads**

- [BH-GIST]: https://gist.github.com/bharvey88/c211c6ca1d9e5f1379b204bf75067275
- [SHS]: https://smarthomesellout.com/blog/2026-09-08-debloating-four-nvidia-shields/ (same author as BH-GIST)
- [ROB]: https://gist.github.com/roblav96/37db14116afde0a734146b2c058b2673 (one owner's enabled/disabled dump, no per-package reasoning; he also disabled the Play Store and gsf, which I do not treat as evidence of safety)
- [FLO]: https://florisse.nl/shield-debloat/ (also https://florisse.nl/shield/)
- [L1T]: https://forum.level1techs.com/t/tutorial-de-bloat-and-de-google-nvidia-shield-pro/247451
- [HN]: https://hackernoon.com/how-to-fix-nvidia-shield-problems-without-factory-resetting
- [FLAUNCHER-42]: https://gitlab.com/etienn01/flauncher/-/issues/42

**Sharp, Philips and platform context**

- [MINHAZ]: https://blog.mdminhazulhaque.io/optimize-your-sharp-smart-tv-disable-built-in-apps-for-faster-performance
- [ANDROIDPLANET]: https://www.androidplanet.nl/tips/google-tv-apps-verwijderen/
- [HIFI-DE]: https://hifi.de/news/android-tv-panasonic-126177
- [WHATHIFI]: https://www.whathifi.com/news/panasonics-flagship-2024-tv-is-the-z95a-oled-with-brighter-mla-panel-and-fire-os
- [ENGADGET]: https://www.engadget.com/toshiba-new-fire-tv-lineup-053842934.html
- [DISPLAYDAILY]: https://displaydaily.com/tag/vidaa/

**Read but contributed no package data**

- https://github.com/seun-novodev/android-tv-debloat-toolkit
- https://tv.cobanov.dev/en/prompt.txt
- https://github.com/unfoldedcircle/integration-androidtv/issues/49
- https://github.com/tutyamxx/androidtv-debloat-script

**Tried but blocked (HTTP 403), not used**

- https://xdaforums.com/t/philips-55pus7956-12-how-to-root-remove-system-apps.4645945/
- https://xdaforums.com/t/philips-android-tv.2935545/page-57
- https://www.avforums.com/threads/useful-info-debloat-android-tv-with-a-matter-of-few-clicks.2482865/

[CYT-TROUBLE]: https://github.com/Gathin23/cleanyourtv/blob/main/docs/TROUBLESHOOTING.md
[CYT-ACER-R4G]: https://github.com/Gathin23/cleanyourtv/blob/main/docs/devices/acer-r4g.md
[CYT-CHIQ]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/chiq-ai-pont/debloat.txt
[CYT-JVC-MENLO]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/jvc-android-tv-menlo/debloat.txt
[CYT-PR-TOSHIBA]: https://github.com/Gathin23/cleanyourtv/pull/460
[CYT-PR-JVC752]: https://github.com/Gathin23/cleanyourtv/pull/752
[CYT-P-8517]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-50pus8517/debloat.txt
[CYT-P-707]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-55oled707/debloat.txt
[CYT-P-706]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-65oled706/debloat.txt
[CYT-P-907]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-65oled907/debloat.txt
[CYT-P-9506]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-65pml9506/debloat.txt
[CYT-P-8505]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-75pus8505/debloat.txt
[CYT-P-TPM191E]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-tpm191e/debloat.txt
[CYT-P-9435]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-65pus9435/debloat.txt
[CYT-P-7503]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-55pus7503/debloat.txt
[CYT-P-8102]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-65pus8102/debloat.txt
[CYT-P-708]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-55oled708/debloat.txt
[CYT-P-7406]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-50pud7406/debloat.txt
[CYT-P-PUG7406]: https://github.com/Gathin23/cleanyourtv/blob/main/docs/devices/philips-65pug7406-78.md
[CYT-P-50PUH8215]: https://github.com/Gathin23/cleanyourtv/blob/main/docs/devices/philips-50puh8215-96.md
[CYT-P-TA7]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-google-tv-ta7/debloat.txt
[CYT-P-R8G]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-r8g-google-tv/debloat.txt
[CYT-P-SKY]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/philips-smart-4k-google-tv/debloat.txt
[CYT-S-TVE21F]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/sharp-aquos-tve21f/debloat.txt
[CYT-S-TVE23A]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/sharp-aquos-tve23a/debloat.txt
[CYT-S-GH3000I]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/sharp-2t-c32gh3000i/debloat.txt
[CYT-S-32FI4EA]: https://github.com/Gathin23/cleanyourtv/blob/main/docs/devices/sharp-32fi4ea.md
[CYT-PA-0SU]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/panasonic-4ktv-0su/debloat.txt
[CYT-PA-JUP]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/panasonic-4ktv-jup/debloat.txt
[CYT-PA-KOWLOON]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/panasonic-kowloon/debloat.txt
[CYT-PA-HS550K]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/panasonic-th-40hs550k/debloat.txt
[CYT-T-COSMOS]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/toshiba-cosmos-android-tv/debloat.txt
[CYT-TOSHIBA-FIRE]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/toshiba-fire-tv-aftha004/debloat.txt
[CYT-T-CN]: https://github.com/Gathin23/cleanyourtv/blob/main/docs/devices/toshiba-55z500qf-cn.md
[CYT-SH-PRO]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/nvidia-shield-tv-pro-2019/debloat.txt
[CYT-SH-TUBE]: https://github.com/Gathin23/cleanyourtv/blob/main/examples/nvidia-shield-tv-2019/debloat.txt
[SO-SHIELD]: https://github.com/bryanroscoe/shield_optimizer/blob/main/v2/crates/core/data/app-lists/shield.json
[SO-COMMON]: https://github.com/bryanroscoe/shield_optimizer/blob/main/v2/crates/core/data/app-lists/common.json
[SO-SAFETY]: https://github.com/bryanroscoe/shield_optimizer/blob/main/v2/crates/core/src/engine/safety.rs
[SO-TVREC]: https://github.com/bryanroscoe/shield_optimizer/blob/main/docs/evidence/v1-tvrecommendations-safety/README.md
[DTV-P-TPM191E]: https://github.com/humblemuzzu/dumbtv/blob/main/catalog/devices/androidtv-philips-tpm191e.yaml
[DTV-P-24NA]: https://github.com/humblemuzzu/dumbtv/blob/main/catalog/devices/androidtv-philips-24na-4k.yaml
[DTV-NEVER]: https://github.com/humblemuzzu/dumbtv/blob/main/data/androidtv/never-disable.txt
[BH-GIST]: https://gist.github.com/bharvey88/c211c6ca1d9e5f1379b204bf75067275
[SHS]: https://smarthomesellout.com/blog/2026-09-08-debloating-four-nvidia-shields/
[ROB]: https://gist.github.com/roblav96/37db14116afde0a734146b2c058b2673
[FLO]: https://florisse.nl/shield-debloat/
[L1T]: https://forum.level1techs.com/t/tutorial-de-bloat-and-de-google-nvidia-shield-pro/247451
[HN]: https://hackernoon.com/how-to-fix-nvidia-shield-problems-without-factory-resetting
[FLAUNCHER-42]: https://gitlab.com/etienn01/flauncher/-/issues/42
[MINHAZ]: https://blog.mdminhazulhaque.io/optimize-your-sharp-smart-tv-disable-built-in-apps-for-faster-performance
[ANDROIDPLANET]: https://www.androidplanet.nl/tips/google-tv-apps-verwijderen/
[HIFI-DE]: https://hifi.de/news/android-tv-panasonic-126177
[WHATHIFI]: https://www.whathifi.com/news/panasonics-flagship-2024-tv-is-the-z95a-oled-with-brighter-mla-panel-and-fire-os
[ENGADGET]: https://www.engadget.com/toshiba-new-fire-tv-lineup-053842934.html
[DISPLAYDAILY]: https://displaydaily.com/tag/vidaa/
