# Security

## Reporting a vulnerability

Please report security problems privately through GitHub: on the repository's **Security** tab, choose **Report a vulnerability**. Don't open a public issue for them. Include what you found, how to reproduce it, and which version or commit you used. You'll get a reply within a week.

## What's in scope

- The Android TV app (`android/`) and the shared interface (`app/`): its WebView, the bridge between them, the Home-button accessibility service, and the weather and Google ambient photo downloads.
- The setup scripts that run on the owner's computer (`debloat/`, `android/*.sh`, `scripts/`), including the restore script they write for each TV.
- Anything that could publish a TV owner's details, such as the `my-tvs/` records.

## How the project protects people

- The interface page is served from inside the app and never loads anything from the internet; a Content Security Policy enforces that. Only the Android shell goes online, over HTTPS, for the weather and, if chosen, Google's ambient photos.
- The accessibility service acts only on the Home key and the TV's home screen opening, reads no screen content and records nothing.
- Nothing on the TV is uninstalled; every change the setup makes is recorded so it can be undone exactly.
- Values a TV reports over adb are treated as untrusted text: they are reduced to printable characters before they are recorded or written into a restore script, and only well-formed component names are sent back to the TV's shell.
- Each TV's records stay on the computer that set it up, in `my-tvs/`, which Git ignores and `npm run check:public` refuses.

## Supported versions

Fixes go into the latest release.
