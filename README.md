# App Store screenshots — iPhone 6.5"

There are three finished options with the same eight screenshots. Pick one and upload its folder in file order.

- `out/light/`: the light sky style. Big tilted phones; the headline alternates between top and bottom.
- `out/dark/`: the dark trading style, with the same layouts on a navy candlestick-chart background. The Connect Telegram and Connect MT4/MT5 screens show the open iOS number pad.
- `out/alt/`: the alternative dark style. It uses the dark set's text and cards on a different background: near-black with signal rings and a glowing blue-to-cyan price line. Screens with the headline on top (01, 03, 05, 07) tilt the whole phone, alternating right and left. Screens with the headline below (02, 04, 06, 08) keep the phone straight. Every screen pops one enlarged app card out over the phone, and both Connect screens show the open number pad.
- `out/alt-ar/`: the Arabic version of the alt set. Screens run right to left and use the app's own Arabic strings. The whole design is set in one type family, SF Arabic with SF Pro for Latin and digits, at weights from Regular to Heavy.

Every PNG is 1284 × 2778 px, RGB, no alpha. That is the App Store Connect size for the 6.5" iPhone display.

| # | File | Headline |
|---|------|----------|
| 1 | `01-hero.png` | Never Miss a Signal |
| 2 | `02-telegram.png` | Link Your Telegram |
| 3 | `03-channels.png` | Pick Your Channels |
| 4 | `04-connect-mt.png` | Connect MT4 & MT5 |
| 5 | `05-rules.png` | Trade by Your Rules |
| 6 | `06-profits.png` | Lock In Profits |
| 7 | `07-performance.png` | Track Every Channel |
| 8 | `08-news.png` | Stay Ahead of the News |

`preview-light.png`, `preview-dark.png`, `preview-alt.png` and `preview-alt-ar.png` show each set side by side for sharing. The Arabic board runs right to left, as in the Arabic App Store. They are not App Store assets.

## How it's built

Each screenshot is an HTML page in `src/`. Light pages are `NN-*.html`, dark pages are `dark-NN-*.html` and alt pages are `alt-NN-*.html`. Pages are authored in iPhone points (440 × 952) and exported at 1284/440 = 2.918x with headless Chrome. The in-app screens inside the phones are laid out at the device's native 440 × 956 pt.

- `light.css`: the light sky style. It covers the headline, laurel badge, titanium phone, pop-out cards and white notifications.
- `dark.css`: the dark trading style. It loads after `light.css` and covers the navy background, blue-steel phone, glowing cards and white headlines.
- `alt.css`: the alternative dark background and the enlarged input cards (`.zin`) on the Connect screens. It loads after `dark.css`; alt pages use the canvas classes `light dark alt`.
- `ar.css`: Arabic pages. They use `<html lang="ar">` with `dir="rtl"` on the canvas, not on `<html>`: Chrome's minimum window is wider than 440pt, so a right-to-left `<html>` shifts the page. All text uses the system font: SF Arabic for Arabic letters, paired with SF Pro for Latin letters and digits, as on iOS. The CSS also mirrors the in-app details that flexbox doesn't mirror by itself. `screens.js` and `settings.js` take the Arabic strings from `src/local/ar.json`. Text the app shows in English even in Arabic mode stays English: trade rows, account tags, symbols, channel names and news event names. A few labels that are hard-coded in English in the app are translated: "Connected Channels" (القنوات) and the news "Impact" label (التأثير).
- `deco.js`: the vector illustrations. Use them with `<div data-deco="coin" style="left;top;width;height">`.
  - Light set: laurel, sparkle, paper planes, dashed paths and clouds.
  - Shared: 3D candles and arrow. Gold bars, coins and padlock still exist in `deco.js` but are no longer used.
  - Dark backdrop: `chart` draws a glowing candlestick chart with an optional moving-average line (`data-line`) and volume bars (`data-vol`).
  - Alt backdrop: `rings` draws the signal rings. `wave` draws the price line that runs through all eight screenshots: `data-i` (0–7) picks the page's slice, and `data-tone="neon"` colors it blue to cyan.
- `screens.js` and `screens.css`: the in-app screens, rebuilt from `src/screens/*` with demo data.
  - Use them with `<div class="app" data-screen="home">`.
  - The screens are `home`, `channels`, `connectTelegram`, `connectMT`, `profile` and `news`.
  - Add `data-keyboard` to show the iOS number pad: the decimal pad on Telegram and the number pad on MT.
- `settings.js`: the Channel Settings screen. `data-scroll-to` picks the section shown.
- `base.css` and `kit.js`: the app's UI tokens (colors, Aeonik font, `scale()` sizes), device frame, icons, status bar and tab bar.
  - The app screen background (`--app-glow` in `base.css`) is the navy glow behind the status bar and header, measured from device captures.
  - `src/symbols/` holds the round symbol icons (USD, EUR, GBP, gold, silver), drawn after the app's own. A pair icon shows the quote currency top-left with the base symbol over it, bottom-right.

