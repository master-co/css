import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import workflows from '../../../parity/v2-tooling-workflows.json' with { type: 'json' }
import inspect from '../src/inspect'

test('CLI inspection uses the shared final-language workflow conclusions', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-final-cli-'))
  const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
  try {
    writeFileSync(join(root, 'app.css'), workflows.source)
    writeFileSync(join(root, 'index.html'), `<div class="${workflows.cases.map(item => item.className).join(' ')}"></div>`)
    const report = await inspect(['index.html'], { cwd: root, exitCode: 'never', includeCss: true })
    for (const expected of workflows.cases) {
      const actual = report.inspections.find(item => item.className === expected.className)
      expect(actual).toMatchObject({ matchStatus: expected.matchStatus, cssSyntaxStatus: expected.cssSyntaxStatus, cssValueStatus: expected.cssValueStatus, browserSupport: 'not-checked' })
      if (expected.code) expect(actual?.diagnostics?.map(item => item.code)).toContain(expected.code)
    }
    expect(report.css.text).toContain('padding:red')
    expect(report.css.text).toContain('future-property:future(1furlong)')
  } finally { stdout.mockRestore(); rmSync(root, { recursive: true, force: true }) }
})
