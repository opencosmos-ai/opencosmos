#!/usr/bin/env python3
"""rare-han-font.py — the Library's rare-character typeface, cut to the export.

    pnpm content                                     # first, so the export is current
    pip install fonttools brotli                     # once; this tool only
    python3 scripts/rare-han-font.py --source <dir holding HanaMinA.ttf and HanaMinB.ttf>

The Library sets Chinese in the reader's own Song face (globals.css,
--font-han), and the notes in the site's body face. Neither covers the rare
characters: CJK Extension A, Extension B and beyond, and the Radicals
Supplement. Those are exactly the graphs the translator's notes argue from,
說文's older forms and the parts inside its analyses (𩠐 (shǒu — an old form of
首, head), 𤔔 (luàn — tangled silk)), and without a font a reader sees an empty
box where the explanation should be.

HanaMin (花園明朝, GlyphWiki Project) covers every block, under the Hanazono
Font License (public/fonts/LICENSE-hanazono.txt). Source:
https://glyphwiki.org/hanazono/ — hanazono-20170904.zip. The Character Atlas
uses the same face, cut the same way (opencosmos-ai/chinese-atlas,
atlas/fonts.py), so a rare character looks the same on both sites.

This writes public/fonts/rare-han-a.woff2 (below U+20000) and rare-han-b.woff2
(from U+20000), a few kilobytes each, and public/fonts/rare-han.txt, the list
they cover. globals.css loads each only where its unicode-range is used, so a
page with no rare character downloads nothing. `pnpm check:tao-te-ching` warns
when the export brings in a rare character the list lacks; run this again.
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXPORT = ROOT / ".content" / "taoteching" / "data" / "atlas-export.json"
OUT = ROOT / "public" / "fonts"


def is_rare(ch):
    """The blocks the common CJK fonts do not reliably carry. Keep in step with
    the unicode-range in app/globals.css and RARE in scripts/tao-te-ching-check.ts."""
    o = ord(ch)
    return 0x2E80 <= o <= 0x2FDF or 0x3400 <= o <= 0x4DBF or o >= 0x20000


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--source", required=True, help="directory with HanaMinA.ttf and HanaMinB.ttf")
    ap.add_argument("--export", default=str(EXPORT))
    args = ap.parse_args(argv)
    try:
        from fontTools import subset
        from fontTools.ttLib import TTFont
    except ImportError:
        sys.exit("  needs fonttools and brotli: pip install fonttools brotli")

    export = Path(args.export)
    if not export.exists():
        sys.exit(f"  no export at {export} — run: pnpm content")
    # Every rare character anywhere in the export: the notes, the parts the
    # character sheet shows, the glossary text. A few spare glyphs cost bytes;
    # a missing one costs a reader the explanation.
    want = sorted({c for c in json.dumps(json.loads(export.read_text(encoding="utf-8")),
                                         ensure_ascii=False) if is_rare(c)})
    OUT.mkdir(parents=True, exist_ok=True)
    covered = []
    for name, pick, ttf in (("rare-han-a", lambda c: ord(c) < 0x20000, "HanaMinA.ttf"),
                            ("rare-han-b", lambda c: ord(c) >= 0x20000, "HanaMinB.ttf")):
        src = Path(args.source) / ttf
        cmap = TTFont(src, lazy=True).getBestCmap()
        chars = [c for c in want if pick(c) and ord(c) in cmap]
        covered += chars
        opts = subset.Options()
        opts.flavor = "woff2"
        opts.layout_features = []
        opts.name_IDs = ["*"]
        opts.notdef_outline = False
        font = subset.load_font(str(src), opts)
        s = subset.Subsetter(opts)
        s.populate(unicodes=[ord(c) for c in chars])
        s.subset(font)
        dest = OUT / f"{name}.woff2"
        subset.save_font(font, str(dest), opts)
        print(f"  {name}.woff2  {len(chars):>3} glyphs  {dest.stat().st_size / 1024:.1f} KB")
    (OUT / "rare-han.txt").write_text("".join(sorted(covered)) + "\n", encoding="utf-8")
    missing = sorted(set(want) - set(covered))
    print(f"  covered {len(covered)} of {len(want)}  → public/fonts")
    if missing:
        print(f"  not in HanaMin: {''.join(missing)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
