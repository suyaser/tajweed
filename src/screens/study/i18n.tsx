// Study/Path screens' i18n helpers on top of src/i18n: Arabic plurals and mixed-text rendering.
import { AR, digits, isAr, t } from '../../i18n'
import { Fragment } from 'react'
import { T } from '../../components'
import { carryMarks } from '../../components/bidi'

type Vars = Record<string, string | number>

/**
 * A counted phrase. English: `one` for 1, else `other`. Arabic: `other`'s value may hold the forms
 * 'two|few|many|other' (2 · 0 and 3–10 · 11–99 · 100+, by Intl.PluralRules), with `one`'s value for 1, or
 * 'one|two|few|many|other' when both keys are the same string; a single form serves every count.
 */
export function tn(one: string, other: string, n: number, vars?: Vars): string {
  const v: Vars = { n, ...vars }
  if (!isAr || (n === 1 && one !== other)) return t(n === 1 ? one : other, v)
  const forms = (AR[other] ?? other).split('|')
  const cat = ({ one: 0, two: 1, zero: 2, few: 2, many: 3 } as Record<string, number>)[new Intl.PluralRules('ar').select(n)] ?? 4
  const s = forms.length === 5 ? forms[cat] : forms.length === 4 ? forms[Math.max(0, cat - 1)] : forms[0]
  return Object.entries(v).reduce((acc, [k, x]) => acc.split(`{${k}}`).join(typeof x === 'number' ? digits(x) : x), s)
}

/**
 * Mixed English–Arabic content text: <T> islands in English; in Arabic the line is already Arabic (digits made
 * Arabic-Indic), and a Latin-led one is isolated. Short bracketed groups never break across lines.
 */
export function Tx({ children }: { children: string }) {
  const parts = children.split(/(\([^()]{1,24}\))/)
  // a lone mark (the شدة in "(ّ)") sits on a tatweel, or it renders as a box (T does the same in English)
  const one = (s: string) => (isAr ? digits(carryMarks(s)) : <T>{s}</T>)
  const body = parts.length === 1 ? one(children)
    : parts.map((s, i) => (i % 2 ? <span key={i} className="whitespace-nowrap">{one(s)}</span> : <Fragment key={i}>{one(s)}</Fragment>))
  return isAr && /[A-Za-z]/.test(children) ? <bdi>{body}</bdi> : <>{body}</>
}
