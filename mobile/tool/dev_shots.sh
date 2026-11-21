#!/bin/sh
# Screenshots of the dev Quran/player/recorder page walking itself (--dart-define=DEV_WALK=true), on one device.
#   tool/dev_shots.sh ios <simulator-udid> <out-dir> [extra flutter run args]
#   tool/dev_shots.sh android <adb-serial> <out-dir> [extra flutter run args]
set -eu
platform=$1 dev=$2 out=$3
shift 3
cd "$(dirname "$0")/.."
mkdir -p "$out"
log="$out/${platform}_walk.log"
adb="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
flutter run -d "$dev" --dart-define=DEV_PAGE=quran --dart-define=DEV_WALK=true "$@" >"$log" 2>&1 &
pid=$!
seen=""
while kill -0 $pid 2>/dev/null; do
  for name in $(grep -o 'SHOT [a-z_0-9]*' "$log" | cut -d' ' -f2); do
    case " $seen " in *" $name "*) continue ;; esac
    seen="$seen $name"
    [ "$name" = done ] && { kill $pid; wait $pid 2>/dev/null || true; echo "shots in $out"; exit 0; }
    if [ "$platform" = ios ]; then xcrun simctl io "$dev" screenshot "$out/${platform}_$name.png" >/dev/null 2>&1
    else "$adb" -s "$dev" exec-out screencap -p >"$out/${platform}_$name.png"; fi
    echo "shot $name"
  done
  sleep 0.3
done
echo "flutter run exited before the walk finished: see $log"; exit 1
