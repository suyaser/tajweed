import { useEffect, useState } from 'react'
import type { Correction, Session as SessionT, UserData } from '../core/types'
import { completeFinale, logCorrection, resolveCorrection, undoCorrection, updateSession, useData } from '../core/store'
import { getLesson, lessons } from '../content'
import { getUnit, units } from '../content/course'
import { navigate } from '../app/router'
import type { ScreenProps } from '../app/App'
import { Button, Card, CorrectionTag, EmptyState, Passage, RuleChip, Sheet, Skeleton, StarBadge, T, type WordMark } from '../components'
import { corrLabel, dayLabel, inRange, likelyLessons, listenHref, live, mergePassages, refLabel, type Planned } from './path/helpers'
import { AddPassage, ReasonChip, startClass, useVerses } from './path/ui'
import './path.css'
import { t, FWD, BACK } from '../i18n'

export default function Session({ params }: ScreenProps) {
  const d = useData()
  const s = d.sessions.find((x) => x.id === params.id && !x.deletedAt)
  if (!s)
    return <EmptyState title={t('This session is not on this device.')} action={<Button href="#/teacher">{t('Back to sessions')}</Button>} />
  return params.sheet ? <InClass d={d} s={s} index={+(params.p ?? 0)} /> : s.status === 'done' ? <Summary d={d} s={s} /> : <PlanView d={d} s={s} />
}

/* ---------------- planned: the plan, before class ---------------- */

