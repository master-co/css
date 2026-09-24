import { expect, test, type Page } from '@playwright/test'
import catalog from '../../.generated/reference.json' with { type: 'json' }
import type { ReferenceCatalog } from '../../reference/types'
import { configuredExampleCSS, configuredMarkupClasses } from '../../reference/configured-example'

const document = (slug: string) => (catalog as ReferenceCatalog).documents.find(doc => doc.id === `rules/${slug}`)!
function snippets(slug: string, id: string, language = 'html') {
  const markdown = document(slug).markdown
  const start = markdown.indexOf(`{#${id}}`)
  if (start < 0) throw new Error(`Missing section ${slug}#${id}`)
  const section = markdown.slice(start).split(/\n#{2,3} /)[0]
  return [...section.matchAll(new RegExp('```' + language + '[^\\n]*\\n([\\s\\S]*?)```', 'g'))].map(match => match[1])
}
async function specimen(page: Page, html: string, script = '') {
  const css = configuredExampleCSS('', configuredMarkupClasses(html))
  await page.setContent(`<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style>${html}`)
  if (script) await page.addScriptTag({ content: script })
}

for (const slug of ['declarations', 'selectors', 'conditions', 'extraction']) test(`complete language rule ${slug}`, async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(`/en/reference/rules/${slug}`)
  for (const heading of document(slug).headings) await expect(page.locator(`[id="${heading.id}"]`)).toHaveCount(1)
  await page.evaluate(() => window.document.fonts.ready)
  expect(await page.evaluate(() => window.document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: info.outputPath('page.png'), fullPage: true, scale: 'css', style: 'nav.app-wrapper{visibility:hidden}' })
  expect(errors).toEqual([])
})

