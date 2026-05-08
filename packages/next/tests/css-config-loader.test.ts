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

afterEach(() => {
    if (fixtureDir) {
        rmSync(fixtureDir, { recursive: true, force: true })
        fixtureDir = undefined
    }
})

describe('css config loader', () => {
    it('turns master.css into an importable config module', () => {
        const projectDir = createFixtureDir()
        const configPath = join(projectDir, 'master.css')
        const dependencies: string[] = []
        mkdirSync(projectDir, { recursive: true })
        writeFileSync(configPath, '@master { --color-primary: #123; }')

        const source = masterCSSConfigLoader.call({
            resourcePath: configPath,
            addDependency: (dependency: string) => dependencies.push(dependency)
        })

        expect(dependencies).toEqual([configPath])
        expect(source).toContain('export default')
        expect(source).toContain('"namespace":"color"')
    })

    it('loads master.css when the loader resource includes ?master-css-config', async () => {
        const projectDir = createFixtureDir()
        const configPath = join(projectDir, 'master.css')
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

        const source = masterCSSConfigLoader.call({
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
           : {
                btn: [
                    {
                        selector: '&',
                        declarations: {
                            color: 'var(--color-primary)'
                        }
                    }
                ]
            }
        })
    })
})
