import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TARGETS, packageDir } from './package-target-core.js'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(scriptDir, '../../..')
const packageJsonPath = resolve(packageDir, 'package.json')
const marketplaceUrl = 'https://marketplace.visualstudio.com/items?itemName=masterco.master-css-vscode'
const allowedReleaseChanges = new Set([
    'packages/vscode/package.json',
    'pnpm-lock.yaml'
])

function corepackCommand() {
    return process.platform === 'win32' ? 'corepack.cmd' : 'corepack'
}

function parseTargets(rawTargets) {
    const targets = rawTargets.flatMap((target) => target.split(',').filter(Boolean))
    for (const target of targets) {
        if (!TARGETS.includes(target)) {
            throw new Error(`Unsupported VS Code target "${target}". Expected one of: ${TARGETS.join(', ')}`)
        }
    }
    return targets
}

export function parseArgs(argv) {
    const rawTargets = []
    let azureCredential = false
    let dryRun = false
    let noPublish = false
    let bump = 'patch'

    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index]
        if (arg === '--') {
            continue
        } else if (arg === '--dry-run') {
            dryRun = true
        } else if (arg === '--no-publish') {
            noPublish = true
        } else if (arg === '--azure-credential') {
            azureCredential = true
        } else if (arg === '--patch') {
            bump = 'patch'
        } else if (arg === '--minor') {
            bump = 'minor'
        } else if (arg === '--major') {
            bump = 'major'
        } else if (arg === '--version') {
            const value = argv[++index]
            if (!value) throw new Error('--version requires a value')
            bump = value
        } else if (arg === '--target' || arg === '-t') {
            const before = rawTargets.length
            while (argv[index + 1] && !argv[index + 1].startsWith('-')) {
                rawTargets.push(argv[++index])
            }
            if (rawTargets.length === before) throw new Error(`${arg} requires at least one target`)
        } else if (arg === '--all-targets') {
            rawTargets.length = 0
        } else if (arg === '--help' || arg === '-h') {
            return { help: true }
        } else {
            throw new Error(`Unknown option "${arg}"`)
        }
    }

    return {
        azureCredential,
        bump,
        dryRun,
        noPublish,
        targets: rawTargets.length ? parseTargets(rawTargets) : TARGETS
    }
}

function printHelp() {
    console.log(`Usage: pnpm release:vscode [options]

Options:
  --patch                 Bump a patch version before release (default)
  --minor                 Bump a minor version before release
  --major                 Bump a major version before release
  --version <version>     Set an exact extension version
  --target, -t <targets>  Release one or more targets, comma or space separated
  --all-targets           Release every supported target (default)
  --no-publish            Build, bump, validate, and package VSIX files only
  --azure-credential      Use Microsoft Entra ID when verifying and publishing
  --dry-run               Print the release plan without mutating files
  --help, -h              Show this help
`)
}

function run(command, args, options = {}) {
    const cwd = options.cwd ?? rootDir
    const label = [command, ...args].join(' ')
    if (!options.silent) console.log(`\n$ ${label}`)

    return new Promise((resolvePromise, rejectPromise) => {
        const child = spawn(command, args, {
            cwd,
            stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
            env: process.env
        })
        let stdout = ''
        let stderr = ''

        child.stdout?.on('data', (chunk) => {
            stdout += chunk
        })
        child.stderr?.on('data', (chunk) => {
            stderr += chunk
        })

        child.on('error', rejectPromise)
        child.on('close', (code, signal) => {
            if (code === 0) {
                resolvePromise(stdout)
            } else {
                rejectPromise(new Error(`${label} failed with ${signal || code}${stderr ? `\n${stderr.trimEnd()}` : ''}`))
            }
        })
    })
}

async function readPackageJson() {
    return JSON.parse(await readFile(packageJsonPath, 'utf8'))
}

function parseMajorMinor(rawVersion, label) {
    const match = rawVersion.match(/^(?:\^|>=)?(\d+|x)\.(\d+|x)\.(\d+|x)(?:-.+)?$/)
    if (!match) throw new Error(`Unable to parse ${label} version "${rawVersion}"`)
    return {
        major: match[1] === 'x' ? 0 : Number(match[1]),
        minor: match[2] === 'x' ? 0 : Number(match[2])
    }
}

function validateVSCodeTypesCompatibility(manifest) {
    const engineVersion = manifest.engines?.vscode
    const typesVersion = manifest.devDependencies?.['@types/vscode']
    if (!engineVersion) throw new Error('Missing engines.vscode in packages/vscode/package.json')
    if (!typesVersion) throw new Error('Missing @types/vscode devDependency in packages/vscode/package.json')
    if (engineVersion === '*') return

    const engine = parseMajorMinor(engineVersion, 'engines.vscode')
    const types = parseMajorMinor(typesVersion, '@types/vscode')
    if (types.major > engine.major || (types.major === engine.major && types.minor > engine.minor)) {
        throw new Error(
            `@types/vscode ${typesVersion} is newer than engines.vscode ${engineVersion}. `
            + 'Set @types/vscode to the same major/minor range before publishing.'
        )
    }
}

