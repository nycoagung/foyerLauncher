#!/usr/bin/env bash
# Hide (disable) preinstalled bloat on an Android TV or Google TV over ADB, using the list for the TV's brand.
# Nothing is uninstalled: hidden apps keep their data. Every run updates the TV's own restore script,
# my-tvs/<model>-<serial>/restore-my-tv.sh, which puts it all back. docs/agent-android-setup-guide.md
# is the whole setup; an AI agent normally runs this for you.
#
# Usage (TV_IP=<TV_IP> before each, or TV_SERIAL=<adb serial>):
#   debloat/debloat.sh --list                 the TV's brand and the apps that can be hidden, grouped; changes nothing
#   debloat/debloat.sh                        hide the recommended apps ("bloat" in the brand's list)
#   debloat/debloat.sh --include camera,media also hide these optional groups ("all" for every one)
#   debloat/debloat.sh --except com.a,com.b   leave these recommended apps alone
#   debloat/debloat.sh ads demo com.x.y       hide only these groups or apps (not with --include or --except)
#   debloat/debloat.sh --again                hide again everything hidden on this TV before (after a firmware update)
#   debloat/debloat.sh --dry-run [...]        show what would be hidden without changing anything
#   debloat/debloat.sh --brand tcl [...]      use a brand's list instead of detecting it (see debloat/brands/)
# Apps marked keep or never in the lists are always refused.

set -eo pipefail
. "$(dirname "$0")/lib.sh"

dry_run=0 list_only=0 again=0 include="" except="" names=()
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) dry_run=1 ;;
    --list) list_only=1 ;;
    --again) again=1 ;;
    --include) include="$include ${2//,/ }"; shift ;;
    --include=*) include="$include ${1#--include=}"; include=${include//,/ } ;;
    --except) except="$except ${2//,/ }"; shift ;;
    --except=*) except="$except ${1#--except=}"; except=${except//,/ } ;;
    --brand) BRAND=$2; shift ;;
    --brand=*) BRAND=${1#--brand=} ;;
    -h|--help) sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) echo "Unknown option $1"; exit 1 ;;
    *) names+=("$1") ;;
  esac
  shift
done

