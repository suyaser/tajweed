import type { UserData } from '../core/types'
import { useData } from '../core/store'
import { today } from '../core/day'
import { LADDER, hasOpenCorrection, levelOf, type Level } from '../core/scheduler'
import { getLesson, lessons, phases as contentPhases, topics } from '../content'
import { Bdi, Card, CorrectionBadge, CorrectionTag, LevelBadge, ProgressDots, T } from '../components'
import { accuracy, dayLabel, live, passedMilestones, studiedDays, weeks } from './path/helpers'
import { PathTabs } from './path/ui'
import './path.css'

export default function Progress() {
  const d = useData()
  return (
    <div className="p-stack">
      <PathTabs value="progress" />
      <div className="p-two">
        <Recitation d={d} />
        <Recognition d={d} />
      </div>
      <Consistency d={d} />
      <Goals d={d} />
    </div>
  )
}

const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`

/** "Title:" then one Arabic name per line, so a wrapped Arabic island never reorders the sentence. */
function NameList({ title, items }: { title: string; items: [ar: string, detail: string][] }) {
  return (
    <div>
      <p className="t-sm">{title}</p>
      <ul className="p-names">
        {items.map(([ar, detail], i) => <li key={i}><Bdi>{ar}</Bdi> <span className="muted t-sm">· {detail}</span></li>)}
      </ul>
    </div>
  )
}

function Recitation({ d }: { d: UserData }) {
  const cs = live(d.corrections)
  const sessions = live(d.sessions).filter((s) => s.status === 'done' || cs.some((c) => c.sessionId === s.id)).sort((a, b) => (a.on < b.on ? 1 : -1)).slice(0, 8)
  const open = cs.filter((c) => c.status === 'open').length
  const byRule = new Map<string, number>()
  for (const c of cs) for (const l of c.lessonIds) byRule.set(l, (byRule.get(l) ?? 0) + 1)
  const top = [...byRule].sort((a, b) => b[1] - a[1]).slice(0, 3)
  const passed = [...passedMilestones(d.sessions)].map(([k, s]) => {
    const [pid, mid] = k.split('/')
    return { label: contentPhases.find((p) => p.id === +pid)?.milestone.find((m) => m.id === mid)?.label ?? mid, on: s.on }
  })

  return (
    <Card eyebrow="From your teacher">
      <h2 className="t-h3">How you recite</h2>
      {!cs.length && !sessions.length ? (
        <p className="muted">Your teacher's corrections will show here after your first session.</p>
      ) : (
        <>
          {sessions.length > 0 && (
            <>
              <p className="t-sm">Corrections per session</p>
              <ul className="p-bars">
                {sessions.map((s) => {
                  const mine = cs.filter((c) => c.sessionId === s.id)
                  const j = mine.filter((c) => c.severity === 'jali').length
                  const k = mine.length - j
                  return (
                    <li key={s.id}>
                      <span className="t-sm p-bar-day">{dayLabel(s.on)}</span>
                      <span className="p-bar" aria-hidden="true">{'■'.repeat(j)}<span className="p-bar-k">{'□'.repeat(k)}</span></span>
                      <span className="p-tags p-tags-start"><CorrectionTag severity="jali" count={j} /><CorrectionTag severity="khafi" count={k} /></span>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
          <p>Open {open} · Resolved {cs.length - open}</p>
          {top.length > 0 && (
            <NameList title="Corrected most" items={top.map(([id, n]) => [getLesson(id)?.nameAr ?? id, plural(n, "time")])} />
          )}
          {passed.length > 0 && (
            <NameList title="Milestones passed" items={passed.map((p) => [p.label, dayLabel(p.on)])} />
          )}
        </>
      )}
    </Card>
  )
}

const LEVELS: Level[] = ['strong', 'known', 'learning', 'not-started']

function Recognition({ d }: { d: UserData }) {
  const on = today()
  const itemOf = new Map(d.items.filter((i) => i.kind === 'lesson').map((i) => [i.refId, i]))
  const rows = lessons.map((l) => {
    const it = itemOf.get(l.id)
    const answers = d.attempts.filter((a) => a.kind === 'lesson' && a.refId === l.id && a.countsForSchedule)
    const last5 = answers.slice(-5)
    return { l, it, level: levelOf(it, d.attempts, d.corrections, on), last5: last5.filter((a) => a.correct).length, n5: last5.length, open: hasOpenCorrection(l.id, d.corrections) }
  })
  const count = (lv: Level) => rows.filter((r) => r.level === lv).length
  const slipping = rows.filter((r) => (r.it?.lapses ?? 0) >= 2).sort((a, b) => b.it!.lapses - a.it!.lapses).slice(0, 3)
  const acc = accuracy(d.attempts, on)

  return (
    <Card eyebrow="From the quiz">
      <h2 className="t-h3">What you can recognise</h2>
      {!d.introductions.length ? (
        <p className="muted">Levels start after your first lesson.</p>
      ) : (
        <>
          <p className="p-levels">{LEVELS.map((lv) => <LevelBadge key={lv} level={lv} detail={String(count(lv))} />)}</p>
          {acc.total > 0 && (
            <p>In the last 30 days you answered {acc.correct} of {acc.total} review questions correctly.</p>
          )}
          {slipping.length > 0 && (
            <NameList title="Slipping" items={slipping.map((r) => [r.l.nameAr, plural(r.it!.lapses, 'lapse')])} />
          )}
          <details className="p-details">
            <summary>See all rules</summary>
            {topics.map((t) => {
              const tr = rows.filter((r) => r.l.topicId === t.id).sort((a, b) => (b.it?.lapses ?? 0) - (a.it?.lapses ?? 0))
              if (!tr.length) return null
              return (
                <section key={t.id}>
                  <h3 className="eyebrow"><T>{`${t.nameAr} · ${t.nameEn}`}</T></h3>
                  <ul className="p-list">
                    {tr.map(({ l, it, level, last5, n5, open }) => (
                      <li key={l.id}>
                        <a className="p-item p-item-link" href={`#/rules/${l.id}`}>
                          <span className="p-item-main">
                            <span className="a-sm" lang="ar">{l.nameAr}</span>
                            <span className="t-sm muted">
                              {it
                                ? `every ${LADDER[it.step]} ${LADDER[it.step] === 1 ? 'day' : 'days'} · ${plural(it.lapses, 'lapse')} · last ${n5}: ${last5} right · next ${dayLabel(it.dueOn)}`
                                : 'not started'}
                            </span>
                          </span>
                          <span className="p-tags">
                            <LevelBadge level={level} />
                            {open && <CorrectionBadge>teacher correction open</CorrectionBadge>}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </details>
        </>
      )}
      <p className="t-sm muted">This shows you can name a rule. Only your teacher can tell you if you recite it.</p>
    </Card>
  )
}

