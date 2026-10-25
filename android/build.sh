#!/bin/sh
# Builds out/foyerlauncher.apk: the Android shell plus FoyerLauncher's public-font UI from ../app.
# DEBUG=1 ./build.sh makes a debuggable build whose page can be inspected from chrome://inspect.
# Needs the Android SDK (platform 34, build-tools 35.0.0) and a JDK 17+. Android Studio's bundled
# JDK and SDK are found automatically. No Gradle.
#
# The signing key is made on the first build in .local/ and must be kept: updates have to be signed
# with the same key, or the TV refuses them until the old app is uninstalled.
set -e
cd "$(dirname "$0")"

SDK=${ANDROID_HOME:-$HOME/Library/Android/sdk}
[ -n "$JAVA_HOME" ] || JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
JAR=$SDK/platforms/android-${PLATFORM:-34}/android.jar
BT=$SDK/build-tools/${BUILD_TOOLS:-35.0.0}
[ -f "$JAR" ] && [ -x "$BT/aapt2" ] || { echo "Android SDK not found. Set ANDROID_HOME (platform 34, build-tools 35.0.0)." >&2; exit 1; }
command -v javac >/dev/null || { echo "No JDK found. Set JAVA_HOME." >&2; exit 1; }

rm -rf out; mkdir -p out/classes out/dex out/assets/app

# The UI is the public export, so fonts and notices match the published Tizen packaging.
(cd .. && python3 scripts/export-public.py >/dev/null)
unzip -q ../dist/FoyerLauncher-public-unsigned.wgt -d out/assets/app
# Marks made from your own TV's apps (scripts/marks-from-tv.mjs) never go into the public export; your
# own build adds them, loaded straight after the published icon metrics.
if [ -f ../app/assets/icons/local/marks.js ]; then
  mkdir -p out/assets/app/assets/icons/local
  cp ../app/assets/icons/local/*.svg ../app/assets/icons/local/marks.js out/assets/app/assets/icons/local/
  perl -pi -e 's{(<script src="assets/icons/metrics.js"></script>)}{$1<script src="assets/icons/local/marks.js"></script>}' out/assets/app/index.html
  grep -q 'assets/icons/local/marks.js' out/assets/app/index.html || { echo "Couldn't add your own marks: index.html no longer loads assets/icons/metrics.js as expected." >&2; exit 1; }
  echo "Added $(ls ../app/assets/icons/local/*.svg | wc -l | tr -d ' ') of your own app marks."
fi
for f in index.html main.js device.js device-android.js style.css; do
  [ -f "out/assets/app/$f" ] || { echo "UI export is missing $f" >&2; exit 1; }
done

"$BT/aapt2" compile --dir res -o out/res.zip
# Photos and fonts are already compressed; storing them lets the TV read them directly.
"$BT/aapt2" link -o out/base.apk -I "$JAR" --manifest AndroidManifest.xml -A out/assets \
  -0 jpg -0 png -0 woff2 -0 ttf ${DEBUG:+--debug-mode} out/res.zip
# shellcheck disable=SC2046 # javac and d8 take one argument per file
javac -nowarn -Xlint:-options -encoding UTF-8 -source 8 -target 8 -bootclasspath "$JAR:$BT/core-lambda-stubs.jar" \
  -d out/classes $(find src -name '*.java')
# shellcheck disable=SC2046
"$BT/d8" --release --min-api 26 --lib "$JAR" --output out/dex $(find out/classes -name '*.class')
cp out/base.apk out/unsigned.apk
(cd out/dex && zip -q ../unsigned.apk classes.dex)
"$BT/zipalign" -f -p 4 out/unsigned.apk out/aligned.apk

mkdir -p .local; chmod 700 .local
KS=.local/release.jks; PASS_FILE=.local/keystore-password
if [ ! -f "$KS" ]; then
  (umask 077; LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 32 > "$PASS_FILE")
  keytool -genkeypair -keystore "$KS" -storepass:file "$PASS_FILE" -keypass:file "$PASS_FILE" -alias foyerlauncher \
    -keyalg RSA -keysize 3072 -validity 10000 -dname "CN=FoyerLauncher" >/dev/null 2>&1
  echo "Made a new signing key in .local/. Keep it for future updates."
fi
"$BT/apksigner" sign --ks "$KS" --ks-pass "file:$PASS_FILE" --out out/foyerlauncher.apk out/aligned.apk
"$BT/apksigner" verify out/foyerlauncher.apk
echo "Built out/foyerlauncher.apk ($(du -h out/foyerlauncher.apk | cut -f1))"
