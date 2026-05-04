import { test, expect } from 'vitest'
import exploreConfig, { resolveConfigPath } from '../src'
import config from './master.css'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

test('loads the default TypeScript config', () => {
    expect(exploreConfig({ cwd: __dirname })).toMatchObject({
        basename: 'master.css.ts',
        extension: 'ts',
        path: join(__dirname, 'master.css.ts'),
        config
    })
})

test('loads an explicit config file name', () => {
    expect(exploreConfig({ cwd: __dirname, name: 'custom.config.ts' })?.config).toStrictEqual({
        components: {
            custom: 'inline-flex'
        }
    })
})

test('resolves named config exports before default exports', () => {
    expect(exploreConfig({ cwd: __dirname, name: 'named.css.ts' })?.config).toStrictEqual({
        components: {
            named: 'inline-flex'
        }
    })
})

test('loads CommonJS configs', () => {
    expect(exploreConfig({ cwd: __dirname, name: 'legacy.css.cjs' })?.config).toStrictEqual({
        components: {
            legacy: 'inline-flex'
        }
    })
})

test('returns undefined when the config file does not exist', () => {
    expect(exploreConfig({ cwd: __dirname, name: 'missing.css' })).toBeUndefined()
})

test('loads CSS configs after script configs', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-config-'))
    try {
        writeFileSync(join(cwd, 'master.css'), `
            @master {
                --color-primary: #123;
            }
        `)
        expect(exploreConfig({ cwd })).toMatchObject({
            basename: 'master.css',
            extension: 'css',
            config: {
                variables: {
                    color: {
                        primary: '#123'
                    }
                }
            }
        })
        expect(exploreConfig({ cwd })?.config).toStrictEqual({
            variables: {
                color: {
                    primary: '#123'
                }
            }
        })

        writeFileSync(join(cwd, 'master.css.ts'), `export default { components: { script: 'block' } }`)
        expect(exploreConfig({ cwd })?.config).toStrictEqual({
            components: {
                script: 'block'
            }
        })
    } finally {
        rmSync(cwd, { force: true, recursive: true })
    }
})

test('returns an explore result for downstream integrations', () => {
    const result = exploreConfig({
        cwd: __dirname,
        name: 'custom.config.ts'
    })

    expect(result).toStrictEqual({
        basename: 'custom.config.ts',
        extension: 'ts',
        path: join(__dirname, 'custom.config.ts'),
        config: {
            components: {
                custom: 'inline-flex'
            }
        }
    })
})

test('resolves CSS configs with the lowest default priority', () => {
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

test('calls found with the matched basename and absolute path', () => {
    const found: string[] = []
    exploreConfig({
        cwd: __dirname,
        name: 'custom.config.ts',
        found: (basename, path) => found.push(`${basename}:${path}`)
    })
    expect(found).toStrictEqual([
        `custom.config.ts:${join(__dirname, 'custom.config.ts')}`
    ])
})

test('supports custom extension order', () => {
    expect(exploreConfig({
        cwd: __dirname,
        name: 'legacy.css',
        extensions: ['ts', 'cjs']
    })?.config).toStrictEqual({
        components: {
            legacy: 'inline-flex'
        }
    })
})

test('reloads changed config files without reusing module cache', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-config-'))
    const configPath = join(cwd, 'master.css.ts')
    try {
        writeFileSync(configPath, `export default { components: { one: 'block' } }`)
        expect(exploreConfig({ cwd })?.config).toStrictEqual({
            components: {
                one: 'block'
            }
        })
        writeFileSync(configPath, `export default { components: { two: 'inline-flex' } }`)
        expect(exploreConfig({ cwd })?.config).toStrictEqual({
            components: {
                two: 'inline-flex'
            }
        })
    } finally {
        rmSync(cwd, { force: true, recursive: true })
    }
})
