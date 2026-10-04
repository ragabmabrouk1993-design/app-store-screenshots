#!/usr/bin/env python3
"""Builds figma/import/ for the Figma plugin in figma/plugin/: manifest.json plus one PNG per layer of every
screenshot. Layers with text (title, phone, cards, notification) become a Figma frame: their image with the
text taken out, and every text on top as live, editable Figma text in the same place and style.

    python3 figma/build.py               # alt + alt-ar
    python3 figma/build.py alt-ar        # one set

Needs Google Chrome in /Applications and Pillow (pip3 install pillow).
"""
import concurrent.futures as cf, html, json, os, re, shutil, subprocess, sys

try:
    from PIL import Image, ImageChops, ImageDraw
except ImportError:
    sys.exit('Pillow is missing: pip3 install pillow')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
OUT = os.path.join(ROOT, 'figma', 'import')
WORK = os.path.join(OUT, '.work')
S = 1284 / 440                      # pages are 440 x 952 pt, screenshots 1284 x 2778 px
SETS = {'alt': 'English', 'alt-ar': 'Arabic'}
PAGE = '440,952'                    # the canvas
BIG = '900,1300'                    # src/export.js measures and draws a layer with text unclipped at (200, 200)


def chrome(page, mode, *args, window=PAGE):
    """One headless Chrome run, retried if it hangs. (No --user-data-dir: a fresh profile makes Chrome wait on the Keychain.)"""
    url = f'file://{ROOT}/src/{page}#fx={mode}'
    for attempt in range(3):
        try:
            return subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--run-all-compositor-stages-before-draw',
                                   f'--window-size={window}', '--virtual-time-budget=5000', '--allow-file-access-from-files', *args, url],
                                  capture_output=True, text=True, timeout=45)
        except subprocess.TimeoutExpired:
            subprocess.run(['pkill', '-f', url])
    sys.exit(f'{page} #fx={mode}: Chrome did not finish')


def meta(page):
    m = re.search(r'<pre id="fx-meta">(.*?)</pre>', chrome(page, 'meta', '--dump-dom', window=BIG).stdout, re.S)
    if not m:
        sys.exit(f'{page}: no layer data (is src/export.js loaded by kit.js?)')
    return json.loads(html.unescape(m.group(1)))


def render(page, mode, path, transparent=True, window=PAGE):
    """Render the page at 2.918x: the canvas becomes 1284 x 2778."""
    chrome(page, mode, f'--force-device-scale-factor={S}', f'--screenshot={path}',
           *(['--default-background-color=00000000'] if transparent else []), window=window)
    return path


def crop(path, file):
    """Crop a transparent render to its visible pixels and save it in the import folder."""
    im = Image.open(path).convert('RGBA')
    box = im.getchannel('A').getbbox()
    if not box:
        return None
    im.crop(box).save(os.path.join(OUT, file), optimize=True)
    return {'file': file, 'x': box[0], 'y': box[1], 'w': box[2] - box[0], 'h': box[3] - box[1]}


def shot(page, mode, file, transparent=True):
    path = render(page, mode, os.path.join(OUT, file), transparent)
    if not transparent:
        im = Image.open(path).convert('RGB')
        im.save(path)
        return {'file': file, 'x': 0, 'y': 0, 'w': im.width, 'h': im.height}
    img = crop(path, file)
    if not img:
        os.remove(path)
    return img


def glyph_boxes(shown, hidden, texts):
    """Where each text's glyphs are, from the difference between the layer with and without its text.
    The plugin lines up Figma's glyphs with these boxes. None for clipped text."""
    a, b = Image.open(shown).convert('RGBA'), Image.open(hidden).convert('RGBA')
    bands = ImageChops.difference(a, b).split()
    diff = ImageChops.lighter(ImageChops.lighter(bands[0], bands[1]), ImageChops.lighter(bands[2], bands[3]))
    mask = diff.point(lambda v: 255 if v > 48 else 0)
    boxes = []
    for j, t in enumerate(texts):
        if t['clip'] is not None:
            boxes.append(None)
            continue
        x1, y1, x2, y2 = t['region']
        pad = max(3, 0.15 * max(r['size'] for r in t['runs']))
        box = (max(0, int(x1 - pad)), max(0, int(y1 - pad)), min(a.width, int(x2 + pad) + 1), min(a.height, int(y2 + pad) + 1))
        if box[2] <= box[0] or box[3] <= box[1]:
            boxes.append(None)
            continue
        part = mask.crop(box)
        own = part.crop((int(x1) - box[0], int(y1) - box[1], int(x2) + 1 - box[0], int(y2) + 1 - box[1]))
        draw = ImageDraw.Draw(part)
        for k, (u1, v1, u2, v2) in enumerate(t2['region'] for t2 in texts):   # neighbours' glyphs are not ours
            if k != j and u1 < box[2] and u2 > box[0] and v1 < box[3] and v2 > box[1]:
                draw.rectangle([u1 - box[0], v1 - box[1], u2 - box[0], v2 - box[1]], fill=0)
        part.paste(own, (int(x1) - box[0], int(y1) - box[1]))
        bb = part.getbbox()
        boxes.append(bb and [box[0] + bb[0], box[1] + bb[1], box[0] + bb[2], box[1] + bb[3]])
    return boxes


