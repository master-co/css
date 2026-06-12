import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import masterCSSConfigLoader from '../src/css-config-loader'

let fixtureDir: string | undefined

function createFixtureDir() {
    fixtureDir = mkdtempSync(join(tmpdir(), 'master-css-next-'))
    return fixtureDir
}

function runConfigLoader(context: {
    resourcePath: string
    rootContext?: string
    getOptions?: () => any
    addDependency?: (dependency: string) => void
}) {
    return new Promise<string>((resolve, reject) => {
        masterCSSConfigLoader.call({
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
    it('turns a CSS entry resource into an importable plan module', async () => {
        const projectDir = createFixtureDir()
        const configPath = join(projectDir, 'index.css')
        const dependencies: string[] = []
        mkdirSync(projectDir, { recursive: true })
        writeFileSync(configPath, '@theme { --color-primary: #123; }')

        const source = await runConfigLoader({
            resourcePath: configPath,
            addDependency: (dependency: string) => dependencies.push(dependency)
        })

        expect(dependencies).toEqual([configPath])
        expect(source).toContain('export default')
        expect(source).toContain('"version":1')
        expect(source).toContain('primary')
        expect(source).toContain('#123')
    })

    it('loads CSS when the loader resource includes ?master-css-plan', async () => {
        const projectDir = createFixtureDir()
        const configPath = join(projectDir, 'index.css')
        const dependencies: string[] = []
        mkdirSync(projectDir, { recursive: true })
        writeFileSync(configPath, [
            '@theme {',
            '    --color-primary: #123;',
            '}',
            '@components {',
            '    btn {',
            '        color: var(--color-primary);',
            '    }',
            '}'
        ].join('\n'))

        const source = await runConfigLoader({
            resourcePath: `${configPath}?master-css-plan`,
            addDependency: (dependency: string) => dependencies.push(dependency)
        })

        expect(dependencies).toEqual([configPath])
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

        const source = await runConfigLoader({
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
