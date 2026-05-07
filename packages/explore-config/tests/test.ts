import { test, expect } from 'vitest'
import exploreConfig, { loadConfig, resolveConfigPath } from '../src'
import exploreConfigSync, { loadConfigSync } from '../src/sync'
import config from './master.css'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

test('loads the default TypeScript config', async () => {
    expect(await exploreConfig({ cwd: __dirname })).toMatchObject({
        basename: 'master.css.ts',
        extension: 'ts',
        path: join(__dirname, 'master.css.ts'),
        config
    })
})

test('loads an explicit config file name', async () => {
    expect((await exploreConfig({ cwd: __dirname, name: 'custom.config.ts' }))?.config).toStrictEqual({
        components: {
            custom: [
                { selector: '&', declarations: { display: 'inline-flex' } }
            ]
        }
    })
})

test('resolves named config exports before default exports', async () => {
    expect((await exploreConfig({ cwd: __dirname, name: 'named.css.ts' }))?.config).toStrictEqual({
        components: {
            named: [
                { selector: '&', declarations: { display: 'inline-flex' } }
            ]
        }
    })
})

test('loads CommonJS configs', async () => {
    expect((await exploreConfig({ cwd: __dirname, name: 'legacy.css.cjs' }))?.config).toStrictEqual({
        components: {
            legacy: [
                { selector: '&', declarations: { display: 'inline-flex' } }
            ]
        }
    })
})

test('returns undefined when the config file does not exist', async () => {
    expect(await exploreConfig({ cwd: __dirname, name: 'missing.css' })).toBeUndefined()
})

test('loads CSS configs after script configs', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-config-'))
    try {
        writeFileSync(join(cwd, 'master.css'), `
            @master {
                --color-primary: #123;
            }
        `)
        expect(await exploreConfig({ cwd })).toMatchObject({
            basename: 'master.css',
            extension: 'css',
            config: {
                variables: [
                    { namespace: 'color', key: 'primary', value: '#123' }
                ]
            }
        })
        expect((await exploreConfig({ cwd }))?.config).toStrictEqual({
            variables: [
                { namespace: 'color', key: 'primary', value: '#123' }
            ]
        })

        writeFileSync(join(cwd, 'master.css.ts'), `export default { components: { script: [{ selector: '&', declarations: { display: 'block' } }] } }`)
        expect((await exploreConfig({ cwd }))?.config).toStrictEqual({
            components: {
                script: [
                    { selector: '&', declarations: { display: 'block' } }
                ]
            }
        })
    } finally {
        rmSync(cwd, { force: true, recursive: true })
    }
})

test('returns an explore result for downstream integrations', async () => {
    const result = await exploreConfig({
        cwd: __dirname,
        name: 'custom.config.ts'
    })

    expect(result).toStrictEqual({
        basename: 'custom.config.ts',
        extension: 'ts',
        path: join(__dirname, 'custom.config.ts'),
        dependencies: [join(__dirname, 'custom.config.ts')],
        config: {
            components: {
                custom: [
                    { selector: '&', declarations: { display: 'inline-flex' } }
                ]
            }
        }
    })
})

test('loads config results directly', async () => {
    const path = join(__dirname, 'custom.config.ts')

    await expect(loadConfig(path)).resolves.toStrictEqual({
        dependencies: [path],
        config: {
            components: {
                custom: [
                    { selector: '&', declarations: { display: 'inline-flex' } }
                ]
            }
        }
    })
    expect(loadConfigSync(path)).toStrictEqual({
        dependencies: [path],
        config: {
            components: {
                custom: [
                    { selector: '&', declarations: { display: 'inline-flex' } }
                ]
            }
        }
    })
})

test('resolves CSS configs with the lowest default priority', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-config-'))
    try {
        writeFileSync(join(cwd, 'master.css'), '')
        writeFileSync(join(cwd, 'master.css.ts'), `export default {}`)

        expect(resolveConfigPath({ cwd })).toMatchObject({
            basename: 'master.css.ts',
            extension: 'ts',
            path: join(cwd, 'master.css.ts')
        })
    } finally {
        rmSync(cwd, { force: true, recursive: true })
    }
})

test('loads imported CSS config files', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-config-'))
    try {
        mkdirSync(join(cwd, 'styles'))
        const entry = join(cwd, 'master.css')
        const button = join(cwd, 'styles/button.css')
        writeFileSync(button, `
            @master components {
                .btn {
                    font-size: 1rem;
                    display: inline-flex;
                }
            }
        `)
        writeFileSync(entry, `
            @import './styles/button.css';

            @master components {
                .btn {
                    display: block;
                }
            }
        `)

        const result = await exploreConfig({ cwd })

        expect(result?.dependencies).toEqual([entry, button])
        expect(result?.config).toStrictEqual({
            components: {
                btn: [
                    {
                        selector: '&',
                        declarations: {
                            'font-size': '1rem',
                            display: 'block'
                        }
                    }
                ]
            }
        })
    } finally {
        rmSync(cwd, { force: true, recursive: true })
    }
})

test('loads imported CSS config files synchronously', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-config-'))
    try {
        mkdirSync(join(cwd, 'styles'))
        const entry = join(cwd, 'master.css')
        const button = join(cwd, 'styles/button.css')
        writeFileSync(button, `
            @master components {
                .btn {
                    font-size: 1rem;
                }
            }
        `)
        writeFileSync(entry, `
            @import './styles/button.css';
        `)

        const result = exploreConfigSync({ cwd })

        expect(result?.dependencies).toEqual([entry, button])
        expect(result?.config).toStrictEqual({
            components: {
                btn: [
                    {
                        selector: '&',
                        declarations: {
                            'font-size': '1rem'
                        }
                    }
                ]
            }
        })
    } finally {
        rmSync(cwd, { force: true, recursive: true })
    }
})

test('calls found with the matched basename and absolute path', async () => {
    const found: string[] = []
    await exploreConfig({
        cwd: __dirname,
        name: 'custom.config.ts',
        found: (basename, path) => found.push(`${basename}:${path}`)
    })
    expect(found).toStrictEqual([
        `custom.config.ts:${join(__dirname, 'custom.config.ts')}`
    ])
})

test('supports custom extension order', async () => {
    expect((await exploreConfig({
        cwd: __dirname,
        name: 'legacy.css',
        extensions: ['ts', 'cjs']
    }))?.config).toStrictEqual({
        components: {
            legacy: [
                { selector: '&', declarations: { display: 'inline-flex' } }
            ]
        }
    })
})

test('reloads changed config files without reusing module cache', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-config-'))
    const configPath = join(cwd, 'master.css.ts')
    try {
        writeFileSync(configPath, `export default { components: { one: [{ selector: '&', declarations: { display: 'block' } }] } }`)
        expect((await exploreConfig({ cwd }))?.config).toStrictEqual({
            components: {
                one: [
                    { selector: '&', declarations: { display: 'block' } }
                ]
            }
        })
        writeFileSync(configPath, `export default { components: { two: [{ selector: '&', declarations: { display: 'inline-flex' } }] } }`)
        expect((await exploreConfig({ cwd }))?.config).toStrictEqual({
            components: {
                two: [
                    { selector: '&', declarations: { display: 'inline-flex' } }
                ]
            }
        })
    } finally {
        rmSync(cwd, { force: true, recursive: true })
    }
})
