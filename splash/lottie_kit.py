"""Shared helpers for the Lottie splash builders (lottie.py, lottie_trace.py).

Reads the logo paths, gradients and wordmark outlines from splash.html. Uses only features that
lottie-web, lottie-ios and lottie-android all render: shape layers, linear gradient fills and strokes
(with opacity stops), trim paths, alpha track mattes, null parents and transforms. There are no effects
and no mask feathering. Keyframes are baked once per frame with linear interpolation.
"""
import json, math, re, sys, os

HERE = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(HERE, "splash.html")).read()

FPS, W, H = 60, 375, 812
BG = "#04080F"
OP, FRAMES = None, None

def setup(end):
    """Sets the length: frames 0..end*FPS inclusive."""
    global OP, FRAMES
    OP = round(end * FPS) + 1; FRAMES = range(OP)
    return OP

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

E_LETTER = bezier(.22, 1, .36, 1)
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
    """New layer; ind counts up from 1 within the precomp being built."""
    global ind; ind += 1
    L = {"ddd": 0, "ind": ind, "ty": ty, "nm": nm, "sr": 1, "ip": 0, "op": OP, "st": 0, "bm": 0, "ks": transform()}
    L.update(kw)
    return L

def logo_gradient(id_):
    m = re.search(rf'<linearGradient id="{id_}" x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"[^>]*>(.*?)</linearGradient>', html, re.S)
    stops = [(float(o or 0), c) for o, c in re.findall(r'<stop(?: offset="([\d.]+)")? stop-color="(#[0-9A-Fa-f]{6})"', m.group(5))]
    return stops, (float(m.group(1)), float(m.group(2))), (float(m.group(3)), float(m.group(4)))

WHITE_BAND = [(0, "#E8FBFF"), (1, "#E8FBFF")]

# ---------- root composition ----------
SCALE = 100 * (min(0.38 * W, 190) / 845)  # logo 38% of the short side, as in splash.html

def write(name, title, layers, markers):
    """Wraps the logo-unit layers in a 1700 x 1700 precomp, centres it and writes the JSON.
    The animation ends on the full logo and wordmark, held still; it doesn't fade out.
    The background layers come from the JSON passed on the command line, else from SplashAnimation.json."""
    comp_layer = {"ddd": 0, "ind": 1, "ty": 0, "nm": "Tragram Logo Animation", "refId": "logo_comp", "sr": 1,
                  "ip": 0, "op": OP, "st": 0, "bm": 0, "w": 1700, "h": 1700,
                  "ks": transform(p=(W / 2, H / 2), a=(850, 850), s=(SCALE, SCALE))}
    bg_layers = [{"ddd": 0, "ind": 3, "ty": 1, "nm": "Background", "sr": 1, "ip": 0, "op": OP, "st": 0, "bm": 0,
                  "sw": W, "sh": H, "sc": BG, "ks": transform(p=(W / 2, H / 2), a=(W / 2, H / 2))}]
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "SplashAnimation.json")
    if os.path.exists(src) and os.path.abspath(src) != os.path.join(HERE, name):
        bg_layers = [l for l in json.load(open(src))["layers"] if l.get("ty") != 0]
    elif os.path.exists(os.path.join(HERE, name)):
        bg_layers = [l for l in json.load(open(os.path.join(HERE, name)))["layers"] if l.get("ty") != 0]
    for l in bg_layers: l["op"] = OP
    anim = {"v": "5.12.2", "fr": FPS, "ip": 0, "op": OP, "w": W, "h": H, "ddd": 0, "nm": title,
            "assets": [{"id": "logo_comp", "nm": "Logo + wordmark (logo units)", "fr": FPS, "layers": layers}],
            "layers": [comp_layer, *bg_layers],
            "markers": [{"tm": round(t * FPS), "cm": cm, "dr": 0} for cm, t in markers]}
    out = os.path.join(HERE, name)
    json.dump(anim, open(out, "w"), separators=(",", ":"))
    print(f"{out}: {OP} frames @ {FPS} fps, {os.path.getsize(out) / 1024:.0f} KB")
