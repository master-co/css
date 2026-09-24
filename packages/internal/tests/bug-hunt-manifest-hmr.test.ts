import { expect, test, vi } from 'vitest'
import { createMasterCSSManifestVirtualModulePlugin } from '../src/manifest-virtual-module'
import { RESOLVED_VIRTUAL_MANIFEST_ID } from '../src/manifest-module'

for (const importedManifest of [false, true]) test(`BH-0004 manifest updates retain existing stylesheet consumers (manifest imported: ${importedManifest})`, async () => {
  const file = '/project/style.css'
  const plugin = createMasterCSSManifestVirtualModulePlugin(async () => ({ manifest: { version: 1, languageVersion: 2 }, entries: [file], dependencies: [file], diagnostics: [] }))
  plugin.configResolved({ command: 'serve', root: '/project' })
  await plugin.buildStart.call({})
  const stylesheet = { id: file }, inline = { id: `${file}?inline` }, raw = { id: `${file}?raw` }, manifest = { id: RESOLVED_VIRTUAL_MANIFEST_ID }
  const invalidateModule = vi.fn()
  const server = { moduleGraph: { getModuleById: () => importedManifest ? manifest : undefined, invalidateModule } }
  const result = plugin.handleHotUpdate({ file, modules: [stylesheet, inline, raw, ...(importedManifest ? [manifest] : [])], server })
  expect(result).toEqual([stylesheet, inline, raw, ...(importedManifest ? [manifest] : [])])
  expect(invalidateModule).toHaveBeenCalledTimes(importedManifest ? 1 : 0)
  if (importedManifest) expect(invalidateModule).toHaveBeenCalledWith(manifest)
})
