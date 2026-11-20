import { useEffect, useState } from 'react'
import type { Correction, Session as SessionT, UserData } from '../core/types'
import { completeFinale, logCorrection, resolveCorrection, undoCorrection, updateSession, useData } from '../core/store'
import { getLesson, lessons } from '../content'
import { getUnit, units } from '../content/course'
import { navigate } from '../app/router'
import type { ScreenProps } from '../app/App'
import { Actions, Button, Card, EmptyState, Field, Group, Passage, Sheet, Skeleton, T, fieldCls, type WordMark } from '../components'
import { corrLabel, dayLabel, inRange, likelyLessons, listenHref, live, mergePassages, refLabel, type Planned } from './path/helpers'
import { AddPassage, startClass, useVerses } from './path/ui'
import { Item, ReasonTag, SeverityTag, refCls } from './library/teacher'
import { t } from '../i18n'
import { cn } from '@/lib/utils'
import { Chip, Page, Panel, Sep } from '@/components/kit'
import { Icon } from '@/components/ui/icon'

export default function Session({ params }: ScreenProps) {
  const d = useData()
  const s = d.sessions.find((x) => x.id === params.id && !x.deletedAt)
  if (!s)
    return <Page><EmptyState icon="event_busy" title={t('This session is not on this device.')} action={<Button href="#/teacher">{t('Back to sessions')}</Button>} /></Page>
  return params.sheet ? <InClass d={d} s={s} index={+(params.p ?? 0)} /> : s.status === 'done' ? <Summary d={d} s={s} /> : <PlanView d={d} s={s} />
}

/** Date · teacher, as the screen's heading. */
function Heading({ s, status }: { s: SessionT; status: string }) {
  return (
    <header className="flex items-center gap-space-md">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-container text-on-primary-container">
        <Icon name={s.status === 'done' ? 'event_available' : 'event'} />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-label font-semibold tracking-wider text-secondary uppercase rtl:normal-case">{status}</span>
        <h2 className="text-headline-md">
          {dayLabel(s.on)}
          {s.teacherName && <><Sep /><bdi lang="ar" className="font-arabic">{s.teacherName}</bdi></>}
        </h2>
      </div>
    </header>
  )
}

function NoteBlock({ label, text }: { label: string; text: string }) {
  return (
    <Card level="e0" eyebrow={label}>
      <p><bdi dir="auto">{text}</bdi></p>
    </Card>
  )
}

/* ---------------- planned: the plan, before class ---------------- */

function PlanView({ d, s }: { d: UserData; s: SessionT }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <Page>
      <Heading s={s} status={t('Planned, not finished')} />
      <Group en="To recite" ar="للتلاوة">
        {s.plannedPassages.length ? (
          <ol className="flex flex-col divide-y divide-outline-variant">
            {s.plannedPassages.map((p) => (
              <Item key={`${p.from}-${p.to}`} end={
                <Button variant="tertiary" size="sm" href={listenHref(p.from, p.to)}>
                  <Icon name="headphones" size={18} />{t('Listen')}
                </Button>
              }>
                <ReasonTag p={p} />
                <a className={refCls} lang="ar" href={listenHref(p.from, p.to)}>{refLabel(p.from, p.to)}</a>
              </Item>
            ))}
          </ol>
        ) : (
          <p className="p-space-md text-on-surface-variant">{t('No passages yet.')}</p>
        )}
      </Group>
      {s.notes && <NoteBlock label={t('Note to self')} text={s.notes} />}
      <OpenCorrections d={d} />
      <Button block size="lg" onClick={() => startClass(s.id)}><Icon name="play_arrow" fill />{t('Start class')}</Button>
      <Actions>
        <Button variant="secondary" href={`#/teacher/new?id=${s.id}`}><Icon name="edit" size={20} />{t('Edit plan')}</Button>
        {confirmDelete ? (
          <Button variant="danger" onClick={() => { updateSession(s.id, { deletedAt: new Date().toISOString() }); navigate('teacher') }}>{t('Yes, delete this plan')}</Button>
        ) : (
          <Button variant="ghost" className="text-error" onClick={() => setConfirmDelete(true)}><Icon name="delete" size={20} />{t('Delete plan')}</Button>
        )}
      </Actions>
    </Page>
  )
}

