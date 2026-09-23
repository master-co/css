import { expect, test } from '@playwright/test'
import catalog from '../../.generated/reference.json' with { type: 'json' }
import preset from '../../utils/preset-manifest'
import { flattenMasterCSSManifestVariables } from '@master/css-schema/manifest'
import { getVariableNamespacePublicKeys } from '../../utils/manifest-utilities'

const documents = catalog.documents.filter(doc => doc.kind === 'tokens')
const variables = flattenMasterCSSManifestVariables(preset.variables)

for (const doc of documents) test(`token document: ${doc.title}`, async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.setViewportSize({ ...page.viewportSize()!, height: 1200 })
  await page.goto(`/en${doc.url}`)
  await expect(page.locator('h1')).toHaveText(doc.title)
  await page.evaluate(() => document.fonts.ready)
  await page.addStyleTag({ content: 'nextjs-portal{visibility:hidden}' })
  const headings = await page.locator('.reference-document :is(h2,h3)[id]').evaluateAll(elements => elements.map(element => ({ id: element.id, title: element.textContent })))
  for (const heading of doc.headings) expect(headings).toContainEqual({ id: heading.id, title: heading.title })
  const entries = variables.filter(variable => `tokens/${variable.namespace}` === doc.id)
  const rows = await page.locator('.doc-value-row').evaluateAll(elements => elements.map(element => ({
    id: element.querySelector('h3')!.id,
    title: element.querySelector('h3')!.textContent,
    identifier: element.querySelector('.doc-value-identifier')!.textContent,
    values: [...element.querySelectorAll('.doc-value-pair')].map(pair => ({ label: pair.querySelector('span')!.textContent, value: pair.querySelector('code')!.textContent }))
  })))
  expect(rows).toEqual(entries.map(variable => ({
    id: doc.headings.find(heading => heading.depth === 3 && heading.title === variable.key)!.id,
    title: variable.key, identifier: `--${variable.name}`,
    values: [...(variable.value === undefined ? [] : [{ label: 'Default', value: String(variable.value) }]), ...Object.entries(variable.modes ?? {}).map(([label, value]) => ({ label, value: String(value.value) }))]
  })))
  if (entries.length) {
    const keys = page.locator('.doc-key-list code')
    await expect(keys).toHaveText(getVariableNamespacePublicKeys(doc.title).map(key => `${key}:`))
    for (const element of await page.locator('.doc-values, .doc-key-list').all()) expect(await element.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
    const anchor = page.locator('.doc-value-title a').last()
    await anchor.scrollIntoViewIfNeeded(); await anchor.focus(); await expect(anchor).toBeFocused()
    await expect(anchor).toHaveCSS('outline-width', '2px')
    await expect(anchor).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`#${rows.at(-1)!.id}$`))
    await expect(anchor).toBeInViewport()
    await page.locator('.doc-values').screenshot({ path: info.outputPath('values.png'), scale: 'css', style: 'nav.app-wrapper{visibility:hidden}' })
  } else {
    const code = page.locator('.reference-document pre')
    await expect(code).toHaveCount(doc.headings.filter(heading => heading.depth === 3).length)
    expect((await code.allTextContents()).every(text => text.includes('opacity: 1') && text.includes('@layer utilities'))).toBe(true)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  expect(errors).toEqual([])
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: info.outputPath('page.png'), scale: 'css', fullPage: true })
})

test('token search opens its exact row with the original stable fragment', async ({ page }) => {
  await page.goto('/en/reference/tokens/font-weight')
  const origin = page.locator('.doc-value-title a').first()
  await origin.scrollIntoViewIfNeeded(); await origin.focus()
  await page.keyboard.press('ControlOrMeta+k')
  const dialog = page.getByRole('dialog', { name: 'Search documentation' })
  await dialog.getByRole('searchbox').fill('--font-weight-heavy')
  const result = dialog.locator('a[href$="/reference/tokens/font-weight#heavy"]')
  await expect(result).toHaveCount(1)
  const index = Number((await result.getAttribute('id'))!.replace('documentation-result-', ''))
  for (let i = 0; i < index; i++) await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/reference\/tokens\/font-weight#heavy$/)
  await expect(page.locator('#heavy')).toBeInViewport()
})

test('document value gallery keeps distinct headings and wraps mode values', async ({ page }, info) => {
  await page.goto('/en/design-system')
  const list = page.locator('.doc-values')
  await expect(list.locator('.doc-value-row')).toHaveCount(3)
  await expect(list.locator('h3')).toHaveText(['fast', 'raised', 'smooth'])
  expect(await list.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
  await list.screenshot({ path: info.outputPath('document-values.png'), scale: 'css', style: 'nav.app-wrapper{visibility:hidden}' })
})

test('general Reference bodies retain code and headings outside compact token rendering', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  for (const id of ['rules/conditions', 'packages/css', 'tools/cli/generate']) {
    const doc = catalog.documents.find(doc => doc.id === id)!
    await page.goto(`/en${doc.url}`)
    await expect(page.locator('h1')).toHaveText(doc.title)
    expect(await page.locator('.reference-document pre').count()).toBeGreaterThan(0)
    await expect(page.locator('.doc-values')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  }
  expect(errors).toEqual([])
})
