import type { ReactNode } from 'react'
import type { ScreenProps } from '../app/App'
import { RECITERS } from '../quran'
import { Bdi, T } from '../components'
import './library.css'

// Carried over from docs/reference/artifact-v3.html (Resources), plus Credits (licence requirement, spec §8.2).
const yt = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
const EPISODES = ['exqxpd33s1Q', 'mgKuf7JMYQg', 'P9gOC0jKqpU', 'VKxwdOPBLt4', 'hp-GlZQhBEk', 'Th6uDpvHxrQ']
const CC_BY = 'https://creativecommons.org/licenses/by/4.0/'

const Ext = ({ to, children }: { to: string; children: ReactNode }) => <a href={to} target="_blank" rel="noopener">{children}</a>

function Panel({ ar, en, children }: { ar: string; en: string; children: ReactNode }) {
  return (
    <section className="card card-e1 res-panel">
      <h2 className="res-h"><span lang="ar">{ar}</span> <small>{en}</small></h2>
      <ul>{children}</ul>
    </section>
  )
}

function Item({ title, children, extra }: { title: ReactNode; children: ReactNode; extra?: ReactNode }) {
  return (
    <li>
      <b>{title}</b>
      <span className="muted"><T>{children}</T></span>
      {extra}
    </li>
  )
}

export default function Resources(_: ScreenProps) {
  return (
    <div className="res">
      <Panel ar="الاستماع والترديد" en="Listen & repeat">
        <Item title={<Ext to={yt('الحصري المصحف المعلم')}><Bdi>المصحف المعلم · الحصري</Bdi></Ext>}>He reads, pauses, and you repeat. The best daily model.</Item>
        <Item title={<Ext to={yt('المنشاوي المصحف المعلم مع الأطفال')}><Bdi>المصحف المعلم · المنشاوي مع الأطفال</Bdi></Ext>}>Children repeat after him, so you hear common mistakes being corrected.</Item>
        <Item title={<Ext to="https://quran.com">Quran.com</Ext>}>Ayah audio and word-by-word playback. The player links there for every passage.</Item>
      </Panel>

      <Panel ar="الشرح" en="Explanations">
        <Item
          title={<Ext to="https://www.youtube.com/playlist?list=PL1i_D1Vw3d5PrPubon8D1z9Cl3Hl8jJsX"><Bdi>تعلم التجويد بطريقة عملية مبسطة · م. علاء حامد</Bdi></Ext>}
          extra={
            <span className="eps">
              {EPISODES.map((id, i) => (
                <a key={id} href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener" aria-label={`Episode ${i + 1}`} lang="ar">
                  {'١٢٣٤٥٦'[i]}
                </a>
              ))}
            </span>
          }
        >
          Your intro course: 6 short practical lessons. Watch one a day in Phase 1, then read the cards it covered on the mind map.
        </Item>
        <Item title={<Ext to={yt('أيمن سويد التجويد المصور')}><Bdi>التجويد المصور · د. أيمن سويد</Bdi></Ext>}>The most detailed visual explanation of المخارج والصفات. Use it in Phase 2.</Item>
      </Panel>

      <Panel ar="متون للحفظ" en="Texts to memorise">
        <Item title={<Bdi>تحفة الأطفال · الجمزوري</Bdi>}>61 lines on <Bdi>النون والميم واللام والمد</Bdi>. Memorise in Phases 3–4.</Item>
        <Item title={<Bdi>المقدمة الجزرية · ابن الجزري</Bdi>}>107 lines on المخارج, الصفات and all the rules. The standard text for mastery.</Item>
      </Panel>

      <Panel ar="كتب وأدوات" en="Books & tools">
        <Item title={<Bdi>مصحف التجويد الملوّن · دار المعرفة</Bdi>}>The colours in this app follow its scheme, so your eye learns both at once.</Item>
        <Item title={<Bdi>القاعدة النورانية</Bdi>}>Only if reading letters and vowels is still slow. Finish it before Phase 2.</Item>
        <Item title="Tajweed Rules of the Qur'an">Kareema Carol Czerepinski, 3 parts. A clear English textbook with exercises.</Item>
        <Item title={<Ext to="https://www.tarteel.ai">Tarteel</Ext>}>Listens while you recite and flags missed or wrong words. It cannot judge fine tajweed; a teacher still can.</Item>
      </Panel>

      <section className="card card-e1 res-panel res-credits" aria-labelledby="credits">
        <h2 id="credits" className="res-h"><span lang="ar">شكر وإسناد</span> <small>Credits</small></h2>
        <ul>
          <li>
            <b>Quran text</b>
            <span className="muted">Uthmani text from the <Ext to="https://tanzil.net">Tanzil Quran Text</Ext> (Tanzil Project, <Ext to="https://tanzil.net">tanzil.net</Ext>), copied verbatim and unchanged.</span>
          </li>
          <li>
            <b>Tajweed colours</b>
            <span className="muted">
              <Ext to="https://github.com/cpfair/quran-tajweed">quran-tajweed</Ext> by Collin Fair, licensed <Ext to={CC_BY}>CC BY 4.0</Ext>. Converted to per-ayah spans; colours mapped to the muṣḥaf palette.
            </span>
          </li>
          <li>
            <b>Word timings</b>
            <span className="muted">
              <Ext to="https://github.com/cpfair/quran-align">quran-align</Ext> by Collin Fair, licensed <Ext to={CC_BY}>CC BY 4.0</Ext>. Used to light the current word and play single words.
            </span>
          </li>
          <li>
            <b>Recitation audio</b>
            <span className="muted">Streamed from <Ext to="https://everyayah.com">everyayah.com</Ext>. Reciters:</span>
            <ul className="res-sub">
              {RECITERS.map((r) => <li key={r.id}><bdi lang="ar" className="a">{r.nameAr}</bdi> · {r.nameEn}</li>)}
            </ul>
          </li>
          <li>
            <b>Mutun editions</b>
            <ul className="res-sub">
              <li><T>تحفة الأطفال · سليمان الجمزوري, with the notes of علي محمد الضباع.</T> <Ext to="https://shamela.ws/book/9632">Shamela 9632</Ext></li>
              <li><T>المقدمة الجزرية · ابن الجزري, ed. عبد المحسن القاسم, 2nd ed. 1441/2020.</T> <Ext to="https://shamela.ws/book/581">Shamela 581</Ext></li>
            </ul>
            <span className="muted t-sm">The classical texts are in the public domain; the vowelling and notes belong to their editors.</span>
          </li>
        </ul>
      </section>
    </div>
  )
}
