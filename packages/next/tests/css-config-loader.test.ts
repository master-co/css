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

async function importLoaderSource(source: string) {
    return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`) as Promise<{ default: any }>
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

describe('css config loader', () => {
    it('turns a CSS config resource into an importable config module', async () => {
        const projectDir = createFixtureDir()
        const configPath = join(projectDir, 'index.css')
        const dependencies: string[] = []
        mkdirSync(projectDir, { recursive: true })
        writeFileSync(configPath, '@master { --color-primary: #123; }')

        const source = await runConfigLoader({
            resourcePath: configPath,
            addDependency: (dependency: string) => dependencies.push(dependency)
        })

        expect(dependencies).toEqual([configPath])
        expect(source).toContain('export default')
        expect(source).toContain('"namespace":"color"')
    })

    it('loads CSS when the loader resource includes ?master-css-config', async () => {
        const projectDir = createFixtureDir()
        const configPath = join(projectDir, 'index.css')
        const dependencies: string[] = []
        mkdirSync(projectDir, { recursive: true })
        writeFileSync(configPath, [
            '@master {',
            '    --color-primary: #123;',
            '}',
            '@master {',
            '    .btn {',
            '        color: var(--color-primary);',
            '    }',
            '}'
        ].join('\n'))

        const source = await runConfigLoader({
            resourcePath: `${configPath}?master-css-config`,
            addDependency: (dependency: string) => dependencies.push(dependency)
        })

        expect(dependencies).toEqual([configPath])
        expect(source).toContain('"namespace":"color"')
        expect(source).toContain('"btn"')
        expect(source).toContain('"color":"var(--color-primary)"')

        const module = await importLoaderSource(source)
        expect(module.default).toMatchObject({
            variables: [
                {
                    namespace: 'color',
                    key: 'primary',
                    value: '#123'
                }
            ],
            utilities: [
                {
                    name: 'btn',
                    type: -4,
                    layer: 'main',
                    declarations: {
                        color: 'var(--color-primary)'
                    }
                }
            ]
        })
    })

    it('loads the default virtual config from CSS entry files only', async () => {
        const projectDir = createFixtureDir()
        mkdirSync(join(projectDir, 'app'), { recursive: true })
        const entryPath = join(projectDir, 'app/globals.css')
        const shakeOnlyPath = join(projectDir, 'app/shake.css')
        const dependencies: string[] = []
        writeFileSync(entryPath, [
            '@import "@master/css";',
            '@master {',
            '    --color-primary: #123;',
            '    .btn { color: var(--color-primary); }',
            '}'
        ].join('\n'))
        writeFileSync(shakeOnlyPath, [
            '@master shake;',
            '@master {',
            '    --color-ignored: #456;',
            '}'
        ].join('\n'))

        const source = await runConfigLoader({
            resourcePath: join(projectDir, 'node_modules/.master-css/master-css-config.js'),
            rootContext: projectDir,
            getOptions: () => ({ virtual: true }),
            addDependency: (dependency: string) => dependencies.push(dependency)
        })

        expect(source).toContain('"namespace":"color"')
        expect(source).toContain('"primary"')
        expect(source).toContain('"btn"')
        expect(source).not.toContain('ignored')
        expect(dependencies).toContain(entryPath)
        expect(dependencies).not.toContain(shakeOnlyPath)
    })
})
