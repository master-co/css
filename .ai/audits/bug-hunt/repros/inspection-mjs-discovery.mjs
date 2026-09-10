import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createMasterCSSInspectionReport } from '../../../../packages/compiler/dist/diagnostics/index.js'
const repository = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(new URL('../../../../packages/mcp/package.json', import.meta.url))
const manifest = require('@master/css-preset/default-manifest.json')
const { Client } = await import(require.resolve('@modelcontextprotocol/sdk/client/index.js'))
const { StdioClientTransport } = await import(require.resolve('@modelcontextprotocol/sdk/client/stdio.js'))
const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-inspection-mjs-')))
const client = new Client({ name: 'bug-hunt-mjs', version: '1.0.0' })
const transport = new StdioClientTransport({ command: process.execPath,
  args: [join(repository, 'packages/mcp/dist/bin/index.js'), '--root', root], stderr: 'pipe' })
const results = []
try {
  writeFileSync(join(root, 'entry.mjs'), 'document.body.className = "block"')
  writeFileSync(join(root, 'control.js'), 'document.body.className = "inline"')
  mkdirSync(join(root, 'node_modules'))
  writeFileSync(join(root, 'node_modules/ignored.mjs'), 'document.body.className = "hidden"')
  await client.connect(transport)
  for (const mode of ['default', 'explicit-mjs', 'explicit-js']) {
    const patterns = mode === 'default' ? undefined : [mode === 'explicit-mjs' ? 'entry.mjs' : 'control.js']
    const expectedFiles = mode === 'default' ? ['control.js', 'entry.mjs'] : patterns
    const className = mode === 'explicit-js' ? 'inline' : 'block'
    for (const operation of ['compiler', 'scan', 'extract', 'trace']) {
      let report
      try {
        if (operation === 'compiler') {
          report = await createMasterCSSInspectionReport({ manifest, cwd: root, patterns, includeCss: true })
        } else {
          const tool = { scan: 'mastercss_scan_project', extract: 'mastercss_extract_classes', trace: 'mastercss_trace_class' }[operation]
          const args = { ...(patterns ? { patterns } : {}), ...(operation === 'trace' ? { className } : {}), ...(operation !== 'extract' ? { includeCss: true } : {}) }
          const response = await client.callTool({ name: tool, arguments: args })
          assert.notEqual(response.isError, true, JSON.stringify(response))
          report = JSON.parse(response.content.find((item) => item.type === 'text').text)
        }
        if (operation === 'trace') {
          assert.equal(report.detected, true)
          assert.equal(report.status, 'present')
          assert.deepEqual(report.occurrences.map((f) => basename(f.filePath)), [className === 'block' ? 'entry.mjs' : 'control.js'])
        } else {
          assert.deepEqual(report.files.map((f) => basename(f.filePath)).sort(), expectedFiles)
        }
        if (operation === 'extract') {
          const classes = report.files.flatMap((f) => f.classes.map((c) => c.token))
          assert(classes.includes(className))
          assert(!classes.includes('hidden'))
        } else {
          assert(report.css.text.includes(`display:${className}`))
          assert(!report.css.text.includes('display:none'))
        }
        results.push({ operation, mode, status: 'PASS' })
      } catch (error) {
        results.push({ operation, mode, status: 'FAIL', error: error.message,
          files: report?.files?.map((f) => basename(f.filePath)), css: report?.css?.text, detected: report?.detected })
      }
    }
  }
} finally {
  await client.close()
  await transport.close()
  rmSync(root, { recursive: true, force: true })
}
for (const result of results) console.log(JSON.stringify(result))
const failed = results.filter((r) => r.status === 'FAIL').length
console.log(JSON.stringify({ pass: results.length - failed, fail: failed }))
process.exitCode = failed ? 1 : 0
