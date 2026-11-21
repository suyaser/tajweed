import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Settings } from '../core/types'
import { href, navigate, type Route, type RouteName } from './router'
import { today as studyDay } from '../core/day'
import { getLesson } from '../content'
import { isAr, locale, t } from '../i18n'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'

type Tab = 'today' | 'rules' | 'teacher' | 'path'
type Kind = 'tab' | 'pushed' | 'focus' | 'bare'

const TABS: { id: Tab; ar: string; en: string; to: string; icon: string }[] = [
  { id: 'today', ar: 'اليوم', en: 'Today', to: 'today', icon: 'calendar_today' },
  { id: 'rules', ar: 'الأحكام', en: 'Rules', to: 'rules', icon: 'menu_book' },
  { id: 'teacher', ar: 'الشيخ', en: 'Teacher', to: 'teacher', icon: 'record_voice_over' },
  { id: 'path', ar: 'المسار', en: 'Path', to: 'plan', icon: 'route' },
]

// Design §4.4: shell kind, owning tab, title, and where ✕ / ‹ go.
const META: Record<RouteName, { kind: Kind; tab?: Tab; ar: string; en: string; parent?: string }> = {
  onboarding: { kind: 'bare', ar: 'مسار التجويد', en: 'Tajweed Path' },
  today: { kind: 'tab', tab: 'today', ar: 'اليوم', en: 'Today' },
  learn: { kind: 'focus', tab: 'today', ar: 'السبق', en: 'New lesson', parent: 'today' },
  review: { kind: 'focus', tab: 'today', ar: 'المراجعة', en: 'Review', parent: 'today' },
  listen: { kind: 'focus', tab: 'today', ar: 'التلقي', en: 'Listen', parent: 'today' },
  rules: { kind: 'tab', tab: 'rules', ar: 'الأحكام', en: 'Rules' },
  rule: { kind: 'pushed', tab: 'rules', ar: 'الأحكام', en: 'Rules', parent: 'rules' },
  resources: { kind: 'pushed', tab: 'rules', ar: 'المصادر', en: 'Resources', parent: 'rules' },
  teacher: { kind: 'tab', tab: 'teacher', ar: 'الشيخ', en: 'Teacher' },
  teacherNew: { kind: 'pushed', tab: 'teacher', ar: 'جلسة جديدة', en: 'Plan a session', parent: 'teacher' },
  session: { kind: 'pushed', tab: 'teacher', ar: 'الجلسة', en: 'Session', parent: 'teacher' },
  plan: { kind: 'tab', tab: 'path', ar: 'المسار', en: 'Path' },
  progress: { kind: 'tab', tab: 'path', ar: 'المسار', en: 'Path' },
  unit: { kind: 'pushed', tab: 'path', ar: 'الوحدة', en: 'Unit', parent: 'plan' },
  settings: { kind: 'pushed', ar: 'الإعدادات', en: 'Settings', parent: 'today' },
  guide: { kind: 'pushed', ar: 'كيف يعمل', en: 'How it works', parent: 'today' },
  account: { kind: 'pushed', ar: 'الحساب', en: 'Account and backup', parent: 'settings' },
  shared: { kind: 'bare', ar: 'مسار التجويد', en: 'Shared progress' },
  circle: { kind: 'pushed', ar: 'الحلقة', en: 'Circles', parent: 'settings' },
  circleView: { kind: 'pushed', ar: 'الحلقة', en: 'Circle', parent: 'circle' },
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

/** The study day (03:00 boundary, core/day), not the calendar date, so it agrees with the plan (M13). For Today's header. */
export function dates() {
  const now = new Date()
  const day = new Date(studyDay(now) + 'T12:00:00Z')
  const g = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(day)
  let h = ''
  try {
    h = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(day).replace(/\s?هـ$/, '')
  } catch { /* no Hijri calendar in this browser */ }
  const late = now.getHours() < 3 ? t("Still {day}'s wird until 03:00", { day: new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(day) }) : ''
  return { gregorian: g, hijri: h, late }
}

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

const iconBtn = 'grid size-12 shrink-0 cursor-pointer place-items-center rounded-full text-on-surface-variant no-underline transition-colors hover:bg-surface-container hover:text-on-surface'
const bar = 'sticky top-0 z-30 flex h-16 items-center gap-space-xs border-b border-outline-variant bg-surface/85 shadow-top pt-[env(safe-area-inset-top)] backdrop-blur-xl ps-[max(var(--spacing-space-sm),env(safe-area-inset-left))] pe-[max(var(--spacing-space-sm),env(safe-area-inset-right))] box-content'

export function Shell({ route, theme, textSize = 'm', tajweedPatterns = false, miniPlayer, focusStatus, children }: ShellProps) {
  const meta = META[route.name]
  const kind = shellKind(route)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = document.documentElement
    if (theme === 'system') delete el.dataset.theme
    else el.dataset.theme = theme
    el.dataset.uiScale = textSize // whole-UI zoom (app.css); replaces the Quran-only data-text-size
    el.classList.toggle('tj-patterns', tajweedPatterns)
  }, [theme, textSize, tajweedPatterns])

  // New page: start at the top and move focus to the content (SPA a11y).
  useEffect(() => {
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
  }, [route.path])

  const parent = route.name === 'session' && kind === 'focus' ? `teacher/${route.params.id}` : meta.parent ?? 'today'
  const hasNav = kind === 'tab' || kind === 'pushed'
  // A lesson is a focus screen on phones and a normal page from lg: side rail, top bar with Back (docs/13 "Layouts").
  const deskPage = kind === 'focus' && route.name === 'learn'
  const rail = hasNav || deskPage

  return (
    <div data-kind={kind} className="min-h-[calc(100dvh/var(--zoom))] bg-background text-on-surface">
      <a href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus() }}
        className="sr-only z-50 rounded-control bg-primary-fill px-space-md py-space-sm text-on-primary focus:not-sr-only focus:fixed focus:top-2 focus:start-2">
        {t('Skip to content')}
      </a>
      {rail && <Rail active={meta.tab} current={route.name} />}
      <div className={cn('flex min-h-[calc(100dvh/var(--zoom))] min-w-0 flex-col', rail && 'lg:ps-60')}>
        {kind === 'focus' && (
          <header className={cn(bar, deskPage && 'lg:hidden')}>
            <button type="button" className={cn(iconBtn, 'w-auto gap-1 px-space-sm')} onClick={() => navigate(parent)}>
              <Icon name="close" /><span className="text-label font-semibold">{t('Close')}</span>
            </button>
            <FocusTitle route={route} ar={meta.ar} en={meta.en} />
            <span className="min-w-12 text-end text-label text-on-surface-variant tabular-nums">{focusStatus}</span>
          </header>
        )}
        {kind === 'tab' && <TabBarTop />}
        {deskPage && (
          <header className={cn(bar, 'hidden lg:flex lg:ps-space-lg')}>
            <a className={cn(iconBtn, 'flex w-auto items-center gap-1 px-space-sm')} href={href(parent)}>
              <Icon name="arrow_back" rtlFlip /><span className="text-label font-semibold">{isAr ? META[parent as RouteName]?.ar ?? META.today.ar : META[parent as RouteName]?.en ?? META.today.en}</span>
            </a>
            <FocusTitle route={route} ar={meta.ar} en={meta.en} />
            <span className="min-w-24 pe-space-sm text-end text-label text-on-surface-variant tabular-nums">{focusStatus}</span>
          </header>
        )}
        {kind === 'pushed' && (
          <header className={cn(bar, 'lg:ps-space-lg')}>
            <a className={iconBtn} href={href(parent)} aria-label={t('Back')}>
              <Icon name="arrow_back" rtlFlip />
            </a>
            <BarTitle path={route.path} ar={meta.ar} en={meta.en} />
          </header>
        )}
        <main key={route.path} id="main" ref={mainRef} tabIndex={-1}
          className={cn('w-full flex-1 overflow-x-clip outline-none motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300',
            hasNav && 'pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-space-xl', deskPage && 'lg:pb-space-xl')}>
          {children}
        </main>
        {hasNav && miniPlayer && (
          <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 border-t border-outline-variant bg-surface-container-lowest shadow-bar lg:bottom-0 lg:start-60">
            {miniPlayer}
          </div>
        )}
        {hasNav && <TabBar active={meta.tab} />}
      </div>
    </div>
  )
}

