import CSSExtractor from '../src'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test, expect } from 'vitest'
import { compileCSSPlan } from '@master/css-compiler'

test('uses default plan settings without implicit plan entry discovery', async () => {
    const extractor = await new CSSExtractor({}, __dirname).init()
    expect(extractor.css.settings).toBeDefined()
})

test('reject string extractor options', async () => {
    await expect(new CSSExtractor('options' as any, __dirname).init())
        .rejects
        .toThrow('CSSExtractor options must be an object.')
})

test('uses explicit compiled plans', async () => {
    const { plan } = compileCSSPlan(`
        @components {
            blue-btn {
                background-color: oklch(63.7% 0.237 25.331);
            }
            btn {
                background-color: oklch(55.1% 0.027 264.364);
            }
        }
    `)
    const extractor = await new CSSExtractor({
        plan
    }, __dirname).init()
    expect(
        extractor.extract('test.tsx',
            `
            <h1 className={'rel ' + styles.title}>
            <h1 className="{styles.title + ' ' + 'blue-btn'}">
            <button className="test btn">
        `)
    ).toEqual(['rel', 'blue-btn', 'test', 'btn'])
    expect(extractor.css.create('blue-btn')?.text).toContain('background-color:oklch')
})

test('ignores native CSS classes from unmanaged CSS files', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-extractor-'))
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

        const extractor = await new CSSExtractor({ include: [] }, cwd).init()
        const changes: string[][] = []
        extractor.on('change', () => {
            changes.push([...extractor.usedNativeClasses])
        })

        await extractor.insert('src/index.html', '<div class="native-card btn"></div>')

        expect([...extractor.nativeClassNames]).toEqual([])
        expect([...extractor.usedNativeClasses]).toEqual([])
        expect(extractor.validClasses.has('btn')).toBe(false)
        expect(changes).toEqual([])
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})
