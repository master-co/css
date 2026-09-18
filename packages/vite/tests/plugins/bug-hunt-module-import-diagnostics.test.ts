import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
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
      await build({ root, cacheDir: join(root, '.vite'), configFile: false, logLevel: 'silent', css, plugins: [masterCSS({ mode: 'static', runtime: false })], build: { write: false, minify: false } })
    } catch (error) {
      const item = (error as { errors?: BuildDiagnostic[] }).errors?.[0]
      expect(item?.diagnostics.length).toBeGreaterThan(0)
      return { error: item!, root }
    }
    throw new Error('Expected compiler diagnostic')
  } finally { rmSync(root, { recursive: true, force: true }) }
}

const cases = ['css', 'scss'].flatMap(rootExtension => ['css', 'scss'].map(childExtension => ({ rootExtension, childExtension })))
test.each(cases)('imported Module diagnostics identify their real source $rootExtension / $childExtension', async ({ rootExtension, childExtension }) => {
  const child = childExtension === 'scss' ? '// removed\n$unused: 1;\n.bad {\n  @compose unknown-utility;\n}\n' : '/* original 😀 */\n.bad {\n  @compose unknown-utility;\n}\n'
  const { error, root } = await failure({ [`style.module.${rootExtension}`]: `@import "./nested/child.${childExtension}" layer(guard);`, [`nested/child.${childExtension}`]: child }, `./style.module.${rootExtension}`)
  console.log(JSON.stringify({ rootExtension, childExtension, diagnostics: error.diagnostics, loc: error.loc }))
  const diagnostic = error.diagnostics[0]
  expect(diagnostic.source).not.toContain('\0')
  expect(diagnostic.source).toContain(join(root, `nested/child.${childExtension}`))
  if (childExtension === 'css') {
    expect(diagnostic.source).toBe(join(root, 'nested/child.css'))
    expect(diagnostic.range).toEqual({ start: { line: 2, character: 11 }, end: { line: 2, character: 26 } })
    expect(diagnostic.notes).toBeUndefined()
  } else {
    // Vite's imported Sass preprocessing must either provide an original range
    // or explicitly identify the generated location; never invent precision.
    const exact = diagnostic.source === join(root, 'nested/child.scss') && diagnostic.range?.start.line === 3 && diagnostic.range.start.character === 11
    expect(exact || diagnostic.notes?.some(note => note.includes('preprocessed CSS'))).toBe(true)
  }
})
