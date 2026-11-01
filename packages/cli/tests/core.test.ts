import { execFileSync, spawnSync } from 'child_process'
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

function runCLI(args: string[], options: { cwd?: string, input?: string, env?: NodeJS.ProcessEnv } = {}) {
  return execFileSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath, ...args], {
    encoding: 'utf8',
    // Project snapshots embed the complete preset manifest.
    maxBuffer: 16 * 1024 * 1024,
    input: options.input,
    stdio: [options.input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
    cwd: options.cwd,
    env: {
      ...process.env,
      ...options.env,
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
  it('captures a project and compares definitions without changing class strings', () => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'master-cli-impact-'))
    try {
      const file = resolve(cwd, 'app.css')
      fs.writeFileSync(file, '@import "@master/css";@theme{--color-brand:red;--color-information:red}')
      fs.writeFileSync(resolve(cwd, 'index.html'), '<div class="bg-brand fg-information"></div>')
      const before = runCLI(['inspect', '*.html', '--snapshot'], { cwd })
      expect(JSON.parse(before).version).toBe(1)
      fs.writeFileSync(resolve(cwd, 'before.json'), before)
      fs.writeFileSync(file, '@import "@master/css";@theme{--color-brand:blue;--color-information:red}')
      const report = JSON.parse(runCLI(['inspect', '*.html', '--compare', 'before.json'], { cwd }))
      expect(report.classes.map((item: { className: string }) => item.className)).toEqual(['bg-brand'])
      expect(report.coverage.browser).toBe('not-checked')
      fs.writeFileSync(file, '@import "@master/css";@theme{--color-information:red}')
      const removal = JSON.parse(runCLI(['inspect', '*.html', '--compare', 'before.json'], { cwd }))
      expect(removal.classes[0]).toMatchObject({ className: 'bg-brand', afterMatchStatus: 'syntax-error', afterRules: [] })
      expect(runFailedCLI(['inspect', '--snapshot', '--compare', 'before.json'], { cwd }).status).toBe(1)
    } finally { fs.rmSync(cwd, { recursive: true, force: true }) }
  })
  it('generates CSS only through the explicit generate command', () => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'master-css-cli-generate-'))
    try {
      fs.writeFileSync(resolve(cwd, 'index.css'), `@import "@master/css";
@theme { --color-brand: red; }
`)
      fs.writeFileSync(resolve(cwd, 'index.html'), "<div class=\"(display:block) fg-brand\"></div>")
      const output = runCLI(['generate', '--no-export'], { cwd })
      expect(output).toContain(".\\(display\\:block\\){display:block}")
      expect(output).toContain('.fg-brand{color:var(--color-brand)}')
      expect(fs.existsSync(resolve(cwd, 'master.css'))).toBe(false)
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('shows only the three explicit commands', () => {
    const output = runCLI(['--help'])
    expect(output).toContain('Usage: master-css [options] [command]')
    expect(output).toContain('Commands:')
    expect(output).toContain('generate')
    expect(output).toContain('lint')
    expect(output).toContain('inspect')
    const generateHelp = runCLI(['generate', '--help'])
    expect(generateHelp).toContain('-w, --watch')
    expect(generateHelp).toContain('--no-export')
  })

  it('publishes only the master-css binary', () => {
    expect(pkg.bin).toEqual({
      'master-css': './dist/bin/index.js'
    })
  })
})

