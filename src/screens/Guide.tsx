// #/guide: how the app and the plan work, any time.
import { Basics, FullGuide } from './guide/content'
import { t } from '../i18n'
import './study.css'

export default function Guide() {
  return (
    <div className="g-page">
      <p className="muted">{t('The short version:')}</p>
      <Basics />
      <FullGuide />
    </div>
  )
}
