import { expect, test } from 'vitest'
import { compileBrowserStylesheet } from '../src/stylesheet/browser'
import { compileRenderedStylesheet } from '../src/stylesheet/index-public'

test.each(['native', 'wasm'] as const)('preserves selector literals while lowering @apply through %s', async (binding) => {
  const source = String.raw`@mixin --paint {display:block}[data-state=":first"]:first{@apply --all{display:block;}}.literal\:before:before{@apply --all{display:block;}}:is(:first,[data-state=':last']){@apply --all{display:block;}}`
  const options = { baseManifest: {
  mixins: [
  {
    "name": "--all",
    "body": [
      {
        "type": "condition" as const,
        "condition": "@media all",
        "body": [
          {
            "type": "contents" as const,
            "fallback": []
          }
        ]
      }
    ]
  }
],
  "version": 4 as const,
  "languageVersion": 12 as const
}, preserveNativeCSS: true }
  const result = binding === 'native'
    ? await compileRenderedStylesheet('/tmp/selector-literals.css', source, options)
    : await compileBrowserStylesheet(source, options)
  expect(result.css).toContain(String.raw`[data-state=\:first]:first{display:block}`)
  expect(result.css).toContain(String.raw`.literal\:before:before{display:block}`)
  expect(result.css).toContain(String.raw`:is(:first,[data-state=\:last]){display:block}`)
})