describe('inspect command', () => {
  it('prints scanner state and missing CSS diagnostics as json', () => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'master-css-cli-inspect-json-'))
    try {
      fs.writeFileSync(resolve(cwd, 'index.html'), "<div class=\"(display:block) p-missing\"></div>")
      const error = runFailedCLI([
        'inspect',
        '--classes',
        '(display:block) never-generated-class',
        'index.html'
      ], { cwd })
      expect(error.status).toBe(1)
      const report = JSON.parse(String(error.stdout))
      expect(report.version).toBe(5)
      expect(report.inputs.files[0]).toMatch(/index\.html$/)
      expect(report.scanner.classes.valid).toContain("(display:block)")
      expect(report.scanner.classes.invalid).toContain('p-missing')
      expect(report.files).toHaveLength(1)
      expect(report.files[0].discovered.valid).toContain("(display:block)")
      expect(report.files[0].discovered.invalid).toContain('p-missing')
      expect(report.missingCSS.present).toContainEqual(expect.objectContaining({
        className: "(display:block)",
        reason: 'generated'
      }))
      expect(report.missingCSS.missing).toContainEqual(expect.objectContaining({
        className: 'never-generated-class',
        reason: 'not-detected'
      }))
      expect(report.diagnostics).toContainEqual(expect.objectContaining({
        code: 'UNKNOWN_TOKEN',
        sourceKind: 'scanner',
        filePath: expect.stringMatching(/index\.html$/)
      }))
      expect(report.diagnostics).toContainEqual(expect.objectContaining({
        code: 'missing-css',
        sourceKind: 'missing-css'
      }))
      expect(report.summary.errors).toBe(2)
      expect(report.summary.warnings).toBe(0)
      expect(report.css.bytes).toBeGreaterThan(0)
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('can include generated CSS and stylesheet entry metadata without failing', () => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'master-css-cli-inspect-css-'))
    try {
      fs.writeFileSync(resolve(cwd, 'index.css'), "@import \"@master/css\";")
      fs.writeFileSync(resolve(cwd, 'index.html'), "<div class=\"(display:block)\"></div>")
      const output = runCLI([
        'inspect',
        '--classes',
        "(display:block)",
        '--include-css',
        '--exit-code',
        'never',
        'index.html'
      ], { cwd })
      const report = JSON.parse(output)
      expect(report.stylesheets.entries).toHaveLength(1)
      expect(report.stylesheets.entries[0]).toEqual(expect.objectContaining({
        filePath: fs.realpathSync(resolve(cwd, 'index.css')),
        masterCSS: true,
        pruneNativeCSS: false
      }))
      expect(report.stylesheets.entries[0].dependencies).toContain(fs.realpathSync(resolve(cwd, 'index.css')))
      expect(report.css.included).toBe(true)
      expect(report.css.text).toContain('display:block')
      expect(report.missingCSS.missing).toHaveLength(0)
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('reports entry errors without inspecting against a fallback manifest', () => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'master-css-cli-inspect-entry-error-'))
    try {
      fs.writeFileSync(resolve(cwd, 'index.css'), "@import \"@master/css\";\n@import \"./missing.css\";")
      fs.writeFileSync(resolve(cwd, 'index.html'), "<div class=\"(display:block)\"></div>")
      const error = runFailedCLI(['inspect', 'index.html'], { cwd })
      expect(error.status).toBe(1)
      const report = JSON.parse(String(error.stdout))
      expect(report.stylesheets.entries).toHaveLength(1)
      expect(report.stylesheets.entries[0].errors[0]).toContain('CSS file not found')
      expect(report.stylesheets.errors).toContainEqual(expect.objectContaining({
        filePath: fs.realpathSync(resolve(cwd, 'index.css')),
        message: expect.stringContaining('CSS file not found')
      }))
      expect(report.scanner.classes.valid).toEqual([])
      expect(report.inspections).toEqual([])
      expect(report.diagnostics).toContainEqual(expect.objectContaining({
        code: 'stylesheet-error',
        severity: 'error',
        sourceKind: 'stylesheet',
        filePath: fs.realpathSync(resolve(cwd, 'index.css'))
      }))
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  })
})

