import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(join(root, 'packages/mcp/package.json'))
const { Client } = await import(require.resolve('@modelcontextprotocol/sdk/client/index.js'))
const { StdioClientTransport } = await import(require.resolve('@modelcontextprotocol/sdk/client/stdio.js'))
const cwd = mkdtempSync(join(tmpdir(), 'master-css-bh-mcp-'))
const client = new Client({ name: 'bug-hunt-local-test', version: '1.0.0' })
const transport = new StdioClientTransport({ command: process.execPath,
    args: [join(root, 'packages/mcp/dist/bin/index.js'), '--root', cwd], stderr: 'pipe' })
try {
    await client.connect(transport)
    const tools = await client.listTools()
    const resources = await client.listResources()
    assert(tools.tools.length > 0)
    assert(resources.resources.length > 0)
    console.log(JSON.stringify({ tools: tools.tools.length, resources: resources.resources.length }))
} finally {
    await client.close()
    await transport.close()
    rmSync(cwd, { recursive: true, force: true })
}
console.log('stdio initialization, protocol parsing and close PASS')
