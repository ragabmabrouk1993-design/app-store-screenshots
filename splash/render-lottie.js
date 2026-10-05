// Renders SplashAnimation.json with lottie-web (SVG renderer), frame by frame, into an MP4 for review.
//   npm i lottie-web playwright   (or have them on NODE_PATH); needs ffmpeg
//   node render-lottie.js [scale]   default 3 -> 1125 x 2436 (H.264 needs even sizes, so odd ones get 1px of background)
const fs = require('fs'), { spawn } = require('child_process');
const { chromium } = require('playwright');
const SCALE = +(process.argv[2] || 3);
const anim = JSON.parse(fs.readFileSync(__dirname + '/SplashAnimation.json'));
const lottieJs = fs.readFileSync(require.resolve('lottie-web/build/player/lottie.min.js'), 'utf8');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: anim.w, height: anim.h }, deviceScaleFactor: SCALE });
  await page.setContent(`<body style="margin:0;background:#000"><div id="a" style="width:${anim.w}px;height:${anim.h}px"></div>
    <script>${lottieJs}</script><script>window.anim = lottie.loadAnimation({ container: a, renderer: 'svg', loop: false, autoplay: false,
    animationData: ${JSON.stringify(anim)} });</script>`);
  await page.waitForFunction(() => window.anim && window.anim.isLoaded);
  const out = `SplashAnimation-lottie-${anim.w * SCALE}x${anim.h * SCALE}.mp4`;
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', anim.fr, '-i', '-', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2:color=0x04080F', '-c:v', 'libx264',
    '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', __dirname + '/' + out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = anim.ip; f < anim.op; f++) {
    await page.evaluate(f => window.anim.goToAndStop(f, true), f);
    ff.stdin.write(await page.screenshot({ type: 'png' }));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close();
  console.log(`${out}: ${anim.op - anim.ip} frames @ ${anim.fr} fps`);
})();
