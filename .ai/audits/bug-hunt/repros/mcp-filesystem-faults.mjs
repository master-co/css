import assert from 'node:assert/strict'
import { chmodSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMasterCSSMCPServer } from '../../../../packages/mcp/src/server.ts'

const require = createRequire(new URL('../../../../packages/mcp/package.json', import.meta.url))
const { Client } = require('@modelcontextprotocol/sdk/client/index.js')
const { InMemoryTransport } = require('@modelcontextprotocol/sdk/inMemory.js')
assert(process.getuid() !== 0, 'mode-bit fault requires non-root user')
const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-bh-fs-fault-')))
const files = [join(root, 'a.css'), join(root, 'b.css')]
const before = '@compose block   inline;'
const after = '@compose block inline;'
const external = '@compose flex;'
const rows = []
const evidence = fileURLToPath(new URL('../evidence/0085-filesystem-faults.json', import.meta.url))
const save = row => {
  rows.push(row)
  writeFileSync(evidence, JSON.stringify({ platform: process.platform, uid: process.getuid(), root, rows }, null, 2))
}
const instance = createMasterCSSMCPServer({ root })
const client = new Client({ name: 'master-css-bh-fs-fault', version: '1' }, { capabilities: {} })
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
const texts = () => files.map(file => readFileSync(file, 'utf8'))
const reset = () => files.forEach(file => { try { chmodSync(file, 0o600) } catch {}; writeFileSync(file, before) })
const json = result => {
  assert(!result.isError, JSON.stringify(result))
  return JSON.parse(result.content[0].text)
}
const preview = async () => json(await client.callTool({ name: 'mastercss_preview_directive_format', arguments: { patterns: ['*.css'] } })).preview
const apply = token => client.callTool({ name: 'mastercss_apply_preview', arguments: { confirmToken: token } })
try {
  await Promise.all([client.connect(clientTransport), instance.connect(serverTransport)])
  for (const scenario of ['normal', 'stale-second', 'unwritable-first', 'unwritable-second']) {
    reset()
    const generated = await preview()
    assert(generated.confirmToken && generated.changes.length === 2)
    assert.deepEqual(texts(), [before, before], 'preview is read-only')
    const order = generated.changes.map(change => change.filePath)
    assert.equal(new Set(order).size, 2)
    if (scenario === 'stale-second') writeFileSync(order[1], external)
    if (scenario.startsWith('unwritable')) chmodSync(order[scenario === 'unwritable-first' ? 0 : 1], 0o400)
    const response = await apply(generated.confirmToken)
    const afterAttempt = texts()
    const row = { scenario, order, response, afterAttempt }
    if (scenario === 'normal') {
      assert.equal(json(response).applied, true)
      assert.deepEqual(afterAttempt, [after, after])
      row.reusedToken = await apply(generated.confirmToken)
      assert(row.reusedToken.isError && /already applied/.test(row.reusedToken.content[0].text))
    } else if (scenario === 'stale-second') {
      assert(response.isError && /changed after preview/.test(response.content[0].text))
      assert.equal(readFileSync(order[0], 'utf8'), before, 'all stale validation precedes writes')
      assert.equal(readFileSync(order[1], 'utf8'), external)
    } else {
      assert(response.isError && /EACCES/.test(response.content[0].text), 'actual filesystem denies write')
      assert.equal(readFileSync(order[1], 'utf8'), before)
      assert.equal(readFileSync(order[0], 'utf8'), scenario === 'unwritable-first' ? before : after)
      files.forEach(file => chmodSync(file, 0o600))
      row.retryAfterPermissionRestore = await apply(generated.confirmToken)
      row.afterRetry = texts()
      if (scenario === 'unwritable-first') {
        assert.equal(json(row.retryAfterPermissionRestore).applied, true)
        assert.deepEqual(texts(), [after, after])
      } else {
        assert(row.retryAfterPermissionRestore.isError && /changed after preview/.test(row.retryAfterPermissionRestore.content[0].text))
        assert.deepEqual(row.afterRetry, afterAttempt)
        const recovery = await preview()
        assert.equal(recovery.changes.length, 1)
        assert.equal(recovery.changes[0].filePath, order[1])
        row.freshPreview = recovery
        row.recovery = await apply(recovery.confirmToken)
        assert.equal(json(row.recovery).applied, true)
        assert.deepEqual(texts(), [after, after])
        row.afterRecovery = texts()
      }
    }
    save(row)
    console.log(JSON.stringify({ scenario, responseError: Boolean(response.isError), afterAttempt, validation: 'observations/controls PASS' }))
  }
  save({ complete: true, scenarios: 4, classification: 'Partial writes and retry behavior observed; atomicity is not promised by current public contract.' })
} catch (error) { save({ error: String(error), stack: error.stack }); throw error }
finally {
  files.forEach(file => { try { chmodSync(file, 0o600) } catch {} })
  await client.close()
  await instance.dispose()
  rmSync(root, { recursive: true, force: true })
}
