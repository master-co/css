import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import {
    compileCSS,
    findStandaloneMasterDirectiveStatements,
    inspectCSS,
    resolveMasterCSSPackageEntryFile
} from '../src'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../..')

test.concurrent('recognizes @master entry as the only Master entry directive', () => {
    expect(findStandaloneMasterDirectiveStatements('@master entry;').map((statement) => statement.name)).toEqual(['entry'])
    expect(findStandaloneMasterDirectiveStatements('@master;')).toEqual([])
    expect(findStandaloneMasterDirectiveStatements('@master global;')).toEqual([])

    expect(inspectCSS('@master entry;')).toMatchObject({
        hasMasterEntryDirective: true,
        hasMasterCSSImport: false,
        hasMasterEntry: true
    })
    expect(inspectCSS('@master;').hasMasterEntry).toBe(false)
    expect(inspectCSS('@master global;').hasMasterEntry).toBe(false)
    expect(inspectCSS('@import "@master/css";').hasMasterEntry).toBe(true)
})

test.concurrent('strips @master entry before CSS transform', () => {
    const result = compileCSS('@master entry;\n.card { color: red; }')

    expect(result.css).not.toContain('@master entry')
    expect(result.nativeCSS).toContain('.card')
})

test('resolves CSS-only preset package root to stylesheet entry', () => {
    const presetPackageJSONFile = resolve(repoRoot, 'packages/preset/package.json')
    const presetPackageJSON = JSON.parse(readFileSync(presetPackageJSONFile, 'utf8')) as {
        exports?: Record<string, unknown>
    }

    expect(presetPackageJSON.exports?.['.']).toEqual({
        style: './src/index.css',
        default: './src/index.css'
    })

    const entry = resolveMasterCSSPackageEntryFile(
        '@master/css-preset',
        fileURLToPath(import.meta.url),
        repoRoot
    )
    const expectedEntry = resolve(repoRoot, 'packages/preset/src/index.css')

    expect(entry).toBe(expectedEntry)
    expect(entry ? existsSync(entry) : false).toBe(true)
})
