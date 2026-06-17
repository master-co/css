import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { ensureVirtualPlanModulePath, ensureVirtualPreloadedModulePath } from '../src/node'
import { EMPTY_PLAN_JSON, toVirtualDefaultPlanModulePath } from '../src/plan-module'
import { toInlinePlanModule } from '../src/plan-facade'
import { EMPTY_PRELOADED_MODULE, toVirtualPreloadedModulePath } from '../src/preloaded-module'

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
