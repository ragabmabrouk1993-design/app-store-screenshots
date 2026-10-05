"""Writes the horizontal logo: the ribbon symbol with the "Tragram" wordmark to its right.

    python3 splash/horizontal.py

brand/tragram-horizontal-22.svg and brand/tragram-horizontal-200.svg: the same artwork at 22 px and 200 px
tall, width in proportion. The symbol sets the height; the wordmark's cap height is 46% of it, centred on
the symbol, with a gap of 12% of the height (from the end of the top bar; next to the letters the narrower stem leaves more air). Paths and gradients come from splash.html, like the splash.
"""
import os, re
from lottie_kit import html, HERE, parse_path, cubic

OUT = os.path.join(HERE, "..", "brand")
CAP_UNITS = 149.639           # cap height of the outlined wordmark in splash.html (Manrope SemiBold at 207.8)
CAP_FRAC, GAP_FRAC = 0.46, 0.12
INK = "#F4F7FB"               # the wordmark colour used in the splash

shape = lambda id_: re.search(rf'<path id="{id_}" d="([^"]*)"', html).group(1)
defs = re.search(r"(<linearGradient id=\"gFold\".*?</linearGradient>\s*<linearGradient id=\"gStem\".*?</linearGradient>\s*"
                 r"<linearGradient id=\"gTop\".*?</linearGradient>)", html, re.S).group(1)
letters = re.findall(r'<path data-ch="(\w)" d="([^"]*)"/>', html)

def bbox(d):
    xs, ys = [], []
    for c in parse_path(d):
        pos = c["start"]
        for c1, c2, p in c["segs"]:
            for k in range(21):
                x, y = cubic(pos, c1, c2, p, k / 20); xs.append(x); ys.append(y)
            pos = p
    return min(xs), min(ys), max(xs), max(ys)

def union(boxes):
    return min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes)

sx0, sy0, sx1, sy1 = union([bbox(shape(k)) for k in ("shFold", "shStem", "shTop")])
wx0, wy0, wx1, wy1 = union([bbox(d) for _, d in letters])     # letter units, baseline at y = 0
H = sy1 - sy0
k = CAP_FRAC * H / CAP_UNITS                                     # wordmark scale
tx = sx1 + GAP_FRAC * H - k * wx0                               # left edge of the T sits one gap after the symbol
ty = sy0 + (H - CAP_FRAC * H) / 2 + CAP_FRAC * H                # baseline: cap height centred on the symbol
assert ty + k * wy1 <= sy1 + 0.5, "the g's descender would drop below the symbol"
W = tx + k * wx1 - sx0

r = lambda v: f"{v:.3f}".rstrip("0").rstrip(".")
body = (f'  <defs>\n    {defs}\n  </defs>\n'
        f'  <path d="{shape("shFold")}" fill="url(#gFold)"/>\n'
        f'  <path d="{shape("shStem")}" fill="url(#gStem)"/>\n'
        f'  <path d="{shape("shTop")}" fill="url(#gTop)"/>\n'
        f'  <g fill="{INK}" transform="translate({r(tx)} {r(ty)}) scale({k:.5f})">\n'
        + "".join(f'    <path d="{d}"/>\n' for _, d in letters) + "  </g>\n")

os.makedirs(OUT, exist_ok=True)
for px in (22, 200):
    name = f"tragram-horizontal-{px}.svg"
    open(os.path.join(OUT, name), "w").write(
        f'<svg width="{r(W * px / H)}" height="{px}" viewBox="{r(sx0)} {r(sy0)} {r(W)} {r(H)}" fill="none" '
        f'xmlns="http://www.w3.org/2000/svg">\n{body}</svg>\n')
    print(f"brand/{name}: {r(W * px / H)} x {px} px")
