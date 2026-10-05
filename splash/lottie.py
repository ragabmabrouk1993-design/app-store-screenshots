"""Builds SplashAnimation.json, the Lottie version of splash.html.

    python3 lottie.py [old SplashAnimation.json]

The logo paths, gradients and wordmark outlines are read from splash.html, so the two stay in step.
If an older SplashAnimation.json is passed, its background layers are carried over.

It uses only features that lottie-web, lottie-ios and lottie-android all render: shape layers, linear
gradient fills (with opacity stops), alpha track mattes, null parents and transforms. There are no
effects (blur) and no mask feathering. The soft reveal edge comes from a gradient alpha ramp on the matte.
Keyframes are baked once per frame with linear interpolation, so the curves match splash.html exactly.
"""
import json, math, re, sys, os

HERE = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(HERE, "splash.html")).read()

FPS, W, H = 60, 375, 812
BG = "#04080F"

# ---------- timeline: the same numbers as splash.html ----------
T_TOP, T_LOW, T_SETTLE = (0.05, 0.85), (0.42, 1.68), (1.20, 2.30)
WORD_START, WORD_STAGGER, WORD_DUR = 1.32, 0.065, 0.55
T_SWEEP, T_EXIT = (2.20, 2.72), (2.82, 3.10)
END = T_EXIT[1]
OP = round(END * FPS) + 1
FRAMES = range(OP)

def bezier(x1, y1, x2, y2):
    def f(x):
        if x <= 0: return 0.0
        if x >= 1: return 1.0
        lo, hi = 0.0, 1.0
        for _ in range(60):
            s = (lo + hi) / 2
            X = 3 * (1 - s) ** 2 * s * x1 + 3 * (1 - s) * s * s * x2 + s ** 3
            if X < x: lo = s
            else: hi = s
        s = (lo + hi) / 2
        return 3 * (1 - s) ** 2 * s * y1 + 3 * (1 - s) * s * s * y2 + s ** 3
    return f

E_DRAW, E_FLOW = bezier(.55, 0, .30, 1), bezier(.40, 0, .18, 1)
E_GLIDE, E_LETTER = bezier(.45, 0, .20, 1), bezier(.22, 1, .36, 1)
E_SWEEP, E_EXIT = bezier(.45, 0, .55, 1), bezier(.40, 0, .20, 1)
clamp = lambda v: min(1.0, max(0.0, v))
prog = lambda t, r: clamp((t - r[0]) / (r[1] - r[0]))
lerp = lambda a, b, k: a + (b - a) * k
bell = lambda k: math.sin(math.pi * clamp(k))

# ---------- SVG path parsing (absolute M L H V C Q Z, as used in splash.html) ----------
def parse_path(d):
    toks = re.findall(r"[MLHVCQZ]|-?\d*\.?\d+(?:e-?\d+)?", d)
    contours, cur, pos, i, cmd = [], None, (0.0, 0.0), 0, None
    num = lambda: float(toks[i])
    while i < len(toks):
        if re.match(r"[A-Z]", toks[i]): cmd = toks[i]; i += 1
        if cmd == "Z":
            if cur: contours.append(cur); cur = None
            continue
        if cmd == "M":
            if cur: contours.append(cur)
            pos = (float(toks[i]), float(toks[i + 1])); i += 2; cur = {"start": pos, "segs": []}; cmd = "L"; continue
        if cmd == "L": p = (float(toks[i]), float(toks[i + 1])); i += 2; cur["segs"].append((pos, pos, p)); pos = p
        elif cmd == "H": p = (float(toks[i]), pos[1]); i += 1; cur["segs"].append((pos, pos, p)); pos = p
        elif cmd == "V": p = (pos[0], float(toks[i])); i += 1; cur["segs"].append((pos, pos, p)); pos = p
        elif cmd == "C":
            c1, c2, p = [(float(toks[i + k]), float(toks[i + k + 1])) for k in (0, 2, 4)]; i += 6
            cur["segs"].append((c1, c2, p)); pos = p
        elif cmd == "Q":
            q, p = (float(toks[i]), float(toks[i + 1])), (float(toks[i + 2]), float(toks[i + 3])); i += 4
            c1 = (pos[0] + 2 / 3 * (q[0] - pos[0]), pos[1] + 2 / 3 * (q[1] - pos[1]))
            c2 = (p[0] + 2 / 3 * (q[0] - p[0]), p[1] + 2 / 3 * (q[1] - p[1]))
            cur["segs"].append((c1, c2, p)); pos = p
    if cur: contours.append(cur)
    return contours

