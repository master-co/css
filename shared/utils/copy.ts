const fs = require('fs')
const path = require('path')

export default function copy(sourceDir: string, destinationDir: string) {
    fs.rmSync(destinationDir, { recursive: true, force: true })
    fs.mkdirSync(destinationDir, { recursive: true })
    const items = fs.readdirSync(sourceDir)
    for (const item of items) {
        if (['dist', 'out'].includes(item)) {
            continue
        }
        const sourcePath = path.join(sourceDir, item)
        const destinationPath = path.join(destinationDir, item)
        const stat = fs.statSync(sourcePath)
        if (stat.isDirectory()) {
            copy(sourcePath, destinationPath)
        } else {
            fs.copyFileSync(sourcePath, destinationPath)
        }
    }
}