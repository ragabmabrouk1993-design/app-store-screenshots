"""Writes the "Tragram" wordmark into splash.html as outlined SVG paths, one <path> per letter.

The app's Aeonik font isn't in this repo, so the wordmark is set in Manrope SemiBold (OFL, Google Fonts)
and outlined, which keeps the splash free of font loading. Usage:
    pip install fonttools
    python3 wordmark.py path/to/Manrope-SemiBold.ttf
"""
import re, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

TEXT, WIDTH, TRACKING = "Tragram", 820, -0.01  # width in logo units before the 0.8 scale in splash.html

def outline(font_path, size):
    f = TTFont(font_path); gs = f.getGlyphSet(); cmap = f.getBestCmap(); s = size / f["head"].unitsPerEm
    x, out = 0, []
    for ch in TEXT:
        g = gs[cmap[ord(ch)]]; pen = SVGPathPen(gs)
        g.draw(TransformPen(pen, (s, 0, 0, -s, x, 0)))
        out.append((ch, pen.getCommands()))
        x += g.width * s + TRACKING * size
    return out, x - TRACKING * size

font = sys.argv[1]
_, w = outline(font, 100)
letters, _ = outline(font, 100 * WIDTH / w)
num = lambda d: re.sub(r"-?\d+\.\d+", lambda m: f"{float(m.group()):.1f}".rstrip("0").rstrip("."), d)
body = "".join(f'      <path data-ch="{c}" d="{num(d)}"/>\n' for c, d in letters)
html = open("splash.html").read()
html = re.sub(r"(<!-- wordmark:start -->\n).*?(\s*<!-- wordmark:end -->)", lambda m: m.group(1) + body.rstrip("\n") + m.group(2), html, flags=re.S)
open("splash.html", "w").write(html)
