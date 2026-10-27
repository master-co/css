import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import MasterCSSMCPContext from '../src/context'

// BH-0020: byte metadata must describe the UTF-8 files that will be written.
it.each([['a', 'bb'], ['é', '😀'], ['中文\r\n', 'e\u0301\n😀'], ['😀', '']])('counts UTF-8 preview bytes for %s → %s', async (before, after) => {
    const root = mkdtempSync(join(tmpdir(), 'master-css-bh-preview-'))
    const context = new MasterCSSMCPContext({ root })
    try {
        const file = join(root, 'example.txt')
        writeFileSync(file, before)
        const preview = await context.createPreview([{ filePath: file, afterText: after }])
        expect(preview.summary).toEqual({ files: 1, bytesBefore: Buffer.byteLength(before), bytesAfter: Buffer.byteLength(after) })
        expect(preview.changes[0].beforeBytes).toBe(Buffer.byteLength(before))
        expect(preview.changes[0].afterBytes).toBe(Buffer.byteLength(after))
        expect(preview.changes[0].beforeBytes).toBe(statSync(file).size)
        await context.applyPreview(preview.confirmToken!)
        expect(preview.changes[0].afterBytes).toBe(statSync(file).size)
        expect(readFileSync(file, 'utf8')).toBe(after)
    } finally {
        context.dispose()
        rmSync(root, { recursive: true, force: true })
    }
})

it('BH-0020 aggregates changed UTF-8 files including new files without counting unchanged files', async () => {
    const root = mkdtempSync(join(tmpdir(), 'master-css-bh-preview-sum-'))
    const context = new MasterCSSMCPContext({ root })
    try {
        const existing = join(root, 'existing.txt')
        const created = join(root, 'created.txt')
        const unchanged = join(root, 'unchanged.txt')
        writeFileSync(existing, 'é')
        writeFileSync(unchanged, '不變')
        const preview = await context.createPreview([
            { filePath: existing, afterText: '😀' },
            { filePath: created, afterText: '中文' },
            { filePath: unchanged, afterText: '不變' }
        ])
        expect(preview.summary).toEqual({ files: 2, bytesBefore: 2, bytesAfter: 10 })
        expect(preview.changes.map(({ beforeBytes, afterBytes }) => [beforeBytes, afterBytes])).toEqual([[2, 4], [0, 6]])
        await context.applyPreview(preview.confirmToken!)
        expect(statSync(existing).size + statSync(created).size).toBe(preview.summary.bytesAfter)
        expect(readFileSync(unchanged, 'utf8')).toBe('不變')
    } finally {
        context.dispose()
        rmSync(root, { recursive: true, force: true })
    }
})
