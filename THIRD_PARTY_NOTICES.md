# Third-party notices

FoyerLauncher is licensed under the GNU General Public License, version 2 or later ([LICENSE](LICENSE)). Parts of it come from other projects and keep their own terms, listed below. Keep these notices and the adjacent licence texts when sharing source or a build.

## CleanFrame

FoyerLauncher is derived from [CleanFrame](https://github.com/nthnclrk/CleanFrame) 0.6.1, a home screen for Samsung Tizen TVs. Its code, documentation and original outline icons were released under the MIT License:

```
MIT License

Copyright (c) 2026 Nathan Clark

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Debloat research

`debloat/research/` cites a public source for every package it lists. `debloat/research/cleanyourtv-sony/` holds 34 tested Sony lists from [CleanYourTV](https://github.com/Gathin23/cleanyourtv) at commit `204143007f0b`, under the MIT License; its licence text is in that folder. Package names identify their owners' software; this project claims no affiliation with any TV maker.

## Fonts

| Material | Terms and source record |
| --- | --- |
| Manrope | SIL Open Font License 1.1; `app/assets/manrope-OFL.txt` |
| Geist, Newsreader and Roboto | SIL Open Font License 1.1; licences beside the files in `app/assets/fonts/`, with exact sources and hashes in `app/assets/fonts/SOURCES.json` |
| Optional PP Neue Montreal, PP Mori and PP Pangram Sans | Proprietary. Binaries stay in ignored `.local/` storage and are excluded from Git and public exports. The optional local overlay requires the user's own permission to use and embed those files. |

The public app uses Manrope, Geist, Roboto and Newsreader. A personal Tizen widget containing proprietary fonts must stay private. See [Pangram's licensing information](https://pangrampangram.com/pages/eula).

## Icons and trademarks

| Material | Provenance and terms |
| --- | --- |
| Simple Icons service marks | CC0; exact revisions and adaptations in `app/assets/icons/SOURCES.json` and `ADDITIONAL-SOURCES.json`. The CC0 text is retained beside the icons. |
| Disney+, ABC and SBS marks | [Custom Brand Icons](https://github.com/elax46/custom-brand-icons), MIT. The retained licence is `app/assets/icons/CUSTOM-BRAND-ICONS-LICENSE.txt`. Exact revisions, source files and extraction/recolour notes are in `SOURCES.json`. |
| Art, apps, settings and home outlines | Original CleanFrame drawings, MIT (above). |
| Live TV outline | Original FoyerLauncher drawing, GPL-2.0-or-later. |
| Weather glyphs | [Lucide](https://lucide.dev) 0.460.0, ISC; `app/assets/icons/LUCIDE-LICENSE.txt`. |
| Your own TV's marks | `scripts/marks-from-tv.mjs` can make marks from the apps installed on your own TV, into the ignored `app/assets/icons/local/`. They are for that TV only: not part of this repository, not covered by its licence, and not to be redistributed. |

Brand marks identify services. Their owners retain trademark rights; this project claims no endorsement or affiliation. The older Australian TV icon archive's GPL text is retained for historical provenance only; no current icon uses that archive.

## Photographs and derived materials

The fifteen bundled photographs were individually checked on 20 October 2026. Each page displayed its credited author and free use under the [Unsplash License](https://unsplash.com/license). The [asset source register](docs/asset-sources.md) links every page. Runtime paths are in `app/assets/wallpapers/SOURCES.json`.

Photographers retain their rights. Wallpapers, thumbnails, panel backgrounds and material fields derive from the credited photographs and retain their terms. The Unsplash licence permits copying, modification and distribution subject to its restrictions, including on selling unmodified images and building a competing image service.

Google ambient photos (Android TV only, off unless chosen) are not part of this repository or any build. The TV streams them at runtime from Google's Chromecast backdrop feed, keeping only three in its cache (the photo on screen, the one before it and the next), and credits each photographer; their photographers retain all rights.

## Development dependencies and exports

Development dependencies retain the licences in their npm packages. They are not copied into the TV JavaScript runtime.

`npm run export:public` excludes private fonts and your own TV's marks, and includes this notice and the root licence. Preserve the included font and icon licence texts. Review [public release preparation](docs/public-release.md) before publishing a repository or download.
