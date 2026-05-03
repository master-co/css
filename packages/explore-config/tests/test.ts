import { test, expect } from 'vitest'
import exploreConfig from '../src'
import config from './master.css'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

test('loads the default TypeScript config', () => {
    expect(exploreConfig({ cwd: __dirname })).toStrictEqual(config)
})

test('loads an explicit config file name', () => {
    expect(exploreConfig({ cwd: __dirname, name: 'custom.config.ts' })).toStrictEqual({
        components: {
            custom: 'inline-flex'
        }
    })
})

test('resolves named config exports before default exports', () => {
    expect(exploreConfig({ cwd: __dirname, name: 'named.css.ts' })).toStrictEqual({
        components: {
            named: 'inline-flex'
        }
    })
})

test('loads CommonJS configs', () => {
    expect(exploreConfig({ cwd: __dirname, name: 'legacy.css.cjs' })).toStrictEqual({
        components: {
            legacy: 'inline-flex'
        }
    })
})

test('returns undefined when the config file does not exist', () => {
    expect(exploreConfig({ cwd: __dirname, name: 'missing.css' })).toBeUndefined()
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
    })).toStrictEqual({
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
        expect(exploreConfig({ cwd })).toStrictEqual({
            components: {
                one: 'block'
            }
        })
        writeFileSync(configPath, `export default { components: { two: 'inline-flex' } }`)
        expect(exploreConfig({ cwd })).toStrictEqual({
            components: {
                two: 'inline-flex'
            }
        })
    } finally {
        rmSync(cwd, { force: true, recursive: true })
    }
})
