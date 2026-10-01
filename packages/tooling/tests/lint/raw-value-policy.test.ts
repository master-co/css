import { expect, test } from 'vitest'
import { createToolingSession } from '../../src'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'

test('property-scoped policy and explainable token families agree across native and Wasm', async () => {
  const results = []
  for (const binding of ['native', 'wasm'] as const) {
    using tooling = await createToolingSession({ manifest: preset as unknown as MasterCSSManifest, binding })
    const names = ['color:#123456', 'font-size:15px', 'color:var(--color-brand)']
    const result = tooling.analyzeLintClassList(names.join(' '), names, { rawValuePolicy: { requireProperties: ['color'] } })
    const diagnostics = result.diagnostics.filter(item => item.ruleId === 'no-unapproved-raw-values')
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]).toMatchObject({ data: { policy: { rule: 'no-unapproved-raw-values', requireProperties: ['color'] }, tokenFamilies: [{ prefix: 'fg', property: 'color', namespaces: ['color'] }] } })
    expect(diagnostics[0].fix).toBeUndefined()
    const allowed = tooling.analyzeLintClassList(names.join(' '), names, { rawValuePolicy: { requireProperties: ['color'], allowedPatterns: ['^#123456$'] } })
    expect(allowed.diagnostics.some(item => item.ruleId === 'no-unapproved-raw-values')).toBe(false)
    results.push(diagnostics)
  }
  expect(results[0]).toEqual(results[1])
})
