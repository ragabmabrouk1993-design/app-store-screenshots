"""Builds SplashAnimation.json, option A ("Ribbon draw"): the Lottie version of splash.html.

    python3 lottie.py [old SplashAnimation.json]

The logo is uncovered by soft-edged mattes: the upper ribbon left to right, then the fold and lower
ribbon along the ribbon's own path. The soft edge is a gradient alpha ramp on the matte, not a blur.
If an older JSON is passed, its background layers are carried over.
"""
import math, sys
import lottie_kit as kit
from lottie_kit import *

# ---------- timeline: the same numbers as splash.html ----------
T_TOP, T_LOW, T_SETTLE = (0.05, 0.85), (0.42, 1.68), (1.20, 2.30)
WORD_START, WORD_STAGGER, WORD_DUR = 1.32, 0.065, 0.55
T_SWEEP = (2.20, 2.72)
END = 3.10  # the full logo and wordmark hold still from the end of the sweep to the last frame
OP = kit.setup(END)

E_DRAW, E_FLOW = bezier(.55, 0, .30, 1), bezier(.40, 0, .18, 1)
E_GLIDE, E_SWEEP = bezier(.45, 0, .20, 1), bezier(.45, 0, .55, 1)

P_LOW = parse_path(svg_attr("pLow", "d"))[0]

LOW = path_table(P_LOW)
def low_at(l):
    """Point and tangent at arc length l, extended straight past either end."""
    if l <= 0:
        _, p, t = LOW[0]; return (p[0] + t[0] * l, p[1] + t[1] * l), t
    if l >= LOW[-1][0]:
        L, p, t = LOW[-1]; return (p[0] + t[0] * (l - L), p[1] + t[1] * (l - L)), t
    lo, hi = 0, len(LOW) - 1
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if LOW[mid][0] < l: lo = mid
        else: hi = mid
    (l0, p0, t0), (l1, p1, t1) = LOW[lo], LOW[hi]
    k = (l - l0) / ((l1 - l0) or 1)
    t = (lerp(t0[0], t1[0], k), lerp(t0[1], t1[1], k)); tl = math.hypot(*t)
    return (lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k)), (t[0] / tl, t[1] / tl)

FEATHER = 40      # width of the soft reveal edge (logo units); splash.html blurs with sigma 9
HL = 120          # travelling highlight length
TOP_N = (math.sqrt(.5), math.sqrt(.5))   # upper ribbon: edge slanted at 45 degrees, parallel to the ribbon's ends

# Upper reveal: distance of the front along TOP_N.
top_pts = sample_contours(SH["shTop"])
top_d = [p[0] * TOP_N[0] + p[1] * TOP_N[1] for p in top_pts]
TOP_RANGE = (min(top_d) - FEATHER, max(top_d) + FEATHER)

# Lower reveal: a half-plane whose edge rides the path at arc length l, facing along its tangent.
low_pts = sample_contours(SH["shFold"]) + sample_contours(SH["shStem"])
def ahead(q, l):  # signed distance of q in front of the edge
    c, t = low_at(l); return (q[0] - c[0]) * t[0] + (q[1] - c[1]) * t[1]
grid = [x * 0.5 for x in range(-600, 2400)]
first = next(l for l in grid if any(ahead(q, l) < FEATHER / 2 for q in low_pts))
last = next(l for l in grid if all(ahead(q, l) < -FEATHER / 2 for q in low_pts))
LOW_RANGE = (first, last)
# Revealed area must only grow: no point may fall back in front of the edge once behind it.
for q in low_pts:
    behind = False
    for l in grid[::4]:
        if LOW_RANGE[0] <= l <= LOW_RANGE[1]:
            a = ahead(q, l)
            if a < -FEATHER / 2: behind = True
            elif behind and a > -FEATHER / 2 + 1:
                sys.exit(f"lower reveal is not monotonic at {q}")

# ---------- per-frame motion ----------
def top_front(t):  # distance of the edge along TOP_N
    return lerp(*TOP_RANGE, E_DRAW(prog(t, T_TOP)))

def low_front(t):
    return lerp(*LOW_RANGE, E_FLOW(prog(t, T_LOW)))

def band(c, n, t_k, intensity):
    """Highlight band trailing an edge at point c facing n: gradient start/end and opacity."""
    # The band is centred FEATHER/2 + HL/2 behind the edge; 52 on each side stands in for splash.html's blur.
    # Whatever spills past the edge is hidden by the matte.
    centre = (c[0] - n[0] * (FEATHER / 2 + HL / 2), c[1] - n[1] * (FEATHER / 2 + HL / 2))
    half = HL / 2 + 52
    return ((centre[0] - n[0] * half, centre[1] - n[1] * half), (centre[0] + n[0] * half, centre[1] + n[1] * half),
            100 * intensity * bell(t_k))

BAND_ALPHA = [(0, 0), (0.3, 1), (0.7, 1), (1, 0)]

# ---------- layers inside the logo precomp (logo units, origin = logo origin) ----------
layers = []
content = layer("Content (glide)", ty=3, ks=transform(
    p=baked(lambda t: [427.5, 392.5 + 135 * (1 - E_GLIDE(prog(t, T_SETTLE)))]), a=(0, 0)))
logo = layer("Logo (settle)", ty=3, parent=content["ind"], ks=transform(
    p=(422, 322), a=(422, 322), s=baked(lambda t: [lerp(101.2, 100, E_GLIDE(prog(t, T_SETTLE)))] * 2)))

