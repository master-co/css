import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import Context from '../../../../packages/mcp/src/context.ts'
import { createMasterCSSMCPServer } from '../../../../packages/mcp/src/server.ts'

const require = createRequire(new URL('../../../../packages/mcp/package.json', import.meta.url))
const { Client } = await import(require.resolve('@modelcontextprotocol/sdk/client/index.js'))
const { InMemoryTransport } = await import(require.resolve('@modelcontextprotocol/sdk/inMemory.js'))

const root = mkdtempSync(join(tmpdir(), 'master-css-bh-preview-'))
const a = join(root, 'a'), b = join(root, 'b')
mkdirSync(a); mkdirSync(b)
const context = new Context({ roots: [a, b] })
const records = []
try {
    const first = join(a, 'sequential.txt')
    writeFileSync(first, 'before')
    const preview = await context.createPreview([{ filePath: first, afterText: 'after' }])
    assert.equal((await context.applyPreview(preview.confirmToken!)).applied, true)
    await assert.rejects(context.applyPreview(preview.confirmToken!), /already applied/)
    assert.equal(readFileSync(first, 'utf8'), 'after')
    records.push({ control: 'sequential duplicate rejected', pass: true })
    writeFileSync(first, 'before')
    const competing = await Promise.all(['one', 'two'].map(afterText => context.createPreview([{ filePath: first, afterText }])))
    await context.applyPreview(competing[0].confirmToken!)
    await assert.rejects(context.applyPreview(competing[1].confirmToken!), /changed after preview/)
    records.push({ control: 'sequential conflicting preview rejected', pass: true })
    const files = [join(a, 'independent.txt'), join(b, 'independent.txt')]
    for (const file of files) writeFileSync(file, 'before')
    const separate = await Promise.all(files.map((filePath, i) => context.createPreview([{ filePath, afterText: `after-${i}` }])))
    const results = await Promise.all(separate.map(p => context.applyPreview(p.confirmToken!)))
    assert(results.every(r => r.applied))
    files.forEach((file, i) => assert.equal(readFileSync(file, 'utf8'), `after-${i}`))
    records.push({ control: 'concurrent independent roots', pass: true })
    for (let i = 0; i < 10; i++) {
        const file = join(a, `concurrent-${i}.txt`)
        writeFileSync(file, 'before')
        const p = await context.createPreview([{ filePath: file, afterText: 'after' }])
        const result = await Promise.allSettled([context.applyPreview(p.confirmToken!), context.applyPreview(p.confirmToken!)])
        assert.equal(readFileSync(file, 'utf8'), 'after')
        records.push({ round: i, fulfilled: result.filter(r => r.status === 'fulfilled').length,
            outcomes: result.map(r => r.status === 'fulfilled' ? r.value : { error: String(r.reason) }) })
    }
    for (let i = 0; i < 3; i++) {
        const file = join(a, `conflicting-${i}.txt`)
        writeFileSync(file, 'before')
        const previews = await Promise.all(['after-one', 'after-two'].map(afterText => context.createPreview([{ filePath: file, afterText }])))
        const outcomes = await Promise.allSettled(previews.map(p => context.applyPreview(p.confirmToken!)))
        records.push({ conflictingRound: i, fulfilled: outcomes.filter(r => r.status === 'fulfilled').length,
            finalText: readFileSync(file, 'utf8'), promisedTexts: ['after-one', 'after-two'],
            outcomes: outcomes.map(r => r.status === 'fulfilled' ? r.value : { error: String(r.reason) }) })
    }
    const server = createMasterCSSMCPServer({ root: a })
    const client = new Client({ name: 'bug-hunt-concurrency', version: '0.0.0' }, { capabilities: {} })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    try {
        await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
        for (let i = 0; i < 3; i++) {
            const file = join(a, 'style.css')
            writeFileSync(file, '@compose block   inline;')
            const previewResult = await client.callTool({ name: 'mastercss_preview_directive_format', arguments: { patterns: ['style.css'] } })
            const preview = JSON.parse(previewResult.content[0].text)
            assert(preview.preview.confirmToken)
            assert.equal(readFileSync(file, 'utf8'), '@compose block   inline;')
            const request = { name: 'mastercss_apply_preview', arguments: { confirmToken: preview.preview.confirmToken } }
            const outcomes = await Promise.all([client.callTool(request), client.callTool(request)])
            const applied = outcomes.map(r => r.isError ? { error: r.content } : JSON.parse(r.content[0].text))
            assert.equal(readFileSync(file, 'utf8'), '@compose block inline;')
            records.push({ rpcRound: i, fulfilled: applied.filter(r => r.applied === true).length, outcomes: applied })
        }
    } finally { await client.close(); await server.dispose() }
    console.log(JSON.stringify(records, null, 2))
    assert(records.filter(r => 'fulfilled' in r).every(r => r.fulfilled === 1), 'BH-0031: a one-use preview token must accept exactly one simultaneous apply')
} finally {
    context.dispose()
    rmSync(root, { recursive: true, force: true })
}
