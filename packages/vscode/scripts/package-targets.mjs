#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))

export const packageDir = resolve(scriptDir, '..')
export const defaultOutDir = resolve(packageDir, 'vsix')

const packageRequire = createRequire(join(packageDir, 'package.json'))

export const TARGETS = [
    'win32-x64',
    'win32-arm64',
    'linux-x64',
    'linux-arm64',
    'linux-armhf',
    'alpine-x64',
    'alpine-arm64',
    'darwin-x64',
    'darwin-arm64'
]

const TARGET_NATIVE_PACKAGES = {
    'win32-x64': {
        lightningcss: 'lightningcss-win32-x64-msvc',
        oxcParser: '@oxc-parser/binding-win32-x64-msvc'
    },
    'win32-arm64': {
        lightningcss: 'lightningcss-win32-arm64-msvc',
        oxcParser: '@oxc-parser/binding-win32-arm64-msvc'
    },
    'linux-x64': {
        lightningcss: 'lightningcss-linux-x64-gnu',
        oxcParser: '@oxc-parser/binding-linux-x64-gnu'
    },
    'linux-arm64': {
        lightningcss: 'lightningcss-linux-arm64-gnu',
        oxcParser: '@oxc-parser/binding-linux-arm64-gnu'
    },
    'linux-armhf': {
        lightningcss: 'lightningcss-linux-arm-gnueabihf',
        oxcParser: '@oxc-parser/binding-linux-arm-gnueabihf'
    },
    'alpine-x64': {
        lightningcss: 'lightningcss-linux-x64-musl',
        oxcParser: '@oxc-parser/binding-linux-x64-musl'
    },
    'alpine-arm64': {
        lightningcss: 'lightningcss-linux-arm64-musl',
        oxcParser: '@oxc-parser/binding-linux-arm64-musl'
    },
    'darwin-x64': {
        lightningcss: 'lightningcss-darwin-x64',
        oxcParser: '@oxc-parser/binding-darwin-x64'
    },
    'darwin-arm64': {
        lightningcss: 'lightningcss-darwin-arm64',
        oxcParser: '@oxc-parser/binding-darwin-arm64'
    }
}

const STATIC_EXTENSION_PATHS = [
    'dist',
    'data',
    'syntaxes',
    'LICENSE',
    'README.md',
    'icon.png'
]

const BASE_RUNTIME_PACKAGES = [
    'lightningcss',
    'detect-libc',
    'oxc-parser',
    '@oxc-project/types',
    '@master/css-preset',
    'mdn-data'
]

function toPosixPath(path) {
    return path.replaceAll('\\', '/')
}

function toPackagePath(packageName) {
    return join(...packageName.split('/'))
}

function toNodeModulesPath(packageName) {
    return toPosixPath(join('dist', 'node_modules', toPackagePath(packageName)))
}

function toPackageFilesPattern(packageName) {
    return `${toNodeModulesPath(packageName)}/**`
}

function findPackageDir(entry) {
    let current = statSync(entry).isDirectory() ? entry : dirname(entry)
    while (current !== dirname(current)) {
        if (existsSync(join(current, 'package.json'))) return current
        current = dirname(current)
    }
    throw new Error(`Unable to find package.json for ${entry}`)
}

function resolvePackageDir(packageName, resolver) {
    try {
        return dirname(resolver.resolve(`${packageName}/package.json`))
    } catch (manifestError) {
        try {
            return findPackageDir(resolver.resolve(packageName))
        } catch (entryError) {
            throw new Error(
                `Unable to resolve ${packageName}. Run pnpm install after updating supportedArchitectures.\n`
                + `package.json resolution: ${manifestError.message}\n`
                + `entry resolution: ${entryError.message}`
            )
        }
    }
}

function createPackageResolver(packageName, resolver = packageRequire) {
    return createRequire(join(resolvePackageDir(packageName, resolver), 'package.json'))
}