def lottie_shapes(d, name):
    """SVG path -> list of Lottie 'sh' items (one per contour). Vertex tangents are relative."""
    out = []
    for n, c in enumerate(parse_path(d)):
        v, ii, oo = [c["start"]], [(0, 0)], []
        for c1, c2, p in c["segs"]:
            last = v[-1]
            oo.append((c1[0] - last[0], c1[1] - last[1]))
            v.append(p); ii.append((c2[0] - p[0], c2[1] - p[1]))
        oo.append((0, 0))
        # drop the closing duplicate of the start point; its in-tangent moves to the start
        if len(v) > 1 and abs(v[-1][0] - v[0][0]) < 1e-6 and abs(v[-1][1] - v[0][1]) < 1e-6:
            ii[0] = ii[-1]; v.pop(); ii.pop(); oo.pop()
        r = lambda pts: [[round(x, 3), round(y, 3)] for x, y in pts]
        out.append({"ty": "sh", "nm": f"{name} {n + 1}", "ks": {"a": 0, "k": {"c": True, "v": r(v), "i": r(ii), "o": r(oo)}}})
    return out

def svg_attr(id_, attr):
    m = re.search(rf'<path id="{id_}" d="([^"]*)"', html)
    return m.group(1)

SH = {k: svg_attr(k, "d") for k in ("shTop", "shFold", "shStem")}
LETTERS = re.findall(r'<path data-ch="(\w)" d="([^"]*)"/>', html)
assert len(LETTERS) == 7, "wordmark paths not found in splash.html"
P_LOW = parse_path(svg_attr("pLow", "d"))[0]

# ---------- geometry helpers ----------
def cubic(p0, c1, c2, p1, s):
    m = 1 - s
    return (m ** 3 * p0[0] + 3 * m * m * s * c1[0] + 3 * m * s * s * c2[0] + s ** 3 * p1[0],
            m ** 3 * p0[1] + 3 * m * m * s * c1[1] + 3 * m * s * s * c2[1] + s ** 3 * p1[1])

def sample_contours(d, n=60):
    pts = []
    for c in parse_path(d):
        pos = c["start"]
        for c1, c2, p in c["segs"]:
            pts += [cubic(pos, c1, c2, p, k / n) for k in range(n)]; pos = p
    return pts

# The lower reveal path as an arc-length table: (length, point, unit tangent).
def path_table(contour, n=400):
    pts, pos = [], contour["start"]
    for c1, c2, p in contour["segs"]:
        pts += [cubic(pos, c1, c2, p, k / n) for k in range(n)]; pos = p
    pts.append(pos)
    tab, L = [], 0.0
    for k, p in enumerate(pts):
        if k: L += math.dist(p, pts[k - 1])
        a, b = pts[max(0, k - 1)], pts[min(len(pts) - 1, k + 1)]
        dl = math.dist(a, b) or 1
        tab.append((L, p, ((b[0] - a[0]) / dl, (b[1] - a[1]) / dl)))
    return tab

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

# ---------- keyframe helpers ----------
def rnd(v): return [round(x, 3) for x in v] if isinstance(v, (list, tuple)) else round(v, 3)

def baked(fn):
    """Per-frame values -> Lottie property; keyframes only where the value changes, linear between them."""
    vals = [rnd(fn(f / FPS)) for f in FRAMES]
    if all(v == vals[0] for v in vals): return {"a": 0, "k": vals[0]}
    keep = [f for f in FRAMES if f in (0, OP - 1) or vals[f] != vals[f - 1] or vals[f] != vals[f + 1]]
    dims = len(vals[0]) if isinstance(vals[0], list) else 1
    lin_o, lin_i = {"x": [0.0] * dims, "y": [0.0] * dims}, {"x": [1.0] * dims, "y": [1.0] * dims}
    ks = []
    for n, f in enumerate(keep):
        k = {"t": f, "s": vals[f] if dims > 1 else [vals[f]]}
        if n < len(keep) - 1: k.update(o=lin_o, i=lin_i)
        ks.append(k)
    return {"a": 1, "k": ks}

static = lambda v: {"a": 0, "k": v}

def transform(p=(0, 0), a=(0, 0), s=(100, 100), r=0, o=100):
    w = lambda v: v if isinstance(v, dict) else static(list(v) if isinstance(v, tuple) else v)
    return {"o": w(o), "r": w(r), "p": w(p), "a": w(a), "s": w(s)}

def group_tr():
    return {"ty": "tr", "p": static([0, 0]), "a": static([0, 0]), "s": static([100, 100]), "r": static(0),
            "o": static(100), "sk": static(0), "sa": static(0), "nm": "Transform"}

