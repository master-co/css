import fs from 'fs'
import fg from 'fast-glob'
import path from 'upath'
const parentModuleDir = path.dirname(require.main.filename)

export function expectExist(filePaths: string[]) {
    filePaths.forEach((eachFilePath) => {
        expect(fs.existsSync(
            fg.sync(path.join(parentModuleDir, eachFilePath))[0]
        )).toBeTruthy()
    })
}