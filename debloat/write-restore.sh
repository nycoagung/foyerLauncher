#!/usr/bin/env bash
# Writes <tv folder>/restore-my-tv.sh: a script for one TV that puts back everything FoyerLauncher's setup
# changed on it, from what debloat.sh and android/install.sh recorded there. It needs only adb, not this
# repository. debloat.sh and android/install.sh run this after every change; run it by hand only to rebuild.
#   debloat/write-restore.sh my-tvs/<model>-<serial>
set -eo pipefail
DIR=${1:?usage: $0 <tv folder in my-tvs/>}; DIR=${DIR%/}
[ -f "$DIR/tv.txt" ] || { echo "$DIR has no tv.txt"; exit 1; }
get() { sed -n "s/^$1=//p" "$DIR/tv.txt"; }
quote() { printf "'%s'" "$(printf '%s' "$1" | sed "s/'/'\\\\''/g")"; }

name=$(get name) serial=$(get serial) address=$(get address)
packages=$(cat "$DIR/enabled-before.txt" 2>/dev/null || true)
launcher=$(cat "$DIR/launcher.txt" 2>/dev/null || true)
services="" enabled=""
if [ -f "$DIR/accessibility-before.txt" ]; then
  services=$(sed -n 's/^enabled_accessibility_services=//p' "$DIR/accessibility-before.txt")
  enabled=$(sed -n 's/^accessibility_enabled=//p' "$DIR/accessibility-before.txt")
fi
out="$DIR/restore-my-tv.sh"

{
  cat <<EOF
#!/usr/bin/env bash
# Puts the $name back the way it was before FoyerLauncher's setup changed it.
# Written $(date '+%Y-%m-%d %H:%M') by FoyerLauncher's debloat/write-restore.sh from what was recorded on this TV.
# It needs only adb (Android platform-tools) and is safe to run more than once.
#
#   ./restore-my-tv.sh              bring back every app that was hidden and give the Home button back
#   ./restore-my-tv.sh --uninstall  also remove FoyerLauncher and its settings
#   ./restore-my-tv.sh --dry-run    show what it would do, without changing anything
#
# The TV's address when this was written is below. If it has changed, give the new one:
#   TV_IP=<TV_IP> ./restore-my-tv.sh     (or TV_IP=<TV_IP>:<port> with Wireless debugging)
set -eo pipefail

ADDRESS=$(quote "$address")
SERIAL=$(quote "$serial")
# Each hidden app and the state it had before it was hidden: 1 enabled, anything else its factory default.
PACKAGES=$(quote "$packages")
LAUNCHER=$(quote "$launcher")
# The TV's accessibility settings before FoyerLauncher's Home button service ("null" means none).
SERVICES_BEFORE=$(quote "$services")
ENABLED_BEFORE=$(quote "$enabled")
EOF
  cat <<'EOF'

dry_run=0 uninstall=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=1 ;;
    --uninstall) uninstall=1 ;;
    -h|--help) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option $arg"; exit 1 ;;
  esac
done

if [ -n "${TV_SERIAL:-}" ]; then TV=$TV_SERIAL
elif [ -n "${TV_IP:-}" ]; then case "$TV_IP" in *:*) TV=$TV_IP ;; *) TV=$TV_IP:5555 ;; esac
else TV=$ADDRESS; fi
command -v adb >/dev/null || { echo "adb not found. Install Android platform-tools (on macOS: brew install --cask android-platform-tools)."; exit 1; }
case "$TV" in *.*:*) adb connect "$TV" >/dev/null 2>&1 || true ;; esac
if [ "$(adb -s "$TV" get-state 2>/dev/null)" != device ]; then
  echo "Can't reach the TV at $TV. Turn it on, check debugging is still on in Developer options, and accept the prompt on screen."
  echo "If its address has changed, run: TV_IP=<new address> $0"
  exit 1
fi
tv() { adb -s "$TV" shell "$@" </dev/null | tr -d '\r'; }
# The same identity setup recorded: the serial number, or the Android ID when the serial is missing or a placeholder.
identity() {
  local serial; serial=$(tv getprop ro.serialno)
  case "$(printf '%s' "$serial" | tr 'a-z' 'A-Z')" in
    ''|UNKNOWN|0123456789ABCDEF|1234567890ABCDEF|0000000000000000|0123456789) printf 'aid-%s' "$(tv settings get secure android_id)" ;;
    *) printf '%s' "$serial" ;;
  esac
}
if [ -n "$SERIAL" ] && [ "$(identity)" != "$SERIAL" ]; then
  echo "The TV at $TV is not the one this script was written for ($SERIAL). Nothing was changed."
  exit 1
