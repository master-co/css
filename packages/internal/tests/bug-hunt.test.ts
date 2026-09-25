import { expect, test, vi } from 'vitest'
import { createMasterCSSManifestVirtualModulePlugin } from '../src/manifest-virtual-module'
import { RESOLVED_VIRTUAL_MANIFEST_ID } from '../src/manifest-module'

test('audit control: failed manifest loads retain watch dependencies and recover', async () => {
  let fail = true
  const plugin = createMasterCSSManifestVirtualModulePlugin(async ({ onDependency }) => {
    onDependency('/project/theme.css')
    if (fail) throw new Error('temporary invalid manifest')
    return { manifest: { version: 1, languageVersion: 3 }, entries: ['/project/theme.css'], dependencies: ['/project/theme.css'], diagnostics: [] }
  })
  const allow: string[] = []
  plugin.configResolved({ command: 'serve', root: '/project', server: { fs: { allow } } })
  const context = { addWatchFile: vi.fn() }
  await expect(plugin.buildStart.call(context)).rejects.toThrow('temporary invalid manifest')
  expect(context.addWatchFile).toHaveBeenCalledWith('/project/theme.css')
  expect(allow).toEqual(['/project/theme.css'])
  const module = { id: RESOLVED_VIRTUAL_MANIFEST_ID }
  const server = { moduleGraph: { getModuleById: () => module, invalidateModule: vi.fn() } }
  expect(plugin.handleHotUpdate({ file: '/project/theme.css', server })).toEqual([module])
  expect(server.moduleGraph.invalidateModule).toHaveBeenCalledWith(module)
  fail = false
  expect(await plugin.load.call(context, RESOLVED_VIRTUAL_MANIFEST_ID)).toContain('"version":1')
  expect(allow).toHaveLength(1)
  expect(plugin.handleHotUpdate({ file: '/project/unrelated.css', server })).toBeUndefined()
})
