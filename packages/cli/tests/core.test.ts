import { execFileSync } from 'child_process'
import { createRequire } from 'module'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import { describe, expect, it } from 'vitest'
import pkg from '../package.json' with { type: 'json' }

const cliFilepath = resolve(__dirname, '../src/bin/index.ts')
const tsxLoaderURL = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href

function runCLI(args: string[]) {
    return execFileSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath, ...args], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
    })
}

function runFailedCLI(args: string[]) {
    try {
        runCLI(args)
    } catch (error) {
        return error as { stderr?: Buffer | string, status?: number }
    }
    throw new Error(`Expected CLI command to fail: ${args.join(' ')}`)
}

describe('root command', () => {
    it('shows scan options without subcommands', () => {
        const output = runCLI(['--help'])
        expect(output).toContain('Usage: @master/css-cli [options] [source paths...]')
        expect(output).toContain('-w, --watch')
        expect(output).toContain('--no-export')
        expect(output).not.toContain('Commands:')
        expect(output).not.toContain('extract [options]')
        expect(output).not.toContain('render [options]')
    })

    it.each(['extract', 'render', 'scan'])('rejects removed %s command', (command) => {
        const error = runFailedCLI([command])
        expect(error.status).toBe(1)
        expect(String(error.stderr)).toContain(`The "${command}" command was removed.`)
    })

    it('publishes only the package-name binary', () => {
        expect(pkg.bin).toBe('./dist/bin/index.mjs')
    })
})
