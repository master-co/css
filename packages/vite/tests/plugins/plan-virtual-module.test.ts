import { describe, expect, it, vi } from 'vitest'
import path from 'node:path'
import PlanVirtualModulePlugin from '../../src/plugins/plan-virtual-module'
import {
    RESOLVED_VIRTUAL_PLAN_ID
} from '../../src/common'

const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/plan-virtual-module')

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

describe('PlanVirtualModulePlugin', () => {
    it('loads the default virtual plan from the managed CSS entry', async () => {
        const root = path.join(FIXTURE_DIR, 'css-only')
        const { context, viteConfig } = createContext(root)
        const plugin = PlanVirtualModulePlugin({}, context)

        const code = await (plugin.load as any).call({}, RESOLVED_VIRTUAL_PLAN_ID)
        const planEntryPath = path.join(root, 'app.css')
        const buttonPlanPath = path.join(root, 'styles/button.css')

        expect(viteConfig.server.fs.allow).toContain(planEntryPath)
        expect(viteConfig.server.fs.allow).toContain(buttonPlanPath)
        expect(code).toContain('export default ')
        expect(code).toContain('"version":2')
    })

    it('emits the default plan as an external JSON asset in production build', async () => {
        const root = path.join(FIXTURE_DIR, 'css-only')
        const { context } = createContext(root)
        context.config.command = 'build'
        const plugin = PlanVirtualModulePlugin({}, context)
        const emitFile = vi.fn(() => 'master_css_plan_ref')

        const code = await (plugin.load as any).call({ emitFile }, RESOLVED_VIRTUAL_PLAN_ID)

        expect(emitFile).toHaveBeenCalledWith(expect.objectContaining({
            type: 'asset',
            name: 'master-css-plan.json',
            source: expect.stringContaining('"version":2')
        }))
        expect(code).toContain('const masterCSSPlanURL = import.meta.ROLLUP_FILE_URL_master_css_plan_ref;')
        expect(code).toContain('await fetch(masterCSSPlanURL)')
        expect(code).not.toContain('font-weight-bold')
    })

    it('handles unimported CSS plan changes through CSS HMR only', async () => {
        const root = path.join(FIXTURE_DIR, 'css-only')
        const { context } = createContext(root)
        const plugin = PlanVirtualModulePlugin({}, context)
        const buttonPlanPath = path.join(root, 'styles/button.css')
        const module = { importers: new Set() }
        const invalidateModule = vi.fn()
        const send = vi.fn()

        await (plugin.buildStart as any).call({})
        const result = await (plugin.handleHotUpdate as any)({
            file: buttonPlanPath,
            server: {
                moduleGraph: {
                    getModuleById: vi.fn((id) => id === RESOLVED_VIRTUAL_PLAN_ID ? module : undefined),
                    invalidateModule
                },
                ws: { send }
            }
        })

        expect(invalidateModule).toHaveBeenCalledWith(module)
        expect(send).not.toHaveBeenCalled()
        expect(result).toEqual([])
    })

    it('full reloads when the default virtual plan module is imported', async () => {
        const root = path.join(FIXTURE_DIR, 'css-only')
        const { context } = createContext(root)
        const plugin = PlanVirtualModulePlugin({}, context)
        const importer = {}
        const module = { importers: new Set([importer]) }
        const invalidateModule = vi.fn()
        const send = vi.fn()
        const planEntryPath = path.join(root, 'app.css')

        await (plugin.buildStart as any).call({})
        const result = await (plugin.handleHotUpdate as any)({
            file: planEntryPath,
            server: {
                moduleGraph: {
                    getModuleById: vi.fn((id) => id === RESOLVED_VIRTUAL_PLAN_ID ? module : undefined),
                    invalidateModule
                },
                ws: { send }
            }
        })

        expect(invalidateModule).toHaveBeenCalledWith(module)
        expect(send).toHaveBeenCalledWith({
            type: 'full-reload',
            path: '*',
            triggeredBy: planEntryPath
        })
        expect(result).toEqual([])
    })

})
