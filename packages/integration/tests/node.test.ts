import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
    createVirtualDefaultPlanModulePathPattern,
    ensureVirtualPlanModulePath,
    ensureVirtualPreloadedModulePath,
    fromResolvedMasterCSSPlanId,
    toHashedPlanAssetFileName,
    toResolvedMasterCSSPlanId,
    toVirtualCSSModulePath,
    toVirtualCSSPlanAssetPath,
    toVirtualCSSPlanModulePath,
    toVirtualDefaultPlanModulePath,
    toVirtualPreloadedModulePath
} from '../src/node'
import { EMPTY_PLAN_JSON } from '../src/plan-module'
import { toInlinePlanModule } from '../src/plan-facade'
import { EMPTY_PRELOADED_MODULE } from '../src/preloaded-module'

let fixtureDir: string | undefined

function createFixtureDir() {
    fixtureDir = mkdtempSync(path.join(tmpdir(), 'master-css-integration-node-'))
    return fixtureDir
}

afterEach(() => {
    if (fixtureDir) {
        rmSync(fixtureDir, { recursive: true, force: true })
        fixtureDir = undefined
    }
})

describe('@master/css-integration/node', () => {
    it('encodes resolved and filesystem virtual module paths', () => {
        const root = path.resolve('/project')
        const file = path.join(root, 'src/theme.css')
        const id = toResolvedMasterCSSPlanId(file)

        expect(id).not.toContain('.css')
        expect(id).not.toContain('%2Ecss')
        expect(fromResolvedMasterCSSPlanId(id)).toBe(file)
        expect(toVirtualDefaultPlanModulePath(root)).toBe(path.join(root, 'node_modules/.master-css/master-css-plan.js'))
        expect(toVirtualCSSPlanModulePath(root, file)).toMatch(/node_modules[/\\]\.master-css[/\\].+\.plan\.js$/)
        expect(toVirtualCSSPlanAssetPath(root, file)).toMatch(/node_modules[/\\]\.master-css[/\\].+\.plan\.json$/)
        expect(toVirtualCSSModulePath(root)).toBe(path.join(root, 'node_modules/.master-css/master-utilities.css'))
        expect(toVirtualPreloadedModulePath(root)).toBe(path.join(root, 'node_modules/.master-css/master-css-preloaded.js'))
        expect(createVirtualDefaultPlanModulePathPattern().test(toVirtualDefaultPlanModulePath(root))).toBe(true)
    })

    it('hashes plan asset file names', () => {
        expect(toHashedPlanAssetFileName('{"version":3}')).toMatch(/^master-css-plan\.[a-f0-9]{8}\.json$/)
        expect(toHashedPlanAssetFileName('{"version":3}', 'plan')).toMatch(/^plan\.[a-f0-9]{8}\.json$/)
    })

    it('updates stale virtual module placeholders', () => {
        const projectDir = createFixtureDir()
        const planPath = toVirtualDefaultPlanModulePath(projectDir)
        const preloadedPath = toVirtualPreloadedModulePath(projectDir)

        mkdirSync(path.dirname(planPath), { recursive: true })
        writeFileSync(planPath, 'export default { version: 1 };')
        writeFileSync(preloadedPath, 'export default {};')

        expect(ensureVirtualPlanModulePath(projectDir)).toBe(planPath)
        expect(ensureVirtualPreloadedModulePath(projectDir)).toBe(preloadedPath)
        expect(readFileSync(planPath, 'utf8')).toBe(toInlinePlanModule(EMPTY_PLAN_JSON))
        expect(readFileSync(preloadedPath, 'utf8')).toBe(EMPTY_PRELOADED_MODULE)
    })
})
