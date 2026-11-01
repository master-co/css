import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import os from 'node:os'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, beforeEach, expect, test } from 'vitest'

const cli = resolve(__dirname, '../src/bin/index.ts')
const loader = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href
let root: string
beforeEach(() => { root = fs.realpathSync(fs.mkdtempSync(resolve(os.tmpdir(), 'master-suggest-'))) })
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }) })

function run(args: string[], input?: string) {
  const result = spawnSync(process.execPath, ['--import', loader, cli, 'suggest', ...args], {
    cwd: root,
    input,
    encoding: 'utf8',
    timeout: 15000,
    env: { ...process.env, TSX_TSCONFIG_PATH: resolve(__dirname, '../../../tsconfig.json') }
  })
  expect(result.error).toBeUndefined()
  return { ...result, report: JSON.parse(result.stdout) }
}

test('argument and stdin return the same preset suggestions without creating files', () => {
  const input = 'display:flex; align-items:center; padding:16px; gap:1rem;'
  const result = run([input])
  expect(result.status).toBe(0)
  expect(result.stderr).toBe('')
  expect(result.report.version).toBe(1)
  expect(result.report.manifest).toEqual({ status: 'loaded', entries: [] })
  expect(result.report.result.classes).toEqual(['flex', 'items-center', 'p(16)', '(gap:1rem)'])
  expect(result.report.result.verification).toEqual({ declarations: true, cascade: false, browser: false })
  expect(result.report.validation).toHaveLength(4)
  expect(result.report.validation.every((item: { browserSupport: string }) => item.browserSupport === 'not-checked')).toBe(true)
  expect(run(['--stdin'], input).report).toEqual(result.report)
  expect(fs.readdirSync(root)).toEqual([])
})

test('loads the selected project and respects utility overrides and token identity', () => {
  const project = resolve(root, 'app')
  fs.mkdirSync(project)
  const css = '@import "@master/css"; @theme { --spacing-card: 23px; } @utility flex { display:grid; }'
  fs.writeFileSync(resolve(project, 'index.css'), css)
  const result = run(['display:flex; padding:var(--spacing-card);', '--cwd', 'app'])
  expect(result.status).toBe(0)
  expect(result.report.manifest.entries).toEqual([resolve(project, 'index.css')])
  expect(result.report.result.classes).toEqual(['(display:flex)', 'p-card'])
  expect(result.report.result.css).toContain('var(--spacing-card)')
  expect(fs.readFileSync(resolve(project, 'index.css'), 'utf8')).toBe(css)
})

test.each([
  'display: -webkit-box;\n display: flex;',
  'padding:1rem;padding-left:0;',
  '--custom:red;color:var(--custom);',
  '.card { display:flex; }'
])('preserves an unsupported block exactly: %s', input => {
  const result = run(['--', input])
  expect(result.status).toBe(0)
  expect(result.report.result.status).toBe('preserved')
  expect(result.report.result.classes).toEqual([])
  expect(result.report.result.remainingCss).toBe(input)
  expect(result.report.result.notes.length).toBeGreaterThan(0)
})

test('known invalid values fail while retaining the proposal and per-class diagnostics', () => {
  const result = run(['padding:red;'])
  expect(result.status).toBe(1)
  expect(result.report.result).not.toBeNull()
  expect(result.report.validation[0].cssValueStatus).toBe('invalid')
  expect(result.report.diagnostics).toEqual(expect.arrayContaining([
    expect.objectContaining({ code: 'CSS_VALUE_INVALID', severity: 'error', className: '(padding:red)' })
  ]))
})

test('unresolved CSS variables are not reported as invalid values', () => {
  const result = run(['width:var(--external-width);'])
  expect(result.status).toBe(0)
  expect(result.report.validation[0].cssValueStatus).toBe('unknown')
})

test('a broken project manifest fails without falling back to the preset', () => {
  fs.writeFileSync(resolve(root, 'index.css'), '@import "@master/css"; @import "./missing.css";')
  const result = run(['display:flex;'])
  expect(result.status).toBe(1)
  expect(result.report.manifest.status).toBe('error')
  expect(result.report.result).toBeNull()
  expect(result.report.diagnostics[0].code).toBe('PROJECT_MANIFEST_LOAD_ERROR')
})

test.each([
  { args: [], input: undefined },
  { args: ['display:flex;', '--stdin'], input: 'display:grid;' },
  { args: ['--stdin'], input: ' \n ' },
  { args: [''], input: undefined },
  { args: ['display:flex;', '--cwd', 'missing'], input: undefined }
])('rejects invalid input before loading the manifest: $args', ({ args, input }) => {
  const result = run(args, input)
  expect(result.status).toBe(1)
  expect(result.report.manifest.status).toBe('not-loaded')
  expect(result.report.result).toBeNull()
  expect(result.report.diagnostics[0].code).toBe('SUGGEST_INPUT_ERROR')
})
