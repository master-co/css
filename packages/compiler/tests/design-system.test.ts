import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import { captureMasterCSSProject, createMasterCSSDesignSystemReport, createMasterCSSInspectionReport } from '../src/diagnostics'
import * as projectLoader from '../src/project/manifest'
import { loadProjectManifest } from '../src/project/manifest'
import { loadProjectManifestSync } from '../src/project/manifest-sync'

const manifest = { version: 6, languageVersion: 16 } as const

function fixture() {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'master-design-system-')))
  mkdirSync(join(cwd, 'node_modules/@master/css'), { recursive: true })
  writeFileSync(join(cwd, 'node_modules/@master/css/package.json'), JSON.stringify({ name: '@master/css', style: './index.css' }))
  writeFileSync(join(cwd, 'node_modules/@master/css/index.css'), '@utility bg-(--color) {background-color:var(--color)}')
  writeFileSync(join(cwd, 'app.css'), '@import "@master/css";@import "./card.css";@import "./tokens.css";@reference "./reference.css";')
  writeFileSync(join(cwd, 'tokens.css'), '@theme {--color-brand:red;--color-information:red}')
  writeFileSync(join(cwd, 'reference.css'), '@theme {--color-reference:blue}')
  writeFileSync(join(cwd, 'card.css'), '/* 😀 */ @layer components { .card {color:var(--color-brand);color:var(--color-information)} }')
  writeFileSync(join(cwd, 'unmanaged.css'), '.ignored { color: var(--color-brand) }')
  return cwd
}

test('inspects authored project CSS with import/reference provenance and tool-only metadata', async () => {
  const cwd = fixture()
  try {
    const before = await loadProjectManifest({ root: cwd, baseManifest: manifest })
    const report = await createMasterCSSDesignSystemReport({
      cwd, manifest,
      designSystem: { version: 1, metadata: { '--color-brand': { description: 'Primary actions', deprecated: true, replacement: '--color-information' } } }
    })
    expect(report.project.files).toEqual(expect.arrayContaining([join(cwd, 'card.css'), join(cwd, 'tokens.css')]))
    expect(report.project.files).not.toContain(join(cwd, 'unmanaged.css'))
    expect(report.project.excluded).toContain(join(cwd, 'node_modules/@master/css/index.css'))
    const references = report.references.filter(item => item.source === join(cwd, 'card.css'))
    expect(references.map(item => item.token)).toEqual(['--color-brand', '--color-information'])
    expect(references[0].importers).toEqual([join(cwd, 'app.css')])
    expect(report.tokens).toEqual(expect.arrayContaining([expect.objectContaining({ name: '--color-brand', metadata: expect.objectContaining({ description: 'Primary actions' }) })]))
    expect(report.tokens.some(item => item.name === '--color-reference')).toBe(false)
    expect(report.diagnostics.some(item => item.token === '--color-brand' && item.source === join(cwd, 'card.css'))).toBe(true)
    expect(report.coverage.browser).toBe('not-checked')
    expect((await loadProjectManifest({ root: cwd, baseManifest: manifest })).manifest).toEqual(before.manifest)
    expect(before.sourceGraph).toBeUndefined()
  } finally { rmSync(cwd, { recursive: true, force: true }) }
})

test('source graph is opt-in, immutable and identical through sync and async project loading', async () => {
  const cwd = fixture()
  try {
    const options = { root: cwd, baseManifest: manifest, includeSourceGraph: true }
    const asyncResult = await loadProjectManifest(options)
    const syncResult = loadProjectManifestSync(options)
    expect(asyncResult.sourceGraph).toEqual(syncResult.sourceGraph)
    expect(Object.isFrozen(asyncResult.sourceGraph?.files)).toBe(true)
    expect(asyncResult.sourceGraph?.files.find(file => file.source === join(cwd, 'card.css'))?.projectOwned).toBe(true)
    expect(asyncResult.sourceGraph?.files.find(file => file.source === join(cwd, 'node_modules/@master/css/index.css'))?.projectOwned).toBe(false)
    expect(asyncResult.sourceGraph?.edges).toContainEqual({ from: join(cwd, 'app.css'), specifier: './reference.css', resolved: join(cwd, 'reference.css') })
  } finally { rmSync(cwd, { recursive: true, force: true }) }
})

test('combined inspection reuses one project load and preserves CSS and snapshot output', async () => {
  const cwd = fixture()
  const load = vi.spyOn(projectLoader, 'loadProjectManifest')
  try {
    writeFileSync(join(cwd, 'index.html'), '<div class="bg-brand card"></div>')
    const options = { cwd, manifest, includeCss: true }
    const before = await captureMasterCSSProject(options)
    load.mockClear()
    const combined = await captureMasterCSSProject({ ...options, designSystem: { version: 1 } })
    expect(load).toHaveBeenCalledTimes(1)
    expect(combined.snapshot).toEqual(before.snapshot)
    expect(combined.report.css).toEqual(before.report.css)
    expect(combined.report.designSystem).toEqual(await createMasterCSSDesignSystemReport(options))
    await expect(createMasterCSSInspectionReport({ ...options, designSystem: { version: 2 } as never })).rejects.toThrow('version')
  } finally {
    load.mockRestore()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('project ownership excludes external and package symlinks while preserving local aliases', async () => {
  const cwd = fixture()
  const external = realpathSync(mkdtempSync(join(tmpdir(), 'master-design-system-external-')))
  try {
    writeFileSync(join(external, 'outside.css'), '.external { color: var(--color-brand) }')
    symlinkSync(join(external, 'outside.css'), join(cwd, 'external-link.css'))
    symlinkSync(join(cwd, 'node_modules/@master/css/index.css'), join(cwd, 'package-link.css'))
    symlinkSync(join(cwd, 'card.css'), join(cwd, 'local-link.css'))
    writeFileSync(join(cwd, 'app.css'), '@import "@master/css";@import "./tokens.css";@import "./external-link.css";@import "./package-link.css";@import "./local-link.css";')
    const project = await loadProjectManifest({ root: cwd, baseManifest: manifest, includeSourceGraph: true })
    const ownership = Object.fromEntries(project.sourceGraph!.files.map(file => [file.source, file.projectOwned]))
    expect(ownership[join(cwd, 'external-link.css')]).toBe(false)
    expect(ownership[join(cwd, 'package-link.css')]).toBe(false)
    expect(ownership[join(cwd, 'local-link.css')]).toBe(true)
    const report = await createMasterCSSDesignSystemReport({ cwd, manifest })
    expect(report.references.map(reference => reference.source)).toEqual([join(cwd, 'local-link.css'), join(cwd, 'local-link.css')])
    expect(report.project.excluded).toEqual(expect.arrayContaining([join(cwd, 'external-link.css'), join(cwd, 'package-link.css')]))
  } finally {
    rmSync(cwd, { recursive: true, force: true })
    rmSync(external, { recursive: true, force: true })
  }
})

test('fails explicitly for missing or broken project context', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'master-design-system-')))
  try {
    await expect(createMasterCSSDesignSystemReport({ cwd, manifest })).rejects.toThrow('No project CSS entry')
    await expect(createMasterCSSInspectionReport({ cwd, manifest, designSystem: { version: 1 } })).rejects.toThrow('No project CSS entry')
    writeFileSync(join(cwd, 'app.css'), '@import "@master/css";@import "./missing.css";')
    await expect(createMasterCSSDesignSystemReport({ cwd, manifest })).rejects.toThrow()
  } finally { rmSync(cwd, { recursive: true, force: true }) }
})
