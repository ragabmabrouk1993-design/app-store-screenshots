// Rasterizes the SVG masters in icons/src into the iOS and Android PNGs, plus a review sheet.
// Called by build.py. Needs Playwright (Chromium) and ffmpeg.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const dir = __dirname, src = f => path.join(dir, 'src', f);
const dataUrl = f => 'data:image/svg+xml;base64,' + fs.readFileSync(src(f)).toString('base64');
const out = rel => { const p = path.join(dir, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); return p; };

// The image clipped by `clip` (CSS border-radius or clip-path), on a transparent page.
async function render(page, file, size, rel, { radius = '0', clipPath = 'none', crop = 1 } = {}) {
  const inner = size / crop;  // crop > 1 shows only the centre: the adaptive icon's 72 of 108 dp
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}
    div{width:${size}px;height:${size}px;overflow:hidden;border-radius:${radius};clip-path:${clipPath};position:relative}
    img{position:absolute;width:${inner}px;height:${inner}px;left:${(size - inner) / 2}px;top:${(size - inner) / 2}px}</style>
    <div><img src="${dataUrl(file)}"></div>`);
  await page.waitForFunction(() => document.querySelector('img').complete);
  await page.screenshot({ path: out(rel), omitBackground: true });
}
const flatten = rel => {  // App Store and Play icons: opaque RGB, no alpha channel
  const p = out(rel), tmp = p + '.tmp.png';
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', p, '-pix_fmt', 'rgb24', tmp]); fs.renameSync(tmp, p);
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  // iOS: square, full bleed; the system applies the corner mask.
  // Every size is rendered from the vector master, not scaled down from 1024. All opaque, as Apple requires.
  for (const [name, px] of JSON.parse(fs.readFileSync(path.join(dir, 'ios/sizes.json')))) {
    const rel = `ios/AppIcon.appiconset/${name}`;
    await render(page, 'icon-1024.svg', px, rel); flatten(rel);
  }
  await render(page, 'icon-1024-dark.svg', 1024, 'ios/ios18/AppIcon-1024-dark.png');
  await render(page, 'icon-1024-tinted.svg', 1024, 'ios/ios18/AppIcon-1024-tinted.png');

  // Android Play listing icon: full square, Play applies its own mask.
  await render(page, 'icon-1024.svg', 512, 'android/play-store-512.png'); flatten('android/play-store-512.png');

  // Android legacy launcher icons (pre-API 26 launchers): rounded square and circle.
  for (const [d, px] of Object.entries({ mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
    await render(page, 'android-legacy.svg', px, `android/res/mipmap-${d}/ic_launcher.png`, { radius: '18%' });
    await render(page, 'android-legacy.svg', px, `android/res/mipmap-${d}/ic_launcher_round.png`, { radius: '50%' });
  }

  // Review sheet: iOS squircle mask, Android adaptive under circle / squircle / rounded-square masks, themed icon.
  const S = 220, cells = [
    ['iOS', 'icon-1024.svg', { radius: '22.37%' }],
    ['iOS dark', 'icon-1024-dark.svg', { radius: '22.37%', bg: '#1C1C1E' }],
    ['iOS tinted', 'icon-1024-tinted.svg', { radius: '22.37%', bg: '#101820' }],
    ['Android circle', 'android-adaptive-full.svg', { radius: '50%', crop: 108 / 72 }],
    ['Android squircle', 'android-adaptive-full.svg', { radius: '38%', crop: 108 / 72 }],
    ['Android rounded square', 'android-adaptive-full.svg', { radius: '16%', crop: 108 / 72 }],
    ['Android themed', 'android-monochrome.svg', { radius: '50%', crop: 108 / 72, bg: '#33415C' }],
    ['Play Store', 'icon-1024.svg', { radius: '20%' }],
  ];
  const tiles = cells.map(([label, f, o]) => `<figure><div style="width:${S}px;height:${S}px;border-radius:${o.radius};overflow:hidden;position:relative;background:${o.bg || 'transparent'}">
      <img src="${dataUrl(f)}" style="position:absolute;width:${S * (o.crop || 1)}px;height:${S * (o.crop || 1)}px;left:${(S - S * (o.crop || 1)) / 2}px;top:${(S - S * (o.crop || 1)) / 2}px"></div>
      <figcaption>${label}</figcaption></figure>`).join('');
  await page.setViewportSize({ width: 4 * (S + 48), height: 2 * (S + 84) });
  await page.setContent(`<style>body{margin:0;padding:12px 0;background:#E9ECF1;display:flex;flex-wrap:wrap;font:13px -apple-system,system-ui,sans-serif;color:#40485A}
    figure{margin:12px 24px;display:flex;flex-direction:column;align-items:center;gap:10px}</style>${tiles}`);
  await page.waitForFunction(() => [...document.images].every(i => i.complete));
  await page.screenshot({ path: out('previews/icons.png') });
  await browser.close();
  console.log('icons written');
})();
