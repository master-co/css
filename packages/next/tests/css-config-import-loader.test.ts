import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import masterCSSConfigImportLoader from '../src/css-config-import-loader'

let fixtureDir: string | undefined

function createFixtureDir() {
    fixtureDir = mkdtempSync(join(tmpdir(), 'master-css-next-import-'))
    return fixtureDir
}

function readVirtualPlanSource(projectDir: string) {
    const configDir = join(projectDir, 'node_modules/.master-css')
    const [filename] = readdirSync(configDir).filter((entry) => entry.endsWith('.js'))
    return readFileSync(join(configDir, filename), 'utf-8')
}

function runConfigImportLoader(context: {
    source: string
    resourcePath: string
    projectDir: string
    addDependency?: (dependency: string) => void
}) {
    return new Promise<string>((resolve, reject) => {
        masterCSSConfigImportLoader.call({
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
        const configPath = join(appDir, 'theme.css')
        const resourcePath = join(appDir, 'config.ts')
        const dependencies: string[] = []
        mkdirSync(appDir, { recursive: true })
        writeFileSync(configPath, '@theme { --color-primary: #123; }')
        writeFileSync(resourcePath, '')

        const source = await runConfigImportLoader({
            source: 'import themePlan from "./theme.css?master-css-plan"\nexport default themePlan',
            resourcePath,
            projectDir,
            addDependency: (dependency) => dependencies.push(dependency)
        })

        expect(source).toContain('import themePlan from "../node_modules/.master-css/')
        expect(dependencies).toEqual([configPath])
        expect(readVirtualPlanSource(projectDir)).toContain('"version":1')
        expect(readVirtualPlanSource(projectDir)).toContain('primary')
        expect(readVirtualPlanSource(projectDir)).toContain('#123')
    })

    it('resolves package CSS plan query imports without package-specific rules', async () => {
        const projectDir = createFixtureDir()
        const appDir = join(projectDir, 'app')
        const packageDir = join(projectDir, 'node_modules/@fixture/tokens')
        const resourcePath = join(appDir, 'config.mjs')
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

        const source = await runConfigImportLoader({
            source: 'import themePlan from "@fixture/tokens/theme.css?master-css-plan"\nexport default themePlan',
            resourcePath,
            projectDir
        })

        expect(source).toContain('import themePlan from "../node_modules/.master-css/')
        expect(readVirtualPlanSource(projectDir)).toContain('package')
        expect(readVirtualPlanSource(projectDir)).toContain('#456')
    })

    it('leaves non-import strings and unrelated imports unchanged', async () => {
        const projectDir = createFixtureDir()
        const resourcePath = join(projectDir, 'config.mjs')
        mkdirSync(projectDir, { recursive: true })
        writeFileSync(resourcePath, '')

        await expect(runConfigImportLoader({
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
