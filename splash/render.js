// Renders splash.html frame by frame at 60 fps into splash.mp4 (1080 x 1920, H.264).
//   node render.js [width height]      default 1080 1920; needs Playwright and ffmpeg
const { spawn } = require('child_process');
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const [W, H] = [+(process.argv[2] || 1080), +(process.argv[3] || 1920)], FPS = 60, DSF = 3;
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W / DSF, height: H / DSF }, deviceScaleFactor: DSF });
  await page.goto('file://' + __dirname + '/splash.html?bare&t=0');
  const dur = await page.evaluate(() => window.SPLASH_DURATION);
  const out = `splash-${W}x${H}.mp4`;
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', FPS, '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', __dirname + '/' + out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.round(dur * FPS) + 1;
  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => window.seek(t), i / FPS);
    ff.stdin.write(await page.screenshot({ type: 'png' }));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log(`${out}: ${frames} frames, ${(frames / FPS).toFixed(2)}s`);
})();
