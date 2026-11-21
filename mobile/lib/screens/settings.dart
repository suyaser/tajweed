// Port of src/screens/Settings.tsx (#/settings), the MVP part (docs/19 §3): language, text size, theme, tajweed
// patterns; the model reciter with samples and the folded المد المنفصل length; wird time and teacher days; back up,
// restore, storage, reset. Account, reminders (.ics), the teacher link and circles need an account (phase 2).
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';

import '../app/recovery.dart';
import '../app/services.dart';
import '../app/shell.dart';
import '../content/content.dart';
import '../core/day.dart';
import '../core/store.dart';
import '../core/types.dart';
import '../i18n/i18n.dart';
import '../quran/quran.dart';
import '../quran/verse.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';
import 'review.dart';
import 'study.dart';

const _weekLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// Arabic day chips: short forms that fit a chip (Sunday first)
const _arDays = [
  '\u0623\u062d\u062f', '\u0625\u062b\u0646\u064a\u0646', '\u062b\u0644\u0627\u062b\u0627\u0621', '\u0623\u0631\u0628\u0639\u0627\u0621', //
  '\u062e\u0645\u064a\u0633', '\u062c\u0645\u0639\u0629', '\u0633\u0628\u062a',
];
String formatBytes(int n) => n < 1024
    ? t('{n} B', {'n': n})
    : n < 1024 * 1024
    ? t('{n} KB', {'n': digits((n / 1024).toStringAsFixed(n < 10240 ? 1 : 0))})
    : t('{n} MB', {'n': digits((n / 1024 / 1024).toStringAsFixed(1))});

String daysAgo(Day d, Day on) {
  final n = diffDays(on, d);
  return n <= 0
      ? t('today')
      : n == 1
      ? t('yesterday')
      : tn('{n} days ago', '{n} days ago', n);
}

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key, this.section});
  final String? section; // ?s=wird|recitation (Today's routine card)
  @override
  State<SettingsScreen> createState() => _SettingsState();
}

class _SettingsState extends State<SettingsScreen> {
  final _keys = {'recitation': GlobalKey(), 'wird': GlobalKey()};
  late final _name = TextEditingController(text: store.data.settings.teacherName ?? '');
  bool _munfasilChanged = false;

