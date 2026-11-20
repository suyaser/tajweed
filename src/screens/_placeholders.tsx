import { Button, Card, EmptyState } from '../components'
import { isAr, t } from '../i18n'

// Until a screen file exists in src/screens/, App renders this with the route's names.
export const PLACEHOLDERS: Record<string, { ar: string; en: string }> = {
  Onboarding: { ar: 'البداية', en: 'Onboarding' },
  Today: { ar: 'اليوم', en: 'Today' },
  Learn: { ar: 'السبق', en: 'Learn a lesson' },
  Review: { ar: 'المراجعة', en: 'Review' },
  Listen: { ar: 'التلقي', en: 'Listen · repeat · record' },
  Rules: { ar: 'الأحكام', en: 'Rule library' },
  Rule: { ar: 'بطاقة الحكم', en: 'Rule card' },
  Resources: { ar: 'المصادر', en: 'Resources' },
  Teacher: { ar: 'الشيخ', en: 'Teacher sessions' },
  TeacherNew: { ar: 'جلسة جديدة', en: 'Plan a session' },
  Session: { ar: 'العرض على الشيخ', en: 'Session' },
  Plan: { ar: 'المسار', en: 'Course map' },
  Unit: { ar: 'الوحدة', en: 'Unit' },
  Progress: { ar: 'التقدّم', en: 'Progress' },
  Settings: { ar: 'الإعدادات', en: 'Settings' },
  Mushaf: { ar: 'المصحف', en: 'Ayah analyser (R2)' },
  Mutun: { ar: 'المتون', en: 'Mutun (R2)' },
  Drill: { ar: 'تمييز', en: 'Contrast drill (R2)' },
  NotFound: { ar: 'غير موجود', en: 'Page not found' },
}

export function Placeholder({ name, params }: { name: string; params: Record<string, string> }) {
  if (name === 'NotFound')
    return <EmptyState title={t("This page doesn't exist.")} action={<Button href="#/today">{t('Go to Today')}</Button>}>{t('The link may be mistyped or from an older version.')}</EmptyState>
  const p = PLACEHOLDERS[name] ?? { ar: name, en: name }
  const keys = Object.entries(params)
  return (
    <Card>
      <EmptyState title={<><span className="k-h2" lang="ar">{p.ar}</span>{!isAr && <><br />{p.en}</>}</>}>
        {t('Not built yet.')}
{keys.length ? ` Params: ${keys.map(([k, v]) => `${k}=${v}`).join(', ')}` : ''}
      </EmptyState>
    </Card>
  )
}
