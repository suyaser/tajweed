// Last-resort screens: unreadable saved data (M5) and a render crash (M4). Plain markup, no screen code.
import { Component, useRef, useState, type ReactNode } from 'react'
import { STORAGE_KEY, exportJson, getSaveError, importJson, resetAll, useData } from '../core/store'
import { download } from './download'
import { t } from '../i18n'
import { Button, Card, Eyebrow, Nudge } from '../components/Controls'

const rawData = () => { try { return localStorage.getItem(STORAGE_KEY) ?? '' } catch { return '' } }
const stamp = () => new Date().toISOString().slice(0, 10)

export function Recovery({ message }: { message: string }) {
  const file = useRef<HTMLInputElement>(null)
  const [err, setErr] = useState<string | null>(null)
  const restore = async (f?: File) => {
    if (!f) return
    try { importJson(await f.text()); location.reload() } catch (e) { setErr(t('Not restored: {reason}', { reason: (e as Error).message })) }
  }
  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col px-gutter py-space-xl">
      <Card level="e2">
        <Eyebrow>{t('Your saved data could not be read')}</Eyebrow>
        <p>{message} {t('Nothing has been changed. Download your saved data first, then restore a backup or reload.')}</p>
        <div className="flex flex-wrap gap-space-sm">
          <Button onClick={() => download(`tajweed-path-unreadable-${stamp()}.json`, rawData())}>{t('Download my data')}</Button>
          <Button variant="secondary" onClick={() => location.reload()}>{t('Reload')}</Button>
          <Button variant="secondary" onClick={() => file.current?.click()}>{t('Restore from a backup')}</Button>
          <Button variant="ghost" onClick={() => {
            if (confirm(t('Start fresh? This replaces your saved data on this device. Download it first.'))) { resetAll(); location.reload() }
          }}>{t('Start fresh')}</Button>
        </div>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { restore(e.target.files?.[0]); e.target.value = '' }} />
        {err && <p role="alert" className="text-error">{err}</p>}
      </Card>
    </main>
  )
}

/** A screen that throws shows Recovery instead of a blank page on every launch. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    return this.state.error ? <Recovery message={t('Something went wrong ({reason}).', { reason: this.state.error.message })} /> : this.props.children
  }
}

/** Shown while saves fail: the data is only in memory and is lost on reload (M3). */
export function SaveErrorBanner() {
  useData() // re-render on every commit
  if (!getSaveError()) return null
  return (
    <div role="alert" className="mx-auto w-full max-w-[760px] px-gutter pt-space-md">
      <Nudge action={<Button onClick={() => download(`tajweed-path-${stamp()}.json`, exportJson())}>{t('Export a backup')}</Button>}>
        {t("Couldn't save — storage is full. Export a backup now.")}
      </Nudge>
    </div>
  )
}
