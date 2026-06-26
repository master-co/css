import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const distDir = 'dist'
const jsonModuleRE = /@master\/css-preset\/default-manifest\.json/
const jsonImportRE = new RegExp(`from\\s+(['"])(${jsonModuleRE.source})\\1(?!\\s+with\\s*\\{)`, 'g')

async function* walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const file = join(dir, entry.name)
        if (entry.isDirectory()) {
            yield* walk(file)
        } else if (entry.isFile() && file.endsWith('.js')) {
            yield file
        }
    }
}

for await (const file of walk(distDir)) {
    const source = await readFile(file, 'utf8')
    const nextSource = source.replace(jsonImportRE, 'from $1$2$1 with { type: $1json$1 }')
    if (nextSource !== source) {
        await writeFile(file, nextSource)
    }
}
