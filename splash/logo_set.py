"""Writes a "Tragram" logo set in a given font: horizontal (22 px and 200 px tall) and vertical (200 px tall).

    pip install fonttools
    python3 splash/logo_set.py path/to/SF-Pro-Display-Bold.otf sf

brand/tragram-<tag>-horizontal-22.svg, -horizontal-200.svg  symbol, then the wordmark to its right; sized and
                                                           placed like brand/tragram-horizontal-*.svg
brand/tragram-<tag>-vertical-200.svg                       symbol on top, wordmark centred below

The wordmark is outlined from the font file, so the SVGs need no font. Symbol paths and gradients come from
splash.html.
"""
import os, re, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from lottie_kit import html, HERE, parse_path, cubic

OUT = os.path.join(HERE, "..", "brand")
TEXT, INK, TRACK = "Tragram", "#F4F7FB", -0.01
H_SIZE, H_GAP = 18, 0.12     # horizontal: font size in px at 22 px tall; gap after the top bar, share of the height
V_WIDTH, V_GAP = 0.82, 0.16  # vertical: wordmark width as a share of the symbol's; gap above the capitals, share of its height

font_path, tag = sys.argv[1], sys.argv[2]
font = TTFont(font_path)
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
SW, SH = sx1 - sx0, sy1 - sy0

def outline(size):
    """TEXT at `size` logo units, baseline at y = 0, starting at x = 0: path data and ink box."""
    s, x, d, ink = size / upm, 0.0, "", None
    for ch in TEXT:
        g = glyphs[cmap[ord(ch)]]
        pen = SVGPathPen(glyphs); g.draw(TransformPen(pen, (s, 0, 0, -s, x, 0))); d += pen.getCommands()
        bp = BoundsPen(glyphs); g.draw(TransformPen(bp, (s, 0, 0, -s, x, 0)))
        if bp.bounds:
            b = bp.bounds
            ink = b if ink is None else (min(ink[0], b[0]), min(ink[1], b[1]), max(ink[2], b[2]), max(ink[3], b[3]))
        x += g.width * s + TRACK * size
    return d, ink

r = lambda v: f"{v:.3f}".rstrip("0").rstrip(".")
num = lambda d: re.sub(r"-?\d+\.\d+", lambda m: r(float(m.group())), d)
symbol = (f'  <defs>\n    {defs}\n  </defs>\n'
          f'  <path d="{shape("shFold")}" fill="url(#gFold)"/>\n'
          f'  <path d="{shape("shStem")}" fill="url(#gStem)"/>\n'
          f'  <path d="{shape("shTop")}" fill="url(#gTop)"/>\n')

def write(name, vb, px_h, body):
    x0, y0, w, h = vb
    open(os.path.join(OUT, name), "w").write(
        f'<svg width="{r(w * px_h / h)}" height="{px_h}" viewBox="{r(x0)} {r(y0)} {r(w)} {r(h)}" fill="none" '
        f'xmlns="http://www.w3.org/2000/svg">\n{body}</svg>\n')
    print(f"brand/{name}: {r(w * px_h / h)} x {px_h} px")

os.makedirs(OUT, exist_ok=True)
font_name = font["name"].getDebugName(4)

# Horizontal: capitals centred on the symbol, raised where needed to keep the g inside the height.
size = H_SIZE / 22 * SH
d, (ix0, iy0, ix1, iy1) = outline(size)
cap = CAP * size
tx = sx1 + H_GAP * SH - ix0
ty = min(sy0 + (SH - cap) / 2 + cap, sy1 - iy1)
assert ty - cap >= sy0 - 0.5, "wordmark too large to fit beside the symbol"
body = symbol + f'  <path fill="{INK}" transform="translate({r(tx)} {r(ty)})" d="{num(d)}"/>\n'
for px in (22, 200):
    write(f"tragram-{tag}-horizontal-{px}.svg", (sx0, sy0, tx + ix1 - sx0, SH), px, body)

# Vertical: wordmark V_WIDTH of the symbol's width, centred under it.
d, (ix0, iy0, ix1, iy1) = outline(upm)                 # measure at 1 unit per font unit, then scale
size = V_WIDTH * SW / (ix1 - ix0) * upm
d, (ix0, iy0, ix1, iy1) = outline(size)
cap = CAP * size
tx = sx0 + (SW - (ix1 - ix0)) / 2 - ix0
ty = sy1 + V_GAP * SH + cap
bottom = ty + iy1
body = symbol + f'  <path fill="{INK}" transform="translate({r(tx)} {r(ty)})" d="{num(d)}"/>\n'
write(f"tragram-{tag}-vertical-200.svg", (sx0, sy0, SW, bottom - sy0), 200, body)
print(f"wordmark font: {font_name}")
