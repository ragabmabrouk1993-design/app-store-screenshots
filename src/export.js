/* Figma export helper (see figma/build.py). kit.js loads it when the URL hash starts with #fx=.
     #fx=meta     describe the layers in <pre id="fx-meta"> (read with --dump-dom): for every child of the canvas its
                  name, frame and rotation, and every text Figma can hold as live text (lines, fonts, colors, place)
     #fx=bg       the background only: canvas fill, grid/dots, rings, price line, chart, clouds, paths
     #fx=layer-N  child N of the canvas alone, on a transparent page
     #fx=text-N   child N alone and unrotated, with its live text hidden: the image under the Figma text
     #fx=local-N  the same with the text drawn (build.py compares the two to find where each text's glyphs are)
   Sizes and positions in the metadata are Figma pixels: the 440pt canvas becomes a 1284px frame. A text stays in the
   image when Figma could not show it the same way: covered (keyboard, tab bar), faded by a mask, rotated inside its
   layer, emoji, or keyboard keys. */
(function () {
  const mode = (location.hash.match(/^#fx=([\w-]+)/) || [])[1];
  if (!mode) return;
  const S = 1284 / 440;
  const canvas = document.querySelector('.canvas');
  const kids = [...canvas.children];
  const css = el => getComputedStyle(el);
  const r2 = v => Math.round(v * 100) / 100;
  const zOf = el => { const z = css(el).zIndex; return z === 'auto' ? 0 : +z; };
  const PHONE_Z = 3;
  const isBg = el => zOf(el) < PHONE_Z && el.matches('.lgrid, .bgdots, .grid, .glow, .pano, '
    + '[data-deco="cloud"], [data-deco="path"], [data-deco="chart"], [data-deco="rings"], [data-deco="wave"]');
  const CARDS = { otp: 'Verification code', picker: 'Add from Telegram', ok: 'Account connected', calc: 'Lot size calculator',
    wl: 'Win rate', evc: 'Event details', zin: 'Input fields', encp: 'Encryption badge' };
  const DECO = { sparkle: 'Sparkle', plane3d: 'Paper plane', plane: 'Plane', arrow: 'Arrow', candles: 'Candles',
    goldbars: 'Gold bars', coin: 'Coin', padlock: 'Padlock', cloud: 'Cloud', path: 'Dashed path' };
  const nameOf = el => {
    if (el.classList.contains('head')) return 'Title';
    if (el.classList.contains('device')) {
      const app = el.querySelector('.app');
      return 'Phone · ' + (app.dataset.screen || (app.querySelector('[data-settings]') ? 'settings' : 'app'));
    }
    if (el.classList.contains('notif')) return 'Notification · ' + el.querySelector('.h b').textContent.trim();
    if (el.classList.contains('pop')) return 'Card · ' + (CARDS[[...el.classList].find(c => CARDS[c])] || 'card');
    if (el.dataset.deco) return DECO[el.dataset.deco] || el.dataset.deco;
    return el.className || el.tagName.toLowerCase();
  };
  const hide = el => el.style.setProperty('visibility', 'hidden', 'important');
  const only = keep => kids.forEach(el => { if (!keep(el)) hide(el); });

  // ---------------------------------------------------------------- colors, fonts
  const rgba = c => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return [0, 0, 0, c === 'transparent' ? 0 : 1];
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    return [r2(p[0] / 255 * 1e4) / 1e4, r2(p[1] / 255 * 1e4) / 1e4, r2(p[2] / 255 * 1e4) / 1e4, p.length > 3 ? p[3] : 1];
  };
  const splitTop = s => {             // split on the commas that are not inside parentheses
    const out = []; let depth = 0, cur = '';
    for (const ch of s) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && !depth) { out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    return [...out, cur.trim()];
  };
  const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const EMOJI = /[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\u200D\uFE0F]/u;
  const SYSTEM = /^(SF Pro( Text| Display)?|BlinkMacSystemFont|system-ui|-apple-system|ui-sans-serif|sans-serif)$/i;
  const WS = /^[ \t\n\r\f]$/;
  const CASE = { uppercase: 'UPPER', lowercase: 'LOWER', capitalize: 'TITLE' };
  const pen = document.createElement('canvas').getContext('2d');
  const glyphs = new Map();
  const hasGlyph = (family, weight, ch) => {
    const key = family + '|' + weight + '|' + ch;
    if (!glyphs.has(key)) {
      const w = font => { pen.font = `${weight} 100px ${font}`; return pen.measureText(ch).width; };
      glyphs.set(key, !(w(`"${family}", monospace`) === w('monospace') && w(`"${family}", serif`) === w('serif')));
    }
    return glyphs.get(key);
  };
  // the family Chrome draws a character with, as Figma knows it: Aeonik, SF Pro (system font) or SF Arabic
  const familyOf = (ch, stack, weight) => {
    for (const f of stack.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))) {
      if (SYSTEM.test(f)) break;
      if (hasGlyph(f, weight, ch)) return f;
    }
    return ARABIC.test(ch) ? 'SF Arabic' : 'SF Pro';
  };
  const shadowOf = (v, k) => {
    const m = v !== 'none' && splitTop(v)[0].match(/^(rgba?\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/);
    return m ? { color: rgba(m[1]), x: r2(+m[2] * k * S), y: r2(+m[3] * k * S), blur: r2(+m[4] * k * S) } : null;
  };

  // ---------------------------------------------------------------- what covers or clips a text
  const paints = el => {
    if (el instanceof SVGElement || /^(IMG|CANVAS|VIDEO)$/.test(el.tagName)) return true;
    const cs = css(el);
    if (+cs.opacity === 0) return false;
    if (rgba(cs.backgroundColor)[3] > 0.2) return true;
    const bi = cs.backgroundImage;
    if (bi !== 'none' && (/url\(/.test(bi) || Math.max(0, ...(bi.match(/rgba?\([^)]*\)/g) || []).map(c => rgba(c)[3])) > 0.2)) return true;
    return !!cs.backdropFilter && cs.backdropFilter !== 'none';
  };
  // y (px) from which a top-to-bottom linear-gradient mask is fully opaque; null when it is not that kind of mask
  const maskStart = mask => {
    const m = mask.match(/^linear-gradient\((.*)\)$/);
    if (!m) return null;
    const args = splitTop(m[1]);
    if (/^(to bottom|180deg)$/.test(args[0])) args.shift();
    let from = 0;
    for (const a of args) {
      const s = a.match(/^(.*?)\s+(-?[\d.]+)px$/);
      if (!s) return null;
      if (rgba(s[1])[3] < 1) from = null; else if (from === null) from = +s[2];
    }
    return from;
  };
  const radius = (v, w) => parseFloat(v) * (v.trim().split(' ')[0].endsWith('%') ? w / 100 : 1);

  // the text of a block element in runs that flow together: inline children join in, anything else
  // (an icon, a flex item, a nested block) starts a new run and is read as its own block
  const SKIP = '.kb, svg, script, style';
  const segments = B => {
    const segs = []; let cur = null;
    const walk = node => {
      for (const c of node.childNodes) {
        if (c.nodeType === Node.TEXT_NODE) {
          if (cur) cur.push(c); else if (c.nodeValue.trim()) segs.push(cur = [c]);
        } else if (c.nodeType === Node.ELEMENT_NODE) {
          if (c.matches(SKIP)) { cur = null; continue; }
          const d = css(c).display;
          if (d === 'none') continue;
          if (d === 'inline' || d === 'contents') walk(c); else cur = null;
        }
      }
    };
    walk(B);
    return segs;
  };

  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;left:0;top:0;white-space:pre;unicode-bidi:plaintext;direction:ltr;font:16px system-ui;opacity:0';
  const visualOrder = rects => rects.map((r, j) => [r, j]).filter(([r]) => r).sort((a, b) => (a[0].left + a[0].right) - (b[0].left + b[0].right)).map(([, j]) => j).join();
  // Figma lays out each line on its own and takes its direction from the first strong letter. Find the mark
  // (none, RLM or LRM) that makes it order this line the way Chrome did in the right-to-left layout.
  const bidiMark = (chars, line) => {
    const want = visualOrder(chars.map(c => (WS.test(c.ch) ? null : c.rect)));
    if (!probe.isConnected) document.body.append(probe);
    for (const mark of ['', '\u200F', '\u200E']) {
      probe.textContent = mark + line;
      const n = probe.firstChild;
      const got = visualOrder([...line].map((ch, j) => {
        if (WS.test(ch)) return null;
        const r = document.createRange(); r.setStart(n, mark.length + j); r.setEnd(n, mark.length + j + 1);
        return [...r.getClientRects()].find(q => q.width > 0) || null;
      }));
      if (got === want) return mark;
    }
    return '\u200F';
  };

  // Figma alignment: the text-align of a paragraph; for a single line, also where it grows from when it is
  // edited (a centered button label grows both ways, the time at the end of a row grows to the left)
  const anchorOf = (B, lines) => {
    const cs = css(B), rtl = cs.direction === 'rtl';
    const ta = cs.textAlign;
    let a = /center/.test(ta) ? 'CENTER' : ta === 'right' ? 'RIGHT' : ta === 'left' ? 'LEFT' : (ta === 'end') !== rtl ? 'RIGHT' : 'LEFT';
    if (lines > 1) return a;
    if (/flex/.test(cs.display)) {
      const col = cs.flexDirection.startsWith('column'), j = col ? cs.alignItems : cs.justifyContent;
      if (j === 'center') return 'CENTER';
      if (/(flex-)?end/.test(j)) return rtl ? 'LEFT' : 'RIGHT';
    }
    const p = B.parentElement, ps = p && css(p);
    if (ps && /flex/.test(ps.display) && !ps.flexDirection.startsWith('column') && ps.justifyContent === 'space-between'
      && B === [...p.children].filter(c => css(c).position !== 'absolute').pop()) return rtl ? 'LEFT' : 'RIGHT';
    return a;
  };

  // ---------------------------------------------------------------- one text block
  function textItem(B, nodes, L) {
    if (!nodes.map(n => n.nodeValue).join('').trim()) return null;
    // scale and opacity between the text and its layer; rotation, filters or blending keep it in the image
    let k = 1, opacity = 1;
    for (let e = B; ; e = e.parentElement) {
      const cs = css(e);
      opacity *= +cs.opacity;
      if (cs.filter !== 'none' || cs.mixBlendMode !== 'normal' || cs.rotate !== 'none' || cs.scale !== 'none') return null;
      if (e === L.el) break;
      if (cs.transform !== 'none') {
        const m = new DOMMatrix(cs.transform);
        if (!m.is2D || Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6 || m.a <= 0 || Math.abs(m.a - m.d) > 1e-6) return null;
        k *= m.a;
      }
    }
    // characters with their boxes, split into the lines Chrome drew
    let chars = [];
    for (const n of nodes) {
      const el = n.parentElement;
      if (css(el).visibility !== 'visible') continue;
      let i = 0;
      for (const ch of n.nodeValue) {
        const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + ch.length);
        chars.push({ ch, el, n, i, rect: [...r.getClientRects()].find(q => q.width > 0) || null });
        i += ch.length;
      }
    }
    // an emoji at either end stays in the artwork ("Hi, Alex" is text, the wave is not); one inside keeps it all there
    const solidAt = chars.map((c, j) => (!WS.test(c.ch) && !EMOJI.test(c.ch) ? j : -1)).filter(j => j >= 0);
    if (!solidAt.length) return null;
    chars = chars.slice(solidAt[0], solidAt[solidAt.length - 1] + 1);
    if (chars.some(c => EMOJI.test(c.ch))) return null;
    const lines = []; let cur = null;
    for (const c of chars) {
      if (WS.test(c.ch)) { if (cur) cur.chars.push(c); continue; }
      if (!c.rect) continue;
      if (!cur || (c.rect.top + c.rect.bottom) / 2 > cur.bottom)
        lines.push(cur = { chars: [], top: c.rect.top, bottom: c.rect.bottom, left: c.rect.left, right: c.rect.right, first: c.rect });
      cur.top = Math.min(cur.top, c.rect.top); cur.bottom = Math.max(cur.bottom, c.rect.bottom);
      cur.left = Math.min(cur.left, c.rect.left); cur.right = Math.max(cur.right, c.rect.right);
      cur.chars.push(c);
    }
    if (!lines.length) return null;
    for (const ln of lines) {                  // collapse spaces the way CSS does
      const cs = ln.chars;
      while (WS.test(cs[cs.length - 1].ch)) cs.pop();
      ln.chars = cs.filter((c, j) => !(WS.test(c.ch) && j && WS.test(cs[j - 1].ch)));
    }
    const box = { left: Math.min(...lines.map(l => l.left)), right: Math.max(...lines.map(l => l.right)),
      top: Math.min(...lines.map(l => l.top)), bottom: Math.max(...lines.map(l => l.bottom)) };

    // covered by something else in the same layer (keyboard, tab bar, sheet)?
    for (const ln of lines) {
      const solid = ln.chars.filter(c => !WS.test(c.ch));
      for (const c of [solid[0], solid[solid.length >> 1], solid[solid.length - 1]]) {
        for (const el of document.elementsFromPoint((c.rect.left + c.rect.right) / 2, (c.rect.top + c.rect.bottom) / 2)) {
          if (el === B || B.contains(el) || el.contains(B)) break;
          if (paints(el)) return null;
        }
      }
    }
    // clipped (overflow) or faded (mask) on the way up to the layer?
    const csB = css(B);
    const trunc = csB.textOverflow === 'ellipsis' && B.scrollWidth > B.clientWidth + 0.5;
    let clip = null;
    for (let e = B; ; e = e.parentElement) {
      const cs = css(e), r = e.getBoundingClientRect(), ke = e.offsetWidth ? r.width / e.offsetWidth : 1;
      const mask = cs.webkitMaskImage || cs.maskImage;
      if (mask && mask !== 'none') {
        const from = maskStart(mask);
        if (from === null || box.top < r.top + from * ke - 0.5) return null;
      }
      if ((cs.overflowX !== 'visible' || cs.overflowY !== 'visible') && !(e === B && trunc)) {
        const c = { left: r.left + e.clientLeft * ke, top: r.top + e.clientTop * ke,
          right: r.left + (e.clientLeft + e.clientWidth) * ke, bottom: r.top + (e.clientTop + e.clientHeight) * ke };
        if (box.right <= c.left || box.left >= c.right || box.bottom <= c.top || box.top >= c.bottom) return null;
        // a glyph box taller than its own one-line box (line-height: 1) is not a cut; overflowing a parent is
        const cut = box.left < c.left - 0.5 || box.right > c.right + 0.5 || (e !== B && (box.top < c.top - 0.5 || box.bottom > c.bottom + 0.5));
        if (!clip && cut) {
          if (!L.clipIds.has(e)) {
            L.clipIds.set(e, L.clips.length);
            const w = e.offsetWidth;
            L.clips.push({ name: 'Clip · ' + (e.classList[0] || e.tagName.toLowerCase()),
              x: r2((c.left - L.P.x) * S), y: r2((c.top - L.P.y) * S), w: r2((c.right - c.left) * S), h: r2((c.bottom - c.top) * S),
              radius: [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map(v => r2(radius(v, w) * ke * S)) });
          }
          clip = L.clipIds.get(e);
        }
      }
      if (e === L.el) break;
    }

    // styles per character, joined into runs; lines become explicit line breaks
    const ar = document.documentElement.lang === 'ar';
    const base = new Map();
    const baseOf = el => {
      if (!base.has(el)) {
        const cs = css(el);
        base.set(el, { stack: cs.fontFamily, weight: +cs.fontWeight, cssSize: parseFloat(cs.fontSize), size: r2(parseFloat(cs.fontSize) * k * S),
          color: rgba(cs.webkitTextFillColor || cs.color), ls: r2((parseFloat(cs.letterSpacing) || 0) * k * S), tcase: CASE[cs.textTransform] || 'ORIGINAL',
          shadow: shadowOf(cs.textShadow, k),
          stroke: parseFloat(cs.webkitTextStrokeWidth) ? { w: r2(parseFloat(cs.webkitTextStrokeWidth) * k * S), color: rgba(cs.webkitTextStrokeColor) } : null });
      }
      return base.get(el);
    };
    let str = '';
    const runs = [], shadowed = [];
    const push = (ch, el, family) => {
      const b = baseOf(el);
      const st = { family, weight: b.weight, cssSize: b.cssSize, size: b.size, color: b.color, ls: b.ls, tcase: b.tcase };
      const key = JSON.stringify(st), last = runs[runs.length - 1];
      if (last && last.key === key) last.e += ch.length;
      else runs.push({ s: str.length, e: str.length + ch.length, key, ...st });
      if (b.shadow && !/[\s\u200E\u200F]/.test(ch)) shadowed.push([str.length, str.length + ch.length, JSON.stringify(b.shadow)]);
      str += ch;
    };
    lines.forEach((ln, li) => {
      const fams = ln.chars.map(c => (WS.test(c.ch) ? null : familyOf(c.ch, baseOf(c.el).stack, baseOf(c.el).weight)));
      // a space between two Arabic words is typed in SF Arabic, like the words around it
      fams.forEach((f, j) => {
        if (f) return;
        const prev = fams.slice(0, j).reverse().find(Boolean), next = fams.slice(j + 1).find(Boolean);
        fams[j] = ar && prev === 'SF Arabic' && next === 'SF Arabic' ? 'SF Arabic' : (prev || next);
      });
      if (li) push('\n', ln.chars[0].el, fams[0]);
      if (ar) {
        const mark = bidiMark(ln.chars, ln.chars.map(c => (WS.test(c.ch) ? ' ' : c.ch)).join(''));
        if (mark) push(mark, ln.chars[0].el, fams[0]);
      }
      ln.chars.forEach((c, j) => push(WS.test(c.ch) ? ' ' : c.ch, c.el, fams[j]));
    });
    runs.forEach(r => delete r.key);
    if (runs.every(r => r.color[3] === 0)) return null;

    // one shadow on all the text is a Figma effect; a shadow on part of it (the blue word) becomes a blurred copy
    let shadow = null, glow = null;
    if (shadowed.length) {
      const solidCount = [...str].filter(ch => !/[\s\u200E\u200F]/.test(ch)).length;
      const first = JSON.parse(shadowed[0][2]);
      if (shadowed.length === solidCount && shadowed.every(s => s[2] === shadowed[0][2])) shadow = first;
      else glow = { ...first, ranges: shadowed.map(s => [s[0], s[1]]) };
    }
    const strokes = chars.filter(c => !WS.test(c.ch) && c.rect).map(c => JSON.stringify(baseOf(c.el).stroke));
    const stroke = strokes[0] !== 'null' && strokes.every(s => s === strokes[0]) ? JSON.parse(strokes[0]) : null;

    // geometry in layer-local Figma pixels; the top of the first line box from its glyph box and line height
    const X = v => r2((v - L.P.x) * S), Y = v => r2((v - L.P.y) * S);
    const lhCss = csB.lineHeight === 'normal' ? null : parseFloat(csB.lineHeight) * k;
    const pitch = lines.length > 1 ? (lines[lines.length - 1].first.top - lines[0].first.top) / (lines.length - 1) : null;
    const lh = pitch || lhCss || lines[0].first.height;
    const top = lines[0].first.top - (lh - lines[0].first.height) / 2;
    const anchor = anchorOf(B, lines.length);
    const out = { name: B.closest('.hl') ? 'Headline' : B.closest('.sl') ? 'Subtitle' : null,
      chars: str, runs, lh: r2(lh * S), align: anchor,
      x1: X(box.left), x2: X(box.right), y: Y(top), opacity: r2(opacity), shadow, glow, stroke, clip,
      region: [box.left, box.top, box.right, box.bottom].map(v => r2(v * S)) };
    if (trunc) {
      const r = B.getBoundingClientRect(), ke = r.width / B.offsetWidth;
      const left = r.left + (B.clientLeft + parseFloat(csB.paddingLeft)) * ke;
      out.trunc = { x: X(left), w: r2((B.clientWidth - parseFloat(csB.paddingLeft) - parseFloat(csB.paddingRight)) * ke * S) };
    }
    const spans = [];                         // what text-N hides: exactly these characters
    for (const c of chars) {
      const last = spans[spans.length - 1];
      if (last && last[0] === c.n && last[2] === c.i) last[2] += c.ch.length; else spans.push([c.n, c.i, c.i + c.ch.length]);
    }
    return { out, spans, els: [...new Set(chars.map(c => c.el))] };
  }

  // ---------------------------------------------------------------- layers
  // A layer as Figma holds it: alone and unrotated; its Figma frame gets the rotation back. Its frame and rotation
  // come from where it sits unrotated; it is then measured and drawn M pt from the top-left of the page, on a
  // window big enough for all of it (build.py), with nothing clipping it: a rotated phone reaches past the canvas.
  const M = 200;
  function open(i) {
    const el = kids[i], cs = css(el);
    kids.forEach((k, j) => (j === i ? k.style.removeProperty('visibility') : hide(k)));
    const t = cs.transform, [ox, oy] = cs.transformOrigin.split(' ').map(parseFloat);
    const m = t === 'none' ? new DOMMatrix() : new DOMMatrix(t);
    const rigid = cs.rotate === 'none' && cs.scale === 'none' && cs.translate === 'none' && m.is2D
      && Math.abs(m.a * m.a + m.b * m.b - 1) < 1e-4 && Math.abs(m.a - m.d) < 1e-4 && Math.abs(m.b + m.c) < 1e-4;
    const prev = [el.style.getPropertyValue('transform'), el.style.getPropertyPriority('transform')];
    for (const n of [document.documentElement, document.body, canvas]) n.style.setProperty('overflow', 'visible', 'important');
    el.style.setProperty('transform', 'none', 'important');
    const r = el.getBoundingClientRect();
    const tx = r.left + ox - (m.a * ox + m.c * oy) + m.e, ty = r.top + oy - (m.b * ox + m.d * oy) + m.f;
    el.style.setProperty('transform', `translate(${M - r.left}px, ${M - r.top}px)`, 'important');
    const at = el.getBoundingClientRect();
    return { el, prev, ok: rigid, P: { x: at.left, y: at.top }, clips: [], clipIds: new Map(),
      frame: { x: r2(r.left * S), y: r2(r.top * S), w: r2(r.width * S), h: r2(r.height * S) },
      transform: t === 'none' ? null : [[r2(m.a * 1e6) / 1e6, r2(m.c * 1e6) / 1e6, r2(tx * S)], [r2(m.b * 1e6) / 1e6, r2(m.d * 1e6) / 1e6, r2(ty * S)]] };
  }
  const close = L => {
    kids.forEach(k => k.style.removeProperty('visibility'));
    if (L.prev[0]) L.el.style.setProperty('transform', ...L.prev); else L.el.style.removeProperty('transform');
  };
  function analyze(L) {
    if (!L.ok) return [];
    const blocks = [L.el, ...L.el.querySelectorAll('*')].filter(el => !(el instanceof SVGElement) && !el.closest(SKIP)
      && !/^(inline|contents|none)$/.test(css(el).display) && el.getClientRects().length);
    const items = [];
    for (const B of blocks) for (const nodes of segments(B)) {
      const t = textItem(B, nodes, L);
      if (t) items.push(t);
    }
    return items;
  }

  function meta() {
    const layers = kids.map((el, i) => ({ el, i, z: zOf(el) })).filter(o => !isBg(o.el))
      .sort((a, b) => a.z - b.z || a.i - b.i)
      .map(({ el, i, z }) => {
        const L = open(i), items = analyze(L);
        close(L);
        return items.length
          ? { kind: 'text', i, z, name: nameOf(el), frame: L.frame, transform: L.transform, origin: [r2(L.P.x * S), r2(L.P.y * S)],
              clips: L.clips, texts: items.map(t => t.out) }
          : { kind: 'img', i, z, name: nameOf(el) };
      });
    probe.remove();
    const pre = document.createElement('pre');
    pre.id = 'fx-meta';
    pre.textContent = JSON.stringify({ lang: document.documentElement.lang || 'en', layers });
    document.body.append(pre);
  }

  const run = () => {
    // every element answers hit tests, so anything drawn over a text is found
    document.head.append(Object.assign(document.createElement('style'), { textContent: '*{pointer-events:auto!important}'
      + '::highlight(fx){color:transparent;-webkit-text-fill-color:transparent;-webkit-text-stroke-color:transparent;text-shadow:none;text-decoration-color:transparent}' }));
    if (mode === 'meta') return meta();
    if (mode === 'bg') return only(isBg);
    for (const n of [document.documentElement, document.body, canvas]) n.style.setProperty('background', 'transparent', 'important');
    const [, kind, n] = mode.match(/^(layer|text|local)-(\d+)$/) || [];
    if (kind === 'layer') return only(el => el === kids[+n]);
    if (!kind) return;
    const L = open(+n), items = analyze(L);
    // a frosted panel (97% fill over a blurred backdrop) hides what is behind it; drawn alone for Figma, where
    // nothing behind it gets blurred, it is made solid so the phone under the notification doesn't show through
    for (const el of [L.el, ...L.el.querySelectorAll('*')]) {
      const cs = css(el);
      if (!cs.backdropFilter || cs.backdropFilter === 'none') continue;
      const solid = v => v.replace(/rgba\(([^,]+),([^,]+),([^,]+),\s*([\d.]+)\)/g, (m, r, g, b, a) => (+a > 0 ? `rgb(${r},${g},${b})` : m));
      el.style.setProperty('background-image', solid(cs.backgroundImage), 'important');
      el.style.setProperty('background-color', solid(cs.backgroundColor), 'important');
    }
    // no text shadows on live text in either image (the glow is its own Figma layer), so the two differ only in the glyphs
    for (const t of items) for (const el of t.els) if (css(el).textShadow !== 'none') el.style.setProperty('text-shadow', 'none', 'important');
    if (kind === 'text') {
      const h = new Highlight();
      for (const t of items) for (const [nd, s, e] of t.spans) { const r = document.createRange(); r.setStart(nd, s); r.setEnd(nd, e); h.add(r); }
      CSS.highlights.set('fx', h);
    }
  };
  // a timer, not requestAnimationFrame: --dump-dom renders no frames
  document.fonts.ready.then(() => setTimeout(run, 60));
})();
