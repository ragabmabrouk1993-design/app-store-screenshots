"""Writes the final frame's logo + wordmark as SVG, at the size and position they have in the splash.

    python3 lockup.py

- tragram-lockup.svg: cropped to the lockup, at its on-screen size in the 375 x 812 splash.
- tragram-lockup-375x812.svg: the whole 375 x 812 canvas with the lockup where the animation leaves it,
  on a transparent background, for a static launch screen that lines up with the Lottie.
- splash-375x812.svg: the same canvas with the splash background: #04080F plus the soft blue glow at the
  top, read from SplashAnimation.json's background layers. It is the animation's last frame.
Paths, gradients and layout come from splash.html; sizes from lottie_kit.py.
"""
import json, math, os, re
from lottie_kit import html, HERE, W, H, BG, SCALE, parse_path, cubic

S = SCALE / 100                      # logo units -> points (845 units = 142.5 pt)
CX, CY = 422.5, 457.5                # composition centre in logo units (the precomp's anchor)
WM_X, WM_Y, WM_S = 94, 915, 0.8      # wordmark placement in logo units

defs = re.search(r"(<linearGradient id=\"gFold\".*?</linearGradient>\s*<linearGradient id=\"gStem\".*?</linearGradient>\s*"
                 r"<linearGradient id=\"gTop\".*?</linearGradient>)", html, re.S).group(1)
shape = lambda id_: re.search(rf'<path id="{id_}" d="([^"]*)"', html).group(1)
letters = re.findall(r'<path data-ch="(\w)" d="([^"]*)"/>', html)

# Bounding box in logo units, from the outlines themselves.
def bbox(d, tx=0, ty=0, s=1):
    xs, ys = [], []
    for c in parse_path(d):
        pos = c["start"]
        for c1, c2, p in c["segs"]:
            for k in range(21):
                x, y = cubic(pos, c1, c2, p, k / 20); xs.append(tx + s * x); ys.append(ty + s * y)
            pos = p
    return min(xs), min(ys), max(xs), max(ys)
boxes = [bbox(shape(k)) for k in ("shFold", "shStem", "shTop")] + [bbox(d, WM_X, WM_Y, WM_S) for _, d in letters]
x0, y0 = min(b[0] for b in boxes), min(b[1] for b in boxes)
x1, y1 = max(b[2] for b in boxes), max(b[3] for b in boxes)

body = f'''  <defs>
    {defs}
  </defs>
  <path d="{shape("shFold")}" fill="url(#gFold)"/>
  <path d="{shape("shStem")}" fill="url(#gStem)"/>
  <path d="{shape("shTop")}" fill="url(#gTop)"/>
  <g fill="#F4F7FB" transform="translate({WM_X} {WM_Y}) scale({WM_S})">
''' + "".join(f'    <path d="{d}"/>\n' for _, d in letters) + "  </g>\n"

r = lambda v: f"{v:.3f}".rstrip("0").rstrip(".")
# 1. Cropped lockup at on-screen size.
w, h = (x1 - x0) * S, (y1 - y0) * S
open(os.path.join(HERE, "tragram-lockup.svg"), "w").write(
    f'<svg width="{r(w)}" height="{r(h)}" viewBox="{r(x0)} {r(y0)} {r(x1 - x0)} {r(y1 - y0)}" fill="none" '
    f'xmlns="http://www.w3.org/2000/svg">\n{body}</svg>\n')
# 2. Full splash canvas: logo units placed exactly as the Lottie's precomp layer places them.
tx, ty = W / 2 - S * CX, H / 2 - S * CY
open(os.path.join(HERE, "tragram-lockup-375x812.svg"), "w").write(
    f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" fill="none" xmlns="http://www.w3.org/2000/svg">\n'
    f'<g transform="translate({r(tx)} {r(ty)}) scale({S:.6f})">\n{body}</g>\n</svg>\n')
# 3. Full splash with its background, taken from the Lottie's background layers.
anim = json.load(open(os.path.join(HERE, "SplashAnimation.json")))
bg = next((l["sc"] for l in anim["layers"] if l.get("ty") == 1), BG)
glow = ""
for l in anim["layers"]:
    if l.get("nm") != "Background Radial Glow": continue
    items = l["shapes"][0]["it"]
    el = next(i for i in items if i["ty"] == "el"); gf = next(i for i in items if i["ty"] == "gf")
    (cx, cy), (dx, _) = el["p"]["k"], el["s"]["k"]
    (sx, sy), (ex, ey) = gf["s"]["k"], gf["e"]["k"]
    n, k = gf["g"]["p"], gf["g"]["k"]["k"]
    cols, alphas = [k[i:i + 4] for i in range(0, 4 * n, 4)], [k[i:i + 2] for i in range(4 * n, len(k), 2)]
    hexc = lambda c: "#" + "".join(f"{round(v * 255):02X}" for v in c[1:4])
    alpha = lambda off: next((a for o, a in alphas if abs(o - off) < 1e-6), 1)
    stops = "".join(f'<stop offset="{c[0]:g}" stop-color="{hexc(c)}" stop-opacity="{alpha(c[0]):g}"/>' for c in cols)
    glow = (f'  <radialGradient id="gGlow" cx="{sx:g}" cy="{sy:g}" r="{r(math.dist((sx, sy), (ex, ey)))}" gradientUnits="userSpaceOnUse">'
            f'{stops}</radialGradient>\n')
    glow_shape = f'<circle cx="{cx:g}" cy="{cy:g}" r="{dx / 2:g}" fill="url(#gGlow)"/>\n'
open(os.path.join(HERE, "splash-375x812.svg"), "w").write(
    f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" fill="none" xmlns="http://www.w3.org/2000/svg">\n'
    + (f"<defs>\n{glow}</defs>\n" if glow else "")
    + f'<rect width="{W}" height="{H}" fill="{bg}"/>\n' + (glow_shape if glow else "")
    + f'<g transform="translate({r(tx)} {r(ty)}) scale({S:.6f})">\n{body}</g>\n</svg>\n')
print(f"tragram-lockup.svg: {r(w)} x {r(h)} pt; logo {r(845 * S)} pt wide; "
      f"on the 375 x 812 canvas at x {r(tx + S * x0)}, y {r(ty + S * y0)}")
