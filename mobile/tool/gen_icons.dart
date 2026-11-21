// App icon and splash images, drawn from the web's icon (public/icon.svg: the green tile, the gold eight-point star of
// two squares and the letter ta in Amiri). Run after changing the design:
//   cd mobile && flutter test tool/gen_icons.dart
// Writes the Android launcher icons (legacy and the adaptive foreground), the splash image, and the iOS 1024 icon
// (opaque, as App Store Connect requires) and launch image. Colours are the SVG's; keep both in step.
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

const green = Color(0xFF0F5B45), gold = Color(0xFFD8B45C), letter = Color(0xFFF3D98F);

enum Kind {
  rounded, // the web's tile with rx 96/512 (Android legacy icon, splash image)
  square, // full bleed, opaque (iOS: the system rounds it)
  foreground, // the star and letter only, scaled into the adaptive icon's safe circle (66 of 108 dp)
}

/// The SVG's drawing in 512 units, onto a [px] square.
void draw(Canvas c, double px, Kind kind) {
  c.scale(px / 512);
  if (kind == Kind.rounded) c.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(0, 0, 512, 512), const Radius.circular(96)), Paint()..color = green);
  if (kind == Kind.square) c.drawRect(const Rect.fromLTWH(0, 0, 512, 512), Paint()..color = green);
  if (kind == Kind.foreground) {
    c.translate(256, 256);
    c.scale(0.8);
    c.translate(-256, -256);
  }
  final fill = Paint()..color = green;
  final stroke = Paint()
    ..color = gold
    ..style = PaintingStyle.stroke
    ..strokeWidth = 14;
  for (final turn in [0.0, 45.0]) {
    c.save();
    c.translate(256, 256);
    c.rotate(turn * 3.141592653589793 / 180);
    const sq = Rect.fromLTWH(-120, -120, 240, 240);
    c.drawRect(sq, fill);
    c.drawRect(sq, stroke);
    c.restore();
  }
  final tp = TextPainter(
    text: const TextSpan(text: '\u062a', style: TextStyle(fontFamily: 'Amiri', fontSize: 150, color: letter)),
    textDirection: TextDirection.rtl,
  )..layout();
  final base = tp.computeDistanceToActualBaseline(TextBaseline.alphabetic);
  tp.paint(c, Offset(256 - tp.width / 2, 300 - base)); // text-anchor middle, baseline y 300
}

Future<Uint8List> render(int px, Kind kind) async {
  final rec = ui.PictureRecorder();
  draw(Canvas(rec), px.toDouble(), kind);
  final img = await rec.endRecording().toImage(px, px);
  final rgba = (await img.toByteData(format: ui.ImageByteFormat.rawStraightRgba))!.buffer.asUint8List();
  return png(px, rgba, alpha: kind != Kind.square);
}

/// A minimal PNG encoder: RGBA, or RGB when [alpha] is false (an App Store icon must have no alpha channel).
Uint8List png(int px, Uint8List rgba, {required bool alpha}) {
  final ch = alpha ? 4 : 3;
  final raw = BytesBuilder();
  for (var y = 0; y < px; y++) {
    raw.addByte(0);
    for (var x = 0; x < px; x++) {
      final i = (y * px + x) * 4;
      raw.add(rgba.sublist(i, i + ch));
    }
  }
  Uint8List chunk(String type, List<int> data) {
    final body = [...type.codeUnits, ...data];
    final b = BytesBuilder()
      ..add((ByteData(4)..setUint32(0, data.length)).buffer.asUint8List())
      ..add(body)
      ..add((ByteData(4)..setUint32(0, crc32(body))).buffer.asUint8List());
    return b.toBytes();
  }

  final ihdr = ByteData(13)
    ..setUint32(0, px)
    ..setUint32(4, px)
    ..setUint8(8, 8)
    ..setUint8(9, alpha ? 6 : 2);
  return (BytesBuilder()
        ..add([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
        ..add(chunk('IHDR', ihdr.buffer.asUint8List()))
        ..add(chunk('IDAT', ZLibCodec(level: 9).encode(raw.toBytes())))
        ..add(chunk('IEND', const [])))
      .toBytes();
}

int crc32(List<int> bytes) {
  var crc = 0xFFFFFFFF;
  for (final b in bytes) {
    crc ^= b;
    for (var k = 0; k < 8; k++) {
      crc = (crc & 1) != 0 ? (crc >> 1) ^ 0xEDB88320 : crc >> 1;
    }
  }
  return crc ^ 0xFFFFFFFF;
}

void main() {
  testWidgets('generate icons', (tester) async {
    await tester.runAsync(() async {
      await (FontLoader('Amiri')..addFont(Future.value(ByteData.sublistView(File('assets/fonts/Amiri-Regular.ttf').readAsBytesSync())))).load();
      final out = <String, (int, Kind)>{
        // Android: legacy 48 dp, adaptive foreground 108 dp, splash image 112 dp (pre-12 launch screen)
        for (final (d, k) in [('mdpi', 1.0), ('hdpi', 1.5), ('xhdpi', 2.0), ('xxhdpi', 3.0), ('xxxhdpi', 4.0)]) ...{
          'android/app/src/main/res/mipmap-$d/ic_launcher.png': ((48 * k).round(), Kind.rounded),
          'android/app/src/main/res/mipmap-$d/ic_launcher_foreground.png': ((108 * k).round(), Kind.foreground),
          'android/app/src/main/res/drawable-$d/splash.png': ((112 * k).round(), Kind.rounded),
        },
        // iOS: one 1024 icon (Xcode makes the rest), launch image 112 pt
        'ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png': (1024, Kind.square),
        'ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage.png': (112, Kind.rounded),
        'ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage@2x.png': (224, Kind.rounded),
        'ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage@3x.png': (336, Kind.rounded),
      };
      for (final MapEntry(key: path, value: (px, kind)) in out.entries) {
        File(path)
          ..parent.createSync(recursive: true)
          ..writeAsBytesSync(await render(px, kind));
      }
    });
  });
}
