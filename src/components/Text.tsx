import { Children, type ReactNode } from 'react'
import { arRefs, isArabicLine, splitBidi } from './bidi'

/** One explicit Arabic island inside Latin text. */
export function Bdi({ children }: { children: ReactNode }) {
  // Short terms (≤ 3 words) never wrap mid-term (m12).
  const nw = typeof children === 'string' && children.trim().split(/\s+/).length <= 3
  return <bdi className={nw ? 'a nw' : 'a'} lang="ar">{children}</bdi>
}

/** Mixed English–Arabic text: every Arabic run in a top-level string child becomes a <bdi class="a" lang="ar">. */
export function T({ children }: { children: ReactNode }) {
  return (
    <>
      {Children.map(children, (c) =>
        typeof c === 'string'
          ? splitBidi(arRefs(c)).map((p, i) => (p.ar ? <Bdi key={i}>{p.text}</Bdi> : p.text))
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

/** A content line: an all-Arabic line (an example like ٱدْعُ ← اُدْعُ) is its own RTL block so it reads one way (M3);
 *  mixed lines go through <T>. */
export function Line({ text }: { text: string }) {
  const t = arRefs(text)
  return isArabicLine(t) ? <span className="ar-line" lang="ar" dir="rtl">{t}</span> : <T>{t}</T>
}
