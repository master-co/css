import { expect, test } from 'vitest'
import { createCompilerSync } from '@master/css-compiler/node'
import { prepareBuildStylesheet } from '../../src/utils/build-stylesheet-delivery'
import type { LocalStylesheet } from '../../src/utils/local-stylesheet'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { build } from 'vite'
import masterCSS from '../../src/core'

test('local graph names depend on CSS order and content, not asynchronous registration order', () => {
  using compiler = createCompilerSync()
  const a: LocalStylesheet = { slot: '#local-a{--slot:0}', result: {
    code: '@import "./child-a.css" layer(a);.target{color:red}', transformed: true, diagnostics: [], dependencies: [],
    stylesheets: [{ id: 'a', href: './child-a.css', css: '@import "https://external.test/a.css";.a{padding:1rem}' }]
  } }
  const b: LocalStylesheet = { slot: '#local-b{--slot:0}', result: {
    code: '@import "./child-b.css" layer(b);.target{color:blue}', transformed: true, diagnostics: [], dependencies: [],
    stylesheets: [{ id: 'b', href: './child-b.css', css: '@import "https://external.test/b.css";.b{padding:2rem}' }]
  } }
  const extracted = { css: '', stylesheets: [], diagnostics: [], emittedGlobals: { variables: {}, animations: {} } }
  const source = a.slot + '.between{display:block}' + b.slot
  const prepare = (source: string, locals: LocalStylesheet[]) => prepareBuildStylesheet(compiler, source, '#managed{--slot:0}', extracted, locals)
  const first = prepare(source, [a, b])
  expect(first).toBeDefined()
  expect(prepare(source, [b, a])).toEqual(first)
  expect(prepare(b.slot + '.between{display:block}' + a.slot, [a, b])?.source).not.toBe(first?.source)
  expect(prepare(source, [a, { ...b, result: { ...b.result, code: b.result.code.replace('blue', 'green') } }])?.source).not.toBe(first?.source)
  expect(first?.assets.map(asset => asset.css).join('\n')).not.toContain('--slot:0')
})

test('Vite CSS optimization cannot merge two local entry placeholders', async () => {
  const parent = join(process.cwd(), 'tmp'); mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, 'local-optimized-slots-'))
  try {
    writeFileSync(join(root, 'a.css'), '.a{@compose block;}')
    writeFileSync(join(root, 'b.css'), '.b{@compose inline-flex;}')
    writeFileSync(join(root, 'entry.js'), 'import "./a.css";import "./b.css";')
    writeFileSync(join(root, 'index.html'), '<script type="module" src="./entry.js"></script>')
    const result = await build({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static' }), build: { write: false } })
    if (Array.isArray(result) || 'on' in result) throw new Error('Expected one build output')
    const css = result.output.filter(asset => asset.type === 'asset' && asset.fileName.endsWith('.css')).map(asset => asset.type === 'asset' ? String(asset.source) : '').join('\n')
    expect(css).toContain('.a{display:block}')
    expect(css).toContain('.b{display:inline-flex}')
    expect(css).not.toContain('#master-css-local-')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
