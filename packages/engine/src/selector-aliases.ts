import type { SelectorNode } from './utils/parse-selector'

const selectorAliases = {
  ':first': [{ value: 'first-child', type: 'pseudo-class' }],
  ':last': [{ value: 'last-child', type: 'pseudo-class' }],
  ':nth-last': [{ value: 'nth-last-child', type: 'pseudo-class' }],
  ':even': [{ value: 'nth-child', type: 'pseudo-class', children: [{ value: '2n' }] }],
  ':odd': [{ value: 'nth-child', type: 'pseudo-class', children: [{ value: 'odd' }] }],
  ':nth': [{ value: 'nth-child', type: 'pseudo-class' }],
  ':only': [{ value: 'only-child', type: 'pseudo-class' }],
  ':rtl': [{ value: 'dir', type: 'pseudo-class', children: [{ value: 'rtl' }] }],
  ':ltr': [{ value: 'dir', type: 'pseudo-class', children: [{ value: 'ltr' }] }],
  '::scrollbar': [{ value: '-webkit-scrollbar', type: 'pseudo-element' }],
  '::scrollbar-button': [{ value: '-webkit-scrollbar-button', type: 'pseudo-element' }],
  '::scrollbar-thumb': [{ value: '-webkit-scrollbar-thumb', type: 'pseudo-element' }],
  '::scrollbar-track': [{ value: '-webkit-scrollbar-track', type: 'pseudo-element' }],
  '::scrollbar-track-piece': [{ value: '-webkit-scrollbar-track-piece', type: 'pseudo-element' }],
  '::scrollbar-corner': [{ value: '-webkit-scrollbar-corner', type: 'pseudo-element' }],
  '::slider-thumb': [{ value: '-webkit-slider-thumb', type: 'pseudo-element' }],
  '::slider-runnable-track': [{ value: '-webkit-slider-runnable-track', type: 'pseudo-element' }],
  '::resizer': [{ value: '-webkit-resizer', type: 'pseudo-element' }],
  '::progress': [{ value: '-webkit-progress', type: 'pseudo-element' }],
  '::vt': [{ value: 'view-transition', type: 'pseudo-element' }],
  '::vt-group': [{ value: 'view-transition-group', type: 'pseudo-element' }],
  '::vt-image-pair': [{ value: 'view-transition-image-pair', type: 'pseudo-element' }],
  '::vt-old': [{ value: 'view-transition-old', type: 'pseudo-element' }],
  '::vt-new': [{ value: 'view-transition-new', type: 'pseudo-element' }]
} satisfies Record<string, SelectorNode[]>

export default selectorAliases
export { selectorAliases as builtinSelectorAliases }
export type MasterCSSBuiltinSelectorAliases = typeof selectorAliases
