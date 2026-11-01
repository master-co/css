import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv'
import { expect, test } from 'vitest'
import { createMasterCSSMCPServer } from '../src/server'

test('scan opts into authored stylesheet policy reports with validated MCP transport', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-mcp-design-')))
  const nativeSource = '/* 😀 */ @media(width>600px){.card{color:var(--color-brand);background:var(--external, var(--color-next));padding:13px}}'
  writeFileSync(join(root, 'app.css'), '@import "@master/css";@import "./native.css";@theme{--color-brand:red;--color-next:blue;--font-family-brand:Brand;--font-size-brand:1rem}')
  writeFileSync(join(root, 'native.css'), nativeSource)
  writeFileSync(join(root, 'index.html'), '<div class="card fg-brand"></div>')
  const server = createMasterCSSMCPServer({ root })
  const client = new Client({ name: 'design-system-test', version: '1' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  try {
    await Promise.all([server.connect(a), client.connect(b)])
    const tool = (await client.listTools()).tools.find(tool => tool.name === 'mastercss_scan_project')!
    const validate = new AjvJsonSchemaValidator().getValidator(tool.outputSchema!)
    const call = async (extra: Record<string, unknown>) => {
      const result = await client.callTool({ name: tool.name, arguments: { patterns: ['index.html'], ...extra } })
      expect(result.isError, JSON.stringify(result)).not.toBe(true)
      expect(result.structuredContent).toEqual(JSON.parse((result.content as { text: string }[])[0].text))
      expect(validate(result.structuredContent).valid).toBe(true)
      return result.structuredContent as any
    }
    const original = await call({ includeSnapshot: true })
    expect(original.result.data).not.toHaveProperty('designSystem')
    const response = await call({
      includeSnapshot: true,
      designSystem: {
        version: 1,
        metadata: { '--color-brand': { description: 'Legacy brand', deprecated: true, replacement: '--color-next' } },
        rawValuePolicy: { requireProperties: ['padding'] }
      }
    })
    const data = response.result.data
    expect(data.snapshot).toEqual(original.result.data.snapshot)
    expect(data.css).toEqual(original.result.data.css)
    expect(data.designSystem.tokens).toContainEqual({ name: '--color-brand', metadata: { description: 'Legacy brand', deprecated: true, replacement: '--color-next' } })
    expect(data.designSystem.diagnostics).toContainEqual(expect.objectContaining({ code: 'DEPRECATED_TOKEN', token: '--color-brand' }))
    expect(data.designSystem.diagnostics).toContainEqual(expect.objectContaining({ code: 'UNAPPROVED_RAW_VALUE', source: join(root, 'native.css') }))
    expect(data.designSystem.collisions).toContainEqual(expect.objectContaining({ className: 'font-brand', namespaces: ['font-family', 'font-size'] }))
    const reference = data.designSystem.references.find((item: any) => item.source === join(root, 'native.css') && item.token === '--color-brand')
    expect(nativeSource.slice(reference.range.start, reference.range.end)).toBe('--color-brand')
    expect(reference.importers).toContain(join(root, 'app.css'))
    expect(data.designSystem.project.files).toEqual(expect.arrayContaining([join(root, 'app.css'), join(root, 'native.css')]))
    expect(data.designSystem.coverage).toMatchObject({ scope: 'provided-stylesheets', browser: 'not-checked' })
    const malformed = structuredClone(response)
    malformed.result.data.designSystem.references = [{ token: '--color-brand' }]
    expect(validate(malformed).valid).toBe(false)
    expect((await client.callTool({ name: tool.name, arguments: { designSystem: { version: 2 } } })).isError).toBe(true)
    // Typos must reach the caller as invalid configuration, never as a stripped
    // policy that succeeds with different checks from CLI and the Rust binding.
    for (const designSystem of [
      { version: 1, metdata: {} },
      { version: 1, metadata: { '--color-brand': { deprected: true } } },
      { version: 1, rawValuePolicy: { requirePropertes: ['padding'] } }
    ]) {
      expect((await client.callTool({ name: tool.name, arguments: { designSystem } })).isError).toBe(true)
    }
    writeFileSync(join(root, 'route.css'), '.hero{color:var(--color-brand)}.hero[data-tone="calm"]{color:var(--color-next)}')
    const route = (await call({ designSystem: { version: 1 }, routeStylesheets: ['route.css'] })).result.data.designSystem
    expect(route.project.routeStylesheets).toEqual([join(root, 'route.css')])
    expect(route.components).toContainEqual({ className: 'hero', attributes: [{ name: 'data-tone', values: ['calm'], presence: false }], sources: [join(root, 'route.css')] })
    expect(route.references).toContainEqual(expect.objectContaining({ source: join(root, 'route.css'), token: '--color-brand', importers: [] }))
    expect((await client.callTool({ name: tool.name, arguments: { routeStylesheets: ['route.css'] } })).isError).toBe(true)
    expect((await client.callTool({ name: tool.name, arguments: { designSystem: { version: 1 }, routeStylesheets: ['index.html'] } })).isError).toBe(true)
    const preset = await client.callTool({ name: tool.name, arguments: { context: 'preset', designSystem: { version: 1 } } })
    expect(preset.isError).toBe(true)
    expect(JSON.stringify(preset.structuredContent)).toContain('requires project context')
  } finally {
    await client.close()
    await server.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})
