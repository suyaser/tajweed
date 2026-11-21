#!/bin/sh
# The whole check, in CI order (docs/19 §2.8): web tests (content checkers + parity fixtures) → sync → Dart.
# Run from anywhere: mobile/tool/check.sh
set -eu
cd "$(dirname "$0")/../.."          # repo root
npx vitest run
mobile/tool/sync_assets.sh
cd mobile
flutter pub get >/dev/null 2>&1 || flutter pub get
flutter analyze
flutter test
