// Port of src/core/day.ts.
import 'types.dart';

String _pad(int n) => n.toString().padLeft(2, '0');
String _fmt(DateTime d) => '${d.year}-${_pad(d.month)}-${_pad(d.day)}';

/// Local study day; the day starts at 03:00, so 01:30 still counts for the evening before.
Day today([DateTime? now]) {
  final n = now ?? DateTime.now();
  return _fmt(DateTime(n.year, n.month, n.day - (n.hour < 3 ? 1 : 0)));
}

// Day arithmetic in UTC so DST never shifts a date.
DateTime _utc(Day d) => DateTime.parse('${d}T00:00:00Z');

Day addDays(Day d, int n) => _fmt(_utc(d).add(Duration(days: n)));

/// a − b in whole days.
int diffDays(Day a, Day b) => (_utc(a).difference(_utc(b)).inHours / 24).round();

/// The 7 days of the week containing [d]; weekStart 6 = Saturday (design §9.3), 0 = Sunday.
List<Day> weekDays(Day d, [int weekStart = 6]) {
  final dow = _utc(d).weekday % 7; // Dart: 1 = Monday … 7 = Sunday
  final start = addDays(d, -((dow - weekStart + 7) % 7));
  return [for (var i = 0; i < 7; i++) addDays(start, i)];
}

/// JS `new Date().toISOString()`: UTC, milliseconds.
Iso isoOf(DateTime t) => '${t.toUtc().toIso8601String().substring(0, 23)}Z';

/// A stable sort (Dart's List.sort is not; JS's is, and the schedule replays ties in input order).
void stableSort<T>(List<T> xs, int Function(T, T) cmp) {
  final ix = [for (var i = 0; i < xs.length; i++) (i, xs[i])];
  ix.sort((a, b) {
    final c = cmp(a.$2, b.$2);
    return c != 0 ? c : a.$1 - b.$1;
  });
  for (var i = 0; i < xs.length; i++) {
    xs[i] = ix[i].$2;
  }
}

