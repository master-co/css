import fs from 'fs'
import upath from 'upath'
import fg from 'fast-glob'

const parentModuleDir = upath.dirname(require.main.filename)

export function expectFileIncludes(filePath: string, includes: string[]) {
    const content = fs.readFileSync(
        fg.sync(upath.join(parentModuleDir, filePath))[0]
    ).toString()
    includes.forEach((include) => {
        expect(content).toContain(include)
    })
}