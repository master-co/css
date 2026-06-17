import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { compileCSSPlanFile } from '@master/css-compiler'
import defaultPlanJSON from '@master/css-preset/default-plan.json' with { type: 'json' }
import type { MasterCSSPlan } from 'shared/master-css-plan'
import { render } from '../src'

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan
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
    const planSource = join(fixtureDirectory, 'plan.css')
    if (!existsSync(planSource)) return defaultPlan
    return compileCSSPlanFile(planSource, {
        basePlan: defaultPlan
    }).plan
}

describe.concurrent('server fixture CSS parity', () => {
    test.each(collectFixtureNames())('%s', (fixtureName) => {
        const fixtureDirectory = join(fixturesDirectory, fixtureName)
        const plan = loadFixturePlan(fixtureDirectory)
        const html = readFileSync(join(fixtureDirectory, 'template.html'), 'utf-8')
        const expectedCSS = readFileSync(join(fixtureDirectory, 'generated.css'), 'utf-8')

        expect(render(html, plan).css?.text).toBe(expectedCSS)
    })
})

test('renders native CSS declarations through css-tree fallback', () => {
    const html = '<div class="float:left field-sizing:content display:banana made-up:left"></div>'
    const result = render(html, defaultPlan)

    expect(result.css?.text).toContain('.float\\:left{float:left}')
    expect(result.css?.text).toContain('.field-sizing\\:content{field-sizing:content}')
    expect(result.css?.text).not.toContain('display\\:banana')
    expect(result.css?.text).not.toContain('made-up\\:left')
})