# Final light sweep over the whole logo: band rotated 18 degrees about the logo centre.
def sweep(t):
    k = prog(t, T_SWEEP); x = lerp(-260, 1100, E_SWEEP(k))
    rot = lambda u: (422 + (u - 422) * math.cos(math.radians(18)), 322 + (u - 422) * math.sin(math.radians(18)))
    return rot(x), rot(x + 160), 100 * 0.16 * bell(k)
sweep_layer = layer("Finish Light Sweep", parent=logo["ind"], shapes=[group("Sweep", [
    *lottie_shapes(SH["shTop"], "Top"), *lottie_shapes(SH["shFold"], "Fold"), *lottie_shapes(SH["shStem"], "Stem"),
    grad(WHITE_BAND, baked(lambda t: list(sweep(t)[0])), baked(lambda t: list(sweep(t)[1])),
         o=baked(lambda t: sweep(t)[2]), alpha=[(0, 0), (0.5, 1), (1, 0)], nm="Sweep Band")])])

# Upper ribbon: matte (soft half-plane at 45 degrees) over the ribbon + its travelling highlight.
def edge_matte(nm, pos, rot):
    return layer(nm, parent=logo["ind"], td=1, ks=transform(p=pos, r=rot), shapes=[group("Half-plane", [
        {"ty": "sh", "nm": "Rect", "ks": static({"c": True, "v": [[-4000, -3000], [FEATHER / 2 + 1, -3000], [FEATHER / 2 + 1, 3000], [-4000, 3000]],
                                                   "i": [[0, 0]] * 4, "o": [[0, 0]] * 4})},
        grad([(0, "#FFFFFF"), (1, "#FFFFFF")], (-FEATHER / 2, 0), (FEATHER / 2, 0), alpha=[(0, 1), (1, 0)], nm="Soft Edge")])])

top_matte = edge_matte("Upper Ribbon Reveal (matte)",
                       baked(lambda t: [top_front(t) * TOP_N[0], top_front(t) * TOP_N[1]]), 45)
gs, gs_s, gs_e = logo_gradient("gTop")
def top_band(t):
    d = top_front(t); return band((d * TOP_N[0], d * TOP_N[1]), TOP_N, E_DRAW(prog(t, T_TOP)), 0.30)
top_layer = layer("Upper Ribbon", parent=logo["ind"], tt=1, shapes=[
    group("Highlight", [*lottie_shapes(SH["shTop"], "Top"),
        grad(WHITE_BAND, baked(lambda t: list(top_band(t)[0])), baked(lambda t: list(top_band(t)[1])),
             o=baked(lambda t: top_band(t)[2]), alpha=BAND_ALPHA, nm="Highlight Band")]),
    group("Upper Ribbon", [*lottie_shapes(SH["shTop"], "Top"), grad(gs, gs_s, gs_e, nm="Logo Gradient")])])

# Fold + lower ribbon: matte edge rides the reveal path, turning with it.
def low_edge(t):
    c, n = low_at(low_front(t)); return c, n
low_matte = edge_matte("Fold + Lower Ribbon Reveal (matte)",
                       baked(lambda t: list(low_edge(t)[0])),
                       baked(lambda t: math.degrees(math.atan2(low_edge(t)[1][1], low_edge(t)[1][0]))))
def low_band(t):
    c, n = low_edge(t); return band(c, n, E_FLOW(prog(t, T_LOW)), 0.26)
fs, fs_s, fs_e = logo_gradient("gFold"); ss, ss_s, ss_e = logo_gradient("gStem")
low_layer = layer("Fold + Lower Ribbon", parent=logo["ind"], tt=1, shapes=[
    group("Highlight", [*lottie_shapes(SH["shFold"], "Fold"), *lottie_shapes(SH["shStem"], "Stem"),
        grad(WHITE_BAND, baked(lambda t: list(low_band(t)[0])), baked(lambda t: list(low_band(t)[1])),
             o=baked(lambda t: low_band(t)[2]), alpha=BAND_ALPHA, nm="Highlight Band")]),
    group("Lower Ribbon", [*lottie_shapes(SH["shStem"], "Stem"), grad(ss, ss_s, ss_e, nm="Logo Gradient")]),
    group("Fold", [*lottie_shapes(SH["shFold"], "Fold"), grad(fs, fs_s, fs_e, nm="Logo Gradient")])])

# Wordmark: T r a g r a m, each fading in and rising (no blur; Lottie mobile players don't render it).
letters = []
for n, (ch, d) in enumerate(LETTERS):
    rng = (WORD_START + n * WORD_STAGGER, WORD_START + n * WORD_STAGGER + WORD_DUR)
    k = lambda t, rng=rng: E_LETTER(prog(t, rng))
    letters.append(layer(f"Letter {n + 1} '{ch}'", parent=content["ind"], ks=transform(
        p=baked(lambda t, k=k: [94, 915 + 0.8 * 46 * (1 - k(t))]), s=(80, 80), o=baked(lambda t, k=k: 100 * k(t))),
        shapes=[group(ch, [*lottie_shapes(d, ch), fill("#F4F7FB")])]))

# Order: first = top. Each matte sits directly above the layer it reveals.
layers = [sweep_layer, *letters, top_matte, top_layer, low_matte, low_layer, logo, content]

write("SplashAnimation.json", "Tragram Splash — A ribbon draw", layers,
      [("symbol-start", T_TOP[0]), ("fold-start", T_LOW[0]), ("settle-start", T_SETTLE[0]), ("wordmark-start", WORD_START),
       ("sweep-start", T_SWEEP[0]), ("stable", T_SWEEP[1]), ("end", END)])
