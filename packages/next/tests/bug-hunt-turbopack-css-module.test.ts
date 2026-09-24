import { expect, test } from 'vitest'
import type { NextConfig } from 'next'
import withMasterCSS from '../src'

type Condition = { all?: Condition[]; any?: Condition[]; not?: Condition; path?: RegExp; content?: RegExp; query?: RegExp }
function matches(condition: Condition | undefined, file: string, source: string): boolean {
  if (!condition) return true
  if (condition.all) return condition.all.every(value => matches(value, file, source))
  if (condition.any) return condition.any.some(value => matches(value, file, source))
  if (condition.not) return !matches(condition.not, file, source)
  if (condition.path) return condition.path.test(file)
  if (condition.content) return condition.content.test(source)
  if (condition.query) return condition.query.test('')
  return false
}
function stylesheetRules(file: string, source: string) {
  const sassOptions = { loadPaths: ['/project/styles'] }
  const config = withMasterCSS({ sassOptions }, { mode: 'pre-render' }) as NextConfig
  const rules = config.turbopack?.rules?.['*'] as { type?: string; as?: string; condition?: Condition; loaders?: unknown[] }[]
  return rules.filter(rule => rule.loaders?.some(loader => String(typeof loader === 'string' ? loader : (loader as { loader: string }).loader).endsWith('stylesheet-loader.js')) && matches(rule.condition, file, source))
}
for (const extension of ['css', 'scss', 'sass']) test(`Turbopack preserves CSS Module type for .module.${extension}`, () => {
  const rules = stylesheetRules(`card.module.${extension}`, '.card{@compose p:2rem;}')
  expect(rules).toHaveLength(1)
  expect(rules[0].type).toBe('css-module')
  expect(rules[0].as).toBeUndefined() // Preserve the source identity; type handles Sass output.
})
for (const extension of ['scss', 'sass']) test(`Turbopack handles imported directives in .module.${extension} once`, () => {
  const rules = stylesheetRules(`card.module.${extension}`, '@use "parts/card";')
  expect(rules).toHaveLength(1)
  expect(rules[0].type).toBe('css-module')
  expect(rules[0].as).toBeUndefined() // Preserve the source identity; type handles Sass output.
})
test('Turbopack keeps global Sass global and forwards configured options', () => {
  const rules = stylesheetRules('globals.scss', '@use "parts/global";')
  expect(rules).toHaveLength(1)
  expect(rules[0].type).toBe('css')
  expect(rules[0].loaders).toEqual([expect.objectContaining({ options: { sassOptions: { loadPaths: ['/project/styles'] } } })])
})
test('Turbopack leaves native CSS Modules without Master directives to Next', () => {
  expect(stylesheetRules('card.module.css', '.card{padding:2rem;}')).toEqual([])
})
