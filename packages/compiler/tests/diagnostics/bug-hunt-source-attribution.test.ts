import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { expect, test } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createMasterCSSInspectionReport } from '../../src/diagnostics'

const manifest = defaultManifestJSON as unknown as MasterCSSManifest
const js = (classes: string) => `document.body.className = "${classes}"`
const html = (classes: string) => `<div class="${classes}"></div>`
interface AttributionCase {
  name: string
  files: Record<string, string>
  expected: Record<string, string[]>
  invalid?: Record<string, string[]>
  native?: Record<string, string[]>
  latent?: Record<string, string[]>
  patterns?: string[]
}

const cases: AttributionCase[] = [
  { name: 'separate classes and invalid warning', files: { 'a.js': js('inline'), 'b.js': js('block p-missing') }, expected: { 'a.js': ['inline'], 'b.js': ['block'] }, invalid: { 'b.js': ['p-missing'] } },
  { name: 'reverse source patterns', files: { 'a.js': js('inline'), 'b.js': js('block p-missing') }, expected: { 'a.js': ['inline'], 'b.js': ['block'] }, invalid: { 'b.js': ['p-missing'] }, patterns: ['b.js', 'a.js'] },
  { name: 'repeated valid and invalid classes', files: { 'a.js': js('block p-missing'), 'b.mjs': js('block p-missing'), 'c.html': html('inline') }, expected: { 'a.js': ['block'], 'b.mjs': ['block'], 'c.html': ['inline'] }, invalid: { 'a.js': ['p-missing'], 'b.mjs': ['p-missing'] } },
  { name: 'asynchronous Vue and Svelte adapters', files: { 'a.vue': `<template>${html('block flex')}</template>`, 'b.svelte': html('block grid'), 'c.html': html('inline') }, expected: { 'a.vue': ['block', 'flex'], 'b.svelte': ['block', 'grid'], 'c.html': ['inline'] } },
  { name: 'native classes and repeated usage', files: { 'index.css': '@master entry;.native{color:red}', 'a.html': html('native'), 'b.html': html('native block'), 'c.html': html('inline') }, expected: { 'a.html': [], 'b.html': ['block'], 'c.html': ['inline'] }, native: { 'a.html': ['native'], 'b.html': ['native'] } },
  { name: 'safelist is not source ownership', files: { 'index.css': '@master entry;@safelist "block inline";', 'a.html': html('block'), 'b.html': html('block'), 'c.js': '' }, expected: { 'a.html': ['block'], 'b.html': ['block'], 'c.js': [] } },
  { name: 'scoped blocklist keeps source ownership', files: { 'index.css': '@master entry;@blocklist "hidden";', 'a.html': html('hidden block'), 'b.html': html('hidden inline'), 'c.html': html('flex') }, expected: { 'a.html': ['block', 'hidden'], 'b.html': ['hidden', 'inline'], 'c.html': ['flex'] }, latent: { 'a.html': ['hidden'], 'b.html': ['hidden'], 'c.html': [] } }
]

for (const entry of cases) {
  test(`inspection keeps source ownership: ${entry.name}`, async () => {
    const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-source-owner-')))
    try {
      for (const [file, content] of Object.entries(entry.files)) writeFileSync(join(cwd, file), content)
      const report = await createMasterCSSInspectionReport({ manifest, cwd, patterns: entry.patterns, includeCss: true })
      expect(report.summary.errors).toBe(entry.invalid ? 1 : 0)
      expect(report.files.map((file) => basename(file.filePath)).sort()).toEqual(Object.keys(entry.expected).sort())
      const invalid = entry.invalid
      const native = entry.native
      const latent = entry.latent
      for (const file of report.files) {
        const name = basename(file.filePath)
        expect([...file.discovered.valid].sort(), `${name} valid`).toEqual(entry.expected[name])
        expect([...file.discovered.usedNative].sort(), `${name} native`).toEqual(native?.[name] ?? [])
        if (!native) expect([...file.discovered.invalid].sort(), `${name} invalid`).toEqual(invalid?.[name] ?? [])
        if (latent) expect(file.discovered.latent.filter((name) => name === 'hidden')).toEqual(latent[name])
      }
      if (invalid) {
        const firstInvalidFile = report.files.find((file) => invalid[basename(file.filePath)]?.length)!
        expect(report.diagnostics.find((d) => d.code === 'UNKNOWN_TOKEN')?.filePath).toBe(firstInvalidFile.filePath)
      }
      if (entry.name === 'safelist is not source ownership') {
        expect(report.css.text).toContain('display:inline')
        expect(report.files.flatMap((file) => file.discovered.latent)).not.toContain('inline')
      }
    } finally { rmSync(cwd, { recursive: true, force: true }) }
  })
}
