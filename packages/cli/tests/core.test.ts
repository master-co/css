import { execFileSync } from 'child_process'
import { createRequire } from 'module'
import fs from 'node:fs'
import os from 'node:os'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import { describe, expect, it } from 'vitest'
import pkg from '../package.json' with { type: 'json' }

interface TestDiagnostic {
    code: string
}

const cliFilepath = resolve(__dirname, '../src/bin/index.ts')
const tsconfigPath = resolve(__dirname, '../../../tsconfig.json')
const tsxLoaderURL = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href

function runCLI(args: string[], options: { cwd?: string } = {}) {
    return execFileSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath, ...args], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: options.cwd,
        env: {
            ...process.env,
            TSX_TSCONFIG_PATH: tsconfigPath
        }
    })
}

function runFailedCLI(args: string[], options: { cwd?: string } = {}) {
    try {
        runCLI(args, options)
    } catch (error) {
        return error as { stderr?: Buffer | string, stdout?: Buffer | string, status?: number }
    }
    throw new Error(`Expected CLI command to fail: ${args.join(' ')}`)
}

describe('root command', () => {
    it('shows scan options and the lint subcommand', () => {
        const output = runCLI(['--help'])
        expect(output).toContain('Usage: @master/css-cli [options] [command] [source paths...]')
        expect(output).toContain('-w, --watch')
        expect(output).toContain('--no-export')
        expect(output).toContain('Commands:')
        expect(output).toContain('lint')
        expect(output).not.toContain('extract [options]')
        expect(output).not.toContain('render [options]')
    })

    it.each(['extract', 'render', 'scan'])('rejects removed %s command', (command) => {
        const error = runFailedCLI([command])
        expect(error.status).toBe(1)
        expect(String(error.stderr)).toContain(`The "${command}" command was removed.`)
    })

    it('publishes only the package-name binary', () => {
        expect(pkg.bin).toBe('./dist/bin/index.js')
    })
})

describe('lint command', () => {
    it('prints machine-readable diagnostics as json', () => {
        const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'master-css-cli-lint-json-'))
        try {
            fs.writeFileSync(resolve(cwd, 'index.html'), '<div class="fg:white m:2x text-decoration:bad()"></div>')
            const error = runFailedCLI(['lint', '--format', 'json', 'index.html'], { cwd })
            expect(error.status).toBe(1)
            const results = JSON.parse(String(error.stdout))
            expect(results).toHaveLength(1)
            expect(results[0].diagnostics.map((diagnostic: TestDiagnostic) => diagnostic.code)).toEqual(expect.arrayContaining([
                'invalid-class-order',
                'invalid-class'
            ]))
            expect(results[0].diagnostics[0]).toHaveProperty('loc.start.line')
        } finally {
            fs.rmSync(cwd, { recursive: true, force: true })
        }
    })

    it('fixes class-list diagnostics', () => {
        const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'master-css-cli-lint-fix-'))
        try {
            const file = resolve(cwd, 'index.html')
            fs.writeFileSync(file, '<div class="fg:white m:2x"></div>')
            runCLI(['lint', '--fix', 'index.html'], { cwd })
            expect(fs.readFileSync(file, 'utf8')).toBe('<div class="m:xs fg:white"></div>')
        } finally {
            fs.rmSync(cwd, { recursive: true, force: true })
        }
    })
})