fi
failed=0
fail() { echo "  !! $*"; failed=$((failed + 1)); }
run() { if [ $dry_run = 1 ]; then echo "  would run: $*"; else tv "$@" >/dev/null 2>&1; fi; }
state() { tv dumpsys package "$1" | awk '/User 0:.* enabled=[0-9]/ && !d { match($0, / enabled=[0-9]/); print substr($0, RSTART + 9, 1); d = 1 }'; }

# The Home button first, so it comes back even if an app can't be restored.
if [ -n "$LAUNCHER" ]; then
  current=$(tv settings get secure enabled_accessibility_services)
  if printf '%s' "$current" | tr ':' '\n' | grep -q "^$LAUNCHER/"; then
    echo "Giving the Home button back to the TV's own home screen."
    others=$(printf '%s' "$current" | tr ':' '\n' | grep -v "^$LAUNCHER/" | grep -v '^null$' | paste -sd: - || true)
    if [ -n "$others" ]; then
      run settings put secure enabled_accessibility_services "'$others'" || fail "couldn't turn off the Home button service"
    else
      # Exactly as before only if no other service was on then either; one turned off since stays off.
      before=$(printf '%s' "$SERVICES_BEFORE" | tr ':' '\n' | grep -v "^$LAUNCHER/" | grep -v '^null$' | paste -sd: - || true)
      run settings delete secure enabled_accessibility_services || fail "couldn't turn off the Home button service"
      if [ -z "$before" ] && [ -n "$ENABLED_BEFORE" ] && [ "$ENABLED_BEFORE" != null ]; then run settings put secure accessibility_enabled "$ENABLED_BEFORE" || fail "couldn't restore accessibility"
      elif [ -z "$before" ] && [ "$ENABLED_BEFORE" = null ]; then run settings delete secure accessibility_enabled || fail "couldn't restore accessibility"
      else run settings put secure accessibility_enabled 0 || fail "couldn't restore accessibility"; fi
    fi
  fi
fi

restored=0
if [ -n "$PACKAGES" ]; then
  echo "Bringing back hidden apps:"
  while read -r pkg before; do
    [ -n "$pkg" ] || continue
    # Only apps that are still hidden by a user; anything the maker ships disabled is left as it is.
    [ "$(state "$pkg")" = 3 ] || continue
    if [ $dry_run = 1 ]; then echo "  would bring back $pkg"; restored=$((restored + 1)); continue; fi
    if [ "$before" = 1 ]; then result=$(tv pm enable --user 0 "$pkg" 2>&1) || true
    else result=$(tv pm default-state --user 0 "$pkg" 2>&1) || true; fi
    case "$result" in
      *"new state"*) echo "  ok $pkg"; restored=$((restored + 1)) ;;
      *) fail "$pkg: ${result:-no answer from the TV}" ;;
    esac
  done <<< "$PACKAGES"
  if [ $dry_run = 1 ]; then echo "  $restored would be brought back."; else echo "  $restored brought back."; fi
fi

if [ -n "$LAUNCHER" ] && [ $uninstall = 1 ]; then
  echo "Removing FoyerLauncher."
  if [ $dry_run = 1 ]; then echo "  would run: adb uninstall $LAUNCHER"; else adb -s "$TV" uninstall "$LAUNCHER" >/dev/null 2>&1 || echo "  FoyerLauncher was not installed."; fi
fi

[ $dry_run = 1 ] && { echo "Dry run: nothing changed."; exit 0; }
if [ $failed -gt 0 ]; then
  echo "$failed step(s) didn't work, listed above with !!. Check the TV is on and connected, then run this script again: it only redoes what is still needed."
  exit 1
fi
echo "Done. Home now opens: $(tv cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.HOME | tail -1)"
echo "You can turn off Developer options on the TV again if you like (Settings > System > Developer options)."
EOF
} > "$out"
chmod 700 "$out"
echo "Restore script for this TV: ${out#"$(cd "$DIR/../.." && pwd)"/}"
