import { describe, expect, test } from 'vitest'
import CSSScanner from '../src'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('CSSScanner public API', () => {
    test('does not expose file watch or export helpers', async () => {
        const scanner = await new CSSScanner({ include: [] }).init()

        expect('startWatch' in scanner).toBe(false)
        expect('closeWatch' in scanner).toBe(false)
        expect('watchSources' in scanner).toBe(false)
        expect('watch' in scanner).toBe(false)
        expect('export' in scanner).toBe(false)
    })

    test('can reset state without preparing source files', async () => {
        const root = mkdtempSync(join(tmpdir(), 'master-css-scanner-api-'))
        try {
            writeFileSync(join(root, 'index.html'), '<div class="block"></div>')
            const scanner = await new CSSScanner({ include: ['index.html'] }, root).init()

            await scanner.reset(scanner.customOptions, { prepare: false })

            expect(scanner.validClasses.has('block')).toBe(false)

            await scanner.prepare()

            expect(scanner.validClasses.has('block')).toBe(true)
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })
})
