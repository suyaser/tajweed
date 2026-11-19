// #/guide: how the app and the plan work, any time.
import { Basics, FullGuide } from './guide/content'
import './study.css'

export default function Guide() {
  return (
    <div className="g-page">
      <p className="muted">The short version:</p>
      <Basics />
      <FullGuide />
    </div>
  )
}
