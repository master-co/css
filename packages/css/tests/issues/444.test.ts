import { expect, test } from 'vitest'
import defaultManifest from '@master/css-preset/default-manifest.json'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import createEngine from '../../src/engine/create-engine'

test.each(['native', 'wasm'] as const)('#444 stacked conditions never emit the rc.88 invalid media query (%s)', async (binding) => {
  using engine = await createEngine({ manifest: defaultManifest as unknown as MasterCSSManifest, binding })
  // The reported rc.88 spelling is deliberately unsupported by the current language.
  expect(engine.inspect('bg:black@dark@sm')).toMatchObject({ matchStatus: 'unmatched', rules: [] })
  for (const [className, prefix] of [
    ['bg-black@dark@sm', '@media (prefers-color-scheme: dark){@media (width >= 52.125rem){'],
    ['bg-black@sm@dark', '@media (width >= 52.125rem){@media (prefers-color-scheme: dark){']
  ]) {
    const result = engine.inspect(className)
    expect(result.matchStatus).toBe('matched')
    expect(result.rules).toHaveLength(1)
    expect(result.rules[0].text).toBe(`${prefix}.${className.replaceAll('@', '\\@')}{background-color:var(--color-black)}}}`)
  }
})
