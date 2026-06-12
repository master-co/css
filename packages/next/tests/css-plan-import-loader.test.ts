import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import masterCSSPlanImportLoader from '../src/css-plan-import-loader'

let fixtureDir: string | undefined

function createFixtureDir() {
    fixtureDir = mkdtempSync(join(tmpdir(), 'master-css-next-import-'))
    return fixtureDir
}

function readVirtualPlanSource(projectDir: string) {
    const planDir = join(projectDir, 'node_modules/.master-css')
    const [filename] = readdirSync(planDir).filter((entry) => entry.endsWith('.js'))
    return readFileSync(join(planDir, filename), 'utf-8')
}

function runPlanImportLoader(context: {
    source: string
    resourcePath: string
    projectDir: string
    addDependency?: (dependency: string) => void
}) {
    return new Promise<string>((resolve, reject) => {
        masterCSSPlanImportLoader.call({
            resourcePath: context.resourcePath,
            getOptions: () => ({
                projectDir: context.projectDir
            }),
            addDependency: context.addDependency,
            async: () => (error: Error | null, result?: string) => {
                if (error) {
                    reject(error)
                    return
                }
                resolve(result || '')
            }
        }, context.source)
    })
}

afterEach(() => {
    if (fixtureDir) {
        rmSync(fixtureDir, { recursive: true, force: true })
        fixtureDir = undefined
    }
})

describe('css plan import loader', () => {
    it('rewrites relative CSS plan query imports from TypeScript modules to generated JS plan modules', async () => {
        const projectDir = createFixtureDir()
        const appDir = join(projectDir, 'app')
        const planPath = join(appDir, 'theme.css')
        const resourcePath = join(appDir, 'plan.ts')
        const dependencies: string[] = []
        mkdirSync(appDir, { recursive: true })
        writeFileSync(planPath, '@theme { --color-primary: #123; }')
        writeFileSync(resourcePath, '')

        const source = await runPlanImportLoader({
            source: 'import presetPlan from "./theme.css?master-css-plan"\nexport default presetPlan',
            resourcePath,
            projectDir,
            addDependency: (dependency) => dependencies.push(dependency)
        })

        expect(source).toContain('import presetPlan from "../node_modules/.master-css/')
        expect(dependencies).toEqual([planPath])
        expect(readVirtualPlanSource(projectDir)).toContain('"version":1')
        expect(readVirtualPlanSource(projectDir)).toContain('primary')
        expect(readVirtualPlanSource(projectDir)).toContain('#123')
    })

    it('resolves package CSS plan query imports without package-specific rules', async () => {
        const projectDir = createFixtureDir()
        const appDir = join(projectDir, 'app')
        const packageDir = join(projectDir, 'node_modules/@fixture/tokens')
        const resourcePath = join(appDir, 'plan.mjs')
        mkdirSync(appDir, { recursive: true })
        mkdirSync(packageDir, { recursive: true })
        writeFileSync(resourcePath, '')
        writeFileSync(join(packageDir, 'package.json'), JSON.stringify({
            name: '@fixture/tokens',
            type: 'module',
            exports: {
                './theme.css': './theme.css'
            }
        }))
        writeFileSync(join(packageDir, 'theme.css'), '@theme { --color-package: #456; }')

        const source = await runPlanImportLoader({
            source: 'import presetPlan from "@fixture/tokens/theme.css?master-css-plan"\nexport default presetPlan',
            resourcePath,
            projectDir
        })

        expect(source).toContain('import presetPlan from "../node_modules/.master-css/')
        expect(readVirtualPlanSource(projectDir)).toContain('package')
        expect(readVirtualPlanSource(projectDir)).toContain('#456')
    })

    it('leaves non-import strings and unrelated imports unchanged', async () => {
        const projectDir = createFixtureDir()
        const resourcePath = join(projectDir, 'plan.mjs')
        mkdirSync(projectDir, { recursive: true })
        writeFileSync(resourcePath, '')

        await expect(runPlanImportLoader({
            source: [
                'import plan from "virtual:master-css-plan"',
                'const request = "./theme.css?master-css-plan"',
                'export default plan'
            ].join('\n'),
            resourcePath,
            projectDir
        })).resolves.toBe([
            'import plan from "virtual:master-css-plan"',
            'const request = "./theme.css?master-css-plan"',
            'export default plan'
        ].join('\n'))
    })
})
