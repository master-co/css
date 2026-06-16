import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { resolveMasterCSSBuildPlan } from '../src/style-plan'

let fixtureDir: string | undefined

function createFixtureDir() {
    fixtureDir = mkdtempSync(join(tmpdir(), 'master-css-next-style-plan-'))
    mkdirSync(join(fixtureDir, 'app'), { recursive: true })
    return fixtureDir
}

afterEach(() => {
    if (fixtureDir) {
        rmSync(fixtureDir, { recursive: true, force: true })
        fixtureDir = undefined
    }
})

describe('resolveMasterCSSBuildPlan', () => {
    it('resolves @compose entries against the loaded base plan while extracting native CSS', async () => {
        const root = createFixtureDir()
        const entry = join(root, 'app/globals.css')
        writeFileSync(entry, [
            '@import "@master/css";',
            '',
            '.hidden-card {',
            '    @compose hidden;',
            '}'
        ].join('\n'))

        const result = await resolveMasterCSSBuildPlan(root, ['hidden-card'])

        expect(result.styleSources).toEqual([entry])
        expect(result.nativeCSS).toContain('.hidden-card')
        expect(result.nativeCSS).toContain('display:none')
    })
})
