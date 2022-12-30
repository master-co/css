import fs from 'fs'
import upath from 'upath'
import fg from 'fast-glob'

export function expectFileIncludes(filePath: string, includes: string[], parentModuleDir = '') {
    const content = fs.readFileSync(
        fg.sync(upath.join(parentModuleDir || upath.dirname(require.main.filename), filePath))[0]
    ).toString()
    includes.map((include) => {
        expect(content).toContain(include)
    })
}