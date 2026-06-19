import { describe, expect, it, vi } from 'vitest'
import path from 'node:path'
import CSSExtractor from '@master/css-extractor'
import PlanLoaderPlugin from '../../src/plugins/plan-loader'
import { MASTER_CSS_PLAN_QUERY, fromResolvedMasterCSSPlanId, toResolvedMasterCSSPlanId } from '@master/css-integration/plan-module'

const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/plan-virtual-module')

async function createContext(root = FIXTURE_DIR) {
    const context = {
        config: {
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
        },
        extractor: new CSSExtractor({ include: [] }, root)
    } as any
    await context.extractor.init()
    return context
}

describe('PlanLoaderPlugin', () => {
    it('encodes per-file CSS plan ids without a .css suffix for Vite dev', () => {
        const file = path.join(FIXTURE_DIR, 'theme.css')
        const id = toResolvedMasterCSSPlanId(file)

        expect(id).not.toContain('.css')
        expect(id).not.toContain('%2Ecss')
        expect(fromResolvedMasterCSSPlanId(id)).toBe(file)
    })

    it('resolves and loads per-file CSS plans with ?master-css-plan', async () => {
        const context = await createContext()
        const plugin = PlanLoaderPlugin(context)
        const importer = path.join(FIXTURE_DIR, 'entry.ts')
        const addWatchFile = vi.fn()
        const resolve = vi.fn(async (id: string) => ({ id: path.resolve(FIXTURE_DIR, id) }))

        const resolvedId = await (plugin.resolveId as any).call(
            { resolve },
            './theme.css' + MASTER_CSS_PLAN_QUERY,
            importer
        )
        const code = await (plugin.load as any).call({ addWatchFile }, resolvedId)
        const themeComponentsPath = path.join(FIXTURE_DIR, 'styles/theme-components.css')

        expect(resolvedId).toBe(toResolvedMasterCSSPlanId(path.join(FIXTURE_DIR, 'theme.css')))
        expect(addWatchFile).toHaveBeenCalledWith(path.join(FIXTURE_DIR, 'theme.css'))
        expect(addWatchFile).toHaveBeenCalledWith(themeComponentsPath)
        expect(code).toContain('"version":3')
        expect(code).toContain('accent')
        expect(code).toContain('#456')
        expect(code).toContain('badge')
    })

    it('emits per-file CSS plans as external JSON assets in production build', async () => {
        const context = await createContext()
        context.config.command = 'build'
        const plugin = PlanLoaderPlugin(context)
        const importer = path.join(FIXTURE_DIR, 'entry.ts')
        const addWatchFile = vi.fn()
        const emitFile = vi.fn(() => 'master_css_query_plan_ref')
        const resolve = vi.fn(async (id: string) => ({ id: path.resolve(FIXTURE_DIR, id) }))

        const resolvedId = await (plugin.resolveId as any).call(
            { resolve },
            './theme.css' + MASTER_CSS_PLAN_QUERY,
            importer
        )
        const code = await (plugin.load as any).call({ addWatchFile, emitFile }, resolvedId)

        expect(emitFile).toHaveBeenCalledWith(expect.objectContaining({
            type: 'asset',
            name: 'master-css-plan.json',
            source: expect.stringContaining('#456')
        }))
        expect(code).toContain('const masterCSSPlanURL = import.meta.ROLLUP_FILE_URL_master_css_query_plan_ref;')
        expect(code).toContain('await fetch(masterCSSPlanURL)')
        expect(code).not.toContain('#456')
    })

    it('full reloads when a per-file CSS plan module is imported', async () => {
        const context = await createContext()
        const plugin = PlanLoaderPlugin(context)
        const planPath = path.join(FIXTURE_DIR, 'theme.css')
        const resolvedId = toResolvedMasterCSSPlanId(planPath)
        const importer = {}
        const module = { importers: new Set([importer]) }
        const invalidateModule = vi.fn()
        const send = vi.fn()

        await (plugin.load as any).call({ addWatchFile: vi.fn() }, resolvedId)
        const result = await (plugin.handleHotUpdate as any)({
            file: planPath,
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
            triggeredBy: planPath
        })
        expect(result).toEqual([])
    })
})
