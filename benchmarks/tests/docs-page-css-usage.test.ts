import { expect, test } from 'vitest'
import { collectStyleRules } from '../docs-page-css-size/usage'

test('collects layered, conditional and nested style rules but not keyframes', () => {
  const rules = collectStyleRules([
    '@layer utilities{.a{color:red}@media (width>=40rem){.b{color:red}}}',
    '@keyframes fade{from{opacity:0}to{opacity:1}}',
    '.card{color:red;&:hover{color:blue}.title{color:green}}'
  ])
  expect(rules.map((rule) => rule.selectors)).toEqual([['.a'], ['.b'], ['.card'], [':is(.card)'], [':is(.card) .title']])
})

test('removes state pseudo-classes and pseudo-elements before matching', () => {
  const [rule] = collectStyleRules(['.tab:hover::before,.tab:focus-visible,a:-webkit-any-link{color:red}'])
  expect(rule.selectors).toEqual(['.tab', '.tab', 'a'])
})

test('reports token-only rules separately from style rules', () => {
  const rules = collectStyleRules([':root{--a:1;--b:2}.a{--c:1;color:red}.empty{}'])
  expect(rules.map((rule) => [rule.selectors[0], rule.tokenOnly])).toEqual([[':root', true], ['.a', false]])
})
