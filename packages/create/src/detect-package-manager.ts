import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { detect as detectPackageManager } from 'detect-package-manager'
import { Options } from './Options'

const PACKAGE_MANAGERS = ['npm', 'yarn', 'pnpm', 'bun'] as const

function isPackageManager(value: string): value is Options['pm'] {
    return PACKAGE_MANAGERS.includes(value as Options['pm'])
}

function readPackageManager(packageJsonPath: string): Options['pm'] | undefined {
    try {
        const packageManager = JSON.parse(readFileSync(packageJsonPath, 'utf-8')).packageManager
        if (typeof packageManager !== 'string') return
        const name = packageManager.split('@')[0]
        if (isPackageManager(name)) return name
    } catch {
        return
    }
}

function detectLockFilePackageManager(directory: string): Options['pm'] | undefined {
    if (existsSync(join(directory, 'yarn.lock'))) return 'yarn'
    if (existsSync(join(directory, 'pnpm-lock.yaml'))) return 'pnpm'
    if (existsSync(join(directory, 'bun.lockb')) || existsSync(join(directory, 'bun.lock'))) return 'bun'
    if (existsSync(join(directory, 'package-lock.json'))) return 'npm'
}

function detectProjectPackageManager(cwd: string): Options['pm'] | undefined {
    let directory = resolve(cwd)

    while (true) {
        const packageManager = detectLockFilePackageManager(directory) || readPackageManager(join(directory, 'package.json'))
        if (packageManager) return packageManager

        const parentDirectory = dirname(directory)
        if (parentDirectory === directory) return
        directory = parentDirectory
    }
}

export default async function detectPreferredPackageManager(cwd = process.cwd()): Promise<Options['pm']> {
    return detectProjectPackageManager(cwd) || await detectPackageManager({ cwd })
}
