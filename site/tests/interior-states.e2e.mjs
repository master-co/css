/** Current-page, focus, theme-swap and no-script states shared by the documentation shell. */
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'

const engine = process.env.MASTER_SITE_BROWSER ?? 'chromium'
const base = process.env.MASTER_SITE_URL ?? 'http://127.0.0.1:3218'
let browser
before(async () => { browser = await ({ chromium, webkit })[engine].launch() })
after(async () => { await browser?.close() })

async function open(route, { width = 1440, scheme = 'light', js = true } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, javaScriptEnabled: js, hasTouch: width < 768 })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  assert.equal((await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 })).status(), 200)
  return { context, page, errors }
}

test(`${engine}: only links to the page being read are marked current`, { timeout: 60000 }, async () => {
  for (const [route, current] of [['/guide/installation', 'Installation'], ['/guide/introduction', 'Introduction']]) {
    const { context, page, errors } = await open(route)
    const marked = await page.locator('a[aria-current="page"]').evaluateAll(links => links.map(link => link.getAttribute('href')))
    assert.ok(marked.length > 0)
    assert.ok(marked.every(href => href === route), `${route}: ${marked}`)
    assert.equal(await page.getByRole('link', { name: current, exact: true }).first().getAttribute('aria-current'), 'page')
    assert.deepEqual(errors, [])
    await context.close()
  }
})

test(`${engine}: installation methods share one article and integrations retain their contents`, { timeout: 120000 }, async () => {
  for (const locale of ['', '/tw']) {
    const { context, page } = await open(`${locale}/guide/installation`)
    assert.equal(await page.locator('.ui-tabs').count(), 0)
    assert.equal(await page.locator('.installation-guides-group').count(), 4)
    assert.equal(await page.locator('.installation-guides a').count(), 24)
    const panels = await page.locator('[data-project-style="installation-check"]').evaluate(tray => {
      const code = tray.querySelector(':scope > .ui-code')
      const preview = tray.querySelector('.ui-browser')
      const generated = code.nextElementSibling
      return {
        gap: code.getBoundingClientRect().top - preview.getBoundingClientRect().bottom,
        inset: parseFloat(getComputedStyle(tray).getPropertyValue('--ui-inset')),
        joined: generated.getBoundingClientRect().top - code.getBoundingClientRect().bottom
      }
    })
    assert.equal(panels.gap, panels.inset, 'a step must preserve the tray’s preview/source gap')
    assert.equal(panels.joined, 0, 'generated output closes the source panel')
    const number = await page.locator('.ui-steps > li').first().evaluate(step => {
      const style = getComputedStyle(step, '::before')
      return { radius: style.borderRadius, shadow: style.boxShadow, content: style.content }
    })
    assert.equal(number.radius, '0px')
    assert.equal(number.shadow, 'none')
    assert.match(number.content, /decimal-leading-zero/)
    for (const id of ['integrations', 'cdn', 'cli']) {
      assert.equal(await page.locator(`article h2#${id}`).count(), 1)
      const link = page.locator(`.ui-toc[data-rail] a[data-page-content-nav-id="${id}"]`)
      await link.click()
      assert.equal(new URL(page.url()).hash, `#${id}`)
    }
    for (const slug of ['vite', 'webpack', 'server-rendered', 'nextjs', 'nuxtjs', 'astro', 'svelte', 'angular', 'lit', 'storybook']) {
      assert.equal((await page.goto(`${base}${locale}/guide/installation/${slug}`, { waitUntil: 'networkidle' })).status(), 200)
      assert.equal(await page.locator('article[data-aside]').count(), 1)
      assert.ok(await page.locator('.ui-toc[data-rail] a[data-page-content-nav-id]').count() > 0)
      const ids = await page.locator('.ui-toc[data-rail] a[data-page-content-nav-id]').evaluateAll(links => links.map(link => link.dataset.pageContentNavId))
      for (const id of ids) assert.equal(await page.locator(`article [id="${id}"]`).count(), 1, `${slug}: ${id}`)
      assert.ok(await page.locator(`a[href="${locale}/guide/installation#integrations"]`).count() > 0)
    }
    await context.close()
  }
})

test(`${engine}: switching the theme recolors without starting transitions`, { timeout: 60000 }, async () => {
  for (const route of ['/', '/guide/introduction']) {
    const { context, page, errors } = await open(route)
    // The select is an island: wait until it is hydrated and owns the preference before changing it.
    await page.waitForFunction(() => document.querySelector('select:has(option[value="dark"])')?.value === 'system')
    // Change the theme and count, in the same task, the transitions the swap itself starts. Later frames belong to
    // other scripts (the hero's lamp follows the theme on its own schedule).
    const started = await page.evaluate(() => {
      const select = document.querySelector('select:has(option[value="dark"])')
      const before = new Set(document.getAnimations())
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, 'dark')
      select.dispatchEvent(new Event('change', { bubbles: true }))
      if (!document.documentElement.classList.contains('dark')) return ['theme did not change']
      return document.getAnimations().filter(animation => animation instanceof CSSTransition && !before.has(animation)).map(animation => `${animation.transitionProperty} ${animation.effect.target?.className?.baseVal ?? animation.effect.target?.className}`)
    })
    assert.deepEqual(started, [], route)
    await page.waitForFunction(() => ![...document.head.querySelectorAll('style')].some(style => style.textContent.includes('transition:none!important')))
    assert.deepEqual(errors, [])
    await context.close()
  }
})

test(`${engine}: wide tables become keyboard scroll regions only when they overflow`, { timeout: 60000 }, async () => {
  for (const width of [390, 1440]) {
    const { context, page, errors } = await open('/guide/rendering-modes', { width })
    const tables = await page.locator('.ui-prose .ui-table:not([role])').evaluateAll(tables => tables.map(table => ({ wide: table.scrollWidth > table.clientWidth + 1, focusable: table.tabIndex === 0 })))
    assert.ok(tables.length > 0)
    for (const table of tables) assert.equal(table.focusable, table.wide, `${width}: ${JSON.stringify(table)}`)
    assert.deepEqual(errors, [])
    await context.close()
  }
})

test(`${engine}: focused scrollable code draws its ring above the code`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open('/guide/introduction')
  await page.locator('.ui-prose p').first().click()
  for (let i = 0; i < 20 && !(await page.evaluate(() => document.activeElement?.matches('.ui-code pre.shiki'))); i++) await page.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab')
  // The ring is an outline inset into the code panel, so the scroll container cannot clip it.
  const ring = await page.evaluate(() => {
    const style = getComputedStyle(document.activeElement)
    return { visible: document.activeElement.matches(':focus-visible'), outline: style.outlineStyle, width: parseFloat(style.outlineWidth), offset: parseFloat(style.outlineOffset) }
  })
  assert.equal(ring.visible, true)
  assert.notEqual(ring.outline, 'none')
  assert.ok(ring.width >= 2)
  assert.ok(ring.offset < 0, 'the ring sits inside the code panel')
  assert.deepEqual(errors, [])
  await context.close()
})

test(`${engine}: without scripts, paired artwork follows the system scheme`, { timeout: 60000 }, async () => {
  for (const scheme of ['light', 'dark']) for (const route of ['/', '/guide/introduction']) {
    const { context, page } = await open(route, { scheme, js: false })
    const logos = await page.locator('a.ui-header-brand svg').evaluateAll(svgs => svgs.filter(svg => svg.getBoundingClientRect().width > 40).map(svg => svg.className.baseVal.includes('--site-light') ? 'dark' : 'light'))
    assert.deepEqual(logos, [scheme], `${route} ${scheme}`)
    await context.close()
  }
})
