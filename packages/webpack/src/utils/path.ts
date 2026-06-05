import { VIRTUAL_CONFIG_DIR } from '@master/css-integration/config-module'
import path from 'node:path'

export function isVirtualConfigModulePath(modulePath: string) {
    return modulePath.replace(/\\/g, '/').includes(`${VIRTUAL_CONFIG_DIR}/`)
}

export function normalizePath(filePath: string) {
    return path.resolve(filePath).replace(/\\/g, '/')
}

export function hasModifiedFile(modifiedFiles: ReadonlySet<string> | undefined, filePath: string) {
    if (!modifiedFiles) return false
    const normalizedFilePath = normalizePath(filePath)
    for (const eachModifiedFile of modifiedFiles) {
        if (normalizePath(eachModifiedFile) === normalizedFilePath) return true
    }
    return false
}
