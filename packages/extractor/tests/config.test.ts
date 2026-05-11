import CSSExtractor from '../src'
import fs from 'fs'
import path from 'path'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test, expect, vi } from 'vitest'

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

test('ignores native CSS classes from CSS config files', async () => {
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

        expect([...extractor.nativeClassNames]).toEqual([])
        expect([...extractor.usedNativeClasses]).toEqual([])
        expect(extractor.validClasses.has('btn')).toBe(true)
        expect(changes).toEqual([[]])
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})

test('tracks script config dependency graph', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-extractor-config-'))
    const configPath = join(cwd, 'master.css.ts')
    const tokenPath = join(cwd, 'tokens.ts')
    try {
        writeFileSync(tokenPath, 'export const cardColor = "#123456"\n')
        writeFileSync(configPath, [
            'import { cardColor } from "./tokens"',
            '',
            'export default {',
            '    utilities: [',
            '        {',
            '            name: "card",',
            '            type: -4,',
            '            layer: "main",',
            '            rules: [',
            '                { selector: "&", declarations: { color: cardColor } }',
            '            ]',
            '        }',
            '    ]',
            '}'
        ].join('\n'))

        const extractor = await new CSSExtractor({
            config: 'master.css.ts',
            include: [],
            sources: []
        }, cwd).init()

        expect(extractor.configDependencies).toEqual([configPath, tokenPath])
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})

test('watches script config dependency graph', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-extractor-watch-'))
    const configPath = join(cwd, 'master.css.ts')
    const tokenPath = join(cwd, 'tokens.ts')
    try {
        writeFileSync(tokenPath, 'export const cardColor = "#123456"\n')
        writeFileSync(configPath, [
            'import { cardColor } from "./tokens"',
            '',
            'export default {',
            '    utilities: [',
            '        {',
            '            name: "card",',
            '            type: -4,',
            '            layer: "main",',
            '            rules: [',
            '                { selector: "&", declarations: { color: cardColor } }',
            '            ]',
            '        }',
            '    ]',
            '}'
        ].join('\n'))

        const extractor = await new CSSExtractor({
            config: 'master.css.ts',
            include: [],
            sources: []
        }, cwd).init()
        const watch = vi.fn(async () => undefined)
        ;(extractor as any).watch = watch

        await extractor.startWatch()

        expect(watch).toHaveBeenCalledWith('add change unlink', [configPath, tokenPath], expect.any(Function))
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
})
