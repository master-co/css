#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { startMasterCSSMCPStdioServer } from '../server'

function readPackageVersion() {
    const directory = dirname(fileURLToPath(import.meta.url))
    try {
        const pkg = JSON.parse(readFileSync(resolve(directory, '../../package.json'), 'utf8')) as { version?: string }
        return pkg.version || '0.0.0'
    } catch {
        return '0.0.0'
    }
}

function printHelp() {
    process.stdout.write(`Usage: master-css-mcp [options]

Options:
  --root <dir>          Workspace root. Defaults to the current working directory.
  --preview-ttl <ms>    Preview confirmation token TTL in milliseconds.
  --version             Print version.
  --help                Print help.
`)
}

function parseArgs(argv: string[]) {
    const options: { root?: string, previewTTL?: number } = {}
    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index]
        switch (arg) {
            case '--root':
                options.root = argv[++index]
                if (!options.root) throw new Error('--root requires a directory.')
                break
            case '--preview-ttl': {
                const value = Number(argv[++index])
                if (!Number.isFinite(value) || value <= 0) throw new Error('--preview-ttl requires a positive number.')
                options.previewTTL = value
                break
            }
            case '--version':
                process.stdout.write(`${readPackageVersion()}\n`)
                process.exit(0)
                break
            case '--help':
                printHelp()
                process.exit(0)
                break
            default:
                throw new Error(`Unknown option: ${arg}`)
        }
    }
    return options
}

try {
    await startMasterCSSMCPStdioServer(parseArgs(process.argv.slice(2)))
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
}
