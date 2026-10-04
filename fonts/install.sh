#!/bin/bash
# Downloads SF Pro and SF Arabic from Apple (developer.apple.com/fonts) into fonts/, installs them in
# ~/Library/Fonts for Figma, and writes fonts/fonts.css, which sets the Arabic pages in this SF Arabic.
# The files stay out of git (see .gitignore): Apple's license doesn't allow sharing them. macOS only.
#   fonts/install.sh              download, copy into fonts/ and install
#   fonts/install.sh --css-only   only rewrite fonts.css from the files already in fonts/
set -euo pipefail
cd "$(dirname "$0")"
URL=https://devimages-cdn.apple.com/design/resources/download

if [ "${1:-}" != --css-only ]; then
  [ "$(uname)" = Darwin ] || { echo "install.sh needs macOS (hdiutil, pkgutil)" >&2; exit 1; }
  tmp=$(mktemp -d); trap 'hdiutil detach -quiet "$tmp"/mnt-* 2>/dev/null || true; rm -rf "$tmp"' EXIT
  for name in SF-Pro SF-Arabic; do
    echo "Downloading $name.dmg"
    curl -fL --progress-bar -o "$tmp/$name.dmg" "$URL/$name.dmg"
    hdiutil attach -nobrowse -readonly -quiet -mountpoint "$tmp/mnt-$name" "$tmp/$name.dmg"
    pkgutil --expand-full "$tmp/mnt-$name"/*.pkg "$tmp/$name"
    hdiutil detach -quiet "$tmp/mnt-$name"
    # upright SF Pro Text / Display and SF Arabic; no italics, Rounded or Compact
    find "$tmp/$name" -type f \( -name 'SF-Pro-Text-*' -o -name 'SF-Pro-Display-*' -o -name 'SF-Arabic*' \) \
      \( -name '*.otf' -o -name '*.ttf' \) ! -iname '*italic*' ! -iname '*rounded*' -exec cp {} . \;
  done
  mkdir -p ~/Library/Fonts
  cp SF-Pro-Text-* SF-Pro-Display-* SF-Arabic* ~/Library/Fonts/
  echo "Installed $(ls SF-Pro-Text-* SF-Pro-Display-* SF-Arabic* | wc -l | tr -d ' ') font files in ~/Library/Fonts"
fi

# fonts.css: one @font-face per SF Arabic file, limited to Arabic letters so Latin letters and digits
# still come from SF Pro (system-ui), as on iOS. ar.css imports it; without it the pages use system-ui.
weight() { case "$1" in
  Ultralight) echo 100;; Thin) echo 200;; Light) echo 300;; Regular) echo 400;; Medium) echo 500;;
  Semibold) echo 600;; Bold) echo 700;; Heavy) echo 800;; Black) echo 900;; *) echo '1 1000';; esac; }
range='U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF'
{
  echo "/* Written by fonts/install.sh from the SF Arabic files in this folder. */"
  n=0
  for f in SF-Arabic*.otf SF-Arabic*.ttf; do
    [ -e "$f" ] || continue; n=$((n + 1))
    w=${f%.*}; w=${w#SF-Arabic}; w=${w#-}
    echo "@font-face { font-family: \"SF Arabic\"; font-weight: $(weight "$w"); src: url(\"$f\"); unicode-range: $range; }"
  done
  # only with faces above: a bare "SF Arabic" would pick up a system copy, whose Latin letters aren't SF Pro
  [ $n = 0 ] || echo 'html body, html body * { font-family: "SF Arabic", system-ui, sans-serif !important; }'
} > fonts.css
echo "Wrote fonts/fonts.css ($(grep -c @font-face fonts.css) SF Arabic faces)"
