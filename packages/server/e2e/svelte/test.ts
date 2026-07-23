import { it, expect } from 'vitest'
import { readFileSync } from 'fs'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { renderHTML } from '../../src'
import path from 'path'

it('removes comments in transformPageChunk can break Svelte\'s hydration', () => {
  const html = renderHTML(
    readFileSync(path.join(__dirname, './prerendering.html')).toString(),
    { manifest: defaultManifestJSON as unknown as MasterCSSManifest }
  ).html
  expect(html).toContain('<!-- HEAD_svelte-zo7lox_START -->')
  expect(html).toContain('<!-- HEAD_svelte-zo7lox_END -->')
})
