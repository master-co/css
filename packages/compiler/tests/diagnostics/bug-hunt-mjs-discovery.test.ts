import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { expect, test } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createMasterCSSInspectionReport } from '../../src/diagnostics'

for (const mode of ['default', 'explicit-mjs', 'explicit-js'] as const) {
  test(`project inspection discovers ESM classes (${mode})`, async () => {
    const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-inspect-mjs-')))
    try {
      writeFileSync(join(cwd, 'entry.mjs'), 'document.body.className = "block"')
      writeFileSync(join(cwd, 'control.js'), 'document.body.className = "inline"')
      mkdirSync(join(cwd, 'node_modules'))
      writeFileSync(join(cwd, 'node_modules/ignored.mjs'), 'document.body.className = "hidden"')
      const patterns = mode === 'default' ? undefined : [mode === 'explicit-mjs' ? 'entry.mjs' : 'control.js']
      const report = await createMasterCSSInspectionReport({
        manifest: defaultManifestJSON as unknown as MasterCSSManifest,
        cwd, patterns, classes: ['block', 'inline', 'hidden'], includeCss: true
      })
      const expected = mode === 'default' ? ['control.js', 'entry.mjs'] : patterns!
      expect(report.files.map((f) => basename(f.filePath)).sort()).toEqual(expected)
      const found = mode === 'explicit-js' ? 'inline' : 'block'
      expect(report.scanner.classes.valid).toContain(found)
      expect(report.css.text).toContain(`display:${found}`)
      expect(report.missingCSS.present).toContainEqual(expect.objectContaining({ className: found }))
      expect(report.scanner.classes.valid).not.toContain('hidden')
      if (mode !== 'default') expect(report.scanner.classes.valid).not.toContain(mode === 'explicit-js' ? 'block' : 'inline')
    } finally { rmSync(cwd, { recursive: true, force: true }) }
  })
}