  @override
  void initState() {
    super.initState();
    final k = _keys[widget.section];
    if (k != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (k.currentContext != null) Scrollable.ensureVisible(k.currentContext!);
      });
    }
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  void _set(Json patch) => store.updateSettings(patch);

  @override
  Widget build(BuildContext context) => ListenableBuilder(listenable: store, builder: (context, _) => _build(context));

  Widget _build(BuildContext context) {
    final c = context.c, ty = context.type;
    final s = store.data.settings;
    final reciter = learnerReciter;
    Widget seg<V>(V value, ValueChanged<V> on, List<(V, String)> opts) =>
        Segmented<V>(small: true, value: value, onChanged: on, options: [for (final (v, l) in opts) (value: v, label: l, icon: null)]);
    return PageBody(
      gap: Space.md,
      items: [
        PageHeader(
          en: 'Settings',
          ar: '\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a',
          detail: [
            reciter.nameAr,
            t('Wird at {time}', {'time': digits(s.wirdTime)}),
            riwayah,
          ],
          secondaryDetail: const {2},
        ),
        Group(
          en: 'Language and display',
          ar: '\u0627\u0644\u0644\u063a\u0629 \u0648\u0627\u0644\u0639\u0631\u0636',
          children: [
            ListRow(
              icon: Icons.translate,
              label: t('App language'),
              hint: t('The app reloads in the language you pick.'),
              stack: true,
              child: seg<Lang>(lang.value, (v) => v != lang.value ? saveLang(v) : null, [
                (Lang.ar, '\u0627\u0644\u0639\u0631\u0628\u064a\u0629'),
                (Lang.en, 'English'),
              ]),
            ),
            ListRow(
              icon: Icons.format_size,
              label: t('Text size'),
              hint: t('Makes all text and buttons bigger, including the Quran text.'),
              stack: true,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: Space.sm,
                children: [
                  seg<String>(s.textSize, (v) => _set({'textSize': v}), [('m', t('Normal')), ('l', t('Large')), ('xl', t('Larger'))]),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: Space.sm),
                    decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.control)),
                    child: VerseBlock(
                      ayah: const QAyah(key: '112:1', words: [..._ikhlasWords]),
                      reference: verseRef('112:1'),
                      size: VerseSize.read,
                      tajweed: false,
                    ),
                  ),
                ],
              ),
            ),
            ListRow(
              icon: Icons.contrast,
              label: t('Theme'),
              stack: true,
              child: seg<String>(s.theme, (v) => _set({'theme': v}), [('light', t('Light')), ('dark', t('Dark')), ('system', t('System'))]),
            ),
            ListRow(
              icon: Icons.texture,
              label: t('Tajweed patterns'),
              hint: t('Adds a pattern under each tajweed colour, so the rule does not rely on colour alone.'),
              child: Switch(value: s.tajweedPatterns, onChanged: (v) => _set({'tajweedPatterns': v})),
            ),
          ],
        ),
        Group(
          key: _keys['recitation'],
          en: 'Recitation',
          ar: '\u0627\u0644\u062a\u0644\u0627\u0648\u0629',
          children: [
            _Reciters(value: s.reciterId, onChange: (id) => _set({'reciterId': id})),
            _RowFold(
              icon: Icons.tune,
              title: t('Advanced'),
              children: [
                ListRow(
                  icon: Icons.straighten,
                  label: isAr
                      ? '\u0645\u0642\u062f\u0627\u0631 \u0627\u0644\u0645\u062f \u0627\u0644\u0645\u0646\u0641\u0635\u0644'
                      : '\u0627\u0644\u0645\u062f \u0627\u0644\u0645\u0646\u0641\u0635\u0644 length',
                  hint: t('Used in explanations and in length questions. Pick the length your teacher uses and keep it.'),
                  stack: true,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    spacing: Space.sm,
                    children: [
                      seg<int>(
                        s.munfasilLength,
                        (v) {
                          _set({'munfasilLength': v});
                          setState(() => _munfasilChanged = true);
                        },
                        [
                          (4, t('{n} counts', {'n': 4})),
                          (5, t('{n} counts', {'n': 5})),
                        ],
                      ),
                      if (_munfasilChanged)
                        Callout(
                          child: Text(
                            t('From now on, questions expect {n} counts. Keep it the same every time; tell your teacher you changed it.', {
                              'n': s.munfasilLength,
                            }),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
        Group(
          key: _keys['wird'],
          en: 'Study time and teacher',
          ar: '\u0627\u0644\u0648\u0631\u062f \u0648\u0627\u0644\u0634\u064a\u062e',
          children: [
            ListRow(
              icon: Icons.schedule,
              label: t('Wird time'),
              child: AppButton(
                label: digits(s.wirdTime),
                variant: ButtonVariant.secondary,
                size: ButtonSize.sm,
                onPressed: () async {
                  final [h, m] = s.wirdTime.split(':').map(int.parse).toList();
                  final picked = await showTimePicker(
                    context: context,
                    initialTime: TimeOfDay(hour: h, minute: m),
                  );
                  if (picked != null) _set({'wirdTime': '${'${picked.hour}'.padLeft(2, '0')}:${'${picked.minute}'.padLeft(2, '0')}'});
                },
              ),
            ),
            ListRow(
              icon: Icons.calendar_month_outlined,
              label: t('Teacher day(s)'),
              stack: true,
              child: Semantics(
                label: t('Teacher days'),
                child: Wrap(
                  spacing: Space.xs,
                  runSpacing: Space.xs,
                  children: [
                    for (final i in [6, 0, 1, 2, 3, 4, 5])
                      Builder(
                        builder: (context) {
                          final on = s.teacherDays.contains(i);
                          return Semantics(
                            button: true,
                            selected: on,
                            label: t(_weekLong[i]),
                            excludeSemantics: true,
                            child: Material(
                              color: on ? c.primaryFill : Colors.transparent,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(Radii.control),
                                side: BorderSide(color: on ? c.primary : c.outlineVariant),
                              ),
                              child: InkWell(
                                borderRadius: BorderRadius.circular(Radii.control),
                                onTap: () => _set({
                                  'teacherDays': on ? (s.teacherDays.where((x) => x != i).toList()) : ([...s.teacherDays, i]..sort()),
                                }),
                                child: Container(
                                  width: isAr ? 64 : 42,
                                  height: 44,
                                  alignment: Alignment.center,
                                  child: Text(
                                    isAr ? _arDays[i] : t(_weekLong[i]).substring(0, 3),
                                    style: ty.label.weight(600).copyWith(color: on ? c.onPrimary : c.onSurfaceVariant),
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ),
            ),
            ListRow(
              icon: Icons.person_outline,
              label: t("Teacher's name"),
              stack: true,
              child: Focus(
                onFocusChange: (f) => f ? null : _set({'teacherName': _name.text.trim().isEmpty ? null : _name.text.trim()}),
                child: TextField(
                  controller: _name,
                  textDirection: TextDirection.rtl,
                  decoration: const InputDecoration(hintText: '\u0627\u0644\u0634\u064a\u062e…'),
                  onSubmitted: (v) => _set({'teacherName': v.trim().isEmpty ? null : v.trim()}),
                ),
              ),
            ),
          ],
        ),
        Group(
          en: 'Your data',
          ar: '\u0628\u064a\u0627\u0646\u0627\u062a\u0643',
          children: [_Data(lastExportOn: s.lastExportOn)],
        ),
        Group(
          en: 'About',
          ar: '\u0639\u0646 \u0627\u0644\u062a\u0637\u0628\u064a\u0642',
          children: [
            ListRow(icon: Icons.library_books_outlined, label: t('Credits and sources'), onTap: () => go(context, 'resources')),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Space.md, vertical: 12),
              child: Tx(
                t(
                  'Quran text: Tanzil (Uthmani). Tajweed markup: cpfair/quran-tajweed. Word timings: cpfair/quran-align. Recitations: everyayah.com. Everything you do is stored on this device.',
                ),
                style: (isAr ? ty.bodyMd : ty.label).weight(400).copyWith(color: c.onSurfaceVariant),
              ),
            ),
          ],
        ),
        const _Reset(),
      ],
    );
  }
}

const _ikhlasWords = [
  '\u0642\u064f\u0644\u0652',
  '\u0647\u064f\u0648\u064e',
  '\u0671\u0644\u0644\u0651\u064e\u0647\u064f',
  '\u0623\u064e\u062d\u064e\u062f\u064c',
];

/// Model reciter: radio rows, each with a short sample (الإخلاص ١).
class _Reciters extends StatefulWidget {
  const _Reciters({required this.value, required this.onChange});
  final String value;
  final ValueChanged<String> onChange;
  @override
  State<_Reciters> createState() => _RecitersState();
}

class _RecitersState extends State<_Reciters> {
  final _audio = StudyAudio();
  String? _playing;

  @override
  void dispose() {
    _audio.dispose();
    super.dispose();
  }

  Future<void> _sample(Reciter r) async {
    _audio.stop();
    if (_playing == r.id) return setState(() => _playing = null);
    setState(() => _playing = r.id);
    List<Verse>? vs;
    try {
      vs = await getRange('112:1', '112:1');
    } catch (_) {
      vs = null; // offline and never opened: the player says so below
    }
    if (vs == null || !mounted || _playing != r.id) return setState(() => _playing = null);
    _audio.player.load(vs, r, skipBasmala: true);
    _audio.player.play();
    final ok = await _audio.player.whenDone();
    if (mounted && _playing == r.id) setState(() => _playing = null);
    if (!ok && mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Space.md, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 2,
        children: [
          Text(t('Model reciter'), style: ty.label.weight(600).copyWith(color: c.onSurfaceVariant)),
          RadioGroup<String>(
            groupValue: widget.value,
            onChanged: (v) => v == null ? null : widget.onChange(v),
            child: Column(
              spacing: 2,
              children: [
                for (final r in content.reciters)
                  Builder(
                    builder: (context) {
                      final on = widget.value == r.id, playing = _playing == r.id;
                      return Container(
                        decoration: BoxDecoration(
                          color: on ? c.primaryContainer.withValues(alpha: 0.5) : null,
                          borderRadius: BorderRadius.circular(Radii.control),
                          border: Border.all(color: on ? c.primary.withValues(alpha: 0.4) : Colors.transparent),
                        ),
                        padding: const EdgeInsetsDirectional.only(start: Space.xs, end: Space.xs),
                        child: Row(
                          spacing: Space.xs,
                          children: [
                            Radio<String>(value: r.id),
                            Expanded(
                              child: InkWell(
                                onTap: () => widget.onChange(r.id),
                                child: ConstrainedBox(
                                  constraints: const BoxConstraints(minHeight: 48),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(r.nameAr, style: ty.arabicBody.weight(500).copyWith(color: c.onSurface, height: 1.4)),
                                      if (!isAr) Text(r.nameEn, style: ty.caption.copyWith(color: c.onSurfaceVariant)),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            Semantics(
                              button: true,
                              label: playing ? t('Stop sample') : t('Play a sample of {name}', {'name': r.nameAr}),
                              excludeSemantics: true,
                              child: Material(
                                color: playing ? c.primaryFill : c.surfaceContainer,
                                borderRadius: BorderRadius.circular(999),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(999),
                                  onTap: () => _sample(r),
                                  child: Container(
                                    height: 40,
                                    padding: const EdgeInsets.symmetric(horizontal: 12),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      spacing: 4,
                                      children: [
                                        Icon(playing ? Icons.stop : Icons.play_arrow, size: 20, color: playing ? c.onPrimary : c.onSurface),
                                        Text(t('Sample'), style: ty.label.weight(600).copyWith(color: playing ? c.onPrimary : c.onSurface)),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
              ],
            ),
          ),
          if (_audio.offline) Text(t('Sample needs a connection'), style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
        ],
      ),
    );
  }
}

class _Data extends StatefulWidget {
  const _Data({required this.lastExportOn});
  final Day? lastExportOn;
  @override
  State<_Data> createState() => _DataState();
}

class _DataState extends State<_Data> {
  ({int n, int bytes})? _rec;
  ({String text, String summary})? _pending;
  ({bool ok, String text})? _msg;
  bool _confirmDel = false;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    try {
      final rs = await recordings.listAll();
      var bytes = 0;
      for (final r in rs) {
        try {
          bytes += File(recordings.pathOf(r)).lengthSync();
        } on FileSystemException {
          // a missing file counts as nothing
        }
      }
      if (mounted) setState(() => _rec = (n: rs.length, bytes: bytes));
    } catch (_) {
      if (mounted) setState(() => _rec = (n: 0, bytes: 0));
    }
  }

  Future<void> _pick() async {
    setState(() => _msg = null);
    final text = await pickBackupText();
    if (text == null) return;
    try {
      final raw = jsonDecode(text);
      if (raw is! Map) throw const FormatException();
      int n(String k) => raw[k] is List ? (raw[k] as List).length : 0;
      setState(
        () => _pending = (
          text: text,
          summary: t('{a} answers, {s} sessions, {c} corrections, settings', {'a': n('attempts'), 's': n('sessions'), 'c': n('corrections')}),
        ),
      );
    } on FormatException {
      setState(() => _msg = (ok: false, text: t('This file is not valid JSON.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final pending = _pending, rec = _rec;
    final storeBytes = store.file.existsSync() ? store.file.lengthSync() : 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ListRow(
          icon: Icons.save_outlined,
          label: t('Back up now'),
          hint:
              '${widget.lastExportOn != null ? t('Last backup: {when}.', {'when': daysAgo(widget.lastExportOn!, today())}) : t('No backup yet.')} ${t('The backup holds all your progress, sessions and settings. Recordings are not included.')}',
          stack: true,
          child: Align(
            alignment: AlignmentDirectional.centerStart,
            child: AppButton(label: t('Back up now'), icon: Icons.ios_share, variant: ButtonVariant.secondary, onPressed: () => shareBackup(context)),
          ),
        ),
        Divider(height: 1, color: c.outlineVariant),
        ListRow(
          icon: Icons.upload_file_outlined,
          label: t('Restore from a backup'),
          stack: true,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: Space.sm,
            children: [
              Align(
                alignment: AlignmentDirectional.centerStart,
                child: AppButton(label: t('Choose a backup file…'), icon: Icons.folder_open_outlined, variant: ButtonVariant.secondary, onPressed: _pick),
              ),
              if (pending != null)
                Container(
                  padding: const EdgeInsets.all(Space.md),
                  decoration: BoxDecoration(
                    color: c.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(Radii.card),
                    border: Border.all(color: c.outlineVariant),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    spacing: Space.sm,
                    children: [
                      Text(t('Restore from this backup?'), style: ty.bodyLg.weight(600).copyWith(color: c.onSurface)),
                      Tx(
                        isAr
                            ? '\u0633\u064a\u064f\u0633\u062a\u0628\u062f\u0644 \u0643\u0644 \u0645\u0627 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u062c\u0647\u0627\u0632 \u0628\u0645\u0627 \u0641\u064a \u0627\u0644\u0646\u0633\u062e\u0629: ${pending.summary}. \u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0644\u062a\u0631\u0627\u062c\u0639 \u0639\u0646 \u0630\u0644\u0643.'
                            : "It replaces everything on this device with ${pending.summary}. This can't be undone.",
                        style: ty.bodyMd.copyWith(color: c.onSurface),
                      ),
                      Wrap(
                        spacing: Space.sm,
                        runSpacing: Space.sm,
                        children: [
                          AppButton(
                            label: t('Back up current data first'),
                            variant: ButtonVariant.secondary,
                            size: ButtonSize.sm,
                            onPressed: () => shareBackup(context),
                          ),
                          AppButton(
                            label: t('Replace'),
                            variant: ButtonVariant.destructive,
                            size: ButtonSize.sm,
                            onPressed: () {
                              try {
                                store.importJson(pending.text);
                                forgetReviewRun();
                                _msg = (ok: true, text: t('Restored. Everything on this device now comes from the backup.'));
                              } on StoreError catch (e) {
                                _msg = (ok: false, text: t('Not restored: {reason} Nothing was changed.', {'reason': e.message}));
                              }
                              setState(() => _pending = null);
                            },
                          ),
                          AppButton(label: t('Cancel'), variant: ButtonVariant.ghost, size: ButtonSize.sm, onPressed: () => setState(() => _pending = null)),
                        ],
                      ),
                    ],
                  ),
                ),
              if (_msg case final m?) Text(m.text, style: ty.bodyMd.copyWith(color: m.ok ? c.success : c.error)),
            ],
          ),
        ),
        Divider(height: 1, color: c.outlineVariant),
        ListRow(
          icon: Icons.storage_outlined,
          label: t('Storage'),
          hint: [
            t('Storage used: progress {size}', {'size': formatBytes(storeBytes)}),
            if (rec != null) rec.n > 0 ? t(', recordings {size} ({n})', {'size': formatBytes(rec.bytes), 'n': rec.n}) : t(', no recordings saved'),
            '. ${t('Back up to a file you keep (Files, Drive, email). Phones can lose app data.')}',
          ].join(),
          stack: rec != null && rec.n > 0,
          child: rec == null || rec.n == 0
              ? null
              : Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: _confirmDel
                      ? Wrap(
                          spacing: Space.sm,
                          children: [
                            AppButton(
                              label: t('Delete {n} recordings', {'n': rec.n}),
                              variant: ButtonVariant.destructive,
                              size: ButtonSize.sm,
                              onPressed: () async {
                                await recordings.removeAll();
                                setState(() => _confirmDel = false);
                                await _refresh();
                              },
                            ),
                            AppButton(
                              label: t('Cancel'),
                              variant: ButtonVariant.ghost,
                              size: ButtonSize.sm,
                              onPressed: () => setState(() => _confirmDel = false),
                            ),
                          ],
                        )
                      : TextButton.icon(
                          onPressed: () => setState(() => _confirmDel = true),
                          icon: Icon(Icons.delete_outline, color: c.error),
                          label: Text(t('Delete all recordings'), style: ty.bodyMd.weight(600).copyWith(color: c.error)),
                        ),
                ),
        ),
      ],
    );
  }
}

/// Reset everything: type "reset" (or its Arabic) to confirm.
class _Reset extends StatefulWidget {
  const _Reset();
  @override
  State<_Reset> createState() => _ResetState();
}

class _ResetState extends State<_Reset> {
  bool _open = false;
  final _word = TextEditingController();

  @override
  void dispose() {
    _word.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final ok = {'reset', t('reset')}.contains(_word.text.trim().toLowerCase());
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: Space.md, vertical: 12),
      decoration: BoxDecoration(
        color: c.errorContainer.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(Radii.card),
        border: Border.all(color: c.error.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: Space.sm,
        children: [
          Row(
            spacing: 12,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(color: c.errorContainer, borderRadius: BorderRadius.circular(Radii.control)),
                child: Icon(Icons.restart_alt, size: 20, color: c.onErrorContainer),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(t('Reset everything'), style: (isAr ? ty.bodyLg : ty.bodyMd).weight(600).copyWith(color: c.error)),
                    Text(
                      t('This deletes all your progress, sessions and recordings on this device.'),
                      style: (isAr ? ty.bodyMd : ty.label).weight(400).copyWith(color: c.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (!_open)
            Align(
              alignment: AlignmentDirectional.centerEnd,
              child: AppButton(label: t('Reset everything'), variant: ButtonVariant.destructive, onPressed: () => setState(() => _open = true)),
            )
          else ...[
            Text('${t('Type')} “${t('reset')}” ${t('to confirm.')}', style: ty.bodyMd.copyWith(color: c.onSurface)),
            TextField(controller: _word, autocorrect: false, enableSuggestions: false, onChanged: (_) => setState(() {})),
            Wrap(
              spacing: Space.sm,
              children: [
                AppButton(
                  label: t('Delete everything'),
                  variant: ButtonVariant.destructive,
                  onPressed: !ok
                      ? null
                      : () async {
                          await recordings.removeAll();
                          store.resetAll();
                          forgetReviewRun();
                          if (context.mounted) go(context, 'onboarding');
                        },
                ),
                AppButton(
                  label: t('Cancel'),
                  variant: ButtonVariant.ghost,
                  onPressed: () => setState(() {
                    _open = false;
                    _word.clear();
                  }),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

/// A fold that is one row of a [Group] (the web's details in Recitation): the summary as a row with its icon tile,
/// the rows under a divider when open. No card of its own.
class _RowFold extends StatefulWidget {
  const _RowFold({required this.icon, required this.title, required this.children});
  final IconData icon;
  final String title;
  final List<Widget> children;
  @override
  State<_RowFold> createState() => _RowFoldState();
}

class _RowFoldState extends State<_RowFold> {
  bool _open = false;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Semantics(
        button: true,
        expanded: _open,
        child: InkWell(
          onTap: () => setState(() => _open = !_open),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: Space.md, vertical: 12),
            child: Row(spacing: 12, children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(color: c.surfaceContainer, borderRadius: BorderRadius.circular(Radii.control)),
                child: Icon(widget.icon, size: 20, color: c.onSurfaceVariant),
              ),
              Expanded(child: Text(widget.title, style: (isAr ? ty.bodyLg : ty.bodyMd).weight(600).copyWith(color: c.onSurface))),
              AnimatedRotation(turns: _open ? 0.5 : 0, duration: const Duration(milliseconds: 150), child: Icon(Icons.expand_more, size: 20, color: c.outline)),
            ]),
          ),
        ),
      ),
      if (_open) ...[for (final w in widget.children) ...[Divider(height: 1, color: c.outlineVariant), w]],
    ]);
  }
}
