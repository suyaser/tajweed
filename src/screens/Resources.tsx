import type { ReactNode } from 'react'
import type { ScreenProps } from '../app/App'
import { RECITERS } from '../quran'
import { Bdi, Group, T } from '../components'
import { isAr, t } from '../i18n'
import { Page, Sep } from '@/components/kit'
import { Icon } from '@/components/ui/icon'

// Carried over from docs/reference/artifact-v3.html (Resources), plus Credits (licence requirement, spec §8.2).
const yt = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
const EPISODES = ['exqxpd33s1Q', 'mgKuf7JMYQg', 'P9gOC0jKqpU', 'VKxwdOPBLt4', 'hp-GlZQhBEk', 'Th6uDpvHxrQ']
const CC_BY = 'https://creativecommons.org/licenses/by/4.0/'

/** Every outside link looks the same: teal, underlined, with the "opens elsewhere" icon. */
const Ext = ({ to, children }: { to: string; children: ReactNode }) => (
  <a href={to} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-4">
    {children}<Icon name="open_in_new" size={16} />
  </a>
)

function Panel({ ar, en, children }: { ar: string; en: string; children: ReactNode }) {
  return (
    <Group en={en} ar={ar}>
      <ul className="flex flex-col divide-y divide-outline-variant">{children}</ul>
    </Group>
  )
}

function Item({ icon, title, children, extra }: { icon: string; title: ReactNode; children: ReactNode; extra?: ReactNode }) {
  return (
    <li className="flex items-start gap-space-md p-space-md">
      <span className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-container text-on-surface-variant"><Icon name={icon} size={22} /></span>
      <div className="flex min-w-0 flex-col gap-1">
        <b className="text-body-lg font-semibold">{title}</b>
        <span className="text-body-md text-on-surface-variant"><T>{children}</T></span>
        {extra}
      </div>
    </li>
  )
}

