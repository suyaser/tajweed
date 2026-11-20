// #/guide: how the app and the plan work, any time.
import { Basics, FullGuide } from './guide/content'
import { t } from '../i18n'

export default function Guide() {
  return (
    <div className="flex flex-col gap-space-lg">
      <section className="flex flex-col gap-space-sm">
        <p className="text-label font-semibold tracking-wider text-secondary uppercase rtl:normal-case">{t('The short version:')}</p>
        <Basics />
      </section>
      <FullGuide />
    </div>
  )
}
