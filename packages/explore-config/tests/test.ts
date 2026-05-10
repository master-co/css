import { test, expect, vi } from 'vitest'
import exploreConfig, { formatMissingConfigWarning, loadConfig, resolveConfigPath, warnMissingConfig } from '../src'
import exploreConfigSync, { loadConfigSync } from '../src/sync'
import config from './master.css'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

function mainUtility(name: string, declarations: Record<string, string>) {
    return {
        name,
        type: -4,
        layer: 'main',
        rules: [
            { selector: '&', declarations }
        ]
    }
}

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
        utilities: [
            mainUtility('custom', { display: 'inline-flex' })
        ]
    })
})

test('resolves named config exports before default exports', async () => {
    expect((await exploreConfig({ cwd: __dirname, name: 'named.css.ts' }))?.config).toStrictEqual({
        utilities: [
            mainUtility('named', { display: 'inline-flex' })
        ]
    })
})

test('loads CommonJS configs', async () => {
    expect((await exploreConfig({ cwd: __dirname, name: 'legacy.css.cjs' }))?.config).toStrictEqual({
        utilities: [
            mainUtility('legacy', { display: 'inline-flex' })
        ]
    })
})

test('returns undefined when the config file does not exist', async () => {
    expect(await exploreConfig({ cwd: __dirname, name: 'missing.css' })).toBeUndefined()
})

test('calls missing when the config file does not exist', async () => {
    const missing = vi.fn()

    expect(await exploreConfig({
        cwd: __dirname,
        name: 'missing.css',
        missing
    })).toBeUndefined()
    expect(missing).toHaveBeenCalledWith('missing.css', __dirname)
})

test('formats and dedupes missing config warnings', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-config-'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
        const warning = formatMissingConfigWarning({
            integration: '@master/css.test',
            name: 'master.css',
            cwd
        })

        expect(warning).toContain(`[@master/css.test] master.css was not found in ${cwd}.`)
        expect(warning).toContain('@import "./src/globals.css";')
        expect(warning).toContain('https://rc.css.master.co/messages/missing-master-css')

        warnMissingConfig({
            integration: '@master/css.test',
            name: 'master.css',
            cwd,
            force: true
        })
        warnMissingConfig({
            integration: '@master/css.test',
            name: 'master.css',
            cwd,
            force: true
        })

        expect(warn).toHaveBeenCalledTimes(1)
        expect(warn.mock.calls[0][0]).toBe(warning)
    } finally {
        warn.mockRestore()
        rmSync(cwd, { force: true, recursive: true })
    }
})

test('prefers CSS configs before script configs', async () => {
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

        writeFileSync(join(cwd, 'master.css.ts'), `export default { utilities: [{ name: 'script', type: -4, layer: 'main', rules: [{ selector: '&', declarations: { display: 'block' } }] }] }`)
        expect((await exploreConfig({ cwd }))?.config).toStrictEqual({
            variables: [
                { namespace: 'color', key: 'primary', value: '#123' }
            ]
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
            utilities: [
                mainUtility('custom', { display: 'inline-flex' })
            ]
        }
    })
})

test('loads config results directly', async () => {
    const path = join(__dirname, 'custom.config.ts')

    await expect(loadConfig(path)).resolves.toStrictEqual({
        dependencies: [path],
        config: {
            utilities: [
                mainUtility('custom', { display: 'inline-flex' })
            ]
        }
    })
    expect(loadConfigSync(path)).toStrictEqual({
        dependencies: [path],
        config: {
            utilities: [
                mainUtility('custom', { display: 'inline-flex' })
            ]
        }
    })
})

test('resolves CSS configs with the highest default priority', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-config-'))
    try {
        writeFileSync(join(cwd, 'master.css'), '')
        writeFileSync(join(cwd, 'master.css.ts'), `export default {}`)

        expect(resolveConfigPath({ cwd })).toMatchObject({
            basename: 'master.css',
            extension: 'css',
            path: join(cwd, 'master.css')
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
            .button-native {
                color: red;
            }

            @master {
                .btn {
                    font-size: 1rem;
                    display: inline-flex;
                }
            }
        `)
        writeFileSync(entry, `
            @import './styles/button.css';

            body {
                margin: 0;
            }

            @master {
                .btn {
                    display: block;
                }
            }
        `)

        const result = await exploreConfig({ cwd })

        expect(result?.dependencies).toEqual([entry, button])
        expect(result?.nativeCSS).toBe('')
        expect(result?.css).toBe('')
        expect(result?.config).toStrictEqual({
            utilities: [
                {
                    name: 'btn',
                    type: -4,
                    layer: 'main',
                    declarations: {
                        'font-size': '1rem',
                        display: 'block'
                    }
                }
            ]
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
            @master {
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
            utilities: [
                {
                    name: 'btn',
                    type: -4,
                    layer: 'main',
                    declarations: {
                        'font-size': '1rem'
                    }
                }
            ]
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
        utilities: [
            mainUtility('legacy', { display: 'inline-flex' })
        ]
    })
})

test('reloads changed config files without reusing module cache', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-config-'))
    const configPath = join(cwd, 'master.css.ts')
    try {
        writeFileSync(configPath, `export default { utilities: [{ name: 'one', type: -4, layer: 'main', rules: [{ selector: '&', declarations: { display: 'block' } }] }] }`)
        expect((await exploreConfig({ cwd }))?.config).toStrictEqual({
            utilities: [
                mainUtility('one', { display: 'block' })
            ]
        })
        writeFileSync(configPath, `export default { utilities: [{ name: 'two', type: -4, layer: 'main', rules: [{ selector: '&', declarations: { display: 'inline-flex' } }] }] }`)
        expect((await exploreConfig({ cwd }))?.config).toStrictEqual({
            utilities: [
                mainUtility('two', { display: 'inline-flex' })
            ]
        })
    } finally {
        rmSync(cwd, { force: true, recursive: true })
    }
})
