import { useRef, useState } from 'react'
import { Button } from '../components'

/** A read-only field with a Copy button. Without clipboard access it selects the text so the learner can copy it by hand. */
export function CopyField({ text, label }: { text: string; label: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setMsg('Copied.')
    } catch {
      ref.current?.select()
      let ok = false
      try { ok = document.execCommand('copy') } catch { /* not supported */ }
      setMsg(ok ? 'Copied.' : 'Selected: copy it with your device’s Copy command.')
    }
  }
  return (
    <div className="p-stack">
      <input ref={ref} className="acc-copyfield" readOnly value={text} aria-label={label} onFocus={(e) => e.target.select()} />
      <div className="p-actions">
        <Button variant="secondary" onClick={copy}>Copy {label.toLowerCase()}</Button>
        {msg && <span className="t-sm" role="status">{msg}</span>}
      </div>
    </div>
  )
}
