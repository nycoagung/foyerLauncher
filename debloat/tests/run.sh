#!/usr/bin/env bash
# Checks debloat.sh, restore.sh, android/install.sh and the generated restore-my-tv.sh against fake TVs of
# several brands. No real TV is contacted.   npm run check:debloat   (or debloat/tests/run.sh)
set -u
cd "$(dirname "$0")/../.."
ROOT=$PWD
WORK=$ROOT/.local/debloat-tests   # outside debloat/, which each test copies
rm -rf "$WORK"; mkdir -p "$WORK"
trap 'rm -rf "$WORK"' EXIT
export PATH="$ROOT/debloat/tests/fake-adb:$PATH" TV_SERIAL=fake-tv
unset TV_IP
passed=0 failed=0

check() { if eval "$2"; then passed=$((passed + 1)); else failed=$((failed + 1)); echo "FAIL $1"; sed 's/^/     /' "$WORK/out" | tail -15; fi; }
state() { awk -v p="$1" '$1 == p { print $2 }' "$FAKE_TV/packages"; }
setting() { awk -F= -v k="$1" '$1 == k { print substr($0, index($0, "=") + 1); f = 1 } END { if (!f) print "null" }' "$FAKE_TV/settings"; }
says() { grep -q -- "$1" "$WORK/out"; }
set_pkg() { awk -v p="$1" -v s="$2" '$1 == p { $2 = s } { print }' "$FAKE_TV/packages" > "$FAKE_TV/p" && mv "$FAKE_TV/p" "$FAKE_TV/packages"; }

# tv <name> "<props>" <package:state>...: a fresh fake TV, and a fresh copy of the scripts (so my-tvs/ starts empty).
tv() {
  export FAKE_TV="$WORK/$1"
  rm -rf "$FAKE_TV" "$WORK/repo"; mkdir -p "$FAKE_TV" "$WORK/repo/android/out"
  cp -R "$ROOT/debloat" "$WORK/repo/"; rm -rf "$WORK/repo/debloat/tests"
  cp "$ROOT/android/install.sh" "$ROOT/android/restore.sh" "$WORK/repo/android/"
  : > "$WORK/repo/android/out/foyerlauncher.apk"
  printf '%s\n' $2 | tr '+' ' ' > "$FAKE_TV/props"
  shift 2
  for p in "$@"; do echo "${p%:*} ${p##*:}"; done > "$FAKE_TV/packages"
}
run() { (cd "$WORK/repo" && "$@") > "$WORK/out" 2>&1; }
mytv() { ls -d "$WORK/repo/my-tvs/"*/ 2>/dev/null | head -1; }

# Sony: detection, the list an owner chooses from, defaults, optional groups, exceptions and refusals.
SONY="ro.product.brand=Sony ro.product.manufacturer=Sony ro.product.model=BRAVIA+Test ro.serialno=S1"
tv sony "$SONY" com.sony.dtv.sonyselect:0 tv.samba.ssm:1 com.google.android.feedback:0 com.sony.dtv.livingfit:0 \
  com.sony.dtv.smarthelp:0 com.google.android.tungsten.setupwraith:0 com.sony.dtv.tvinput.tuner:0 com.sony.dtv.promos:2 com.google.android.youtube.tv:0
