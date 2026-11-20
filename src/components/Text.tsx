import { Children, type ReactNode } from 'react'
import { arRefs, carryMarks, isArabicLine, splitBidi, splitLatin } from './bidi'
import { digits, isAr } from '../i18n'

/** One explicit Arabic island inside Latin text. */
export function Bdi({ children }: { children: ReactNode }) {
  // Short terms (≤ 3 words) never wrap mid-term (m12).
  const nw = typeof children === 'string' && children.trim().split(/\s+/).length <= 3
  return <bdi className={nw ? 'a nw' : 'a'} lang="ar">{children}</bdi>
}

const latinLine = (s: string) => (s.match(/[A-Za-z]/g)?.length ?? 0) > (s.match(/[؀-ۿ]/g)?.length ?? 0)

/** Mixed English–Arabic text: every Arabic run in a top-level string child becomes a <bdi class="a" lang="ar">.
 *  In the Arabic UI it is the other way round: every Latin run becomes a <bdi> so it reads LTR inside the RTL line, and digits are Arabic-Indic. */
export function T({ children }: { children: ReactNode }) {
  return (
    <>
      {Children.map(children, (c) =>
        typeof c !== 'string' ? c
          // an untranslated English line (more Latin than Arabic letters) stays one LTR line with Arabic islands
          : isAr && latinLine(c) ? <bdi dir="ltr">{splitBidi(carryMarks(arRefs(c))).map((p, i) => (p.ar ? <Bdi key={i}>{p.text}</Bdi> : p.text))}</bdi>
          : isAr ? splitLatin(digits(carryMarks(arRefs(c)))).map((p, i) => (p.latin ? <bdi key={i} dir="ltr">{p.text}</bdi> : p.text))
          : splitBidi(carryMarks(arRefs(c))).map((p, i) => (p.ar ? <Bdi key={i}>{p.text}</Bdi> : p.text)),
      )}
    </>
  )
}

/** Arabic-forward label: Arabic name first, small English gloss beneath (design §2.1). */
export function ArLabel({ ar, en, size = 'sm' }: { ar: string; en?: string; size?: 'sm' | 'lg' | 'h2' }) {
  return (
    <span className={`arlabel arlabel-${size}`}>
      <span lang="ar" dir="rtl">{ar}</span>
      {en && !isAr && <small>{en}</small>}

    </span>
  )
}

/** A content line: an all-Arabic line (an example like ٱدْعُ ← اُدْعُ) is its own RTL block so it reads one way (M3);
 *  mixed lines go through <T>. */
export function Line({ text }: { text: string }) {
  const t = isAr ? digits(carryMarks(arRefs(text))) : carryMarks(arRefs(text)) // Arabic UI: Arabic-Indic digits in content
  return isArabicLine(t) ? <span className="ar-line" lang="ar" dir="rtl">{t}</span> : <span><T>{t}</T></span> // one element: safe in grid/flex parents (UX B1)
}
