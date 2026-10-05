"""Builds SplashAnimation-trace.json, option B ("Trace & fill").

    python3 lottie_trace.py [old SplashAnimation.json]

A fine line in the logo's own gradient traces each ribbon's outline. Each trace starts at one point and
runs both ways round, closing at the far end: the upper ribbon from its bottom-left corner to its
top-right corner, the fold from its top corner to its point, and the lower ribbon from its top-left
corner down to its tip. The gradient then floods in and the line dissolves into the edge, leaving the
logo exactly as drawn while it eases from 96.5% to 100%. The letters rise into place one by one, each
uncovered from the baseline up by a soft-edged matte. A light sweep follows, then the full lockup holds still to the last frame.
"""
import math
import lottie_kit as kit
from lottie_kit import *

# ---------- timeline (seconds) ----------
TRACE = {"Top": (0.08, 0.80), "Fold": (0.50, 0.86), "Stem": (0.58, 1.30)}
FLOOD = {"Top": (0.55, 1.15), "Fold": (0.78, 1.22), "Stem": (1.00, 1.60)}
DISSOLVE = {"Top": (1.00, 1.50), "Fold": (1.10, 1.50), "Stem": (1.40, 1.85)}
T_PUSH = (0.00, 1.90)
WORD_START, WORD_STAGGER, WORD_DUR = 1.30, 0.07, 0.50
T_SWEEP = (2.20, 2.72)
END = 3.10  # the full logo and wordmark hold still from the end of the sweep to the last frame
OP = kit.setup(END)

E_TRACE = bezier(.50, 0, .25, 1)
E_FLOOD = bezier(.33, 0, .25, 1)
E_PUSH = bezier(.20, .55, .25, 1)
E_SWEEP = bezier(.45, 0, .55, 1)
STROKE = 5  # logo units; about 1pt on screen

# ---------- where each trace starts and closes ----------
def arc_fractions(d, n=400):
    """(point, fraction of the perimeter) along the first contour, measured by arc length."""
    pts = sample_contours(d, n)
    pts.append(pts[0])
    acc = [0.0]
    for a, b in zip(pts, pts[1:]): acc.append(acc[-1] + math.dist(a, b))
    return [(p, l / acc[-1]) for p, l in zip(pts, acc)]

def frac_of(d, pick):
    table = arc_fractions(d)
    return min(table, key=lambda pf: pick(pf[0]))[1]

# Every trace starts at the path's first vertex (fraction 0) and closes at:
CLOSE = {
    "Top": frac_of(SH["shTop"], lambda p: math.dist(p, (844, 0))),   # top-right corner
    "Fold": frac_of(SH["shFold"], lambda p: math.dist(p, (492, 301))),  # the fold's point
    "Stem": frac_of(SH["shStem"], lambda p: -p[1]),                      # the tip (lowest point)
}

# ---------- helpers ----------
def grad_stroke(stops, s, e, o, nm="Gradient Stroke"):
    k = []
    for off, col in stops: k += [off, *[round(c, 4) for c in hex_rgb(col)]]
    return {"ty": "gs", "nm": nm, "o": o, "w": static(STROKE), "lc": 2, "lj": 2, "ml": 4, "bm": 0, "t": 1,
            "g": {"p": len(stops), "k": static(k)}, "s": static(list(s)), "e": static(list(e))}

def trim(s, e, nm):
    return {"ty": "tm", "nm": nm, "s": s, "e": e, "o": static(0), "m": 1}

GRADIENT = {"Top": "gTop", "Fold": "gFold", "Stem": "gStem"}
PATH = {"Top": "shTop", "Fold": "shFold", "Stem": "shStem"}

# ---------- layers (logo units) ----------
content = layer("Content", ty=3, ks=transform(p=(427.5, 392.5)))
logo = layer("Logo (push-in)", ty=3, parent=content["ind"], ks=transform(
    p=(422, 322), a=(422, 322), s=baked(lambda t: [lerp(96.5, 100, E_PUSH(prog(t, T_PUSH)))] * 2)))

def sweep(t):
    k = prog(t, T_SWEEP); x = lerp(-260, 1100, E_SWEEP(k))
    rot = lambda u: (422 + (u - 422) * math.cos(math.radians(18)), 322 + (u - 422) * math.sin(math.radians(18)))
    return rot(x), rot(x + 160), 100 * 0.16 * bell(k)
