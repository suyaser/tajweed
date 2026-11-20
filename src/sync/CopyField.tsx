import { useRef, useState } from 'react'
import { Button, fieldCls } from '../components/Controls'
import { t } from '../i18n'
import { Icon } from '@/components/ui/icon'

/** A read-only field with a Copy button. Without clipboard access it selects the text so the learner can copy it by hand. */
export function CopyField({ text, label }: { text: string; label: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setMsg(t('Copied.'))
    } catch {
      ref.current?.select()
      let ok = false
      try { ok = document.execCommand('copy') } catch { /* not supported */ }
      setMsg(ok ? t('Copied.') : t('Selected: copy it with your device’s Copy command.'))
    }
  }
  return (
    <div className="flex flex-col gap-space-sm">
      <input ref={ref} className={fieldCls('bg-surface-container-low font-mono text-body-md')} dir="ltr" readOnly value={text} aria-label={label} onFocus={(e) => e.target.select()} />
      <div className="flex flex-wrap items-center gap-space-sm">
        <Button variant="secondary" onClick={copy}><Icon name="content_copy" size={20} />{t('Copy {label}', { label: label.toLowerCase() })}</Button>
        {msg && <span className="text-body-md text-on-surface-variant" role="status">{msg}</span>}
      </div>
    </div>
  )
}
