import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { build, type InlineConfig } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'

const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))

async function compile(files: Record<string, string>, entry: string, css?: InlineConfig['css']) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-sass-test-')))
  try {
    mkdirSync(join(root, 'node_modules'))
    symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    for (const [file, text] of Object.entries(files)) {
      mkdirSync(dirname(join(root, file)), { recursive: true })
      writeFileSync(join(root, file), text)
    }
    writeFileSync(join(root, 'entry.js'), entry)
    writeFileSync(join(root, 'index.html'), '<div class="example"></div><script type="module" src="./entry.js"></script>')
    const result = await build({ root, configFile: false, logLevel: 'silent', base: './', css, plugins: [masterCSS({ mode: 'static', runtime: false })], build: { write: false, minify: false } })
    if ('on' in result || Array.isArray(result)) throw new Error('Expected one output bundle')
    return result.output.map(output => output.type === 'asset' ? String(output.source) : output.code).join('\n')
  } finally { rmSync(root, { recursive: true, force: true }) }
}

test('BH-0004 managed and plain Sass invoke additionalData once per source', async () => {
  for (const prefix of ['', '@master entry;@preserve native;']) {
    const additionalData = vi.fn((source: string) => `$paint:blue;${source}`)
    const output = await compile({ 'entry.scss': `${prefix}.example{color:$paint}` }, 'import "./entry.scss"', { preprocessorOptions: { scss: { additionalData } } })
    expect(additionalData).toHaveBeenCalledTimes(1)
    expect(output).toMatch(/color:\s*(?:blue|#00f)/)
    expect(output).not.toContain('$paint')
  }
})

test('BH-0004 Sass preserves qualified CSS imports and nested external import positions', async () => {
  const output = await compile({
    'entry.scss': '@import "./child.css" layer(shared) print;@master entry;@preserve native;.example{color:red}',
    'child.css': '@import "https://external.test/paint.css"; .example{color:blue}'
  }, 'import "./entry.scss"')
  expect(output).toMatch(/layer\(shared\)\s+print/)
  expect(output).toContain('https://external.test/paint.css')
  expect(output).not.toContain('#master-css-slot')
})

test('BH-0004 raw Sass bypasses stylesheet parsing and preprocessing', async () => {
  const additionalData = vi.fn(() => { throw new Error('Raw imports must not execute Sass') })
  const output = await compile({ 'entry.scss': '$paint:blue;.example{color:$paint}' }, 'import source from "./entry.scss?raw"; console.log(source)', { preprocessorOptions: { scss: { additionalData } } })
  expect(additionalData).not.toHaveBeenCalled()
  expect(output).toContain('$paint:blue')
})

test('BH-0004 managed Sass modules retain Vite scoped names and named/default exports', async () => {
  const output = await compile({ 'entry.module.scss': '@master entry;@preserve native;.example{color:blue}.default{color:red}' }, 'import names, { example } from "./entry.module.scss"; console.log(names.example, names.default, example)', { modules: { generateScopedName: 'scoped_[local]' } })
  expect(output).toContain('.scoped_example')
  expect(output).toContain('"scoped_example"')
  expect(output).not.toContain('@master entry')
})
