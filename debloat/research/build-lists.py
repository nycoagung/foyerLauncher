"""Build brands/*.txt, the per-brand lists debloat.sh and restore.sh use, from the research in this folder.

    python3 debloat/research/build-lists.py

Sources:
  - debloat/research/*.md: per-brand package tables (verdict bloat / your call / keep / never) and "never disable"
    sections, each package with its sources.
  - debloat/research/cleanyourtv-sony/*.txt: CleanYourTV's 34 tested Sony lists (MIT), for other Sony models.
  - debloat/research/sony-tested.txt and sony-never.txt: a list tested on one Sony Google TV, and the
    packages a full review of that TV found must stay.

Rules, most cautious first:
  - A package marked never or keep in the research stays never or keep. debloat.sh refuses to touch them.
  - A Sony package in sony-never.txt stays never, unless CleanYourTV hides it on 5 or more Sony models
    without trouble; then it is optional at most, never hidden by default.
  - A "bloat" verdict backed by one source or one project only becomes optional: hidden only on request.
  - Wildcards (com.mediatek.*) are kept as never-patterns only.
Review the output before use: the lists are only as good as the research.
"""
from collections import Counter, defaultdict
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
RESEARCH = ROOT / 'research'
OUT = ROOT / 'brands'
# Lists name their sources relative to the repository.
SRC = 'debloat/research/'
DATE = '2026-10-25'
RANK = {'bloat': 1, 'optional': 2, 'keep': 3, 'never': 4}
PKG = re.compile(r'^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+(?:\.\*|\*)?$')
GROUPS = {'streaming', 'ads', 'telemetry', 'store', 'demo', 'voice', 'updater', 'feature', 'other'}

# Which research section feeds which list. None stops collecting.
SECTIONS = {
    'tcl-hisense-xiaomi.md': [('### Applies to every brand below', 'common'), ('## 1. TCL', 'tcl'), ('## 2. Hisense', 'hisense'),
                              ('## 3. Xiaomi', 'xiaomi'), ('## What I could not find', None)],
    'philips-sharp-panasonic-toshiba-shield.md': [('## How to read this', None), ('## 1. Philips', 'philips'), ('## 2. Sharp', 'sharp'),
                                                  ('## 3. Panasonic', 'panasonic'), ('## 4. Toshiba', 'toshiba'),
                                                  ('### China Hisense-firmware Toshiba', None), ('### Never disable (Toshiba', 'toshiba'),
                                                  ('## 5. Nvidia Shield', 'nvidia'), ('## Every URL used', None)],
    'google-chromecast-onn-fire-tv.md': [('## 1. Google packages', 'common'), ('## 2. Chromecast', 'google'), ('## 3. Walmart onn', 'onn'),
                                         ('## 4. Amazon Fire TV', 'amazon'), ('## 5. Samsung', None)],
}
TITLES = {
    'common': 'Every Android TV and Google TV, whatever the brand: Google and AOSP packages',
    'tcl': 'TCL Android TV and Google TV', 'hisense': 'Hisense Android TV and Google TV (not VIDAA OS)',
    'xiaomi': 'Xiaomi, Redmi, Mi TV, Mi Box and TV Stick', 'philips': 'Philips (TP Vision and other licensees)',
    'sharp': 'Sharp AQUOS Android TV and Google TV', 'panasonic': 'Panasonic Android TV and Google TV',
    'toshiba': 'Toshiba Android TV (Vestel-built)', 'nvidia': 'Nvidia Shield TV',
    'google': 'Chromecast with Google TV and Google TV Streamer', 'onn': 'Walmart onn. Google TV',
    'amazon': 'Amazon Fire TV and Fire TV Edition (Fire OS)', 'sony': 'Sony BRAVIA Android TV and Google TV',
}
FROM = {'common': SRC + 'tcl-hisense-xiaomi.md and ' + SRC + 'google-chromecast-onn-fire-tv.md',
        'tcl': SRC + 'tcl-hisense-xiaomi.md', 'hisense': SRC + 'tcl-hisense-xiaomi.md', 'xiaomi': SRC + 'tcl-hisense-xiaomi.md',
        'philips': SRC + 'philips-sharp-panasonic-toshiba-shield.md', 'sharp': SRC + 'philips-sharp-panasonic-toshiba-shield.md',
        'panasonic': SRC + 'philips-sharp-panasonic-toshiba-shield.md', 'toshiba': SRC + 'philips-sharp-panasonic-toshiba-shield.md',
        'nvidia': SRC + 'philips-sharp-panasonic-toshiba-shield.md', 'google': SRC + 'google-chromecast-onn-fire-tv.md',
        'onn': SRC + 'google-chromecast-onn-fire-tv.md', 'amazon': SRC + 'google-chromecast-onn-fire-tv.md',
        'sony': SRC + 'sony-tested.txt and sony-never.txt (tested on one Sony Google TV) and ' + SRC + 'cleanyourtv-sony/ (34 Sony models)'}

