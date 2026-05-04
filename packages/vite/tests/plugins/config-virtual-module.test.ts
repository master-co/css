import { describe, expect, it, vi } from 'vitest'
import path from 'node:path'
import { ConfigVirtualModulePlugin } from '../../src/plugins/config-virtual-module'
import {
    MASTER_CSS_CONFIG_QUERY,
    RESOLVED_VIRTUAL_CONFIG_ID
} from '../../src/common'
import { toResolvedMasterCSSConfigId } from '../../src/utils/config-module'

const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/config-virtual-module')

function createResolvedConfig(root = FIXTURE_DIR) {
    return {
        root,
        server: {
            fs: {
                allow: []
            }
        }
    } as any
}

function parseDefaultExport(code: string) {
    return JSON.parse(code.replace(/^export default /, '').replace(/;$/, ''))
}

describe('ConfigVirtualModulePlugin', () => {
    it('loads the default virtual config from master.css', async () => {
        const context = { extractor: {} as any } as any
        const plugin = ConfigVirtualModulePlugin({ config: 'master.css' }, context)
        const root = path.join(FIXTURE_DIR, 'css-only')
        const viteConfig = createResolvedConfig(root)

        await (plugin.configResolved as any).call({}, viteConfig)
        const code = await (plugin.load as any).call({}, RESOLVED_VIRTUAL_CONFIG_ID)
        const config = parseDefaultExport(code)

        expect(context.configPath).toBe(path.join(root, 'master.css'))
        expect(viteConfig.server.fs.allow).toContain(context.configPath)
        expect(config).toMatchObject({
            variables: {
                color: {
                    primary: '#123'
                }
            },
            screens: {
                md: 48
            },
            components: {
                btn: {
                    classNames: ['bg:primary'],
                    declarations: {
                        display: 'inline-flex'
                    }
                }
            }
        })
    })

    it('keeps non-CSS config files as native Vite imports', async () => {
        const context = { extractor: {} as any } as any
        const plugin = ConfigVirtualModulePlugin({ config: 'master.css.js' }, context)

        await (plugin.configResolved as any).call({}, createResolvedConfig())
        const code = await (plugin.load as any).call({}, RESOLVED_VIRTUAL_CONFIG_ID)

        expect(code).toBe(`import config from ${JSON.stringify(path.join(FIXTURE_DIR, 'master.css.js'))}; export default config;`)
    })

    it('resolves and loads per-file CSS configs with ?master-css-config', async () => {
        const context = { extractor: {} as any } as any
        const plugin = ConfigVirtualModulePlugin({}, context)
        const importer = path.join(FIXTURE_DIR, 'entry.ts')
        const addWatchFile = vi.fn()
        const resolve = vi.fn(async (id: string) => ({ id: path.resolve(FIXTURE_DIR, id) }))

        const resolvedId = await (plugin.resolveId as any).call(
            { resolve },
            './theme.css' + MASTER_CSS_CONFIG_QUERY,
            importer
        )
        const code = await (plugin.load as any).call({ addWatchFile }, resolvedId)
        const config = parseDefaultExport(code)

        expect(resolvedId).toBe(toResolvedMasterCSSConfigId(path.join(FIXTURE_DIR, 'theme.css')))
        expect(addWatchFile).toHaveBeenCalledWith(path.join(FIXTURE_DIR, 'theme.css'))
        expect(config).toMatchObject({
            variables: {
                color: {
                    accent: '#456'
                }
            },
            modes: {
                dark: {
                    color: {
                        accent: '#789'
                    }
                }
            }
        })
    })

    it('invalidates unimported CSS config modules without forcing a JS HMR update', async () => {
        const context = { extractor: {} as any } as any
        context.extractor = {
            options: { include: [] },
            reset: vi.fn(async () => undefined)
        }
        const plugin = ConfigVirtualModulePlugin({ config: 'master.css' }, context)
        const root = path.join(FIXTURE_DIR, 'css-only')
        const viteConfig = createResolvedConfig(root)
        const module = { importers: new Set() }
        const invalidateModule = vi.fn()

        await (plugin.configResolved as any).call({}, viteConfig)
        const result = await (plugin.handleHotUpdate as any)({
            file: path.join(root, 'master.css'),
            server: {
                moduleGraph: {
                    getModuleById: vi.fn((id) => id === RESOLVED_VIRTUAL_CONFIG_ID ? module : undefined),
                    invalidateModule
                }
            }
        })

        expect(context.extractor.reset).toHaveBeenCalledWith(context.extractor.options)
        expect(invalidateModule).toHaveBeenCalledWith(module)
        expect(result).toBeUndefined()
    })

    it('returns imported CSS config modules so Vite can reload config consumers', async () => {
        const context = { extractor: {} as any } as any
        context.extractor = {
            options: { include: [] },
            reset: vi.fn(async () => undefined)
        }
        const plugin = ConfigVirtualModulePlugin({ config: 'master.css' }, context)
        const root = path.join(FIXTURE_DIR, 'css-only')
        const viteConfig = createResolvedConfig(root)
        const importer = {}
        const module = { importers: new Set([importer]) }
        const invalidateModule = vi.fn()

        await (plugin.configResolved as any).call({}, viteConfig)
        const result = await (plugin.handleHotUpdate as any)({
            file: path.join(root, 'master.css'),
            server: {
                moduleGraph: {
                    getModuleById: vi.fn((id) => id === RESOLVED_VIRTUAL_CONFIG_ID ? module : undefined),
                    invalidateModule
                }
            }
        })

        expect(context.extractor.reset).toHaveBeenCalledWith(context.extractor.options)
        expect(invalidateModule).toHaveBeenCalledWith(module)
        expect(result).toEqual([module])
    })
})
