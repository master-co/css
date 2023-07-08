import fs from 'fs'
import path from 'upath'

export default function writeFile(filePath: string, data: string | NodeJS.ArrayBufferView, options?: fs.WriteFileOptions) {
    const dirname = path.dirname(filePath)
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true })
    }
    fs.writeFileSync(filePath, data, options)

}
