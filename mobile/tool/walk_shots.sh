#!/bin/sh
# Screenshots of a new learner's walk (integration_test/walk_test.dart): onboarding, lesson 1, Today, Path, the unit.
#   tool/walk_shots.sh ios <simulator-udid> <out-dir> [ar|en] [light|dark]
#   tool/walk_shots.sh android <adb-serial> <out-dir> [ar|en] [light|dark]
# A sixth argument runs another walk: integration_test/screens_test.dart (a learner five lessons in, every other screen).
set -eu
platform=$1 dev=$2 out=$3 lang=${4:-ar} theme=${5:-light} walk=${6:-integration_test/walk_test.dart}
cd "$(dirname "$0")/.."
mkdir -p "$out"
log="$out/${platform}_${lang}_${theme}_$(basename "$walk" .dart).log"
adb="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
flutter test "$walk" -d "$dev" --dart-define=WALK_LANG="$lang" --dart-define=WALK_THEME="$theme" >"$log" 2>&1 &
pid=$!
seen="" got=0
while kill -0 $pid 2>/dev/null; do
  for name in $(grep -o 'SHOT [a-z_0-9]*' "$log" | cut -d' ' -f2); do
    case " $seen " in *" $name "*) continue ;; esac
    seen="$seen $name"
    [ "$name" = done ] && continue
    rm -f "$out/${platform}_$name.png"
    if [ "$platform" = ios ]; then xcrun simctl io "$dev" screenshot "$out/${platform}_$name.png" >/dev/null 2>&1 || true
    else "$adb" -s "$dev" exec-out screencap -p >"$out/${platform}_$name.png" || true; fi
    if [ -s "$out/${platform}_$name.png" ]; then got=$((got + 1)); echo "shot $name"; else echo "shot $name FAILED"; fi
  done
  sleep 0.3
done
# Passed only when flutter test says so, the walk reached its end and every shot it announced was taken (a run cut
# short can exit 0 after a few shots).
status=0; wait $pid || status=$?
want=$(sed -n 's/.*SHOT done \([0-9][0-9]*\).*/\1/p' "$log" | tail -1)
if [ $status -ne 0 ] || ! grep -q 'All tests passed!' "$log" || [ -z "$want" ] || [ "$got" -ne "$want" ]; then
  echo "walk failed (exit $status, shots $got of ${want:-?}): see $log"; exit 1
fi
echo "walk passed; $got shots in $out"
