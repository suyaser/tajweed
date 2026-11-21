#!/bin/sh
# The whole check, in CI order (docs/19 §2.8): web tests (content checkers + parity fixtures) and the web build's
# type check → sync → Dart.
# Run from anywhere: mobile/tool/check.sh
set -eu
cd "$(dirname "$0")/../.."          # repo root
npx vitest run
npx tsc -b                          # npm run build's type check: a test can pass vitest and still break it
mobile/tool/sync_assets.sh
node mobile/tool/gen_tokens.mjs --check   # lib/ui/tokens.g.dart matches src/styles/*.css
cd mobile
flutter pub get >/dev/null 2>&1 || flutter pub get
flutter analyze
flutter test
