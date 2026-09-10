import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { expect, test } from 'vitest'
import MasterCSSMCPContext from '../src/context'
import { scanProject } from '../src/scan'
import { extractClasses, traceClass } from '../src/classes'

for (const operation of ['scan', 'extract', 'trace'] as const) {
  for (const mode of ['default', 'explicit-mjs', 'explicit-js'] as const) {
    test(`${operation} finds ESM source (${mode})`, async () => {
      const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-mcp-mjs-')))
      const context = new MasterCSSMCPContext({ root })
      try {
        writeFileSync(join(root, 'entry.mjs'), 'document.body.className = "block"')
        writeFileSync(join(root, 'control.js'), 'document.body.className = "inline"')
        mkdirSync(join(root, 'node_modules'))
        writeFileSync(join(root, 'node_modules/ignored.mjs'), 'document.body.className = "hidden"')
        const patterns = mode === 'default' ? undefined : [mode === 'explicit-mjs' ? 'entry.mjs' : 'control.js']
        const expected = mode === 'default' ? ['control.js', 'entry.mjs'] : patterns!
        const className = mode === 'explicit-js' ? 'inline' : 'block'
        if (operation === 'scan') {
          const report = await scanProject(context, { patterns, includeCss: true })
          expect(report.files.map((f) => basename(f.filePath)).sort()).toEqual(expected)
          expect(report.scanner.classes.valid).toContain(className)
          expect(report.scanner.classes.valid).not.toContain('hidden')
          expect(report.css.text).toContain(`display:${className}`)
        } else if (operation === 'extract') {
          const report = await extractClasses(context, { patterns })
          expect(report.files.map((f) => basename(f.filePath)).sort()).toEqual(expected)
          expect(report.files.flatMap((f) => f.classes.map((c) => c.token))).toContain(className)
          expect(report.files.flatMap((f) => f.classes.map((c) => c.token))).not.toContain('hidden')
        } else {
          const report = await traceClass(context, { patterns, className, includeCss: true })
          expect(report.detected).toBe(true)
          expect(report.status).toBe('present')
          expect(report.occurrences.map((f) => basename(f.filePath))).toEqual([className === 'block' ? 'entry.mjs' : 'control.js'])
          expect(report.css.text).toContain(`display:${className}`)
        }
      } finally {
        context.dispose()
        rmSync(root, { recursive: true, force: true })
      }
    })
  }
}
