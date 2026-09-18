import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import MagicString from 'magic-string'
import type { MasterCSSError } from '@master/css-schema'
import { build, type InlineConfig } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))
type BuildDiagnostic = MasterCSSError & { loc?: { file: string, line: number, column: number }, plugin?: string }

async function failure(files: Record<string, string>, request: string, css?: InlineConfig['css']) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-sass-location-')))
  try {
    mkdirSync(join(root, 'node_modules'))
    symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    for (const [file, source] of Object.entries(files)) {
      mkdirSync(dirname(join(root, file)), { recursive: true })
      writeFileSync(join(root, file), source)
    }
    writeFileSync(join(root, 'entry.js'), request.includes('?inline') ? `import css from ${JSON.stringify(request)};console.log(css)` : `import ${JSON.stringify(request)}`)
    writeFileSync(join(root, 'index.html'), '<div class="example"></div><script type="module" src="./entry.js"></script>')
    try {
      await build({ root, configFile: false, logLevel: 'silent', css, plugins: [masterCSS({ mode: 'static', runtime: false })], build: { write: false, minify: false } })
    } catch (error) {
      const item = (error as { errors?: BuildDiagnostic[] }).errors?.[0]
      expect(item?.diagnostics.length).toBeGreaterThan(0)
      return { error: item!, root }
    }
    throw new Error('Expected compiler diagnostic')
  } finally { rmSync(root, { recursive: true, force: true }) }
}

const partial = '// removed Sass comment\n/* 😀 original */\n\n.example {\n  @compose unknown-utility;\n}\n'
const entry = '@use "./nested/bad";\n@master entry;\n@preserve native;\n'

for (const request of ['./style.scss', './style.scss?inline', './entry.css', './style.module.scss']) {
  test(`BH-0004 Sass diagnostic original partial and token: ${request}`, async () => {
    const { error, root } = await failure({ 'nested/_bad.scss': partial, 'style.scss': entry, 'style.module.scss': entry, 'entry.css': '@import "./style.scss";@master entry;' }, request)
    expect(error.diagnostics[0]).toMatchObject({ code: 'invalid-compose-class', source: join(root, 'nested/_bad.scss'), range: { start: { line: 4, character: 11 }, end: { line: 4, character: 26 } } })
    expect(error.loc).toEqual({ file: join(root, 'nested/_bad.scss'), line: 5, column: 11 })
    expect(error.diagnostics[0].notes).toBeUndefined()
  })
}

test('BH-0004 Sass diagnostic preserves original CRLF and UTF-16 positions', async () => {
  const source = '// removed\r\n.example { /* 😀 */ @compose unknown-utility; }\r\n'
  const { error, root } = await failure({ 'nested/_bad.scss': source, 'style.scss': entry }, './style.scss')
  const character = source.split('\r\n')[1]!.indexOf('unknown-utility')
  expect(error.diagnostics[0]).toMatchObject({ source: join(root, 'nested/_bad.scss'), range: { start: { line: 1, character }, end: { line: 1, character: character + 15 } } })
})

test('BH-0004 Sass directive parse error points at the original directive', async () => {
  const source = '// removed\n\n@utilities invalid { paint { color: red; } }\n'
  const { error, root } = await failure({ 'nested/_bad.scss': source, 'style.scss': entry }, './style.scss')
  expect(error.diagnostics[0]).toMatchObject({ code: 'CSS_DIRECTIVE_ERROR', source: join(root, 'nested/_bad.scss'), range: { start: { line: 2, character: 0 }, end: { line: 2, character: 10 } } })
})

test('BH-0004 Sass interpolation reports a mapped segment without inventing a token span', async () => {
  const source = '$name: unknown-utility;\n.example {\n  @compose #{$name};\n}\n'
  const { error, root } = await failure({ 'nested/_bad.scss': source, 'style.scss': entry }, './style.scss')
  expect(error.diagnostics[0]).toMatchObject({ code: 'invalid-compose-class', source: join(root, 'nested/_bad.scss'), range: { start: { line: 2, character: 2 }, end: { line: 2, character: 2 } } })
  expect(error.diagnostics[0].notes).toContain('The source map identifies the originating segment; an exact original token range is unavailable.')
})

