import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { build, type InlineConfig } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))

async function compile(extension: string, source: string, script: string, modules: NonNullable<InlineConfig['css']>['modules'] = { generateScopedName: 'scoped_[local]' }, shared = '.shared { color: blue; }') {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-modules-test-')))
  try {
    mkdirSync(join(root, 'node_modules'))
    symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    writeFileSync(join(root, `style.module.${extension}`), source)
    writeFileSync(join(root, 'shared.module.css'), shared)
    writeFileSync(join(root, 'entry.js'), script)
    writeFileSync(join(root, 'index.html'), '<div class="global example"></div><script type="module" src="./entry.js"></script>')
    const result = await build({ root, configFile: false, logLevel: 'silent', css: { modules }, plugins: [masterCSS({ mode: 'static', runtime: false })], build: { write: false, minify: false } })
    if ('on' in result || Array.isArray(result)) throw new Error('Expected one output bundle')
    return {
      css: result.output.filter(output => output.type === 'asset' && output.fileName.endsWith('.css')).map(output => output.type === 'asset' ? String(output.source) : '').join('\n'),
      js: result.output.filter(output => output.type === 'chunk').map(output => output.code).join('\n')
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
}

test('BH-0004 managed CSS Modules preserve named/default exports and global selectors', async () => {
  const output = await compile('css', '@master entry;@preserve native;.example{color:blue}:global(.global){background-color:red}', 'import names, {example} from "./style.module.css";console.log(names.example,example)')
  expect(output.js).toContain('scoped_example')
  expect(output.css).toContain('.scoped_example')
  expect(output.css).toContain('.global')
  expect(output.css).not.toContain(':global')
})

test('BH-0004 managed CSS Modules keep cross-file composed exports and CSS', async () => {
  const output = await compile('css', '@master entry;@preserve native;.example{composes:shared from "./shared.module.css";background-color:red}', 'import names, {example} from "./style.module.css";console.log(names.example,example)')
  expect(output.js).toContain('scoped_example scoped_shared')
  expect(output.css).toContain('.scoped_shared')
  expect(output.css).not.toContain('composes:')
})

for (const extension of ['css', 'scss']) test(`BH-0004 ${extension} Modules retain referenced scoped CSS under default pruning`, async () => {
  const output = await compile(extension, '@master entry;.example{composes:shared from "./shared.module.css";background-color:red}', `import names from "./style.module.${extension}";document.body.className=names.example`)
  expect(output.css).toContain('.scoped_example')
  expect(output.css).toContain('.scoped_shared')
})

test('BH-0004 CSS Modules localsConvention applies to exported names', async () => {
  const output = await compile('css', '@master entry;@preserve native;.dash-name{color:blue}', 'import names, {dashName} from "./style.module.css";console.log(names.dashName,dashName)', { generateScopedName: 'scoped_[local]', localsConvention: 'camelCaseOnly' })
  expect(output.js).toContain('scoped_dash-name')
  expect(output.css).toContain('.scoped_dash-name')
})

test('BH-0004 disabling CSS Modules keeps the native CSS entry path', async () => {
  const output = await compile('css', '@master entry;.example{color:blue}', 'import "./style.module.css"', false)
  expect(output.css).toContain('.example')
  expect(output.css).not.toContain('scoped_')
})

test('BH-0004 managed CSS Modules inline requests keep the scoped stylesheet string', async () => {
  const output = await compile('css', '@master entry;@preserve native;.example{color:blue}', 'import css from "./style.module.css?inline";console.log(css)')
  expect(output.js).toContain('.scoped_example')
  expect(output.js).toMatch(/color:\s*(?:blue|#00f)/)
  expect(output.js).not.toContain('#master-css-slot')
})

test('BH-0004 CSS Modules compiler errors retain authored directive locations', async () => {
  await expect(compile('css', '@master entry;\n.example {\n  @compose unknown-utility;\n}', 'import names from "./style.module.css";console.log(names)')).rejects.toMatchObject({
    errors: [{ diagnostics: [{ code: 'invalid-compose-class', source: expect.stringMatching(/\/style\.module\.css$/), range: { start: { line: 2, character: 11 }, end: { line: 2, character: 26 } } }] }]
  })
})

test('BH-0004 unattributed composed Module content does not invent an original filename', async () => {
  await expect(compile('css', '@master entry;.example{composes:shared from "./shared.module.css"}', 'import names from "./style.module.css";console.log(names)', undefined, '.shared{@compose unknown-utility;}')).rejects.toMatchObject({
    errors: [{ diagnostics: [{ code: 'invalid-compose-class', source: expect.stringMatching(/\/style\.module\.css\.master-css-sass\.css$/), notes: ['Original CSS Modules location is unavailable; this range refers to preprocessed CSS.'] }] }]
  })
})
