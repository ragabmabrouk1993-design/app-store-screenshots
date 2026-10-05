#!/bin/bash
# Renders the App Store screenshots at 1284x2778 (iPhone 6.5" display):
#   src/NN-*.html       -> out/light/NN-*.png
#   src/dark-NN-*.html  -> out/dark/NN-*.png
#   src/alt-NN-*.html   -> out/alt/NN-*.png
#   src/alt-ar-NN-*.html -> out/alt-ar/NN-*.png (Arabic)
# then one overview board per set, preview-<set>.png (for sharing, not for upload).
# Onboarding (app's onboarding layout):
#   src/onb-mock-NN-*.html    -> out/onb-mock/NN-*.png  mockup image for the app, 686x1032 transparent PNG
#                                                       (+ NN-*@2x.png, 1372x2064)
#   src/onb-mock-ar-NN-*.html -> out/onb-mock-ar/...    the same in Arabic
#   src/onb-NN-*.html, src/onb-ar-NN-*.html -> out/onb/, out/onb-ar/  full screens for review, 1125x2436
#   board: preview-onb.png
# Android option (Google Play phone screenshots, 1080x2160, 24-bit PNG):
#   src/alt-NN-*.html?android    -> out/alt-android/NN-*.png
#   src/alt-ar-NN-*.html?android -> out/alt-ar-android/NN-*.png (Arabic)
#   Pixel-style phone, Android status bar, notifications and Gboard number pad (src/android.css);
#   the canvas is 476 x 952 pt, as Google Play takes at most 2:1.
# Website mockups (tragram.app): src/web-<name>.html -> out/web/<name>.png at 2x, transparent, named as on the site
#   (sizes in src/web-sizes.txt, pages written by tools/web_mockups.py).
#   WEB_REPO=../tragram-web ./render.sh web   also copies them into <WEB_REPO>/public/images/
# Google Play feature graphic: src/feature-en.html, src/feature-ar.html -> out/feature/feature-en.png, feature-ar.png (1024x500)
#   ./render.sh            render everything
#   ./render.sh dark       render only the dark set (or: light, alt, alt-ar, alt-android, alt-ar-android, onb, onb-ar, onb-mock, onb-mock-ar, feature, web)
#   ./render.sh dark 04    render only dark 04-*
#   RAW=1 ./render.sh 01   render the bare in-app screen at 440x956pt (debug/compare)
cd "$(dirname "$0")" || exit 1
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"   # or CHROME=/path/to/chrome ./render.sh
DSF=2.9181818182   # 1284 / 440; pages are authored at 440 x 952 pt
ADSF=2.2689075630  # 1080 / 476; the Android option widens the canvas to 476 x 952 pt
shot() { "$CHROME" --headless=new --disable-gpu --hide-scrollbars --default-background-color=00000000 --run-all-compositor-stages-before-draw --force-device-scale-factor="$1" \
  --window-size="$2" --virtual-time-budget=5000 --allow-file-access-from-files --screenshot="$PWD/$3" "file://$PWD/$4" >/dev/null 2>&1; }
# opaque background: Google Play wants 24-bit PNGs without alpha
ashot() { "$CHROME" --headless=new --disable-gpu --hide-scrollbars --run-all-compositor-stages-before-draw --force-device-scale-factor=$ADSF \
  --window-size=476,952 --virtual-time-budget=5000 --allow-file-access-from-files --screenshot="$PWD/$1" "file://$PWD/$2?android" >/dev/null 2>&1; }
sets="light dark alt alt-ar alt-android alt-ar-android onb onb-ar onb-mock onb-mock-ar feature web"
case "$1" in light|dark|alt|alt-ar|alt-android|alt-ar-android|onb|onb-ar|onb-mock|onb-mock-ar|feature|web) sets=$1; shift;; esac
for set in $sets; do
  if [ "$set" = web ]; then
    [ -n "$RAW" ] && continue
    mkdir -p out/web
    while read -r n w h; do
      case "$n" in ''|'#'*) continue;; esac
      [ -n "$1" ] && [[ "$n" != $1* ]] && continue
      shot 2 "$w,$h" "out/web/$n.png" "src/web-$n.html"; echo "out/web/$n.png"
      [ -n "$WEB_REPO" ] && cp "out/web/$n.png" "$WEB_REPO/public/images/$n.png" && echo "  -> $WEB_REPO/public/images/$n.png"
    done < src/web-sizes.txt
    continue
  fi
  if [[ $set == *-android ]]; then
    [ -n "$RAW" ] && continue
    pre="${set%-android}-"; mkdir -p "out/$set"
    for f in src/$pre[0-9]*.html; do
      n=$(basename "$f" .html); n=${n#$pre}
      [ -n "$1" ] && [[ "$n" != $1* ]] && continue
      ashot "out/$set/$n.png" "$f"; echo "out/$set/$n.png"
    done
    continue
  fi
  if [ "$set" = feature ]; then
    [ -n "$RAW" ] && continue
    mkdir -p out/feature
    for f in src/feature-*.html; do n=$(basename "$f" .html); shot 1 1024,500 "out/feature/$n.png" "$f"; echo "out/feature/$n.png"; done
    continue
  fi
  pre=""; [ "$set" != light ] && pre="$set-"
  mkdir -p "out/$set"
  for f in src/$pre[0-9]*.html; do
    n=$(basename "$f" .html); n=${n#$pre}
    [ -n "$1" ] && [[ "$n" != $1* ]] && continue
    if [ -n "$RAW" ]; then shot 3 440,956 "out/raw-$n.png" "$f#raw"; echo "out/raw-$n.png"
    elif [[ $set == onb-mock* ]]; then shot 2 343,516 "out/$set/$n.png" "$f"; shot 4 343,516 "out/$set/$n@2x.png" "$f"; echo "out/$set/$n.png"
    elif [[ $set == onb* ]]; then shot 3 375,812 "out/$set/$n.png" "$f"; echo "out/$set/$n.png"
    else shot $DSF 440,952 "out/$set/$n.png" "$f"; echo "out/$set/$n.png"; fi
  done
  [ -n "$1" ] || [ -n "$RAW" ] && continue
  if [[ $set == onb-mock* ]]; then :
  elif [[ $set == onb* ]]; then shot 1 2400,1000 "preview-onb.png" "src/onb-board.html"; echo "preview-onb.png"
  else shot 1 2400,1000 "preview-$set.png" "src/board.html#$set"; echo "preview-$set.png"; fi
done
