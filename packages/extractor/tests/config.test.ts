import CSSExtractor from '../src'
import fs from 'fs'
import path from 'path'
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
            components: {
                'blue-btn': [
                    { selector: '&', declarations: { 'background-color': 'oklch(63.7% 0.237 25.331)' } }
                ],
                btn: [
                    { selector: '&', declarations: { 'background-color': 'oklch(55.1% 0.027 264.364)' } }
                ]
            }
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