function getRuntimePackageResolver(packageName) {
    if (packageName === 'lightningcss') return packageRequire
    if (packageName === 'oxc-parser') return packageRequire
    if (packageName === 'detect-libc' || packageName.startsWith('lightningcss-')) {
        return createPackageResolver('lightningcss')
    }
    if (packageName === '@oxc-project/types' || packageName.startsWith('@oxc-parser/')) {
        return createPackageResolver('oxc-parser')
    }
    return packageRequire
}

function getTargetNativePackages(target) {
    const nativePackages = TARGET_NATIVE_PACKAGES[target]
    if (!nativePackages) {
        throw new Error(`Unsupported VS Code target "${target}". Expected one of: ${TARGETS.join(', ')}`)
    }
    return nativePackages
}

export function getRuntimePackagesForTarget(target) {
    const nativePackages = getTargetNativePackages(target)
    return [
        ...BASE_RUNTIME_PACKAGES,
        nativePackages.lightningcss,
        nativePackages.oxcParser
    ]
}

function isCurrentLinuxMusl() {
    if (process.platform !== 'linux') return false
    try {
        const { MUSL, familySync } = createPackageResolver('lightningcss')('detect-libc')
        return familySync() === MUSL
    } catch {
        return false
    }
}

export function getCurrentTarget(options = {}) {
    const platform = options.platform ?? process.platform
    const arch = options.arch ?? process.arch
    const isMusl = options.isMusl ?? isCurrentLinuxMusl()

    if (platform === 'darwin' && (arch === 'x64' || arch === 'arm64')) return `darwin-${arch}`
    if (platform === 'win32' && (arch === 'x64' || arch === 'arm64')) return `win32-${arch}`
    if (platform === 'linux') {
        if (arch === 'x64') return isMusl ? 'alpine-x64' : 'linux-x64'
        if (arch === 'arm64') return isMusl ? 'alpine-arm64' : 'linux-arm64'
        if (arch === 'arm') return 'linux-armhf'
    }

    throw new Error(`Unsupported current platform ${platform}/${arch}`)
}

async function copyPath(source, destination) {
    await mkdir(dirname(destination), { recursive: true })
    await cp(source, destination, {
        recursive: true,
        dereference: true,
        force: true,
        filter: (sourcePath) => {
            const relativeSourcePath = relative(source, sourcePath)
            return !relativeSourcePath.split(/[\\/]/).includes('node_modules')
        }
    })
}

async function copyRuntimePackage(stagingDir, packageName) {
    const resolver = getRuntimePackageResolver(packageName)
    const sourceDir = resolvePackageDir(packageName, resolver)
    const destinationDir = join(stagingDir, 'dist', 'node_modules', toPackagePath(packageName))
    await copyPath(sourceDir, destinationDir)
    return toNodeModulesPath(packageName)
}

export async function createStagedExtension(target = getCurrentTarget(), options = {}) {
    getTargetNativePackages(target)

    const stagingRoot = options.stagingRoot ?? await mkdtemp(join(tmpdir(), 'master-css-vscode-'))
    const stagingDir = options.stagingDir ?? join(stagingRoot, target)
    const runtimePackages = getRuntimePackagesForTarget(target)

    await rm(stagingDir, { recursive: true, force: true })
    await mkdir(stagingDir, { recursive: true })

    for (const path of STATIC_EXTENSION_PATHS) {
        await copyPath(resolve(packageDir, path), join(stagingDir, path))
    }

    const manifest = JSON.parse(await readFile(resolve(packageDir, 'package.json'), 'utf8'))
    const runtimeFiles = []
    for (const runtimePackage of runtimePackages) {
        await copyRuntimePackage(stagingDir, runtimePackage)
        runtimeFiles.push(toPackageFilesPattern(runtimePackage))
    }

    manifest.files = [
        'dist',
        'data',
        'syntaxes',
        'LICENSE',
        'icon.png',
        ...runtimeFiles
    ]

    await writeFile(join(stagingDir, 'package.json'), JSON.stringify(manifest, null, 4) + '\n')

    return {
        target,
        stagingDir,
        runtimePackages,
        files: manifest.files
    }
}

