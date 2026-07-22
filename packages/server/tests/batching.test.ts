import { afterEach, expect, test, vi } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { render, renderCSS, ServerCSS } from '../src'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

afterEach(() => {
  vi.restoreAllMocks()
})

test('renders HTML classes in a single batch', () => {
  const ensureClassRules = vi.spyOn(ServerCSS.prototype, 'ensureClassRules')
  const result = render('<div class="fg:red bg:blue"></div>', defaultManifest)

  try {
    expect(ensureClassRules).toHaveBeenCalledOnce()
    expect(ensureClassRules).toHaveBeenCalledWith('fg:red', 'bg:blue')
  } finally {
    result.css?.dispose()
  }
})

test('renders CSS classes in a single batch', () => {
  const ensureClassRules = vi.spyOn(ServerCSS.prototype, 'ensureClassRules')
  const css = renderCSS('<div class="fg:red bg:blue"></div>', defaultManifest)

  try {
    expect(ensureClassRules).toHaveBeenCalledOnce()
    expect(ensureClassRules).toHaveBeenCalledWith('fg:red', 'bg:blue')
  } finally {
    css?.dispose()
  }
})
