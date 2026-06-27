import { describe, expect, it, vi } from 'vitest'
import path from 'node:path'
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
        const plugin = ManifestVirtualModulePlugin({}, context)

        const code = await (plugin.load as any).call({}, RESOLVED_VIRTUAL_MANIFEST_ID)
        const manifestEntryPath = path.join(root, 'app.css')
        const buttonManifestPath = path.join(root, 'styles/button.css')

        expect(viteConfig.server.fs.allow).toContain(manifestEntryPath)
        expect(viteConfig.server.fs.allow).toContain(buttonManifestPath)
        expect(code).toContain('export default ')
        expect(code).toContain('"version":1')
    })

    it('emits the default manifest as an external JSON asset in production build', async () => {
        const root = path.join(FIXTURE_DIR, 'css-only')
        const { context } = createContext(root)
        context.config.command = 'build'
        const plugin = ManifestVirtualModulePlugin({}, context)
        const emitFile = vi.fn(() => 'master_css_manifest_ref')

        const code = await (plugin.load as any).call({ emitFile }, RESOLVED_VIRTUAL_MANIFEST_ID)

        expect(emitFile).toHaveBeenCalledWith(expect.objectContaining({
            type: 'asset',
            name: 'master-css-manifest.json',
            source: expect.stringContaining('"version":1')
        }))
        expect(code).toContain('const masterCSSManifestURL = import.meta.ROLLUP_FILE_URL_master_css_manifest_ref;')
        expect(code).toContain('await fetch(masterCSSManifestURL)')
        expect(code).not.toContain('font-weight-bold')
        expect(context.defaultManifestAssetReferenceId).toBe('master_css_manifest_ref')
        expect(context.defaultManifestAssetSource).toContain('"version":1')
    })

    it('does not eagerly load the default manifest during production buildStart', async () => {
        const root = path.join(FIXTURE_DIR, 'css-only')
        const { context, viteConfig } = createContext(root)
        context.config.command = 'build'
        const plugin = ManifestVirtualModulePlugin({}, context)

        await (plugin.buildStart as any).call({})

        expect(viteConfig.server.fs.allow).toEqual([])
    })

    it('emits the default manifest through a universal facade in SSR production build', async () => {
        const root = path.join(FIXTURE_DIR, 'css-only')
        const { context } = createContext(root)
        context.config.command = 'build'
        context.config.build.ssr = true
        const plugin = ManifestVirtualModulePlugin({}, context)
        const emitFile = vi.fn(() => 'master_css_manifest_ref')

        const code = await (plugin.load as any).call({ emitFile }, RESOLVED_VIRTUAL_MANIFEST_ID)

        expect(code).toContain('const masterCSSManifestURL = import.meta.ROLLUP_FILE_URL_master_css_manifest_ref;')
        expect(code).toContain('loadMasterCSSManifestFromFile')
        expect(code).not.toContain(`import { readFile } from 'node:fs/promises';`)
        expect(code).not.toContain('font-weight-bold')
        expect(context.defaultManifestAssetReferenceId).toBeUndefined()
        expect(context.defaultManifestAssetSource).toBeUndefined()
    })

    it('handles unimported CSS manifest changes through CSS HMR only', async () => {
        const root = path.join(FIXTURE_DIR, 'css-only')
        const { context } = createContext(root)
        const plugin = ManifestVirtualModulePlugin({}, context)
        const buttonManifestPath = path.join(root, 'styles/button.css')
        const module = { importers: new Set() }
        const invalidateModule = vi.fn()
        const send = vi.fn()

        await (plugin.buildStart as any).call({})
        const result = await (plugin.handleHotUpdate as any)({
            file: buttonManifestPath,
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
        expect(result).toEqual([])
    })

    it('full reloads when the default virtual manifest module is imported', async () => {
        const root = path.join(FIXTURE_DIR, 'css-only')
        const { context } = createContext(root)
        const plugin = ManifestVirtualModulePlugin({}, context)
        const importer = {}
        const module = { importers: new Set([importer]) }
        const invalidateModule = vi.fn()
        const send = vi.fn()
        const manifestEntryPath = path.join(root, 'app.css')

        await (plugin.buildStart as any).call({})
        const result = await (plugin.handleHotUpdate as any)({
            file: manifestEntryPath,
            server: {
                moduleGraph: {
                    getModuleById: vi.fn((id) => id === RESOLVED_VIRTUAL_MANIFEST_ID ? module : undefined),
                    invalidateModule
                },
                ws: { send }
            }
        })

        expect(invalidateModule).toHaveBeenCalledWith(module)
        expect(send).toHaveBeenCalledWith({
            type: 'full-reload',
            path: '*',
            triggeredBy: manifestEntryPath
        })
        expect(result).toEqual([])
    })

})
