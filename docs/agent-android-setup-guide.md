# TV Setup Guide for AI Agents

This guide is for an AI coding agent (for example Claude Code) setting up someone's TV with FoyerLauncher, working with the TV's owner. Installation is done this way: the agent reads this repository, asks the owner for their TV's details, offers them a list of preinstalled apps to hide, installs FoyerLauncher, and leaves them a restore script made for their TV.

It covers **Android TV and Google TV sets and boxes of any brand**. The debloat step has lists for Sony, TCL, Hisense, Xiaomi, Philips, Sharp, Panasonic, Toshiba, Nvidia Shield, Chromecast with Google TV / Google TV Streamer, Walmart onn. and Amazon Fire TV, and a common list for every other Android TV. FoyerLauncher itself needs Android TV OS 8.0 or later; Amazon Fire TV doesn't let another app take the Home button, so there only the debloat step applies. For a **Samsung** TV (Tizen), use the [Samsung guide](agent-tv-setup-guide.md) instead; it has no debloat step. **LG** (webOS), **Roku**, **Hisense VIDAA** and **Fire TV Vega OS** sticks can't be set up with this repository: tell the owner and stop.

Nothing is uninstalled from the TV. Hidden apps keep their data, the TV's own home screen keeps its role, and an accessibility service sends the remote's Home button to FoyerLauncher. Every change is recorded so the TV can be put back exactly.

## Rules for the agent

- **Ask; don't assume.** Nothing in this repository names a TV or an address. Get every device detail from the owner, or read it from the TV once connected.
- **Keep the owner's details out of the repository.** Pass the TV's IP address only on the command line, as `TV_IP=<TV_IP>`. Never write it, the serial number or anything else about the TV into a tracked file, a commit, an issue or a pull request. The scripts keep each TV's records in `my-tvs/`, which Git ignores.
- **The owner chooses what is hidden.** Show them the list (stage 5) and hide only what they agree to. Never hide anything a list marks keep or never, and never add packages to the lists to get around that.
- **One stage at a time.** Say what the next command does on the TV before running it, and get the owner's go-ahead for every stage that changes the TV.
- **Confirm what the owner sees.** A successful command is not proof. Ask them to look at the screen and press buttons on the remote.

### Values to collect

| Placeholder | What it is | Where the owner finds it |
|---|---|---|
| `<TV_BRAND>` and `<TV_MODEL>` | The TV's maker and model (or the streaming box's, for a Chromecast, Shield or onn.) | A label on the back or underneath, or Settings → System → About (wording varies) |
| `<PLATFORM>` | Google TV, Android TV, or something else | Google TV shows "For you" tabs on its home screen; Android TV shows rows of apps. Settings → System → About names the OS |
| `<OS_VERSION>` | Android TV OS version (8.0 or later is needed) | Settings → System → About → Version or Android TV OS version |
| `<TV_IP>` | The TV's IP address on the home network | Settings → Network & Internet → the connected network → IP address; or the router's list of devices |
| `<ADB_PORT>` | Only with Wireless debugging: the port it shows | Settings → System → Developer options → Wireless debugging |

The owner can type each value or send a photo of the settings screen. Repeat the values back for checking. Ask again if a character is unclear, for example 1 and 7 in an address.

## Stage 1 Collect the TV's details

**Agent prompt**

> Ask me for my TV's brand and model, whether it's Google TV or Android TV, its Android TV OS version and its IP address. Tell me where to find each one, and let me type it or send a photo. Read the values back to me. Check that this computer is on the same network as the TV. Don't save my TV's details in the project's tracked files.

Check the brand against the platforms above, the address is a private one (usually starting 192.168., 10. or 172.16–31.), and the computer can reach it (`ping <TV_IP>`). A VPN on the computer can block local devices.

**Done when:** the owner has confirmed the brand, model, platform, OS version and IP address, the platform is one this guide covers, and the TV answers from this computer.

## Stage 2 Prepare the computer

Check for, and with the owner's agreement install:

- **adb** (Android platform-tools). On macOS: `brew install --cask android-platform-tools`.
- **Node.js 22+ and Python 3.10+**, then `npm ci` in the repository.
- **To build FoyerLauncher:** Android SDK platform 34 and build-tools 35.0.0, and a JDK 17+. Android Studio's bundled SDK and JDK are found automatically on macOS; elsewhere set `ANDROID_HOME` and `JAVA_HOME`.

Build with `npm run build:android`. The first build makes a signing key in ignored `android/.local/`. Tell the owner to keep that folder: updates must be signed with the same key.

**Done when:** `android/out/foyerlauncher.apk` exists and `adb version` works. (Skip the build on Fire TV.)

## Stage 3 Turn on debugging on the TV

Guide the owner through these steps. Menu names vary by brand, so ask for a photo when the screen doesn't match.

1. Open **Settings → System → About** and select **Android TV OS build** seven times, until the TV says "You are now a developer". (Fire TV: Settings → My Fire TV → About, select the device name seven times.)
2. Go back to **Settings → System → Developer options**.
3. Then either:
   - **USB debugging** (some TVs call it Network debugging, or show both; Fire TV calls it ADB debugging): turn it on. The TV then accepts connections on port 5555, and `<TV_IP>` alone is enough.
   - **Wireless debugging** (common on Android TV OS 11 and later): turn it on. Choose **Pair device with pairing code** and run `adb pair <TV_IP>:<PAIRING_PORT>` with the code shown. The connection port is shown on the Wireless debugging screen; use `TV_IP=<TV_IP>:<ADB_PORT>` from then on.

**Agent prompt**

