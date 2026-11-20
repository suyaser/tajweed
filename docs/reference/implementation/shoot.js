const { chromium } = require('playwright')
const BASE = 'http://localhost:4318/'
const OUT = process.argv[2]
const ORDER = ['basics','istiadha','tabii','arid','iwad','tafkhim','ibtida','lam-q','lam-s','lam-jh','lam-jl','ghunnah','izhar','idgh-g','idgh-n','iqlab']
const PHONE = { width: 390, height: 844 }, DESK = { width: 1440, height: 900 }
const w = ms => new Promise(r => setTimeout(r, ms))

async function seeded(browser, lang, viewport, dark = false) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: 'light', serviceWorkers: 'block' })
  const page = await ctx.newPage()
  await page.goto(BASE + '#/onboarding')
  await page.evaluate(l => localStorage.setItem('tajweed-path:lang', l), lang)
  await page.reload(); await w(800)
  const btn = t => page.locator('button', { hasText: t }).first()
  await btn(lang === 'ar' ? 'ابدأ' : 'Begin').click(); await w(300)
  await btn(lang === 'ar' ? 'أقرؤه' : 'Yes, I read it').click()
  await btn(lang === 'ar' ? 'التالي' : 'Next').click(); await w(300)
  await btn(lang === 'ar' ? 'ابدأ الدرس' : 'Start lesson 1').click(); await w(500)
  await page.evaluate(({ order, dark }) => {
    const d = JSON.parse(localStorage.getItem('tajweed-path:v1'))
    const day = i => `2026-11-${String(19 - Math.floor((order.length - 1 - i) / 2)).padStart(2, '0')}`
    d.introductions = order.map((id, i) => ({ lessonId: id, on: day(i), at: `${day(i)}T08:00:00.000Z` }))
    d.finales = [{ unitId: 'u0', on: '2026-11-01' }, { unitId: 'u1', on: '2026-11-07' }]
    if (dark) d.settings.theme = 'dark'
    localStorage.setItem('tajweed-path:v1', JSON.stringify(d))
    localStorage.removeItem('tajweed-path:routine-card')
  }, { order: ORDER, dark })
  return { ctx, page }
}

async function shot(page, hash, name, { step, prep } = {}) {
  if (step) await page.evaluate(s => {
    const all = ['hear','notice','learn','say','find','check','recite']
    const done = all.slice(0, all.indexOf(s))
    localStorage.setItem('tajweed-path:lesson-steps', JSON.stringify({ ikhfa: { done, visited: [...done, s], current: s, on: '2026-11-20', find: true } }))
  }, step)
  await page.goto(BASE + hash); await page.reload(); await w(2500)
  if (prep) await prep(page)
  // grow the window to the whole page, so fixed bars sit at the bottom as in a real full-length screen
  const vp = page.viewportSize(), h = await page.evaluate(() => document.documentElement.scrollHeight)
  await page.setViewportSize({ width: vp.width, height: Math.max(vp.height, h) }); await w(400)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  await page.setViewportSize(vp)
  console.log('shot', name)
}

;(async () => {
  const b = await chromium.launch()
  // welcome: fresh, English
  { const ctx = await b.newContext({ viewport: PHONE, deviceScaleFactor: 2, colorScheme: 'light', serviceWorkers: 'block' }); const p = await ctx.newPage()
    await p.goto(BASE + '#/onboarding'); await p.evaluate(() => localStorage.setItem('tajweed-path:lang', 'en')); await p.reload(); await w(2500)
    await p.setViewportSize({ width: 390, height: await p.evaluate(() => document.documentElement.scrollHeight) }); await w(300); await p.screenshot({ path: `${OUT}/welcome.png`, fullPage: true }); console.log('shot welcome'); await ctx.close() }
  for (const [lang, vp, sfx, dark] of [['en', PHONE, ''], ['en', DESK, '_desktop'], ['ar', PHONE, '_rtl'], ['ar', DESK, '_rtl_desktop'], ['en', DESK, '_dark_desktop', true]]) {
    const { ctx, page } = await seeded(b, lang, vp, dark)
    if (sfx === '_dark_desktop') {
      await shot(page, '#/learn/ikhfa', 'lesson_say_desktop_dark', { step: 'say' })
      await shot(page, '#/learn/ikhfa', 'lesson_learn_desktop_dark', { step: 'learn' })
      await shot(page, '#/rules/ikhfa', 'rules_rule_card_desktop_dark')
      await ctx.close()
      continue
    }
    await shot(page, '#/today', 'today' + sfx)
    if (sfx === '') {
      await shot(page, '#/plan', 'path')
      await shot(page, '#/settings', 'settings')
      for (const s of ['hear', 'learn', 'say', 'find', 'recite']) await shot(page, '#/learn/ikhfa', 'lesson_' + s, { step: s })
    }
    if (sfx === '_desktop') {
      await shot(page, '#/plan', 'course_map_desktop')
      await shot(page, '#/learn/ikhfa', 'lesson_say_desktop', { step: 'say' })
      await shot(page, '#/learn/ikhfa', 'lesson_learn_desktop', { step: 'learn' })
      await shot(page, '#/rules/ikhfa', 'rules_rule_card_desktop')
      await shot(page, '#/rules', 'rules_desktop')
    }
    if (sfx === '_rtl_desktop') {
      await shot(page, '#/learn/ikhfa', 'lesson_say_desktop_rtl', { step: 'say' })
      await shot(page, '#/learn/ikhfa', 'lesson_learn_desktop_rtl', { step: 'learn' })
      await shot(page, '#/rules/ikhfa', 'rules_rule_card_desktop_rtl')
    }
    await ctx.close()
  }
  await b.close()
})().catch(e => { console.error(e); process.exit(1) })
