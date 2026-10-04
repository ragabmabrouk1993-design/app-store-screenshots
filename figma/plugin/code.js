// Tragram App Store screenshots -> Figma.
// Import: Plugins > Development > Import plugin from manifest... (this folder), then run it and choose
// the figma/import folder made by figma/build.py. Builds a new page with one section per set and one
// 1284 x 2778 frame per screenshot. Every text is live Figma text: headline, subtitle, badge, and all the
// text on the phone screens, cards and notifications. The artwork under the text is images.

figma.showUI(__html__, { width: 360, height: 260, title: 'Tragram screenshots' });

const hashes = {};
const say = text => figma.ui.postMessage({ type: 'progress', text });
const paint = c => ({ type: 'SOLID', color: { r: c[0], g: c[1], b: c[2] }, opacity: c[3] });
const rgba = c => ({ r: c[0], g: c[1], b: c[2], a: c[3] });

figma.ui.onmessage = async msg => {
  if (msg.type === 'image') {
    hashes[msg.name] = figma.createImage(msg.bytes).hash;
    figma.ui.postMessage({ type: 'ack' });
  } else if (msg.type === 'build') {
    try {
      await build(msg.manifest);
    } catch (e) {
      console.error(e);
      say('Import failed: ' + e.message);
      figma.notify('Import failed: ' + e.message, { error: true });
    }
  }
};

// ---------------------------------------------------------------- fonts
// The design's families, then stand-ins Figma always has (Google Fonts) when they are not installed
const CHOICES = {
  'Aeonik': () => [['Aeonik'], ['Inter']],
  'SF Pro': size => [size >= 20 ? ['SF Pro Display', 'SF Pro', 'SF Pro Text'] : ['SF Pro Text', 'SF Pro', 'SF Pro Display'], ['Inter']],
  'SF Arabic': () => [['SF Arabic'], ['Noto Sans Arabic', 'IBM Plex Sans Arabic']],
};

function weightOf(style) {
  const s = style.toLowerCase().replace(/[\s_-]/g, '');
  if (/italic|oblique|condensed|compressed|expanded|narrow|wide|rounded|mono/.test(s)) return null;
  for (const [re, w] of [[/thin|hairline/, 100], [/ultralight|extralight/, 200], [/semibold|demibold/, 600],
    [/extrabold|ultrabold|heavy/, 800], [/black/, 900], [/light/, 300], [/medium/, 500], [/bold/, 700],
    [/^(regular|normal|book|roman|plain)$/, 400]]) if (re.test(s)) return w;
  return null;
}

async function fontBook() {
  const families = new Map();               // family -> weight -> style
  for (const { fontName: f } of await figma.listAvailableFontsAsync()) {
    const w = weightOf(f.style);
    if (w === null) continue;
    if (!families.has(f.family)) families.set(f.family, new Map());
    const styles = families.get(f.family);
    if (!styles.has(w) || f.style.length < styles.get(w).length) styles.set(w, f.style);
  }
  // CSS font matching: the weight itself, else the nearest one in the direction CSS looks first
  const nearest = (styles, w) => {
    if (styles.has(w)) return styles.get(w);
    const up = [...styles.keys()].sort((a, b) => a - b), down = [...up].reverse();
    const pick = w > 500 ? up.find(x => x > w) ?? down.find(x => x < w)
      : w < 400 ? down.find(x => x < w) ?? up.find(x => x > w)
      : up.find(x => x > w && x <= 500) ?? down.find(x => x < w) ?? up.find(x => x > w);
    return styles.get(pick);
  };
  const loads = new Map(), missing = new Set(), picked = new Map();
  const load = font => {
    const id = font.family + '|' + font.style;
    if (!loads.has(id)) loads.set(id, figma.loadFontAsync(font).then(() => true, () => false));
    return loads.get(id);
  };
  await load({ family: 'Inter', style: 'Regular' });   // the font a new text node starts with
  return {
    missing,
    async get(family, weight, size) {
      const key = family + '|' + weight + '|' + (size >= 20);
      if (picked.has(key)) return picked.get(key);
      const [wanted, standIns] = (CHOICES[family] || (() => [[family], ['Inter']]))(size);
      let font = null;
      for (const fam of [...wanted, ...standIns]) {
        if (!families.has(fam)) continue;
        const f = { family: fam, style: nearest(families.get(fam), weight) };
        if (await load(f)) { font = f; break; }
      }
      if (!font || !wanted.includes(font.family)) missing.add(family);
      if (!font) { font = { family: 'Inter', style: 'Regular' }; await load(font); }
      picked.set(key, font);
      return font;
    },
  };
}