lists = defaultdict(dict)  # brand -> package -> {verdict, group, desc}


def plain(text):
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    text = re.sub(r'[`*_]', '', text)
    return re.sub(r'\s+', ' ', text).strip()


def add(brand, pkg, verdict, group='other', desc=''):
    old = lists[brand].get(pkg)
    if old and RANK[old['verdict']] >= RANK[verdict]:
        if not old['desc'] and desc:
            old['desc'] = desc
        return
    lists[brand][pkg] = {'verdict': verdict, 'group': group if re.match(r'^[a-z]+$', group or '') else 'other', 'desc': desc or (old or {}).get('desc', '')}


def packages_in(text):
    return [t for t in re.findall(r'`([^`]+)`', text) if PKG.match(t)]


def research(name):
    starts, brand, mode = SECTIONS[name], None, 'table'
    for line in (RESEARCH / name).read_text(encoding='utf-8').splitlines():
        for prefix, target in starts:
            if line.startswith(prefix):
                brand, mode = target, 'table'
        if line.startswith('#'):
            low = line.lower()
            # "Never disable" sections are guards; problem reports and notes are prose, not verdicts.
            mode = 'never' if 'never' in low else 'skip' if any(w in low for w in ('problem', 'difference', 'replacing', 'caveat')) else 'table'
            continue
        if not brand or mode == 'skip':
            continue
        if mode == 'never':
            for pkg in packages_in(line):
                add(brand, pkg, 'never', desc=plain(line.split('|')[2]) if line.startswith('|') and line.count('|') > 3 else '')
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')] if line.startswith('|') else []
        if len(cells) < 5 or cells[0] in ('Package', '---'):
            continue
        bold = re.search(r'\*\*([^*]+)\*\*', cells[3])
        word = (bold.group(1) if bold else cells[3]).lower()
        verdict = 'never' if 'never' in word else 'keep' if 'keep' in word else 'optional' if 'your call' in word else 'bloat' if 'bloat' in word else None
        if not verdict:
            continue
        note = ''
        if verdict == 'bloat' and re.search(r'\b1 (source|project)', cells[3] + ' ' + cells[4]):
            verdict, note = 'optional', ' [one source]'
        for pkg in packages_in(cells[0]):
            if pkg.endswith('*'):
                if verdict in ('never', 'keep'):
                    add(brand, pkg, verdict, cells[2].lower(), plain(cells[1]))
                continue
            add(brand, pkg, verdict, cells[2].lower(), plain(cells[1])[:110] + note)


