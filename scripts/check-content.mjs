#!/usr/bin/env node
// Checks content/rules.json against the pinned Tanzil Uthmani text.
// Usage: node scripts/check-content.mjs <path/to/quran-uthmani.txt> [content/rules.json]
// Text: https://github.com/cpfair/quran-tajweed/files/7281388/quran-uthmani.txt (lines "s|a|text", CRLF).
// Ayah 1 of every surah except 1 and 9 starts with the basmala; it is dropped before splitting on spaces
// (95:1 and 97:1 spell its first word بِّسْمِ, with a shadda).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const [tanzilPath, rulesArg] = process.argv.slice(2);
if (!tanzilPath) { console.error('usage: node scripts/check-content.mjs <quran-uthmani.txt> [rules.json]'); process.exit(2); }
const rulesPath = rulesArg ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'content', 'rules.json');

const verses = {};
let basmala = null;
for (const line of fs.readFileSync(tanzilPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^(\d+)\|(\d+)\|(.*)$/);
  if (!m) continue;
  const [, s, a] = m;
  let words = m[3].split(' ');
  if (s === '1' && a === '1') basmala = words;
  if (a === '1' && s !== '1' && s !== '9') {
    const isBasmala = words[0].replace(/ّ/g, '') === basmala[0] && words.slice(1, 4).join(' ') === basmala.slice(1).join(' ');
    if (!isBasmala) throw new Error(`expected basmala at ${s}:1`);
    words = words.slice(4);
  }
  verses[`${s}:${a}`] = words;
}
if (Object.keys(verses).length !== 6236) throw new Error(`expected 6236 ayat, got ${Object.keys(verses).length}`);

const lessons = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
const errors = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const COLORS = new Set(['clear', 'ghunnah', 'silent', 'merge', 'madd2', 'madd45', 'madd246', 'madd6', 'qalqalah', 'heavy', 'light']);
const ids = new Set();
let exampleCount = 0;

for (const l of lessons) {
  const id = l.id ?? '(no id)';
  if (ids.has(id)) err(id, 'duplicate id');
  ids.add(id);
  for (const k of ['id', 'cat', 'ar', 'en', 'definition']) if (typeof l[k] !== 'string' || !l[k]) err(id, `missing ${k}`);
  if (!Number.isInteger(l.phase)) err(id, 'phase must be an integer');
  if (!COLORS.has(l.color)) err(id, `bad color ${l.color}`);
  if (!Array.isArray(l.sources) || !l.sources.length || l.sources.some(s => !s.title || !s.locator)) err(id, 'needs sources with title and locator');
  if (!['verified', 'needs-teacher'].includes(l.review?.status)) err(id, 'review.status must be verified or needs-teacher');

  for (const [i, e] of (l.examples ?? []).entries()) {
    const at = `example ${i + 1} (${e.verse})`;
    const words = verses[e.verse];
    if (!words) { err(id, `${at}: verse does not exist`); continue; }
    if (!Number.isInteger(e.word_from) || !Number.isInteger(e.word_to) || e.word_from < 1 || e.word_to < e.word_from || e.word_to > words.length) {
      err(id, `${at}: word range ${e.word_from}-${e.word_to} invalid (ayah has ${words.length} words)`); continue;
    }
    const joined = words.slice(e.word_from - 1, e.word_to).join(' ');
    if (e.text !== joined) err(id, `${at}: text "${e.text}" != Tanzil "${joined}"`);
    if (typeof e.focus !== 'string' || !e.focus || !e.text.includes(e.focus)) err(id, `${at}: focus "${e.focus}" not in text`);
    if (typeof e.stop !== 'boolean') err(id, `${at}: stop must be boolean`);
    exampleCount++;
  }
  for (const [i, f] of (l.facts ?? []).entries()) {
    if (!f.q || !Array.isArray(f.options) || f.options.length < 2 || new Set(f.options).size !== f.options.length
      || !Number.isInteger(f.answer) || !(f.answer in f.options) || !f.why) err(id, `fact ${i + 1} malformed`);
  }
  const ex = l.examples?.length ?? 0, facts = l.facts?.length ?? 0;
  // Word-specific Hafs lessons (exhaustive) list every occurrence there is, which can be fewer than 6.
  if (!(ex >= 6 || facts >= 6 || (l.exhaustive && ex >= 1))) err(id, `needs ≥6 examples or ≥6 facts (has ${ex} examples, ${facts} facts)`);
}

if (errors.length) { console.error(errors.join('\n')); console.error(`\n${errors.length} problem(s)`); process.exit(1); }
console.log(`ok: ${lessons.length} lessons, ${exampleCount} examples checked against Tanzil`);
