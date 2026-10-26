import { describe, expect, it, vi } from 'vitest'
import path from 'node:path'
import { normalizePath } from 'vite'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import ManifestVirtualModulePlugin from '../../src/plugins/manifest-virtual-module'
import {
  RESOLVED_VIRTUAL_MANIFEST_ID
} from '../../src/common'

const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/manifest-virtual-module')

function createResolvedConfig(root = FIXTURE_DIR) {
  return {
    root,
    command: 'serve',
    build: {
      ssr: false
    },
    server: {
      fs: {
        allow: []
      }
    }
  } as any
}

function createContext(root = path.join(FIXTURE_DIR, 'css-only')) {
  const viteConfig = createResolvedConfig(root)
  const context = {
    config: viteConfig
  } as any
  return { context, viteConfig }
}

describe('ManifestVirtualModulePlugin', () => {
  it('loads the default virtual manifest from the managed CSS entry', async () => {
    const root = path.join(FIXTURE_DIR, 'css-only')
    const { context, viteConfig } = createContext(root)
    const plugin = ManifestVirtualModulePlugin(context)

    const code = await (plugin.load as any).call({}, RESOLVED_VIRTUAL_MANIFEST_ID)
    const manifestEntryPath = path.join(root, 'app.css')
    const buttonManifestPath = path.join(root, 'styles/button.css')

    expect(viteConfig.server.fs.allow).toContain(normalizePath(manifestEntryPath))
    expect(viteConfig.server.fs.allow).toContain(normalizePath(buttonManifestPath))
    expect(code).toContain('export default ')
    expect(code).toContain('"version":6')
  })

  it('keeps default manifest dependencies registered after invalid CSS and recovers on the next run', async () => {
    const root = realpathSync.native(mkdtempSync(path.join(tmpdir(), 'master-css-vite-manifest-')))
    const entryPath = path.join(root, 'app.css')
    try {
      mkdirSync(root, { recursive: true })
      writeFileSync(entryPath, "@import url(\"@master/css\");\n@mixin --card { @compose bg-missing-token; } @utility card { @compose bg-missing-token; }")
      const { context, viteConfig } = createContext(root)
      const plugin = ManifestVirtualModulePlugin(context)
      const addWatchFile = vi.fn()

      await expect((plugin.load as any).call({ addWatchFile }, RESOLVED_VIRTUAL_MANIFEST_ID))
        .rejects.toThrow('@compose has been removed')
      expect(addWatchFile).toHaveBeenCalledWith(normalizePath(entryPath))
      expect(viteConfig.server.fs.allow).toContain(normalizePath(entryPath))

      writeFileSync(entryPath, "@import url(\"@master/css\");\n@mixin --card { @media all{display:block;} } @utility card { @media all{display:block;} }")

      const code = await (plugin.load as any).call({ addWatchFile: vi.fn() }, RESOLVED_VIRTUAL_MANIFEST_ID)

      expect(code).toContain('"--card"')
      expect(code).toContain('display')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('emits the default manifest as an external JSON asset in production build', async () => {
    const root = path.join(FIXTURE_DIR, 'css-only')
    const { context } = createContext(root)
    context.config.command = 'build'
    const plugin = ManifestVirtualModulePlugin(context)
    const emitFile = vi.fn(() => 'master_css_manifest_ref')

    const code = await (plugin.load as any).call({ emitFile }, RESOLVED_VIRTUAL_MANIFEST_ID)

    expect(emitFile).toHaveBeenCalledWith(expect.objectContaining({
      type: 'asset',
      name: 'master-css-manifest.json',
      source: expect.stringContaining('"version":6')
    }))
    expect(code).toContain('const masterCSSManifestURL = import.meta.ROLLUP_FILE_URL_master_css_manifest_ref;')
    expect(code).toContain(`new Function('specifier', "return import(specifier, { with: { type: 'json' } })")`)
    expect(code).toContain(`masterCSSManifest = (await loadMasterCSSManifestModule(masterCSSManifestSpecifier)).default;`)
    expect(code).toContain('const response = await fetch(masterCSSManifestSpecifier)')
    expect(code).not.toContain('font-bold')
    expect(context.defaultManifestAssetReferenceId).toBe('master_css_manifest_ref')
    expect(context.defaultManifestAssetSource).toContain('"version":6')
  })

  it('omits source provenance only from production manifests', async () => {
    const root = path.join(FIXTURE_DIR, 'css-only')
    const { context } = createContext(root)
    const plugin = ManifestVirtualModulePlugin(context)
    const development = await (plugin.load as any).call({}, RESOLVED_VIRTUAL_MANIFEST_ID)
    expect(development).toContain(`"source":{"file":${JSON.stringify(path.join(root, 'app.css'))}`)

    context.config.command = 'build'
    const emitFile = vi.fn((_asset: { source: string }) => 'master_css_manifest_ref')
    await (plugin.load as any).call({ emitFile }, RESOLVED_VIRTUAL_MANIFEST_ID)
    expect(context.defaultManifestAssetSource).toBe(emitFile.mock.calls[0][0].source)
    // Astro server environments load the same production manifest inline.
    const inline = await (plugin.load as any).call({}, RESOLVED_VIRTUAL_MANIFEST_ID)
    for (const json of [emitFile.mock.calls[0][0].source, inline]) {
      expect(json).toContain('"name":"--btn"')
      expect(json).not.toContain('"source"')
    }
  })

  it('does not eagerly load the default manifest during production buildStart', async () => {
    const root = path.join(FIXTURE_DIR, 'css-only')
    const { context, viteConfig } = createContext(root)
    context.config.command = 'build'
    const plugin = ManifestVirtualModulePlugin(context)

    await (plugin.buildStart as any).call({})

    expect(viteConfig.server.fs.allow).toEqual([])
  })

  it('emits the default manifest through a universal facade in SSR production build', async () => {
    const root = path.join(FIXTURE_DIR, 'css-only')
    const { context } = createContext(root)
    context.config.command = 'build'
    context.config.build.ssr = true
    const plugin = ManifestVirtualModulePlugin(context)
    const emitFile = vi.fn(() => 'master_css_manifest_ref')

    const code = await (plugin.load as any).call({ emitFile }, RESOLVED_VIRTUAL_MANIFEST_ID)

    expect(code).toContain('const masterCSSManifestURL = import.meta.ROLLUP_FILE_URL_master_css_manifest_ref;')
    expect(code).toContain('loadMasterCSSManifestFromFile')
    expect(code).toContain(`with: { type: 'json' }`)
    expect(code).toContain('const response = await fetch(specifier)')
    expect(code).not.toContain(`import { readFile } from 'node:fs/promises';`)
    expect(code).not.toContain('font-bold')
    expect(context.defaultManifestAssetReferenceId).toBeUndefined()
    expect(context.defaultManifestAssetSource).toBeUndefined()
  })

  it('resolves server manifest file URLs relative to the chunk', async () => {
    const { context } = createContext(path.join(FIXTURE_DIR, 'css-only'))
    context.config.command = 'build'
    const plugin = ManifestVirtualModulePlugin(context)
    const server = { config: { consumer: 'server' } }, client = { config: { consumer: 'client' } }
    // An environment build keeps one config, so `build.ssr` cannot tell the outputs apart.
    const serverCode = await (plugin.load as any).call({ environment: server, emitFile: () => 'server_ref' }, RESOLVED_VIRTUAL_MANIFEST_ID)
    const clientCode = await (plugin.load as any).call({ environment: client, emitFile: () => 'client_ref' }, RESOLVED_VIRTUAL_MANIFEST_ID)
    const resolveFileUrl = (referenceId: string, format = 'es') => (plugin.resolveFileUrl as any)({ referenceId, relativePath: '../_app/master-css-manifest.json', format })

    expect(serverCode).toContain('loadMasterCSSManifestFromFile')
    expect(clientCode).not.toContain('loadMasterCSSManifestFromFile')
    expect(resolveFileUrl('server_ref')).toBe('new URL("../_app/master-css-manifest.json", import.meta.url).href')
    expect(resolveFileUrl('server_ref', 'cjs')).toBe(`new URL("../_app/master-css-manifest.json", require('node:url').pathToFileURL(__filename).href).href`)
    // Client references keep the host's public URL.
    expect(resolveFileUrl('client_ref')).toBeUndefined()
  })

  it('handles unimported CSS manifest changes through CSS HMR only', async () => {
    const root = path.join(FIXTURE_DIR, 'css-only')
    const { context } = createContext(root)
    const plugin = ManifestVirtualModulePlugin(context)
    const buttonManifestPath = path.join(root, 'styles/button.css')
    const module = { importers: new Set() }
    const invalidateModule = vi.fn()
    const send = vi.fn()

    await (plugin.buildStart as any).call({})
    const result = await (plugin.handleHotUpdate as any)({
      file: normalizePath(buttonManifestPath),
      server: {
        moduleGraph: {
          getModuleById: vi.fn((id) => id === RESOLVED_VIRTUAL_MANIFEST_ID ? module : undefined),
          invalidateModule
        },
        ws: { send }
      }
    })

    expect(invalidateModule).toHaveBeenCalledWith(module)
    expect(send).not.toHaveBeenCalled()
    expect(result).toEqual([module])
  })

  it('updates the default virtual manifest module through HMR when imported', async () => {
    const root = path.join(FIXTURE_DIR, 'css-only')
    const { context } = createContext(root)
    const plugin = ManifestVirtualModulePlugin(context)
    const importer = {}
    const module = { importers: new Set([importer]) }
    const invalidateModule = vi.fn()
    const send = vi.fn()
    const manifestEntryPath = path.join(root, 'app.css')

    await (plugin.buildStart as any).call({})
    const result = await (plugin.handleHotUpdate as any)({
      file: normalizePath(manifestEntryPath),
      server: {
        moduleGraph: {
          getModuleById: vi.fn((id) => id === RESOLVED_VIRTUAL_MANIFEST_ID ? module : undefined),
          invalidateModule
        },
        ws: { send }
      }
    })

    expect(invalidateModule).toHaveBeenCalledWith(module)
    expect(send).not.toHaveBeenCalled()
    expect(result).toEqual([module])
  })

})
