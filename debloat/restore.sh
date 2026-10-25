#!/usr/bin/env bash
# Bring back apps hidden by debloat.sh, each to the enabled state recorded before it was first hidden.
# Only apps in this TV's lists or its record are touched, and only ones hidden by a user: apps the maker
# ships disabled stay as they are. To undo everything at once (apps and the Home button), the simplest is
# the TV's own my-tvs/<model>-<serial>/restore-my-tv.sh, which debloat.sh keeps up to date.
#
# Usage (TV_IP=<TV_IP> before each, or TV_SERIAL=<adb serial>):
#   debloat/restore.sh                  restore every hidden app debloat.sh can hide
#   debloat/restore.sh camera media     restore only these groups
#   debloat/restore.sh com.example.app  restore one app
#   debloat/restore.sh --dry-run [...]  show what would be restored without changing the TV
#   debloat/restore.sh --brand tcl [...] use a brand's list instead of detecting it

set -eo pipefail
. "$(dirname "$0")/lib.sh"

dry_run=0 names=()
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) dry_run=1 ;;
    --brand) BRAND=$2; shift ;;
    --brand=*) BRAND=${1#--brand=} ;;
    -h|--help) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) echo "Unknown option $1"; exit 1 ;;
    *) names+=("$1") ;;
  esac
  shift
done

resolve_tv
connect
detect_brand
build_list
tv_dir
BEFORE=$DIR/enabled-before.txt

# Everything restorable: the lists' apps, plus anything this TV's record says debloat.sh hid
# (in case a list has changed since).
candidates=$(mktemp "${TMPDIR:-/tmp}/restore.XXXXXX")
trap 'rm -f "$LIST" "$candidates"' EXIT
awk '{ desc = $0; sub(/^[^ ]+ +[^ ]+ +[^ ]+ */, "", desc); print $3, $2, desc }' "$LIST" > "$candidates"
records() { cat "$BEFORE" 2>/dev/null || true; }
records | awk '{ print $1, "recorded", "hidden by debloat.sh earlier" }' >> "$candidates"

for n in "${names[@]}"; do
  awk -v s="$n" '$1 == s || $2 == s { found = 1 } END { exit !found }' "$candidates" \
    || { echo "'$n' is not a group or app debloat.sh hides on this TV."; exit 1; }
done

chosen() {
  local n
  [ ${#names[@]} -eq 0 ] && return 0
  for n in "${names[@]}"; do [ "$n" = "$1" ] || [ "$n" = "$2" ] && return 0; done
  return 1
}

disabled=" $(tv pm list packages -d | sed 's/^package://' | tr '\n' ' ') "
echo "Restoring on $TV${names[*]:+: ${names[*]}}"
restored=0 failed=0 seen=" "
while read -r pkg group desc; do
  [[ "$seen" == *" $pkg "* ]] && continue
  seen="$seen$pkg "
  chosen "$pkg" "$group" || continue
  [[ "$disabled" == *" $pkg "* ]] || continue
  if [ "$(user_state "$pkg")" != 3 ]; then
    echo "  =  $pkg was disabled by the maker, leaving it alone"; continue
  fi
  if [ $dry_run = 1 ]; then echo "  ?  would restore $pkg ($desc)"; continue; fi
  # Back to the recorded state: explicitly enabled (1), or else the app's default.
  if [ "$(records | awk -v p="$pkg" '$1 == p { print $2; exit }')" = 1 ]; then
    result=$(tv pm enable --user 0 "$pkg" 2>&1) || true
  else
    result=$(tv pm default-state --user 0 "$pkg" 2>&1) || true
  fi
  if [[ "$result" == *"new state"* ]]; then
    echo "  ok $pkg ($desc)"; restored=$((restored + 1))
  else
    echo "  !! $pkg: $result"; failed=$((failed + 1))
  fi
done < "$candidates"

if [ $dry_run = 1 ]; then echo "Dry run: nothing changed."; exit 0; fi
echo "Done: $restored restored, $failed failed."
[ $failed = 0 ]
