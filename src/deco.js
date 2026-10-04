/* Vector illustrations for the light screenshot style.
   Usage: <div data-deco="coin" style="left:..;top:..;width:..;height:.."></div>
   Each generator returns an <svg> that fills its box. */
(function () {
  let uid = 0;
  const id = p => `${p}${++uid}`;
  const f = n => +n.toFixed(2);

  const D = {
    // ── laurel branch (left side; data-flip for right) ─────────────────────
    laurel(el) {
      const ink = el.dataset.color || '#0B1424';
      const C = [66, 60], R = 54, out = [];
      const leaf = 'M0,0 C3.4,-4.2 3.6,-12 0,-17 C-3.6,-12 -3.4,-4.2 0,0 Z';
      for (let i = 0; i < 7; i++) {
        const t = (112 + i * 20) * Math.PI / 180;
        const x = C[0] + R * Math.cos(t), y = C[1] + R * Math.sin(t);
        const d = [-Math.sin(t), Math.cos(t)], n = [Math.cos(t), Math.sin(t)];
        const s = 1.42 - i * 0.06;
        [[1, 0.62], [-1, 0.5]].forEach(([side, k]) => {
          const v = [d[0] * Math.cos(k) + side * n[0] * Math.sin(k), d[1] * Math.cos(k) + side * n[1] * Math.sin(k)];
          const a = Math.atan2(v[1], v[0]) * 180 / Math.PI + 90;
          out.push(`<path d="${leaf}" transform="translate(${f(x)} ${f(y)}) rotate(${f(a)}) scale(${f(s)})"/>`);
        });
      }
      const tt = (112 + 7 * 20 - 6) * Math.PI / 180, tx = C[0] + R * Math.cos(tt), ty = C[1] + R * Math.sin(tt);
      const ta = Math.atan2(Math.cos(tt), -Math.sin(tt)) * 180 / Math.PI + 90;
      out.push(`<path d="${leaf}" transform="translate(${f(tx)} ${f(ty)}) rotate(${f(ta)}) scale(1.05)"/>`);
      const a0 = 106 * Math.PI / 180, a1 = 246 * Math.PI / 180;
      const stem = `M${f(C[0] + R * Math.cos(a0))},${f(C[1] + R * Math.sin(a0))} A${R},${R} 0 0 1 ${f(C[0] + R * Math.cos(a1))},${f(C[1] + R * Math.sin(a1))}`;
      const flip = el.dataset.flip !== undefined ? 'transform="translate(70 0) scale(-1 1)"' : '';
      return `<svg viewBox="0 0 70 122" width="100%" height="100%"><g ${flip} fill="${ink}"><path d="${stem}" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>${out.join('')}</g></svg>`;
    },

    // ── 4-point sparkle ────────────────────────────────────────────────────
    sparkle(el) {
      const g = id('sp');
      const c = { blue: ['#9CC3FF', '#1A69F1'], white: ['#FFFFFF', '#A9C8FF'] }[el.dataset.tone] || ['#FFE680', '#F5A800'];
      return `<svg viewBox="-1.1 -1.1 2.2 2.2" width="100%" height="100%"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient></defs>
        <path d="M0,-1 C0.1,-0.28 0.28,-0.1 1,0 C0.28,0.1 0.1,0.28 0,1 C-0.1,0.28 -0.28,0.1 -1,0 C-0.28,-0.1 -0.1,-0.28 0,-1Z" fill="url(#${g})"/></svg>`;
    },

    // ── small solid paper plane (for dashed flight paths) ─────────────────
    plane(el) {
      const ink = el.dataset.color || '#0B1424';
      return `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M2.6 11.3 21.4 3.1c.6-.3 1.2.3 1 .9l-6.3 17.3c-.2.6-1.1.7-1.4.1l-3.2-6.1-6.1-2.4c-.6-.3-.6-1.2.1-1.5z" fill="${ink}"/><path d="M11.5 15.3 21.6 3.4" stroke="#fff" stroke-opacity=".55" stroke-width="1.1" fill="none" stroke-linecap="round"/></svg>`;
    },

    // ── big 3D paper plane ────────────────────────────────────────────────
    plane3d(el) {
      const a = id('pa'), b = id('pb'), c = id('pc'), s = id('ps');
      return `<svg viewBox="0 0 220 160" width="100%" height="100%"><defs>
        <linearGradient id="${a}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E4EEFB"/></linearGradient>
        <linearGradient id="${b}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C6D9F3"/><stop offset="1" stop-color="#93B2DE"/></linearGradient>
        <linearGradient id="${c}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5E86C2"/><stop offset="1" stop-color="#2F5698"/></linearGradient>
        <filter id="${s}" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="6"/></filter></defs>
        <ellipse cx="118" cy="150" rx="70" ry="6" fill="#0E2A5A" opacity=".18" filter="url(#${s})"/>
        <path d="M214 10 L104 96 L118 140 Z" fill="url(#${b})"/>
        <path d="M214 10 L104 96 L112 112 Z" fill="url(#${c})"/>
        <path d="M214 10 L6 70 L104 96 Z" fill="url(#${a})"/>
        <path d="M214 10 L104 96" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M214 10 L6 70" stroke="#FFFFFF" stroke-opacity=".9" stroke-width="1.2"/></svg>`;
    },

    // ── dashed curve; data-d = path in a 440x956 box (or data-vb) ─────────
    path(el) {
      const vb = el.dataset.vb || '0 0 440 956';
      return `<svg viewBox="${vb}" width="100%" height="100%" preserveAspectRatio="none" style="overflow:visible"><path d="${el.dataset.d}" fill="none" stroke="${el.dataset.color || '#0B1424'}" stroke-opacity="${el.dataset.op || .55}" stroke-width="${el.dataset.w || 2}" stroke-dasharray="7 7" stroke-linecap="round"/></svg>`;
    },

    // ── gold bar stack ─────────────────────────────────────────────────────
    goldbars(el) {
      const t = id('gt'), fr = id('gf'), s = id('gs');
      const bar = (x, y) => `<g transform="translate(${x} ${y})">
          <path d="M22 0 H110 L124 22 H8 Z" fill="url(#${t})"/>
          <path d="M33 5 H99 L106 17 H26 Z" fill="#F7C948" opacity=".55"/>
          <path d="M33 5 H99" stroke="#FFF7D6" stroke-width="1.2"/>
          <path d="M8 22 H124 L132 50 H0 Z" fill="url(#${fr})"/>
          <path d="M8 22 H124" stroke="#FFF2B8" stroke-width="1.4"/>
          <path d="M16 30 L26 46" stroke="#FFF" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/></g>`;
      return `<svg viewBox="0 0 280 150" width="100%" height="100%"><defs>
        <linearGradient id="${t}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4C2"/><stop offset="1" stop-color="#F6C94A"/></linearGradient>
        <linearGradient id="${fr}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F1B230"/><stop offset="1" stop-color="#B9770F"/></linearGradient>
        <filter id="${s}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="7"/></filter></defs>
        <ellipse cx="140" cy="140" rx="128" ry="9" fill="#0E2A5A" opacity=".22" filter="url(#${s})"/>
        ${bar(6, 88)}${bar(142, 88)}${bar(74, 38)}</svg>`;
    },

    // ── coin (data-sym: $, €, £) ──────────────────────────────────────────
    coin(el) {
      const g = id('cg'), r = id('cr'), s = id('cs');
      const sym = el.dataset.sym || '$';
      return `<svg viewBox="0 0 100 100" width="100%" height="100%"><defs>
        <radialGradient id="${g}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFF3B0"/><stop offset=".45" stop-color="#F7C843"/><stop offset="1" stop-color="#D08E16"/></radialGradient>
        <linearGradient id="${r}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D99A1E"/><stop offset="1" stop-color="#9A620B"/></linearGradient>
        <filter id="${s}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter></defs>
        <ellipse cx="52" cy="92" rx="34" ry="5" fill="#0E2A5A" opacity=".25" filter="url(#${s})"/>
        <ellipse cx="50" cy="54" rx="42" ry="38" fill="url(#${r})"/>
        <ellipse cx="50" cy="48" rx="42" ry="38" fill="url(#${g})"/>
        <ellipse cx="50" cy="48" rx="33" ry="29.5" fill="none" stroke="#B87912" stroke-opacity=".45" stroke-width="2.4"/>
        <text x="50" y="62" text-anchor="middle" font-family="Aeonik" font-weight="700" font-size="40" fill="#B5740E">${sym}</text>
        <text x="49" y="60.5" text-anchor="middle" font-family="Aeonik" font-weight="700" font-size="40" fill="#E9A82A">${sym}</text>
        <path d="M24 30 A32 28 0 0 1 52 18" stroke="#FFFBE6" stroke-width="3" stroke-linecap="round" fill="none" opacity=".8"/></svg>`;
    },

    // ── candlesticks ───────────────────────────────────────────────────────
    candles(el) {
      const gu = id('cu'), gd = id('cd'), s = id('cs');
      const c = (x, top, bot, w1, w2, up) => {
        const fill = up ? `url(#${gu})` : `url(#${gd})`, side = up ? '#047857' : '#9F1239';
        return `<line x1="${x + 9}" y1="${w1}" x2="${x + 9}" y2="${w2}" stroke="${side}" stroke-width="3" stroke-linecap="round"/>
          <rect x="${x + 3}" y="${top + 3}" width="18" height="${bot - top}" rx="4" fill="${side}"/>
          <rect x="${x}" y="${top}" width="18" height="${bot - top}" rx="4" fill="${fill}"/>
          <rect x="${x + 3}" y="${top + 4}" width="4" height="${Math.max(6, bot - top - 10)}" rx="2" fill="#fff" opacity=".35"/>`;
      };
      return `<svg viewBox="0 0 160 170" width="100%" height="100%"><defs>
        <linearGradient id="${gu}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4ADE80"/><stop offset="1" stop-color="#16A34A"/></linearGradient>
        <linearGradient id="${gd}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FB7185"/><stop offset="1" stop-color="#E11D48"/></linearGradient>
        <filter id="${s}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="5"/></filter></defs>
        <ellipse cx="80" cy="160" rx="70" ry="6" fill="#0E2A5A" opacity=".2" filter="url(#${s})"/>
        ${c(8, 96, 140, 84, 152, false)}${c(42, 70, 118, 56, 132, true)}${c(76, 82, 108, 72, 120, false)}${c(110, 30, 92, 16, 104, true)}</svg>`;
    },

    // ── cloud ─────────────────────────────────────────────────────────────
    cloud(el) {
      const g = id('cl'), s = id('cls');
      const stops = el.dataset.tone === 'night'
        ? '<stop offset=".2" stop-color="#9DBBFF" stop-opacity=".2"/><stop offset="1" stop-color="#5D86E0" stop-opacity=".05"/>'
        : '<stop offset=".35" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DCEAFB"/>';
      return `<svg viewBox="0 0 200 100" width="100%" height="100%"><defs>
        <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient>
        <filter id="${s}"><feGaussianBlur stdDeviation="1.2"/></filter></defs>
        <path filter="url(#${s})" fill="url(#${g})" d="M28 88 C8 88 4 66 22 60 C18 40 42 30 56 42 C62 18 96 12 110 34 C122 20 150 24 152 46 C176 44 192 62 182 80 C180 86 174 88 168 88 Z"/></svg>`;
    },

    // ── padlock (gold) ────────────────────────────────────────────────────
    padlock(el) {
      const b = id('lb'), sh = id('ls'), e = id('le'), s = id('lss');
      return `<svg viewBox="0 0 140 170" width="100%" height="100%"><defs>
        <linearGradient id="${b}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE68A"/><stop offset=".5" stop-color="#F4B92F"/><stop offset="1" stop-color="#C98512"/></linearGradient>
        <linearGradient id="${e}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C58312"/><stop offset="1" stop-color="#8E5A08"/></linearGradient>
        <linearGradient id="${sh}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8E99AA"/><stop offset=".45" stop-color="#F2F5F9"/><stop offset="1" stop-color="#9AA5B6"/></linearGradient>
        <filter id="${s}" x="-30%" y="-50%" width="160%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>
        <ellipse cx="72" cy="160" rx="54" ry="6" fill="#0E2A5A" opacity=".25" filter="url(#${s})"/>
        <path d="M40 74 V50 C40 18 100 18 100 50 V74" fill="none" stroke="url(#${sh})" stroke-width="15" stroke-linecap="round"/>
        <rect x="18" y="74" width="108" height="80" rx="18" fill="url(#${e})"/>
        <rect x="14" y="68" width="108" height="80" rx="18" fill="url(#${b})"/>
        <path d="M24 78 H112" stroke="#FFF6C9" stroke-width="2" stroke-linecap="round" opacity=".8"/>
        <circle cx="68" cy="103" r="10" fill="#7A4A06"/><path d="M63 108 H73 L76 128 H60 Z" fill="#7A4A06"/>
        <path d="M24 92 Q26 130 40 140" stroke="#fff" stroke-opacity=".35" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;
    },

    // ── rising 3D arrow ───────────────────────────────────────────────────
    arrow(el) {
      const g = id('ag'), s = id('as');
      const p = 'M14 150 L70 96 L104 118 L178 44';
      return `<svg viewBox="0 0 210 180" width="100%" height="100%"><defs>
        <linearGradient id="${g}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#22C55E"/><stop offset="1" stop-color="#4ADE80"/></linearGradient>
        <filter id="${s}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter></defs>
        <path d="${p}" transform="translate(6 12)" fill="none" stroke="#0E2A5A" stroke-opacity=".18" stroke-width="20" stroke-linejoin="round" stroke-linecap="round" filter="url(#${s})"/>
        <path d="${p}" transform="translate(4 5)" fill="none" stroke="#15803D" stroke-width="20" stroke-linejoin="round" stroke-linecap="round"/>
        <path d="M196 26 L192 78 L144 30 Z" transform="translate(4 5)" fill="#15803D" stroke="#15803D" stroke-width="6" stroke-linejoin="round"/>
        <path d="${p}" fill="none" stroke="url(#${g})" stroke-width="20" stroke-linejoin="round" stroke-linecap="round"/>
        <path d="M196 26 L192 78 L144 30 Z" fill="#4ADE80" stroke="#4ADE80" stroke-width="6" stroke-linejoin="round"/>
        <path d="M20 140 L70 92" stroke="#fff" stroke-opacity=".45" stroke-width="4" stroke-linecap="round"/></svg>`;
    },

    // ── panoramic price line (alt set) ────────────────────────────────────
    // One smooth line runs through all eight screenshots; data-i (0-7) picks this page's slice.
    // data-tone="neon" draws it blue-to-cyan instead of white.
    wave(el) {
      const i = +el.dataset.i || 0, W = 440, total = W * 8;
      const y = x => 712 - 0.03 * x + 46 * Math.sin(x / 165 + .6) + 19 * Math.sin(x / 61 + 1.7) + 7 * Math.sin(x / 23 + .4);
      const pts = [];
      for (let x = -40; x <= total + 40; x += 8) pts.push([x, y(x)]);
      let d = `M${pts[0][0]},${f(pts[0][1])}`;
      for (let k = 0; k < pts.length - 1; k++) {
        const p0 = pts[k - 1] || pts[k], p1 = pts[k], p2 = pts[k + 1], p3 = pts[k + 2] || p2;
        d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]},${f(p2[1])}`;
      }
      const dots = [];
      for (let x = 110; x < total; x += 220) dots.push(`<circle cx="${x}" cy="${f(y(x))}" r="9" fill="#fff" opacity=".18"/><circle cx="${x}" cy="${f(y(x))}" r="3.6" fill="#fff"/>`);
      const g = id('wg'), b = id('wb'), lg = id('wl'), neon = el.dataset.tone === 'neon';
      const ink = neon ? `url(#${lg})` : '#fff', fillc = neon ? '#2F7BFF' : '#fff';
      return `<svg viewBox="${i * W} 0 ${W} 952" width="100%" height="100%" preserveAspectRatio="none"><defs>
        <linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="0" y1="560" x2="0" y2="952"><stop offset="0" stop-color="${fillc}" stop-opacity="${neon ? .16 : .2}"/><stop offset="1" stop-color="${fillc}" stop-opacity="0"/></linearGradient>
        <linearGradient id="${lg}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="880" y2="0" spreadMethod="reflect"><stop offset="0" stop-color="#2F7BFF"/><stop offset="1" stop-color="#5CD3FF"/></linearGradient>
        <filter id="${b}" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="5"/></filter></defs>
        <path d="${d}L${total + 40},1000L-40,1000Z" fill="url(#${g})"/>
        <path d="${d}" fill="none" stroke="${ink}" stroke-opacity="${neon ? .8 : .55}" stroke-width="7" filter="url(#${b})"/>
        <path d="${d}" fill="none" stroke="${ink}" stroke-opacity=".95" stroke-width="2"/>${neon ? dots.join('').replace(/fill="#fff" opacity=".18"/g, 'fill="#5CD3FF" opacity=".25"') : dots.join('')}</svg>`;
    },

    // ── concentric signal rings (alt backdrop) ────────────────────────────
    // Rings radiate from data-cx/data-cy (canvas points): data-n rings from data-r0, data-step apart.
    // Every other ring is dashed; a few cyan points sit on the rings.
    rings(el) {
      const cx = +(el.dataset.cx || 220), cy = +(el.dataset.cy || 620), n = +(el.dataset.n || 7);
      const r0 = +(el.dataset.r0 || 120), st = +(el.dataset.step || 74), g = id('rg');
      let out = `<circle cx="${cx}" cy="${cy}" r="${r0 + st * n}" fill="url(#${g})"/>`;
      for (let k = 0; k < n; k++) {
        const r = r0 + k * st, a = f(.46 * (1 - k / n) + .07);
        out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#5B95FF" stroke-opacity="${a}" stroke-width="${k % 2 ? 1 : 1.4}"${k % 2 ? ' stroke-dasharray="3 7"' : ''}/>`;
      }
      [[1, -62], [2, 208], [3, -28], [4, 156], [5, 18], [6, 236]].forEach(([k, deg]) => {
        if (k >= n) return;
        const r = r0 + k * st, t = deg * Math.PI / 180, x = f(cx + r * Math.cos(t)), y = f(cy + r * Math.sin(t));
        out += `<circle cx="${x}" cy="${y}" r="8" fill="#5CD3FF" opacity=".2"/><circle cx="${x}" cy="${y}" r="2.8" fill="#CFF3FF"/>`;
      });
      return `<svg viewBox="0 0 440 952" width="100%" height="100%"><defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r0 + st * n}">
        <stop offset="0" stop-color="#1A69F1" stop-opacity=".34"/><stop offset=".45" stop-color="#1A69F1" stop-opacity=".1"/><stop offset="1" stop-color="#1A69F1" stop-opacity="0"/></radialGradient></defs>${out}</svg>`;
    },

    // ── glowing candlestick chart (dark backdrop) ─────────────────────────
    // The box is the plot area; price climbs from data-from to data-to (fractions of the box
    // height, 0 = top). data-n candles, data-seed, data-op = opacity of the newest candle
    // (older ones fade out to the left), data-line adds a moving-average line with a live dot,
    // data-vol adds volume bars along the bottom of the box.
    chart(el) {
      const W = parseFloat(el.style.width), Ht = parseFloat(el.style.height);
      const n = +el.dataset.n || 14, op = +(el.dataset.op || .6);
      const from = +(el.dataset.from || .82) * Ht, to = +(el.dataset.to || .14) * Ht;
      let seed = +el.dataset.seed || 3;
      const rnd = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
      const step = W / n, cw = Math.max(3, step * .56), vol = Math.abs(from - to) / n * 2 + Ht * .02;
      const g = id('cg'), gl = id('cgl'), lg = id('clg');
      let prev = from + vol * .3, candles = '', bars = '';
      const cl = [];
      for (let k = 0; k < n; k++) {
        const t = n > 1 ? k / (n - 1) : 1, x = step * (k + .5);
        const o = prev, c = from + (to - from) * t + (rnd() - .5) * vol * 1.7;
        const hi = Math.min(o, c) - (.15 + rnd()) * vol * .55, lo = Math.max(o, c) + (.15 + rnd()) * vol * .55;
        const top = Math.min(o, c), h = Math.max(2, Math.abs(c - o)), a = f(op * (.22 + .78 * t * t));
        const up = c <= o;
        candles += `<g opacity="${a}"><path d="M${f(x)} ${f(hi)}V${f(lo)}" stroke="${up ? '#5B95FF' : '#3A6FD8'}" stroke-width="1.4"/>` + (up
          ? `<rect x="${f(x - cw / 2)}" y="${f(top)}" width="${f(cw)}" height="${f(h)}" rx="1.4" fill="url(#${g})"/>`
          : `<rect x="${f(x - cw / 2 + .7)}" y="${f(top + .7)}" width="${f(cw - 1.4)}" height="${f(Math.max(.6, h - 1.4))}" rx="1.2" fill="#071634" stroke="#3A75F0" stroke-width="1.4"/>`) + '</g>';
        if (el.dataset.vol !== undefined) {
          const bh = Ht * (.04 + rnd() * .09);
          bars += `<rect x="${f(x - cw / 2)}" y="${f(Ht - bh)}" width="${f(cw)}" height="${f(bh)}" rx="1" fill="#2F6FE8" opacity="${f(a * .45)}"/>`;
        }
        cl.push([x, c]); prev = c;
      }
      let line = '';
      if (el.dataset.line !== undefined) {
        const ema = []; cl.forEach(([x, c], k) => ema.push([x, k ? ema[k - 1][1] + .42 * (c - ema[k - 1][1]) : c]));
        let d = `M${f(ema[0][0])},${f(ema[0][1])}`;
        for (let k = 0; k < ema.length - 1; k++) {
          const p0 = ema[k - 1] || ema[k], p1 = ema[k], p2 = ema[k + 1], p3 = ema[k + 2] || p2;
          d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
        }
        const [ex, ey] = ema[ema.length - 1];
        line = `<path d="${d}" fill="none" stroke="url(#${lg})" stroke-width="7" stroke-linecap="round" opacity=".45" filter="url(#${gl})"/>
          <path d="${d}" fill="none" stroke="url(#${lg})" stroke-width="2" stroke-linecap="round"/>
          <circle cx="${f(ex)}" cy="${f(ey)}" r="11" fill="#3D84FF" opacity=".22"/><circle cx="${f(ex)}" cy="${f(ey)}" r="6" fill="#3D84FF" opacity=".45" filter="url(#${gl})"/>
          <circle cx="${f(ex)}" cy="${f(ey)}" r="3.4" fill="#fff"/>`;
      }
      return `<svg viewBox="0 0 ${W} ${Ht}" width="100%" height="100%" style="overflow:visible"><defs>
        <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FB0FF"/><stop offset="1" stop-color="#1A69F1"/></linearGradient>
        <linearGradient id="${lg}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1A69F1" stop-opacity=".1"/><stop offset=".55" stop-color="#3D84FF" stop-opacity=".8"/><stop offset="1" stop-color="#9CC3FF"/></linearGradient>
        <filter id="${gl}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter></defs>
        <g style="filter:drop-shadow(0 0 5px rgba(61,132,255,.55))">${bars}${candles}</g>${line}</svg>`;
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-deco]').forEach(el => {
      const g = D[el.dataset.deco];
      if (g) el.innerHTML = g(el);
    });
  });
})();
