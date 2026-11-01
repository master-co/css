import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { brandArtwork, brandAssets, brandKit, brandMarkGradientStops, brandSignalToken, brandTypefaces } from '../common/brand'
import { brandContent } from './brand-content'

const sections = ['identity', 'logo-system', 'color-system', 'typography', 'voice', 'download-assets', 'logotype', 'mark', 'trademark-policy', 'name-usage']

test('the brand identity remains available to search and portable readers', async () => {
  const content = await brandContent(new URL('../', import.meta.url).pathname)
  assert.deepEqual(content.notes, [])
  for (const id of sections) assert.ok(content.markdown.includes(`id="${id}"`), id)
  for (const text of ['Half the mark\'s height', '25mm wide', '24px high', '64px high', `--color-${brandSignalToken}`, '在標記中編寫樣式', ...brandTypefaces.map(face => face.family)]) {
    assert.ok(content.markdown.includes(text), text)
  }
  assert.doesNotMatch(content.markdown, /<(?:Brand[A-Z]|DemoAsset)|MCSS_EXPRESSION/)
})

test('brand boundaries leave interface decisions to the design system', async () => {
  const { markdown } = await brandContent(new URL('../', import.meta.url).pathname)
  assert.ok(markdown.includes('](/design-system)'))
  for (const token of ['--color-surface-raised', '--spacing-', '--radius-', '--duration-']) assert.ok(!markdown.includes(token), `${token} belongs to the design system or Reference`)
})

test('brand downloads preserve approved background variants, source geometry and the policy', async () => {
  const { markdown } = await brandContent(new URL('../', import.meta.url).pathname)
  for (const asset of brandAssets) {
    assert.ok(markdown.includes(`[Download ${asset.title} (SVG)](${asset.src})`))
    const svg = await readFile(new URL(`../public${asset.src}`, import.meta.url), 'utf8')
    const geometry = asset.src.includes('logotype') ? brandArtwork.logotype : brandArtwork.mark
    assert.match(svg, new RegExp(`viewBox="[-\\d.]+ [-\\d.]+ ${geometry.width} ${geometry.height}"`), `${asset.src}: the recorded SVG canvas`)
  }
  assert.ok(markdown.includes('without written consent'))
  assert.ok(markdown.includes('trademarks owned by Aoyue Design'))
  for (const [mode, stops] of Object.entries(brandMarkGradientStops)) {
    const svg = await readFile(new URL(`../public/brand/v2/logo/mark/master-mark-on-${mode}.svg`, import.meta.url), 'utf8')
    for (const stop of stops) {
      assert.ok(svg.toLowerCase().includes(stop.toLowerCase()), `${stop}: an actual ${mode}-background stop`)
      assert.ok(markdown.includes(stop), `${stop}: available in the portable guide`)
    }
    assert.match(svg, /x1="108.3" y1="0" x2="108.3" y2="120"/, 'central ribbon uses the approved vertical field')
  }
  assert.ok(markdown.includes(brandKit.src))
  assert.ok(markdown.includes(brandKit.manifest))
})
