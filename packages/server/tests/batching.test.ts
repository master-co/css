import { expect, test } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { renderHTML } from '../src'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

test('renders a complete immutable HTML result', () => {
  const result = renderHTML('<div class="fg:red bg:blue"></div>', {
    manifest: defaultManifest
  })

  expect(result.classNames).toEqual(['fg:red', 'bg:blue'])
  expect(result.cssText).toContain('.fg\\:red')
  expect(result.cssText).toContain('.bg\\:blue')
  expect(Object.isFrozen(result)).toBe(true)
  expect(Object.isFrozen(result.classNames)).toBe(true)
  expect(Object.isFrozen(result.invalidClassNames)).toBe(true)
  expect(Object.isFrozen(result.diagnostics)).toBe(true)
})
