import { expect, test } from 'vitest'
import { compileBrowserStylesheet } from '../src/stylesheet/browser'
import { compileRenderedStylesheet } from '../src/stylesheet/index-public'

test.each(['native', 'wasm'] as const)('preserves selector literals while lowering @compose through %s', async (binding) => {
  const source = String.raw`@mixin --paint {display:block}[data-state=":first"]:first{@variant all{display:block;}}.literal\:before:before{@variant all{display:block;}}:is(:first,[data-state=':last']){@variant all{display:block;}}`
  const options = { baseManifest: {
  "variants": [
    {
      "token": "@all" as const,
      "branches": [
        {
          "conditions": [
            "@media all"
          ]
        }
      ]
    }
  ],
  "version": 4 as const,
  "languageVersion": 6 as const
}, preserveNativeCSS: true }
  const result = binding === 'native'
    ? await compileRenderedStylesheet('/tmp/selector-literals.css', source, options)
    : await compileBrowserStylesheet(source, options)
  expect(result.css).toContain(String.raw`[data-state=\:first]:first-child{display:block}`)
  expect(result.css).toContain(String.raw`.literal\:before::before{display:block}`)
  expect(result.css).toContain(String.raw`:is(:first-child,[data-state=\:last]){display:block}`)
})
