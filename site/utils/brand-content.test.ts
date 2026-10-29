import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { brandAssets, brandExampleMarkup, brandLogoGeometry, brandMarkGradientStops, brandSections } from '../common/brand'
import { brandContent } from './brand-content'
import { configuredExampleCSS, configuredMarkupClasses } from '../reference/configured-example'

const root = fileURLToPath(new URL('../', import.meta.url))

test('the complete brand system remains available to search and portable readers', async () => {
  const content = await brandContent(root)
  assert.deepEqual(content.notes, [])
  for (const section of brandSections) assert.ok(content.markdown.includes(`id="${section.id}"`), section.id)
  for (const text of ['¼ H', '160px wide', '16px high', 'Geist', 'Noto Sans TC', 'IBM Plex Mono', '--color-surface-floating', '--spacing-lg', '--radius-3xl', 'prefers-reduced-motion', '在標記中編寫樣式']) {
    assert.ok(content.markdown.includes(text), text)
  }
  assert.ok(content.markdown.includes(brandExampleMarkup))
  assert.ok(content.markdown.includes('/design-system/authoring'))
  assert.doesNotMatch(content.markdown, /<(?:Brand[A-Z]|DemoAsset)|MCSS_EXPRESSION/)
})

test('brand downloads preserve all three original source destinations and the policy', async () => {
  const { markdown } = await brandContent(root)
  for (const asset of brandAssets) {
    assert.ok(markdown.includes(`[Download ${asset.title} (SVG)](${asset.src})`))
    assert.match(await readFile(new URL(`../public${asset.src}`, import.meta.url), 'utf8'), /<svg\b/)
  }
  for (const anchor of ['logotype', 'mark', 'trademark-policy', 'name-usage']) assert.ok(markdown.includes(`id="${anchor}"`), anchor)
  assert.ok(markdown.includes('without written consent'))
  assert.ok(markdown.includes('trademarks owned by Aoyue Design'))
  const mark = await readFile(new URL('../public/images/logo.svg', import.meta.url), 'utf8')
  for (const stop of brandMarkGradientStops) assert.ok(mark.toLowerCase().includes(stop.toLowerCase()), `${stop}: an actual stop in the original artwork`)
  assert.ok(mark.includes(`viewBox="${brandLogoGeometry[0].viewBox}"`))
  for (const file of brandAssets.slice(0, 2)) assert.ok((await readFile(new URL(`../public${file.src}`, import.meta.url), 'utf8')).includes(`viewBox="${brandLogoGeometry[1].viewBox}"`))
})

test('the displayed brand composition compiles with the current public preset', () => {
  const css = configuredExampleCSS('', configuredMarkupClasses(brandExampleMarkup))
  assert.ok(css.includes('display:grid'))
  assert.ok(css.includes('var(--spacing-md)'))
  assert.ok(css.includes('var(--color-surface-raised)'))
})
