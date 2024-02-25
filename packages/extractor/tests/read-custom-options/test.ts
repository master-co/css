import { CSSExtractor, options } from '../../src'
import fs from 'fs'
import path from 'path'
import dedent from 'ts-dedent'

test('read custom options', async () => {
    fs.writeFileSync(path.join(__dirname, 'master.css-extractor.js'), dedent`
        module.exports = {
            module: '.virtual:home.css'
        }
    `)
    const extractor = new CSSExtractor('master.css-extractor', __dirname).init()
    expect(extractor?.options)
        .toEqual({
            ...options,
            module: '.virtual:home.css'
        })
})