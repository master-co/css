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
    sourceKind?: string
    fixes?: { kind: string, safety: string }[]
}

const cliFilepath = resolve(__dirname, '../src/bin/index.ts')
const tsconfigPath = resolve(__dirname, '../../../tsconfig.json')
const tsxLoaderURL = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href

function runCLI(args: string[], options: { cwd?: string, input?: string } = {}) {
    return execFileSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath, ...args], {
        encoding: 'utf8',
        input: options.input,
        stdio: [options.input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
        cwd: options.cwd,
        env: {
            ...process.env,
            TSX_TSCONFIG_PATH: tsconfigPath
        }
    })
}

function runFailedCLI(args: string[], options: { cwd?: string, input?: string } = {}) {
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
            const error = runFailedCLI(['lint', 'index.html'], { cwd })
            expect(error.status).toBe(1)
            const report = JSON.parse(String(error.stdout))
            expect(report.version).toBe(1)
            expect(report.manifest.status).toBe('loaded')
            expect(report.files).toHaveLength(1)
            expect(report.files[0].diagnostics.map((diagnostic: TestDiagnostic) => diagnostic.code)).toEqual(expect.arrayContaining([
                'invalid-class-order',
                'invalid-class'
            ]))
            expect(report.files[0].diagnostics[0]).toHaveProperty('loc.start.line')
            expect(report.summary.errors).toBeGreaterThan(0)
        } finally {
            fs.rmSync(cwd, { recursive: true, force: true })
        }
    })

    it('lints stdin buffers without requiring ESLint parser configuration', () => {
        const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'master-css-cli-lint-stdin-'))
        try {
            const output = runCLI([
                'lint',
                '--stdin',
                '--stdin-filepath',
                'src/App.tsx',
                '--exit-code',
                'never'
            ], {
                cwd,
                input: '<div className="fg:white m:2x"></div>'
            })
            const report = JSON.parse(output)
            expect(report.files).toHaveLength(1)
            expect(report.files[0].filePath).toMatch(/src[/\\]App\.tsx$/)
            expect(report.files[0].diagnostics.some((diagnostic: TestDiagnostic) => diagnostic.code === 'invalid-class-order')).toBe(true)
        } finally {
            fs.rmSync(cwd, { recursive: true, force: true })
        }
    })

    it('includes stylesheet compose diagnostics in the default source set', () => {
        const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'master-css-cli-lint-css-'))
        try {
            fs.writeFileSync(resolve(cwd, 'index.css'), '.btn { @compose text-align:center contain:content; }')
            const output = runCLI(['lint', '--exit-code', 'never'], { cwd })
            const report = JSON.parse(output)
            expect(report.files).toHaveLength(1)
            expect(report.files[0].sourceKind).toBe('stylesheet')
            expect(report.files[0].diagnostics).toContainEqual(expect.objectContaining({
                code: 'prefer-canonical-class',
                sourceKind: 'compose-directive'
            }))
            expect(report.files[0].diagnostics).toContainEqual(expect.objectContaining({
                code: 'prefer-native-declaration',
                sourceKind: 'compose-directive',
                fixes: [expect.objectContaining({ kind: 'directive', safety: 'structural' })]
            }))
        } finally {
            fs.rmSync(cwd, { recursive: true, force: true })
        }
    })

    it('reports manifest preflight diagnostics', () => {
        const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'master-css-cli-lint-manifest-'))
        try {
            fs.writeFileSync(resolve(cwd, 'index.css'), '@master entry;\n\n.btn { @compose "block"; }')
            const error = runFailedCLI(['lint'], { cwd })
            expect(error.status).toBe(1)
            const report = JSON.parse(String(error.stdout))
            expect(report.manifest.status).toBe('error')
            expect(report.files).toHaveLength(1)
            expect(report.files[0].sourceKind).toBe('manifest')
            expect(report.files[0].diagnostics).toContainEqual(expect.objectContaining({
                ruleId: 'manifest',
                code: 'manifest-loading-error',
                sourceKind: 'manifest'
            }))
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

    it('does not write structural directive fixes unless explicitly allowed', () => {
        const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'master-css-cli-lint-directive-fix-'))
        try {
            const file = resolve(cwd, 'index.css')
            fs.writeFileSync(file, '.btn { @compose contain:content; }')
            runCLI(['lint', '--fix', 'index.css'], { cwd })
            expect(fs.readFileSync(file, 'utf8')).toBe('.btn { @compose contain:content; }')

            runCLI(['lint', '--fix', '--fix-directives', 'index.css'], { cwd })
            expect(fs.readFileSync(file, 'utf8')).toBe('.btn { contain: content; }')
        } finally {
            fs.rmSync(cwd, { recursive: true, force: true })
        }
    })
})
