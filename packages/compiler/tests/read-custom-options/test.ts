import { MasterCSSCompiler, options } from '../../src'
import fs from 'fs'
import path from 'path'

test('read custom options', async () => {
    fs.writeFileSync(path.join(__dirname, 'master.css-compiler.js'), `
        module.exports = {
            module: 'virtual:master.css',
        }
    `)
    const compiler = new MasterCSSCompiler({ cwd: __dirname })
    expect(compiler.options)
        .toEqual({
            ...options,
            cwd: __dirname,
            module: 'virtual:master.css'
        })
})