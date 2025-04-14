import CSSBuilder from '../src'
import fs from 'fs'
import path from 'path'
import { test, expect } from 'vitest'

test('read master.css.js config in cwd', async () => {
    const builder = new CSSBuilder({}, __dirname).init()
    expect(builder?.css.config)
        .toBeDefined()
})

test('master.css.js config custom classname', async () => {
    fs.writeFileSync(path.join(__dirname, 'master.css.ts'), `
        export default {
            components: {
                'blue-btn': 'bg:blue',
                btn: 'bg:gray'
            }
        }
    `, { flag: 'w' })
    const builder = new CSSBuilder({}, __dirname).init()
    expect(
        builder?.extract('test.tsx',
            `
            <h1 className={'rel ' + styles.title}>
            <h1 className="{styles.title + ' ' + 'blue-btn'}">
            <button className="test btn">
        `)
    ).toEqual(['rel', 'blue-btn', 'test', 'btn'])
})
