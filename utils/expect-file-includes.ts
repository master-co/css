import fs from 'fs'
import path from 'path'
import fg from 'fast-glob'
const parentModuleDir = path.dirname(require.main.filename)

export function expectFileIncludes(filePath: string, includes: string[]) {
    console.log(fg.sync(path.join(parentModuleDir, filePath))[0])
    const content = fs.readFileSync(
        fg.sync(path.join(parentModuleDir, filePath))[0]
    ).toString()
    includes.map((include) => {
        expect(content).toContain(include)
    })
}