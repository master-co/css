import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { resolveStylesheetSync, inspectCSSSync } from '../../../../packages/compiler/dist/node.js'
import { compileRenderedStylesheet } from '../../../../packages/compiler/dist/stylesheet/index-public.js'
import nextLoader from '../../../../packages/next/dist/stylesheet-loader.js'
const require = createRequire(new URL('../../../../packages/compiler/package.json', import.meta.url))
const baseManifest = require('@master/css-preset/default-manifest.json')
const root = mkdtempSync(join(tmpdir(), 'next-entry-reference-')), rows = []
function record(value) { rows.push(value);console.log(JSON.stringify(value)) }
try {
  const token = join(root, 'tokens.css'), file = join(root, 'entry.css')
  writeFileSync(token, '@utilities{paint{padding:2rem}}')
  const source = '@master entry;@reference "./tokens.css";.card{@compose paint;}'
  const resolution = resolveStylesheetSync(file, source, { projectDir: root })
  record({ file, source, resolution, referenceRetained: resolution.compilationSource.includes('@reference'), beforeInspection: inspectCSSSync(source), afterInspection: inspectCSSSync(resolution.compilationSource) })
  for (const [label, input] of [['original', source], ['flattened', resolution.compilationSource]]) {
    try {
      const result = await compileRenderedStylesheet(file, input, { baseManifest, projectDir: root, preserveNativeCSS: true })
      record({ label, css: result.css, dependencies: result.dependencies })
    } catch(error) { record({ label, error: String(error), diagnostics: error.diagnostics }) }
  }
  const dependencies = []
  try {
    const css = await new Promise((resolve, reject) => nextLoader.call({ resourcePath: file, rootContext: root, addDependency: file => dependencies.push(file), async: () => (error, css) => error ? reject(error) : resolve(css) }, source))
    record({ label: 'actualNextLoader', css, dependencies })
  } catch(error) { record({ label: 'actualNextLoader', error: String(error), diagnostics: error.diagnostics, dependencies }) }
  if (process.env.BH_EXPECT_ENTRY_FIXED === '1') {
    for (const label of ['original', 'actualNextLoader']) {
      const row = rows.find(row => row.label === label)
      assert.ok(row.css?.includes('.card{padding:2rem}'), JSON.stringify(row))
      assert.ok(row.dependencies.includes(token))
    }
    assert.match(rows.find(row => row.label === 'flattened').error, /Invalid @compose class/)
    record({ summary: 'PASS', positiveControls: 2, expectedNegativeControls: 1 })
  }
} finally { rmSync(root, { recursive: true, force: true }) }