run debloat/debloat.sh --list
check "Sony is detected" "says 'using the Sony list'"
check "--list shows recommended apps and optional groups" "says 'Recommended to hide' && says 'com.sony.dtv.sonyselect' && says '  camera:' && says 'com.sony.dtv.livingfit'"
check "--list leaves out protected and already-hidden apps" "! says 'setupwraith' && ! says 'tvinput.tuner' && ! says 'com.sony.dtv.promos'"
check "--list changes nothing" "[ \"\$(state com.sony.dtv.sonyselect)\" = 0 ] && [ ! -e \"\$(mytv)restore-my-tv.sh\" ]"
run debloat/debloat.sh --dry-run
check "dry run changes nothing" "[ \"\$(state com.sony.dtv.sonyselect)\" = 0 ] && says 'would hide com.sony.dtv.sonyselect'"
run debloat/debloat.sh --except com.sony.dtv.smarthelp
check "recommended apps are hidden" "[ \"\$(state com.sony.dtv.sonyselect)\" = 3 ] && [ \"\$(state tv.samba.ssm)\" = 3 ] && [ \"\$(state com.google.android.feedback)\" = 3 ]"
check "--except keeps a recommended app" "[ \"\$(state com.sony.dtv.smarthelp)\" = 0 ]"
check "optional apps are left alone by default" "[ \"\$(state com.sony.dtv.livingfit)\" = 0 ]"
check "setup, tuner and YouTube are untouched" "[ \"\$(state com.google.android.tungsten.setupwraith)\" = 0 ] && [ \"\$(state com.sony.dtv.tvinput.tuner)\" = 0 ] && [ \"\$(state com.google.android.youtube.tv)\" = 0 ]"
check "a maker-disabled app is left as it is" "[ \"\$(state com.sony.dtv.promos)\" = 2 ]"
check "the TV gets its own restore script" "[ -x \"\$(mytv)restore-my-tv.sh\" ] && grep -q 'tv.samba.ssm 1' \"\$(mytv)restore-my-tv.sh\""
check "my-tvs records which TV it is" "grep -q '^name=Sony BRAVIA Test' \"\$(mytv)tv.txt\" && grep -q '^brand=sony' \"\$(mytv)tv.txt\""
run debloat/debloat.sh --include camera
check "--include hides an optional group" "[ \"\$(state com.sony.dtv.livingfit)\" = 3 ]"
run debloat/debloat.sh com.google.android.tungsten.setupwraith
check "a never app is refused by name" "[ \"\$(state com.google.android.tungsten.setupwraith)\" = 0 ] && says 'keep or never'"
run debloat/debloat.sh com.example.unlisted
check "an unlisted app is refused" "says 'not a group or app'"
run debloat/debloat.sh --include camera com.sony.dtv.smarthelp
check "names can't be mixed with --include" "says 'not both' && ! says 'Hiding on'"
run debloat/debloat.sh com.sony.dtv.smarthelp
set_pkg com.sony.dtv.livingfit 0; set_pkg com.sony.dtv.sonyselect 0; set_pkg com.sony.dtv.smarthelp 0
run debloat/debloat.sh --again
check "--again hides everything hidden before, across runs" "says 'Hiding again' && [ \"\$(state com.sony.dtv.livingfit)\" = 3 ] && [ \"\$(state com.sony.dtv.sonyselect)\" = 3 ] && [ \"\$(state com.sony.dtv.smarthelp)\" = 3 ]"

# Then FoyerLauncher with the Home button, and the TV's own restore script undoing all of it.
echo "enabled_accessibility_services=com.example.talkback/.Service" > "$FAKE_TV/settings"
run android/install.sh
check "install turns on the Home button and records the TV's settings" \
  "setting enabled_accessibility_services | grep -q foyerlauncher && grep -q 'talkback' \"\$(mytv)accessibility-before.txt\" && [ -f \"\$(mytv)launcher.txt\" ]"
check "the restore script now covers the Home button" "grep -q \"LAUNCHER='io.github.nycoagung.foyerlauncher'\" \"\$(mytv)restore-my-tv.sh\""
run "$(mytv)restore-my-tv.sh" --dry-run
check "the restore script's dry run changes nothing" "says 'Dry run' && [ \"\$(state tv.samba.ssm)\" = 3 ] && setting enabled_accessibility_services | grep -q foyerlauncher"
run "$(mytv)restore-my-tv.sh"
check "the restore script brings every app back to its recorded state" \
  "[ \"\$(state tv.samba.ssm)\" = 1 ] && [ \"\$(state com.sony.dtv.sonyselect)\" = 0 ] && [ \"\$(state com.sony.dtv.livingfit)\" = 0 ] && [ \"\$(state com.sony.dtv.promos)\" = 2 ]"
check "the restore script gives Home back and keeps other services" "[ \"\$(setting enabled_accessibility_services)\" = com.example.talkback/.Service ]"
check "FoyerLauncher stays unless asked" "[ -n \"\$(state io.github.nycoagung.foyerlauncher)\" ]"
run "$(mytv)restore-my-tv.sh" --uninstall
check "--uninstall removes FoyerLauncher" "[ -z \"\$(state io.github.nycoagung.foyerlauncher)\" ]"
sed -i.bak 's/^ro.serialno=.*/ro.serialno=OTHER/' "$FAKE_TV/props"
run "$(mytv)restore-my-tv.sh"
check "the restore script refuses a different TV" "says 'not the one this script was written for'"

