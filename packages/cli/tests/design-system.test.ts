import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import runInspect from '../src/inspect'

afterEach(() => { vi.restoreAllMocks(); process.exitCode = 0 })

test('inspect emits the shared design-system report and respects diagnostic exit policy', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'master-design-cli-')))
  try {
    mkdirSync(join(cwd, 'node_modules/@master/css'), { recursive: true })
    writeFileSync(join(cwd, 'node_modules/@master/css/package.json'), JSON.stringify({ name: '@master/css', style: './index.css' }))
    writeFileSync(join(cwd, 'node_modules/@master/css/index.css'), '@utility fg-(--color) {color:var(--color)}')
    writeFileSync(join(cwd, 'app.css'), '@import "@master/css";@theme {--color-brand:red}.card {color:var(--color-brand)}')
    writeFileSync(join(cwd, 'design-system.options.json'), JSON.stringify({ version: 1, metadata: { '--color-brand': { deprecated: true } } }))
    const output = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const report = await runInspect([], { cwd, designSystem: true, designSystemOptions: 'design-system.options.json', maxWarnings: 0 })
    expect(report.version).toBe(1)
    expect(report.summary.warnings).toBeGreaterThan(0)
    expect(process.exitCode).toBe(1)
    expect(JSON.parse(String(output.mock.calls.at(-1)?.[0]))).toEqual(report)
    process.exitCode = 0
    await runInspect([], { cwd, designSystem: true, designSystemOptions: 'design-system.options.json', maxWarnings: 0, exitCode: 'never' })
    expect(process.exitCode).toBe(0)

    // An explicitly supplied invalid policy must not become the default policy.
    for (const invalid of [null, [], {}, { version: 2 }]) {
      writeFileSync(join(cwd, 'design-system.options.json'), JSON.stringify(invalid))
      await expect(runInspect([], { cwd, designSystem: true, designSystemOptions: 'design-system.options.json' })).rejects.toThrow()
    }
  } finally { rmSync(cwd, { recursive: true, force: true }) }
})

test('rejects ambiguous inspection modes and does not silently ignore options', async () => {
  await expect(runInspect([], { designSystemOptions: 'policy.json' })).rejects.toThrow('requires --design-system')
  await expect(runInspect([], { designSystem: true, snapshot: true })).rejects.toThrow('do not combine')
  await expect(runInspect([], { designSystem: true, classes: 'card' })).rejects.toThrow('do not combine')
})

test('inspects route stylesheets named by source paths and rejects non-CSS matches', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'master-design-cli-route-')))
  try {
    mkdirSync(join(cwd, 'node_modules/@master/css'), { recursive: true })
    writeFileSync(join(cwd, 'node_modules/@master/css/package.json'), JSON.stringify({ name: '@master/css', style: './index.css' }))
    writeFileSync(join(cwd, 'node_modules/@master/css/index.css'), '@utility fg-(--color) {color:var(--color)}')
    writeFileSync(join(cwd, 'app.css'), '@import "@master/css";@theme {--color-brand:red}')
    mkdirSync(join(cwd, 'routes'))
    writeFileSync(join(cwd, 'routes/home.css'), '.hero {color:var(--color-brand)}')
    writeFileSync(join(cwd, 'routes/page.tsx'), 'import "./home.css"')
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const report = await runInspect(['routes/*.css'], { cwd, designSystem: true })
    expect(report.project.routeStylesheets).toEqual([join(cwd, 'routes/home.css')])
    expect(report.references.map(item => item.token)).toContain('--color-brand')
    await expect(runInspect(['routes/*'], { cwd, designSystem: true })).rejects.toThrow('must be stylesheets')
    await expect(runInspect(['missing/*.css'], { cwd, designSystem: true })).rejects.toThrow('No route stylesheet matched')
  } finally { rmSync(cwd, { recursive: true, force: true }) }
})
