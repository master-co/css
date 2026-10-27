import { expect, test } from 'vitest'
import { analyzeCSSStructure } from '../shared/css-structure'

const classes = '.x'.repeat(11)
const types = Array(11).fill('div').join(' ')
const selectors: [string, number][] = [
  ['*', 0], ['*|*', 0], ['svg|*', 0], ['|*', 0], ['svg|a', 1], ['*|a', 1], ['\\*', 1],
  ['#id', 100], ['.x', 10], ['div', 1], ['[data-x]', 10], ['.x.x', 20], ['#id#id', 200],
  [':is(#id)', 100], [':is(.x, #id)', 100], [':not(.x)', 10], [':has(> span)', 1],
  [':where(#id.x)', 0], [':WHERE(#id)', 0], [':IS(.x, #id)', 100], [':i\\73(.x, #id)', 100],
  [':not(:where(#id), .x)', 10], [':is(.x, :not(#id))', 100], [':has(> .x, + #id)', 100],
  [':nth-child(2n)', 10], [':nth-child(2n of .x, #id)', 110], [':nth-last-child(odd of div.x)', 21],
  [':nth-child(1 of :where(#id))', 10], [':nth-of-type(2n)', 10], [':lang(en)', 10],
  [':before', 1], [':AFTER', 1], [':first-line', 1], [':first-letter', 1], ['::before', 1],
  ['::slotted(.x)', 11], ['::slotted(div.x)', 12], [':host', 10], [':host(.x)', 20], [':host-context(#id)', 110],
  ['::part(tab)', 1], [':is(#id, '+classes+')', 100], [':is(.x, '+types+')', 10],
  ['#id, '+classes, 100], ['.x, '+types, 10], ['&', 0], ['.x:is(div, #id):not(.other)', 120]
]
for (const [selector, expected] of selectors) {
  test(`specificity ${selector}`, () => {
    expect(analyzeCSSStructure(`${selector}{color:red}`).maxSelectorSpecificityScore).toBe(expected)
  })
}

const nested: [string, number][] = [
  ['.x,#id { &.active {color:red} }', 110],
  ['.x,#id { .child {color:red} }', 110],
  ['.x { && {color:red} }', 20],
  ['.x { + .other + & {color:red} }', 30],
  ['.x { :is(&,#id) {color:red} }', 100],
  ['article { :where(&) {color:red} }', 1],
  ['.x { @media all { &.active {color:red} } }', 20],
  ['.x { .child { &.active {color:red} } }', 30],
  ['.x { @scope (&) { & .child {color:red} } }', 10],
  ['@scope (#id) { .child {color:red} }', 10],
  ['@keyframes x { from {color:red} to {color:blue} }', 0]
]
for (const [css, expected] of nested) {
  test(`specificity context ${css}`, () => {
    expect(analyzeCSSStructure(css).maxSelectorSpecificityScore).toBe(expected)
  })
}

test('maximum keeps its full tuple when the display projection would reverse order', () => {
  const summary = analyzeCSSStructure(`${classes}{color:red}#id{color:blue}`)
  expect(summary.maxSelectorSpecificity).toEqual({ id: 1, class: 0, type: 0 })
  expect(summary.maxSelectorSpecificityScore).toBe(100)
})

test('recovered nested rule sequences keep declarations, rule counts and parent context', () => {
  const summary = analyzeCSSStructure('.x{color:red;.a{color:red}.b{color:blue}}')
  expect(summary.styleRuleCount).toBe(3)
  expect(summary.declarationCount).toBe(3)
  expect(summary.maxSelectorSpecificityScore).toBe(20)
})

test('unparsed selector syntax is reported rather than silently assigned zero specificity', () => {
  expect(() => analyzeCSSStructure('???{color:red}')).toThrow('unparsed selector prelude')
  expect(() => analyzeCSSStructure('.x{???}')).toThrow('Cannot analyze recovered CSS')
})
