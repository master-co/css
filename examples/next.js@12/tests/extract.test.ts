import { readFileSync } from 'fs'
import path from 'path'
import extract from '../../../packages/compiler/src/options/extract'
import MasterCSSCompiler from '../../../packages/compiler/src/compiler'

test('extract `btn` from `.tsx`', () => {
    const compiler = new MasterCSSCompiler({ cwd: path.resolve(__dirname, '../') })
    expect(extract({
        name: 'test',
        content: readFileSync(path.join(__dirname, '../pages/index.tsx')).toString()
    }, compiler.css)).toContain('btn')
})