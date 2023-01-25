import fs from 'fs-extra'
import path from 'path'
import type { PackageJson } from 'pkg-types'

export function readPackage(pkgPath = './package.json'): PackageJson {
    return fs.readJSONSync(pkgPath, { throws: false }) || {}
}