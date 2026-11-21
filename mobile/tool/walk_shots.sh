#!/bin/sh
# Screenshots of a new learner's walk (integration_test/walk_test.dart): onboarding, lesson 1, Today, Path, the unit.
#   tool/walk_shots.sh ios <simulator-udid> <out-dir> [ar|en] [light|dark]
#   tool/walk_shots.sh android <adb-serial> <out-dir> [ar|en] [light|dark]
set -eu
platform=$1 dev=$2 out=$3 lang=${4:-ar} theme=${5:-light}
cd "$(dirname "$0")/.."
mkdir -p "$out"
log="$out/${platform}_${lang}_${theme}_walk.log"
adb="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
flutter test integration_test/walk_test.dart -d "$dev" --dart-define=WALK_LANG="$lang" --dart-define=WALK_THEME="$theme" >"$log" 2>&1 &
pid=$!
seen=""
while kill -0 $pid 2>/dev/null; do
  for name in $(grep -o 'SHOT [a-z_0-9]*' "$log" | cut -d' ' -f2); do
    case " $seen " in *" $name "*) continue ;; esac
    seen="$seen $name"
    [ "$name" = done ] && continue
    if [ "$platform" = ios ]; then xcrun simctl io "$dev" screenshot "$out/${platform}_$name.png" >/dev/null 2>&1
    else "$adb" -s "$dev" exec-out screencap -p >"$out/${platform}_$name.png"; fi
    echo "shot $name"
  done
  sleep 0.3
done
wait $pid && echo "walk passed; shots in $out" || { echo "walk failed: see $log"; exit 1; }
