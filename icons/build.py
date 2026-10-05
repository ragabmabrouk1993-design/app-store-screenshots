"""Builds the Tragram app icons for iOS and Android from the ribbon logo in splash/splash.html.

    python3 icons/build.py        # writes the SVG masters and Android XML, then rasterizes with rasterize.js
                                  # (needs Node with Playwright, and ffmpeg)

Design: the ribbon logo with its original gradients, centred on the app's dark navy (#04080F) with a soft
radial lift behind it, like the previous icon and the splash. All geometry is flattened into the final
coordinate space, so no format below relies on group transforms.

iOS      ios/AppIcon.appiconset/          iPhone set: 20, 29, 40, 60 pt at 2x and 3x, plus the 1024 App Store icon
         ios/ios18/                       optional iOS 18 dark and tinted 1024 variants
Android  android/res/mipmap-anydpi-v26/   adaptive icon (API 26+): vector foreground, background, monochrome (API 33 themed icons)
         android/res/drawable/            the three vector layers
         android/res/mipmap-*/            legacy PNGs (ic_launcher rounded square, ic_launcher_round circle)
         android/play-store-512.png       Google Play listing icon (full square; Play applies the mask)
previews/                                 the icons under their real masks, for review only
"""
import json, os, re, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(HERE, "..", "splash", "splash.html")).read()

# ---------- logo geometry and colours from splash.html ----------
SHAPES = [(k, re.search(rf'<path id="{k}" d="([^"]*)"', html).group(1)) for k in ("shFold", "shStem", "shTop")]
GRAD_OF = {"shFold": "gFold", "shStem": "gStem", "shTop": "gTop"}
def gradient(id_):
    m = re.search(rf'<linearGradient id="{id_}" x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"[^>]*>(.*?)</linearGradient>', html, re.S)
    stops = [(float(o or 0), c) for o, c in re.findall(r'<stop(?: offset="([\d.]+)")? stop-color="(#[0-9A-Fa-f]{6})"', m.group(5))]
    return (float(m.group(1)), float(m.group(2))), (float(m.group(3)), float(m.group(4))), stops
GRADS = {k: gradient(v) for k, v in GRAD_OF.items()}
LOGO_W, LOGO_H = 844, 648  # bounding box of the three shapes (x 0..844, y 0..~647.6)

BG, GLOW = "#04080F", "#0B1D42"  # base navy and the soft lift behind the logo

def fmt(v): return f"{v:.3f}".rstrip("0").rstrip(".")

def transform_path(d, s, tx, ty):
    """Applies x' = s*x + tx, y' = s*y + ty to an absolute M/L/H/V/C/Z path."""
    out, toks, i, cmd = [], re.findall(r"[MLHVCZ]|-?\d*\.?\d+", d), 0, None
    while i < len(toks):
        if re.match(r"[A-Z]", toks[i]): cmd = toks[i]; out.append(cmd); i += 1; continue
        if cmd == "H": out.append(fmt(s * float(toks[i]) + tx)); i += 1
        elif cmd == "V": out.append(fmt(s * float(toks[i]) + ty)); i += 1
        else: out.append(f"{fmt(s * float(toks[i]) + tx)} {fmt(s * float(toks[i + 1]) + ty)}"); i += 2
    return " ".join(out).replace(" Z", "Z")

def placed(size, width_frac, cy_frac=0.5):
    """Scale and offset that put the logo at width_frac of a size x size canvas, centred."""
    s = size * width_frac / LOGO_W
    return s, (size - LOGO_W * s) / 2, size * cy_frac - LOGO_H * s / 2

def gray(hex_):  # luminance, lifted so the tinted icon reads light on the system's dark tint
    r, g, b = (int(hex_[k:k + 2], 16) for k in (1, 3, 5))
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    v = round(150 + 105 * y / 255)
    return f"#{v:02X}{v:02X}{v:02X}"

# ---------- SVG masters ----------
def svg(size, width_frac, background=True, tint=None, mono=None, cy=0.5):
    s, tx, ty = placed(size, width_frac, cy)
    defs, body = [], []
    if background:
        defs.append(f'<radialGradient id="bg" cx="{fmt(size / 2)}" cy="{fmt(size * 0.47)}" r="{fmt(size * 0.62)}" gradientUnits="userSpaceOnUse">'
                    f'<stop stop-color="{GLOW}"/><stop offset="1" stop-color="{BG}"/></radialGradient>')
        body.append(f'<rect width="{size}" height="{size}" fill="url(#bg)"/>')
    for k, d in SHAPES:
        p = transform_path(d, s, tx, ty)
        if mono:  # one colour, the fold set back with alpha so the ribbon still reads
            body.append(f'<path d="{p}" fill="{mono}"' + (' fill-opacity="0.55"' if k == "shFold" else "") + "/>")
            continue
        (x1, y1), (x2, y2), stops = GRADS[k]
        cols = [(o, gray(c) if tint else c) for o, c in stops]
        defs.append(f'<linearGradient id="{k}" x1="{fmt(s * x1 + tx)}" y1="{fmt(s * y1 + ty)}" x2="{fmt(s * x2 + tx)}" y2="{fmt(s * y2 + ty)}" gradientUnits="userSpaceOnUse">'
                    + "".join(f'<stop offset="{fmt(o)}" stop-color="{c}"/>' for o, c in cols) + "</linearGradient>")
        body.append(f'<path d="{p}" fill="url(#{k})"/>')
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" fill="none" xmlns="http://www.w3.org/2000/svg">\n'
            f'<defs>{"".join(defs)}</defs>\n' + "\n".join(body) + "\n</svg>\n")

