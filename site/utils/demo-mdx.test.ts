import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parse } from 'acorn'
import remarkSiteDemos, { withSiteDemos } from './demo-mdx.js'

function statement(value: string) {
  return { type: 'mdxjsEsm', value, data: { estree: parse(value, { ecmaVersion: 'latest', sourceType: 'module' }) } }
}

test('site demo registration takes precedence over shared MDX auto-imports', () => {
  const keep = [statement("import Code from 'internal/components/Code'"), statement("import Demo from '~/site/components/demo/Demo'"), { type: 'mdxJsxFlowElement', name: 'Demo' }]
  const tree = { children: [...['Demo', 'DemoPanel', 'DemoP', 'DemoLabel', 'BrowserHeader', 'IFrame', 'HelloWorld'].map(name => statement(`import ${name} from 'internal/components/${name}'`)), ...keep] }
  remarkSiteDemos()(tree)
  assert.deepEqual(tree.children, keep)
})

test('site demo MDX adapter preserves the existing pipeline in both bundlers', async () => {
  const loader = { loader: 'mdx-js-loader', options: { remarkPlugins: ['/internal/remark/auto-imports.js'] } }
  const original = {
    turbopack: { rules: { mdx: [{ loaders: [loader], as: '*.tsx' }] } },
    webpack: (config: any) => ({ ...config, module: { rules: [{ use: [loader] }] } }),
  }
  const adapted = withSiteDemos(original)
  const turboPlugins = adapted.turbopack.rules.mdx[0].loaders[0].options.remarkPlugins
  const webpackPlugins = (await adapted.webpack({})).module.rules[0].use[0].options.remarkPlugins
  assert.deepEqual(turboPlugins, webpackPlugins)
  assert.equal(turboPlugins.length, 2)
  assert.match(turboPlugins[1], /site\/utils\/demo-mdx\.js$/)
  assert.deepEqual(loader.options.remarkPlugins, ['/internal/remark/auto-imports.js'])
})
