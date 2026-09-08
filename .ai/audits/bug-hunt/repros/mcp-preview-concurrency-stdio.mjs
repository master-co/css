import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repository = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(join(repository, 'packages/mcp/package.json'))
const { Client } = await import(require.resolve('@modelcontextprotocol/sdk/client/index.js'))
const { StdioClientTransport } = await import(require.resolve('@modelcontextprotocol/sdk/client/stdio.js'))
const root = mkdtempSync(join(tmpdir(), 'mastercss-stdio-race-'))
const clients = [0, 1].map(index => new Client({ name: `preview-race-${index}`, version: '1.0.0' }))
const temporaryDirectories = clients.map((_, i) => join(root, `tmp-${i}`))
temporaryDirectories.forEach(directory => mkdirSync(directory))
const transports = clients.map((_, i) => new StdioClientTransport({ command: process.execPath,
  args: [join(repository, 'packages/mcp/dist/bin/index.js'), '--root', root], stderr: 'pipe', env: { TMPDIR: temporaryDirectories[i] } }))
const rows = []
const call = (i, name, args) => clients[i].callTool({ name, arguments: args })
const preview = async (i, name) => {
  const result = await call(i, 'mastercss_preview_directive_format', { patterns: [name] })
  assert(!result.isError)
  return JSON.parse(result.content.find(part => part.type === 'text').text).preview.confirmToken
}
try {
  await Promise.all(clients.map((client, i) => client.connect(transports[i])))
  assert.notEqual(transports[0].pid, transports[1].pid)
  for (const mode of ['same-token', 'two-processes']) for (let round = 0; round < 10; round++) {
    const file = join(root, 'input.css')
    writeFileSync(file, '@compose block   inline;')
    const first = await preview(0, 'input.css')
    const second = mode === 'same-token' ? first : await preview(1, 'input.css')
    const responses = await Promise.all([
      call(0, 'mastercss_apply_preview', { confirmToken: first }),
      call(mode === 'same-token' ? 0 : 1, 'mastercss_apply_preview', { confirmToken: second })
    ])
    assert.equal(responses.filter(result => !result.isError).length, 1)
    assert.equal(readFileSync(file, 'utf8'), '@compose block inline;')
    rows.push({ mode, round, accepted: 1, errors: responses.filter(result => result.isError).map(result => result.content) })
  }
  console.log(JSON.stringify({ builtStdio: 'PASS', pids: transports.map(transport => transport.pid), distinctTMPDIRs: true, rows }))
} finally {
  await Promise.all(clients.map(client => client.close()))
  await Promise.all(transports.map(transport => transport.close()))
  rmSync(root, { recursive: true, force: true })
}
