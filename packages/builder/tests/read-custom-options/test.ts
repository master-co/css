import { test, expect } from 'vitest'
import { CSSBuilder, options } from '../../src'
import fs from 'fs'
import path from 'path'
import dedent from 'ts-dedent'

test('read custom options', async () => {
    fs.writeFileSync(path.join(__dirname, 'master.css-builder.js'), dedent`
        export default {
            module: '.virtual:home.css'
        }
    `)
    const builder = new CSSBuilder('master.css-builder', __dirname).init()
    expect(builder?.options)
        .toEqual({
            ...options,
            module: '.virtual:home.css'
        })
})