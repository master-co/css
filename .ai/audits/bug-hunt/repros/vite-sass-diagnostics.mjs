import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { inspect } from 'node:util'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build, preprocessCSS, resolveConfig } = await import(require.resolve('vite'))
const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-sass-diagnostic-'))), rows = []
const partial = '// removed Sass comment\n/* 😀 original */\n\n.example {\n  @compose unknown-utility;\n}\n'
try {
  mkdirSync(join(root, 'node_modules'))
  symlinkSync(dirname(createRequire(require.resolve('vite')).resolve('sass')), join(root, 'node_modules/sass'), 'dir')
  writeFileSync(join(root, '_bad.scss'), partial)
  writeFileSync(join(root, 'style.scss'), '@use "./bad";\n@master entry;\n@preserve native;\n')
  writeFileSync(join(root, 'entry.css'), '@import "./style.scss";\n@master entry;\n@preserve native;\n')
  writeFileSync(join(root, 'index.html'), '<div class="example"></div><script type="module" src="./entry.js"></script>')
  for (const [index, request] of ['./style.scss', './style.scss?inline', './entry.css'].entries()) {
    writeFileSync(join(root, 'entry.js'), request.includes('?') ? `import css from ${JSON.stringify(request)};window.css=css` : `import ${JSON.stringify(request)}`)
    let error
    try { await build({ root, configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode: 'static', runtime: false }), build: { write: false, minify: false } }) } catch (caught) { error = caught }
    const text = inspect(error, { depth: 8, colors: false })
    console.log(JSON.stringify({ phase: 'error-properties', request, errors: error?.errors?.map(item => ({ ...item, cause: undefined })) }))
    const item = error?.errors?.[0]
    let pass = false
    try {
      assert.equal(item?.diagnostics?.[0]?.code, 'invalid-compose-class')
      assert.equal(item.diagnostics[0].source, join(root, '_bad.scss'))
      assert.deepEqual(item.diagnostics[0].range, { start: { line: 4, character: 11 }, end: { line: 4, character: 26 } })
      assert.deepEqual(item.loc, { file: join(root, '_bad.scss'), line: 5, column: 11 })
      pass = true
    } catch {}
    const row = { index, request, expectedFile: join(root, '_bad.scss'), expectedLine: 5, expectedColumn: 11, error: text, result: pass ? 'PASS' : 'FAIL' }; rows.push(row); console.log(JSON.stringify(row))
  }
  const preparedCodes = []
  for (const devSourcemap of [false, true]) {
    const config = await resolveConfig({ root, configFile: false, css: { devSourcemap, preprocessorOptions: { scss: { sourceMapIncludeSources: true } } } }, 'build')
    const prepared = await preprocessCSS('@use "./bad";\n@master entry;', join(root, 'style.scss'), config)
    console.log(JSON.stringify({ phase: 'map-capability', devSourcemap, code: prepared.code, map: prepared.map }))
    preparedCodes.push(prepared.code)
  }
  assert.equal(preparedCodes[0], preparedCodes[1])
  writeFileSync(join(root, '_bad.scss'), '// removed\n.example { color: red; }\n')
  writeFileSync(join(root, 'entry.js'), 'import "./style.scss"')
  const cssOutputs = []
  for (const sourcemap of [false, true]) {
    const result = await build({ root, configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode: 'static', runtime: false }), build: { write: false, minify: false, sourcemap } })
    const maps = result.output.filter(item => item.fileName.endsWith('.map')).map(item => item.fileName)
    const css = result.output.filter(item => item.type === 'asset' && item.fileName.endsWith('.css')).map(item => String(item.source).replace(/\s*\/\*# sourceMappingURL=.*?\*\//g, '')).join('\n')
    assert.match(css, /color:\s*(?:red|#f00)/)
    if (!sourcemap) assert.deepEqual(maps, [])
    cssOutputs.push(css)
    console.log(JSON.stringify({ phase: 'published-maps', sourcemap, maps, css, result: 'PASS' }))
  }
  assert.equal(cssOutputs[0], cssOutputs[1])
  const summary = { builds: 5, diagnosticComparisons: rows.length, publicationComparisons: cssOutputs.length, failures: rows.filter(row => row.result === 'FAIL').length }
  console.log(JSON.stringify(summary)); assert.equal(summary.failures, 0)
} finally { rmSync(root, { recursive: true, force: true }) }