test('BH-0004 plain CSS compiler diagnostics retain their original positions', async () => {
  const { error, root } = await failure({ 'style.css': '@master entry;\n.example {\n  @compose unknown-utility;\n}\n' }, './style.css')
  expect(error.diagnostics[0]).toMatchObject({ code: 'invalid-compose-class', source: join(root, 'style.css'), range: { start: { line: 2, character: 11 }, end: { line: 2, character: 26 } } })
  expect(error.diagnostics[0].notes).toBeUndefined()
})

test('BH-0004 consumed directives before a Sass error do not shift its position', async () => {
  const source = '@master entry;\n@preserve native;\n' + partial
  const { error, root } = await failure({ 'nested/_bad.scss': source, 'style.scss': '@use "./nested/bad";' }, './style.scss')
  expect(error.diagnostics[0]).toMatchObject({ source: join(root, 'nested/_bad.scss'), range: { start: { line: 6, character: 11 }, end: { line: 6, character: 26 } } })
})

test('BH-0004 indented Sass maps original partial diagnostics', async () => {
  const source = '// removed\n.example\n  @compose unknown-utility\n'
  const { error, root } = await failure({ '_bad.sass': source, 'style.sass': '@use "./bad"\n@master entry\n' }, './style.sass')
  expect(error.diagnostics[0]).toMatchObject({ source: join(root, '_bad.sass'), range: { start: { line: 2, character: 11 }, end: { line: 2, character: 26 } } })
})

test('BH-0004 string additionalData preserves authored root positions', async () => {
  const { error, root } = await failure({ 'style.scss': partial + '@master entry;' }, './style.scss', { preprocessorOptions: { scss: { additionalData: '$paint: red;\n' } } })
  expect(error.diagnostics[0]).toMatchObject({ source: join(root, 'style.scss'), range: { start: { line: 4, character: 11 }, end: { line: 4, character: 26 } } })
})

for (const additionalData of ['.other { @compose generated-unknown; }\n', (source: string) => '$paint: red;\n' + source]) {
  test(`BH-0004 unmapped additionalData keeps an explicit generated location: ${typeof additionalData}`, async () => {
    const { error, root } = await failure({ 'style.scss': partial + '@master entry;' }, './style.scss', { preprocessorOptions: { scss: { additionalData } } })
    expect(error.diagnostics[0]).toMatchObject({ code: 'invalid-compose-class', source: join(root, 'style.scss.master-css-sass.css') })
    expect(error.diagnostics[0].notes).toContain('Original Sass location is unavailable; this range refers to preprocessed CSS.')
  })
}

test('BH-0004 additionalData callbacks can supply original source maps', async () => {
  const additionalData = (source: string, filename: string) => {
    const text = new MagicString(source).prepend('$paint: red;\n')
    return { content: text.toString(), map: text.generateMap({ source: filename, includeContent: true, hires: true }) }
  }
  const { error, root } = await failure({ 'style.scss': partial + '@master entry;' }, './style.scss', { preprocessorOptions: { scss: { additionalData } } })
  expect(error.diagnostics[0]).toMatchObject({ source: join(root, 'style.scss'), range: { start: { line: 4, character: 11 }, end: { line: 4, character: 26 } } })
})

test('BH-0004 local Sass compose diagnostics also point to the original partial', async () => {
  const { error, root } = await failure({ 'nested/_bad.scss': partial, 'style.scss': '@use "./nested/bad";' }, './style.scss')
  expect(error.plugin).toBe('master-css:local-compose')
  expect(error.diagnostics[0]).toMatchObject({ source: join(root, 'nested/_bad.scss'), range: { start: { line: 4, character: 11 }, end: { line: 4, character: 26 } } })
})
