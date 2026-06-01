import { describe, expect, it, vi } from 'vitest'
import path from 'node:path'
import { ConfigLoaderPlugin } from '../../src/plugins/config-loader'
import { MASTER_CSS_CONFIG_QUERY, fromResolvedMasterCSSConfigId, toResolvedMasterCSSConfigId } from '@master/css-explore-config'

const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/config-virtual-module')

function parseDefaultExport(code: string) {
    return JSON.parse(code.replace(/^export default /, '').replace(/;$/, ''))
}

describe('ConfigLoaderPlugin', () => {
    it('encodes per-file CSS config ids without a .css suffix for Vite dev', () => {
        const file = path.join(FIXTURE_DIR, 'theme.css')
        const id = toResolvedMasterCSSConfigId(file)

        expect(id).not.toContain('.css')
        expect(id).not.toContain('%2Ecss')
        expect(fromResolvedMasterCSSConfigId(id)).toBe(file)
    })

    it('resolves and loads per-file CSS configs with ?master-css-config', async () => {
        const context = { extractor: {} as any } as any
        const plugin = ConfigLoaderPlugin(context)
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
        const themeComponentsPath = path.join(FIXTURE_DIR, 'styles/theme-components.css')

        expect(resolvedId).toBe(toResolvedMasterCSSConfigId(path.join(FIXTURE_DIR, 'theme.css')))
        expect(addWatchFile).toHaveBeenCalledWith(path.join(FIXTURE_DIR, 'theme.css'))
        expect(addWatchFile).toHaveBeenCalledWith(themeComponentsPath)
        expect(config).toMatchObject({
            variables: [
                { namespace: 'color', key: 'accent', value: '#456' },
                { namespace: 'color', key: 'accent', value: '#789', mode: 'dark' }
            ],
            utilities: expect.arrayContaining([
                expect.objectContaining({
                    name: 'badge',
                    type: -4,
                    layer: 'main',
                    declarations: {
                        display: 'inline-flex'
                    }
                })
            ])
        })
        expect(config.modes).toBeUndefined()
    })

    it('full reloads when a per-file CSS config module is imported', async () => {
        const context = { extractor: {} as any } as any
        const plugin = ConfigLoaderPlugin(context)
        const configPath = path.join(FIXTURE_DIR, 'theme.css')
        const resolvedId = toResolvedMasterCSSConfigId(configPath)
        const importer = {}
        const module = { importers: new Set([importer]) }
        const invalidateModule = vi.fn()
        const send = vi.fn()

        await (plugin.load as any).call({ addWatchFile: vi.fn() }, resolvedId)
        const result = await (plugin.handleHotUpdate as any)({
            file: configPath,
            server: {
                moduleGraph: {
                    getModuleById: vi.fn((id) => id === resolvedId ? module : undefined),
                    invalidateModule
                },
                ws: { send }
            }
        })

        expect(invalidateModule).toHaveBeenCalledWith(module)
        expect(send).toHaveBeenCalledWith({
            type: 'full-reload',
            path: '*',
            triggeredBy: configPath
        })
        expect(result).toEqual([])
    })
})