function OpenCorrections({ d }: { d: UserData }) {
  const open = live(d.corrections).filter((c) => c.status === 'open')
  if (!open.length) return null
  return (
    <Group en={t('Ask to re-check · {n} open', { n: open.length })} ar={undefined}>
      <ul className="flex flex-col divide-y divide-outline-variant">
        {open.map((c) => (
          <Item key={c.id} end={<SeverityTag severity={c.severity} />}>
            <span className={refCls} lang="ar">{corrLabel(c)}</span>
            <span className="text-body-md text-on-surface-variant"><T>{ruleNames(c) || t('No rule tagged')}</T></span>
          </Item>
        ))}
      </ul>
    </Group>
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
    <Page width="narrow">
      <div className="flex flex-wrap items-center justify-between gap-space-sm rounded-card bg-surface-container p-space-sm ps-space-md">
        <p className="flex min-w-0 flex-wrap items-center gap-x-space-sm gap-y-1 text-body-md">
          <span className="inline-flex items-center gap-1 font-semibold text-primary"><span aria-hidden="true" className="size-2 rounded-full bg-error motion-safe:animate-pulse" />{t('In class')}</span>
          {s.teacherName && <bdi lang="ar" className="font-arabic">{s.teacherName}</bdi>}
          {p && <><span className="text-on-surface-variant">{t('Passage {i} of {n}', { i: i + 1, n: passages.length })}</span><ReasonTag p={p} /></>}
        </p>
        <Button onClick={() => { updateSession(s.id, { status: 'done' }); navigate(`teacher/${s.id}`) }}><Icon name="check" size={20} />{t('Done')}</Button>
      </div>

      {p && (
        <Panel aria-label={t('Passage')} className="gap-space-sm">
          <h2 className="font-naskh text-[24px] leading-[1.6] font-bold" lang="ar">{refLabel(p.from, p.to)}</h2>
          {loading && <Skeleton verse lines={3} label={t('Loading the text…')} />}
          {error && <p className="text-on-surface-variant">{error} {t('You can still log a correction on the whole ayah after reconnecting.')}</p>}
          {ayahs && (
            <Passage
              ayahs={ayahs}
              size="focus"
              marks={marks}
              onWord={(key, word, text) => { setSaved(null); setTarget({ key, word, text }) }}
              onAyah={(key) => { setSaved(null); setTarget({ key }) }}
            />
          )}
          <p className="flex items-center gap-space-xs text-body-md text-on-surface-variant"><Icon name="touch_app" size={18} />{t('Tap the word your teacher corrected, or an ayah number for the whole ayah.')}</p>
        </Panel>
      )}

      {saved && (
        <p role="status" className="flex flex-wrap items-center gap-space-sm rounded-card bg-primary-container px-space-md py-space-xs text-on-primary-container">
          <Icon name="check_circle" size={20} fill />{t('Saved')}<Sep /><span className="font-naskh text-body-lg" lang="ar">{corrLabel(saved)}</span> <SeverityTag severity={saved.severity} />
          <Button variant="tertiary" className="ms-auto" onClick={() => { undoCorrection(saved.id); setSaved(null) }}><Icon name="undo" size={20} />{t('Undo')}</Button>
        </p>
      )}

      {ms && (
        <Card eyebrow={t('Unit finale')} className="border-gold/50">
          <p><T>{t('Did your teacher pass {label}?', { label: ms.label })}</T></p>
            <div role="group" aria-label={t('Finale result')} className="flex flex-wrap gap-space-sm">
              <Button variant={result === 'passed' ? 'primary' : 'secondary'} aria-pressed={result === 'passed'} onClick={() => setResult('passed')}><Icon name="star" size={20} fill={result === 'passed'} />{t('Passed')}</Button>
              <Button variant={result === 'not_yet' ? 'primary' : 'secondary'} aria-pressed={result === 'not_yet'} onClick={() => setResult('not_yet')}>{t('Not yet')}</Button>
            </div>
        </Card>
      )}

      {openHere.length > 0 && (
        <Group en={t('Open corrections here')} ar={undefined}>
          <ul className="flex flex-col divide-y divide-outline-variant">
            {openHere.map((c) => <Recheck key={c.id} c={c} sessionId={s.id} d={d} />)}
          </ul>
        </Group>
      )}

      <div className="flex items-center justify-between gap-space-sm">
        <Button variant="ghost" disabled={i === 0} onClick={() => go(i - 1)}><Icon name="arrow_back" rtlFlip size={20} />{t('Previous passage')}</Button>
        <Button variant="ghost" disabled={i >= passages.length - 1} onClick={() => go(i + 1)}>{t('Next passage')}<Icon name="arrow_forward" rtlFlip size={20} /></Button>
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
        <Button variant="ghost" className="self-start" onClick={() => setAdding(true)}><Icon name="add" size={20} />{t('Add a passage')}</Button>
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
    </Page>
  )
}

