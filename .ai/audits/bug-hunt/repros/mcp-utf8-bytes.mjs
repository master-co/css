import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(join(root, 'packages/mcp/package.json'))
const { Client } = await import(require.resolve('@modelcontextprotocol/sdk/client/index.js'))
const { StdioClientTransport } = await import(require.resolve('@modelcontextprotocol/sdk/client/stdio.js'))
const cwd = mkdtempSync(join(tmpdir(), 'master-css-mcp-utf8-'))
const client = new Client({ name: 'local-utf8-audit', version: '1.0.0' })
const transport = new StdioClientTransport({ command: process.execPath,
  args: [join(root, 'packages/mcp/dist/bin/index.js'), '--root', cwd], stderr: 'pipe' })
const call = async (name, args) => {
  const result = await client.callTool({ name, arguments: args })
  assert(!result.isError, JSON.stringify(result))
  return JSON.parse(result.content.find(part => part.type === 'text').text)
}
try {
  const source = '/* 中文😀 */\n@compose   block   inline ;'
  writeFileSync(join(cwd, 'input.css'), source)
  writeFileSync(join(cwd, 'index.html'), '<div class="content:\'中文😀\'"></div>')
  writeFileSync(join(cwd, 'output.css'), '/* 舊😀 */')
  await client.connect(transport)
  const rendered = await call('mastercss_render_css', { classList: "content:'中文😀'" })
  assert(rendered.css.text.includes('中文😀'))
  assert.equal(rendered.css.bytes, Buffer.byteLength(rendered.css.text))
  const formatted = await call('mastercss_preview_directive_format', { content: source })
  assert.equal(formatted.files[0].beforeBytes, Buffer.byteLength(source))
  assert.equal(formatted.files[0].afterBytes, Buffer.byteLength(formatted.formatted))
  const fileFormat = await call('mastercss_preview_directive_format', { patterns: ['input.css'] })
  assert.equal(fileFormat.files[0].beforeBytes, statSync(join(cwd, 'input.css')).size)
  assert.equal(fileFormat.files[0].afterBytes, fileFormat.preview.summary.bytesAfter)
  assert.equal(readFileSync(join(cwd, 'input.css'), 'utf8'), source)
  await call('mastercss_apply_preview', { confirmToken: fileFormat.preview.confirmToken })
  assert.equal(fileFormat.files[0].afterBytes, statSync(join(cwd, 'input.css')).size)
  const generated = await call('mastercss_preview_fixes', { mode: 'generated-css', patterns: ['index.html'], outputPath: 'output.css' })
  assert.equal(generated.preview.summary.bytesBefore, statSync(join(cwd, 'output.css')).size)
  assert.equal(generated.preview.summary.bytesAfter, generated.scan.css.bytes)
  assert(generated.preview.changes[0].afterText.includes('中文😀'))
  await call('mastercss_apply_preview', { confirmToken: generated.preview.confirmToken })
  assert.equal(generated.preview.summary.bytesAfter, statSync(join(cwd, 'output.css')).size)
  console.log(JSON.stringify({ builtStdio: 'PASS', renderedBytes: rendered.css.bytes,
    formattedBeforeBytes: fileFormat.files[0].beforeBytes, formattedAfterBytes: fileFormat.files[0].afterBytes,
    generatedBeforeBytes: generated.preview.summary.bytesBefore, generatedAfterBytes: generated.preview.summary.bytesAfter,
    appliedFileSizes: 'PASS', previewDidNotWrite: 'PASS' }))
} finally {
  await client.close()
  await transport.close()
  rmSync(cwd, { recursive: true, force: true })
}