describe('lint command', () => {
  it('distinguishes checked clean inputs, diagnostic files and unmatched patterns', () => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'master-css-cli-lint-coverage-'))
    try {
      fs.writeFileSync(resolve(cwd, 'clean.html'), '<div class="block"></div>')
      fs.writeFileSync(resolve(cwd, 'invalid.html'), '<div class="(padding:red)"></div>')
      const clean = JSON.parse(runCLI(['lint', 'clean.html'], { cwd }))
      expect(clean.coverage).toEqual({ status: 'complete', checkedFiles: [fs.realpathSync(resolve(cwd, 'clean.html'))] })
      expect(clean.files).toEqual([])
      expect(clean.summary).toMatchObject({ checkedFiles: 1, filesWithDiagnostics: 0, errors: 0 })
      expect(clean.summary).not.toHaveProperty('files')
      const mixed = JSON.parse(runCLI(['lint', '*.html', '--exit-code', 'never'], { cwd }))
      expect(mixed.coverage.checkedFiles).toHaveLength(2)
      expect(mixed.summary).toMatchObject({ checkedFiles: 2, filesWithDiagnostics: 1 })
      expect(mixed.files.map((file: { filePath: string }) => file.filePath)).toEqual([fs.realpathSync(resolve(cwd, 'invalid.html'))])
      const empty = JSON.parse(runCLI(['lint', 'missing/*.html'], { cwd }))
      expect(empty.coverage).toEqual({ status: 'no-inputs', checkedFiles: [] })
      expect(empty.summary).toMatchObject({ checkedFiles: 0, filesWithDiagnostics: 0 })
      const stdin = JSON.parse(runCLI(['lint', '--stdin', '--stdin-filepath', 'unsaved.html'], { cwd, input: '<div class="block"></div>' }))
      expect(stdin.coverage).toEqual({ status: 'complete', checkedFiles: [resolve(fs.realpathSync(cwd), 'unsaved.html')] })
      expect(stdin.summary).toMatchObject({ checkedFiles: 1, filesWithDiagnostics: 0 })
      expect(fs.existsSync(resolve(cwd, 'unsaved.html'))).toBe(false)
      const stylish = spawnSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath, 'lint', 'clean.html', '--format', 'stylish'], {
        cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TSX_TSCONFIG_PATH: tsconfigPath }
      })
      expect(stylish.status).toBe(0)
      expect(stylish.stdout).toBe('')
      expect(stylish.stderr).toContain('Checked 1 source inputs; 0 with diagnostics.')
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('uses the scanner source policy for default files while honoring explicit paths', () => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'master-css-cli-lint-sources-'))
    try {
      fs.mkdirSync(resolve(cwd, 'dist'))
      fs.writeFileSync(resolve(cwd, '.gitignore'), 'ignored.html\n')
      for (const file of ['index.html', 'ignored.html', 'dist/output.html']) {
        fs.writeFileSync(resolve(cwd, file), '<div class="scale(2)"></div>')
      }
      fs.writeFileSync(resolve(cwd, 'entry.mjs'), "document.body.classList.add('scale(2)')")
      const defaults = JSON.parse(runCLI(['lint', '--exit-code', 'never'], { cwd }))
      expect(defaults.files.map((file: { filePath: string }) => file.filePath).sort()).toEqual([
        fs.realpathSync(resolve(cwd, 'entry.mjs')), fs.realpathSync(resolve(cwd, 'index.html'))
      ])
      expect(defaults.coverage.checkedFiles.sort()).toEqual(defaults.files.map((file: { filePath: string }) => file.filePath).sort())
      const explicit = JSON.parse(runCLI(['lint', 'dist/output.html', 'ignored.html', '--exit-code', 'never'], { cwd }))
      expect(explicit.files.map((file: { filePath: string }) => file.filePath).sort()).toEqual([
        fs.realpathSync(resolve(cwd, 'dist/output.html')), fs.realpathSync(resolve(cwd, 'ignored.html'))
      ])
      expect(explicit.coverage.checkedFiles.sort()).toEqual(explicit.files.map((file: { filePath: string }) => file.filePath).sort())
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('prints machine-readable diagnostics as json', () => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'master-css-cli-lint-json-'))
    try {
      fs.writeFileSync(resolve(cwd, 'index.html'), "<div class=\"fg-white (margin:0.5rem) (padding:red)\"></div>")
      const error = runFailedCLI(['lint', 'index.html'], { cwd })
      expect(error.status).toBe(1)
      const report = JSON.parse(String(error.stdout))
      expect(report.version).toBe(5)
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
        input: "<div className=\"fg-white (margin:0.5rem)\"></div>"
      })
      const report = JSON.parse(output)
      expect(report.files).toHaveLength(1)
      expect(report.files[0].filePath).toMatch(/src[/\\]App\.tsx$/)
      expect(report.files[0].diagnostics.some((diagnostic: TestDiagnostic) => diagnostic.code === 'invalid-class-order')).toBe(true)
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('reports manifest preflight diagnostics', () => {
    const cwd = fs.mkdtempSync(resolve(os.tmpdir(), 'master-css-cli-lint-manifest-'))
    try {
      fs.writeFileSync(resolve(cwd, 'index.css'), "@import \"@master/css\";\n\n.btn { @contents; }")
      const error = runFailedCLI(['lint'], { cwd })
      expect(error.status).toBe(1)
      const report = JSON.parse(String(error.stdout))
      expect(report.manifest.status).toBe('error')
      expect(report.coverage).toEqual({ status: 'not-run', checkedFiles: [] })
      expect(report.summary).toMatchObject({ checkedFiles: 0, filesWithDiagnostics: 0, errors: 1 })
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
      fs.writeFileSync(file, "<div class=\"fg-white (margin:0.5rem)\"></div>")
      const report = JSON.parse(runCLI(['lint', '--fix', 'index.html'], { cwd }))
      expect(report.coverage.status).toBe('complete')
      expect(report.summary).toMatchObject({ checkedFiles: 1, filesWithDiagnostics: 0 })
      expect(fs.readFileSync(file, 'utf8')).toBe("<div class=\"(margin:0.5rem) fg-white\"></div>")
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  })

})