function resolveVSCEBin() {
    return join(resolvePackageDir('@vscode/vsce', packageRequire), 'vsce')
}

function runVSCE(args, cwd) {
    return new Promise((resolvePromise, rejectPromise) => {
        const child = spawn(process.execPath, [resolveVSCEBin(), ...args], {
            cwd,
            stdio: 'inherit',
            env: process.env
        })

        child.on('error', rejectPromise)
        child.on('close', (code, signal) => {
            if (code === 0) {
                resolvePromise()
            } else {
                rejectPromise(new Error(`vsce ${args.join(' ')} failed with ${signal || code}`))
            }
        })
    })
}

export async function packageTarget(target, options = {}) {
    const stagingRoot = await mkdtemp(join(tmpdir(), 'master-css-vscode-package-'))
    const outDir = resolve(options.outDir ?? defaultOutDir)
    const packageArgs = options.packageArgs ?? []

    try {
        const { stagingDir } = await createStagedExtension(target, { stagingRoot })
        await mkdir(outDir, { recursive: true })
        const manifest = JSON.parse(await readFile(join(stagingDir, 'package.json'), 'utf8'))
        const packagePath = join(outDir, `${manifest.name}-${manifest.version}-${target}.vsix`)
        await runVSCE([
            'package',
            '--no-dependencies',
            '--target',
            target,
            '--out',
            packagePath,
            ...packageArgs
        ], stagingDir)
        return packagePath
    } finally {
        await rm(stagingRoot, { recursive: true, force: true })
    }
}

export async function packageTargets(options = {}) {
    const targets = options.targets ?? TARGETS
    const packagePaths = []

    for (const target of targets) {
        console.log(`Packaging master-css-vscode for ${target}`)
        packagePaths.push(await packageTarget(target, options))
    }

    return packagePaths
}

export async function publishTargets(options = {}) {
    const packagePaths = await packageTargets(options)

    for (const packagePath of packagePaths) {
        console.log(`Publishing ${packagePath}`)
        await runVSCE([
            'publish',
            '--packagePath',
            packagePath
        ], packageDir)
    }

    return packagePaths
}

function parseTargets(rawTargets) {
    const targets = rawTargets.flatMap((target) => target.split(',').filter(Boolean))
    for (const target of targets) getTargetNativePackages(target)
    return targets
}

function parseCLIArgs(argv) {
    const args = [...argv]
    const command = args[0] && !args[0].startsWith('-') ? args.shift() : 'package'
    const rawTargets = []
    const packageArgs = []
    let outDir

    while (args.length) {
        const arg = args.shift()
        if (arg === '--') {
            continue
        } else if (arg === '--target' || arg === '-t') {
            const before = rawTargets.length
            while (args[0] && !args[0].startsWith('-')) rawTargets.push(args.shift())
            if (rawTargets.length === before) throw new Error(`${arg} requires at least one target`)
        } else if (arg === '--out-dir') {
            const value = args.shift()
            if (!value) throw new Error('--out-dir requires a value')
            outDir = resolve(packageDir, value)
        } else if (arg === '--all-targets') {
            rawTargets.length = 0
        } else {
            packageArgs.push(arg)
        }
    }

    return {
        command,
        targets: rawTargets.length ? parseTargets(rawTargets) : TARGETS,
        outDir,
        packageArgs
    }
}

async function main() {
    const options = parseCLIArgs(process.argv.slice(2))

    if (options.command === 'package') {
        await packageTargets(options)
        return
    }

    if (options.command === 'publish') {
        await publishTargets(options)
        return
    }

    throw new Error(`Unknown command "${options.command}". Use "package" or "publish".`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
}
