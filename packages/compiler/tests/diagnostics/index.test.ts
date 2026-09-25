import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createMasterCSSInspectionReport } from '../../src/diagnostics'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function createTempDir(prefix: string) {
  return mkdtempSync(join(tmpdir(), prefix))
}

describe('@master/css-compiler/diagnostics', () => {
  it('reports scanner state, per-file discoveries, and missing CSS diagnostics', async () => {
    const cwd = createTempDir('master-css-diagnostics-inspect-')
    try {
      writeFileSync(join(cwd, 'index.html'), '<div class="block p-missing"></div>')
      const report = await createMasterCSSInspectionReport({
        manifest: defaultManifest,
        cwd,
        patterns: ['index.html'],
        classes: ['block', 'never-generated-class']
      })

      expect(report.version).toBe(3)
      expect(report.inputs.files[0]).toMatch(/index\.html$/)
      expect(report.scanner.classes.valid).toContain('block')
      expect(report.scanner.classes.invalid).toContain('p-missing')
      expect(report.files).toHaveLength(1)
      expect(report.files[0].discovered.valid).toContain('block')
      expect(report.files[0].discovered.invalid).toContain('p-missing')
      expect(report.missingCSS.present).toContainEqual(expect.objectContaining({
        className: 'block',
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
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('reports checks for native and managed declarations without rejecting ordinary classes', async () => {
    const cwd = createTempDir('master-css-diagnostics-values-')
    try {
      writeFileSync(join(cwd, 'index.html'), '<div class="ordinary font:16px grid-cols:2.5 width:future(2qu) padding:var(--space)"></div>')
      const report = await createMasterCSSInspectionReport({ manifest: defaultManifest, cwd, patterns: ['index.html'], includeCss: true })
      const byName = new Map(report.inspections.map(item => [item.className, item]))
      expect(byName.get('font:16px')).toMatchObject({ matchStatus: 'matched', cssValueStatus: 'invalid', browserSupport: 'not-checked' })
      expect(byName.get('grid-cols:2.5')?.cssValueStatus).toBe('invalid')
      expect(byName.get('width:future(2qu)')?.cssValueStatus).toBe('unknown')
      expect(byName.get('padding:var(--space)')?.cssValueStatus).toBe('unknown')
      expect(byName.get('font:16px')?.checks).toEqual([expect.objectContaining({ name: 'css-tree', phase: 'css-syntax', scope: 'selectors-queries-declarations' }), expect.objectContaining({ name: 'css-tree', phase: 'css-value', scope: 'expanded-declarations-and-known-math-grammar', version: expect.any(String) })])
      expect(report.diagnostics.filter(item => item.code === 'CSS_VALUE_INVALID')).toHaveLength(2)
      expect(report.diagnostics.some(item => item.message.includes('ordinary'))).toBe(false)
      expect(report.summary.errors).toBe(2)
      expect(report.css.text).toContain('font:16px')
      expect(report.css.text).toContain('repeat(2.5')
    } finally { rmSync(cwd, { recursive: true, force: true }) }
  })

  it('includes generated CSS and stylesheet entry metadata', async () => {
    const cwd = createTempDir('master-css-diagnostics-css-')
    try {
      writeFileSync(join(cwd, 'index.css'), '@master entry;')
      writeFileSync(join(cwd, 'index.html'), '<div class="block"></div>')
      const report = await createMasterCSSInspectionReport({
        manifest: defaultManifest,
        cwd,
        patterns: ['index.html'],
        classes: 'block',
        includeCss: true
      })

      expect(report.stylesheets.entries).toHaveLength(1)
      expect(report.stylesheets.entries[0]).toEqual(expect.objectContaining({
        filePath: resolve(cwd, 'index.css'),
        masterCSS: false,
        pruneNativeCSS: false
      }))
      expect(report.stylesheets.entries[0].dependencies).toContain(resolve(cwd, 'index.css'))
      expect(report.css.included).toBe(true)
      expect(report.css.text).toContain('display:block')
      expect(report.missingCSS.missing).toHaveLength(0)
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('reports entry errors without inspecting against a fallback manifest', async () => {
    const cwd = createTempDir('master-css-diagnostics-entry-error-')
    try {
      writeFileSync(join(cwd, 'index.css'), '@master entry;\n@import "./missing.css";')
      writeFileSync(join(cwd, 'index.html'), '<div class="block"></div>')
      const report = await createMasterCSSInspectionReport({
        manifest: defaultManifest,
        cwd,
        patterns: ['index.html']
      })

      expect(report.stylesheets.entries).toHaveLength(1)
      expect(report.stylesheets.entries[0].errors[0]).toContain('CSS file not found')
      expect(report.stylesheets.errors).toContainEqual(expect.objectContaining({
        filePath: resolve(cwd, 'index.css'),
        message: expect.stringContaining('CSS file not found')
      }))
      expect(report.scanner.classes.valid).toEqual([])
      expect(report.inspections).toEqual([])
      expect(report.diagnostics).toContainEqual(expect.objectContaining({
        code: 'stylesheet-error',
        severity: 'error',
        sourceKind: 'stylesheet',
        filePath: resolve(cwd, 'index.css')
      }))
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})
