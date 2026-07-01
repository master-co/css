import CSSScanner from '../src'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test, expect } from 'vitest'
import { compileCSSManifest } from '@master/css-compiler'

test('uses default manifest settings without implicit manifest entry discovery', async () => {
    const scanner = await new CSSScanner({}, __dirname).init()
    expect(scanner.css.settings).toBeDefined()
})

test('reject string scanner options', async () => {
    await expect(new CSSScanner('options' as any, __dirname).init())
        .rejects
        .toThrow('CSSScanner options must be an object.')
})

test('uses explicit compiled manifests', async () => {
    const { manifest } = compileCSSManifest(`
        @components {
            blue-btn {
                background-color: oklch(63.7% 0.237 25.331);
            }
            btn {
                background-color: oklch(55.1% 0.027 264.364);
            }
        }
    `)
    const scanner = await new CSSScanner({
        manifest
    }, __dirname).init()
    await expect(
        scanner.collectCandidates('test.tsx',
            `
            <h1 className={'rel ' + styles.title}>
            <h1 className="{styles.title + ' ' + 'blue-btn'}">
            <button className="test btn">
        `)
    ).resolves.toEqual(['rel', 'blue-btn', 'test', 'btn'])
    expect(scanner.css.createRule('blue-btn')?.text).toContain('background-color:oklch')
})

test('ignores native CSS classes from unmanaged CSS files', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-scanner-'))
    try {
        writeFileSync(join(cwd, 'theme.css'), `
            .native-card {
                color: red;
            }

            @layer components {
                .btn {
                    display: inline-flex;
                }
            }
        `)

        const scanner = await new CSSScanner({}, cwd).init()
        const changes: string[][] = []
        scanner.on('change', () => {
            changes.push([...scanner.usedNativeClasses])
        })

        await scanner.scan('src/index.html', '<div class="native-card btn"></div>')

        expect([...scanner.nativeClassNames]).toEqual([])
        expect([...scanner.usedNativeClasses]).toEqual([])
        expect(scanner.validClasses.has('btn')).toBe(false)
        expect(changes).toEqual([])
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})
