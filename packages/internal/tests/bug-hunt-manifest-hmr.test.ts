import { expect, test, vi } from 'vitest'
import { createMasterCSSManifestVirtualModulePlugin } from '../src/manifest-virtual-module'
import { RESOLVED_VIRTUAL_MANIFEST_ID } from '../src/manifest-module'
import { RESOLVED_VIRTUAL_PROGRAM_ID } from '../src/program-module'

for (const importedManifest of [false, true]) test(`BH-0004 manifest updates retain existing stylesheet consumers (manifest imported: ${importedManifest})`, async () => {
  const file = '/project/style.css'
  const plugin = createMasterCSSManifestVirtualModulePlugin(async () => ({ manifest: {
  "version": 6 as const,
  "languageVersion": 16 as const
}, entries: [file], dependencies: [file], diagnostics: [] }))
  plugin.configResolved({ command: 'serve', root: '/project' })
  await plugin.buildStart.call({})
  const stylesheet = { id: file }, inline = { id: `${file}?inline` }, raw = { id: `${file}?raw` }, manifest = { id: RESOLVED_VIRTUAL_MANIFEST_ID }
  const invalidateModule = vi.fn()
  const server = { moduleGraph: { getModuleById: (id: string) => importedManifest && id === RESOLVED_VIRTUAL_MANIFEST_ID ? manifest : undefined, invalidateModule } }
  const result = plugin.handleHotUpdate({ file, modules: [stylesheet, inline, raw, ...(importedManifest ? [manifest] : [])], server })
  expect(result).toEqual([stylesheet, inline, raw, ...(importedManifest ? [manifest] : [])])
  expect(invalidateModule).toHaveBeenCalledTimes(importedManifest ? 1 : 0)
  if (importedManifest) expect(invalidateModule).toHaveBeenCalledWith(manifest)
})

test('manifest dependency updates invalidate an imported runtime program', async () => {
  const file = '/project/style.css'
  const plugin = createMasterCSSManifestVirtualModulePlugin(async () => ({ manifest: {
    version: 6 as const,
    languageVersion: 16 as const
  }, entries: [file], dependencies: [file], diagnostics: [] }), {}, async () => new Uint8Array())
  plugin.configResolved({ command: 'serve', root: '/project' })
  await plugin.buildStart.call({})
  const program = { id: RESOLVED_VIRTUAL_PROGRAM_ID }
  const invalidateModule = vi.fn()
  const server = { moduleGraph: { getModuleById: (id: string) => id === RESOLVED_VIRTUAL_PROGRAM_ID ? program : undefined, invalidateModule } }
  expect(plugin.handleHotUpdate({ file, modules: [], server })).toEqual([program])
  expect(invalidateModule).toHaveBeenCalledWith(program)
})