function Recheck({ c, sessionId, d }: { c: Correction; sessionId: string; d: UserData }) {
  const stillWrong = c.status === 'open' && d.attempts.some((a) => a.kind === 'correction' && a.refId === c.id && a.source === 'teacher' && !a.correct && a.at >= (d.sessions.find((s) => s.id === sessionId)?.createdAt ?? ''))
  return (
    <li className="flex flex-col gap-space-sm p-space-md">
      <span className="flex flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-space-sm"><span className={refCls} lang="ar">{corrLabel(c)}</span> <SeverityTag severity={c.severity} /></span>
        <span className="text-body-md text-on-surface-variant"><T>{ruleNames(c) || t('No rule tagged')}</T>{c.note && <><Sep /><bdi dir="auto">{c.note}</bdi></>}</span>
      </span>
      {c.status === 'resolved' ? (
        <span className="flex items-center gap-1 text-body-md text-primary"><Icon name="check_circle" size={18} fill />{t('Correct now · closed')}</span>
      ) : stillWrong ? (
        <span className="flex items-center gap-1 text-body-md text-on-surface-variant"><Icon name="replay" size={18} />{t('Still wrong · back in review tomorrow')}</span>
      ) : (
        <Actions>
          <Button variant="secondary" onClick={() => resolveCorrection(c.id, 'correct', sessionId)}><Icon name="check" size={20} />{t('Correct now')}</Button>
          <Button variant="ghost" onClick={() => resolveCorrection(c.id, 'still_wrong', sessionId)}><Icon name="replay" size={20} />{t('Still wrong')}</Button>
        </Actions>
      )}
    </li>
  )
}

