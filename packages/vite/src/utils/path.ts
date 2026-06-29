import { realpathSync } from 'node:fs'
import { resolve } from 'node:path'

export function normalizeFilePath(file: string) {
    try {
        return realpathSync.native(file).replace(/\\/g, '/')
    } catch {
        return resolve(file).replace(/\\/g, '/')
    }
}

export function includesFile(dependencies: string[], file: string) {
    const normalizedFile = normalizeFilePath(file)
    return dependencies.some((dependency) => normalizeFilePath(dependency) === normalizedFile)
}
