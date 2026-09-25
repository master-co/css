import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import workflows from '../../../parity/v2-tooling-workflows.json' with { type: 'json' }
import MasterCSSMCPContext from '../src/context'
import { inspectClass } from '../src/scan'

test('AI inspection workflows preserve project context, statuses and complete alternatives', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-final-workflows-'))
  const results = []
  try {
    writeFileSync(join(root, 'app.css'), workflows.source)
    const context = new MasterCSSMCPContext({ root })
    for (const expected of workflows.cases) {
      const actual = await inspectClass(context, { className: expected.className })
      expect(actual).toMatchObject({
        className: expected.className,
        matchStatus: expected.matchStatus,
        cssSyntaxStatus: expected.cssSyntaxStatus, cssValueStatus: expected.cssValueStatus,
        browserSupport: 'not-checked'
      })
      if (expected.code) expect(actual.diagnostics?.map(item => item.code)).toContain(expected.code)
      if (expected.matchStatus === 'ambiguous') {
        expect(JSON.stringify(actual.diagnostics)).toContain('font-family-brand')
        expect(JSON.stringify(actual.diagnostics)).toContain('font-size-brand')
      }
      results.push(actual)
    }
    // Optional trace artifact for repeatable tool evaluations; no model-quality claim.
    if (process.env.MASTER_CSS_EVALUATION_REPORT) writeFileSync(process.env.MASTER_CSS_EVALUATION_REPORT, JSON.stringify({
      fixtureVersion: workflows.version, languageVersion: workflows.languageVersion,
      node: process.version, platform: process.platform, results
    }, null, 2))
  } finally { rmSync(root, { recursive: true, force: true }) }
})
