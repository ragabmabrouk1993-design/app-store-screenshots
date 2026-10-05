"""Writes the horizontal logos: the ribbon symbol with the wordmark to its right, at 22 px and 200 px tall.

    pip install fonttools
    python3 splash/horizontal.py path/to/Manrope-Bold.ttf

brand/tragram-horizontal-{22,200}.svg       "Tragram"
brand/tragram-horizontal-caps-{22,200}.svg  "TRAGRAM", slightly tracked out

The symbol sets the height. Type sizes are given as they are at 22 px tall and scale with the height; the
capitals are centred on the symbol, raised where needed to keep the g inside the height. The wordmark is Manrope Bold (the app's Aeonik isn't in this repo),
outlined, so the SVGs need no font. Symbol paths and gradients come from splash.html.
"""
import os, re, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from lottie_kit import html, HERE, parse_path, cubic

OUT = os.path.join(HERE, "..", "brand")
INK = "#F4F7FB"   # the wordmark colour used in the splash
GAP = 0.12        # space after the symbol's top bar, as a share of the height
VARIANTS = [      # (file suffix, text, font size in px at 22 px tall, tracking in em)
    ("", "Tragram", 18, -0.01),
    ("-caps", "TRAGRAM", 16.5, 0.06),
]

font = TTFont(sys.argv[1])
glyphs, cmap, upm = font.getGlyphSet(), font.getBestCmap(), font["head"].unitsPerEm
CAP = font["OS/2"].sCapHeight / upm

shape = lambda id_: re.search(rf'<path id="{id_}" d="([^"]*)"', html).group(1)
defs = re.search(r"(<linearGradient id=\"gFold\".*?</linearGradient>\s*<linearGradient id=\"gStem\".*?</linearGradient>\s*"
                 r"<linearGradient id=\"gTop\".*?</linearGradient>)", html, re.S).group(1)

def bbox(d):
    xs, ys = [], []
    for c in parse_path(d):
        pos = c["start"]
        for c1, c2, p in c["segs"]:
            for k in range(21):
                x, y = cubic(pos, c1, c2, p, k / 20); xs.append(x); ys.append(y)
            pos = p
    return min(xs), min(ys), max(xs), max(ys)

boxes = [bbox(shape(k)) for k in ("shFold", "shStem", "shTop")]
sx0, sy0, sx1, sy1 = min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes)
H = sy1 - sy0

def outline(text, size, track):
    """Text set at `size` logo units, baseline at y = 0, starting at x = 0. Returns path data and ink box."""
    s, x, d, ink = size / upm, 0.0, "", None
    for ch in text:
        g = glyphs[cmap[ord(ch)]]
        pen = SVGPathPen(glyphs); g.draw(TransformPen(pen, (s, 0, 0, -s, x, 0))); d += pen.getCommands()
        bp = BoundsPen(glyphs); g.draw(TransformPen(bp, (s, 0, 0, -s, x, 0)))
        if bp.bounds:
            b = bp.bounds
            ink = b if ink is None else (min(ink[0], b[0]), min(ink[1], b[1]), max(ink[2], b[2]), max(ink[3], b[3]))
        x += g.width * s + track * size
    return d, ink

r = lambda v: f"{v:.3f}".rstrip("0").rstrip(".")
num = lambda d: re.sub(r"-?\d+\.\d+", lambda m: r(float(m.group())), d)
os.makedirs(OUT, exist_ok=True)
for suffix, text, px22, track in VARIANTS:
    size = px22 / 22 * H                       # font size in logo units
    d, (ix0, iy0, ix1, iy1) = outline(text, size, track)
    cap = CAP * size
    tx = sx1 + GAP * H - ix0                    # first letter's ink starts one gap after the top bar
    ty = sy0 + (H - cap) / 2 + cap              # baseline that centres the capitals on the symbol,
    ty = min(ty, sy1 - iy1)                     # raised just enough to keep any descender inside the height
    assert ty - cap >= sy0 - 0.5, f"{text}: too large to fit beside the symbol"
    W = tx + ix1 - sx0
    body = (f'  <defs>\n    {defs}\n  </defs>\n'
            f'  <path d="{shape("shFold")}" fill="url(#gFold)"/>\n'
            f'  <path d="{shape("shStem")}" fill="url(#gStem)"/>\n'
            f'  <path d="{shape("shTop")}" fill="url(#gTop)"/>\n'
            f'  <path fill="{INK}" transform="translate({r(tx)} {r(ty)})" d="{num(d)}"/>\n')
    for px in (22, 200):
        name = f"tragram-horizontal{suffix}-{px}.svg"
        open(os.path.join(OUT, name), "w").write(
            f'<svg width="{r(W * px / H)}" height="{px}" viewBox="{r(sx0)} {r(sy0)} {r(W)} {r(H)}" fill="none" '
            f'xmlns="http://www.w3.org/2000/svg">\n{body}</svg>\n')
        print(f"brand/{name}: {r(W * px / H)} x {px} px, type {r(px22 * px / 22)} px, capitals {r(CAP * px22 * px / 22)} px")
