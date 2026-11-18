import { useEffect, useRef, type ReactNode } from 'react'
import type { Settings } from '../core/types'
import { href, navigate, type Route, type RouteName } from './router'

type Tab = 'today' | 'rules' | 'teacher' | 'path'
type Kind = 'tab' | 'pushed' | 'focus' | 'bare'

const TABS: { id: Tab; ar: string; en: string; to: string }[] = [
  { id: 'today', ar: 'اليوم', en: 'Today', to: 'today' },
  { id: 'rules', ar: 'الأحكام', en: 'Rules', to: 'rules' },
  { id: 'teacher', ar: 'الشيخ', en: 'Teacher', to: 'teacher' },
  { id: 'path', ar: 'المسار', en: 'Path', to: 'plan' },
]

// Design §4.4: shell kind, owning tab, title, and where ✕ / ‹ go.
const META: Record<RouteName, { kind: Kind; tab?: Tab; ar: string; en: string; parent?: string; gear?: true }> = {
  onboarding: { kind: 'bare', ar: 'مسار التجويد', en: 'Tajweed Path' },
  today: { kind: 'tab', tab: 'today', ar: 'اليوم', en: 'Today', gear: true },
  learn: { kind: 'focus', tab: 'today', ar: 'السبق', en: 'Lesson', parent: 'today' },
  review: { kind: 'focus', tab: 'today', ar: 'المراجعة', en: 'Review', parent: 'today' },
  listen: { kind: 'focus', tab: 'today', ar: 'التلقي', en: 'Listen', parent: 'today' },
  rules: { kind: 'tab', tab: 'rules', ar: 'الأحكام', en: 'Rules' },
  rule: { kind: 'pushed', tab: 'rules', ar: 'الأحكام', en: 'Rules', parent: 'rules' },
  resources: { kind: 'pushed', tab: 'rules', ar: 'المصادر', en: 'Resources', parent: 'rules' },
  teacher: { kind: 'tab', tab: 'teacher', ar: 'الشيخ', en: 'Teacher' },
  teacherNew: { kind: 'pushed', tab: 'teacher', ar: 'جلسة جديدة', en: 'Plan a session', parent: 'teacher' },
  session: { kind: 'pushed', tab: 'teacher', ar: 'الجلسة', en: 'Session', parent: 'teacher' },
  plan: { kind: 'tab', tab: 'path', ar: 'المسار', en: 'Path', gear: true },
  progress: { kind: 'tab', tab: 'path', ar: 'المسار', en: 'Path', gear: true },
  settings: { kind: 'pushed', ar: 'الإعدادات', en: 'Settings', parent: 'today' },
  mushaf: { kind: 'pushed', tab: 'rules', ar: 'المصحف', en: 'Ayah analyser', parent: 'rules' },
  mutun: { kind: 'pushed', tab: 'rules', ar: 'المتون', en: 'Mutun', parent: 'rules' },
  drill: { kind: 'focus', tab: 'today', ar: 'تمييز', en: 'Contrast drill', parent: 'review' },
  devComponents: { kind: 'pushed', ar: 'المكوّنات', en: 'Components', parent: 'today' },
  notFound: { kind: 'tab', ar: 'غير موجود', en: 'Not found' },
}

/** Focus modes hide the tab bar: learn, review, listen, drill, the in-class sheet, find-first, memorise. */
export function shellKind(r: Route): Kind {
  const m = META[r.name]
  if (r.name === 'session' && r.params.sheet) return 'focus'
  if ((r.name === 'mushaf' && r.params.mode === 'find') || (r.name === 'mutun' && r.params.mode === 'memorise')) return 'focus'
  return m.kind
}

const today = new Date()
const gregorian = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(today)
const hijri = (() => {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(today).replace(/\s?هـ$/, '')
  } catch {
    return ''
  }
})()

