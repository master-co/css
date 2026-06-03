import { test, expect, it } from 'vitest'
import CSSExtractor from '../../src'
import fs from 'fs'
import path from 'path'

fs.writeFileSync(path.join(__dirname, 'manual-source.ts'), `
export default {
    variables: [
        { key: 'primary', value: '$(blue)' }
    ]
}
`, { flag: 'w' })

it('check the excluded files', async () => {
    const extractor = await new CSSExtractor({}, __dirname).init()
    expect(extractor?.fixedSourcePaths).not.toContain('manual-source.ts')
})

it('should contain the specific source', async () => {
    const extractor = await new CSSExtractor({
        sources: ['manual-source.ts'],
    }, __dirname).init()
    expect(extractor?.fixedSourcePaths).toContain('manual-source.ts')
})
