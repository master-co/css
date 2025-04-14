import { test, expect, it } from 'vitest'
import CSSBuilder from '../../src'
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
    const builder = new CSSBuilder({}, __dirname).init()
    expect(builder?.fixedSourcePaths).not.toContain('master.css.ts')
})

it('should contain the specific source', async () => {
    const builder = new CSSBuilder({
        sources: ['master.css.ts'], // master.css.js is excluded by default `options.exclude`
    }, __dirname).init()
    expect(builder?.fixedSourcePaths).toContain('master.css.ts')
})