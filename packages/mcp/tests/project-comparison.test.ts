import { expect, test } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv'
import { mkdtempSync, rmSync, writeFileSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createMasterCSSMCPServer } from '../src/server'

test('MCP captures and compares independently resolved snapshots with validated transport', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-mcp-impact-')))
  writeFileSync(join(root, 'app.css'), '@import "@master/css";@theme{--color-brand:red;--color-information:red}')
  writeFileSync(join(root, 'index.html'), '<div class="bg-brand fg-information"></div>')
  const server = createMasterCSSMCPServer({ root })
  const client = new Client({ name: 'impact-test', version: '1' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  try {
    await Promise.all([server.connect(a), client.connect(b)])
    const tools = (await client.listTools()).tools
    const validator = new AjvJsonSchemaValidator()
    async function call(name: string, args: Record<string, unknown>) {
      const result = await client.callTool({ name, arguments: args })
      expect(result.isError, JSON.stringify(result)).not.toBe(true)
      expect(result.structuredContent).toEqual(JSON.parse((result.content as { text: string }[])[0].text))
      expect(validator.getValidator(tools.find(tool => tool.name === name)!.outputSchema!)(result.structuredContent).valid).toBe(true)
      return (result.structuredContent as any).result.data
    }
    const before = (await call('mastercss_scan_project', { includeSnapshot: true, patterns: ['*.html'] })).snapshot
    writeFileSync(join(root, 'app.css'), '@import "@master/css";@theme{--color-brand:blue;--color-information:red}')
    const after = (await call('mastercss_scan_project', { includeSnapshot: true, patterns: ['*.html'] })).snapshot
    writeFileSync(join(root, 'app.css'), '@import "@master/css";@theme{--color-information:red}')
    const removal = await call('mastercss_scan_project', { includeSnapshot: true, patterns: ['*.html'] })
    expect(removal.summary.errors).toBeGreaterThan(0)
    const removed = await call('mastercss_css_compare', { beforeSnapshot: before, afterSnapshot: removal.snapshot })
    expect(removed.comparison.classes[0]).toMatchObject({ className: 'bg-brand', afterMatchStatus: 'syntax-error', afterRules: [] })
    // Snapshot comparison does not depend on whichever project happens to be active now.
    writeFileSync(join(root, 'app.css'), '@theme{invalid}')
    const result = await call('mastercss_css_compare', { beforeSnapshot: before, afterSnapshot: after })
    expect(result.mode).toBe('project')
    expect(result.comparison.classes.map((item: any) => item.className)).toEqual(['bg-brand'])
    expect(result.comparison.coverage.browser).toBe('not-checked')
    expect((await client.callTool({ name: 'mastercss_css_compare', arguments: { beforeSnapshot: before } })).isError).toBe(true)
    expect((await client.callTool({ name: 'mastercss_css_compare', arguments: { beforeSnapshot: before, afterSnapshot: after, context: 'preset' } })).isError).toBe(true)
  } finally { await client.close(); await server.dispose(); rmSync(root, { recursive: true, force: true }) }
})
