#!/bin/bash
# Renders src/NN-*.html to out/NN-*.png at 1320x2868 (App Store 6.9" iPhone).
#   ./render.sh           render all screenshots
#   ./render.sh 03        render only screenshots whose name starts with 03
#   RAW=1 ./render.sh 01  render the bare in-app screen at 440x956pt (debug/compare)
cd "$(dirname "$0")" || exit 1
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p out
for f in src/[0-9]*.html; do
  n=$(basename "$f" .html)
  [ -n "$1" ] && [[ "$n" != $1* ]] && continue
  if [ -n "$RAW" ]; then hash="#raw"; dest="out/raw-$n.png"; else hash=""; dest="out/$n.png"; fi
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=3 \
    --window-size=440,956 --virtual-time-budget=5000 --allow-file-access-from-files \
    --screenshot="$PWD/$dest" "file://$PWD/$f$hash" >/dev/null 2>&1
  echo "$dest"
done