async function gitStatus() {
    const output = await run('git', ['status', '--porcelain'], { capture: true, silent: true })
    return output
        .split('\n')
        .map((line) => line.trimEnd())
        .filter(Boolean)
}

function statusPath(line) {
    const rawPath = line.slice(3)
    return rawPath.includes(' -> ') ? rawPath.split(' -> ').at(-1) : rawPath
}

function baselineStatusPaths(baselineLines) {
    return new Set(baselineLines.map(statusPath))
}

export function newStatusLines(lines, baselineLines = []) {
    const baselinePaths = baselineStatusPaths(baselineLines)
    return lines.filter((line) => !baselinePaths.has(statusPath(line)))
}

export function unexpectedReleaseStatusLines(lines, baselineLines = []) {
    const baselinePaths = baselineStatusPaths(baselineLines)
    return lines.filter((line) => {
        const path = statusPath(line)
        return !baselinePaths.has(path) && !allowedReleaseChanges.has(path)
    })
}

async function assertNoNewChanges(message, baselineLines) {
    const lines = await gitStatus()
    const unexpected = newStatusLines(lines, baselineLines)
    if (unexpected.length) {
        throw new Error(`${message}\n${unexpected.join('\n')}`)
    }
}

async function assertOnlyExpectedChanges(baselineLines) {
    const lines = await gitStatus()
    const unexpected = unexpectedReleaseStatusLines(lines, baselineLines)
    if (unexpected.length) {
        throw new Error(`Release produced unexpected tracked changes:\n${unexpected.join('\n')}`)
    }
}

function printPlan(options, manifest, statusLines) {
    console.log('VS Code extension release plan')
    console.log(`Package: ${manifest.name}`)
    console.log(`Current version: ${manifest.version}`)
    console.log(`Version bump: ${options.bump}`)
    console.log(`Targets: ${options.targets.join(', ')}`)
    console.log(`Publish: ${options.noPublish ? 'no, package only' : 'yes'}`)
    console.log(`Authentication: ${options.noPublish ? 'not used' : options.azureCredential ? 'Microsoft Entra ID' : 'VSCE credential store or PAT'}`)
    console.log(`Marketplace: ${marketplaceUrl}`)
    console.log(`VS Code engine: ${manifest.engines?.vscode}`)
    console.log(`@types/vscode: ${manifest.devDependencies?.['@types/vscode']}`)
    if (statusLines.length) {
        console.log('\nCurrent worktree has existing changes. A real release will preserve them and only allow expected VS Code version changes:')
        for (const line of statusLines) console.log(line)
    }
}

function targetArgs(targets) {
    return targets.length === TARGETS.length ? [] : ['--', '--target', ...targets]
}

function publishArgs(options) {
    const args = targetArgs(options.targets)
    if (options.azureCredential) {
        if (!args.length) args.push('--')
        args.push('--azure-credential')
    }
    return args
}

async function main() {
    const options = parseArgs(process.argv.slice(2))
    if (options.help) {
        printHelp()
        return
    }

    const manifest = await readPackageJson()
    validateVSCodeTypesCompatibility(manifest)

    if (options.dryRun) {
        printPlan(options, manifest, await gitStatus())
        return
    }

    const initialStatusLines = await gitStatus()

    await run(corepackCommand(), ['pnpm', 'build'])
    await assertNoNewChanges('Root build changed tracked files; review those changes before releasing.', initialStatusLines)

    await run(corepackCommand(), ['pnpm', '--dir', relative(rootDir, packageDir), 'version', options.bump, '--no-git-tag-version'])

    const bumpedManifest = await readPackageJson()
    validateVSCodeTypesCompatibility(bumpedManifest)

    await run(corepackCommand(), ['pnpm', '--filter', '@master/css-vscode', 'build'])
    await run(corepackCommand(), ['pnpm', '--filter', '@master/css-vscode', 'type-check'])
    await assertOnlyExpectedChanges(initialStatusLines)

    if (options.noPublish) {
        await run(corepackCommand(), ['pnpm', '--filter', '@master/css-vscode', 'vscode:package', ...targetArgs(options.targets)])
    } else {
        await run(corepackCommand(), [
            'pnpm',
            '--filter',
            '@master/css-vscode',
            'exec',
            'vsce',
            'verify-pat',
            ...(options.azureCredential ? ['--azure-credential'] : []),
            bumpedManifest.publisher
        ])
        await run(corepackCommand(), ['pnpm', '--filter', '@master/css-vscode', 'vscode:publish', ...publishArgs(options)])
    }

    console.log('\nVS Code extension release complete')
    console.log(`Version: ${bumpedManifest.version}`)
    console.log(`Targets: ${options.targets.join(', ')}`)
    console.log(`Marketplace: ${marketplaceUrl}`)
    console.log('Tracked changes:')
    for (const line of await gitStatus()) console.log(line)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
}