# Apps the owner had disabled before stay disabled; a failing app doesn't stop the restore.
tv sony4 "$SONY" com.sony.dtv.sonyselect:0 tv.samba.ssm:0 com.sony.dtv.multiscreendemo:3
run debloat/debloat.sh
run android/install.sh
run debloat/restore.sh
check "restore.sh leaves apps disabled before setup alone" "[ \"\$(state com.sony.dtv.multiscreendemo)\" = 3 ] && [ \"\$(state com.sony.dtv.sonyselect)\" = 0 ]"
run debloat/debloat.sh
(cd "$WORK/repo" && FAKE_FAIL_PKG=com.sony.dtv.sonyselect "$(mytv)restore-my-tv.sh") > "$WORK/out" 2>&1; status=$?
check "a failing app doesn't stop the restore script" "[ \$status = 1 ] && says '!! com.sony.dtv.sonyselect' && [ \"\$(state tv.samba.ssm)\" = 0 ] && [ \"\$(setting enabled_accessibility_services)\" = null ]"
check "the restore script leaves apps disabled before setup alone" "[ \"\$(state com.sony.dtv.multiscreendemo)\" = 3 ]"
run "$(mytv)restore-my-tv.sh"
check "running it again finishes the job" "[ \"\$(state com.sony.dtv.sonyselect)\" = 0 ] && says 'Done'"

# A Home service slow to start still leaves a restore script that gives Home back.
tv sony5 "$SONY" com.sony.dtv.sonyselect:0
(cd "$WORK/repo" && FAKE_NO_A11Y=1 android/install.sh) > "$WORK/out" 2>&1
check "a slow Home service still gets a restore script" "says 'did not start yet' && grep -q \"LAUNCHER='io.github.nycoagung.foyerlauncher'\" \"\$(mytv)restore-my-tv.sh\""

# A TV without a real serial number is told apart by its Android ID.
tv noserial "ro.product.brand=Sony ro.product.manufacturer=Sony ro.product.model=BRAVIA+Test ro.serialno=0123456789ABCDEF" com.sony.dtv.sonyselect:0
echo "android_id=abc123" > "$FAKE_TV/settings"
run debloat/debloat.sh
check "a placeholder serial falls back to the Android ID" "[ \"\$(basename \"\$(mytv)\")\" = BRAVIA_Test-aid-abc123 ]"
echo "android_id=other" > "$FAKE_TV/settings"
run "$(mytv)restore-my-tv.sh"
check "and the restore script tells such TVs apart" "says 'not the one this script was written for'"

# A TV reporting a hostile model name can't put a command into the restore script.
tv hostile "$SONY" com.sony.dtv.sonyselect:0
(cd "$WORK/repo" && FAKE_MODEL_RAW="BRAVIA\nname=touch $WORK/pwned #" debloat/debloat.sh) > "$WORK/out" 2>&1
(cd "$WORK/repo" && FAKE_MODEL_RAW="BRAVIA\nname=touch $WORK/pwned #" "$(mytv)restore-my-tv.sh") > "$WORK/out" 2>&1
check "a TV's reported values can't inject commands into the restore script" "[ ! -e \"$WORK/pwned\" ] && [ \"\$(grep -c '^name=' \"\$(mytv)tv.txt\")\" = 1 ] && ! grep -q '^touch\\|; touch\\|^name=touch' \"\$(mytv)restore-my-tv.sh\""

# A TV whose accessibility was off: the restore puts it back off.
tv sony2 "$SONY" com.sony.dtv.sonyselect:0
run android/install.sh
run "$(mytv)restore-my-tv.sh"
check "with no other services, accessibility goes back exactly as it was (unset)" "[ \"\$(setting enabled_accessibility_services)\" = null ] && [ \"\$(setting accessibility_enabled)\" = null ]"

# debloat/restore.sh on its own.
tv sony3 "$SONY" com.sony.dtv.sonyselect:0 tv.samba.ssm:1
run debloat/debloat.sh
run debloat/restore.sh tv.samba.ssm
check "restore.sh brings back one app" "[ \"\$(state tv.samba.ssm)\" = 1 ] && [ \"\$(state com.sony.dtv.sonyselect)\" = 3 ]"

