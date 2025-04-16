import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const EXTENSIONS = ['js', 'mjs', 'ts', 'cjs', 'cts', 'mts']

export default function ensureCSSConfigPath(name = 'master.css', root = process.cwd()) {
    // check if the name is a path
    if (name.startsWith('/') || name.startsWith('.')) {
        const eachPath = resolve(root, name)
        if (existsSync(eachPath)) {
            return eachPath
        }
    }

    // check if the name is a basename with ext
    if (EXTENSIONS.find((ext) => name.endsWith('.' + ext))) {
        const eachPath = resolve(root, name)
        if (existsSync(eachPath)) {
            return eachPath
        }
    }

    for (const ext of EXTENSIONS) {
        const basename = name + '.' + ext
        const eachPath = resolve(root, basename)
        if (existsSync(eachPath)) {
            return eachPath
        }
    }
}