function PlanView({ d, s }: { d: UserData; s: SessionT }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <div className="p-stack">
      <p className="t-lg">
        {dayLabel(s.on)}
        {s.teacherName && <> · <bdi lang="ar" className="a">{s.teacherName}</bdi></>}
      </p>
      <Card eyebrow={t('To recite')}>
        {s.plannedPassages.length ? (
          <ol className="p-list">
            {s.plannedPassages.map((p) => (
              <li key={`${p.from}-${p.to}`} className="p-item">
                <span className="p-item-main">
                  <ReasonChip p={p} />
                  <a className="a-lg" lang="ar" href={listenHref(p.from, p.to)}>{refLabel(p.from, p.to)}</a>
                </span>
                <a className="p-link t-sm" href={listenHref(p.from, p.to)}>{t('Listen')} {FWD}</a>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">{t('No passages yet.')}</p>
        )}
      </Card>
      {s.notes && <p><span className="eyebrow">{t('Note to self')}</span><br /><bdi dir="auto">{s.notes}</bdi></p>}
      <OpenCorrections d={d} />
      <Button block onClick={() => startClass(s.id)}>{t('Start class')}</Button>
      <div className="p-actions">
        <Button variant="secondary" href={`#/teacher/new?id=${s.id}`}>{t('Edit plan')}</Button>
        {confirmDelete ? (
          <Button variant="danger" onClick={() => { updateSession(s.id, { deletedAt: new Date().toISOString() }); navigate('teacher') }}>{t('Yes, delete this plan')}</Button>
        ) : (
          <Button variant="ghost" onClick={() => setConfirmDelete(true)}>{t('Delete plan')}</Button>
        )}
      </div>
    </div>
  )
}

function OpenCorrections({ d }: { d: UserData }) {
  const open = live(d.corrections).filter((c) => c.status === 'open')
  if (!open.length) return null
  return (
    <Card eyebrow={t('Ask to re-check · {n} open', { n: open.length })}>
      <ul className="p-list">
        {open.map((c) => (
          <li key={c.id} className="p-item">
            <span className="p-item-main">
              <span className="a-lg" lang="ar">{corrLabel(c)}</span>
              <span className="t-sm muted"><T>{ruleNames(c) || t('No rule tagged')}</T></span>
            </span>
            <CorrectionTag severity={c.severity} />
          </li>
        ))}
      </ul>
    </Card>
  )
}

const ruleNames = (c: Pick<Correction, 'lessonIds'>) => c.lessonIds.map((l) => getLesson(l)?.nameAr ?? l).join('، ')

/* ---------------- in class (focus) ---------------- */

interface Target { key: string; word?: number; text?: string }

function InClass({ d, s, index }: { d: UserData; s: SessionT; index: number }) {
  const passages = s.plannedPassages
  const i = Math.min(Math.max(0, index), Math.max(0, passages.length - 1))
  const p: Planned | undefined = passages[i]
  const { verses, ayahs, error, loading } = useVerses(p?.from, p?.to)
  const [target, setTarget] = useState<Target | null>(null)
  const [saved, setSaved] = useState<Correction | null>(null)
  const [adding, setAdding] = useState(!passages.length)
  const go = (n: number) => navigate(`#/teacher/${s.id}?sheet=1&p=${n}`, { replace: true })

  // Screen Wake Lock while in class (design §5.8.3); ignored where unsupported.
  useEffect(() => {
    let lock: { release: () => Promise<void> } | undefined
    let alive = true
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    // a lock granted after leaving the sheet is released at once
    const get = () => nav.wakeLock?.request('screen').then((l) => { if (alive) lock = l; else l.release().catch(() => {}) }, () => {})
    get()
    const onVis = () => document.visibilityState === 'visible' && get()
    document.addEventListener('visibilitychange', onVis)
    return () => { alive = false; document.removeEventListener('visibilitychange', onVis); lock?.release().catch(() => {}) }
  }, [])

  const mine = live(d.corrections).filter((c) => c.sessionId === s.id)
  const marks: Record<string, WordMark> = {}
  for (const c of mine) if (c.wordPosition) marks[`${c.verseKey}/${c.wordPosition}`] = 'ring'
  if (target?.word) marks[`${target.key}/${target.word}`] = 'ring'
  const openHere = p ? live(d.corrections).filter((c) => (c.status === 'open' || c.resolvedInSessionId === s.id) && c.sessionId !== s.id && inRange(c.verseKey, p.from, p.to)) : []
  // re-check: the word corrected in an earlier class wears the same neutral ring (M8)
  for (const c of openHere) if (c.wordPosition && c.status === 'open') marks[`${c.verseKey}/${c.wordPosition}`] = 'ring'
  // v2: the milestone is a unit finale (result stored as phaseId = unit number, passageId = unit id)
  const unit = p && units.find((u) => u.finale?.from === p.from && u.finale.to === p.to &&
    (s.milestoneResults.some((r) => r.passageId === u.id) || !d.finales.some((f) => f.unitId === u.id)))
  const ms = unit && { phaseId: unit.n, passageId: unit.id, label: unit.finale!.label }
  const result = ms && s.milestoneResults.find((r) => r.passageId === ms.passageId)?.result

  const setResult = (r: 'passed' | 'not_yet') => {
    if (!ms) return
    updateSession(s.id, { milestoneResults: [...s.milestoneResults.filter((x) => x.passageId !== ms.passageId), { phaseId: ms.phaseId, passageId: ms.passageId, result: r }] })
    if (r === 'passed') completeFinale(ms.passageId)
  }

  return (
    <div className="p-stack p-class">
      <div className="p-classbar">
        <p className="t-sm">
          {t('In class')}{s.teacherName && <> · <bdi lang="ar" className="a">{s.teacherName}</bdi></>}
          {p && <> · {t('Passage {i} of {n}', { i: i + 1, n: passages.length })} · <ReasonChip p={p} /></>}
        </p>
        <Button onClick={() => { updateSession(s.id, { status: 'done' }); navigate(`teacher/${s.id}`) }}>{t('Done')}</Button>
      </div>

      {p && (
        <section aria-label={t('Passage')}>
          <h2 className="a-h3" lang="ar">{refLabel(p.from, p.to)}</h2>
          {loading && <Skeleton verse lines={3} label={t('Loading the text…')} />}
          {error && <p className="muted">{error} {t('You can still log a correction on the whole ayah after reconnecting.')}</p>}
          {ayahs && (
            <Passage
              ayahs={ayahs}
              size="focus"
              marks={marks}
              onWord={(key, word, text) => { setSaved(null); setTarget({ key, word, text }) }}
              onAyah={(key) => { setSaved(null); setTarget({ key }) }}
            />
          )}
          <p className="t-sm muted">{t('Tap the word your teacher corrected, or an ayah number for the whole ayah.')}</p>
        </section>
      )}

      {saved && (
        <p className="p-saved" role="status">
          {t('Saved')} · <span className="a-lg" lang="ar">{corrLabel(saved)}</span> · <CorrectionTag severity={saved.severity} />
          <button type="button" className="p-linkbtn" onClick={() => { undoCorrection(saved.id); setSaved(null) }}>{t('Undo')}</button>
        </p>
      )}

      {ms && (
        <Card eyebrow={t('Unit finale')}>
          <p><T>{t('Did your teacher pass {label}?', { label: ms.label })}</T></p>
          <div className="p-actions" role="group" aria-label={t('Finale result')}>
            <Button variant={result === 'passed' ? 'primary' : 'secondary'} aria-pressed={result === 'passed'} onClick={() => setResult('passed')}>{t('Passed')}</Button>
            <Button variant={result === 'not_yet' ? 'primary' : 'secondary'} aria-pressed={result === 'not_yet'} onClick={() => setResult('not_yet')}>{t('Not yet')}</Button>
          </div>
        </Card>
      )}

      {openHere.length > 0 && (
        <Card eyebrow={t('Open corrections here')}>
          <ul className="p-list">
            {openHere.map((c) => <Recheck key={c.id} c={c} sessionId={s.id} d={d} />)}
          </ul>
        </Card>
      )}

      <div className="p-pager">
        <Button variant="ghost" disabled={i === 0} onClick={() => go(i - 1)}>{BACK} {t('Previous passage')}</Button>
        <Button variant="ghost" disabled={i >= passages.length - 1} onClick={() => go(i + 1)}>{t('Next passage')} {FWD}</Button>
      </div>

      {adding ? (
        <Card eyebrow={t('Add a passage')}>
          <AddPassage onAdd={(np) => {
            const next = mergePassages(passages, [np])
            updateSession(s.id, { plannedPassages: next })
            setAdding(false)
            go(next.findIndex((x) => x.from === np.from && x.to === np.to))
          }} />
        </Card>
      ) : (
        <Button variant="ghost" onClick={() => setAdding(true)}>+ {t('Add a passage')}</Button>
      )}

      <Notes s={s} />

      <CorrectionSheet
        target={target}
        verse={verses?.find((v) => v.verseKey === target?.key)}
        d={d}
        onClose={() => setTarget(null)}
        onSave={(c) => {
          setSaved(logCorrection({ ...c, verseKey: target!.key, wordPosition: target!.word, word: target!.text, sessionId: s.id, by: 'teacher' }))
          setTarget(null)
        }}
      />
    </div>
  )
}

function Recheck({ c, sessionId, d }: { c: Correction; sessionId: string; d: UserData }) {
  const stillWrong = c.status === 'open' && d.attempts.some((a) => a.kind === 'correction' && a.refId === c.id && a.source === 'teacher' && !a.correct && a.at >= (d.sessions.find((s) => s.id === sessionId)?.createdAt ?? ''))
  return (
    <li className="p-item p-item-col">
      <span className="p-item-main">
        <span><span className="a-lg" lang="ar">{corrLabel(c)}</span> <CorrectionTag severity={c.severity} /></span>
        <span className="t-sm muted"><T>{ruleNames(c) || t('No rule tagged')}</T>{c.note && <> · <bdi dir="auto">{c.note}</bdi></>}</span>
      </span>
      {c.status === 'resolved' ? (
        <span className="t-sm">✓ {t('Correct now · closed')}</span>
      ) : stillWrong ? (
        <span className="t-sm">↺ {t('Still wrong · back in review tomorrow')}</span>
      ) : (
        <span className="p-actions">
          <Button variant="secondary" onClick={() => resolveCorrection(c.id, 'correct', sessionId)}>✓ {t('Correct now')}</Button>
          <Button variant="ghost" onClick={() => resolveCorrection(c.id, 'still_wrong', sessionId)}>↺ {t('Still wrong')}</Button>
        </span>
      )}
    </li>
  )
}

function Notes({ s }: { s: SessionT }) {
  const [v, setV] = useState(s.notes ?? '')
  return (
    <label className="p-field">
      <span>{t('Notes')}</span>
      <textarea dir="auto" rows={2} value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== (s.notes ?? '') && updateSession(s.id, { notes: v.trim() || undefined })} />
    </label>
  )
}

/** ≤ 4 taps: word (opens this) → جلي/خفي → optional rule → Save. */
function CorrectionSheet({ target, verse, d, onClose, onSave }: {
  target: Target | null
  verse?: Parameters<typeof likelyLessons>[0]
  d: UserData
  onClose: () => void
  onSave: (c: { severity: 'jali' | 'khafi'; lessonIds: string[]; note?: string }) => void
}) {
  const [severity, setSeverity] = useState<'jali' | 'khafi' | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [q, setQ] = useState<string | null>(null)
  const tkey = target ? `${target.key}/${target.word ?? ''}` : ''
  useEffect(() => { setSeverity(null); setPicked([]); setNote(null); setQ(null) }, [tkey])

  const suggested = likelyLessons(verse, target?.word, d.introductions, (id) => !!getLesson(id))
  const query = q?.trim().toLowerCase()
  const found = query ? lessons.filter((l) => l.nameAr.includes(query) || l.nameEn.toLowerCase().includes(query) || l.id.includes(query)).slice(0, 8).map((l) => l.id) : []
  const chips = [...picked, ...suggested, ...found].filter((x, i, a) => a.indexOf(x) === i)
  const toggle = (id: string) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id].slice(-2))

  return (
    <Sheet
      open={!!target}
      onClose={onClose}
      title={target ? <span lang="ar">{target.text ? `${target.text} · ` : 'الآية كاملة · '}{refLabel(target.key)}</span> : ''}
    >
      <div className="p-sev" role="group" aria-label={t('Severity')}>
        {(['jali', 'khafi'] as const).map((sv) => (
          <button key={sv} type="button" className="opt s-pick p-sevbtn" aria-pressed={severity === sv} onClick={() => setSeverity(sv)}>
            <b lang="ar">{sv === 'jali' ? 'جلي' : 'خفي'}</b>
            <small>{sv === 'jali' ? t('clear error: a letter or vowel') : t('fine detail of a rule')}</small>
          </button>
        ))}
      </div>
      {severity && (
        <>
          <p className="eyebrow">{t('Rule (optional, up to 2)')}</p>
          <div className="p-chips">
            {chips.map((id) => {
              const l = getLesson(id)!
              return <RuleChip key={id} nameAr={l.nameAr} colour={l.colour} selected={picked.includes(id)} onClick={() => toggle(id)} />
            })}
            <button type="button" className="rchip" aria-pressed={!picked.length} onClick={() => setPicked([])}>{t('Other / not a rule')}</button>
            {q === null && <button type="button" className="rchip" onClick={() => setQ('')} aria-label={t('Search rules')}>🔍 {t('Search')}</button>}
          </div>
          {q !== null && (
            <label className="p-field">
              <span>{t('Search rules')}</span>
              <input type="search" dir="auto" value={q} onChange={(e) => setQ(e.target.value)} autoFocus placeholder={t('إخفاء, madd…')} />
            </label>
          )}
          {note === null ? (
            <Button variant="ghost" onClick={() => setNote('')}>+ {t('Note')}</Button>
          ) : (
            <label className="p-field">
              <span>{t('Note')}</span>
              <input type="text" dir="auto" value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
            </label>
          )}
        </>
      )}
      <Button block disabled={!severity} onClick={() => severity && onSave({ severity, lessonIds: picked, note: note?.trim() || undefined })}>{t('Save')}</Button>
      {!severity && <p className="t-sm muted p-sev-why"><T>{t('Choose جلي or خفي to save.')}</T></p>}
    </Sheet>
  )
}

