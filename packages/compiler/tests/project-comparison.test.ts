import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { captureMasterCSSProject, compareProjectSnapshots } from '../src/diagnostics'
import { compileManifest, createCompiler } from '../src'

const manifest = { version: 6, languageVersion: 16 } as const

test('captures resolved files and compares token edits without changing markup', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-impact-')))
  try {
    mkdirSync(join(root, 'node_modules/@master/css'), { recursive: true })
    writeFileSync(join(root, 'node_modules/@master/css/package.json'), '{"name":"@master/css","style":"./index.css"}')
    writeFileSync(join(root, 'node_modules/@master/css/index.css'), '@layer theme,base,defaults,components,utilities;@mixin --bg(--color){background-color:var(--color)} @utility bg(--color) {background-color:var(--color)}@utility bg-(--color) {background-color:var(--color)}@mixin --fg(--color){color:var(--color)} @utility fg(--color) {color:var(--color)}@utility fg-(--color) {color:var(--color)}')
    const source = '@import "@master/css";@import "./native.css";@source "./extra/*.html";@theme{--color-brand:red;--color-information:red}'
    writeFileSync(join(root, 'app.css'), source)
    writeFileSync(join(root, 'native.css'), '@import "https://example.com/vendor.css";@layer components{.card{color:var(--color-brand);color:var(--color-brand,red)}}')
    writeFileSync(join(root, 'index.html'), '<div class="bg-brand fg-information card"></div>')
    mkdirSync(join(root, 'extra'))
    writeFileSync(join(root, 'extra/other.html'), '<div class="bg-brand"></div>')
    const options = { cwd: root, manifest }
    const { snapshot: before } = await captureMasterCSSProject(options)
    expect(before.sources.find(file => file.path.endsWith('index.html'))?.classes).toContain('bg-brand')
    expect(before.sources.find(file => file.path.endsWith('other.html'))?.classes).toContain('bg-brand')
    expect(before.stylesheets.some(asset => asset.css.includes('https://example.com/vendor.css'))).toBe(true)
    writeFileSync(join(root, 'app.css'), source.replace('--color-brand:red', '--color-brand:blue'))
    const { snapshot: after } = await captureMasterCSSProject(options)
    const report = await compareProjectSnapshots({ before, after })
    expect(report.classes.map(item => item.className)).toEqual(['bg-brand', 'card'])
    expect(report.classes[0].beforeRules).toEqual(report.classes[0].afterRules)
    expect(report.stylesheets.length).toBeGreaterThan(0)
    expect(report.outputs.length).toBeGreaterThan(0)
    expect(report.coverage).toMatchObject({ scope: 'known-sources', browser: 'not-checked' })
    expect(report.coverage.unresolved.length).toBeGreaterThan(0)
    writeFileSync(join(root, 'app.css'), source.replace('--color-brand:red;', ''))
    const { snapshot: removed, report: removalInspection } = await captureMasterCSSProject(options)
    expect(removalInspection.summary.errors).toBeGreaterThan(0)
    const removal = await compareProjectSnapshots({ before, after: removed })
    const consumer = removal.classes.find(item => item.className === 'bg-brand')
    expect(consumer?.beforeMatchStatus).toBe('matched')
    expect(consumer?.afterMatchStatus).toBe('syntax-error')
    expect(consumer?.afterRules).toEqual([])
    writeFileSync(join(root, 'app.css'), '@import "@master/css";@theme{display:block}')
    await expect(captureMasterCSSProject(options)).rejects.toThrow('Cannot capture')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('native and Wasm compiler sessions agree on prepared project comparison', async () => {
  const source = '@theme{--color-brand:red}@mixin --button{color:var(--color-brand)} @utility button {color:var(--color-brand)}'
  const beforeManifest = (await compileManifest(source, { baseManifest: manifest })).manifest
  const afterManifest = (await compileManifest(source.replace('--color-brand:red', '--color-brand:blue'), { baseManifest: manifest })).manifest
  const common = { version: 1 as const, sources: [{ path: 'index.html', classes: ['button'] }], stylesheets: [], outputs: [], excluded: ['vendor/**'], unresolved: ['cms'] }
  const request = { before: { ...common, manifest: beforeManifest }, after: { ...common, manifest: afterManifest } }
  using native = await createCompiler({ binding: 'native' })
  using wasm = await createCompiler({ binding: 'wasm' })
  expect(wasm.compareProjectSnapshots(request)).toEqual(native.compareProjectSnapshots(request))
})