/** Phone header on tab screens: Help | brand | Settings (the language is in Settings). Hidden from lg (the rail has them). */
function TabBarTop() {
  return (
    <header className={cn(bar, 'justify-between lg:hidden')}>
      <div className="flex flex-1 items-center">
        <a className={iconBtn} href={href('guide')} aria-label={t('Help')}><Icon name="help" /></a>
      </div>
      <a href={href('today')} className="flex flex-col items-center text-center no-underline">
        <span lang="ar" className="font-naskh text-[22px] leading-tight font-bold text-primary">مسار التجويد</span>
        {!isAr && <span className="text-caption tracking-wider text-on-surface-variant uppercase">Tajweed Path</span>}
      </a>
      <div className="flex flex-1 items-center justify-end">
        <a className={iconBtn} href={href('settings')} aria-label={t('Settings')}><Icon name="settings" /></a>
      </div>
    </header>
  )
}

/** The page's own <h1>: 'none', or whether it is on screen ('hidden' once it scrolls under the bar). */
function usePageHeading(key: string) {
  const [state, setState] = useState<'none' | 'visible' | 'hidden'>('none')
  useEffect(() => {
    let io: IntersectionObserver | undefined
    // the screen renders its header after the shell (lazy screens later still): look on the next frames
    let tries = 0
    let id = 0
    const look = () => {
      const h = document.querySelector('main h1')
      if (!h) { if (++tries < 20) id = requestAnimationFrame(look); else setState('none'); return }
      if (typeof IntersectionObserver === 'undefined') return setState('visible')
      io = new IntersectionObserver(([e]) => setState(e.isIntersecting ? 'visible' : 'hidden'), { rootMargin: '-64px 0px 0px 0px' })
      io.observe(h)
    }
    id = requestAnimationFrame(look)
    return () => { cancelAnimationFrame(id); io?.disconnect() }
  }, [key])
  return state
}
const useHeadingVisible = (key: string) => usePageHeading(key) === 'visible'