test('syntax mapping tables preserve short tokens and complete native CSS', async ({ page }, info) => {
  for (const url of ['/en/reference/rules/conditions#common-condition-variants', '/en/design-system#syntax-mappings']) {
    await page.goto(url)
    const tables = page.locator('.doc-code-table')
    await expect(tables).toHaveCount(url.includes('design-system') ? 1 : 2)
    for (const table of await tables.all()) {
      for (const token of await table.getByRole('rowheader').locator('code').all()) {
        expect(await token.evaluate(e => e.getClientRects().length)).toBe(1)
      }
      expect(await table.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true)
    }
    await tables.first().screenshot({ path: info.outputPath(url.includes('design-system') ? 'code-table-recipe.png' : 'conditions-table.png'), scale: 'css', style: 'nav.app-wrapper{visibility:hidden}' })
    expect(await page.evaluate(() => window.document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
})

test('documented selector states retain native labels, validity and keyboard focus', async ({ page }) => {
  await specimen(page, snippets('selectors', 'hover--active--focus')[0] + snippets('selectors', 'valid--invalid--required')[0])
  const button = page.getByRole('button', { name: 'Preview' }), email = page.getByRole('textbox', { name: 'Email' })
  // Mobile WebKit's Tab policy may skip buttons; preserve keyboard modality.
  await page.keyboard.press('Tab'); await button.focus(); await expect(button).toBeFocused()
  await expect(button).toHaveCSS('outline-width', '2px')
  const invalid = await email.evaluate(e => getComputedStyle(e).borderColor)
  await email.fill('writer@example.com')
  expect(await email.evaluate(e => (e as HTMLInputElement).validity.valid)).toBe(true)
  expect(await email.evaluate(e => getComputedStyle(e).borderColor)).not.toBe(invalid)
  await email.fill('invalid')
  await expect(email).toHaveCSS('border-color', invalid)
  await specimen(page, snippets('selectors', 'checked--indeterminate').join('\n'), snippets('selectors', 'checked--indeterminate', 'js').join('\n'))
  const partial = page.getByRole('checkbox', { name: 'Select all', exact: true })
  expect(await partial.evaluate(e => (e as HTMLInputElement).indeterminate)).toBe(true)
  await expect(partial).not.toBeChecked(); await expect(partial).toHaveCSS('outline-width', '2px')
  const checked = page.getByRole('checkbox', { name: 'Include archived items' })
  await checked.focus(); await page.keyboard.press('Space'); await expect(checked).not.toBeChecked()
})

test('structural aliases and CSS variable colors use the actual documented rules', async ({ page }) => {
  await specimen(page, snippets('selectors', 'first--last--odd--even')[0])
  const backgrounds = await page.locator('li').evaluateAll(nodes => nodes.map(e => getComputedStyle(e).backgroundColor))
  expect(backgrounds[0]).toBe(backgrounds[2]); expect(backgrounds[1]).not.toBe(backgrounds[0])
  const oddCSS = configuredExampleCSS('', ['mt-sm:odd'])
  expect(oddCSS).toContain(':nth-child(odd)')
  await specimen(page, snippets('declarations', 'variable-properties').find(html => html.includes('--button-bg'))!)
  const button = page.getByRole('button', { name: 'Save' })
  expect(await button.evaluate(e => getComputedStyle(e).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)')
  expect(await button.evaluate(e => getComputedStyle(e).getPropertyValue('--button-bg').trim())).not.toBe('red-60')
})

test('documented support and media conditions match native browser conditions', async ({ page }) => {
  await specimen(page, snippets('conditions', 'supportsfeature')[0])
  const supported = await page.evaluate(() => CSS.supports('backdrop-filter', 'blur(0px)'))
  await expect(page.locator('div')).toHaveCSS('display', supported ? 'none' : 'block')
  await specimen(page, snippets('conditions', 'sm--md--lg--and-more')[0])
  await page.setViewportSize({ width: 1000, height: 800 }); await expect(page.locator('div')).toHaveCSS('display', 'none')
  await page.setViewportSize({ width: 390, height: 800 }); await expect(page.locator('div')).toHaveCSS('display', 'block')
  await specimen(page, snippets('conditions', 'containersize-1')[0])
  const container = page.locator('aside'), child = container.locator('div')
  await expect(container).toHaveCSS('container-type', 'inline-size')
  await expect(container).toHaveCSS('container-name', 'sidebar')
  await container.evaluate(e => { e.style.width = '500px' }); await expect(child).toHaveCSS('display', 'none')
  await container.evaluate(e => { e.style.width = '300px' }); await expect(child).toHaveCSS('display', 'block')
  await specimen(page, snippets('conditions', 'starting-style')[0])
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Open Popover' }).click()
  await expect(page.locator('#target')).toBeVisible(); await expect(page.locator('#target')).toHaveCSS('transition-duration', '0s')
  await page.getByRole('button', { name: 'Close', exact: true }).click(); await expect(page.locator('#target')).not.toBeVisible()
})

test('portable runtime-value examples update actual CSS and accessible progress', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await specimen(page, snippets('extraction', 'runtime-values').join('\n'), snippets('extraction', 'runtime-values', 'js').join('\n'))
  await expect(page.getByRole('heading', { name: 'Launch notes' })).toHaveCSS('font-size', '48px')
  const progress = page.getByRole('progressbar', { name: 'Upload progress' }), fill = page.locator('#progress-fill')
  const className = await fill.getAttribute('class')
  await page.evaluate('setProgress(75)')
  await expect(progress).toHaveAttribute('aria-valuenow', '75')
  expect(await fill.evaluate(e => e.getBoundingClientRect().width / e.parentElement!.getBoundingClientRect().width)).toBeCloseTo(.75, 2)
  await expect(fill).toHaveCSS('transition-duration', '0s')
  await page.evaluate('setProgress(150)'); await expect(progress).toHaveAttribute('aria-valuenow', '100')
  await page.evaluate('setProgress(NaN)'); await expect(progress).toHaveAttribute('aria-valuenow', '0')
  expect(await fill.getAttribute('class')).toBe(className)
})
