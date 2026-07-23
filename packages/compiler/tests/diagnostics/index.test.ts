import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createMasterCSSInspectionReport } from '../../src/diagnostics'

function createTempDir(prefix: string) {
  return mkdtempSync(join(tmpdir(), prefix))
}

describe('@master/css-compiler/diagnostics', () => {
  it('reports scanner state, per-file discoveries, and missing CSS diagnostics', async () => {
    const cwd = createTempDir('master-css-diagnostics-inspect-')
    try {
      writeFileSync(join(cwd, 'index.html'), '<div class="block text-decoration:bad()"></div>')
      const report = await createMasterCSSInspectionReport({
        cwd,
        patterns: ['index.html'],
        classes: ['block', 'never-generated-class']
      })

      expect(report.version).toBe(1)
      expect(report.inputs.files[0]).toMatch(/index\.html$/)
      expect(report.scanner.classes.valid).toContain('block')
      expect(report.scanner.classes.invalid).toContain('text-decoration:bad()')
      expect(report.files).toHaveLength(1)
      expect(report.files[0].discovered.valid).toContain('block')
      expect(report.files[0].discovered.invalid).toContain('text-decoration:bad()')
      expect(report.missingCSS.present).toContainEqual(expect.objectContaining({
        className: 'block',
        reason: 'generated'
      }))
      expect(report.missingCSS.missing).toContainEqual(expect.objectContaining({
        className: 'never-generated-class',
        reason: 'not-detected'
      }))
      expect(report.diagnostics).toContainEqual(expect.objectContaining({
        code: 'invalid-scanner-class',
        sourceKind: 'scanner',
        filePath: expect.stringMatching(/index\.html$/)
      }))
      expect(report.diagnostics).toContainEqual(expect.objectContaining({
        code: 'missing-css',
        sourceKind: 'missing-css'
      }))
      expect(report.summary.errors).toBe(1)
      expect(report.summary.warnings).toBe(1)
      expect(report.css.bytes).toBeGreaterThan(0)
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('includes generated CSS and stylesheet entry metadata', async () => {
    const cwd = createTempDir('master-css-diagnostics-css-')
    try {
      writeFileSync(join(cwd, 'index.css'), '@master entry;')
      writeFileSync(join(cwd, 'index.html'), '<div class="block"></div>')
      const report = await createMasterCSSInspectionReport({
        cwd,
        patterns: ['index.html'],
        classes: 'block',
        includeCss: true
      })

      expect(report.stylesheets.entries).toHaveLength(1)
      expect(report.stylesheets.entries[0]).toEqual(expect.objectContaining({
        filePath: resolve(cwd, 'index.css'),
        masterCSS: false,
        pruneNativeCSS: true
      }))
      expect(report.stylesheets.entries[0].dependencies).toContain(resolve(cwd, 'index.css'))
      expect(report.css.included).toBe(true)
      expect(report.css.text).toContain('display:block')
      expect(report.missingCSS.missing).toHaveLength(0)
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('reports stylesheet entry errors without hiding scanner diagnostics', async () => {
    const cwd = createTempDir('master-css-diagnostics-entry-error-')
    try {
      writeFileSync(join(cwd, 'index.css'), '@master entry;\n@import "./missing.css";')
      writeFileSync(join(cwd, 'index.html'), '<div class="block"></div>')
      const report = await createMasterCSSInspectionReport({
        cwd,
        patterns: ['index.html']
      })

      expect(report.stylesheets.entries).toHaveLength(1)
      expect(report.stylesheets.entries[0].errors[0]).toContain('CSS file not found')
      expect(report.stylesheets.errors).toContainEqual(expect.objectContaining({
        filePath: resolve(cwd, 'index.css'),
        message: expect.stringContaining('CSS file not found')
      }))
      expect(report.scanner.classes.valid).toContain('block')
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