function Consistency({ d }: { d: UserData }) {
  const on = today()
  const w = weeks(studiedDays(d), on, 16, d.settings.onboardedOn)
  const shown = w.weeks.filter((x) => x.counted)
  const thisWeek = w.weeks[w.weeks.length - 1]
  return (
    <Card eyebrow="Consistency">
      <p>
        This week: {plural(thisWeek.count, 'day')} studied.
        {w.total > 1 && ` Studied 5 or more days in ${w.full} of the last ${plural(w.total, 'week')}.`}
      </p>
      <ol className="p-weeks" aria-label="Days studied per week, oldest first">
        {(shown.length ? shown : [thisWeek]).map((x) => (
          <li key={x.start}>
            <span className="t-sm muted p-bar-day">{dayLabel(x.start)}</span>
            <ProgressDots days={x.marks} />
          </li>
        ))}
      </ol>
    </Card>
  )
}

/** S1–S6 (spec §1.2), plain values. */
function Goals({ d }: { d: UserData }) {
  const on = today()
  const cs = live(d.corrections)
  const passedPhases = d.phases.filter((p) => p.status === 'passed').length
  const lastMs = live(d.sessions).filter((s) => s.milestoneResults.length).sort((a, b) => (a.on < b.on ? 1 : -1))[0]
  const jaliLast = lastMs ? cs.filter((c) => c.sessionId === lastMs.id && c.severity === 'jali').length : null
  const quizzable = lessons.filter((l) => l.phaseId <= 5 && l.questionKinds.length)
  const strongEnough = quizzable.filter((l) => (d.items.find((i) => i.kind === 'lesson' && i.refId === l.id)?.step ?? 0) >= 3).length
  const acc = accuracy(d.attempts, on, 14)
  const khafi = cs.filter((c) => c.severity === 'khafi')
  const w = weeks(studiedDays(d), on, 16, d.settings.onboardedOn)
  const done = live(d.sessions).filter((s) => s.status === 'done').length
  const goals: [string, string, string][] = [
    ['S1', 'Phase milestones confirmed by your teacher', `${passedPhases} of 6 phases passed (goal: phases 1–4, phase 5 passed or scheduled)`],
    ['S2', 'Clear errors on the last milestone session', jaliLast == null ? 'No milestone session yet' : `${jaliLast} جلي (goal: 0)`],
    ['S3', 'Rule recognition (quiz only)', `${strongEnough} of ${quizzable.length} rules at a 14-day interval${acc.total ? ` · ${Math.round((100 * acc.correct) / acc.total)}% right in the last 2 weeks` : ''} (goal: all, and 90%)`],
    ['S4', 'Fine-detail corrections that stick', khafi.length ? `${khafi.filter((c) => c.status === 'resolved').length} of ${khafi.length} خفي corrections resolved (goal: 80%)` : 'No خفي corrections yet'],
    ['S5', 'Consistency', `${w.full} of ${plural(w.total, 'week')} with 5 or more study days (goal: 12 of 16)`],
    ['S6', 'Teacher contact', `${plural(done, 'session')} logged (goal: 12)`],
  ]
  return (
    <details className="p-details card card-e1">
      <summary>16-week goals</summary>
      <dl className="p-goals">
        {goals.map(([id, name, value]) => (
          <div key={id}>
            <dt className="t-sm"><b>{id}</b> · {name}</dt>
            <dd><T>{value}</T></dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
