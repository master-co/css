import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { compileCSSManifestFile } from '@master/css-compiler'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from 'shared/master-css-manifest'
import { render } from '../src'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
const __dirname = dirname(fileURLToPath(import.meta.url))
const fixturesDirectory = join(__dirname, 'fixtures')

function collectFixtureNames() {
    return readdirSync(fixturesDirectory)
        .filter((name) => {
            const directory = join(fixturesDirectory, name)
            return existsSync(join(directory, 'template.html'))
                && existsSync(join(directory, 'generated.css'))
        })
        .sort()
}

function loadFixturePlan(fixtureDirectory: string) {
    const planSource = join(fixtureDirectory, 'manifest.css')
    if (!existsSync(planSource)) return defaultManifest
    return compileCSSManifestFile(planSource, {
        baseManifest: defaultManifest
    }).manifest
}

describe.concurrent('server fixture CSS parity', () => {
    test.each(collectFixtureNames())('%s', (fixtureName) => {
        const fixtureDirectory = join(fixturesDirectory, fixtureName)
        const manifest = loadFixturePlan(fixtureDirectory)
        const html = readFileSync(join(fixtureDirectory, 'template.html'), 'utf-8')
        const expectedCSS = readFileSync(join(fixtureDirectory, 'generated.css'), 'utf-8')

        expect(render(html, manifest).css?.text).toBe(expectedCSS)
    })
})

test('renders native CSS declarations through css-tree fallback', () => {
    const html = '<div class="float:left field-sizing:content display:banana made-up:left"></div>'
    const result = render(html, defaultManifest)

    expect(result.css?.text).toContain('.float\\:left{float:left}')
    expect(result.css?.text).toContain('.field-sizing\\:content{field-sizing:content}')
    expect(result.css?.text).not.toContain('display\\:banana')
    expect(result.css?.text).not.toContain('made-up\\:left')
})