Layouts alternate: odd screenshots have the headline on top and the phone below; even ones have the phone on top and the headline below. The channels and account are fictional demo data.

`v1-dark/` keeps the first dark draft for reference.

## Onboarding

These are designs for the app's five onboarding steps, in English and Arabic. They keep the app's fixed onboarding layout: the logo and progress pills on top, then the mockup image, the title, the subtitle and the Next button. Only the mockup image and the text styling change.

| # | Step | English title | Arabic title |
|---|------|---------------|--------------|
| 1 | `01-signals` | Never Miss a **Signal** | لا تفوّت أي **إشارة** |
| 2 | `02-link-telegram` | Link Your **Telegram** | اربط حساب **تيليجرام** |
| 3 | `03-channels` | Pick Your **Channels** | اختر **قنواتك** |
| 4 | `04-connect` | Connect **MT4 & MT5** | اربط **MT4 & MT5** |
| 5 | `05-rules` | Trade by **Your Rules** | تداول وفق **قواعدك** |

- **Mockup images** (`out/onb-mock/`, `out/onb-mock-ar/`) are the assets for the app. Each one is a 686 × 1032 PNG, the same size as the current mockup, plus a 1372 × 2064 `@2x` copy. It is transparent above and beside the phone and fades into `#04080F` at the bottom. A graphite phone shows the app screen, with one app card or notification popping out over it.
- **Full screens** (`out/onb/`, `out/onb-ar/`, 1125 × 2436) show each mockup in the layout, with the suggested text styling:
  - title: 25 pt bold, white, with the last word in blue `#3D84FF` and a soft glow
  - subtitle: 15 pt, `#A7B3C9`
- `onboarding.js` builds both kinds of page from `data-onb` and holds all the text. `onboarding.css` holds the styles. The page files are `src/onb-mock-*.html` and `src/onb-*.html`.

## Google Play feature graphic

`out/feature/feature-en.png` and `feature-ar.png` are the 1024 × 500 feature graphic for the Google Play listing. They are opaque PNGs with no alpha, as Play requires.

- The left side has the app icon, the name, the "Never Miss a Signal" headline, the subtitle, and MT4 / MT5 / Telegram chips. The right side has a tilted phone on the home screen with the "Order executed" notification popping out.
- The Arabic version mirrors the layout.
- The background is the alt set's: dark navy, signal rings and a faint candlestick chart.
- Text and the phone stay clear of the edges, because Play can crop or overlay them.
- `./render.sh feature` renders both. The pages are `src/feature-en.html` and `src/feature-ar.html`, and the styles are in `src/feature.css`.

## Brand

`brand/` holds the enhanced Tragram symbol. The shape is unchanged from the original; only the colour and shading are refined.

- **Bar:** a cleaner cyan-to-blue gradient, a thin lit top edge and a slightly darker underside.
- **Stem:** runs from deep blue under the bar to bright cyan at the tip.
- **Join:** the bar casts a soft shadow onto the stem, and the fold where the ribbon turns now fades out instead of ending in a hard block.

| File | What it is |
|------|------------|
| `tragram-symbol.svg` | The symbol, transparent background. One shared path, so the file is smaller. |
| `tragram-symbol-1024.png` | The same, as a 1024 × 782 PNG with transparency. |
| `tragram-app-icon.svg`, `tragram-app-icon-1024.png` | The symbol on the app's navy background with a soft glow, 1024 × 1024, no transparency. Use it as the store icon; iOS and Android round the corners themselves. |

`brand/options/` holds three more directions for the same shape. `preview.png` shows them side by side.

- **B, flat two-tone:** solid brand blue, a lighter blue stem and a navy fold. It has no gradients, so it stays crisp at small sizes and in print.
- **C, neon:** cyan to violet-blue with a glow. It is meant for dark backgrounds only.
- **D, one colour:** a white symbol with the fold cut in as a thin gap, for use on brand-coloured or dark surfaces. Invert it for a black version.

## Re-render

```bash
./render.sh            # all three sets + their preview boards
./render.sh dark       # only the dark set (or: light, alt, alt-ar, onb, onb-ar, onb-mock, onb-mock-ar)
./render.sh dark 04    # only dark 04-*
RAW=1 ./render.sh 01   # bare in-app screen, for comparing with a device capture
```

Requires Google Chrome in `/Applications`.

## Fonts

The font files live in `fonts/` on your own machine and are not in git: Apple's license doesn't allow sharing SF Pro and SF Arabic, and Aeonik is a paid font.