/* ---------------- done: what changed ---------------- */

function Summary({ d, s }: { d: UserData; s: SessionT }) {
  const mine = live(d.corrections).filter((c) => c.sessionId === s.id)
  const resolved = live(d.corrections).filter((c) => c.resolvedInSessionId === s.id)
  const introduced = new Set(d.introductions.map((i) => i.lessonId))
  const ruleIds = [...new Set(mine.flatMap((c) => c.lessonIds))]
  const back = ruleIds.filter((id) => introduced.has(id)).map((id) => getLesson(id)?.nameAr ?? id)
  const early = ruleIds.filter((id) => !introduced.has(id)).map((id) => getLesson(id)?.nameAr ?? id)
  const untagged = mine.filter((c) => !c.lessonIds.length).length

  return (
    <div className="p-stack">
      <p className="t-lg">
        {dayLabel(s.on)}
        {s.teacherName && <> · <bdi lang="ar" className="a">{s.teacherName}</bdi></>}
      </p>
      <Card level="e2" eyebrow={t('Session saved')}>
        <p>
          {mine.length ? (mine.length === 1 ? t('1 correction added to review.') : t('{n} corrections added to review.', { n: mine.length })) : t('No new corrections this time.')}
          {resolved.length > 0 && ' ' + (resolved.length === 1 ? t('1 closed: your teacher says it is correct now.') : t('{n} closed: your teacher says they are correct now.', { n: resolved.length }))}
        </p>
        {back.length > 0 && <p><T>{back.length === 1 ? t('{names} comes back in review tomorrow.', { names: back[0] }) : t('{names} come back in review tomorrow.', { names: back.join(t(' and ')) })}</T></p>}
        {early.length > 0 && <p><T>{early.length === 1
          ? t('{names}: not learned yet. It comes into review once you reach its lesson in the course.', { names: early[0] })
          : t('{names}: not learned yet. They come into review once you reach their lessons in the course.', { names: early.join(t(' and ')) })}</T></p>}
        {untagged > 0 && <p className="muted">{untagged === 1 ? t('1 correction has no rule. They still come back in review.') : t('{n} corrections have no rule. They still come back in review.', { n: untagged })}</p>}
        {s.milestoneResults.map((r) => {
          const u = getUnit(r.passageId)
          return (
            <div key={r.passageId}>
              <p><T>{r.result === 'passed'
                ? t('Unit finale: {label} passed.', { label: u?.finale?.label ?? r.passageId })
                : t('Unit finale: {label} not yet.', { label: u?.finale?.label ?? r.passageId })}</T></p>
              {r.result === 'passed' && u && (
                <p className="p-row-inline">
                  <StarBadge n={u.n} size={32} state="done" />
                  <T>{t('Unit {n} · {name} complete.', { n: u.n, name: u.nameAr })}</T>
                </p>
              )}
            </div>
          )
        })}
      </Card>
      {mine.length > 0 && (
        <Card eyebrow={t('Corrections this session')}>
          <ul className="p-list">
            {mine.map((c) => (
              <li key={c.id} className="p-item">
                <span className="p-item-main">
                  <a className="a-lg" lang="ar" href={listenHref(c.verseKey)}>{corrLabel(c)}</a>
                  <span className="t-sm muted"><T>{ruleNames(c) || t('No rule tagged')}</T>{c.note && <> · <bdi dir="auto">{c.note}</bdi></>}</span>
                </span>
                <CorrectionTag severity={c.severity} />
              </li>
            ))}
          </ul>
        </Card>
      )}
      {s.notes && <p><span className="eyebrow">{t('Notes')}</span><br /><bdi dir="auto">{s.notes}</bdi></p>}
      <div className="p-actions">
        <Button variant="secondary" href={`#/teacher/${s.id}?sheet=1`}>{t('Reopen class')}</Button>
        <Button href="#/teacher">{t('Back')}</Button>

      </div>
    </div>
  )
}