/** A pushed screen's bar title: its <h1> when the page has none; when the page has its own header (PageHeader), the
 *  same words appear here only once that header has scrolled away, so the title is never on screen twice. */
function BarTitle({ path, ar, en }: { path: string; ar: string; en: string }) {
  const own = usePageHeading(path)
  const body = isAr
    ? <span className="truncate text-headline-md">{ar}</span>
    : <><span className="truncate text-headline-md">{en}</span><span lang="ar" dir="rtl" className="hidden text-arabic-label text-secondary sm:inline">{ar}</span></>
  if (own === 'none') return <h1 className="flex min-w-0 flex-1 items-baseline gap-x-space-sm truncate">{body}</h1>
  return (
    <span aria-hidden className={cn('flex min-w-0 flex-1 items-baseline gap-x-space-sm truncate transition-opacity', own === 'visible' && 'opacity-0')}>{body}</span>
  )
}

/** The focus bar title. In a lesson: nothing while the page header (lesson name, step bar) is on screen, the lesson's
 *  name once it has scrolled away, so nothing is on screen twice. */
function FocusTitle({ route, ar, en }: { route: Route; ar: string; en: string }) {
  const lesson = route.name === 'learn' ? getLesson(route.params.lessonId) : undefined
  const headerShown = useHeadingVisible(route.path)
  if (lesson && headerShown) return <span className="min-w-0 flex-1" />
  const title = lesson ? lesson.nameAr : ar
  const sub = lesson ? (!isAr ? lesson.nameEn : '') : !isAr ? en : ''
  return (
    <span className="flex min-w-0 flex-1 flex-col items-center text-center">
      <span lang="ar" className="max-w-full truncate font-naskh text-body-lg leading-snug font-semibold text-on-surface">{title}</span>
      {sub && <small className="max-w-full truncate text-caption text-on-surface-variant">{sub}</small>}
    </span>
  )
}

