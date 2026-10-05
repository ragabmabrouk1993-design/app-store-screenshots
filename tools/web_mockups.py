"""Writes the website mockup pages, src/web-<name>.html, one per image on tragram.app, plus src/web-sizes.txt.

    python3 tools/web_mockups.py

<name> is the image's file name on the site (tragram-web/public/images/<name>.png), and each page has that
image's size in CSS pixels; ./render.sh web renders them at 2x into out/web/<name>.png, transparent.

Every phone is the alt set's titanium phone showing a real app screen; cards and notifications are the alt
set's too. A phone is (screen, centre x, centre y, rotation in degrees, scale, stacking order).
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEV_W, DEV_H = 330, 697.06   # the phone's box at scale 1 (base.css)

SCREENS = {
    "home": '<div class="app" data-screen="home"></div>',
    "channels": '<div class="app" data-screen="channels"></div>',
    "connectMT": '<div class="app" data-screen="connectMT"></div>',
    "profile": '<div class="app" data-screen="profile"></div>',
    "news": '<div class="app" data-screen="news"></div>',
    "settings": '<div class="app"><div data-k="sb"></div><div data-settings data-scroll-to="breakeven" data-top="134"></div></div>',
}

def phone(screen, cx, cy, rot, scale, z=3):
    return (f'  <div class="device ti" data-k="device" style="left:{cx - DEV_W / 2:.1f}px;top:{cy - DEV_H / 2:.1f}px;'
            f'transform:rotate({rot}deg) scale({scale});z-index:{z}">\n    {SCREENS[screen]}\n  </div>\n')

def notif(x, y, scale, title, body, width=404):
    return (f'  <div class="notif" style="left:{x}px;top:{y}px;width:{width}px;transform:scale({scale});z-index:12">\n'
            f'    <div class="ai"></div>\n    <div class="nt"><div class="h"><b>{title}</b><span>now</span></div>'
            f'<div class="bd">{body}</div></div>\n  </div>\n')

def stat(x, y, scale, k, v, c, up=True):
    return (f'  <div class="wstat" style="left:{x}px;top:{y}px;transform:scale({scale})">'
            f'<div class="k">{k}</div><div class="v{" up" if up else ""}">{v}</div><div class="c">{c}</div></div>\n')

ORDER = ("Order executed", "XAUUSD · Buy 0.12 lot @ 4,412.50<br>Copied from Aurum Gold Signals")
BREAKEVEN = ("Breakeven", "TP1 hit on XAUUSD. Stop loss moved to entry.")
PROFIT = ("Total profit", "+$3,482.60", "Aurum Gold Signals · 30 days")

def arch():
    dash = ' stroke-dasharray="3 7"'   # every other ring is dashed, as in the alt backdrop
    rings = "".join(f'<circle cx="302" cy="560" r="{110 + 62 * k}" fill="none" stroke="#5B95FF" stroke-opacity="{.42 - .045 * k:.3f}"'
                    f' stroke-width="{1 if k % 2 else 1.4}"{dash if k % 2 else ""}/>' for k in range(8))
    return f'  <div class="arch"><div class="dots"></div><svg class="rings" viewBox="0 0 604 679">{rings}</svg></div>\n'

PAGES = {
    # home hero: three phones, Channels / Home / channel performance, with the Order executed notification
    "hero-image-elite": (736, 520, [
        phone("channels", 196, 318, -11, .64, 2), phone("profile", 540, 318, 11, .64, 2), phone("home", 368, 372, 0, .72, 4),
        notif(18, 300, .6, *ORDER), stat(560, 34, .78, *PROFIT)]),
    # features / about: one phone each
    "benefits-item-image-1": (380, 769, [phone("home", 190, 384.5, 0, 1.1)]),
    "benefits-item-image-2": (380, 769, [phone("connectMT", 190, 384.5, 0, 1.1)]),
    "benefits-item-image-3": (380, 769, [phone("profile", 190, 384.5, 0, 1.1)]),
    # features / about wide band: three phones fanned out, cropped by the bottom edge
    "why-choose-us-image-v2": (1383, 579, [
        phone("news", 338, 472, -14, 1.08, 2), phone("profile", 1045, 472, 14, 1.08, 2), phone("home", 691, 440, 0, 1.2, 4),
        notif(70, 96, 1.0, *ORDER), stat(1150, 60, 1.05, *PROFIT)]),
    # home why-choose-us: the phone inside an arch of the alt backdrop
    "why-choose-us-image-elite": (604, 679, [
        arch(), phone("home", 312, 486, -7, .86, 3), notif(44, 78, .8, *ORDER)]),
    # home benefits: two leaning phones
    "smart-management-image-elite": (323, 295, [
        phone("channels", 112, 178, -9, .37, 2), phone("home", 214, 166, 8, .39, 3)]),
    # home call to action: Home and Channel Settings, with the Breakeven notification
    "cta-box-img-elite": (548, 514, [
        phone("home", 186, 330, -7, .63, 3), phone("settings", 366, 296, 7, .63, 2), notif(80, 30, .62, *BREAKEVEN)]),
    # testimonials call to action: three small phones
    "testimonial-cta-image-elite": (480, 262, [
        phone("channels", 146, 196, -9, .33, 2), phone("news", 334, 196, 9, .33, 2), phone("home", 240, 170, 0, .36, 3)]),
}

HEAD = """<!doctype html>
<html class="web" style="--w:{w}px;--h:{h}px"><head><meta charset="utf-8"><title>Website · {name}</title>
<link rel="stylesheet" href="base.css"><link rel="stylesheet" href="light.css"><link rel="stylesheet" href="screens.css"><link rel="stylesheet" href="dark.css"><link rel="stylesheet" href="alt.css"><link rel="stylesheet" href="web.css">
</head>
<body>
<div class="canvas light dark alt web">
"""
TAIL = """</div>
<script src="screens.js"></script><script src="settings.js"></script><script src="deco.js"></script><script src="kit.js"></script>
</body></html>
"""

sizes = []
for name, (w, h, parts) in PAGES.items():
    with open(os.path.join(ROOT, "src", f"web-{name}.html"), "w") as f:
        f.write(HEAD.format(w=w, h=h, name=name) + "".join(parts) + TAIL)
    sizes.append(f"{name} {w} {h}")
with open(os.path.join(ROOT, "src", "web-sizes.txt"), "w") as f:
    f.write("# name width height (CSS px; rendered at 2x), written by tools/web_mockups.py\n" + "\n".join(sizes) + "\n")
print("\n".join(sizes))
