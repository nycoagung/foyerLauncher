#!/usr/bin/env bash
# Installs FoyerLauncher on the TV and gives it the Home button through an accessibility service.
# Nothing on the TV is turned off: the TV's own home screen stays installed and keeps the Home role,
# so if the service ever stops, Home simply opens it again. Undo with ./restore.sh, or with the TV's
# own my-tvs/<model>-<serial>/restore-my-tv.sh, which this keeps up to date.
#
#   ./install.sh               install or update FoyerLauncher and turn on its Home button
#   ./install.sh --app-only    install or update FoyerLauncher only; Home stays with the TV's home screen
#
# Give the TV's IP address with TV_IP=<TV_IP> (port 5555 unless you add one, as Wireless debugging
# needs: TV_IP=<TV_IP>:<ADB_PORT>), or any adb serial with TV_SERIAL (an emulator or a USB connection).
# docs/agent-android-setup-guide.md has the whole setup.
set -eo pipefail
cd "$(dirname "$0")"
. ../debloat/lib.sh

PKG=io.github.nycoagung.foyerlauncher
SERVICE=$PKG/$PKG.HomeKeyService
APK=out/foyerlauncher.apk

resolve_tv
connect
tv_dir
BASELINE=$DIR/accessibility-before.txt
# Earlier versions kept it in android/.local/, named by address.
LEGACY=.local/accessibility-before-$(printf %s "$TV" | tr -c "A-Za-z0-9." _).txt
[ -f "$BASELINE" ] || [ ! -f "$LEGACY" ] || mv "$LEGACY" "$BASELINE"
[ -f "$APK" ] || ./build.sh

echo "Installing FoyerLauncher on ${TV}…"
if ! out=$(adb -s "$TV" install -r "$APK" 2>&1); then
  case "$out" in
    *UPDATE_INCOMPATIBLE*) echo "The TV has a FoyerLauncher signed with a different key. Run ./restore.sh --uninstall first (this resets FoyerLauncher's own settings)." ;;
    *) echo "$out" ;;
  esac
  exit 1
fi
echo "  ok installed $(tv dumpsys package $PKG | sed -n 's/^ *versionName=//p' | head -1)"
echo "$PKG" > "$DIR/launcher.txt"

if [ "${1:-}" = "--app-only" ]; then
  write_restore
  echo "Done. Open FoyerLauncher from the Apps row. Home still opens the TV's own home screen."
  exit 0
fi

# Keep the TV's own accessibility settings once, so restore.sh can put them back exactly.
if [ ! -f "$BASELINE" ]; then
  # Without FoyerLauncher's own service, in case it was already turned on (in the TV's settings, or from
  # another computer); with it gone, accessibility was off.
  services=$(tv settings get secure enabled_accessibility_services)
  enabled=$(tv settings get secure accessibility_enabled)
  case ":$services:" in *":$PKG/"*)
    services=$(printf '%s' "$services" | tr ':' '\n' | grep -v "^$PKG/" | paste -sd: - || true)
    [ -n "$services" ] || { services=null; enabled=0; } ;;
  esac
  printf 'enabled_accessibility_services=%s\naccessibility_enabled=%s\n' "$services" "$enabled" > "$BASELINE"
  echo "  ok saved the TV's accessibility settings to ${BASELINE#"$REPO"/}"
fi

# adb shell re-parses its arguments on the TV, so values go in single quotes there (a $ in a component stays literal).
current=$(tv settings get secure enabled_accessibility_services)
case ":$current:" in
  *":$SERVICE:"*) ;;
  ":null:"|"::") tv settings put secure enabled_accessibility_services "'$SERVICE'" ;;
  *) tv settings put secure enabled_accessibility_services "'$current:$SERVICE'" ;;
esac
tv settings put secure accessibility_enabled 1
# Straight away, so the TV's restore script can give Home back even if the service is slow to start.
write_restore

# The system binds the service a moment later.
for i in 1 2 3 4 5 6 7 8 9 10; do
  if tv dumpsys accessibility | grep -q "$PKG"; then
    echo "  ok Home button service is on"
    echo "Done. Press Home on the remote to open FoyerLauncher. Hold Home to open the TV's own home screen."
    echo "To undo everything, run the restore script above."
    exit 0
  fi
  sleep 1
done
echo "The Home button service did not start yet. Some TVs ask you to confirm it in Settings > Accessibility; check there."
echo "To put the settings back instead, run the restore script above (or ./restore.sh). To check: adb shell dumpsys accessibility"
exit 1
