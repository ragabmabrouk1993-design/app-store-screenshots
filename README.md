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

Layouts alternate: odd screenshots have the headline on top and the phone below; even ones have the phone on top and the headline below. The channels and account are fictional demo data.

`v1-dark/` keeps the first dark draft for reference.

## Re-render

```bash
./render.sh            # all three sets + their preview boards
./render.sh dark       # only the dark set (or: light, alt, alt-ar)
./render.sh dark 04    # only dark 04-*
RAW=1 ./render.sh 01   # bare in-app screen, for comparing with a device capture
```

Requires Google Chrome in `/Applications`.

## Figma

`figma/` turns the alt and alt-ar sets into a Figma file with editable text: one 1284 × 2778 frame per screenshot, the background as one image, and a frame each for the title, the phone, the card and the notification. Inside those frames the artwork (phone body, icons, card fills, laurels) is an image, and every text on top of it is a live Figma text layer in the design's font, weight, size, color and spacing: headline, subtitle, badge, and all the text on the phone screens, cards and notifications. Rotated phones are rotated frames, so their text is rotated with them.

1. `python3 figma/build.py` renders the layers into `figma/import/` with `manifest.json`. It needs Pillow (`pip3 install pillow`).
2. In Figma desktop, open a design file and choose Plugins > Development > Import plugin from manifest…, then pick `figma/plugin/manifest.json`.
3. Run the plugin and choose the `figma/import` folder. It adds a page called "App Store screenshots" with an English section and an Arabic section.

Fonts: Aeonik (the app font) for English, SF Pro for in-app and Latin text, SF Arabic for Arabic. SF Pro and SF Arabic are free from developer.apple.com/fonts; install them before running the plugin. If a font is missing the plugin uses a stand-in (Inter, Noto Sans Arabic), the text stays editable, and the closing message names the missing fonts.

A few texts stay part of the artwork: the keyboard keys, emoji, text hidden behind the keyboard or tab bar, and settings rows fading out under the header. The export helper is `src/export.js`, which `kit.js` loads for `#fx=` URLs.
