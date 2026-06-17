import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import masterCSSPlanLoader from '../src/css-plan-loader'

let fixtureDir: string | undefined

function createFixtureDir() {
    fixtureDir = mkdtempSync(join(tmpdir(), 'master-css-next-'))
    return fixtureDir
}

function runPlanLoader(context: {
    resourcePath: string
    rootContext?: string
    getOptions?: () => any
    addDependency?: (dependency: string) => void
}) {
    return new Promise<string>((resolve, reject) => {
        masterCSSPlanLoader.call({
            ...context,
            async: () => (error: Error | null, result?: string) => {
                if (error) {
                    reject(error)
                    return
                }
                resolve(result || '')
            }
        })
    })
}

afterEach(() => {
    if (fixtureDir) {
        rmSync(fixtureDir, { recursive: true, force: true })
        fixtureDir = undefined
    }
})

describe('css plan loader', () => {
    it('turns a CSS entry resource into an importable plan JSON asset', async () => {
        const projectDir = createFixtureDir()
        const planPath = join(projectDir, 'index.css')
        const dependencies: string[] = []
        mkdirSync(projectDir, { recursive: true })
        writeFileSync(planPath, '@theme { --color-primary: #123; }')

        const source = await runPlanLoader({
            resourcePath: planPath,
            addDependency: (dependency: string) => dependencies.push(dependency)
        })

        expect(dependencies).toEqual([planPath])
        expect(source).toContain('"version":1')
        expect(JSON.parse(source).version).toBe(1)
        expect(source).toContain('primary')
        expect(source).toContain('#123')
    })

    it('wraps the plan JSON as an ECMAScript module when requested', async () => {
        const projectDir = createFixtureDir()
        const planPath = join(projectDir, 'index.css')
        mkdirSync(projectDir, { recursive: true })
        writeFileSync(planPath, '@theme { --color-primary: #123; }')

        const source = await runPlanLoader({
            resourcePath: planPath,
            getOptions: () => ({ module: true })
        })

        expect(source).toMatch(/^export default \{"version":1/)
        expect(source).toContain('primary')
        expect(source).toContain('#123')
    })

    it('wraps the plan JSON as an external JSON facade when requested', async () => {
        const projectDir = createFixtureDir()
        const planPath = join(projectDir, 'index.css')
        mkdirSync(projectDir, { recursive: true })
        writeFileSync(planPath, '@theme { --color-primary: #123; }')

        const source = await runPlanLoader({
            resourcePath: planPath,
            rootContext: projectDir,
            getOptions: () => ({ module: true, external: true })
        })
        const assetDir = join(projectDir, 'node_modules/.master-css')
        const assetFile = readdirSync(assetDir).find((file) => file.endsWith('.json'))

        expect(source).toContain('new URL("./node_modules/.master-css/')
        expect(source).toContain('loadMasterCSSPlanFromFetch')
        expect(source).not.toContain('#123')
        expect(assetFile).toBeTruthy()
        expect(readFileSync(join(assetDir, assetFile || ''), 'utf8')).toContain('#123')
    })

    it('loads CSS when the loader resource includes ?master-css-plan', async () => {
        const projectDir = createFixtureDir()
        const planPath = join(projectDir, 'index.css')
        const dependencies: string[] = []
        mkdirSync(projectDir, { recursive: true })
        writeFileSync(planPath, [
            '@theme {',
            '    --color-primary: #123;',
            '}',
            '@components {',
            '    btn {',
            '        color: var(--color-primary);',
            '    }',
            '}'
        ].join('\n'))

        const source = await runPlanLoader({
            resourcePath: `${planPath}?master-css-plan`,
            addDependency: (dependency: string) => dependencies.push(dependency)
        })

        expect(dependencies).toEqual([planPath])
        expect(source).toContain('"version":1')
        expect(source).toContain('primary')
        expect(source).toContain('#123')
        expect(source).toContain('"btn"')
        expect(source).toContain('var(--color-primary)')
    })

    it('loads the default virtual plan from CSS entry files only', async () => {
        const projectDir = createFixtureDir()
        mkdirSync(join(projectDir, 'app'), { recursive: true })
        const entryPath = join(projectDir, 'app/globals.css')
        const preserveOnlyPath = join(projectDir, 'app/preserve.css')
        const dependencies: string[] = []
        writeFileSync(entryPath, [
            '@import "@master/css";',
            '@theme {',
            '    --color-primary: #123;',
            '}',
            '@components {',
            '    btn { color: var(--color-primary); }',
            '}'
        ].join('\n'))
        writeFileSync(preserveOnlyPath, [
            '@preserve native;',
            '@theme {',
            '    --color-ignored: #456;',
            '}'
        ].join('\n'))

        const source = await runPlanLoader({
            resourcePath: join(projectDir, 'node_modules/.master-css/master-css-plan.js'),
            rootContext: projectDir,
            getOptions: () => ({ virtual: true }),
            addDependency: (dependency: string) => dependencies.push(dependency)
        })

        expect(source).toContain('"version":1')
        expect(source).toContain('primary')
        expect(source).toContain('#123')
        expect(source).toContain('"btn"')
        expect(source).not.toContain('ignored')
        expect(dependencies).toContain(entryPath)
        expect(dependencies).not.toContain(preserveOnlyPath)
    })
})
