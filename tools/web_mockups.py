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

def backdrop(w, h, cx, cy, radius=0, n=8, r0=90, step=56):
    """The alt background, dots and signal rings, filling a w x h box (rings centred on cx, cy)."""
    dash = ' stroke-dasharray="3 7"'
    rings = "".join(f'<circle cx="{cx}" cy="{cy}" r="{r0 + step * k}" fill="none" stroke="#5B95FF" stroke-opacity="{.42 - .045 * k:.3f}"'
                    f' stroke-width="{1 if k % 2 else 1.4}"{dash if k % 2 else ""}/>' for k in range(n))
    style = f' style="border-radius:{radius}px"' if radius else ""
    return f'  <div class="wbd"{style}><div class="dots"></div><svg class="rings" viewBox="0 0 {w} {h}">{rings}</svg></div>\n'

def panel(x, y, w, h, radius, cx, cy):
    """A backdrop panel of its own size, placed at x, y."""
    return (f'  <div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;border-radius:{radius}px;overflow:hidden;'
            f'box-shadow:inset 0 0 0 1px rgba(140,175,255,.14)">\n' + backdrop(w, h, cx, cy) + '  </div>\n')

def phone_grid(x, y, rot, scale, cols, rows, dx, dy, screens):
    """A rotated lattice of phones (the about image): rows of phones, alternate rows offset by half a step."""
    out = f'  <div style="position:absolute;left:{x}px;top:{y}px;transform:rotate({rot}deg);transform-origin:0 0">\n'
    k = 0
    for r in range(rows):
        for c in range(cols):
            out += (f'  <div class="device ti" data-k="device" style="left:{c * dx + (dx / 2 if r % 2 else 0):.1f}px;top:{r * dy:.1f}px;'
                    f'transform:scale({scale});transform-origin:0 0">\n    {SCREENS[screens[k % len(screens)]]}\n  </div>\n')
            k += 1
    return out + '  </div>\n'

def chart(x, y, w, k, v, c):
    pts = [(0, 88), (40, 80), (80, 84), (120, 66), (160, 70), (200, 52), (240, 58), (280, 38), (320, 44), (360, 22), (400, 14)]
    line = " ".join(f"{px},{py}" for px, py in pts)
    return (f'  <div class="wchart" style="left:{x}px;top:{y}px;width:{w}px"><div class="k">{k}</div><div class="v">{v}</div><div class="c">{c}</div>'
            f'<svg viewBox="0 0 400 100" preserveAspectRatio="none" height="110"><defs><linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">'
            f'<stop stop-color="#1A69F1" stop-opacity=".45"/><stop offset="1" stop-color="#1A69F1" stop-opacity="0"/></linearGradient></defs>'
            f'<polygon points="0,100 {line} 400,100" fill="url(#cf)"/><polyline points="{line}" fill="none" stroke="#3D86FF" stroke-width="2.5"/>'
            f'<circle cx="400" cy="14" r="5" fill="#fff"/></svg><div class="x"><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span></div></div>\n')

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
    # home "one workflow" section: a close-up of the Home screen with the notification popping out
    "digital-companion-image-elite": (791, 977, [
        phone("home", 410, 812, 0, 2.3, 3), notif(14, 600, 1.5, *ORDER)]),
    # home about section: a lattice of phones on the backdrop
    "about-us-image-1-elite.jpg": (340, 270, [
        backdrop(340, 270, 170, 300), phone_grid(-40, 120, -32, .2, 5, 3, 82, 150, ["home", "channels", "profile", "news", "connectMT", "settings"])]),
    # home about section (the photo of a hand holding a phone): the phone on the backdrop
    "about-us-image-2-elite.jpg": (540, 700, [
        backdrop(540, 700, 270, 640), phone("home", 300, 430, 8, .78, 3), notif(24, 44, .76, *ORDER)]),
    # home benefits card: one phone lying at an angle
    "benefit-image-3-elite.jpg": (376, 182, [
        backdrop(376, 182, 188, 200, n=6, r0=50, step=40), phone("home", 188, 92, -58, .23, 3)]),
    # about page (hand holding a phone): tilted phone, notification and profit card
    "about-us-image.jpg": (705, 660, [
        backdrop(705, 660, 352, 620), phone("home", 330, 400, -14, .82, 3), notif(30, 46, .82, *ORDER), stat(452, 470, 1.0, *PROFIT)]),
    # about page, how it works 1: Channel Settings, straight
    "how-it-work-image-1": (530, 980, [phone("settings", 265, 490, 0, 1.4)]),
    # about page, how it works 2: phone in a backdrop panel with a profit chart card below
    "how-it-work-image-2": (530, 1050, [
        panel(0, 0, 530, 760, 40, 265, 700), phone("profile", 265, 470, 0, .92, 3),
        chart(24, 690, 433, "Total profit", "+$3,482.60", "Aurum Gold Signals · last 90 days")]),
    # contact page (hand holding a phone): the phone with the Breakeven notification
    "contact-us-image.jpg": (578, 750, [
        backdrop(578, 750, 289, 700), phone("home", 300, 470, 6, .84, 3), notif(30, 50, .8, *BREAKEVEN)]),
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
for key, (w, h, parts) in PAGES.items():
    name, ext = (key.rsplit(".", 1) + ["png"])[:2]
    with open(os.path.join(ROOT, "src", f"web-{name}.html"), "w") as f:
        f.write(HEAD.format(w=w, h=h, name=name) + "".join(parts) + TAIL)
    sizes.append(f"{name} {w} {h} {ext}")
with open(os.path.join(ROOT, "src", "web-sizes.txt"), "w") as f:
    f.write("# name width height format (CSS px; rendered at 2x; png = transparent, jpg = opaque), written by tools/web_mockups.py\n" + "\n".join(sizes) + "\n")
print("\n".join(sizes))
