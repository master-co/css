import { expect, test } from 'vitest'
import { compileBrowserStylesheet } from '../src/stylesheet/browser'
import { compileRenderedStylesheet } from '../src/stylesheet/index-public'

test.each(['native', 'wasm'] as const)('preserves selector literals while lowering @compose through %s', async (binding) => {
  const source = String.raw`@utilities{paint{display:block}}[data-state=":first"]:first{@compose paint;}.literal\:before:before{@compose paint;}:is(:first,[data-state=':last']){@compose paint;}`
  const options = { baseManifest: { version: 1 as const }, preserveNativeCSS: true }
  const result = binding === 'native'
    ? await compileRenderedStylesheet('/tmp/selector-literals.css', source, options)
    : await compileBrowserStylesheet(source, options)
  expect(result.css).toContain(String.raw`[data-state=\:first]:first-child{display:block}`)
  expect(result.css).toContain(String.raw`.literal\:before::before{display:block}`)
  expect(result.css).toContain(String.raw`:is(:first-child,[data-state=\:last]){display:block}`)
})
