#!/usr/bin/env bash
# Gives the Home button back to the TV's own home screen: turns off FoyerLauncher's Home button service
# and leaves any other accessibility service as it is. The TV's home screen was never turned off.
# The TV's own my-tvs/<model>-<serial>/restore-my-tv.sh does this and brings back hidden apps too.
#
#   ./restore.sh               turn off the Home button service; FoyerLauncher stays installed as an app
#   ./restore.sh --uninstall   also remove FoyerLauncher (its saved layout and wallpaper go with it)
#
# Give the TV's IP address with TV_IP=<TV_IP> (or <TV_IP>:<ADB_PORT>), or any adb serial with TV_SERIAL.
set -eo pipefail
cd "$(dirname "$0")"
. ../debloat/lib.sh

PKG=io.github.nycoagung.foyerlauncher
resolve_tv
connect
tv_dir
BASELINE=$DIR/accessibility-before.txt
LEGACY=.local/accessibility-before-$(printf %s "$TV" | tr -c "A-Za-z0-9." _).txt
[ -f "$BASELINE" ] || [ ! -f "$LEGACY" ] || mv "$LEGACY" "$BASELINE"

saved() { if [ -f "$BASELINE" ]; then sed -n "s/^$1=//p" "$BASELINE"; fi; }
# put <name> <value>: "null" means the TV had no value, so delete it again. Values are single-quoted for
# the TV's shell, which adb shell hands its arguments to.
put() { if [ -z "$2" ] || [ "$2" = null ]; then tv settings delete secure "$1" >/dev/null; else tv settings put secure "$1" "'$2'"; fi; }

current=$(tv settings get secure enabled_accessibility_services)
others=$(printf '%s' "$current" | tr ':' '\n' | grep -v "^$PKG/" | grep -v '^null$' | paste -sd: - || true)
if [ -n "$others" ]; then
  tv settings put secure enabled_accessibility_services "'$others'"
  echo "  ok turned off the Home button service; other accessibility services stay on"
else
  # No other service is on now. Put back exactly what the TV had only if that was none either; a service
  # in the baseline that was turned off since stays off. FoyerLauncher's own entry is never restored.
  before=$(saved enabled_accessibility_services | tr ':' '\n' | grep -v "^$PKG/" | grep -v '^null$' | paste -sd: - || true)
  tv settings delete secure enabled_accessibility_services >/dev/null
  if [ -f "$BASELINE" ] && [ -z "$before" ]; then put accessibility_enabled "$(saved accessibility_enabled)"
  else tv settings put secure accessibility_enabled 0; fi
  echo "  ok turned off the Home button service and restored the TV's accessibility settings"
fi

if [ "${1:-}" = "--uninstall" ]; then
  adb -s "$TV" uninstall "$PKG" >/dev/null 2>&1 && echo "  ok removed FoyerLauncher" || echo "  -  FoyerLauncher was not installed"
fi

echo "Home now opens: $(tv cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.HOME | tail -1)"
