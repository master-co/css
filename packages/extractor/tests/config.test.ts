import CSSExtractor from '../src'
import fs from 'fs'
import path from 'path'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test, expect } from 'vitest'

test('read master.css.js config in cwd', async () => {
    const extractor = await new CSSExtractor({}, __dirname).init()
    expect(extractor?.css.config)
        .toBeDefined()
})

test('reject string extractor options', async () => {
    await expect(new CSSExtractor('options' as any, __dirname).init())
        .rejects
        .toThrow('CSSExtractor options must be an object.')
})

test('master.css.js config custom classname', async () => {
    fs.writeFileSync(path.join(__dirname, 'master.css.ts'), `
        export default {
            utilities: [
                {
                    name: 'blue-btn',
                    type: -4,
                    layer: 'main',
                    rules: [
                        { selector: '&', declarations: { 'background-color': 'oklch(63.7% 0.237 25.331)' } }
                    ]
                },
                {
                    name: 'btn',
                    type: -4,
                    layer: 'main',
                    rules: [
                        { selector: '&', declarations: { 'background-color': 'oklch(55.1% 0.027 264.364)' } }
                    ]
                }
            ]
        }
    `, { flag: 'w' })
    const extractor = await new CSSExtractor({}, __dirname).init()
    expect(
        extractor?.extract('test.tsx',
            `
            <h1 className={'rel ' + styles.title}>
            <h1 className="{styles.title + ' ' + 'blue-btn'}">
            <button className="test btn">
        `)
    ).toEqual(['rel', 'blue-btn', 'test', 'btn'])
})

test('tracks native CSS classes from CSS config as used classes', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-extractor-'))
    try {
        writeFileSync(join(cwd, 'master.css'), `
            .native-card {
                color: red;
            }

            @master {
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

        expect([...extractor.nativeClassNames]).toEqual(['native-card'])
        expect([...extractor.usedNativeClasses]).toEqual(['native-card'])
        expect(extractor.validClasses.has('btn')).toBe(true)
        expect(changes).toEqual([['native-card']])
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})
