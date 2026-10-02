import { expect, test } from 'vitest'
import { createToolingSessionSync } from '../src/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }

test('validator and editor report removed builtins without changing generation', () => {
  const session = createToolingSessionSync({ manifest: preset as unknown as MasterCSSManifest })
  try {
    const value = session.validateClassNames(['size:20px']).classes[0]
    const hover = session.inspectClassName('size:20px')
    expect(value.rules[0].text).toContain('{size:20px}')
    for (const result of [value, hover]) expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: 'REMOVED_PRESET_UTILITY', severity: 'info' }))
    expect(session.completionIndex().classEntries.some(entry => ['size:', 'size-sm', 'min-size:', 'max-size:'].includes(entry.label))).toBe(false)
  } finally { session.dispose() }
})

test.each([[], ['width', 'height']])('custom size definitions including empty ones have no removed-builtin hint', (...properties) => {
  const manifest = { ...preset, utilities: [...preset.utilities, { kind: 'function', name: 'size', parameters: [{ name: '--value' }], body: properties.map(property => ({ type: 'declaration', property, value: [{ type: 'function', name: 'var', value: [{ type: 'text', value: '--value' }] }] })) }] } as unknown as MasterCSSManifest
  const session = createToolingSessionSync({ manifest })
  try {
    expect(session.validateClassNames(['size(20px)']).classes[0].diagnostics?.some(d => d.code === 'REMOVED_PRESET_UTILITY')).toBe(false)
    expect(session.inspectClassName('size(20px)').diagnostics?.some(d => d.code === 'REMOVED_PRESET_UTILITY')).toBe(false)
    expect(session.completionIndex().classEntries.some(entry => entry.label === 'size()')).toBe(true)
  } finally { session.dispose() }
})


test('explicit native registrations suppress advice without changing engine results', async () => {
  const { createToolingSession } = await import('../src/tooling-session')
  for (const session of [
    createToolingSessionSync({ manifest: preset as unknown as MasterCSSManifest, nativeClassNames: ['size:20px'] }),
    await createToolingSession({ manifest: preset as unknown as MasterCSSManifest, nativeClassNames: ['size:20px'] })
  ]) {
    try {
      for (const result of [session.validateClassNames(['size:20px']).classes[0], session.inspectClassName('size:20px')]) {
        expect(result.diagnostics?.some(d => d.code === 'REMOVED_PRESET_UTILITY')).toBe(false)
        expect(result.rules[0].text).toContain('{size:20px}')
      }
      expect(session.inspectClassName('size:30px').diagnostics?.some(d => d.code === 'REMOVED_PRESET_UTILITY')).toBe(true)
    } finally { session.dispose() }
  }
})
