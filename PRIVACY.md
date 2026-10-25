# Privacy Policy

_Last updated: October 25, 2026 (v1.0.0)_

## 1. Information We Collect

FoyerLauncher collects nothing. It has no accounts, analytics, crash reporting, advertising or tracking, and the developer runs no server that receives data from it.

To show your home screen, the app reads some information on the TV itself and keeps it there:

- **Your apps:** the names and icons of installed apps, so Home and All apps can show and open them.
- **Your TV:** its inputs (such as HDMI 1) and which apps are its home screen and its Live TV app.
- **Your choices:** the apps on Home, their order, the layout, font, wallpaper and other settings.
- **Approximate location (Android TV, when weather is on):** a latitude, longitude and town name worked out from the TV's internet address or time zone (city-level, not exact), so the weather is for the right place.

None of this leaves the TV, except as described in §3 when you use the weather or Google ambient photos.

**On the computer that sets up the TV.** The setup scripts (run by you or your AI agent) keep a record for each TV in the project's `my-tvs/` folder on that computer: the TV's name, Android version, serial number and network address, which apps were hidden and their earlier state, and the TV's accessibility settings before FoyerLauncher's Home button. They use it to write your TV's restore script. It is not part of the project's published files and is not sent anywhere.

## 2. How We Use Your Information

App names and icons, inputs and the TV's home screen are used only to draw the screen and open what you choose. Your settings are used only to show Home the way you left it. The approximate location is used only to ask for the local weather.

## 3. Third-Party Services

The Samsung Tizen version never uses the network. The setup scripts talk only to your TV, over your home network. The Android TV app uses the internet only for these two features:

- **Weather** (on unless you turn it off in Settings → Weather):
  - [ipwho.is](https://ipwho.is): once a day, the app asks where the TV's internet address is. Like any web request, this shares the TV's IP address with ipwho.is. If this lookup is blocked, the app uses the city of the TV's time zone instead.
  - [Open-Meteo](https://open-meteo.com): the app asks for the current weather at that location, rounded to about a kilometre, at most every ten minutes. When the time-zone fallback is used, it also sends the city name to Open-Meteo's place search. Open-Meteo sees the TV's IP address. Refer to [Open-Meteo's terms](https://open-meteo.com/en/terms) for how they handle requests.
- **Google ambient photos** (off unless you choose Google ambient in Settings → Background → Photos): the app downloads Google's public list of ambient-mode photos from `clients3.google.com` at most once an hour, and each photo it shows from `ccp-lh.googleusercontent.com`. These are standard image requests with no account or identifier attached; Google sees the TV's IP address. Refer to [Google's Privacy Policy](https://policies.google.com/privacy).

Opening an app hands over to that app; what it collects is governed by its own privacy policy.

## 4. Data Storage & Security

Settings are stored in the app's private storage on the TV (WebView local storage on Android TV, web app storage on Tizen). On Android TV, the approximate location and the last weather reading are kept in the app's private preferences, and up to three prepared Google ambient photos in its cache. Other apps can't read this storage. Nothing is backed up to the cloud: the Android app opts out of Android backup.

The `my-tvs/` records stay on the computer that set up the TV, in a folder only your user account can open.

All network requests use HTTPS. The interface page itself is served from inside the app and never loads anything from the internet.

## 5. Permissions

**Android TV:**

- **Internet:** for the weather and Google ambient photos only (§3).
- **Accessibility service ("FoyerLauncher Home button"):** used for one thing, sending the remote's Home button to FoyerLauncher. Android passes the service each remote key press so it can pick out Home; every other key goes straight on to the TV unchanged. Apart from keys, it only hears that the TV's own home screen has opened. It cannot read what is on screen or what other apps show, and it records and sends nothing. You turn it on with `android/install.sh` or in the TV's accessibility settings, and off in the same place or with `android/restore.sh`.
- **App visibility:** Android lets FoyerLauncher see installed TV apps, phone-style apps, the TV's home screen and its Live TV app, so it can list and open them.

**Samsung Tizen:** launching apps, reading the list of installed apps, and receiving remote-control keys.

## 6. Data Deletion

Turn the weather off in Settings → Weather to stop all weather requests, and choose FoyerLauncher photos to stop Google ambient downloads.

Uninstalling FoyerLauncher removes everything it stored: settings, location, weather and cached photos. On Android TV, `android/restore.sh --uninstall` gives the Home button back and uninstalls the app in one step. You can also clear its data from the TV's Settings → Apps.

To undo the setup, run your TV's restore script (`my-tvs/<model>-<serial>/restore-my-tv.sh`). Afterwards you can delete that TV's folder in `my-tvs/` to remove its record from your computer, but keep it until you no longer need the restore script.

## 7. Contact

For questions about this privacy policy, please visit windows-hq.com or open an issue at [github.com/nycoagung/foyerLauncher](https://github.com/nycoagung/foyerLauncher/issues).
