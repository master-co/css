import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { expect, test } from 'vitest'
import { createMasterCSSMCPServer } from '../src/server'

test.each(['bun.lock', 'bun.lockb'])('setup audit recognizes %s', async (lockfile) => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-mcp-bun-')))
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'bun-fixture', private: true, devDependencies: { '@master/css': 'workspace:*' } }))
  writeFileSync(join(root, lockfile), '')
  writeFileSync(join(root, 'master.css'), '@import "@master/css";')
  mkdirSync(join(root, 'node_modules/@master'), { recursive: true })
  symlinkSync(resolve(import.meta.dirname, '../../css'), join(root, 'node_modules/@master/css'), 'junction')
  const server = createMasterCSSMCPServer({ root })
  const client = new Client({ name: 'bun-lock-test', version: '1.0.0' })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  try {
    await server.connect(serverTransport)
    await client.connect(clientTransport)
    const result = await client.callTool({ name: 'mastercss_setup_audit', arguments: {} })
    const text = result.content as { type: string, text: string }[]
    const envelope = JSON.parse(text.find(content => content.type === 'text')!.text)
    expect(envelope.result.status, JSON.stringify(envelope)).toBe('success')
    const audit = envelope.result.data
    expect(audit.packageManager.inferred).toBe('bun')
    expect(audit.packageManager.lockfiles).toEqual([{ name: 'bun', filePath: join(root, lockfile) }])
  } finally { await client.close(); await server.dispose(); rmSync(root, { recursive: true, force: true }) }
})