```bash
fonts/install.sh       # macOS: downloads SF Pro and SF Arabic from Apple into fonts/ and ~/Library/Fonts
```

- The script keeps SF Pro Text, SF Pro Display and SF Arabic (upright weights, no italics or Rounded), installs them in `~/Library/Fonts` for Figma, and writes `fonts/fonts.css`. `ar.css` imports that file, so the Arabic pages draw Arabic letters with this SF Arabic; Latin letters and digits stay SF Pro (system font). Without the file, the Arabic pages use the system font, as before.
- Aeonik: copy `Aeonik-Regular` and `Aeonik-Bold` (`.otf` or `.ttf`) into `fonts/`. Without them, `base.css` falls back to the app repo's `src/assets/fonts/`.

Weights in use:

| Font | Weights | Used for |
|---|---|---|
| SF Arabic | 400 Regular, 600 Semibold, 700 Bold, 800 Heavy | Arabic letters in the Arabic set; the headline is Heavy |
| SF Pro Text (under 20pt) | 400 Regular, 500 Medium, 600 Semibold, 700 Bold | in-app text, notifications; Latin and digits in the Arabic set |
| SF Pro Display (20pt and up) | 400 Regular, 700 Bold, 800 Heavy | large Latin text: badge "MT4 & MT5", balances, headline |
| Aeonik | 400 Regular, 700 Bold | headlines, subtitles and most text in the English sets |

## Figma

`figma/` turns the alt and alt-ar sets into a Figma file with editable text: one 1284 × 2778 frame per screenshot, the background as one image, and a frame each for the title, the phone, the card and the notification. Inside those frames the artwork (phone body, icons, card fills, laurels) is an image, and every text on top of it is a live Figma text layer in the design's font, weight, size, color and spacing: headline, subtitle, badge, and all the text on the phone screens, cards and notifications. Rotated phones are rotated frames, so their text is rotated with them.

1. `python3 figma/build.py` renders the layers into `figma/import/` with `manifest.json`. It needs Pillow (`pip3 install pillow`).
2. In Figma desktop, open a design file and choose Plugins > Development > Import plugin from manifest…, then pick `figma/plugin/manifest.json`.
3. Run the plugin and choose the `figma/import` folder. It adds a page called "App Store screenshots" with an English section and an Arabic section.

Fonts: Aeonik (the app font) for English, SF Pro for in-app and Latin text, SF Arabic for Arabic. SF Pro and SF Arabic are free from developer.apple.com/fonts; install them before running the plugin. If a font is missing the plugin uses a stand-in (Inter, Noto Sans Arabic), the text stays editable, and the closing message names the missing fonts.

A few texts stay part of the artwork: the keyboard keys, emoji, text hidden behind the keyboard or tab bar, and settings rows fading out under the header. The export helper is `src/export.js`, which `kit.js` loads for `#fx=` URLs.

## Splash animation

`splash/` holds the app's launch animation: the ribbon logo draws itself, then the "Tragram" wordmark fades in beneath it. It runs about 3.1 seconds.

