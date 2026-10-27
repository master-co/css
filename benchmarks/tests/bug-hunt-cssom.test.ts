import { runInNewContext } from 'node:vm'
import { expect, test } from 'vitest'
import { countCSSOMRules, collectCSSOMSelectorTexts, renderCSSOMReader } from '../shared/cssom'

test('nested styles retain their own count and selectors while groups only contribute descendants', () => {
  const rules = [
    { selectorText: '.parent', cssRules: [{ selectorText: '& .child', cssRules: [] }, { style: {} }] },
    { cssRules: [{ selectorText: '.inside', cssRules: [] }] },
    { cssRules: [] },
    { keyText: 'from', style: {} }
  ] as unknown as CSSRuleList
  expect(countCSSOMRules(rules)).toBe(5)
  expect(collectCSSOMSelectorTexts(rules)).toEqual(['.parent', '& .child', '.inside'])
})

test('empty lists and empty grouping rules differ from empty style and other leaf rules', () => {
  expect(countCSSOMRules()).toBe(0)
  expect(collectCSSOMSelectorTexts()).toEqual([])
  expect(countCSSOMRules([{ cssRules: [] }, { selectorText: '.empty', cssRules: [] }, {}] as unknown as CSSRuleList)).toBe(2)
})

test('serialized browser helpers retain recursion and aggregate only actual layer blocks', () => {
  const result = runInNewContext(`
    class CSSLayerBlockRule { constructor(name, cssRules) { this.name = name; this.cssRules = cssRules; } }
    ${renderCSSOMReader()}
    __benchmarkCSSOM.summarize([
      new CSSLayerBlockRule('utilities', [{selectorText: '.a', cssRules: [{selectorText: '& .b', cssRules: []}]}]),
      new CSSLayerBlockRule('utilities', [{selectorText: '.c', cssRules: []}]),
      {name: 'utilities', cssRules: [{keyText: 'from'}, {keyText: 'to'}]}
    ])`)
  expect(JSON.parse(JSON.stringify(result))).toEqual({
    layerRuleCount: 2, layerRuleCounts: { utilities: 2 },
    layerSelectorTexts: { utilities: ['.a', '& .b', '.c'] }, totalRuleCount: 5
  })
})
