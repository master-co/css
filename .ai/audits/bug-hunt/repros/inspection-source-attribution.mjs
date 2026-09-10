import assert from 'node:assert/strict'
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { createRequire } from 'node:module'
import { createMasterCSSInspectionReport } from '../../../../packages/compiler/dist/diagnostics/index.js'
const require = createRequire(new URL('../../../../packages/compiler/package.json', import.meta.url))
const manifest = require('@master/css-preset/default-manifest.json')
const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-attribution-')))
try {
  writeFileSync(join(cwd, 'a.js'), 'document.body.className = "inline"')
  writeFileSync(join(cwd, 'b.js'), 'document.body.className = "block text-decoration:bad()"')
  const report = await createMasterCSSInspectionReport({ manifest, cwd, includeCss: true })
  const files = Object.fromEntries(report.files.map((f) => [basename(f.filePath), f.discovered]))
  console.log(JSON.stringify({ files, diagnostics: report.diagnostics, css: report.css.text }))
  assert.deepEqual(files['a.js'].valid, ['inline'])
  assert.deepEqual(files['a.js'].invalid, [])
  assert.deepEqual(files['b.js'].valid, ['block'])
  assert.deepEqual(files['b.js'].invalid, ['text-decoration:bad()'])
  const invalid = report.diagnostics.find((d) => d.code === 'invalid-scanner-class')
  assert.equal(basename(invalid.filePath), 'b.js')
} finally { rmSync(cwd, { recursive: true, force: true }) }