- `splash/splash.html` is the master. Open it in a browser to play it. Use Replay or the scrubber to review it. Add `?loop` to repeat it, `?t=1.2` to freeze it at a time, and `?bare` to hide the controls. The logo keeps the original geometry and gradients from the source SVG. Masks reveal it: a wide, feathered stroke follows the upper ribbon left to right, then turns down through the fold and follows the lower ribbon to its tip.
- `splash/splash-1080x1920.mp4` is the 60 fps render. Re-render it with `node splash/render.js [width height]`, which needs Playwright and ffmpeg.
- `splash/SplashAnimation.json` is option A, "Ribbon draw": the Lottie version for the app, 375 × 812 at 60 fps and 187 frames. It keeps the old file's background and top glow, and replaces the old logo and the uppercase TRAGRAM letters with the ribbon logo and the "Tragram" wordmark. It uses only features that lottie-ios, lottie-android and lottie-web support: shape layers, gradient fills, alpha track mattes and transforms. The soft reveal edge is a gradient on the matte, not a blur. There's no blur on the letters either, so they only fade and rise. Markers: `symbol-start`, `fold-start`, `settle-start`, `wordmark-start`, `sweep-start`, `stable` and `end`. Both options end on the full logo and wordmark, held still; they don't fade out. Rebuild it with `python3 splash/lottie.py [old.json]`. The script reads its paths and timing from `splash.html`, so edit the timing there and in `lottie.py` together. `node splash/render-lottie.js` renders the JSON through lottie-web into `SplashAnimation-lottie-1125x2436.mp4` for review.
- `splash/SplashAnimation-trace.json` is option B, "Trace & fill". It has the same canvas, length (187 frames) and background. A fine line in the logo's own gradient traces each ribbon's outline. Each trace starts at one point, runs both ways round, and closes at the far end: the upper ribbon at its top-right corner, the fold at its point, and the lower ribbon at its tip. The original gradients then flood in and the line dissolves into the edge. Meanwhile the logo eases from 96.5% to 100%, without the glide used in option A. Each letter rises into place while a soft edge uncovers it from the baseline up. Option B ends like option A: a light sweep, then the full lockup holds. Markers: `symbol-start`, `fill-start`, `wordmark-start`, `sweep-start`, `stable` and `end`. Build it with `python3 splash/lottie_trace.py`, and render its review video with `node splash/render-lottie.js SplashAnimation-trace.json`. Both builders share `splash/lottie_kit.py`.
- `splash/tragram-lockup.svg` is the final logo and wordmark at the size they have in the splash: 142.3 × 161.5 pt, with the logo 142.3 pt wide on the 375 × 812 canvas. `splash/tragram-lockup-375x812.svg` is the whole 375 × 812 canvas with a transparent background and the lockup exactly where both animations leave it, at x 116.25, y 328.85. It lines up with the Lottie's last frame, so it can serve as the static launch screen before or after the animation. `splash/splash-375x812.svg` is the same screen with the splash background: `#04080F` and the soft blue glow at the top, read from the Lottie's background layers. It is the animations' last frame as a still. `splash/splash-375x812@3x.png` is that SVG rendered at 1125 × 2436. Regenerate the SVGs with `python3 splash/lockup.py`. The original file's glow used an older keyframe format that lottie-web doesn't animate, so it stayed at 82% opacity. The builders now convert those keyframes to the current format, and the glow eases from 82% to 100% as intended.
- The horizontal logos have the ribbon symbol with the wordmark to its right, in `#F4F7FB` for dark backgrounds. The wordmark is Manrope Bold, outlined, with its capitals centred on the symbol.
  - `brand/tragram-horizontal-22.svg` (118 × 22 px) and `-200.svg` (1076 × 200 px) read "Tragram", set at 22 px at the 22 px height and raised so the g stays inside the height.
  - `brand/tragram-horizontal-caps-22.svg` (137 × 22 px) and `-caps-200.svg` (1244 × 200 px) read "TRAGRAM", set at 20.5 px at the 22 px height, tracked out 0.06 em.
  - Regenerate them with `python3 splash/horizontal.py <Manrope-Bold.ttf>`.
- The wordmark is Manrope SemiBold converted to outlines, because the app's Aeonik font isn't in this repo. To swap the font, run `python3 splash/wordmark.py <font.ttf>`.

| Time | Step |
|------|------|
| 0.05–0.85s | upper ribbon draws left to right |
| 0.42–1.68s | the fold, then the lower ribbon top to bottom, in one continuous sweep |
| 1.20–2.30s | the logo glides up into its final centre and settles from 101.2% to 100% |
| 1.32–2.26s | T → r → a → g → r → a → m fade in and rise, 65 ms apart |
| 2.20–2.72s | final light sweep across the logo |
| 2.72–3.10s | the full logo and wordmark hold still to the last frame (no fade-out) |

## App icons

`icons/` holds the Tragram app icons: the ribbon logo, with its original gradients, centred on the app's navy (`#04080F`) with a soft lift behind it. `python3 icons/build.py` regenerates everything. It reads the logo from `splash/splash.html` and needs Node with Playwright, and ffmpeg.

- **iOS:** copy `icons/ios/AppIcon.appiconset` into `Images.xcassets`, replacing the existing set. It fills every slot of the iPhone icon set:
  - Notification: 20 pt at 2x and 3x (40, 60 px)
  - Settings: 29 pt at 2x and 3x (58, 87 px)
  - Spotlight: 40 pt at 2x and 3x (80, 120 px)
  - App: 60 pt at 2x and 3x (120, 180 px)
  - App Store: 1024 px

  Each size is rendered from the vector master, and all are opaque RGB with no alpha channel, as Apple requires. `icons/ios/ios18/` holds optional iOS 18 dark and tinted 1024 variants with transparent backgrounds. They're only needed if you move to Xcode's single-size set.
- **Android:** copy `icons/android/res/*` into `android/app/src/main/res/`.
  - The adaptive icon (API 26+) uses vector layers in `drawable/`: foreground, background, and a monochrome layer for themed icons (API 33). The logo is 44 dp wide, so its corners stay inside the 66 dp safe circle.
  - Older launchers get the legacy `mipmap-*/ic_launcher.png` (rounded square) and `ic_launcher_round.png` (circle) at 48–192 px.
  - `icons/android/play-store-512.png` is the Google Play listing icon.
- `icons/previews/icons.png` shows every variant under its real mask, for review.
