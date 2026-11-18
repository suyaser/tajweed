import { Children, type ReactNode } from 'react'
import { splitBidi } from './bidi'

/** One explicit Arabic island inside Latin text. */
export function Bdi({ children }: { children: ReactNode }) {
  return <bdi className="a" lang="ar">{children}</bdi>
}

/** Mixed English–Arabic text: every Arabic run in a top-level string child becomes a <bdi class="a" lang="ar">. */
export function T({ children }: { children: ReactNode }) {
  return (
    <>
      {Children.map(children, (c) =>
        typeof c === 'string'
          ? splitBidi(c).map((p, i) => (p.ar ? <Bdi key={i}>{p.text}</Bdi> : p.text))
          : c,
      )}
    </>
  )
}

/** Arabic-forward label: Arabic name first, small English gloss beneath (design §2.1). */
export function ArLabel({ ar, en, size = 'sm' }: { ar: string; en?: string; size?: 'sm' | 'lg' | 'h2' }) {
  return (
    <span className={`arlabel arlabel-${size}`}>
      <span lang="ar" dir="rtl">{ar}</span>
      {en && <small>{en}</small>}
    </span>
  )
}