export interface ShellProps {
  route: Route
  theme: Settings['theme']
  textSize?: Settings['textSize']
  tajweedPatterns?: boolean
  /** 56px mini player shown above the tab bar while audio continues (design §4.1). */
  miniPlayer?: ReactNode
  /** Focus-mode position text, e.g. "7 of 14". */
  focusStatus?: ReactNode
  children: ReactNode
}

export function Shell({ route, theme, textSize = 'm', tajweedPatterns = false, miniPlayer, focusStatus, children }: ShellProps) {
  const meta = META[route.name]
  const kind = shellKind(route)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = document.documentElement
    if (theme === 'system') delete el.dataset.theme
    else el.dataset.theme = theme
    el.dataset.textSize = textSize
    el.classList.toggle('tj-patterns', tajweedPatterns)
  }, [theme, textSize, tajweedPatterns])

  // New page: start at the top and move focus to the content (SPA a11y).
  useEffect(() => {
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
  }, [route.path])

  const parent = route.name === 'session' && kind === 'focus' ? `teacher/${route.params.id}` : meta.parent ?? 'today'
  const hasNav = kind === 'tab' || kind === 'pushed'

  return (
    <div className="shell" data-kind={kind}>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus() }}>Skip to content</a>
      {hasNav && <Rail active={meta.tab} />}
      <div className="shell-col">
        {kind === 'focus' && (
          <header className="focusbar gutter">
            <button type="button" className="icon-btn close" onClick={() => navigate(parent)}>
              <span aria-hidden="true">✕</span> Close
            </button>
            <span className="focusbar-title" lang="ar">{meta.ar}</span>
            <span className="focusbar-status t-sm">{focusStatus}</span>
          </header>
        )}
        {hasNav && (
          <header className={`topbar lattice gutter${route.name === 'today' ? ' topbar-today' : ''}`}>
            {kind === 'pushed' && (
              <a className="back" href={href(parent)}>
                <span aria-hidden="true">‹</span> Back
              </a>
            )}
            <div className="topbar-title">
              <h1 className="kufi" lang="ar">{meta.ar}</h1>
              <span className="topbar-en">{meta.en}</span>
              {route.name === 'today' && (
                <p className="topbar-dates">
                  <span>{gregorian}</span> {hijri && <span lang="ar">{hijri}</span>}
                </p>
              )}
            </div>
            {meta.gear && (
              <a className="gear" href={href('settings')} aria-label="Settings">
                <span aria-hidden="true">⚙</span>
              </a>
            )}
          </header>
        )}
        <main id="main" ref={mainRef} tabIndex={-1} className={`shell-main gutter${kind === 'bare' ? ' shell-bare' : ''}`}>
          {children}
        </main>
        {hasNav && miniPlayer && <div className="miniplayer">{miniPlayer}</div>}
        {hasNav && <TabBar active={meta.tab} />}
      </div>
    </div>
  )
}

function TabBar({ active }: { active?: Tab }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => (
        <a key={t.id} href={href(t.to)} aria-current={t.id === active ? 'page' : undefined}>
          <span className="tab-star" aria-hidden="true">✦</span>
          <b lang="ar">{t.ar}</b>
          <small>{t.en}</small>
        </a>
      ))}
    </nav>
  )
}

function Rail({ active }: { active?: Tab }) {
  return (
    <nav className="rail lattice" aria-label="Main">
      <a className="rail-brand" href={href('today')}>
        <span className="rail-orn" aria-hidden="true">۞</span>
        <span className="kufi" lang="ar">مسار التجويد</span>
      </a>
      {TABS.map((t) => (
        <a key={t.id} href={href(t.to)} aria-current={t.id === active ? 'page' : undefined}>
          <b lang="ar">{t.ar}</b>
          <small>{t.en}</small>
        </a>
      ))}
      <a className="rail-gear" href={href('settings')} aria-label="Settings">
        <span aria-hidden="true">⚙</span>
      </a>
    </nav>
  )
}
