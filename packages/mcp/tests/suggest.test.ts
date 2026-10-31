import { test, expect } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv'
import { mkdtempSync, rmSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createMasterCSSMCPServer } from '../src/server'

test('suggestions expose output checks, retain uncertain CSS, and never fall back from a missing project', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-suggest-'))
  const server = createMasterCSSMCPServer({ root })
  const client = new Client({ name: 'suggest-test', version: '1' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  try {
    await Promise.all([server.connect(a), client.connect(b)])
    const tool = (await client.listTools()).tools.find(tool => tool.name === 'mastercss_suggest_classes')!
    const validate = new AjvJsonSchemaValidator().getValidator(tool.outputSchema!)
    const call = (declarations: string, context?: 'preset') => client.callTool({ name: tool.name, arguments: { declarations, ...(context ? { context } : {}) } })
    const response = await call('display:flex; padding:16px;', 'preset')
    expect(response.isError).not.toBe(true)
    expect(validate(response.structuredContent).valid).toBe(true)
    expect(response.structuredContent).toEqual(JSON.parse((response.content as { text: string }[])[0].text))
    expect(response.structuredContent).toMatchObject({ metadata: { context: 'preset' }, result: { data: {
      classes: ['flex', 'p(16)'], remainingCss: '', verification: { declarations: true, cascade: false, browser: false },
      validation: [{ className: 'flex', cssValueStatus: 'valid' }, { className: 'p(16)', cssValueStatus: 'valid' }]
    } } })
    const preserved = await call('padding:1rem;padding-left:0', 'preset')
    expect(validate(preserved.structuredContent).valid).toBe(true)
    expect(preserved.structuredContent).toMatchObject({ result: { data: { status: 'preserved', classes: [], remainingCss: 'padding:1rem;padding-left:0' } } })
    expect((await call('display:flex')).isError).toBe(true)
    expect(readdirSync(root)).toEqual([])
  } finally {
    await client.close()
    await server.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})
