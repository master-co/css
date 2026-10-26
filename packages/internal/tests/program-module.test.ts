import { afterEach, expect, test, vi } from 'vitest'
import { createMasterCSSManifestVirtualModulePlugin } from '../src/manifest-virtual-module'
import {
  PROGRAM_ASSET_FILE,
  RESOLVED_VIRTUAL_PROGRAM_ID,
  VIRTUAL_PROGRAM_ID,
  stripMasterCSSProgramQuery,
  toBrowserProgramFacadeModule,
  toInlineProgramModule,
  toProgramPreloadLinkTag
} from '../src/program-module'
import type { MasterCSSManifest } from '../src/manifest-module'

let generatedModuleIndex = 0

function importGeneratedModule(source: string) {
  const specifier = `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}#${generatedModuleIndex++}`
  return import(specifier) as Promise<{ default: unknown }>
}

afterEach(() => {
  vi.unstubAllGlobals()
})

const source = { file: '/home/build/project/app.css', range: { start: 0, end: 1 } }
const manifest = {
  version: 6,
  languageVersion: 16,
  keyframes: [{ id: 'fade', name: 'fade', text: '@keyframes fade{}', source }]
} as MasterCSSManifest

function createPlugin(command: 'serve' | 'build') {
  const compileProgram = vi.fn(async (input: MasterCSSManifest) => new Uint8Array(new TextEncoder().encode(JSON.stringify(input))))
  const context = {}
  const plugin = createMasterCSSManifestVirtualModulePlugin(
    async () => ({ manifest, entries: [], dependencies: [], diagnostics: [] }),
    context,
    compileProgram
  )
  plugin.configResolved({ command, root: '/project' })
  return { plugin, context, compileProgram }
}

test('inlines programs as their bytes, including every byte value', async () => {
  const program = Uint8Array.from({ length: 0x10100 }, (_, index) => index % 256)
  const module = await importGeneratedModule(toInlineProgramModule(program))
  expect(module.default).toEqual(program)
})

test('browser program facades fetch the emitted program', async () => {
  const fetch = vi.fn(async () => new Response(new Uint8Array([1, 2, 3])))
  vi.stubGlobal('fetch', fetch)
  const module = await importGeneratedModule(toBrowserProgramFacadeModule(JSON.stringify('/assets/master-css-program.bin')))
  expect(module.default).toEqual(new Uint8Array([1, 2, 3]))
  expect(fetch).toHaveBeenCalledWith('/assets/master-css-program.bin')

  vi.stubGlobal('fetch', async () => new Response('missing', { status: 404 }))
  await expect(importGeneratedModule(toBrowserProgramFacadeModule(JSON.stringify('/missing.bin'))))
    .rejects.toThrow('Cannot load the Master CSS runtime program from /missing.bin (HTTP 404).')
})

test('program preload links fetch with CORS like the facade', () => {
  expect(toProgramPreloadLinkTag('/assets/a"b.bin')).toBe('<link rel="preload" as="fetch" crossorigin href="/assets/a&quot;b.bin">')
  expect(stripMasterCSSProgramQuery('/app.css?master-css-program')).toBe('/app.css')
})

test('serves the program module only with a compiler', async () => {
  const withoutCompiler = createMasterCSSManifestVirtualModulePlugin(async () => ({ manifest, entries: [], dependencies: [], diagnostics: [] }))
  expect(withoutCompiler.resolveId(VIRTUAL_PROGRAM_ID)).toBeUndefined()
  expect(createPlugin('serve').plugin.resolveId(VIRTUAL_PROGRAM_ID)).toBe(RESOLVED_VIRTUAL_PROGRAM_ID)
})

test('development inlines the program compiled from the project manifest', async () => {
  const { plugin, compileProgram } = createPlugin('serve')
  const module = await importGeneratedModule(await plugin.load.call({}, RESOLVED_VIRTUAL_PROGRAM_ID) as string)
  expect(compileProgram).toHaveBeenCalledWith(manifest)
  expect(new TextDecoder().decode(module.default as Uint8Array)).toBe(JSON.stringify(manifest))
})

test('browser builds emit the program without source provenance', async () => {
  const { plugin, context, compileProgram } = createPlugin('build')
  const emitFile = vi.fn(() => 'program-reference')
  const code = await plugin.load.call({ emitFile, environment: { config: { consumer: 'client' } } }, RESOLVED_VIRTUAL_PROGRAM_ID) as string
  const compiled = compileProgram.mock.calls[0][0]
  expect(compiled.keyframes?.[0]).not.toHaveProperty('source')
  expect(emitFile).toHaveBeenCalledWith({ type: 'asset', name: PROGRAM_ASSET_FILE, source: expect.any(Uint8Array) })
  expect(code).toContain('import.meta.ROLLUP_FILE_URL_program-reference')
  expect(context).toMatchObject({ defaultProgramAssetReferenceId: 'program-reference', defaultProgramAssetSource: expect.any(Uint8Array) })
})

test('server builds inline the program instead of emitting an asset', async () => {
  const { plugin, context } = createPlugin('build')
  const emitFile = vi.fn(() => 'program-reference')
  const code = await plugin.load.call({ emitFile, environment: { config: { consumer: 'server' } } }, RESOLVED_VIRTUAL_PROGRAM_ID) as string
  expect(emitFile).not.toHaveBeenCalled()
  expect(code).toContain('atob(')
  expect(context).toMatchObject({ defaultProgramAssetReferenceId: undefined })
})
