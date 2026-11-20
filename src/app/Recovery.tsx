// Last-resort screens: unreadable saved data (M5) and a render crash (M4). Plain markup, no screen code.
import { Component, useRef, useState, type ReactNode } from 'react'
import { STORAGE_KEY, exportJson, getSaveError, importJson, resetAll, useData } from '../core/store'
import { download } from './download'
import { t } from '../i18n'

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
    <main className="shell-main gutter" style={{ maxWidth: 560, margin: '0 auto', paddingBlock: 32 }}>
      <section className="card card-e2">
        <p className="eyebrow">{t('Your saved data could not be read')}</p>
        <p>{message} {t('Nothing has been changed. Download your saved data first, then restore a backup or reload.')}</p>
        <p style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" className="btn btn-primary" onClick={() => download(`tajweed-path-unreadable-${stamp()}.json`, rawData())}>{t('Download my data')}</button>
          <button type="button" className="btn btn-secondary" onClick={() => location.reload()}>{t('Reload')}</button>
          <button type="button" className="btn btn-secondary" onClick={() => file.current?.click()}>{t('Restore from a backup')}</button>
          <button type="button" className="btn btn-ghost" onClick={() => {
            if (confirm(t('Start fresh? This replaces your saved data on this device. Download it first.'))) { resetAll(); location.reload() }
          }}>{t('Start fresh')}</button>
        </p>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { restore(e.target.files?.[0]); e.target.value = '' }} />
        {err && <p role="alert">{err}</p>}
      </section>
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
    <div className="nudge card card-e1" role="alert">
      <p>{t("Couldn't save — storage is full. Export a backup now.")}</p>
      <button type="button" className="btn btn-primary" onClick={() => download(`tajweed-path-${stamp()}.json`, exportJson())}>{t('Export a backup')}</button>

    </div>
  )
}