function TabBar({ active }: { active?: Tab }) {
  return (
    <nav aria-label={t('Main')}
      className="fixed inset-x-0 bottom-0 z-30 bg-surface/90 pb-[env(safe-area-inset-bottom)] shadow-bar backdrop-blur-xl lg:hidden">
      <ul className="mx-auto flex h-[4.5rem] max-w-[480px] items-stretch justify-around px-space-sm">
        {TABS.map((tab) => {
          const on = tab.id === active
          return (
            <li key={tab.id} className="flex flex-1">
              <a href={href(tab.to)} aria-current={on ? 'page' : undefined}
                className={cn('flex flex-1 flex-col items-center justify-center gap-0.5 rounded-control no-underline transition-colors',
                  on ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface')}>
                <span className={cn('grid h-7 w-14 place-items-center rounded-full transition-colors', on && 'bg-primary-container')}>
                  <Icon name={tab.icon} size={22} fill={on} />
                </span>
                {isAr
                  ? <b lang="ar" className={cn('text-arabic-label leading-tight', on ? 'font-bold' : 'font-medium')}>{tab.ar}</b>
                  : <>
                      <b className={cn('text-label leading-none', on ? 'font-bold' : 'font-medium')}>{tab.en}</b>
                      <small lang="ar" className="text-arabic-label leading-tight opacity-80">{tab.ar}</small>
                    </>}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

const railItem = 'flex min-h-12 items-center gap-space-sm rounded-control px-space-md no-underline transition-colors'
const railIdle = 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
const railOn = 'bg-primary-fill text-on-primary font-semibold'

function RailLink({ to, icon, en, ar, on, small }: { to: string; icon: string; en: string; ar: string; on: boolean; small?: boolean }) {
  return (
    <a href={href(to)} aria-current={on ? 'page' : undefined} className={cn(railItem, on ? railOn : railIdle, small && 'min-h-11')}>
      <Icon name={icon} size={small ? 20 : 22} fill={on} />
      {isAr
        ? <span lang="ar" className="text-body-md">{ar}</span>
        : <>
            <span className="text-body-md">{en}</span>
            <span lang="ar" dir="rtl" className={cn('ms-auto text-arabic-label', on ? 'text-on-primary' : 'opacity-80')}>{ar}</span>
          </>}
    </a>
  )
}

/** Desktop side rail (≥ lg): brand, the four tabs, then Help · Settings at the bottom (the language is in Settings). */
function Rail({ active, current }: { active?: Tab; current: RouteName }) {
  return (
    <nav aria-label={t('Main')}
      className="fixed inset-y-0 start-0 z-40 hidden w-60 flex-col gap-space-lg overflow-y-auto border-e border-outline-variant bg-surface-container-low p-space-md lg:flex">
      <a href={href('today')} className="flex items-center gap-space-sm px-space-xs py-space-sm no-underline">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-container text-gold">
          <Icon name="auto_awesome" />
        </span>
        <span className="flex flex-col">
          <span lang="ar" className="font-naskh text-[22px] leading-tight font-bold text-primary">مسار التجويد</span>
          {!isAr && <span className="text-caption tracking-wider text-on-surface-variant uppercase">Tajweed Path</span>}
        </span>
      </a>
      <ul className="flex flex-col gap-space-xs">
        {TABS.map((tab) => <li key={tab.id}><RailLink to={tab.to} icon={tab.icon} en={tab.en} ar={tab.ar} on={tab.id === active} /></li>)}
      </ul>
      <ul className="mt-auto flex flex-col gap-space-xs border-t border-outline-variant pt-space-md">
        <li><RailLink small to="guide" icon="help" en="Help" ar="كيف يعمل" on={current === 'guide'} /></li>
        <li><RailLink small to="settings" icon="settings" en="Settings" ar="الإعدادات" on={current === 'settings'} /></li>
      </ul>
    </nav>
  )
}
