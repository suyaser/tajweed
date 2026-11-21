// The app's singletons, opened once before the first frame: the web's module-level store and audio stores.
import 'dart:io';

import 'package:path_provider/path_provider.dart';

import '../audio/downloads.dart';
import '../audio/player.dart';
import '../audio/recordings.dart';
import '../content/content.dart';
import '../core/store.dart';
import '../core/types.dart';
import 'local.dart';

late AppStore store;
late Local local;
late Recordings recordings;
late Downloads downloads;

Future<void> openServices() async {
  store = await AppStore.open(content.units);
  local = Local(File('${(await getApplicationDocumentsDirectory()).path}/local.json'));
  recordings = await Recordings.open();
  downloads = await Downloads.open();
}

/// The learner's reciter (settings.reciterId), the first one when unknown.
Reciter get learnerReciter => content.reciters.where((r) => r.id == store.data.settings.reciterId).firstOrNull ?? content.reciters.first;

/// A player for one screen (the web's usePlayer per screen) that plays a saved file before the network.
Player newPlayer() => Player()..source = downloads.source;