# TCL: its own list and its never apps.
tv tcl "ro.product.brand=TCL ro.product.manufacturer=TCL ro.product.model=55C735" com.tcl.esticker:0 com.tcl.tvinput:0 com.tcl.tv:0 com.google.android.feedback:0
run debloat/debloat.sh
check "TCL is detected" "says 'using the TCL list'"
check "TCL bloat is hidden; tuner and Live TV are untouched" "[ \"\$(state com.tcl.esticker)\" = 3 ] && [ \"\$(state com.tcl.tvinput)\" = 0 ] && [ \"\$(state com.tcl.tv)\" = 0 ]"
run debloat/debloat.sh com.tcl.tvinput
check "TCL tuner is refused by name" "says 'keep or never'"

# Detection by brand, model and device name.
tv philips "ro.product.brand=Philips ro.product.manufacturer=TPV ro.product.model=65PUS8807"
run debloat/debloat.sh --list; check "Philips is detected" "says 'using the Philips list'"
tv shield "ro.product.brand=NVIDIA ro.product.manufacturer=NVIDIA ro.product.model=SHIELD+Android+TV"
run debloat/debloat.sh --list; check "Shield is detected" "says 'using the Nvidia Shield list'"
tv chromecast "ro.product.brand=google ro.product.manufacturer=Google ro.product.model=Chromecast ro.product.device=sabrina"
run debloat/debloat.sh --list; check "Chromecast is detected" "says 'Chromecast / Google TV Streamer list'"
tv fire "ro.product.brand=Amazon ro.product.manufacturer=Amazon ro.product.model=AFTKA"
run debloat/debloat.sh --list; check "Fire TV is detected" "says 'Amazon Fire TV list'"

# A wildcard never-rule protects an app with no entry of its own, but not one listed as optional.
tv hisense "ro.product.brand=Hisense ro.product.manufacturer=Hisense ro.product.model=55A6" com.mediatek.unknownservice:0 com.mediatek.androidbox:0
run debloat/debloat.sh com.mediatek.unknownservice
check "a pattern-protected app is refused as protected" "says 'keep or never' && [ \"\$(state com.mediatek.unknownservice)\" = 0 ]"
run debloat/debloat.sh --include all
check "an explicitly optional app under the pattern can be hidden" "[ \"\$(state com.mediatek.androidbox)\" = 3 ] && [ \"\$(state com.mediatek.unknownservice)\" = 0 ]"

# A brand's never-pattern beats a common.txt entry; Fire TV Edition sets get the Fire TV list.
tv patternbrand "ro.product.brand=Acme ro.product.manufacturer=Acme ro.product.model=X1" com.google.android.feedback:0
printf 'never     other      com.google.android.feed*                           test pattern\n' > "$WORK/repo/debloat/brands/testbrand.txt"
run debloat/debloat.sh --brand testbrand
check "a brand's never-pattern protects a common bloat app" "[ \"\$(state com.google.android.feedback)\" = 0 ]"
tv firetv "ro.product.brand=Toshiba ro.product.manufacturer=Amazon ro.product.model=AFTDCT31"
run debloat/debloat.sh --list; check "a Fire TV Edition set gets the Fire TV list" "says 'Amazon Fire TV list'"

# Unknown brand: only the common list; --brand picks a list; an unknown --brand is refused.
tv acme "ro.product.brand=Acme ro.product.manufacturer=Acme ro.product.model=X1" com.google.android.feedback:0 com.tcl.esticker:0
run debloat/debloat.sh
check "an unknown brand gets the common list only" "says 'only the common Android TV list' && [ \"\$(state com.google.android.feedback)\" = 3 ] && [ \"\$(state com.tcl.esticker)\" = 0 ]"
run debloat/debloat.sh --brand tcl
check "--brand uses that list" "[ \"\$(state com.tcl.esticker)\" = 3 ]"
run debloat/debloat.sh --brand nosuchbrand
check "an unknown --brand is refused" "says \"No list for brand 'nosuchbrand'\""

# No address at all.
( unset TV_SERIAL TV_IP; cd "$WORK/repo" && debloat/debloat.sh ) > "$WORK/out" 2>&1
check "without TV_IP the scripts ask for it" "says 'Set TV_IP'"

echo "$passed passed, $failed failed"
[ $failed = 0 ]