if [ ${#names[@]} -gt 0 ] && [ -n "$include$except" ]; then
  echo "Name groups and apps on their own, or use the recommended set with --include and --except, not both."
  exit 1
fi
resolve_tv
connect
detect_brand
tv_dir
BEFORE=$DIR/enabled-before.txt
if [ $again = 1 ]; then
  [ -s "$BEFORE" ] || { echo "Nothing has been hidden on this TV yet."; exit 1; }
  echo "Hiding again everything hidden on this TV before ($(wc -l < "$BEFORE" | tr -d ' ') apps)."
fi
build_list
about="$(tvtext getprop ro.product.manufacturer) $(tvtext getprop ro.product.model) (Android $(tvtext getprop ro.build.version.release))"
if [ -n "$BRAND" ]; then
  echo "$about: using the $BRAND_NAME list and the common Android TV list."
else
  echo "$about: no list for this brand, so only the common Android TV list is used."
  echo "If it is one of the brands in debloat/brands/, pass --brand <id>."
fi

installed=" $(tv pm list packages | sed 's/^package://' | tr '\n' ' ') "
disabled=" $(tv pm list packages -d | sed 's/^package://' | tr '\n' ' ') "
is_installed() { [[ "$installed" == *" $1 "* ]]; }
is_hidden() { [[ "$disabled" == *" $1 "* ]]; }

if [ $list_only = 1 ]; then
  # What an owner chooses from: only apps on this TV that are not hidden yet.
  awk -v installed="$installed" -v disabled="$disabled" '
    ($1 == "bloat" || $1 == "optional") && index(installed, " " $3 " ") && !index(disabled, " " $3 " ") {
      desc = $0; sub(/^[^ ]+ +[^ ]+ +[^ ]+ */, "", desc)
      if ($1 == "bloat") rec = rec sprintf("  %-10s %-48s %s\n", $2, $3, desc)
      else { if (!($2 in opt)) groups[++n] = $2; opt[$2] = opt[$2] sprintf("    %-48s %s\n", $3, desc) }
    }
    END {
      print "\nRecommended to hide (hidden by default; --except <app> keeps one):"
      printf "%s", rec ? rec : "  (none left on this TV)\n"
      print "\nOptional groups (hidden only with --include <group>, or name single apps):"
      if (!n) print "  (none on this TV)"
      for (i = 1; i <= n; i++) { print "  " groups[i] ":"; printf "%s", opt[groups[i]] }
    }' "$LIST"
  hidden_count=$(awk -v d="$disabled" '($1 == "bloat" || $1 == "optional") && index(d, " " $3 " ")' "$LIST" | wc -l | tr -d ' ')
  echo
  echo "Already hidden: $hidden_count. Apps marked keep or never are not shown and are never touched."
  exit 0
fi

# Named groups and apps must be in the list, and named apps must not be protected.
for n in "${names[@]}"; do
  if [[ "$n" == *.* ]] && protected "$n"; then echo "$n is marked keep or never for this TV, so it is not hidden."; exit 1; fi
  awk -v s="$n" '($1 == "bloat" || $1 == "optional") && ($2 == s || $3 == s) { found = 1 } END { exit !found }' "$LIST" \
    || { echo "'$n' is not a group or app that can be hidden on this TV. See debloat/debloat.sh --list"; exit 1; }
done
for g in $include; do
  [ "$g" = all ] || awk -v s="$g" '$1 == "optional" && $2 == s { found = 1 } END { exit !found }' "$LIST" \
    || echo "Note: no optional group '$g' on this TV's list."
done

recorded() { [ -f "$BEFORE" ] && awk -v p="$1" '$1 == p { f = 1 } END { exit !f }' "$BEFORE"; }

# chosen <verdict> <group> <package>
chosen() {
  local n g
  if [ $again = 1 ]; then recorded "$3"; return; fi
  for n in $except; do [ "$n" = "$3" ] && return 1; done
  if [ ${#names[@]} -gt 0 ]; then
    for n in "${names[@]}"; do [ "$n" = "$2" ] || [ "$n" = "$3" ] && return 0; done
    return 1
  fi
  [ "$1" = bloat ] && return 0
  for g in $include; do [ "$g" = all ] || [ "$g" = "$2" ] && return 0; done
  return 1
}

stamp=$(date +%Y%m%d-%H%M%S)
[ $dry_run = 1 ] || tv pm list packages -d | sed 's/^package://' | sort > "$DIR/disabled-before-$stamp.txt"

echo "Hiding on $TV${names[*]:+: ${names[*]}}${include:+ (also:$include)}${except:+ (except:$except)}"
hidden=0 skipped=0 failed=0
while read -r verdict group pkg desc; do
  [ "$verdict" = bloat ] || [ "$verdict" = optional ] || continue
  chosen "$verdict" "$group" "$pkg" || continue
  is_installed "$pkg" || continue
  if protected "$pkg"; then echo "  =  $pkg is protected for this TV, skipped"; skipped=$((skipped + 1)); continue; fi
  if is_hidden "$pkg"; then echo "  =  $pkg already hidden"; skipped=$((skipped + 1)); continue; fi
  before=$(user_state "$pkg")
  # Disabled until used (4): the system wakes it when needed; hiding it would change that.
  if [ "$before" = 4 ]; then echo "  =  $pkg is disabled until used, left as it is"; skipped=$((skipped + 1)); continue; fi
  if [ $dry_run = 1 ]; then echo "  ?  would hide $pkg ($desc)"; continue; fi
  # The first time only, keep the app's own enabled state so the restore puts back exactly that.
  recorded "$pkg" || echo "$pkg $before" >> "$BEFORE"
  result=$(tv pm disable-user --user 0 "$pkg" 2>&1) || true
  if [[ "$result" == *disabled-user* ]]; then
    echo "  ok $pkg ($desc)"; hidden=$((hidden + 1))
  else
    echo "  !! $pkg: $(printf '%s' "$result" | tr -cd '[:print:]')"; failed=$((failed + 1))
  fi
done < "$LIST"

if [ $dry_run = 1 ]; then echo "Dry run: nothing changed."; exit 0; fi
echo "Done: $hidden hidden, $skipped skipped, $failed failed."
write_restore
echo "Test the remote, inputs, picture and Wi-Fi now. Wait about 15 seconds before restarting the TV."
[ $failed = 0 ]
