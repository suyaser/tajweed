#!/bin/sh
# Copies the web repo's shared content into mobile/assets/shared/ (git-ignored, generated).
# The web files stay the single source; run this before `flutter run`, `flutter test` and `flutter build`.
set -eu
cd "$(dirname "$0")/../.."          # repo root
out=mobile/assets/shared
mkdir -p "$out/content/teach" "$out/i18n/ar" "$out/data/surah"
rsync -a --delete --include='*.json' --exclude='*' content/ "$out/content/"
rsync -a --delete content/teach/ "$out/content/teach/"
rsync -a --delete src/i18n/ar/ "$out/i18n/ar/"
cp src/content/also.json src/quran/surahs.json "$out/content/"
rsync -a --delete public/data/surah/ "$out/data/surah/"
cp public/data/meta.json "$out/data/"
echo "synced to $out ($(du -sh "$out" | cut -f1))"
