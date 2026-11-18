import { useState, type ReactNode } from 'react'
import type { ColourKey } from '../core/types'
import {
  AudioTransport, Band, Button, Card, CorrectionBadge, CorrectionTag, CountBeats, EmptyState, Legend, LetterTiles,
  LevelBadge, Nudge, OptionButton, Ornament, OrnHeading, Passage, ProgressDots, RecordButton, RuleChip, RuleRow,
  SegmentedControl, Sheet, StarBadge, T, VerseBlock, ArLabel, type RecordState, type TajweedSegment,
} from '../components'

// Dev-only (#/dev/components): every component, light and dark side by side, real Arabic.

const BAQARAH_4: TajweedSegment[] = [
  { text: 'وَمَ' }, { text: 'آ', colour: 'madd45' }, { text: ' أُ' }, { text: 'ن', colour: 'ghunnah' },
  { text: 'زِلَ مِ' }, { text: 'ن', colour: 'ghunnah' }, { text: ' قَ' }, { text: 'بْ', colour: 'qalqalah' }, { text: 'لِكَ' },
]
const DUHA = [
  { key: '93:1', n: 1, text: 'وَٱلضُّحَىٰ' },
  { key: '93:2', n: 2, text: 'وَٱلَّيْلِ إِذَا سَجَىٰ' },
  { key: '93:3', n: 3, text: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ' },
]
const LEGEND: ColourKey[] = ['clear', 'ghunnah', 'silent', 'merge', 'madd2', 'madd45', 'madd246', 'madd6', 'qalqalah', 'heavy', 'light']

function Sec({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="gal-sec">
      <h3 className="eyebrow">{title}</h3>
      <div className="gal-body">{children}</div>
    </section>
  )
}

function Demo({ theme }: { theme: 'light' | 'dark' }) {
  const [isolate, setIsolate] = useState<ColourKey | null>(null)
  const [seg, setSeg] = useState<'plan' | 'progress'>('plan')
  const [sheet, setSheet] = useState(false)
  const [tapped, setTapped] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [loop, setLoop] = useState(1)
  const [rate, setRate] = useState(1)
  const [gap, setGap] = useState(true)
  const [ayah, setAyah] = useState(1)
  const [rec, setRec] = useState<RecordState>('idle')
  const [opt, setOpt] = useState<number | null>(null)

  return (
    <div className={`gal-panel theme-${theme}`}>
      <h2 className="t-h2">{theme === 'light' ? 'Light' : 'Dark'}</h2>

      <Sec title="Band · lattice">
        <Band>
          <span className="k-h2" lang="ar" style={{ color: 'var(--gold-display)' }}>مسار التجويد</span>
        </Band>
      </Sec>

      <Sec title="T · mixed text (B1/B2)">
        <p><T>The نْ is followed by ت, one of the fifteen letters of إخفاء, so hide it with غنة for 2 counts.</T></p>
        <p className="t-sm muted"><T>Small text: النون الساكنة والتنوين · then إدغام.</T></p>
        <ArLabel ar="الأحكام" en="Rules" />
      </Sec>

      <Sec title="VerseBlock · tajweed colours, isolate via legend">
        <VerseBlock segments={BAQARAH_4} reference="البقرة · ٤" size="read" isolate={isolate} actions={<button className="icon-btn" aria-label="Play البقرة ٤">▶</button>} />
        <Legend colours={LEGEND} isolate={isolate} onIsolate={setIsolate} notShown={['مد البدل', 'السكت']} />
      </Sec>

      <Sec title="VerseBlock · question underline (neutral), stopping tag">
        <Card level="e2">
          <p>Which rule is the underlined part?</p>
          <VerseBlock text="إِنَّ ٱلْإِنسَٰنَ لَفِى خُسْرٍ" focus={[2, 2]} reference="العصر · ٢" size="focus" stopping />
        </Card>
      </Sec>

      <Sec title="VerseBlock · tap a word (ring), roving keys ← →">
        <VerseBlock
          text="مِن شَرِّ مَا خَلَقَ"
          reference="الفلق · ٢"
          marks={tapped ? { [tapped]: 'ring' } : undefined}
          onWord={(n) => setTapped(n)}
        />
      </Sec>

      <Sec title="Passage · current ayah + word lamp, ayah-end markers">
        <Passage ayahs={DUHA} currentAyah={`93:${ayah}`} current={{ key: `93:${ayah}`, word: 1 }} onAyah={(k) => setAyah(+k.split(':')[1])} onWord={() => {}} />
        <Passage ayahs={DUHA.slice(1, 2)} size="inline" marks={{ '93:2/1': 'found', '93:2/2': 'missed', '93:2/3': 'wrong' }} />
      </Sec>

      <Sec title="AudioTransport">
        <AudioTransport
          playing={playing} label={`الضحى · ${'١٢٣'[ayah - 1]}`} speaker="الحصري المعلّم" loop={loop} rate={rate} gap={gap}
          ayahCount={11} ayahIndex={ayah - 1} yourTurn={playing && gap ? 4 : null}
          onPlayPause={() => setPlaying(!playing)} onPrev={() => setAyah(Math.max(1, ayah - 1))} onNext={() => setAyah(Math.min(3, ayah + 1))}
          onLoop={() => setLoop(({ 1: 3, 3: 5, 5: 10, 10: 1 } as Record<number, number>)[loop])} onRate={() => setRate(rate === 1 ? 0.75 : 1)} onGap={() => setGap(!gap)}
          onSeekAyah={(i) => setAyah(Math.min(3, i + 1))}
        />
        <AudioTransport playing={false} label="الضحى · ١" unavailable="Audio needs a connection. The text is here; recording still works." loop={1} rate={1} gap={false}
          onPlayPause={() => {}} onPrev={() => {}} onNext={() => {}} onLoop={() => {}} onRate={() => {}} onGap={() => {}} />
      </Sec>

      <Sec title="RecordButton">
        <RecordButton state={rec} seconds={rec === 'recording' ? 12 : 42} onClick={() => setRec(rec === 'recording' ? 'saved' : 'recording')} />
        <RecordButton state="off" onClick={() => {}} offReason="Recording is off. You can turn the microphone on in your browser's site settings." />
      </Sec>

      <Sec title="Buttons · OptionButton">
        <div className="gal-row">
          <Button>Start lesson</Button>
          <Button variant="secondary">Model, then me</Button>
          <Button variant="ghost">Not today</Button>
          <Button variant="danger">Reset everything</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="opts">
          {[['الإخفاء الحقيقي', 'Hidden noon'], ['الإظهار الحلقي', 'Clear noon'], ['الإدغام بغنة', 'Merge with ghunnah'], ['الإقلاب', 'Conversion']].map(([ar, en], i) => (
            <OptionButton key={i} ar={ar} en={en} disabled={opt != null}
              state={opt == null ? 'idle' : i === 0 ? (opt === 0 ? 'correct' : 'revealed') : i === opt ? 'wrong' : 'idle'}
              onClick={() => setOpt(i)} />
          ))}
        </div>
        {opt != null && <Button variant="ghost" onClick={() => setOpt(null)}>Reset</Button>}
      </Sec>

      <Sec title="SegmentedControl">
        <SegmentedControl label="Path" value={seg} onChange={setSeg} options={[{ value: 'plan', label: 'Plan' }, { value: 'progress', label: 'Progress' }]} />
      </Sec>

      <Sec title="RuleChip · RuleRow · LevelBadge · CorrectionTag">
        <div className="gal-row">
          <RuleChip nameAr="الإخفاء" colour="ghunnah" level="learning" onClick={() => {}} />
          <RuleChip nameAr="المد المتصل" colour="madd45" href="#/rules/muttasil" />
          <RuleChip nameAr="Other" />
        </div>
        <div className="rrows">
          <RuleRow nameAr="الإظهار الحلقي" nameEn="Clear noon before a throat letter" colour="clear" level="known" href="#/rules/izhar" />
          <RuleRow nameAr="الإدغام بغنة" nameEn="Merge with ghunnah" colour="merge" level="learning" correctionOpen href="#/rules/idgham" />
          <RuleRow nameAr="المثلان والمتجانسان والمتقاربان" nameEn="Like, related and near letters" colour="madd246" level="not-started" href="#/rules/x" />
        </div>
        <div className="gal-row">
          <LevelBadge level="not-started" /><LevelBadge level="learning" /><LevelBadge level="known" /><LevelBadge level="strong" detail="every 14 days" />
        </div>
        <div className="gal-row">
          <CorrectionTag severity="jali" gloss /><CorrectionTag severity="khafi" gloss /><CorrectionTag severity="jali" count={2} /><CorrectionBadge />
        </div>
      </Sec>

      <Sec title="LetterTiles · CountBeats">
        <LetterTiles letters="ص ذ ث ك ج ش ق س د ط ز ف ت ض ظ" colour="ghunnah" />
        <LetterTiles letters="ق ط ب ج د" size="option" />
        <div className="gal-row">
          <CountBeats min={2} colour="madd2" /> <CountBeats min={4} max={5} colour="madd45" /> <CountBeats min={2} max={6} colour="madd246" /> <CountBeats min={6} colour="madd6" />
        </div>
      </Sec>

      <Sec title="StarBadge · Ornament · ProgressDots">
        <div className="gal-row">
          <StarBadge n={1} size={32} /><StarBadge n={2} /><StarBadge n={3} size={52} state="done" /><StarBadge n={4} size={60} state="locked" />
        </div>
        <Ornament />
        <OrnHeading><T>الورد · Your wird, ~40′</T></OrnHeading>
        <ProgressDots days={['studied', 'studied', 'studied', 'not', 'studied', 'future', 'future']} today={4} />
      </Sec>

      <Sec title="Card · EmptyState · Nudge · Sheet">
        <Card stripe="ghunnah" eyebrow="غنة · إخفاء">
          <h3 className="a-h3" lang="ar" style={{ color: 'var(--t-ghunnah)' }}>الإخفاء الحقيقي</h3>
          <p className="muted t-sm">Hidden noon</p>
        </Card>
        <EmptyState title="Nothing due today." action={<Button variant="secondary">Back to today</Button>}>
          Your next review is on Saturday.
        </EmptyState>
        <Nudge action={<Button variant="ghost">How</Button>} onDismiss={() => {}}>
          Install to home screen so your data is kept.
        </Nudge>
        <Button variant="secondary" onClick={() => setSheet(true)}>Open sheet</Button>
        <Sheet open={sheet} onClose={() => setSheet(false)} title={<T>ٱلضَّآلِّينَ · الفاتحة · ٧</T>}>
          <div className="gal-row">
            <Button variant="primary">■ جلي clear error</Button>
            <Button variant="secondary">□ خفي fine detail</Button>
          </div>
          <Button block onClick={() => setSheet(false)}>Save</Button>
        </Sheet>
      </Sec>
    </div>
  )
}

export default function DevGallery() {
  const [patterns, setPatterns] = useState(false)
  return (
    <div className="gallery">
      <label className="gal-row">
        <input type="checkbox" checked={patterns} onChange={(e) => {
          setPatterns(e.target.checked)
          document.documentElement.classList.toggle('tj-patterns', e.target.checked)
        }} />
        Tajweed patterns (second cue, §7.4)
      </label>
      <div className="gal-cols">
        <Demo theme="light" />
        <Demo theme="dark" />
      </div>
    </div>
  )
}