export default function Resources(_: ScreenProps) {
  return (
    <Page>
      <Panel ar="الاستماع والترديد" en="Listen & repeat">
        <Item icon="headphones" title={<Ext to={yt('الحصري المصحف المعلم')}><Bdi>المصحف المعلم، الحصري</Bdi></Ext>}>{t('He reads, pauses, and you repeat. The best daily model.')}</Item>
        <Item icon="headphones" title={<Ext to={yt('المنشاوي المصحف المعلم مع الأطفال')}><Bdi>المصحف المعلم، المنشاوي مع الأطفال</Bdi></Ext>}>{t('Children repeat after him, so you hear common mistakes being corrected.')}</Item>
        <Item icon="public" title={<Ext to="https://quran.com">Quran.com</Ext>}>{t('Ayah audio and word-by-word playback. The player links there for every passage.')}</Item>
      </Panel>

      <Panel ar="الشرح" en="Explanations">
        <Item
          icon="smart_display"
          title={<Ext to="https://www.youtube.com/playlist?list=PL1i_D1Vw3d5PrPubon8D1z9Cl3Hl8jJsX"><Bdi>تعلم التجويد بطريقة عملية مبسطة، م. علاء حامد</Bdi></Ext>}
          extra={
            <span className="flex flex-wrap gap-space-xs pt-1">
              {EPISODES.map((id, i) => (
                <a key={id} href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener" aria-label={t('Episode {n}', { n: i + 1 })} lang="ar"
                  className="grid size-11 place-items-center rounded-full bg-surface-container text-arabic-body font-semibold text-primary no-underline hover:bg-primary-container">
                  {'١٢٣٤٥٦'[i]}
                </a>
              ))}
            </span>
          }
        >
          {t('Your intro course: 6 short practical lessons. The course units follow its surahs; watch an episode alongside each unit.')}
        </Item>
        <Item icon="smart_display" title={<Ext to={yt('أيمن سويد التجويد المصور')}><Bdi>التجويد المصور، د. أيمن سويد</Bdi></Ext>}>{t('The most detailed visual explanation of المخارج والصفات. Use it with unit 9.')}</Item>
      </Panel>

      <Panel ar="متون للحفظ" en="Texts to memorise">
        <Item icon="history_edu" title={<Bdi>تحفة الأطفال، الجمزوري</Bdi>}>{t('61 lines on النون والميم واللام والمد. The unit pages show the lines that match each unit.')}</Item>
        <Item icon="history_edu" title={<Bdi>المقدمة الجزرية، ابن الجزري</Bdi>}>{t('107 lines on المخارج, الصفات and all the rules. The standard text for mastery.')}</Item>
      </Panel>

      <Panel ar="كتب وأدوات" en="Books & tools">
        <Item icon="menu_book" title={<Bdi>مصحف التجويد الملوّن، دار المعرفة</Bdi>}>{t('The colours in this app follow its scheme, so your eye learns both at once.')}</Item>
        <Item icon="menu_book" title={<Bdi>القاعدة النورانية</Bdi>}>{t('Only if reading letters and vowels is still slow. Use it alongside the first units.')}</Item>
        <Item icon="menu_book" title={<bdi dir="ltr">Tajweed Rules of the Qur'an</bdi>}>{t('Kareema Carol Czerepinski, 3 parts. A clear English textbook with exercises.')}</Item>
        <Item icon="mic" title={<Ext to="https://www.tarteel.ai">Tarteel</Ext>}>{t('Listens while you recite and flags missed or wrong words. It cannot judge fine tajweed; a teacher still can.')}</Item>
      </Panel>

      <section aria-labelledby="credits" className="flex flex-col gap-space-sm">
        <h2 id="credits" className="flex items-baseline justify-between gap-space-sm px-space-xs">
          <span className="text-label font-semibold tracking-wider text-on-surface-variant uppercase rtl:normal-case">{isAr ? 'شكر وإسناد' : 'Credits'}</span>
          {!isAr && <span lang="ar" dir="rtl" className="text-arabic-label text-secondary">شكر وإسناد</span>}
        </h2>
        <dl className="flex flex-col divide-y divide-outline-variant rounded-card border border-outline-variant bg-surface-container-lowest text-body-md">
          <Credit title={t('Quran text')}>
            {isAr
              ? <>النص العثماني من <Ext to="https://tanzil.net"><bdi dir="ltr">Tanzil Quran Text</bdi></Ext> (مشروع تنزيل، <Ext to="https://tanzil.net">tanzil.net</Ext>)، منقولًا بحرفه دون تغيير.</>
              : <>Uthmani text from the <Ext to="https://tanzil.net">Tanzil Quran Text</Ext> (Tanzil Project, <Ext to="https://tanzil.net">tanzil.net</Ext>), copied verbatim and unchanged.</>}
          </Credit>
          <Credit title={t('Tajweed colours')}>
            {isAr
              ? <><Ext to="https://github.com/cpfair/quran-tajweed">quran-tajweed</Ext> من إعداد <bdi dir="ltr">Collin Fair</bdi>، بترخيص <Ext to={CC_BY}><bdi dir="ltr">CC BY 4.0</bdi></Ext>. حُوِّل إلى مقاطع لكل آية، ورُبطت ألوانه بألوان المصحف.</>
              : <><Ext to="https://github.com/cpfair/quran-tajweed">quran-tajweed</Ext> by Collin Fair, licensed <Ext to={CC_BY}>CC BY 4.0</Ext>. Converted to per-ayah spans; colours mapped to the muṣḥaf palette.</>}
          </Credit>
          <Credit title={t('Word timings')}>
            {isAr
              ? <><Ext to="https://github.com/cpfair/quran-align">quran-align</Ext> من إعداد <bdi dir="ltr">Collin Fair</bdi>، بترخيص <Ext to={CC_BY}><bdi dir="ltr">CC BY 4.0</bdi></Ext>. يُستخدم لإضاءة الكلمة الحالية وتشغيل الكلمات منفردة.</>
              : <><Ext to="https://github.com/cpfair/quran-align">quran-align</Ext> by Collin Fair, licensed <Ext to={CC_BY}>CC BY 4.0</Ext>. Used to light the current word and play single words.</>}
          </Credit>
          <Credit title={t('Recitation audio')}>
            {isAr ? <>تُبَثّ من <Ext to="https://everyayah.com">everyayah.com</Ext>. القرّاء:</> : <>Streamed from <Ext to="https://everyayah.com">everyayah.com</Ext>. Reciters:</>}
            <ul className="mt-1 list-disc ps-5">
              {RECITERS.map((r) => <li key={r.id}><bdi lang="ar" className="font-arabic">{r.nameAr}</bdi>{!isAr && <><Sep />{r.nameEn}</>}</li>)}
            </ul>
          </Credit>
          <Credit title={t('Mutun editions')}>
            <ul className="list-disc ps-5">
              <li><T>{t('تحفة الأطفال · سليمان الجمزوري, with the notes of علي محمد الضباع.')}</T> <Ext to="https://shamela.ws/book/9632">{t('Shamela 9632')}</Ext></li>
              <li><T>{t('المقدمة الجزرية · ابن الجزري, ed. عبد المحسن القاسم, 2nd ed. 1441/2020.')}</T> <Ext to="https://shamela.ws/book/581">{t('Shamela 581')}</Ext></li>
            </ul>
            <p className="mt-1">{t('The classical texts are in the public domain; the vowelling and notes belong to their editors.')}</p>
          </Credit>
        </dl>
      </section>
    </Page>
  )
}

function Credit({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 p-space-md">
      <dt className="font-semibold text-on-surface">{title}</dt>
      <dd className="text-on-surface-variant">{children}</dd>
    </div>
  )
}