> Walk me through unlocking Developer options and turning on debugging on my TV. If my menus look different, work from a photo. Tell me which kind of debugging my TV has and what to do next.

**Done when:** debugging is visibly on.

## Stage 4 Connect and check it's the right TV

Run `adb connect <TV_IP>` (or `<TV_IP>:<ADB_PORT>`). The TV shows **Allow USB debugging?**: the owner selects **Always allow from this computer** and OK. `adb devices` should list the TV as `device`.

Then run `TV_IP=<TV_IP> debloat/debloat.sh --list`. Its first line names the TV's maker, model and Android version, and which brand list it will use. Check these against what the owner said. If the scripts picked no list or the wrong one but the owner's brand has one in `debloat/brands/`, add `--brand <id>` to every debloat command from here on.

If the connection is refused: check the address and the debugging setting, check the computer and TV are on the same network (not a guest network), then restart debugging on the TV. Don't use port forwarding on the router.

**Done when:** the TV is connected, its model matches what the owner said, and the brand list is right.

## Stage 5 Choose what to hide

Show the owner what `debloat/debloat.sh --list` printed, in plain language rather than package names: one line per app saying what it is. It has two parts:

- **Recommended to hide:** ads and recommendation services, viewing trackers, store demos, partner auto-installs and the like, which the research found are safe to hide. Hidden by default.
- **Optional groups:** features some people use (a camera, AirPlay, smart speakers, media players, voice assistants, preinstalled streaming apps). Hidden only if the owner picks them.

Apps the lists mark keep or never (the tuner and inputs, the remote, picture and sound, the TV's own home and setup, Google Play and system services) are not shown and can't be hidden.

Explain that nothing is deleted and everything can be brought back, then ask:

1. Hide all the recommended apps? If they want to keep any, note them for `--except`.
2. Which optional groups, or single apps, should go too? Point out anything they might rely on, such as YouTube, a streaming app they pay for, voice search or casting.

Build one command from the answers, for example `TV_IP=<TV_IP> debloat/debloat.sh --include media,camera --except com.example.app`, and run it with `--dry-run` first. Show the owner the resulting list and get their go-ahead.

**Agent prompt**

> Show me the apps on my TV that can be hidden, grouped, with a one-line explanation of each. Recommend which to hide and tell me what I'd lose with each optional group. Let me pick, then show me exactly what will be hidden before you do it.

**Done when:** the owner has approved the dry run's list.

## Stage 6 Hide them

Run the approved command without `--dry-run`. It hides each app, records its earlier state in `my-tvs/<model>-<serial>/`, and writes the TV's restore script there.

Then ask the owner to check, with the remote: the remote's buttons and voice search if they use it, switching inputs, picture and sound, and that Wi-Fi is still connected. If something stopped working, bring back the app or group responsible with `TV_IP=<TV_IP> debloat/restore.sh <group or app>`, or everything with the restore script. Wait about 15 seconds before restarting the TV.

**Done when:** the owner has confirmed the TV works as before, without the hidden apps.

## Stage 7 Install FoyerLauncher

Skip this on Fire TV. Ask the owner which they want:

- **Home button** (recommended): `TV_IP=<TV_IP> android/install.sh`. Installs FoyerLauncher, records the TV's accessibility settings in `my-tvs/`, and turns on the FoyerLauncher Home button service.
- **App only**: `TV_IP=<TV_IP> android/install.sh --app-only`. FoyerLauncher appears in the TV's apps; Home is unchanged.

Then ask the owner to check, with the real remote:

1. Press **Home**: FoyerLauncher opens.
2. Hold **Home** for about a second: the TV's own home screen opens.
3. Open an app from FoyerLauncher, then press Home: FoyerLauncher comes back.
4. Turn the TV off and on: FoyerLauncher appears shortly after the TV's home screen.
5. In FoyerLauncher, open Settings → Weather and choose On or Off. Weather is on by default and uses the TV's internet address to find the town; see [PRIVACY.md](../PRIVACY.md).

If Home still opens the TV's own home screen, check `adb shell dumpsys accessibility` for the FoyerLauncher Home button service. Some TVs ask the owner to confirm accessibility services in Settings → Accessibility.

**Done when:** the owner has seen each check work, or knows which one didn't.

## Stage 8 Hand over the restore script

The scripts have written `my-tvs/<model>-<serial>/restore-my-tv.sh`, made for this TV. It brings back every hidden app to its earlier state, gives the Home button back to the TV's own home screen, and with `--uninstall` removes FoyerLauncher. It needs only adb, and refuses to run against a different TV.

Run it once with `--dry-run` so the owner sees what it would do, then tell them:

- where it is, and to keep the `my-tvs/` folder (or a copy of it): it's what makes the restore exact;
- how to run it: `my-tvs/<model>-<serial>/restore-my-tv.sh`, adding `TV_IP=<new address>` in front if the TV's address has changed, with debugging turned on;
- that after a firmware update re-shows hidden apps, `TV_IP=<TV_IP> debloat/debloat.sh --again` repeats their choices;
- that debugging lets approved computers control the TV over the network, so they may turn it off in Developer options now, and must turn it back on (and accept the prompt again) before running the restore script, `--again` or an update.

**Agent prompt**

> Show me my TV's restore script, run it as a dry run so I can see what it would undo, and tell me how to use it later.

**Done when:** the owner knows where their restore script is and how to run it.

## Updating

Pull the latest source, then `npm run build:android` and `TV_IP=<TV_IP> android/install.sh` with the same `android/.local/` signing key. If the address has changed, ask the owner for the new one. The restore script is rewritten after each install or debloat run.
