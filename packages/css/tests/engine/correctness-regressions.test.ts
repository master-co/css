import { expect, test } from 'vitest'
import defaultManifest from '@master/css-preset/default-manifest.json'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import createEngine from '../../src/engine/create-engine'

const manifest = defaultManifest as unknown as MasterCSSManifest

test.each(['native', 'wasm'] as const)('preserves decimal conditions and selector literals through %s', async (binding) => {
  using engine = await createEngine({ manifest, binding })
  for (const [className, text] of [
    ['display:block@media((width>=600.5px))', String.raw`@media (width>=600.5px){.display\:block\@media\(\(width\>\=600\.5px\)\){display:block}}`],
    ['display:block@container((width>=600.5px))', String.raw`@container (width>=600.5px){.display\:block\@container\(\(width\>\=600\.5px\)\){display:block}}`],
    ['display:block@media((width>=37.5rem))', String.raw`@media (width>=37.5rem){.display\:block\@media\(\(width\>\=37\.5rem\)\){display:block}}`],
    ['display:block[data-state=":first"]:first', String.raw`.display\:block\[data-state\=\"\:first\"\]\:first[data-state=":first"]:first-child{display:block}`],
    ['display:block:is(:first,[data-state=":before"]):before', String.raw`.display\:block\:is\(\:first\,\[data-state\=\"\:before\"\]\)\:before:is(:first-child,[data-state=":before"])::before{display:block}`]
  ]) {
    expect(engine.inspect(className).rules.map(rule => rule.text), className).toEqual([text])
  }
})
