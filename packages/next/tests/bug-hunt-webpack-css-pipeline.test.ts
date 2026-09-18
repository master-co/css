import { expect, test } from 'vitest'
import type { NextConfig } from 'next'
import withMasterCSS from '../src'

const nextLoader = (name: string) => `/node_modules/next/dist/build/webpack/loaders/${name}/src/index.js`

for (const sass of [false, true]) for (const lightning of [false, true]) test(`BH-0051 preserves Next CSS processing, sass=${sass}, lightning=${lightning}`, () => {
  const cssLoader = { loader: nextLoader(lightning ? 'lightningcss-loader' : 'css-loader'), options: { importLoaders: sass ? 3 : 1, modules: { mode: 'pure' } } }
  const use = [
    { loader: 'style-loader' }, cssLoader,
    ...lightning ? [] : [{ loader: nextLoader('postcss-loader') }],
    ...sass ? [{ loader: 'resolve-url-loader' }, { loader: 'sass-loader' }] : []
  ]
  const css = { test: sass ? /\.module\.scss$/ : /\.module\.css$/, use }
  const hostMarker = Symbol('host-rule-marker')
  Object.defineProperty(css, hostMarker, { value: true })
  const original = { module: { rules: [{ oneOf: [css] }] } }
  const config = (withMasterCSS({}) as NextConfig).webpack!(original, {} as never)
  const rules = config.module.rules
  expect(rules.some((rule: { test?: RegExp }) => rule.test?.test('/tmp/example.css'))).toBe(false)
  const group = rules[0], chain = group.oneOf[0].use
  expect(Object.getOwnPropertyDescriptor(group.oneOf[0], hostMarker)).toEqual(Object.getOwnPropertyDescriptor(css, hostMarker))
  const master = chain.findIndex((item: { loader: string }) => item.loader.endsWith('stylesheet-loader.js'))
  expect(master).toBe(lightning ? 2 : 3)
  expect(chain[master].options).toEqual({ preprocessed: true })
  expect(chain.filter((_: unknown, index: number) => index !== master)).toEqual(use.map(item => item === cssLoader ? { ...item, options: { ...cssLoader.options, importLoaders: cssLoader.options.importLoaders + 1 } } : item))
  expect(group.resourceQuery).toEqual({ not: [/master-css-manifest/] })
  expect(cssLoader.options.importLoaders).toBe(sass ? 3 : 1)
  expect(use).toHaveLength((lightning ? 2 : 3) + (sass ? 2 : 0))
})

test('BH-0051 preserves user rules, nested host conditions and manifest JavaScript route', () => {
  const custom = { test: /\.custom$/, use: ['user-loader'] }
  const originalQuery = /inline/
  const config = (withMasterCSS({}) as NextConfig).webpack!({ module: { rules: [custom, { resourceQuery: originalQuery, rules: [{ oneOf: [{ use: [{ loader: nextLoader('postcss-loader') }] }] }] }] } }, {} as never)
  expect(config.module.rules[0]).toBe(custom)
  expect(config.module.rules[1].resourceQuery).toEqual({ and: [originalQuery, { not: [/master-css-manifest/] }] })
  expect(config.module.rules.find((rule: { resourceQuery?: unknown }) => rule.resourceQuery instanceof RegExp && rule.resourceQuery.source === 'master-css-manifest')?.use[0].options).toEqual({ module: true, external: true })
})
