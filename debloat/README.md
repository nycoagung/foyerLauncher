# Debloat

Hides preinstalled bloat on Android TV and Google TV sets over ADB: ads and recommendation services, viewing trackers, store demos, partner auto-installs and apps the owner doesn't use. Nothing is uninstalled; every hidden app keeps its data and comes back with one command. An AI agent normally runs this as part of the setup in [docs/agent-android-setup-guide.md](../docs/agent-android-setup-guide.md).

There are lists for **Sony, TCL, Hisense, Xiaomi, Philips, Sharp, Panasonic, Toshiba, Nvidia Shield, Chromecast with Google TV / Google TV Streamer, Walmart onn. and Amazon Fire TV**, plus a common list of Google's own packages for every Android TV. A TV of another brand gets the common list only. Samsung (Tizen), LG (webOS), Roku and VIDAA TVs can't be debloated this way.

```bash
TV_IP=<TV_IP> debloat/debloat.sh --list              # the TV's brand, and the apps that can be hidden, grouped
TV_IP=<TV_IP> debloat/debloat.sh --dry-run           # what a run would hide
TV_IP=<TV_IP> debloat/debloat.sh                     # hide the recommended apps
TV_IP=<TV_IP> debloat/debloat.sh --include camera --except com.a.b   # plus a group, minus one app
TV_IP=<TV_IP> debloat/debloat.sh --again             # hide again everything hidden before, after a firmware update
my-tvs/<model>-<serial>/restore-my-tv.sh             # undo everything on that TV
```

| Path | What it is |
|---|---|
| `debloat.sh` | Detects the TV's brand and hides the chosen apps. Refuses anything a list marks keep or never |
| `restore.sh` | Brings back apps `debloat.sh` hid, or a group, or one app, to their recorded state; apps that were already disabled before stay as they were |
| `write-restore.sh` | Writes each TV's own `restore-my-tv.sh`; `debloat.sh` and `android/install.sh` run it after every change |
| `brands/` | One list per brand and `common.txt`. Each line is `verdict group package description`: **bloat** is recommended and hidden by default, **optional** is hidden only when chosen, **keep** and **never** are refused. `brands.txt` says how each brand is recognised |
| `research/` | Where the lists come from, with a source for every package; `build-lists.py` (`npm run build:lists`) regenerates `brands/` |
| `tests/run.sh` | `npm run check:debloat`: the whole flow against fake TVs of several brands; no TV needed |

When two lists name a package, the more cautious verdict wins. A never-pattern such as `com.mediatek.*` covers every package starting with it: a package's own entry in the same brand list beats it, but a brand's pattern beats `common.txt`. A "bloat" verdict resting on a single source is only optional. Read [research/README.md](research/README.md) before using a brand's list for the first time: coverage is good for Sony, TCL, Xiaomi, Philips, Shield, Chromecast and Fire TV, and thin for Hisense, Sharp, Panasonic, Toshiba and onn.

## my-tvs/

Each TV gets a folder, `my-tvs/<model>-<serial>/`, on the computer that set it up. Git ignores it and `npm run check:public` refuses it, because it identifies one person's TV:

| File | What it holds |
|---|---|
| `restore-my-tv.sh` | Puts the TV back: every hidden app to its earlier state, the Home button back to the TV's own home screen, and with `--uninstall`, FoyerLauncher removed. It needs only adb, checks it is talking to the same TV, and has `--dry-run` |
| `tv.txt` | The TV's name, brand, Android version, serial number (or Android ID when it has none) and the address last used |
| `enabled-before.txt` | Each hidden app's state before it was first hidden (also what `--again` hides again) |
| `accessibility-before.txt`, `launcher.txt` | The TV's accessibility settings before FoyerLauncher's Home button, and FoyerLauncher's package |
| `disabled-before-*.txt` | What was already hidden before each run |

Keep the folder (copy it somewhere safe if you like): it's what makes the restore exact.
