# Shared by debloat/debloat.sh, debloat/restore.sh, android/install.sh and android/restore.sh. Not run on its own.
# shellcheck shell=bash

DEBLOAT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO=$(cd "$DEBLOAT/.." && pwd)
RANKS="bloat:1 optional:2 keep:3 never:4"

usage_tv() {
  echo "Set TV_IP to your TV's IP address (on the TV: Settings > Network & Internet):  TV_IP=<TV_IP> $0"
  echo "With Wireless debugging, add the port it shows: TV_IP=<TV_IP>:<port>. Or give any adb serial with TV_SERIAL."
}

# TV: the adb serial, from TV_SERIAL, or TV_IP with port 5555 unless one is given.
resolve_tv() {
  if [ -n "${TV_SERIAL:-}" ]; then TV=$TV_SERIAL
  elif [ -n "${TV_IP:-}" ]; then case "$TV_IP" in *:*) TV=$TV_IP ;; *) TV=$TV_IP:5555 ;; esac
  else usage_tv; exit 1; fi
}

tv() { adb -s "$TV" shell "$@" </dev/null | tr -d '\r'; }

connect() {
  command -v adb >/dev/null || { echo "adb not found. Install Android platform-tools (on macOS: brew install --cask android-platform-tools)."; exit 1; }
  case "$TV" in *.*:*) adb connect "$TV" >/dev/null 2>&1 || true ;; esac
  if [ "$(adb -s "$TV" get-state 2>/dev/null)" != device ]; then
    echo "Can't reach the TV at $TV. Check it is on, on the same network and has debugging turned on, then accept the prompt on screen."
    exit 1
  fi
}

# Enabled state for user 0: 0 default, 1 enabled, 2 disabled (by the maker), 3 disabled by a user.
user_state() {
  tv dumpsys package "$1" \
    | awk '/User 0:.* enabled=[0-9]/ && !done { match($0, / enabled=[0-9]/); print substr($0, RSTART + 9, 1); done = 1 }'
}

brand_name() { awk -v id="$1" '!/^#/ && $1 == id { $1 = ""; $2 = ""; sub(/^ +/, ""); print }' "$DEBLOAT/brands/brands.txt"; }

# detect_brand: sets BRAND (a brands/*.txt name, or "" when unknown) and BRAND_NAME, unless BRAND is set.
detect_brand() {
  local prop value id
  if [ -n "${BRAND:-}" ]; then
    [ "$BRAND" = common ] || [ -f "$DEBLOAT/brands/$BRAND.txt" ] || { echo "No list for brand '$BRAND'. Lists: $(cd "$DEBLOAT/brands" && ls ./*.txt | sed 's|^\./||; s|\.txt$||' | grep -v '^brands$' | tr '\n' ' ')"; exit 1; }
    BRAND_NAME=$(brand_name "$BRAND"); BRAND_NAME=${BRAND_NAME:-$BRAND}
    return
  fi
  BRAND="" BRAND_NAME=""
  for prop in ro.product.brand ro.product.manufacturer ro.product.model ro.product.device; do
    value=$(tv getprop "$prop")
    [ -n "$value" ] || continue
    id=$(awk -v v="$value" '!/^#/ && NF >= 2 { if (tolower(v) ~ tolower($2)) { print $1; exit } }' "$DEBLOAT/brands/brands.txt")
    if [ -n "$id" ]; then BRAND=$id; BRAND_NAME=$(brand_name "$id"); return; fi
  done
}

# build_list: writes LIST, one "verdict group package description" line per package, from common.txt and
# the brand's list. Where both name a package, the more cautious verdict wins (bloat < optional < keep < never).
build_list() {
  LIST=$(mktemp "${TMPDIR:-/tmp}/debloat.XXXXXX")
  local files=("$DEBLOAT/brands/common.txt")
  [ -n "$BRAND" ] && [ "$BRAND" != common ] && files+=("$DEBLOAT/brands/$BRAND.txt")
  awk -v ranks="$RANKS" '
    BEGIN { n = split(ranks, r, " "); for (i = 1; i <= n; i++) { split(r[i], kv, ":"); rank[kv[1]] = kv[2] } }
    /^#/ || NF < 3 || !($1 in rank) { next }
    {
      pkg = $3; line = $0
      if (!(pkg in best) || rank[$1] >= rank[verdict[pkg]]) { best[pkg] = line; verdict[pkg] = $1 }
      if (!(pkg in order)) { order[pkg] = ++count; names[count] = pkg }
    }
    END { for (i = 1; i <= count; i++) print best[names[i]] }
  ' "${files[@]}" > "$LIST"
  trap 'rm -f "$LIST"' EXIT
}

# protected <package>: true when the merged list says keep or never for it, or when it has no entry of its
# own and a never-pattern (com.x.*) covers it. A package's own entry is more specific than a pattern.
protected() {
  awk -v p="$1" '
    $3 == p { own = $1 }
    $1 == "never" && $3 ~ /\*$/ { prefix = $3; sub(/\.?\*$/, "", prefix); if (index(p, prefix ".") == 1 || p == prefix) pattern = 1 }
    END { exit !(own == "keep" || own == "never" || (own == "" && pattern)) }' "$LIST"
}

# tv_dir: sets DIR, this TV's folder in my-tvs/ (ignored by Git), keyed by model and serial number, and
# keeps its tv.txt up to date. It holds what the scripts record and the TV's own restore script.
tv_dir() {
  local manufacturer model serial key first
  manufacturer=$(tv getprop ro.product.manufacturer)
  model=$(tv getprop ro.product.model)
  serial=$(tv getprop ro.serialno)
  key="$(printf '%s' "${model:-tv}" | tr -c 'A-Za-z0-9._-' _ | sed 's/_*$//')${serial:+-$(printf '%s' "$serial" | tr -c 'A-Za-z0-9._-' _)}"
  DIR="$REPO/my-tvs/$key"
  mkdir -p "$DIR"; chmod 700 "$REPO/my-tvs" "$DIR" 2>/dev/null || true
  first=$(sed -n 's/^first_seen=//p' "$DIR/tv.txt" 2>/dev/null || true)
  {
    echo "name=$manufacturer $model"
    echo "brand=${BRAND:-$(sed -n 's/^brand=//p' "$DIR/tv.txt" 2>/dev/null || true)}"
    echo "android=$(tv getprop ro.build.version.release)"
    echo "serial=$serial"
    echo "address=$TV"
    echo "first_seen=${first:-$(date '+%Y-%m-%d %H:%M')}"
    echo "last_seen=$(date '+%Y-%m-%d %H:%M')"
  } > "$DIR/tv.txt.new"
  mv "$DIR/tv.txt.new" "$DIR/tv.txt"
}

# write_restore: (re)writes $DIR/restore-my-tv.sh from what the scripts recorded for this TV.
write_restore() { "$DEBLOAT/write-restore.sh" "$DIR"; }
