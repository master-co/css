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
  { name: 'separate classes and invalid warning', files: { 'a.js': js("display:inline"), 'b.js': js('display:block p-missing') }, expected: { 'a.js': ["display:inline"], 'b.js': ["display:block"] }, invalid: { 'b.js': ['p-missing'] } },
  { name: 'reverse source patterns', files: { 'a.js': js("display:inline"), 'b.js': js('display:block p-missing') }, expected: { 'a.js': ["display:inline"], 'b.js': ["display:block"] }, invalid: { 'b.js': ['p-missing'] }, patterns: ['b.js', 'a.js'] },
  { name: 'repeated valid and invalid classes', files: { 'a.js': js('display:block p-missing'), 'b.mjs': js('display:block p-missing'), 'c.html': html("display:inline") }, expected: { 'a.js': ["display:block"], 'b.mjs': ["display:block"], 'c.html': ["display:inline"] }, invalid: { 'a.js': ['p-missing'], 'b.mjs': ['p-missing'] } },
  { name: 'asynchronous Vue and Svelte adapters', files: { 'a.vue': `<template>${html("display:block display:flex")}</template>`, 'b.svelte': html("display:block display:grid"), 'c.html': html("display:inline") }, expected: { 'a.vue': ["display:block", "display:flex"], 'b.svelte': ["display:block", "display:grid"], 'c.html': ["display:inline"] } },
  { name: 'native classes and repeated usage', files: { 'index.css': "@import \"@master/css\";.native{color:red}", 'a.html': html('native'), 'b.html': html('native display:block'), 'c.html': html("display:inline") }, expected: { 'a.html': [], 'b.html': ["display:block"], 'c.html': ["display:inline"] }, native: { 'a.html': ['native'], 'b.html': ['native'] } },
  { name: 'safelist is not source ownership', files: { 'index.css': "@import \"@master/css\";@safelist \"display:block display:inline\";", 'a.html': html("display:block"), 'b.html': html("display:block"), 'c.js': '' }, expected: { 'a.html': ["display:block"], 'b.html': ["display:block"], 'c.js': [] } },
  { name: 'scoped blocklist keeps source ownership', files: { 'index.css': "@import \"@master/css\";@blocklist \"display:none\";", 'a.html': html("display:none display:block"), 'b.html': html("display:none display:inline"), 'c.html': html("display:flex") }, expected: { 'a.html': ["display:block", "display:none"], 'b.html': ["display:none", "display:inline"], 'c.html': ["display:flex"] }, latent: { 'a.html': ["display:none"], 'b.html': ["display:none"], 'c.html': [] } }
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
        expect([...file.discovered.valid].sort(), `${name} valid`).toEqual([...entry.expected[name]].sort())
        expect([...file.discovered.usedNative].sort(), `${name} native`).toEqual(native?.[name] ?? [])
        if (!native) expect([...file.discovered.invalid].sort(), `${name} invalid`).toEqual(invalid?.[name] ?? [])
        if (latent) expect(file.discovered.latent.filter((name) => name === "display:none")).toEqual(latent[name])
      }
      if (invalid) {
        const firstInvalidFile = report.files.find((file) => invalid[basename(file.filePath)]?.length)!
        expect(report.diagnostics.find((d) => d.code === 'UNKNOWN_TOKEN')?.filePath).toBe(firstInvalidFile.filePath)
      }
      if (entry.name === 'safelist is not source ownership') {
        expect(report.css.text).toContain('display:inline')
        expect(report.files.flatMap((file) => file.discovered.latent)).not.toContain("display:inline")
      }
    } finally { rmSync(cwd, { recursive: true, force: true }) }
  })
}
