import assert from 'node:assert/strict'
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
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
const js = (classes) => `document.body.className = "${classes}"`
const cases = [
  { name: 'unique', files: { 'a.js': js('inline'), 'b.js': js('block text-decoration:bad()') }, valid: { 'a.js': ['inline'], 'b.js': ['block'] }, invalid: ['b.js'], owners: ['b.js'] },
  { name: 'repeated', files: { 'a.js': js('block text-decoration:bad()'), 'b.mjs': js('block text-decoration:bad()'), 'c.html': '<div class="inline"></div>' }, valid: { 'a.js': ['block'], 'b.mjs': ['block'], 'c.html': ['inline'] }, invalid: ['a.js', 'b.mjs'], owners: ['a.js', 'b.mjs'] },
  { name: 'asynchronous-adapters', files: { 'a.vue': '<template><div class="block flex"></div></template>', 'b.svelte': '<div class="block grid"></div>', 'c.html': '<div class="inline"></div>' }, valid: { 'a.vue': ['block', 'flex'], 'b.svelte': ['block', 'grid'], 'c.html': ['inline'] }, invalid: [], owners: ['a.vue', 'b.svelte'] }
]
let pass = 0
for (const entry of cases) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-attribution-stdio-')))
  const client = new Client({ name: 'bug-hunt-attribution', version: '1.0.0' })
  const transport = new StdioClientTransport({ command: process.execPath,
    args: [join(repository, 'packages/mcp/dist/bin/index.js'), '--root', root], stderr: 'pipe' })
  const call = async (name, args) => {
    const response = await client.callTool({ name, arguments: args })
    assert.notEqual(response.isError, true, JSON.stringify(response))
    return JSON.parse(response.content.find((item) => item.type === 'text').text)
  }
  try {
    for (const [file, content] of Object.entries(entry.files)) writeFileSync(join(root, file), content)
    await client.connect(transport)
    for (const order of ['default', 'reverse']) {
      const patterns = order === 'reverse' ? Object.keys(entry.files).reverse() : undefined
      for (const operation of ['compiler', 'mcp-scan']) {
        const report = operation === 'compiler'
          ? await createMasterCSSInspectionReport({ manifest, cwd: root, patterns, includeCss: true })
          : await call('mastercss_scan_project', { ...(patterns ? { patterns } : {}), includeCss: true })
        const actual = Object.fromEntries(report.files.map((file) => [basename(file.filePath), file.discovered.valid]))
        assert.deepEqual(actual, entry.valid)
        for (const file of report.files) {
          assert.deepEqual(file.discovered.invalid, entry.invalid.includes(basename(file.filePath)) ? ['text-decoration:bad()'] : [])
        }
        const firstInvalid = report.files.find((file) => entry.invalid.includes(basename(file.filePath)))
        const warning = report.diagnostics.find((d) => d.code === 'invalid-scanner-class')
        assert.equal(warning?.filePath, firstInvalid?.filePath)
        assert(report.css.text.includes('.block{display:block}'))
        console.log(JSON.stringify({ case: entry.name, order, operation, files: actual, warningFile: warning?.filePath, status: 'PASS' }))
        pass++
      }
      for (const className of ['block', ...(entry.invalid.length ? ['text-decoration:bad()'] : [])]) {
        const trace = await call('mastercss_trace_class', { ...(patterns ? { patterns } : {}), className, includeCss: true })
        assert.equal(trace.detected, true)
        assert.equal(trace.status, className === 'block' ? 'present' : 'missing')
        assert.deepEqual(trace.occurrences.map((file) => basename(file.filePath)).sort(), className === 'block' ? entry.owners : entry.invalid)
        console.log(JSON.stringify({ case: entry.name, order, operation: 'mcp-trace', className, occurrences: trace.occurrences, status: 'PASS' }))
        pass++
      }
    }
  } finally {
    await client.close()
    await transport.close()
    rmSync(root, { recursive: true, force: true })
  }
}
console.log(JSON.stringify({ pass, fail: 0 }))
