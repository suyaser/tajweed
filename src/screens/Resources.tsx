import type { ReactNode } from 'react'
import type { ScreenProps } from '../app/App'
import { RECITERS } from '../quran'
import { Bdi, T } from '../components'
import './library.css'
import { isAr, t } from '../i18n'

// Carried over from docs/reference/artifact-v3.html (Resources), plus Credits (licence requirement, spec §8.2).
const yt = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
const EPISODES = ['exqxpd33s1Q', 'mgKuf7JMYQg', 'P9gOC0jKqpU', 'VKxwdOPBLt4', 'hp-GlZQhBEk', 'Th6uDpvHxrQ']
const CC_BY = 'https://creativecommons.org/licenses/by/4.0/'

const Ext = ({ to, children }: { to: string; children: ReactNode }) => <a href={to} target="_blank" rel="noopener">{children}</a>

function Panel({ ar, en, children }: { ar: string; en: string; children: ReactNode }) {
  return (
    <section className="card card-e1 res-panel">
      <h2 className="res-h"><span lang="ar">{ar}</span>{!isAr && <> <small>{en}</small></>}</h2>
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
        <Item title={<Ext to={yt('الحصري المصحف المعلم')}><Bdi>المصحف المعلم · الحصري</Bdi></Ext>}>{t('He reads, pauses, and you repeat. The best daily model.')}</Item>
        <Item title={<Ext to={yt('المنشاوي المصحف المعلم مع الأطفال')}><Bdi>المصحف المعلم · المنشاوي مع الأطفال</Bdi></Ext>}>{t('Children repeat after him, so you hear common mistakes being corrected.')}</Item>
        <Item title={<Ext to="https://quran.com">Quran.com</Ext>}>{t('Ayah audio and word-by-word playback. The player links there for every passage.')}</Item>
      </Panel>

      <Panel ar="الشرح" en="Explanations">
        <Item
          title={<Ext to="https://www.youtube.com/playlist?list=PL1i_D1Vw3d5PrPubon8D1z9Cl3Hl8jJsX"><Bdi>تعلم التجويد بطريقة عملية مبسطة · م. علاء حامد</Bdi></Ext>}
          extra={
            <span className="eps">
              {EPISODES.map((id, i) => (
                <a key={id} href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener" aria-label={t('Episode {n}', { n: i + 1 })} lang="ar">
                  {'١٢٣٤٥٦'[i]}
                </a>
              ))}
            </span>
          }
        >
          {t('Your intro course: 6 short practical lessons. The course units follow its surahs; watch an episode alongside each unit.')}
        </Item>
        <Item title={<Ext to={yt('أيمن سويد التجويد المصور')}><Bdi>التجويد المصور · د. أيمن سويد</Bdi></Ext>}>{t('The most detailed visual explanation of المخارج والصفات. Use it with unit 9.')}</Item>
      </Panel>

      <Panel ar="متون للحفظ" en="Texts to memorise">
        <Item title={<Bdi>تحفة الأطفال · الجمزوري</Bdi>}>{t('61 lines on النون والميم واللام والمد. The unit pages show the lines that match each unit.')}</Item>
        <Item title={<Bdi>المقدمة الجزرية · ابن الجزري</Bdi>}>{t('107 lines on المخارج, الصفات and all the rules. The standard text for mastery.')}</Item>
      </Panel>

      <Panel ar="كتب وأدوات" en="Books & tools">
        <Item title={<Bdi>مصحف التجويد الملوّن · دار المعرفة</Bdi>}>{t('The colours in this app follow its scheme, so your eye learns both at once.')}</Item>
        <Item title={<Bdi>القاعدة النورانية</Bdi>}>{t('Only if reading letters and vowels is still slow. Use it alongside the first units.')}</Item>
        <Item title={<bdi dir="ltr">Tajweed Rules of the Qur'an</bdi>}>{t('Kareema Carol Czerepinski, 3 parts. A clear English textbook with exercises.')}</Item>
        <Item title={<Ext to="https://www.tarteel.ai">Tarteel</Ext>}>{t('Listens while you recite and flags missed or wrong words. It cannot judge fine tajweed; a teacher still can.')}</Item>
      </Panel>

      <section className="card card-e1 res-panel res-credits" aria-labelledby="credits">
        <h2 id="credits" className="res-h"><span lang="ar">شكر وإسناد</span> {!isAr && <small>Credits</small>}</h2>
        <ul>
          <li>
            <b>{t('Quran text')}</b>
            {isAr
              ? <span className="muted">النص العثماني من <Ext to="https://tanzil.net"><bdi dir="ltr">Tanzil Quran Text</bdi></Ext> (مشروع تنزيل، <Ext to="https://tanzil.net">tanzil.net</Ext>)، منقولًا بحرفه دون تغيير.</span>
              : <span className="muted">Uthmani text from the <Ext to="https://tanzil.net">Tanzil Quran Text</Ext> (Tanzil Project, <Ext to="https://tanzil.net">tanzil.net</Ext>), copied verbatim and unchanged.</span>}
          </li>
          <li>
            <b>{t('Tajweed colours')}</b>
            {isAr
              ? <span className="muted"><Ext to="https://github.com/cpfair/quran-tajweed">quran-tajweed</Ext> من إعداد <bdi dir="ltr">Collin Fair</bdi>، بترخيص <Ext to={CC_BY}><bdi dir="ltr">CC BY 4.0</bdi></Ext>. حُوِّل إلى مقاطع لكل آية، ورُبطت ألوانه بألوان المصحف.</span>
              : <span className="muted">
              <Ext to="https://github.com/cpfair/quran-tajweed">quran-tajweed</Ext> by Collin Fair, licensed <Ext to={CC_BY}>CC BY 4.0</Ext>. Converted to per-ayah spans; colours mapped to the muṣḥaf palette.
            </span>}
          </li>
          <li>
            <b>{t('Word timings')}</b>
            {isAr
              ? <span className="muted"><Ext to="https://github.com/cpfair/quran-align">quran-align</Ext> من إعداد <bdi dir="ltr">Collin Fair</bdi>، بترخيص <Ext to={CC_BY}><bdi dir="ltr">CC BY 4.0</bdi></Ext>. يُستخدم لإضاءة الكلمة الحالية وتشغيل الكلمات منفردة.</span>
              : <span className="muted">
              <Ext to="https://github.com/cpfair/quran-align">quran-align</Ext> by Collin Fair, licensed <Ext to={CC_BY}>CC BY 4.0</Ext>. Used to light the current word and play single words.
            </span>}
          </li>
          <li>
            <b>{t('Recitation audio')}</b>
            <span className="muted">{isAr ? <>تُبَثّ من <Ext to="https://everyayah.com">everyayah.com</Ext>. القرّاء:</> : <>Streamed from <Ext to="https://everyayah.com">everyayah.com</Ext>. Reciters:</>}</span>
            <ul className="res-sub">
              {RECITERS.map((r) => <li key={r.id}><bdi lang="ar" className="a">{r.nameAr}</bdi>{!isAr && <> · {r.nameEn}</>}</li>)}
            </ul>
          </li>
          <li>
            <b>{t('Mutun editions')}</b>
            <ul className="res-sub">
              <li><T>{t('تحفة الأطفال · سليمان الجمزوري, with the notes of علي محمد الضباع.')}</T> <Ext to="https://shamela.ws/book/9632">{t('Shamela 9632')}</Ext></li>
              <li><T>{t('المقدمة الجزرية · ابن الجزري, ed. عبد المحسن القاسم, 2nd ed. 1441/2020.')}</T> <Ext to="https://shamela.ws/book/581">{t('Shamela 581')}</Ext></li>
            </ul>
            <span className="muted t-sm">{t('The classical texts are in the public domain; the vowelling and notes belong to their editors.')}</span>

          </li>
        </ul>
      </section>
    </div>
  )
}
