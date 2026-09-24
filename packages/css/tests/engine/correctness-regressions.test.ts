import { expect, test } from 'vitest'
import defaultManifest from '@master/css-preset/default-manifest.json'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import createEngine from '../../src/engine/create-engine'

const manifest = defaultManifest as unknown as MasterCSSManifest

test.each(['native', 'wasm'] as const)('preserves decimal conditions and selector literals through %s', async (binding) => {
  using engine = await createEngine({ manifest, binding })
  for (const [className, text] of [
    ['block@media((width>=600.5px))', String.raw`@media (width>=600.5px){.block\@media\(\(width\>\=600\.5px\)\){display:block}}`],
    ['block@container((width>=600.5px))', String.raw`@container (width>=600.5px){.block\@container\(\(width\>\=600\.5px\)\){display:block}}`],
    ['block@media((width>=37.5rem))', String.raw`@media (width>=37.5rem){.block\@media\(\(width\>\=37\.5rem\)\){display:block}}`],
    ['block[data-state=":first"]:first', String.raw`.block\[data-state\=\"\:first\"\]\:first[data-state=":first"]:first-child{display:block}`],
    ['block:is(:first,[data-state=":before"]):before', String.raw`.block\:is\(\:first\,\[data-state\=\"\:before\"\]\)\:before:is(:first-child,[data-state=":before"])::before{display:block}`]
  ]) {
    expect(engine.inspect(className).rules.map(rule => rule.text), className).toEqual([text])
  }
})