sweep_layer = layer("Finish Light Sweep", parent=logo["ind"], shapes=[group("Sweep", [
    *lottie_shapes(SH["shTop"], "Top"), *lottie_shapes(SH["shFold"], "Fold"), *lottie_shapes(SH["shStem"], "Stem"),
    grad(WHITE_BAND, baked(lambda t: list(sweep(t)[0])), baked(lambda t: list(sweep(t)[1])),
         o=baked(lambda t: sweep(t)[2]), alpha=[(0, 0), (0.5, 1), (1, 0)], nm="Sweep Band")])])

# Trace: two copies of each outline, one running each way from the start vertex, meeting at CLOSE.
trace_groups = []
for part in ("Top", "Fold", "Stem"):
    stops, gs_s, gs_e = logo_gradient(GRADIENT[part])
    a = CLOSE[part]
    x = lambda t, part=part: E_TRACE(prog(t, TRACE[part]))
    fade = baked(lambda t, part=part: 100 * (1 - E_FLOOD(prog(t, DISSOLVE[part]))))
    fwd = group(f"{part} trace →", [*lottie_shapes(SH[PATH[part]], part),
        trim(static(0), baked(lambda t, x=x, a=a: 100 * a * x(t)), "Forward"),
        grad_stroke(stops, gs_s, gs_e, fade)])
    back = group(f"{part} trace ←", [*lottie_shapes(SH[PATH[part]], part),
        trim(baked(lambda t, x=x, a=a: 100 - 100 * (1 - a) * x(t)), static(100), "Backward"),
        grad_stroke(stops, gs_s, gs_e, fade)])
    trace_groups.append(group(f"{part} trace", [fwd, back]))
trace_layer = layer("Outline Trace", parent=logo["ind"], shapes=trace_groups)

# Flood: the original fills fade in under the line. Painted in the SVG's order (fold, stem, top), top first in Lottie.
fill_groups = []
for part in ("Top", "Stem", "Fold"):
    stops, gs_s, gs_e = logo_gradient(GRADIENT[part])
    fill_groups.append(group(part, [*lottie_shapes(SH[PATH[part]], part),
        grad(stops, gs_s, gs_e, o=baked(lambda t, part=part: 100 * E_FLOOD(prog(t, FLOOD[part]))), nm="Logo Gradient")]))
fill_layer = layer("Logo Fill", parent=logo["ind"], shapes=fill_groups)

# Wordmark: each letter rises 36 units (pre-scale) while a soft edge uncovers it from the baseline up.
SOFT = 60
letter_layers = []
for n, (ch, d) in enumerate(LETTERS):
    rng = (WORD_START + n * WORD_STAGGER, WORD_START + n * WORD_STAGGER + WORD_DUR)
    k = lambda t, rng=rng: E_LETTER(prog(t, rng))
    # The edge travels from just below the descender (+60) to above the cap height (-160), in letter units.
    edge = lambda t, k=k: lerp(60 + SOFT / 2, -160 - SOFT / 2, k(t))
    matte = layer(f"Letter {n + 1} '{ch}' reveal (matte)", parent=content["ind"], td=1,
                  ks=transform(p=(94, 915), s=(80, 80)), shapes=[{"ty": "gr", "nm": "Edge", "it": [
        # opaque below the edge, transparent above it, with a SOFT-wide ramp between
        {"ty": "sh", "nm": "Rect", "ks": static({"c": True, "v": [[-200, 4000], [-200, 0], [1200, 0], [1200, 4000]],
                                                   "i": [[0, 0]] * 4, "o": [[0, 0]] * 4})},
        grad([(0, "#FFFFFF"), (1, "#FFFFFF")], (0, 0), (0, SOFT), alpha=[(0, 0), (1, 1)], nm="Soft Edge"),
        {**group_tr(), "p": baked(lambda t, edge=edge: [0, edge(t) - SOFT / 2])}]}])
    letter = layer(f"Letter {n + 1} '{ch}'", parent=content["ind"], tt=1, ks=transform(
        p=baked(lambda t, k=k: [94, 915 + 0.8 * 36 * (1 - k(t))]), s=(80, 80), o=baked(lambda t, k=k: 100 * min(1, 1.6 * k(t)))),
        shapes=[group(ch, [*lottie_shapes(d, ch), fill("#F4F7FB")])])
    letter_layers += [matte, letter]

layers = [sweep_layer, *letter_layers, trace_layer, fill_layer, logo, content]

write("SplashAnimation-trace.json", "Tragram Splash — B trace & fill", layers,
      [("symbol-start", TRACE["Top"][0]), ("fill-start", FLOOD["Top"][0]), ("wordmark-start", WORD_START),
       ("sweep-start", T_SWEEP[0]), ("stable", T_SWEEP[1]), ("end", END)])