def sony():
    # The tested Sony list: ads, demo and telemetry are bloat, the rest optional features.
    ours = {}
    for line in (RESEARCH / 'sony-tested.txt').read_text(encoding='utf-8').splitlines():
        if line.strip() and not line.startswith('#'):
            group, pkg, desc = re.split(r'\s+', line.strip(), maxsplit=2)
            ours[pkg] = (group, desc)
    counts, comments = Counter(), defaultdict(Counter)
    files = sorted((RESEARCH / 'cleanyourtv-sony').glob('*.txt'))
    files = [f for f in files if f.name not in ('LICENSE', 'SOURCE.txt')]
    for f in files:
        seen = set()
        for line in f.read_text(encoding='utf-8').splitlines():
            m = re.match(r'^([a-z][\w]*(?:\.[\w]+)+)\s*(?:#\s*(.*))?$', line.strip())
            if m and m.group(1) not in seen:
                seen.add(m.group(1)); counts[m.group(1)] += 1
                if m.group(2):
                    comments[m.group(1)][m.group(2).strip()] += 1
    total = len(files)
    for pkg, (group, desc) in ours.items():
        if group == 'userapps':  # one owner's own apps, not Sony's
            continue
        add('sony', pkg, 'bloat' if group in ('ads', 'demo', 'telemetry') else 'optional', group, desc + (' [CleanYourTV %d/%d]' % (counts[pkg], total) if counts[pkg] else ''))
    our_never = set(l.strip() for l in (RESEARCH / 'sony-never.txt').read_text(encoding='utf-8').splitlines() if l.strip() and not l.startswith('#'))
    for pkg, n in counts.items():
        if pkg in ours or n < 5:
            continue
        # The tested Sony's never-list is evidence too: such a package is never hidden by default.
        verdict = 'bloat' if n >= 15 and pkg not in our_never else 'optional'
        group = ('b2b' if '.b2b.' in pkg else 'voice' if any(w in pkg for w in ('assistant', 'katniss', 'pumpkin'))
                 else 'feature' if any(w in pkg for w in ('dlna', 'airplay', 'homekit', 'seeds', 'sensingcamera', 'gesture', 'distancealert', 'livingfit', 'smartmedia', 'osat', 'wifidirect', 'dreamx', 'backdrop', 'mediashell'))
                 else 'demo' if any(w in pkg for w in ('demo', 'help', 'customersupport', 'imanual', 'tutorial'))
                 else 'telemetry' if any(w in pkg for w in ('bugreport', 'usercontext', 'lastaccess', 'idd', 'feedback')) else 'updater' if 'autoinstalls' in pkg
                 else 'ads' if any(w in pkg for w in ('promo', 'select', 'discovery', 'sonytab')) else 'other')
        desc = comments[pkg].most_common(1)[0][0] if comments[pkg] else ''
        note = ' [CleanYourTV %d/%d%s]' % (n, total, '; a system service on the tested Sony, so only when chosen' if pkg in our_never else '')
        add('sony', pkg, verdict, group if group != 'b2b' else 'feature', (desc[:90] or 'Disabled on other Sony models') + note)
    for pkg in our_never:
        if counts[pkg] < 5:
            add('sony', pkg, 'never', desc='Sony system: see research/sony-never.txt')


for name in SECTIONS:
    research(name)
sony()

# Corrections after review.
# Live Channels is the only tuner app on some sets, so it is never hidden by default.
for brand in lists:
    if 'com.google.android.tv' in lists[brand]:
        add(brand, 'com.google.android.tv', 'keep')
# A brand list leaves out what the common list (loaded for every brand) already covers as strictly.
for brand, entries in lists.items():
    if brand != 'common':
        for pkg in [p for p, e in entries.items() if p in lists['common'] and RANK[lists['common'][p]['verdict']] >= RANK[e['verdict']]]:
            del entries[pkg]
# Shorthand like `factory.view` for com.tcl.factory.view is not a package of its own.
for brand, entries in lists.items():
    for pkg in [p for p in entries if any(o != p and o.endswith('.' + p) for o in entries)]:
        del entries[pkg]

OUT.mkdir(exist_ok=True)
for brand, entries in sorted(lists.items()):
    order = sorted(entries.items(), key=lambda kv: (RANK[kv[1]['verdict']], kv[1]['group'], kv[0]))
    lines = ['# %s' % TITLES[brand],
             '# Generated by debloat/research/build-lists.py on %s from %s. Edit freely; rerunning overwrites.' % (DATE, FROM[brand]),
             '#',
             '#   bloat     hidden by ./debloat.sh by default',
             '#   optional  hidden only with --include <group> (or --include all)',
             '#   keep      left alone; debloat.sh refuses it',
             '#   never     breaks the TV; debloat.sh refuses it (a trailing * matches every package starting with it)',
             '#',
             '# verdict  group      package                                            description']
    for pkg, e in order:
        lines.append('%-9s %-10s %-50s %s' % (e['verdict'], e['group'], pkg, e['desc']))
    (OUT / (brand + '.txt')).write_text('\n'.join(lines) + '\n', encoding='utf-8')
    c = Counter(e['verdict'] for e in entries.values())
    print('%-10s %3d bloat %3d optional %3d keep %3d never' % (brand, c['bloat'], c['optional'], c['keep'], c['never']))