function Notes({ s }: { s: SessionT }) {
  const [v, setV] = useState(s.notes ?? '')
  return (
    <Field label={t('Notes')}>
      <textarea dir="auto" rows={2} className={fieldCls('h-auto py-space-sm')} value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== (s.notes ?? '') && updateSession(s.id, { notes: v.trim() || undefined })} />
    </Field>
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
      title={target ? <span lang="ar" className="font-naskh">{target.text ? `${target.text}، ` : 'الآية كاملة، '}{refLabel(target.key)}</span> : ''}
    >
      <div className="grid grid-cols-2 gap-space-sm" role="group" aria-label={t('Severity')}>
        {(['jali', 'khafi'] as const).map((sv) => (
          <button key={sv} type="button" aria-pressed={severity === sv} onClick={() => setSeverity(sv)}
            className={cn('flex min-h-20 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-control border p-space-sm text-center transition-colors',
              severity === sv ? 'border-2 border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant hover:bg-surface-container')}>
            <b lang="ar" className="font-naskh text-[22px] leading-snug">{sv === 'jali' ? 'جلي' : 'خفي'}</b>
            <small className="text-caption text-on-surface-variant">{sv === 'jali' ? t('clear error: a letter or vowel') : t('fine detail of a rule')}</small>
          </button>
        ))}
      </div>
      {severity && (
        <>
          <p className="text-label font-semibold tracking-wider text-secondary uppercase rtl:normal-case">{t('Rule (optional, up to 2)')}</p>
          <div className="flex flex-wrap gap-x-space-sm gap-y-space-md">
            {chips.map((id) => {
              const l = getLesson(id)!
              return <Chip key={id} tone="outline" pressed={picked.includes(id)} onClick={() => toggle(id)}><span lang="ar" className="font-arabic">{l.nameAr}</span></Chip>
            })}
            <Chip tone="outline" pressed={!picked.length} onClick={() => setPicked([])}>{t('Other / not a rule')}</Chip>
            {q === null && <Chip tone="outline" icon="search" onClick={() => setQ('')} label={t('Search rules')}>{t('Search')}</Chip>}
          </div>
          {q !== null && (
            <Field label={t('Search rules')}>
              <input type="search" dir="auto" className={fieldCls()} value={q} onChange={(e) => setQ(e.target.value)} autoFocus placeholder={t('إخفاء, madd…')} />
            </Field>
          )}
          {note === null ? (
            <Button variant="ghost" className="self-start" onClick={() => setNote('')}><Icon name="add" size={20} />{t('Note')}</Button>
          ) : (
            <Field label={t('Note')}>
              <input type="text" dir="auto" className={fieldCls()} value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
            </Field>
          )}
        </>
      )}
      <Button block disabled={!severity} onClick={() => severity && onSave({ severity, lessonIds: picked, note: note?.trim() || undefined })}>{t('Save')}</Button>
      {!severity && <p className="text-center text-body-md text-on-surface-variant"><T>{t('Choose جلي or خفي to save.')}</T></p>}
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
    <Page>
      <Heading s={s} status={t('Session saved')} />
      <Card level="e2">
        <p className="text-body-lg">
          {mine.length ? (mine.length === 1 ? t('1 correction added to review.') : t('{n} corrections added to review.', { n: mine.length })) : t('No new corrections this time.')}
          {resolved.length > 0 && ' ' + (resolved.length === 1 ? t('1 closed: your teacher says it is correct now.') : t('{n} closed: your teacher says they are correct now.', { n: resolved.length }))}
        </p>
        {back.length > 0 && <p><T>{back.length === 1 ? t('{names} comes back in review tomorrow.', { names: back[0] }) : t('{names} come back in review tomorrow.', { names: back.join(t(' and ')) })}</T></p>}
        {early.length > 0 && <p><T>{early.length === 1
          ? t('{names}: not learned yet. It comes into review once you reach its lesson in the course.', { names: early[0] })
          : t('{names}: not learned yet. They come into review once you reach their lessons in the course.', { names: early.join(t(' and ')) })}</T></p>}
        {untagged > 0 && <p className="text-on-surface-variant">{untagged === 1 ? t('1 correction has no rule. They still come back in review.') : t('{n} corrections have no rule. They still come back in review.', { n: untagged })}</p>}
        {s.milestoneResults.map((r) => {
          const u = getUnit(r.passageId)
          return (
            <div key={r.passageId} className="flex flex-col gap-space-xs">
              <p><T>{r.result === 'passed'
                ? t('Unit finale: {label} passed.', { label: u?.finale?.label ?? r.passageId })
                : t('Unit finale: {label} not yet.', { label: u?.finale?.label ?? r.passageId })}</T></p>
              {r.result === 'passed' && u && (
                <p className="flex items-center gap-space-sm rounded-control bg-secondary-container px-space-md py-space-sm text-on-secondary-container">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-fill text-on-primary"><Icon name="star" size={18} fill /></span>
                  <T>{t('Unit {n} · {name} complete.', { n: u.n, name: u.nameAr })}</T>
                </p>
              )}
            </div>
          )
        })}
      </Card>
      {mine.length > 0 && (
        <Group en={t('Corrections this session')} ar={undefined}>
          <ul className="flex flex-col divide-y divide-outline-variant">
            {mine.map((c) => (
              <Item key={c.id} end={<SeverityTag severity={c.severity} />}>
                <a className={refCls} lang="ar" href={listenHref(c.verseKey)}>{corrLabel(c)}</a>
                <span className="text-body-md text-on-surface-variant"><T>{ruleNames(c) || t('No rule tagged')}</T>{c.note && <><Sep /><bdi dir="auto">{c.note}</bdi></>}</span>
              </Item>
            ))}
          </ul>
        </Group>
      )}
      {s.notes && <NoteBlock label={t('Notes')} text={s.notes} />}
      <Actions>
        <Button href="#/teacher">{t('Back')}</Button>
        <Button variant="secondary" href={`#/teacher/${s.id}?sheet=1`}><Icon name="replay" size={20} />{t('Reopen class')}</Button>
      </Actions>
    </Page>
  )
}