def text_layer(page, l, file):
    """A layer with live text: its image without the text, and where the text's glyphs are."""
    stem = f'{page[:-5]}-{l["i"]}'
    hidden = render(page, f'text-{l["i"]}', os.path.join(WORK, stem + '-text.png'), window=BIG)
    shown = render(page, f'local-{l["i"]}', os.path.join(WORK, stem + '-local.png'), window=BIG)
    boxes = glyph_boxes(shown, hidden, l['texts'])
    return crop(hidden, file), boxes


def main():
    sets = sys.argv[1:] or list(SETS)
    shutil.rmtree(OUT, ignore_errors=True)
    os.makedirs(WORK)
    pages = {s: sorted(f for f in os.listdir(os.path.join(ROOT, 'src'))
                       if re.fullmatch(re.escape(s) + r'-\d\d-[\w-]+\.html', f)) for s in sets}
    with cf.ThreadPoolExecutor(4) as pool:
        metas = {(s, p): pool.submit(meta, p) for s in sets for p in pages[s]}
        jobs = {}
        for (s, p), fut in metas.items():
            key = p[len(s) + 1:-5]                       # e.g. 02-telegram
            pre = f'{s}__{key}__'
            jobs[(s, p, 'bg')] = pool.submit(shot, p, 'bg', pre + 'background.png', False)
            for l in fut.result()['layers']:
                file = f"{pre}{l['i']:02d}-{re.sub(r'[^a-z0-9]+', '-', l['name'].split(' · ')[0].lower()).strip('-')}.png"
                jobs[(s, p, l['i'])] = pool.submit(text_layer, p, l, file) if l['kind'] == 'text' else pool.submit(shot, p, f"layer-{l['i']}", file)

    manifest = {'size': [1284, 2778], 'sets': []}
    for s in sets:
        screens = []
        for p in pages[s]:
            m = metas[(s, p)].result()
            key = p[len(s) + 1:-5]
            layers = [dict(jobs[(s, p, 'bg')].result(), type='image', name='Background')]
            title = key
            for l in m['layers']:
                if l['kind'] == 'img':
                    img = jobs[(s, p, l['i'])].result()
                    if img:
                        layers.append(dict(img, type='image', name=l['name']))
                    continue
                img, boxes = jobs[(s, p, l['i'])].result()
                f, (ox, oy) = l['frame'], l['origin']      # image and glyph boxes are drawn with the frame at origin
                texts = []
                for t, b in zip(l['texts'], boxes):
                    t = {k: v for k, v in t.items() if k != 'region'}
                    t['ink'] = b and [round(b[0] - ox, 2), round(b[1] - oy, 2), b[2] - b[0], b[3] - b[1]]
                    texts.append(t)
                    if t['name'] == 'Headline':
                        title = re.sub(r'[\u200e\u200f]', '', t['chars']).replace('\n', ' ')
                layers.append({'type': 'frame', 'name': l['name'], **f, 'transform': l['transform'],
                               'image': img and dict(img, x=round(img['x'] - ox, 2), y=round(img['y'] - oy, 2)),
                               'clips': l['clips'], 'texts': texts})
            screens.append({'key': key, 'name': f'{key[:2]} · {title}', 'lang': m['lang'], 'layers': layers})
        manifest['sets'].append({'key': s, 'title': SETS.get(s, s), 'screens': screens})
    shutil.rmtree(WORK)
    with open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    n = sum(len(x['screens']) for x in manifest['sets'])
    t = sum(len(l['texts']) for x in manifest['sets'] for sc in x['screens'] for l in sc['layers'] if l['type'] == 'frame')
    print(f'{n} screens, {t} live texts, {len(os.listdir(OUT)) - 1} images -> {os.path.relpath(OUT)}')


if __name__ == '__main__':
    main()
