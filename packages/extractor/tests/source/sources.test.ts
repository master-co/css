import { test, expect, it } from 'vitest'
import CSSExtractor from '../../src'
import fs from 'fs'
import path from 'path'

fs.writeFileSync(path.join(__dirname, 'master.css.ts'), `
export default {
    variables: {
        primary: '$(blue)'
    }
}
`, { flag: 'w' })

it('check the excluded files', async () => {
    const extractor = new CSSExtractor({}, __dirname).init()
    expect(extractor?.fixedSourcePaths).not.toContain('master.css.ts')
})

it('should contain the specific source', async () => {
    const extractor = new CSSExtractor({
        sources: ['master.css.ts'], // master.css.js is excluded by default `options.exclude`
    }, __dirname).init()
    expect(extractor?.fixedSourcePaths).toContain('master.css.ts')
})