def hex_rgb(h): h = h.lstrip("#"); return [int(h[k:k + 2], 16) / 255 for k in (0, 2, 4)]

def grad(stops, s, e, o=100, alpha=None, nm="Gradient"):
    k = []
    for off, col in stops: k += [off, *[round(c, 4) for c in hex_rgb(col)]]
    if alpha:
        for off, a in alpha: k += [off, a]
    w = lambda v: v if isinstance(v, dict) else static(list(v))
    return {"ty": "gf", "nm": nm, "o": o if isinstance(o, dict) else static(o), "r": 1, "bm": 0, "t": 1,
            "g": {"p": len(stops), "k": static(k)}, "s": w(s), "e": w(e)}

def fill(col, nm="Fill"):
    return {"ty": "fl", "nm": nm, "c": static(hex_rgb(col) + [1]), "o": static(100), "r": 1, "bm": 0}

def group(nm, items):
    return {"ty": "gr", "nm": nm, "it": items + [group_tr()]}

ind = 0
def layer(nm, ty=4, **kw):
    global ind; ind += 1
    L = {"ddd": 0, "ind": ind, "ty": ty, "nm": nm, "sr": 1, "ip": 0, "op": OP, "st": 0, "bm": 0, "ks": transform()}
    L.update(kw)
    return L

def logo_gradient(id_):
    m = re.search(rf'<linearGradient id="{id_}" x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"[^>]*>(.*?)</linearGradient>', html, re.S)
    stops = [(float(o or 0), c) for o, c in re.findall(r'<stop(?: offset="([\d.]+)")? stop-color="(#[0-9A-Fa-f]{6})"', m.group(5))]
    return stops, (float(m.group(1)), float(m.group(2))), (float(m.group(3)), float(m.group(4)))

WHITE_BAND = [(0, "#E8FBFF"), (1, "#E8FBFF")]

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

# ---------- root ----------
SCALE = 100 * (min(0.38 * W, 190) / 845)  # logo 38% of the short side, as in splash.html
ex = lambda t: E_EXIT(prog(t, T_EXIT))
comp_layer = {"ddd": 0, "ind": 1, "ty": 0, "nm": "Tragram Logo Animation", "refId": "logo_comp", "sr": 1,
              "ip": 0, "op": OP, "st": 0, "bm": 0, "w": 1700, "h": 1700,
              "ks": transform(p=(W / 2, H / 2), a=(850, 850),
                              s=baked(lambda t: [SCALE * lerp(1, 1.015, ex(t))] * 2),
                              o=baked(lambda t: 100 * (1 - ex(t))))}

bg_layers = [{"ddd": 0, "ind": 3, "ty": 1, "nm": "Background", "sr": 1, "ip": 0, "op": OP, "st": 0, "bm": 0,
              "sw": W, "sh": H, "sc": BG, "ks": transform(p=(W / 2, H / 2), a=(W / 2, H / 2))}]
if len(sys.argv) > 1:  # keep the existing file's background layers
    old = json.load(open(sys.argv[1]))
    bg_layers = [l for l in old["layers"] if l.get("ty") != 0]
    for l in bg_layers: l["op"] = OP

f = lambda s: round(s * FPS)
anim = {"v": "5.12.2", "fr": FPS, "ip": 0, "op": OP, "w": W, "h": H, "ddd": 0,
        "nm": "Tragram Splash — ribbon logo", "assets": [{"id": "logo_comp", "nm": "Logo + wordmark (logo units)", "fr": FPS, "layers": layers}],
        "layers": [comp_layer, *bg_layers],
        "markers": [{"tm": f(T_TOP[0]), "cm": "symbol-start", "dr": 0}, {"tm": f(T_LOW[0]), "cm": "fold-start", "dr": 0},
                    {"tm": f(T_SETTLE[0]), "cm": "settle-start", "dr": 0}, {"tm": f(WORD_START), "cm": "wordmark-start", "dr": 0},
                    {"tm": f(T_SWEEP[0]), "cm": "sweep-start", "dr": 0}, {"tm": f(T_SWEEP[1]), "cm": "stable", "dr": 0},
                    {"tm": f(T_EXIT[0]), "cm": "exit-start", "dr": 0}]}
out = os.path.join(HERE, "SplashAnimation.json")
json.dump(anim, open(out, "w"), separators=(",", ":"))
print(f"{out}: {OP} frames @ {FPS} fps, {os.path.getsize(out) / 1024:.0f} KB; top range {TOP_RANGE[0]:.0f}..{TOP_RANGE[1]:.0f}, low range {LOW_RANGE[0]:.0f}..{LOW_RANGE[1]:.0f}")
