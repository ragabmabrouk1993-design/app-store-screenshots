#!/bin/bash
# Renders the App Store screenshots at 1284x2778 (iPhone 6.5" display):
#   src/NN-*.html       -> out/light/NN-*.png
#   src/dark-NN-*.html  -> out/dark/NN-*.png
#   src/alt-NN-*.html   -> out/alt/NN-*.png
#   src/alt-ar-NN-*.html -> out/alt-ar/NN-*.png (Arabic)
# then one overview board per set, preview-<set>.png (for sharing, not for upload).
#   ./render.sh            render everything
#   ./render.sh dark       render only the dark set (or: light, alt, alt-ar)
#   ./render.sh dark 04    render only dark 04-*
#   RAW=1 ./render.sh 01   render the bare in-app screen at 440x956pt (debug/compare)
cd "$(dirname "$0")" || exit 1
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DSF=2.9181818182   # 1284 / 440; pages are authored at 440 x 952 pt
shot() { "$CHROME" --headless=new --disable-gpu --hide-scrollbars --run-all-compositor-stages-before-draw --force-device-scale-factor="$1" \
  --window-size="$2" --virtual-time-budget=5000 --allow-file-access-from-files --screenshot="$PWD/$3" "file://$PWD/$4" >/dev/null 2>&1; }
sets="light dark alt alt-ar"; case "$1" in light|dark|alt|alt-ar) sets=$1; shift;; esac
for set in $sets; do
  pre=""; [ "$set" != light ] && pre="$set-"
  mkdir -p "out/$set"
  for f in src/$pre[0-9]*.html; do
    n=$(basename "$f" .html); n=${n#$pre}
    [ -n "$1" ] && [[ "$n" != $1* ]] && continue
    if [ -n "$RAW" ]; then shot 3 440,956 "out/raw-$n.png" "$f#raw"; echo "out/raw-$n.png"
    else shot $DSF 440,952 "out/$set/$n.png" "$f"; echo "out/$set/$n.png"; fi
  done
  if [ -z "$1" ] && [ -z "$RAW" ]; then shot 1 2400,1000 "preview-$set.png" "src/board.html#$set"; echo "preview-$set.png"; fi
done
