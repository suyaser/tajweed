// A one-time explanation at the top of a screen; ✕ hides it for good on this device.
import { useState, type ReactNode } from 'react'
import { Button, Nudge } from '../../components'
import { href } from '../../app/router'
import { today } from '../../core/day'
import { mem, setMem } from './helpers'
import { t } from '../../i18n'

export function Hint({ id, children }: { id: string; children: ReactNode }) {
  const [hidden, setHidden] = useState(() => !!mem().dismissed?.[`hint:${id}`])
  if (hidden) return null
  const hide = () => { setMem({ dismissed: { ...mem().dismissed, [`hint:${id}`]: today() } }); setHidden(true) }
  return <Nudge action={<Button variant="tertiary" size="sm" href={href('guide')}>{t('More')}</Button>} onDismiss={hide}>{children}</Nudge>
}
