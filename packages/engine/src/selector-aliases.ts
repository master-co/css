import type { SelectorNode } from './utils/parse-selector'

const selectorAliases = {
  ':first': [{ value: 'first-child', type: 'pseudo-class' }],
  ':last': [{ value: 'last-child', type: 'pseudo-class' }],
  ':even': [{ value: 'nth-child', type: 'pseudo-class', children: [{ value: '2n' }] }],
  ':odd': [{ value: 'nth-child', type: 'pseudo-class', children: [{ value: 'odd' }] }],
  ':only': [{ value: 'only-child', type: 'pseudo-class' }],
  ':rtl': [{ value: 'dir', type: 'pseudo-class', children: [{ value: 'rtl' }] }],
  ':ltr': [{ value: 'dir', type: 'pseudo-class', children: [{ value: 'ltr' }] }],
  '::scrollbar': [{ value: '-webkit-scrollbar', type: 'pseudo-element' }],
  '::scrollbar-thumb': [{ value: '-webkit-scrollbar-thumb', type: 'pseudo-element' }],
  '::scrollbar-track': [{ value: '-webkit-scrollbar-track', type: 'pseudo-element' }],
  '::slider-thumb': [{ value: '-webkit-slider-thumb', type: 'pseudo-element' }],
  '::slider-runnable-track': [{ value: '-webkit-slider-runnable-track', type: 'pseudo-element' }],
  '::resizer': [{ value: '-webkit-resizer', type: 'pseudo-element' }]
} satisfies Record<string, SelectorNode[]>

export default selectorAliases
export { selectorAliases as builtinSelectorAliases }
export type MasterCSSBuiltinSelectorAliases = typeof selectorAliases
