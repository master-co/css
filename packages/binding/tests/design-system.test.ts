import { expect, test } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingBinding, type MasterCSSDesignSystemRequest } from '../src/tooling-binding'

const manifest: MasterCSSManifest = {
  version: 6,
  languageVersion: 18,
  variables: { color: [{ key: 'brand', type: 'string', values: [{ path: [':root,:host'], value: 'red' }] }] },
  utilities: [{ kind: 'token', name: 'fg', parameters: [{ name: '--color' }], body: [{ type: 'declaration', property: 'color', value: [{ type: 'function', name: 'var', value: [{ type: 'text', value: '--color' }] }] }] }]
}

test('native and Wasm design-system inspection agree on authored evidence and sidecar policy', async () => {
  const native = await createToolingBinding({ binding: 'native' })
  const wasm = await createToolingBinding({ binding: 'wasm' })
  using nativeSession = await native.createLintSession(manifest)
  using wasmSession = await wasm.createLintSession(manifest)
  const content = '/* 😀 */ @layer components { .card { color:var(--color-brand, var(--external)); color:#fff; color:#fff } }'
  const request: MasterCSSDesignSystemRequest = {
    version: 1,
    stylesheets: [{ source: 'app.css', content, importers: ['entry.css'] }],
    metadata: { '--color-brand': { description: 'Accent', deprecated: true } },
    rawValuePolicy: { requireProperties: ['color'] }
  }
  const result = nativeSession.inspectDesignSystem(request)
  expect(wasmSession.inspectDesignSystem(request)).toEqual(result)
  expect(result.references.map(reference => content.slice(reference.range.start, reference.range.end))).toEqual(['--color-brand', '--external'])
  expect(result.references[1]).toMatchObject({ inFallback: true, registered: false })
  expect(result.summary).toMatchObject({ references: 2, warnings: 3, errors: 0 })
  expect(result.diagnostics.filter(diagnostic => diagnostic.code === 'UNAPPROVED_RAW_VALUE')).toHaveLength(2)
  expect(result.coverage).toMatchObject({ scope: 'provided-stylesheets', browser: 'not-checked' })
  for (const session of [nativeSession, wasmSession]) {
    expect(() => session.inspectDesignSystem({ ...request, version: 2 } as unknown as MasterCSSDesignSystemRequest)).toThrow()
    const invalidRequest = { ...request, unknown: true }
    const invalidMetadata = { '--color-brand': { description: 'Brand', depricated: true } }
    expect(() => session.inspectDesignSystem(invalidRequest)).toThrow(/unknown field/)
    expect(() => session.inspectDesignSystem({ ...request, metadata: invalidMetadata })).toThrow(/unknown field/)
    // Class and stylesheet hosts share strict policy parsing; a misspelled field
    // must not silently change a team's checks on either binding.
    const invalidPolicy = { allowRawValues: false, requireProperty: ['color'] }
    expect(() => session.inspectDesignSystem({ ...request, rawValuePolicy: invalidPolicy })).toThrow(/unknown field/)
    expect(() => session.analyzeClassListPolicy({
      version: 4, classList: '(color:red)', classNames: ['(color:red)'], rawValuePolicy: invalidPolicy
    })).toThrow(/unknown field/)
    session.dispose()
    expect(() => session.inspectDesignSystem(request)).toThrow()
  }
})
