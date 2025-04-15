import { it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import InjectCSSRuntimePlugin from '../../src/plugins/inject-runtime'
import { runTransform } from '../plugin-test-helper'

const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/inject-runtime')
const ENTRY_ID = '/project/src/main.ts'
const CONFIG_ID = '/project/src/master.css.js'

// fixture name → isEntry
const entryCases = {
    'basic': true,
    'alt': true,
    'already-injected': true,
    'non-entry': false,
}

const plugin = InjectCSSRuntimePlugin({}, {
    entryId: ENTRY_ID,
    configId: CONFIG_ID,
})

const cases = fs.readdirSync(FIXTURE_DIR)
    .filter(file => file.endsWith('.ts'))
    .map(file => [file.replace(/\.ts$/, '') as keyof typeof entryCases, file] as const)

it.each(cases)(
    'InjectCSSRuntimePlugin fixture: %s',
    async (name, filename) => {
        const input = fs.readFileSync(path.join(FIXTURE_DIR, filename), 'utf-8')
        const id = entryCases[name as keyof typeof entryCases] ? ENTRY_ID : '/project/src/other.ts'
        const result = await runTransform(plugin, input, id)
        if (result === undefined) {
            expect(result).toBeUndefined()
        } else {
            expect(result.code).toMatchSnapshot()
        }
    }
)