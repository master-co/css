import { CSSExtractor, options } from '../../src'
import fs from 'fs'
import path from 'path'
import dedent from 'ts-dedent'

test('read custom options', async () => {
    const customOptions = path.join(__dirname, 'master.css-extractor.js')
    fs.writeFileSync(path.join(__dirname, 'master.css-extractor.js'), dedent`
        module.exports = {
            module: 'virtual:master.css'
        }
    `)
    const extractor = new CSSExtractor(customOptions)
    expect(extractor.options)
        .toEqual({
            ...options,
            module: 'virtual:master.css'
        })
})