// ---------------------------------------------------------------- nodes
// Place a node at (x, y) inside its parent, whether or not the parent (a section) has its own coordinates
function place(node, x, y) {
  node.x = x;
  node.y = y;
  const p = node.parent.absoluteTransform, a = node.absoluteTransform;
  if (Math.abs(a[0][2] - (p[0][2] + x)) > 0.5 || Math.abs(a[1][2] - (p[1][2] + y)) > 0.5) {
    node.x = p[0][2] + x;
    node.y = p[1][2] + y;
  }
}

function image(parent, l, name) {
  const r = figma.createRectangle();
  r.name = name;
  r.resize(l.w, l.h);
  r.fills = [{ type: 'IMAGE', imageHash: hashes[l.file], scaleMode: 'FILL' }];
  parent.appendChild(r);
  r.x = l.x;
  r.y = l.y;
  return r;
}

async function text(parent, t, ox, oy, fonts) {
  const n = figma.createText();
  parent.appendChild(n);
  const runFonts = [];
  for (const r of t.runs) runFonts.push(await fonts.get(r.family, r.weight, r.cssSize));
  n.fontName = runFonts[0];
  n.characters = t.chars;
  t.runs.forEach((r, k) => {
    n.setRangeFontName(r.s, r.e, runFonts[k]);
    n.setRangeFontSize(r.s, r.e, r.size);
    n.setRangeFills(r.s, r.e, [paint(r.color)]);
    if (r.ls) n.setRangeLetterSpacing(r.s, r.e, { unit: 'PIXELS', value: r.ls });
    if (r.tcase !== 'ORIGINAL') n.setRangeTextCase(r.s, r.e, r.tcase);
  });
  n.lineHeight = { unit: 'PIXELS', value: t.lh };
  n.textAlignHorizontal = t.align;
  if (t.trunc) {                            // one line cut with "…" at a fixed width, as in the app
    n.textAutoResize = 'NONE';
    n.resize(Math.max(1, t.trunc.w), t.lh);
    n.textAutoResize = 'HEIGHT';
    try { n.textTruncation = 'ENDING'; n.maxLines = 1; } catch (e) { /* older Figma: no truncation */ }
    n.x = t.trunc.x - ox;
  } else {
    n.textAutoResize = 'WIDTH_AND_HEIGHT';
    n.x = (t.align === 'LEFT' ? t.x1 : t.align === 'RIGHT' ? t.x2 - n.width : (t.x1 + t.x2 - n.width) / 2) - ox;
  }
  n.y = t.y - oy;
  if (t.name) n.name = t.name;
  return n;
}

// Move a text so its glyphs sit exactly where Chrome drew them (font metrics differ a little between the two).
// Only when Figma reports the glyphs' own bounds (not the text box) and they are about the size Chrome drew.
function lineUp(n, t, frame) {
  const b = t.ink && n.absoluteRenderBounds, box = n.absoluteBoundingBox;
  if (!b || !box) return;
  if (Math.abs(b.y - box.y) < 0.5 && Math.abs(b.height - box.height) < 0.5) return;
  const fx = frame.absoluteTransform[0][2], fy = frame.absoluteTransform[1][2];
  const limit = Math.max(...t.runs.map(r => r.size)) / 2;
  const near = (a, c, lo, hi) => a / c > lo && a / c < hi;
  const dx = fx + t.ink[0] + t.ink[2] / 2 - (b.x + b.width / 2);
  const dy = fy + t.ink[1] + t.ink[3] / 2 - (b.y + b.height / 2);
  if (!t.trunc && near(b.width, t.ink[2], 0.85, 1.18) && Math.abs(dx) < limit) n.x += dx;
  if (near(b.height, t.ink[3], 0.8, 1.25) && Math.abs(dy) < limit) n.y += dy;
}

