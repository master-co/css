import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import MasterCSSMCPContext from '../src/context'

// BH-0020: byte metadata must describe the UTF-8 files that will be written.
it.each([['a', 'bb'], ['é', '😀']])('counts UTF-8 preview bytes for %s → %s', async (before, after) => {
    const root = mkdtempSync(join(tmpdir(), 'master-css-bh-preview-'))
    const context = new MasterCSSMCPContext({ root })
    try {
        const file = join(root, 'example.txt')
        writeFileSync(file, before)
        const preview = await context.createPreview([{ filePath: file, afterText: after }])
        expect(preview.summary).toEqual({ files: 1, bytesBefore: Buffer.byteLength(before), bytesAfter: Buffer.byteLength(after) })
        expect(preview.changes[0].beforeBytes).toBe(Buffer.byteLength(before))
        expect(preview.changes[0].afterBytes).toBe(Buffer.byteLength(after))
    } finally {
        context.dispose()
        rmSync(root, { recursive: true, force: true })
    }
})
