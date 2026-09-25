import { expect, test } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv'
import { createMasterCSSMCPServer } from '../src/server'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

test('tools/list schemas validate success and errors without hidden refinements', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-mcp-schema-'))
  const server = createMasterCSSMCPServer({ root })
  const client = new Client({ name: 'schema-test', version: '1' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  try {
    await Promise.all([server.connect(a), client.connect(b)])
    const listed = await client.listTools()
    const validator = new AjvJsonSchemaValidator()
    for (const tool of listed.tools) {
      expect(tool.outputSchema?.required).toEqual(['version', 'metadata', 'diagnostics', 'result'])
      const validate = validator.getValidator(tool.outputSchema!)
      const error = { version: 3, metadata: { versions: null, context: null, manifestFingerprint: null, entries: [], dependencies: [] }, diagnostics: [], result: { status: 'error', error: { code: 'TEST', message: 'Expected' } } }
      expect(validate(error).valid).toBe(true)
      expect(validate({ ...error, result: { status: 'success', data: {} } }).valid).toBe(false)
      expect(validate({ ...error, result: { status: 'error', error: { code: 'TEST' } } }).valid).toBe(false)
    }
    const response = await client.callTool({ name: 'mastercss_inspect_class', arguments: { className: 'fg-red', context: 'preset' } })
    expect(response.isError).not.toBe(true)
    expect(response.structuredContent).toEqual(JSON.parse((response.content as { text: string }[])[0].text))
    const tool = listed.tools.find(tool => tool.name === 'mastercss_inspect_class')!
    const validate = validator.getValidator(tool.outputSchema!)
    const malformed = structuredClone(response.structuredContent) as any
    malformed.result.data.rules = [{}]
    expect(validate(malformed).valid).toBe(false)
    malformed.result.data.rules = []
    malformed.result.data.variables = [{ key: 'red', variable: {} }]
    expect(validate(malformed).valid).toBe(false)
  } finally { await client.close(); await server.dispose(); rmSync(root, { recursive: true, force: true }) }
})