function decorate(n, t, parent) {
  if (t.opacity < 1) n.opacity = t.opacity;
  if (t.stroke) { n.strokes = [paint(t.stroke.color)]; n.strokeWeight = t.stroke.w; n.strokeAlign = 'CENTER'; }
  if (t.shadow) n.effects = [{ type: 'DROP_SHADOW', color: rgba(t.shadow.color), offset: { x: t.shadow.x, y: t.shadow.y },
    radius: t.shadow.blur, visible: true, blendMode: 'NORMAL' }];
  if (t.glow) {                             // a glow on part of the text: a blurred copy of those letters behind it
    const g = n.clone();
    g.name = (t.name || 'Text') + ' glow';
    g.fills = [];
    for (const [s, e] of t.glow.ranges) g.setRangeFills(s, e, [paint(t.glow.color)]);
    g.strokes = [];
    try { g.effects = [{ type: 'LAYER_BLUR', radius: t.glow.blur, visible: true }]; }
    catch (e) { g.effects = [{ type: 'LAYER_BLUR', blurType: 'NORMAL', radius: t.glow.blur, visible: true }]; }
    g.x = n.x + t.glow.x;
    g.y = n.y + t.glow.y;
    parent.insertChild(parent.children.indexOf(n), g);
  }
}

// A layer with text: its artwork, then each text as live text; rotated back into place at the end
async function layerFrame(screen, l, fonts) {
  const f = figma.createFrame();
  f.name = l.name;
  f.fills = [];
  f.clipsContent = false;
  f.resize(Math.max(1, l.w), Math.max(1, l.h));
  screen.appendChild(f);
  f.x = l.x;
  f.y = l.y;
  if (l.image) image(f, l.image, 'Artwork');
  const clips = l.clips.map(c => {          // text partly hidden by the screen edge stays cut off
    const cf = figma.createFrame();
    cf.name = c.name;
    cf.fills = [];
    cf.clipsContent = true;
    cf.resize(Math.max(1, c.w), Math.max(1, c.h));
    f.appendChild(cf);
    cf.x = c.x;
    cf.y = c.y;
    [cf.topLeftRadius, cf.topRightRadius, cf.bottomRightRadius, cf.bottomLeftRadius] = c.radius;
    return cf;
  });
  for (const t of l.texts) {
    const clip = t.clip === null ? null : l.clips[t.clip];
    const parent = clip ? clips[t.clip] : f;
    const n = await text(parent, t, clip ? clip.x : 0, clip ? clip.y : 0, fonts);
    lineUp(n, t, f);
    decorate(n, t, parent);
  }
  if (l.transform) f.relativeTransform = l.transform;
}

async function build(m) {
  say('Checking fonts…');
  const fonts = await fontBook();
  const page = figma.createPage();
  page.name = 'App Store screenshots';
  await figma.setCurrentPageAsync(page);

  const [W, H] = m.size, GAP = 160, PAD = 160, TOP = 240;
  const total = m.sets.reduce((n, s) => n + s.screens.length, 0);
  let y = 0, done = 0;
  for (const set of m.sets) {
    const section = figma.createSection();
    section.name = set.title;
    page.appendChild(section);
    section.x = 0;
    section.y = y;
    section.resizeWithoutConstraints(PAD * 2 + set.screens.length * (W + GAP) - GAP, TOP + H + PAD);
    for (const [k, sc] of set.screens.entries()) {
      say(`Building ${++done}/${total}: ${set.title} · ${sc.name}`);
      const f = figma.createFrame();
      f.name = sc.name;
      f.resize(W, H);
      f.fills = [];
      f.clipsContent = true;
      section.appendChild(f);
      place(f, PAD + k * (W + GAP), TOP);
      for (const l of sc.layers) {
        if (l.type === 'image') image(f, l, l.name);
        else await layerFrame(f, l, fonts);
      }
    }
    y += section.height + 400;
  }
  figma.viewport.scrollAndZoomIntoView(page.children);
  const note = fonts.missing.size
    ? ` Not installed: ${[...fonts.missing].join(', ')} (stand-in fonts used). Install and run again for the exact look.` : '';
  figma.closePlugin(`Imported ${total} screenshots with editable text.${note}`);
}
