import { test, expect, it } from 'vitest'
import CSSScanner from '../../src'
import fs from 'fs'
import path from 'path'

fs.writeFileSync(path.join(__dirname, 'manual-source.ts'), `
export default {
    variables: [
        { key: 'primary', value: 'var(--blue)' }
    ]
}
`, { flag: 'w' })

it('check the excluded files', async () => {
    const scanner = await new CSSScanner({}, __dirname).init()
    expect(scanner?.fixedSourcePaths).not.toContain('manual-source.ts')
})

it('should contain the specific source', async () => {
    const scanner = await new CSSScanner({
        required: ['manual-source.ts'],
    }, __dirname).init()
    expect(scanner?.fixedSourcePaths).toContain('manual-source.ts')
})