# ---------- Android vector drawables (108 x 108 dp) ----------
A = 108
A_LOGO = 44 / A   # 44 dp wide: its bounding box diagonal (55.5 dp) sits inside the 66 dp safe circle

def vector(paths):
    return ('<?xml version="1.0" encoding="utf-8"?>\n'
            '<vector xmlns:android="http://schemas.android.com/apk/res/android"\n'
            '    xmlns:aapt="http://schemas.android.com/aapt"\n'
            f'    android:width="{A}dp" android:height="{A}dp" android:viewportWidth="{A}" android:viewportHeight="{A}">\n'
            + paths + "</vector>\n")

def foreground():
    s, tx, ty = placed(A, A_LOGO)
    out = ""
    for k, d in SHAPES:
        (x1, y1), (x2, y2), stops = GRADS[k]
        items = "".join(f'                <item android:offset="{fmt(o)}" android:color="#FF{c[1:].upper()}"/>\n' for o, c in stops)
        out += (f'    <path android:pathData="{transform_path(d, s, tx, ty)}">\n'
                '        <aapt:attr name="android:fillColor">\n'
                f'            <gradient android:type="linear" android:startX="{fmt(s * x1 + tx)}" android:startY="{fmt(s * y1 + ty)}"'
                f' android:endX="{fmt(s * x2 + tx)}" android:endY="{fmt(s * y2 + ty)}">\n{items}            </gradient>\n'
                '        </aapt:attr>\n    </path>\n')
    return vector(out)

def monochrome():
    s, tx, ty = placed(A, A_LOGO)
    return vector("".join(f'    <path android:pathData="{transform_path(d, s, tx, ty)}" android:fillColor="#FFFFFFFF"'
                          + (' android:fillAlpha="0.55"' if k == "shFold" else "") + "/>\n" for k, d in SHAPES))

def background():
    return vector(f'    <path android:pathData="M0 0H{A}V{A}H0Z">\n'
                  '        <aapt:attr name="android:fillColor">\n'
                  f'            <gradient android:type="radial" android:centerX="{A / 2:g}" android:centerY="{fmt(A * 0.47)}"'
                  f' android:gradientRadius="{fmt(A * 0.62)}">\n'
                  f'                <item android:offset="0" android:color="#FF{GLOW[1:]}"/>\n'
                  f'                <item android:offset="1" android:color="#FF{BG[1:]}"/>\n'
                  '            </gradient>\n        </aapt:attr>\n    </path>\n')

ADAPTIVE = ('<?xml version="1.0" encoding="utf-8"?>\n'
            '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
            '    <background android:drawable="@drawable/ic_launcher_background"/>\n'
            '    <foreground android:drawable="@drawable/ic_launcher_foreground"/>\n'
            '    <monochrome android:drawable="@drawable/ic_launcher_monochrome"/>\n'
            '</adaptive-icon>\n')

# ---------- write ----------
def write(rel, text):
    path = os.path.join(HERE, rel); os.makedirs(os.path.dirname(path), exist_ok=True); open(path, "w").write(text)

# Logo at 58% of the icon width: iOS and Play. The adaptive layers' visible 72 dp gives 44/72 = 61%.
write("src/icon-1024.svg", svg(1024, 0.58))
write("src/icon-1024-dark.svg", svg(1024, 0.58, background=False))
write("src/icon-1024-tinted.svg", svg(1024, 0.58, background=False, tint=True))
# Android legacy PNGs: the adaptive design as seen through its 72 dp window, i.e. logo at 61%.
write("src/android-legacy.svg", svg(1024, 44 / 72))
# Previews of the adaptive layers at 108 dp scale, masked later.
write("src/android-adaptive-full.svg", svg(1024, A_LOGO))
write("src/android-monochrome.svg", svg(1024, A_LOGO, background=False, mono="#FFFFFF"))

write("android/res/drawable/ic_launcher_foreground.xml", foreground())
write("android/res/drawable/ic_launcher_background.xml", background())
write("android/res/drawable/ic_launcher_monochrome.xml", monochrome())
write("android/res/mipmap-anydpi-v26/ic_launcher.xml", ADAPTIVE)
write("android/res/mipmap-anydpi-v26/ic_launcher_round.xml", ADAPTIVE)

# iOS: the per-size iPhone set Xcode shows as Notification, Settings, Spotlight, App and App Store.
IOS_SIZES = [(20, 2), (20, 3), (29, 2), (29, 3), (40, 2), (40, 3), (60, 2), (60, 3)]
ios_images = [{"filename": f"Icon-{pt}@{sc}x.png", "idiom": "iphone", "scale": f"{sc}x", "size": f"{pt}x{pt}"}
              for pt, sc in IOS_SIZES]
ios_images.append({"filename": "Icon-1024.png", "idiom": "ios-marketing", "scale": "1x", "size": "1024x1024"})
write("ios/AppIcon.appiconset/Contents.json", json.dumps({"images": ios_images, "info": {"author": "xcode", "version": 1}}, indent=2) + "\n")
write("ios/sizes.json", json.dumps([[f"Icon-{pt}@{sc}x.png", pt * sc] for pt, sc in IOS_SIZES] + [["Icon-1024.png", 1024]]))

subprocess.run(["node", os.path.join(HERE, "rasterize.js")], check=True)
os.remove(os.path.join(HERE, "ios/sizes.json"))  # only a hand-off to rasterize.js
